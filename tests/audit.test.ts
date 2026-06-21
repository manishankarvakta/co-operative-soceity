import { AuditService } from "../src/services/AuditService";
import { DepositService } from "../src/services/DepositService";
import { MemberService } from "../src/services/MemberService";
import { ExpenseService } from "../src/services/ExpenseService";
import { BankService } from "../src/services/BankService";
import { prisma } from "../src/lib/db";
import { PaymentMode, DepositType, ExpenseStatus, TransactionType } from "@prisma/client";

jest.mock("../src/lib/db", () => ({
  prisma: {
    member: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn()
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    },
    nominee: {
      updateMany: jest.fn()
    },
    deposit: {
      create: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn()
    },
    depositItem: {
      create: jest.fn()
    },
    shareRecord: {
      create: jest.fn()
    },
    bankAccount: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn()
    },
    bankTransaction: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn()
    },
    expense: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn()
    },
    auditLog: {
      create: jest.fn()
    },
    notification: {
      create: jest.fn()
    },
    $transaction: jest.fn((input) => {
      if (typeof input === "function") {
        return input(prisma);
      }
      return Promise.all(input);
    })
  }
}));

jest.mock("../src/services/AccountingService", () => ({
  AccountingService: {
    postJournalEntry: jest.fn().mockResolvedValue({ id: "mock-journal-entry-id" })
  }
}));

jest.mock("../src/services/DashboardService", () => ({
  DashboardService: {
    invalidateCache: jest.fn().mockResolvedValue(undefined)
  }
}));

jest.mock("../src/services/NotificationService", () => ({
  NotificationService: {
    sendDepositReceipt: jest.fn().mockResolvedValue(undefined),
    sendPenaltyNotice: jest.fn().mockResolvedValue(undefined),
    sendSuspensionNotice: jest.fn().mockResolvedValue(undefined),
    sendApprovalNotice: jest.fn().mockResolvedValue(undefined)
  }
}));

