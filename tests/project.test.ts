import { createProjectSchema, createInvestmentSchema } from "../src/backend/validations/project";
import { ProjectService } from "../src/services/ProjectService";
import { prisma } from "../src/lib/db";
import { ProjectStatus } from "@prisma/client";

// Mock database and AccountingService
jest.mock("../src/lib/db", () => ({
  prisma: {
    project: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn()
    },
    projectInvestment: {
      create: jest.fn()
    },
    member: {
      findUnique: jest.fn()
    },
    bankAccount: {
      findFirst: jest.fn(),
      update: jest.fn()
    },
    profitDistribution: {
      create: jest.fn()
    },
    $transaction: jest.fn((cb) => cb(prisma))
  }
}));

jest.mock("../src/services/AccountingService", () => ({
  AccountingService: {
    postJournalEntry: jest.fn().mockResolvedValue({ id: "mock-journal-entry-id" })
  }
}));

describe("Project Validation Layer (Zod)", () => {
  it("should validate create project payload", () => {
    const res = createProjectSchema.safeParse({
      name: "Land Purchase Project",
      location: "Savarn, Dhaka",
      targetCapital: 500000000 // 5 Million BDT in Paisa
    });
    expect(res.success).toBe(true);
  });

  it("should fail validation if target capital is not positive", () => {
    const res = createProjectSchema.safeParse({
      name: "Bad Project",
      location: "Unknown",
      targetCapital: -100
    });
    expect(res.success).toBe(false);
  });

  it("should validate investment recording schema", () => {
    const res = createInvestmentSchema.safeParse({
      projectId: "12345678-1234-1234-1234-1234567890ab",
      memberId: "12345678-1234-1234-1234-1234567890cd",
      amount: 1000000,
      paymentMode: "BANK"
    });
    expect(res.success).toBe(true);
  });
});

