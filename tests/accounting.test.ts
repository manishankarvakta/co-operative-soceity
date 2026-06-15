import { createAccountSchema, createJournalEntrySchema } from "../src/backend/validations/accounting";
import { AccountingService } from "../src/services/AccountingService";
import { prisma } from "../src/lib/db";
import { AccountType } from "@prisma/client";

// Mock database execution
jest.mock("../src/lib/db", () => ({
  prisma: {
    account: {
      count: jest.fn(),
      createMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn()
    },
    journalEntry: {
      create: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn()
    },
    journalLine: {
      create: jest.fn()
    },
    $transaction: jest.fn((cb) => cb(prisma))
  }
}));

describe("Accounting Validation Layer (Zod)", () => {
  it("should validate create account schema", () => {
    const res = createAccountSchema.safeParse({
      code: "1050",
      name: "Office Equipment",
      type: "ASSET"
    });
    expect(res.success).toBe(true);
  });

  it("should fail validation if code is non-numeric", () => {
    const res = createAccountSchema.safeParse({
      code: "ACC-01",
      name: "Equipment",
      type: "ASSET"
    });
    expect(res.success).toBe(false);
  });

  it("should validate a balanced journal entry schema", () => {
    const res = createJournalEntrySchema.safeParse({
      description: "Test Entry",
      date: "2026-06-15",
      lines: [
        { accountCode: "1000", amount: 5000, type: "DEBIT" },
        { accountCode: "3000", amount: 5000, type: "CREDIT" }
      ]
    });
    expect(res.success).toBe(true);
  });

  it("should fail validation if there are fewer than 2 lines", () => {
    const res = createJournalEntrySchema.safeParse({
      description: "Test Entry",
      date: "2026-06-15",
      lines: [
        { accountCode: "1000", amount: 5000, type: "DEBIT" }
      ]
    });
    expect(res.success).toBe(false);
  });
});

describe("AccountingService Double-Entry Logic", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("postJournalEntry", () => {
    it("should throw ValidationError if debits do not equal credits", async () => {
      await expect(
        AccountingService.postJournalEntry(prisma, {
          description: "Unbalanced",
          date: new Date(),
          lines: [
            { accountCode: "1000", amount: 10000, type: "DEBIT" },
            { accountCode: "3000", amount: 9000, type: "CREDIT" }
          ]
        })
      ).rejects.toThrow("দ্বৈত দাখিলা নীতি লঙ্ঘন");
    });

    it("should successfully post balanced journal entry and adjust account balances correctly", async () => {
      (prisma.account.count as jest.Mock).mockResolvedValue(12); // Accounts initialized
      (prisma.journalEntry.create as jest.Mock).mockResolvedValue({ id: "entry-1" });

      // Mock finding accounts
      (prisma.account.findUnique as jest.Mock).mockImplementation((args: any) => {
        if (args.where.code === "1000") {
          return Promise.resolve({ id: "acc-cash", code: "1000", type: AccountType.ASSET, balance: 10000 });
        }
        if (args.where.code === "3000") {
          return Promise.resolve({ id: "acc-equity", code: "3000", type: AccountType.EQUITY, balance: 50000 });
        }
        return Promise.resolve(null);
      });

      const entry = await AccountingService.postJournalEntry(prisma, {
        reference: "VOUCHER-01",
        description: "Capital investment",
        date: "2026-06-15",
        lines: [
          { accountCode: "1000", amount: 20000, type: "DEBIT" }, // DEBIT ASSET increases balance by 20000
          { accountCode: "3000", amount: 20000, type: "CREDIT" } // CREDIT EQUITY increases balance by 20000
        ]
      });

      expect(entry.id).toBe("entry-1");
      expect(prisma.journalLine.create).toHaveBeenCalledTimes(2);

      // Verify balance updates
      expect(prisma.account.update).toHaveBeenNthCalledWith(1, {
        where: { id: "acc-cash" },
        data: { balance: { increment: 20000 } }
      });
      expect(prisma.account.update).toHaveBeenNthCalledWith(2, {
        where: { id: "acc-equity" },
        data: { balance: { increment: 20000 } }
      });
    });
  });

  describe("financial reports compilation", () => {
    it("should compile trial balance accurately", async () => {
      (prisma.account.count as jest.Mock).mockResolvedValue(1);
      (prisma.account.findMany as jest.Mock).mockResolvedValue([
        { code: "1000", name: "Cash", type: AccountType.ASSET, balance: 30000 },
        { code: "3000", name: "Share Capital", type: AccountType.EQUITY, balance: 30000 }
      ]);

      const tb = await AccountingService.getTrialBalance();
      expect(tb.totals.totalDebit).toBe(300); // 30000 Paisa = 300 BDT
      expect(tb.totals.totalCredit).toBe(300);
      expect(tb.rows[0].debit).toBe(300);
      expect(tb.rows[1].credit).toBe(300);
    });

    it("should compile profit and loss accurately", async () => {
      (prisma.account.count as jest.Mock).mockResolvedValue(1);
      (prisma.account.findMany as jest.Mock).mockResolvedValue([
        { code: "4000", name: "Admission Income", type: AccountType.REVENUE, balance: 50000 }, // 500 BDT
        { code: "5000", name: "Rent", type: AccountType.EXPENSE, balance: 20000 } // 200 BDT
      ]);

      const pl = await AccountingService.getProfitLoss();
      expect(pl.totals.totalRevenue).toBe(500);
      expect(pl.totals.totalExpenses).toBe(200);
      expect(pl.totals.netProfit).toBe(300);
    });
  });
});