describe("Audit System Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("AuditService Logger Basics", () => {
    it("should write audit entries, serialize data, and resolve fallback IP", async () => {
      const mockAuditRecord = { id: "log-1" };
      (prisma.auditLog.create as jest.Mock).mockResolvedValue(mockAuditRecord);

      const oldDataObj = { code: "100", details: { note: "test-old" } };
      const newDataObj = { code: "100", details: { note: "test-new" } };

      const result = await AuditService.log({
        userId: "user-uuid",
        action: "UPDATE",
        tableName: "Member",
        recordId: "m-uuid",
        oldData: oldDataObj,
        newData: newDataObj
      });

      expect(result).toEqual(mockAuditRecord);
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-uuid",
          action: "UPDATE",
          tableName: "Member",
          recordId: "m-uuid",
          oldData: oldDataObj,
          newData: newDataObj,
          ipAddress: "127.0.0.1",
          timestamp: expect.any(Date)
        })
      });
    });
  });

  describe("Service Integrations", () => {
    describe("Member Service Audits", () => {
      it("should log CREATE audit when registering a member", async () => {
        (prisma.member.findUnique as jest.Mock).mockResolvedValue(null); // uniqueness check
        (prisma.member.count as jest.Mock).mockResolvedValue(0);
        
        (prisma.user.create as jest.Mock).mockResolvedValue({ id: "user-uuid" });
        (prisma.member.create as jest.Mock).mockResolvedValue({
          id: "member-uuid",
          name: "Ratul",
          status: "ACTIVE"
        });

        await MemberService.createMember({
          name: "Ratul",
          phone: "01711111111",
          address: "Dhaka",
          joinDate: "2026-06-15",
          nominee: {
            name: "Nominee",
            relationship: "Brother",
            phone: "01722222222",
            address: "Dhaka",
            emergencyContact: "01733333333"
          }
        }, "actor-uuid");

        expect(prisma.auditLog.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              userId: "actor-uuid",
              action: "CREATE",
              tableName: "Member",
              recordId: "member-uuid"
            })
          })
        );
      });

      it("should log UPDATE audit when updating a member", async () => {
        const oldMember = { id: "m-1", name: "Ratul Old", status: "ACTIVE" };
        const newMember = { id: "m-1", name: "Ratul New", status: "ACTIVE" };

        (prisma.member.findUnique as jest.Mock).mockResolvedValue(oldMember);
        (prisma.member.update as jest.Mock).mockResolvedValue(newMember);

        await MemberService.updateMember("m-1", { name: "Ratul New" }, "actor-uuid");

        expect(prisma.auditLog.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              userId: "actor-uuid",
              action: "UPDATE",
              tableName: "Member",
              recordId: "m-1",
              oldData: oldMember,
              newData: newMember
            })
          })
        );
      });

      it("should log DELETE audit when soft-deleting a member", async () => {
        const member = { id: "m-1", name: "Ratul Deleted", status: "ACTIVE", userId: "u-1" };
        (prisma.member.findUnique as jest.Mock).mockResolvedValue(member);

        await MemberService.deleteMember("m-1", "actor-uuid");

        expect(prisma.auditLog.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              userId: "actor-uuid",
              action: "DELETE",
              tableName: "Member",
              recordId: "m-1",
              oldData: member,
              newData: expect.objectContaining({ deletedAt: expect.any(String) })
            })
          })
        );
      });
    });

    describe("Deposit Service Audits", () => {
      it("should log CREATE audit when making deposits", async () => {
        (prisma.member.findUnique as jest.Mock).mockResolvedValue({
          id: "m-1",
          name: "Ratul",
          memberCode: "SOM-001"
        });
        (prisma.deposit.count as jest.Mock).mockResolvedValue(0);
        (prisma.deposit.create as jest.Mock).mockResolvedValue({ id: "deposit-uuid" });
        (prisma.bankAccount.findFirst as jest.Mock).mockResolvedValue({ id: "cash-acc", balance: 5000 });

        await DepositService.createBulkDeposit("officer-uuid", {
          memberId: "m-1",
          paymentMode: PaymentMode.CASH,
          items: [{ type: DepositType.WEEKLY_SUBSCRIPTION, amount: 50000, periodDetails: "W-25" }]
        });

        expect(prisma.auditLog.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              userId: "officer-uuid",
              action: "CREATE",
              tableName: "Deposit",
              recordId: "deposit-uuid"
            })
          })
        );
      });
    });

    describe("Expense Service Audits", () => {
      it("should log CREATE audit when logging expenses", async () => {
        (prisma.bankAccount.findMany as jest.Mock).mockResolvedValue([{ id: "acc-1", balance: 1000000 }]);
        (prisma.expense.create as jest.Mock).mockResolvedValue({ id: "exp-uuid", amount: 50000 });

        await ExpenseService.createExpense("officer-uuid", {
          category: "Transport",
          date: "2026-06-15",
          amount: 50000,
          paymentMode: "CASH",
          location: "Dhaka"
        });

        expect(prisma.auditLog.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              userId: "officer-uuid",
              action: "CREATE",
              tableName: "Expense",
              recordId: "exp-uuid"
            })
          })
        );
      });

      it("should log APPROVE audit upon admin approval", async () => {
        const pendingExpense = { id: "exp-1", category: "Office Rent", amount: 100000, status: "PENDING", location: "[CASH]" };
        const approvedExpense = { id: "exp-1", category: "Office Rent", amount: 100000, status: "APPROVED" };

        (prisma.expense.findUnique as jest.Mock).mockResolvedValue(pendingExpense);
        (prisma.bankAccount.findMany as jest.Mock).mockResolvedValue([{ id: "cash-acc", name: "Cash on Hand", balance: 5000000 }]);
        (prisma.bankAccount.findFirst as jest.Mock).mockResolvedValue({ id: "cash-acc", balance: 5000000 });
        (prisma.expense.update as jest.Mock).mockResolvedValue(approvedExpense);

        await ExpenseService.approveExpense("admin-uuid", "exp-1");

        expect(prisma.auditLog.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              userId: "admin-uuid",
              action: "APPROVE",
              tableName: "Expense",
              recordId: "exp-1",
              oldData: pendingExpense,
              newData: approvedExpense
            })
          })
        );
      });

      it("should log REJECT audit upon admin rejection", async () => {
        const pendingExpense = { id: "exp-1", category: "Office Rent", amount: 100000, status: "PENDING" };
        const rejectedExpense = { id: "exp-1", category: "Office Rent", amount: 100000, status: "REJECTED" };

        (prisma.expense.findUnique as jest.Mock).mockResolvedValue(pendingExpense);
        (prisma.expense.update as jest.Mock).mockResolvedValue(rejectedExpense);

        await ExpenseService.rejectExpense("admin-uuid", "exp-1");

        expect(prisma.auditLog.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              userId: "admin-uuid",
              action: "REJECT",
              tableName: "Expense",
              recordId: "exp-1",
              oldData: pendingExpense,
              newData: rejectedExpense
            })
          })
        );
      });
    });

    describe("Bank Service Audits", () => {
      it("should log CREATE audit when creating account", async () => {
        (prisma.bankAccount.findUnique as jest.Mock).mockResolvedValue(null);
        (prisma.bankAccount.create as jest.Mock).mockResolvedValue({ id: "acc-uuid", name: "City Bank", balance: 0 });

        await BankService.createAccount({
          name: "City Bank",
          accountNumber: "1234567890",
          initialBalance: 0
        }, "actor-uuid");

        expect(prisma.auditLog.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              userId: "actor-uuid",
              action: "CREATE",
              tableName: "BankAccount",
              recordId: "acc-uuid"
            })
          })
        );
      });

      it("should log APPROVE audit on joint signatures", async () => {
        const pendingTx = {
          id: "tx-1",
          amount: 50000,
          type: "CREDIT",
          presidentApproved: true,
          secretaryApproved: true,
          treasurerApproved: false,
          isApproved: false,
          bankAccountId: "acc-1",
          bankAccount: { name: "City Bank", balance: 100000 }
        };

        const updatedTx = {
          id: "tx-1",
          amount: 50000,
          type: "CREDIT",
          presidentApproved: true,
          secretaryApproved: true,
          treasurerApproved: true,
          isApproved: true,
          bankAccountId: "acc-1",
          bankAccount: { name: "City Bank", balance: 150000 }
        };

        (prisma.bankTransaction.findUnique as jest.Mock).mockResolvedValue(pendingTx);
        (prisma.bankAccount.update as jest.Mock).mockResolvedValue({ id: "acc-1" });
        (prisma.bankTransaction.update as jest.Mock).mockResolvedValue(updatedTx);

        await BankService.signTransaction("treasurer-uuid", "tx-1", "TREASURER");

        expect(prisma.auditLog.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              userId: "treasurer-uuid",
              action: "APPROVE",
              tableName: "BankTransaction",
              recordId: "tx-1",
              oldData: pendingTx,
              newData: updatedTx
            })
          })
        );
      });
    });
  });
});