describe("ProjectService Business Logic", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createProject", () => {
    it("should successfully create a project in funding status", async () => {
      (prisma.project.create as jest.Mock).mockResolvedValue({
        id: "proj-1",
        name: "Project A",
        status: ProjectStatus.FUNDING
      });

      const res = await ProjectService.createProject({
        name: "Project A",
        location: "Dhaka",
        targetCapital: 1000000
      });

      expect(res.status).toBe(ProjectStatus.FUNDING);
      expect(prisma.project.create).toHaveBeenCalledWith({
        data: {
          name: "Project A",
          location: "Dhaka",
          targetCapital: 1000000,
          currentCapital: 0,
          status: ProjectStatus.FUNDING
        }
      });
    });
  });

  describe("recordInvestment", () => {
    it("should throw NotFoundError if project or member does not exist", async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        ProjectService.recordInvestment({
          projectId: "proj-invalid",
          memberId: "member-1",
          amount: 50000,
          paymentMode: "CASH"
        })
      ).rejects.toThrow("প্রজেক্ট খুঁজে পাওয়া যায়নি।");
    });

    it("should throw ValidationError if member status is SUSPENDED", async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        id: "proj-1",
        status: ProjectStatus.FUNDING
      });
      (prisma.member.findUnique as jest.Mock).mockResolvedValue({
        id: "member-1",
        status: "SUSPENDED",
        deletedAt: null
      });

      await expect(
        ProjectService.recordInvestment({
          projectId: "proj-1",
          memberId: "member-1",
          amount: 50000,
          paymentMode: "CASH"
        })
      ).rejects.toThrow("সদস্য অ্যাকাউন্টটি সাসপেন্ড রয়েছে। বিনিয়োগ করার অনুমতি নেই।");
    });

    it("should update project capital, bank balance, and post double-entry on investment", async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        id: "proj-1",
        name: "Apartment Build",
        status: ProjectStatus.FUNDING
      });
      (prisma.member.findUnique as jest.Mock).mockResolvedValue({
        id: "member-1",
        name: "Ahsan",
        status: "ACTIVE",
        deletedAt: null
      });
      (prisma.projectInvestment.create as jest.Mock).mockResolvedValue({
        id: "inv-1"
      });
      (prisma.bankAccount.findFirst as jest.Mock).mockResolvedValue({
        id: "cash-acc",
        name: "Cash on Hand",
        balance: 20000
      });

      const res = await ProjectService.recordInvestment({
        projectId: "proj-1",
        memberId: "member-1",
        amount: 100000, // 1000 BDT
        paymentMode: "CASH"
      });

      expect(res.id).toBe("inv-1");
      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: "proj-1" },
        data: { currentCapital: { increment: 100000 } }
      });
      expect(prisma.bankAccount.update).toHaveBeenCalledWith({
        where: { id: "cash-acc" },
        data: { balance: { increment: 100000 } }
      });

      const AccountingServiceMock = require("../src/services/AccountingService").AccountingService;
      expect(AccountingServiceMock.postJournalEntry).toHaveBeenCalledWith(
        prisma,
        expect.objectContaining({
          lines: [
            { accountCode: "1000", amount: 100000, type: "DEBIT" },
            { accountCode: "3000", amount: 100000, type: "CREDIT" }
          ]
        })
      );
    });
  });

  describe("ROI calculations and profit distribution", () => {
    it("should correctly compute proportional ratios on calculateROI", async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        id: "proj-1",
        name: "Project Pro",
        investments: [
          { memberId: "m1", amount: 300000, member: { memberCode: "MEM-01", name: "User 1" } }, // 3000 BDT (75%)
          { memberId: "m2", amount: 100000, member: { memberCode: "MEM-02", name: "User 2" } }  // 1000 BDT (25%)
        ]
      });

      const roi = await ProjectService.calculateROI("proj-1");
      expect(roi.totalCapitalBdt).toBe(4000); // 4000 BDT
      expect(roi.ratios[0].ratio).toBe(0.75);
      expect(roi.ratios[0].percentage).toBe(75);
      expect(roi.ratios[1].ratio).toBe(0.25);
      expect(roi.ratios[1].percentage).toBe(25);
    });

    it("should distribute profit and post proportional savings credits to members", async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        id: "proj-1",
        name: "Project Pro",
        investments: [
          { memberId: "m1", amount: 300000, member: { name: "User 1" } }, // 75%
          { memberId: "m2", amount: 100000, member: { name: "User 2" } }  // 25%
        ]
      });
      (prisma.profitDistribution.create as jest.Mock).mockResolvedValue({ id: "dist-1" });
      (prisma.bankAccount.findFirst as jest.Mock).mockResolvedValue({
        id: "cash-acc",
        name: "Cash on Hand",
        balance: 1000000
      });

      const dist = await ProjectService.distributeProjectProfit("proj-1", {
        totalProfit: 80000, // 800 BDT
        paymentMode: "CASH"
      });

      expect(dist.id).toBe("dist-1");
      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: "proj-1" },
        data: { status: ProjectStatus.COMPLETED }
      });

      const AccountingServiceMock = require("../src/services/AccountingService").AccountingService;
      // Proportional distributions: User 1 gets 75% * 80000 = 60000 Paisa. User 2 gets 25% * 80000 = 20000 Paisa.
      // FD transfer leg takes 7.5% * 80000 = 6000 Paisa.
      expect(AccountingServiceMock.postJournalEntry).toHaveBeenNthCalledWith(
        1,
        prisma,
        expect.objectContaining({
          lines: [
            { accountCode: "1030", amount: 6000, type: "DEBIT" },
            { accountCode: "1000", amount: 6000, type: "CREDIT" }
          ]
        })
      );
      expect(AccountingServiceMock.postJournalEntry).toHaveBeenNthCalledWith(
        2,
        prisma,
        expect.objectContaining({
          lines: [
            { accountCode: "4020", amount: 60000, type: "DEBIT" },
            { accountCode: "2000", amount: 60000, type: "CREDIT" }
          ]
        })
      );
      expect(AccountingServiceMock.postJournalEntry).toHaveBeenNthCalledWith(
        3,
        prisma,
        expect.objectContaining({
          lines: [
            { accountCode: "4020", amount: 20000, type: "DEBIT" },
            { accountCode: "2000", amount: 20000, type: "CREDIT" }
          ]
        })
      );
    });
  });
});
