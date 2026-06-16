import { MemberService } from "../src/services/MemberService";
import { ShareService } from "../src/services/ShareService";
import { SchedulerService } from "../src/services/SchedulerService";
import { DepositService } from "../src/services/DepositService";
import { ProfitDistributionService } from "../src/services/ProfitDistributionService";
import { prisma } from "../src/lib/db";
import { redis } from "../src/lib/redis";

// Mock prisma and redis
jest.mock("../src/lib/db", () => {
  const mockPrisma: any = {
    member: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn()
    },
    user: {
      create: jest.fn(),
      findFirst: jest.fn()
    },
    nominee: {
      create: jest.fn(),
      updateMany: jest.fn()
    },
    deposit: {
      create: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn()
    },
    depositItem: {
      create: jest.fn()
    },
    shareRecord: {
      create: jest.fn(),
      findMany: jest.fn()
    },
    bankAccount: {
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn()
    },
    profitDistribution: {
      create: jest.fn()
    },
    journalEntry: {
      create: jest.fn().mockResolvedValue({ id: "mock-journal-entry-id" })
    },
    journalLine: {
      create: jest.fn().mockResolvedValue({ id: "mock-journal-line-id" })
    },
    account: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    },
    $transaction: jest.fn((cb) => {
      if (typeof cb === "function") return cb(mockPrisma);
      return Promise.all(cb);
    })
  };
  return { prisma: mockPrisma };
});

jest.mock("../src/lib/redis", () => ({
  redis: {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn()
  }
}));

// Mock Audit, Notification, Dashboard, FiscalYear services to avoid side effects
jest.mock("../src/services/AuditService", () => ({
  AuditService: {
    log: jest.fn().mockResolvedValue({ id: "audit-1" })
  }
}));

jest.mock("../src/services/NotificationService", () => ({
  NotificationService: {
    sendSuspensionNotice: jest.fn().mockResolvedValue({ success: true }),
    sendDepositReceipt: jest.fn().mockResolvedValue({ success: true })
  }
}));

jest.mock("../src/services/DashboardService", () => ({
  DashboardService: {
    invalidateCache: jest.fn().mockResolvedValue(true)
  }
}));

jest.mock("../src/services/FiscalYearService", () => ({
  FiscalYearService: {
    validateDate: jest.fn().mockResolvedValue(true)
  }
}));

