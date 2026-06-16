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
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    journalLine: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    fiscalYear: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn()
    },
    $transaction: jest.fn((cb) => {
      if (typeof cb === "function") return cb(prisma);
      return Promise.all(cb);
    })
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
    beforeEach(() => {
      // Mock active fiscal year (July 1, 2025 - June 30, 2026)
      (prisma.fiscalYear.findFirst as jest.Mock).mockResolvedValue({
        id: "fy-2025",
        name: "FY 2025-2026",
        startDate: new Date("2025-07-01T00:00:00.000Z"),
        endDate: new Date("2026-06-30T23:59:59.999Z"),
        isActive: true
      });
    });

    it("should throw ValidationError if debits do not equal credits", async () => {
      await expect(
        AccountingService.postJournalEntry(prisma, {
          description: "Unbalanced",
          date: "2026-06-15",
          lines: [
            { accountCode: "1000", amount: 10000, type: "DEBIT" },
            { accountCode: "3000", amount: 9000, type: "CREDIT" }
          ]
        })
      ).rejects.toThrow("দ্বৈত দাখিলা নীতি লঙ্ঘন");
    });

    it("should throw ValidationError if transaction date is outside active fiscal year", async () => {
      await expect(
        AccountingService.postJournalEntry(prisma, {
          description: "Out of Period",
          date: "2027-01-01",
          lines: [
            { accountCode: "1000", amount: 5000, type: "DEBIT" },
            { accountCode: "3000", amount: 5000, type: "CREDIT" }
          ]
        })
      ).rejects.toThrow("সক্রিয় অর্থবছর");
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

  describe("reverseJournalEntry", () => {
    beforeEach(() => {
      (prisma.fiscalYear.findFirst as jest.Mock).mockResolvedValue({
        id: "fy-2025",
        name: "FY 2025-2026",
        startDate: new Date("2025-07-01T00:00:00.000Z"),
        endDate: new Date("2026-06-30T23:59:59.999Z"),
        isActive: true
      });
    });

    it("should successfully reverse an existing journal entry by swapping debits and credits", async () => {
      const originalEntry = {
        id: "orig-123",
        reference: "VOUCHER-99",
        description: "Original entry",
        date: new Date("2026-06-15"),
        lines: [
          { account: { code: "1000" }, amount: 15000, type: "DEBIT" },
          { account: { code: "3000" }, amount: 15000, type: "CREDIT" }
        ]
      };

      (prisma.journalEntry.findUnique as jest.Mock).mockResolvedValue(originalEntry);
      (prisma.journalEntry.create as jest.Mock).mockResolvedValue({ id: "rev-entry-1" });
      (prisma.account.findUnique as jest.Mock).mockImplementation((args: any) => {
        if (args.where.code === "1000") {
          return Promise.resolve({ id: "acc-cash", code: "1000", type: AccountType.ASSET, balance: 10000 });
        }
        if (args.where.code === "3000") {
          return Promise.resolve({ id: "acc-equity", code: "3000", type: AccountType.EQUITY, balance: 50000 });
        }
        return Promise.resolve(null);
      });

      const reversed = await AccountingService.reverseJournalEntry(prisma, "orig-123");

      expect(reversed.id).toBe("rev-entry-1");
      expect(prisma.journalLine.create).toHaveBeenCalledTimes(2);

      // Verify the lines are created with reversed types
      // The original Cash had DEBIT, so reversed should be CREDIT
      // The original Equity had CREDIT, so reversed should be DEBIT
      expect(prisma.journalLine.create).toHaveBeenNthCalledWith(1, expect.objectContaining({
        data: expect.objectContaining({
          amount: 15000,
          type: "CREDIT"
        })
      }));
      expect(prisma.journalLine.create).toHaveBeenNthCalledWith(2, expect.objectContaining({
        data: expect.objectContaining({
          amount: 15000,
          type: "DEBIT"
        })
      }));
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
