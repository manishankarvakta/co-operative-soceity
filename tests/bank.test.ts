import { createBankAccountSchema, createBankTransactionSchema, createBankTransferSchema } from "../src/backend/validations/bank";
import { BankService } from "../src/services/BankService";
import { prisma } from "../src/lib/db";
import { TransactionType } from "@prisma/client";

// Mock database and AccountingService
jest.mock("../src/lib/db", () => ({
  prisma: {
    bankAccount: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn()
    },
    bankTransaction: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn()
    },
    $transaction: jest.fn((cb) => cb(prisma))
  }
}));

jest.mock("../src/services/AccountingService", () => ({
  AccountingService: {
    postJournalEntry: jest.fn().mockResolvedValue({ id: "mock-journal-entry-id" })
  }
}));

describe("Bank Validations (Zod)", () => {
  it("should validate bank account creation payload", () => {
    const res = createBankAccountSchema.safeParse({
      name: "Dutch Bangla Bank",
      accountNumber: "1234567890",
      initialBalance: 1000000 // 10,000 BDT in Paisa
    });
    expect(res.success).toBe(true);
  });

  it("should fail validation for negative initial balance", () => {
    const res = createBankAccountSchema.safeParse({
      name: "Cash",
      accountNumber: "11111",
      initialBalance: -50
    });
    expect(res.success).toBe(false);
  });
});