describe("ERP Business Logic Automation Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("1. Admission Fee Automation", () => {
    it("should automatically post 5000 BDT admission fee deposit and journal entry on member creation", async () => {
      // Setup mock returns
      (prisma.member.findUnique as jest.Mock).mockImplementation((args) => {
        if (args.where.id === "member-123") {
          return Promise.resolve({
            id: "member-123",
            memberCode: "SOM-2026-0011",
            name: "Test Member",
            status: "ACTIVE"
          });
        }
        return Promise.resolve(null);
      });
      (prisma.member.count as jest.Mock).mockResolvedValue(10); // Code generator count
      (prisma.user.create as jest.Mock).mockResolvedValue({ id: "user-123", email: "som-2026-0011@somity.com" });
      (prisma.member.create as jest.Mock).mockResolvedValue({
        id: "member-123",
        memberCode: "SOM-2026-0011",
        name: "Test Member",
        status: "ACTIVE"
      });

      // Mocks for Deposit leg
      (prisma.deposit.count as jest.Mock).mockResolvedValue(0);
      (prisma.deposit.create as jest.Mock).mockResolvedValue({ id: "deposit-456" });
      (prisma.bankAccount.findFirst as jest.Mock).mockResolvedValue({
        id: "cash-account-id",
        name: "Cash on Hand",
        balance: 10000
      });
      (prisma.account.findUnique as jest.Mock).mockResolvedValue({
        id: "acc-id",
        code: "4000",
        type: "REVENUE"
      });

      const member = await MemberService.createMember({
        name: "Test Member",
        phone: "01700000000",
        address: "Dhaka",
        joinDate: "2026-06-16",
        nominee: {
          name: "Test Nominee",
          relationship: "Brother",
          phone: "01800000000",
          address: "Dhaka",
          emergencyContact: "01800000000"
        }
      }, "officer-admin");

      expect(member.id).toBe("member-123");

      // Verify automatic Admission Fee deposit item was created
      expect(prisma.depositItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            depositId: "deposit-456",
            type: "ADMISSION_FEE",
            amount: 500000, // 5000 BDT in Paisa
            sharesCount: 0
          })
        })
      );

      // Verify Cash account updated
      expect(prisma.bankAccount.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "cash-account-id" },
          data: { balance: { increment: 500000 } }
        })
      );

      // Verify double-entry journal logs were posted
      const journalCreate = prisma.journalEntry.create as jest.Mock;
      expect(journalCreate).toHaveBeenCalled();
    });
  });

  describe("2. Delinquency Automation (CRON)", () => {
    it("should mark active member as SUSPENDED if they have no deposits in last 12 weeks", async () => {
      // Mock active members list
      (prisma.member.findMany as jest.Mock).mockResolvedValue([
        { id: "delinquent-1", name: "Delinquent Member", email: "delinquent@somity.com", status: "ACTIVE", userId: "u-1" },
        { id: "active-1", name: "Active Member", email: "active@somity.com", status: "ACTIVE", userId: "u-2" }
      ]);

      // Mock deposit checks
      (prisma.deposit.findFirst as jest.Mock).mockImplementation((args) => {
        if (args.where.memberId === "delinquent-1") {
          return Promise.resolve(null); // No deposit in last 12 weeks
        }
        return Promise.resolve({ id: "deposit-ok" }); // Has deposit
      });

      // Mock redis lock set
      (redis.set as jest.Mock).mockResolvedValue("OK");

      const suspendedIds = await SchedulerService.triggerWeeklyDelinquency();

      expect(suspendedIds).toContain("delinquent-1");
      expect(suspendedIds).not.toContain("active-1");

      // Verify database update to SUSPENDED status
      expect(prisma.member.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "delinquent-1" },
          data: { status: "SUSPENDED" }
        })
      );
    });
  });

  describe("3. Death Share Transfer", () => {
    it("should transfer shares to nominee, auto-creating nominee member profile if not existing", async () => {
      (prisma.member.findUnique as jest.Mock).mockImplementation((args) => {
        if (args.where.id === "deceased-id") {
          return Promise.resolve({
            id: "deceased-id",
            memberCode: "SOM-2025-0001",
            name: "Deceased Member",
            status: "ACTIVE",
            shares: [
              { count: 10, createdAt: new Date() },
              { count: 5, createdAt: new Date() }
            ],
            nominee: {
              name: "Nominee Name",
              phone: "01900000000",
              address: "Nominee Address",
              relationship: "Son"
            }
          });
        }
        return Promise.resolve(null);
      });

      // Nominee not registered as a member yet (returns null)
      (prisma.member.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.member.count as jest.Mock).mockResolvedValue(1); // For nominee code generator
      (prisma.user.create as jest.Mock).mockResolvedValue({ id: "nominee-user-id" });
      (prisma.member.create as jest.Mock).mockResolvedValue({
        id: "nominee-member-id",
        memberCode: "SOM-2026-0002",
        name: "Nominee Name",
        status: "ACTIVE"
      });

      // Mock standard chart of accounts validation
      (prisma.account.findUnique as jest.Mock).mockResolvedValue({
        id: "acc-3000",
        code: "3000",
        type: "EQUITY"
      });

      const result = await ShareService.transferSharesOnDeath({
        deceasedMemberId: "deceased-id",
        recipientType: "NOMINEE",
        actorId: "officer-admin"
      });

      expect(result.success).toBe(true);
      expect(result.transferredShares).toBe(15);
      expect(result.recipientMemberId).toBe("nominee-member-id");

      // Verify deceased member marked INACTIVE
      expect(prisma.member.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "deceased-id" },
          data: { status: "INACTIVE" }
        })
      );

      // Verify negative share record created for deceased and positive for nominee
      expect(prisma.shareRecord.create).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          data: expect.objectContaining({
            memberId: "deceased-id",
            count: -15
          })
        })
      );
      expect(prisma.shareRecord.create).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          data: expect.objectContaining({
            memberId: "nominee-member-id",
            count: 15
          })
        })
      );

      // Verify double-entry journal entry debits and credits 3000
      expect(prisma.journalLine.create).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          data: expect.objectContaining({
            accountId: "acc-3000",
            amount: 15 * 1000 * 100, // 15 shares * 1000 BDT * 100 Paisa
            type: "DEBIT"
          })
        })
      );
      expect(prisma.journalLine.create).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          data: expect.objectContaining({
            accountId: "acc-3000",
            amount: 15 * 1000 * 100,
            type: "CREDIT"
          })
        })
      );
    });
  });

  describe("4. Profit Distribution", () => {
    it("should process general distribution splits and post double-entry logs", async () => {
      // Mock bank accounts
      (prisma.bankAccount.findFirst as jest.Mock).mockImplementation((args) => {
        if (args.where.name === "Cash on Hand") {
          return Promise.resolve({
            id: "cash-box-acc",
            name: "Cash on Hand",
            balance: 500000
          });
        }
        if (args.where.name === "Fixed Deposit Reserve") {
          return Promise.resolve({
            id: "fd-reserve-acc",
            name: "Fixed Deposit Reserve",
            balance: 100000
          });
        }
        return Promise.resolve(null);
      });

      (prisma.profitDistribution.create as jest.Mock).mockResolvedValue({
        id: "dist-id",
        totalProfit: 200000
      });

      (prisma.account.findUnique as jest.Mock).mockResolvedValue({
        id: "acc-id",
        code: "4020",
        type: "REVENUE"
      });

      const res = await ProfitDistributionService.executeGeneralDistribution("admin-1", {
        amount: 200000, // 2000 BDT in Paisa
        paymentMode: "CASH"
      });

      expect(res.id).toBe("dist-id");

      // Verify bank update
      expect(prisma.bankAccount.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "cash-box-acc" },
          data: { balance: { decrement: 15000 } } // 7.5% of 200000 = 15000 Paisa
        })
      );

      // Verify journal posts
      expect(prisma.journalEntry.create).toHaveBeenCalledTimes(2);
    });
  });
});
