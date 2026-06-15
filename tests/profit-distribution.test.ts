import { createProfitDistributionSchema } from "../src/backend/validations/accounting";
import { ProfitDistributionService } from "../src/services/ProfitDistributionService";
import { prisma } from "../src/lib/db";

// Mock database and AccountingService
jest.mock("../src/lib/db", () => ({
  prisma: {
    bankAccount: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn()
    },
    profitDistribution: {
      create: jest.fn(),
      findMany: jest.fn()
    },
    $transaction: jest.fn((cb) => cb(prisma))
  }
}));

jest.mock("../src/services/AccountingService", () => ({
  AccountingService: {
    postJournalEntry: jest.fn().mockResolvedValue({ id: "mock-journal-entry-id" })
  }
}));

describe("Profit Distribution Validation (Zod)", () => {
  it("should validate a correct profit distribution payload", () => {
    const valid = createProfitDistributionSchema.safeParse({
      amount: 1000000, // 10,000 BDT in Paisa
      paymentMode: "BANK"
    });
    expect(valid.success).toBe(true);
  });

  it("should fail validation if amount is not positive", () => {
    const invalid = createProfitDistributionSchema.safeParse({
      amount: -100,
      paymentMode: "CASH"
    });
    expect(invalid.success).toBe(false);
  });
});

describe("ProfitDistributionService Logic", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("calculateSplits", () => {
    it("should compute accurate splits and adjust sportsFund to match exact sum", () => {
      const splits = ProfitDistributionService.calculateSplits(100003); // 1000.03 BDT in Paisa
      
      // devFund = 100003 * 0.95 = 95002.85 -> Math.round -> 95003
      // destituteFund = 100003 * 0.025 = 2500.075 -> Math.round -> 2500
      // sportsFund = 100003 - 95003 - 2500 = 2500
      // Total sum = 95003 + 2500 + 2500 = 100003 (perfect!)
      
      expect(splits.devFund).toBe(95003);
      expect(splits.destituteFund).toBe(2500);
      expect(splits.sportsFund).toBe(2500);
      expect(splits.devFund + splits.destituteFund + splits.sportsFund).toBe(100003);
      expect(splits.fixedDeposit).toBe(7500); // 7.5% of 100003 = 7500.225 -> 7500
    });
  });

  describe("executeGeneralDistribution", () => {
    it("should throw ValidationError if source bank/cash balance is less than Fixed Deposit amount", async () => {
      (prisma.bankAccount.findFirst as jest.Mock).mockResolvedValue({
        id: "cash-acc",
        name: "Cash on Hand",
        balance: 5000 // Only 50 BDT, but 7.5% of 100,000 is 7,500 Paisa (75 BDT)
      });

      await expect(
        ProfitDistributionService.executeGeneralDistribution("admin-1", {
          amount: 100000,
          paymentMode: "CASH"
        })
      ).rejects.toThrow("এফডি রিজার্ভের জন্য পর্যাপ্ত ব্যালেন্স নেই।");
    });

    it("should update bank accounts and post double-entry logs on execution", async () => {
      // Mock source bank account
      (prisma.bankAccount.findFirst as jest.Mock).mockImplementation((args: any) => {
        if (args.where.name === "Cash on Hand") {
          return Promise.resolve({
            id: "cash-acc",
            name: "Cash on Hand",
            balance: 500000
          });
        }
        if (args.where.name === "Fixed Deposit Reserve") {
          return Promise.resolve({
            id: "fd-acc",
            name: "Fixed Deposit Reserve",
            balance: 100000
          });
        }
        return Promise.resolve(null);
      });

      (prisma.profitDistribution.create as jest.Mock).mockResolvedValue({
        id: "dist-123",
        projectId: null,
        totalProfit: 200000
      });

      const res = await ProfitDistributionService.executeGeneralDistribution("admin-1", {
        amount: 200000, // 2000 BDT in Paisa
        paymentMode: "CASH"
      });

      expect(res.id).toBe("dist-123");

      // Verify balance deduction on cash box
      expect(prisma.bankAccount.update).toHaveBeenNthCalledWith(1, {
        where: { id: "cash-acc" },
        data: { balance: { decrement: 15000 } } // 7.5% of 200000 = 15000 Paisa
      });

      // Verify Fixed Deposit balance increment
      expect(prisma.bankAccount.update).toHaveBeenNthCalledWith(2, {
        where: { id: "fd-acc" },
        data: { balance: { increment: 15000 } }
      });

      // Verify double-entry posting was called twice
      const AccountingServiceMock = require("../src/services/AccountingService").AccountingService;
      expect(AccountingServiceMock.postJournalEntry).toHaveBeenCalledTimes(2);

      // Verify first posting: Profit Distribution
      expect(AccountingServiceMock.postJournalEntry).toHaveBeenNthCalledWith(
        1,
        prisma,
        expect.objectContaining({
          lines: [
            { accountCode: "4020", amount: 200000, type: "DEBIT" }, // Income Account Debited
            { accountCode: "3010", amount: 190000, type: "CREDIT" }, // Biz Dev Fund (95%) Credited
            { accountCode: "3020", amount: 5000, type: "CREDIT" }, // Poor Fund (2.5%) Credited
            { accountCode: "3030", amount: 5000, type: "CREDIT" } // Sports Fund (2.5%) Credited
          ]
        })
      );

      // Verify second posting: FD Reserve Transfer
      expect(AccountingServiceMock.postJournalEntry).toHaveBeenNthCalledWith(
        2,
        prisma,
        expect.objectContaining({
          lines: [
            { accountCode: "1030", amount: 15000, type: "DEBIT" }, // FD Asset (1030) Debited
            { accountCode: "1000", amount: 15000, type: "CREDIT" } // Cash Asset (1000) Credited
          ]
        })
      );
    });
  });
});