describe("BankService Business Logic", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createAccount", () => {
    it("should throw ValidationError if account number already exists", async () => {
      (prisma.bankAccount.findUnique as jest.Mock).mockResolvedValue({
        id: "acc-1",
        accountNumber: "12345",
        deletedAt: null
      });

      await expect(
        BankService.createAccount({
          name: "DBBL",
          accountNumber: "12345",
          initialBalance: 0
        })
      ).rejects.toThrow("এই অ্যাকাউন্ট নম্বরটি ইতিমধ্যে ব্যবহার করা হয়েছে।");
    });

    it("should create bank account and post initial balance if > 0", async () => {
      (prisma.bankAccount.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.bankAccount.create as jest.Mock).mockResolvedValue({
        id: "acc-1",
        name: "Dutch Bangla Bank",
        accountNumber: "12345",
        balance: 100000
      });

      const res = await BankService.createAccount({
        name: "Dutch Bangla Bank",
        accountNumber: "12345",
        initialBalance: 100000
      });

      expect(res.id).toBe("acc-1");
      const AccountingServiceMock = require("../src/services/AccountingService").AccountingService;
      expect(AccountingServiceMock.postJournalEntry).toHaveBeenCalledWith(
        prisma,
        expect.objectContaining({
          reference: "INIT",
          lines: [
            { accountCode: "1010", amount: 100000, type: "DEBIT" },
            { accountCode: "3000", amount: 100000, type: "CREDIT" }
          ]
        })
      );
    });
  });

  describe("createTransaction", () => {
    it("should throw ValidationError if withdrawal amount exceeds account balance", async () => {
      (prisma.bankAccount.findUnique as jest.Mock).mockResolvedValue({
        id: "acc-1",
        balance: 50000, // 500 BDT
        deletedAt: null
      });

      await expect(
        BankService.createTransaction({
          bankAccountId: "acc-1",
          amount: 60000, // 600 BDT
          type: "DEBIT"
        })
      ).rejects.toThrow("পর্যাপ্ত ব্যালেন্স নেই।");
    });

    it("should create transaction in unapproved state", async () => {
      (prisma.bankAccount.findUnique as jest.Mock).mockResolvedValue({
        id: "acc-1",
        balance: 50000,
        deletedAt: null
      });
      (prisma.bankTransaction.create as jest.Mock).mockResolvedValue({
        id: "tx-1",
        isApproved: false
      });

      const res = await BankService.createTransaction({
        bankAccountId: "acc-1",
        amount: 20000,
        type: "CREDIT"
      });

      expect(res.isApproved).toBe(false);
      expect(prisma.bankTransaction.create).toHaveBeenCalledWith({
        data: {
          bankAccountId: "acc-1",
          amount: 20000,
          type: "CREDIT",
          isApproved: false
        }
      });
    });
  });

  describe("createTransfer", () => {
    it("should throw ValidationError if source and destination are same", async () => {
      await expect(
        BankService.createTransfer({
          sourceBankAccountId: "acc-1",
          destinationBankAccountId: "acc-1",
          amount: 1000
        })
      ).rejects.toThrow("উৎস ও গন্তব্য অ্যাকাউন্ট একই হতে পারবে না।");
    });

    it("should create DEBIT and CREDIT transactions for source and dest", async () => {
      (prisma.bankAccount.findUnique as jest.Mock).mockImplementation((args: any) => {
        if (args.where.id === "acc-src") return Promise.resolve({ id: "acc-src", balance: 50000, deletedAt: null });
        if (args.where.id === "acc-dest") return Promise.resolve({ id: "acc-dest", balance: 10000, deletedAt: null });
        return Promise.resolve(null);
      });
      (prisma.bankTransaction.create as jest.Mock).mockImplementation((args: any) => {
        return Promise.resolve({ id: `tx-${args.data.type}`, ...args.data });
      });

      const res = await BankService.createTransfer({
        sourceBankAccountId: "acc-src",
        destinationBankAccountId: "acc-dest",
        amount: 20000
      });

      expect(res.id).toBe("tx-DEBIT");
      expect(prisma.bankTransaction.create).toHaveBeenCalledTimes(2);
    });
  });

  describe("signTransaction joint approval", () => {
    it("should update signature fields and not commit balance changes until all signoffs are present", async () => {
      (prisma.bankTransaction.findUnique as jest.Mock).mockResolvedValue({
        id: "tx-1",
        amount: 10000,
        type: TransactionType.CREDIT,
        presidentApproved: false,
        secretaryApproved: false,
        treasurerApproved: false,
        isApproved: false,
        bankAccountId: "acc-1",
        bankAccount: { id: "acc-1", name: "DBBL", balance: 50000 }
      });
      (prisma.bankTransaction.update as jest.Mock).mockResolvedValue({
        id: "tx-1",
        presidentApproved: true,
        secretaryApproved: false,
        treasurerApproved: false,
        isApproved: false,
        bankAccountId: "acc-1",
        bankAccount: { id: "acc-1", name: "DBBL", balance: 50000 }
      });

      const res = await BankService.signTransaction("user-1", "tx-1", "PRESIDENT");
      expect(res.isApproved).toBe(false);
      expect(res.presidentApproved).toBe(true);
      expect(prisma.bankAccount.update).not.toHaveBeenCalled();
    });

    it("should update balance and post journal entry once final signoff is complete", async () => {
      const initialTx = {
        id: "tx-1",
        amount: 10000,
        type: TransactionType.CREDIT,
        presidentApproved: true,
        secretaryApproved: true,
        treasurerApproved: false,
        isApproved: false,
        bankAccountId: "acc-1",
        bankAccount: { id: "acc-1", name: "DBBL", balance: 50000 }
      };
      (prisma.bankTransaction.findUnique as jest.Mock).mockResolvedValue(initialTx);
      (prisma.bankTransaction.update as jest.Mock).mockImplementation((args: any) => {
        if (args.data.isApproved) {
          return Promise.resolve({ ...initialTx, treasurerApproved: true, isApproved: true });
        }
        return Promise.resolve({ ...initialTx, treasurerApproved: true });
      });

      const res = await BankService.signTransaction("user-1", "tx-1", "TREASURER");
      expect(res.isApproved).toBe(true);
      expect(prisma.bankAccount.update).toHaveBeenCalledWith({
        where: { id: "acc-1" },
        data: { balance: { increment: 10000 } }
      });

      const AccountingServiceMock = require("../src/services/AccountingService").AccountingService;
      expect(AccountingServiceMock.postJournalEntry).toHaveBeenCalledWith(
        prisma,
        expect.objectContaining({
          lines: [
            { accountCode: "1010", amount: 10000, type: "DEBIT" },
            { accountCode: "4020", amount: 10000, type: "CREDIT" }
          ]
        })
      );
    });
  });
});
