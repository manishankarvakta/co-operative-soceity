import { ReportService } from "../src/services/ReportService";
import { prisma } from "../src/lib/db";
import { DepositType, PaymentMode, TransactionType } from "@prisma/client";

// Mock database
jest.mock("../src/lib/db", () => ({
  prisma: {
    deposit: {
      findMany: jest.fn()
    },
    expense: {
      findMany: jest.fn()
    },
    member: {
      findUnique: jest.fn()
    },
    shareRecord: {
      findMany: jest.fn()
    },
    bankAccount: {
      findUnique: jest.fn()
    },
    bankTransaction: {
      findMany: jest.fn()
    }
  }
}));

describe("ReportService Math & Filters", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getCollectionReport", () => {
    it("should aggregate deposit items by category and payment mode correctly", async () => {
      (prisma.deposit.findMany as jest.Mock).mockResolvedValue([
        {
          id: "dep-1",
          paymentMode: PaymentMode.CASH,
          remarks: "REC-20260615-0001",
          createdAt: new Date(),
          member: { memberCode: "MEM-01", name: "User A" },
          items: [
            { type: DepositType.WEEKLY_SUBSCRIPTION, amount: 100000, deletedAt: null },
            { type: DepositType.PENALTY, amount: 5000, deletedAt: null }
          ]
        },
        {
          id: "dep-2",
          paymentMode: PaymentMode.BANK,
          remarks: "REC-20260615-0002",
          createdAt: new Date(),
          member: { memberCode: "MEM-02", name: "User B" },
          items: [
            { type: DepositType.ADMISSION_FEE, amount: 500000, deletedAt: null }
          ]
        }
      ]);

      const res = await ReportService.getCollectionReport({});
      
      // Total amount: 100000 + 5000 + 500000 = 605000 Paisa = 6050 BDT
      // Cash: 105000 Paisa = 1050 BDT
      // Bank: 500000 Paisa = 5000 BDT
      // Weekly Subscription: 1000 BDT, Admission Fee: 5000 BDT, Penalty: 50 BDT
      
      expect(res.totals.totalCollectedBdt).toBe(6050);
      expect(res.totals.totalCashBdt).toBe(1050);
      expect(res.totals.totalBankBdt).toBe(5000);
      expect(res.totals.weeklySubscriptionBdt).toBe(1000);
      expect(res.totals.admissionFeeBdt).toBe(5000);
      expect(res.totals.penaltyBdt).toBe(50);
      expect(res.details.length).toBe(2);
      expect(res.details[0].receiptCode).toBe("REC-20260615-0001");
    });
  });

  describe("getExpenseReport", () => {
    it("should calculate total expense amount accurately", async () => {
      (prisma.expense.findMany as jest.Mock).mockResolvedValue([
        {
          id: "exp-1",
          category: "Rent",
          date: new Date(),
          amount: 80000,
          location: "[CASH] Savar Office",
          project: null,
          projectName: "General Office",
          status: "APPROVED",
          loggedBy: { email: "acc@erp.com" },
          approvedBy: { email: "admin@erp.com" }
        }
      ]);

      const res = await ReportService.getExpenseReport({});
      expect(res.totalExpenseBdt).toBe(800);
      expect(res.details[0].projectName).toBe("General Office");
    });
  });

  describe("getMemberStatement", () => {
    it("should compile passbook entries and savings totals correctly", async () => {
      (prisma.member.findUnique as jest.Mock).mockResolvedValue({
        id: "m1",
        memberCode: "MEM-01",
        name: "Ahsan",
        phone: "01711111111",
        joinDate: new Date(),
        status: "ACTIVE",
        address: "Dhaka"
      });

      (prisma.deposit.findMany as jest.Mock).mockResolvedValue([
        {
          id: "dep-1",
          remarks: "REC-1",
          createdAt: new Date(),
          items: [
            { type: DepositType.WEEKLY_SUBSCRIPTION, amount: 150000, sharesCount: 1.5 },
            { type: DepositType.PENALTY, amount: 2000, sharesCount: 0 }
          ]
        }
      ]);

      (prisma.shareRecord.findMany as jest.Mock).mockResolvedValue([
        { id: "s1", count: 1.5 }
      ]);

      const res = await ReportService.getMemberStatement("m1");
      expect(res.totals.totalShares).toBe(1.5);
      expect(res.totals.totalSavingsBdt).toBe(1500);
      expect(res.totals.totalPenaltyBdt).toBe(20);
      expect(res.passbook.length).toBe(2);
      expect(res.passbook[0].shares).toBe(1.5);
    });
  });

  describe("getBankStatement", () => {
    it("should calculate starting balance and track approved running balances backwards from current balance", async () => {
      // Setup current account balance = 100,000 Paisa (1000 BDT)
      (prisma.bankAccount.findUnique as jest.Mock).mockResolvedValue({
        id: "bank-1",
        name: "DBBL",
        accountNumber: "12345",
        balance: 100000
      });

      // Mock transactions returned within date range
      // Includes 1 approved deposit of 30,000 Paisa, and 1 approved withdrawal of 10,000 Paisa
      (prisma.bankTransaction.findMany as jest.Mock).mockImplementation((args: any) => {
        // If query is for running starting balance calculations
        if (args.where.isApproved) {
          return Promise.resolve([
            { id: "tx-dep", type: TransactionType.CREDIT, amount: 30000, isApproved: true },
            { id: "tx-with", type: TransactionType.DEBIT, amount: 10000, isApproved: true }
          ]);
        }
        // If query is for listing details in date range
        return Promise.resolve([
          { id: "tx-dep", type: TransactionType.CREDIT, amount: 30000, isApproved: true, reference: "REF1", createdAt: new Date() },
          { id: "tx-with", type: TransactionType.DEBIT, amount: 10000, isApproved: true, reference: "REF2", createdAt: new Date() }
        ]);
      });

      const res = await ReportService.getBankStatement({
        bankAccountId: "bank-1",
        startDate: "2026-06-01"
      });

      // Starting balance computation:
      // Current Balance = 1000 BDT
      // Post-start net effect = CREDIT (+300 BDT) - DEBIT (-100 BDT) = +200 BDT
      // Starting balance = 1000 - 200 = 800 BDT
      // Closing balance = 800 + 300 - 100 = 1000 BDT

      expect(res.totals.startingBalanceBdt).toBe(800);
      expect(res.totals.closingBalanceBdt).toBe(1000);
      expect(res.details[0].creditBdt).toBe(300);
      expect(res.details[1].debitBdt).toBe(100);
      expect(res.details[1].runningBalanceBdt).toBe(1000);
    });
  });
});
