import { createExpenseSchema } from "../src/backend/validations/expense";
import { ExpenseService } from "../src/services/ExpenseService";
import { prisma } from "../src/lib/db";
import { ExpenseStatus } from "@prisma/client";

// Mock database and AccountingService
jest.mock("../src/lib/db", () => ({
  prisma: {
    expense: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn()
    },
    bankAccount: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn()
    },
    $transaction: jest.fn((cb) => cb(prisma))
  }
}));

jest.mock("../src/services/AccountingService", () => ({
  AccountingService: {
    postJournalEntry: jest.fn().mockResolvedValue({ id: "mock-journal-entry-id" })
  }
}));

describe("Expense Creation Validation (Zod)", () => {
  it("should validate a correct expense payload", () => {
    const valid = createExpenseSchema.safeParse({
      category: "Transport",
      date: "2026-06-15",
      amount: 150000, // 1500 BDT in Paisa
      paymentMode: "CASH",
      location: "Office commute",
      projectName: "ERP Development"
    });
    expect(valid.success).toBe(true);
  });

  it("should fail validation if amount is negative or non-integer", () => {
    const invalid = createExpenseSchema.safeParse({
      category: "Rent",
      date: "2026-06-15",
      amount: -100,
      paymentMode: "BANK"
    });
    expect(invalid.success).toBe(false);
  });
});

describe("ExpenseService Business Logic", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createExpense", () => {
    it("should throw ValidationError if combined balance is less than expense amount", async () => {
      (prisma.bankAccount.findMany as jest.Mock).mockResolvedValue([
        { id: "acc-1", balance: 50000, deletedAt: null },
        { id: "acc-2", balance: 30000, deletedAt: null }
      ]); // Combined balance = 80000 Paisa (800 BDT)

      await expect(
        ExpenseService.createExpense("officer-1", {
          category: "Office Rent",
          date: "2026-06-15",
          amount: 100000, // 1000 BDT in Paisa
          paymentMode: "CASH",
          location: "Dhaka"
        })
      ).rejects.toThrow("পর্যাপ্ত ব্যালেন্স নেই।");
    });

    it("should successfully log pending expense if combined balance is sufficient", async () => {
      (prisma.bankAccount.findMany as jest.Mock).mockResolvedValue([
        { id: "acc-1", balance: 100000, deletedAt: null }
      ]);
      (prisma.expense.create as jest.Mock).mockResolvedValue({
        id: "exp-1",
        category: "Rent",
        amount: 50000,
        status: ExpenseStatus.PENDING
      });

      const result = await ExpenseService.createExpense("officer-1", {
        category: "Rent",
        date: "2026-06-15",
        amount: 50000,
        paymentMode: "CASH",
        location: "Mirpur office"
      });

      expect(result.id).toBe("exp-1");
      expect(prisma.expense.create).toHaveBeenCalledWith({
        data: {
          category: "Rent",
          date: new Date("2026-06-15"),
          amount: 50000,
          location: "[CASH] Mirpur office",
          loggedById: "officer-1",
          status: ExpenseStatus.PENDING
        }
      });
    });
  });

  describe("approveExpense", () => {
    it("should throw NotFoundError if expense not found", async () => {
      (prisma.expense.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        ExpenseService.approveExpense("admin-1", "exp-invalid")
      ).rejects.toThrow("খরচ বিবরণী খুঁজে পাওয়া যায়নি।");
    });

    it("should throw ValidationError if expense is already approved or rejected", async () => {
      (prisma.expense.findUnique as jest.Mock).mockResolvedValue({
        id: "exp-1",
        status: ExpenseStatus.APPROVED
      });

      await expect(
        ExpenseService.approveExpense("admin-1", "exp-1")
      ).rejects.toThrow("শুধুমাত্র পেন্ডিং খরচ অনুমোদন করা সম্ভব।");
    });

    it("should throw ValidationError if combined balance is insufficient during approval", async () => {
      (prisma.expense.findUnique as jest.Mock).mockResolvedValue({
        id: "exp-1",
        amount: 100000,
        status: ExpenseStatus.PENDING,
        location: "[CASH] Rent"
      });
      (prisma.bankAccount.findMany as jest.Mock).mockResolvedValue([
        { id: "acc-1", balance: 50000, deletedAt: null }
      ]);

      await expect(
        ExpenseService.approveExpense("admin-1", "exp-1")
      ).rejects.toThrow("পর্যাপ্ত ব্যালেন্স নেই।");
    });

    it("should deduct target bank account balance and post double-entry on approval", async () => {
      (prisma.expense.findUnique as jest.Mock).mockResolvedValue({
        id: "exp-1",
        category: "Rent",
        amount: 80000,
        status: ExpenseStatus.PENDING,
        location: "[CASH] Office Rent"
      });
      (prisma.bankAccount.findMany as jest.Mock).mockResolvedValue([
        { id: "cash-acc", name: "Cash on Hand", balance: 150000, deletedAt: null }
      ]);
      (prisma.bankAccount.findFirst as jest.Mock).mockResolvedValue({
        id: "cash-acc",
        name: "Cash on Hand",
        balance: 150000
      });
      (prisma.expense.update as jest.Mock).mockResolvedValue({
        id: "exp-1",
        status: ExpenseStatus.APPROVED
      });

      const result = await ExpenseService.approveExpense("admin-1", "exp-1");

      expect(result.status).toBe(ExpenseStatus.APPROVED);
      // Decremented the cash account balance
      expect(prisma.bankAccount.update).toHaveBeenCalledWith({
        where: { id: "cash-acc" },
        data: { balance: { decrement: 80000 } }
      });
      // Double entry posting: Code 5000 (Rent) Debit, Code 1000 (Cash) Credit
      const AccountingServiceMock = require("../src/services/AccountingService").AccountingService;
      expect(AccountingServiceMock.postJournalEntry).toHaveBeenCalledWith(
        prisma,
        expect.objectContaining({
          reference: "EXP-1",
          lines: [
            { accountCode: "5000", amount: 80000, type: "DEBIT" },
            { accountCode: "1000", amount: 80000, type: "CREDIT" }
          ]
        })
      );
    });
  });

  describe("rejectExpense", () => {
    it("should successfully reject a pending expense", async () => {
      (prisma.expense.findUnique as jest.Mock).mockResolvedValue({
        id: "exp-1",
        status: ExpenseStatus.PENDING
      });
      (prisma.expense.update as jest.Mock).mockResolvedValue({
        id: "exp-1",
        status: ExpenseStatus.REJECTED
      });

      const result = await ExpenseService.rejectExpense("admin-1", "exp-1");
      expect(result.status).toBe(ExpenseStatus.REJECTED);
      expect(prisma.expense.update).toHaveBeenCalledWith({
        where: { id: "exp-1" },
        data: expect.objectContaining({
          status: ExpenseStatus.REJECTED,
          approvedById: "admin-1"
        })
      });
    });
  });
});
