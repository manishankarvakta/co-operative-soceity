import { applyLoanSchema, approveLoanSchema, loanPaymentSchema } from "../src/backend/validations/loan";
import { LoanService } from "../src/services/LoanService";
import { prisma } from "../src/lib/db";
import { LoanStatus, ScheduleStatus, PaymentMode } from "@prisma/client";

// Mock database execution
jest.mock("../src/lib/db", () => ({
  prisma: {
    member: {
      findUnique: jest.fn(),
    },
    loan: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    loanSchedule: {
      createMany: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    loanPayment: {
      create: jest.fn(),
    },
    bankAccount: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    userRole: {
      findMany: jest.fn(),
    },
    deposit: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(prisma)),
  },
}));

jest.mock("../src/services/AccountingService", () => ({
  AccountingService: {
    postJournalEntry: jest.fn().mockResolvedValue({ id: "mock-journal-entry-id" }),
  },
}));

jest.mock("../src/services/AuditService", () => ({
  AuditService: {
    log: jest.fn().mockResolvedValue({ id: "mock-audit-log-id" }),
  },
}));

jest.mock("../src/services/DashboardService", () => ({
  DashboardService: {
    invalidateCache: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock("../src/services/NotificationService", () => ({
  NotificationService: {
    sendLoanApprovalNotice: jest.fn().mockResolvedValue(undefined),
    sendLoanRejectionNotice: jest.fn().mockResolvedValue(undefined),
  },
}));

describe("Loan System Validation Schemas (Zod)", () => {
  describe("applyLoanSchema", () => {
    const validUuid = "12345678-1234-1234-1234-1234567890ab";

    it("should validate a valid application payload", () => {
      const result = applyLoanSchema.safeParse({
        amount: 500000,
        interestRate: 10.5,
        durationMonths: 12,
        durationValue: 12,
        guarantor1Id: validUuid,
        remarks: "Emergency fund"
      });
      expect(result.success).toBe(true);
    });

    it("should fail validation for negative values", () => {
      const result = applyLoanSchema.safeParse({
        amount: -100,
        interestRate: 10,
        durationValue: 12,
        guarantor1Id: validUuid
      });
      expect(result.success).toBe(false);
    });
  });

  describe("approveLoanSchema", () => {
    const validId = "12345678-1234-1234-1234-1234567890ab";

    it("should validate a valid approval payload using cash", () => {
      const result = approveLoanSchema.safeParse({
        loanId: validId,
        status: "APPROVED",
        paymentMode: "CASH",
        remarks: "Approved by committee"
      });
      expect(result.success).toBe(true);
    });

    it("should validate a valid rejection payload", () => {
      const result = approveLoanSchema.safeParse({
        loanId: validId,
        status: "REJECTED",
        remarks: "Insufficient creditworthiness"
      });
      expect(result.success).toBe(true);
    });

    it("should validate a valid bank approval payload", () => {
      const result = approveLoanSchema.safeParse({
        loanId: validId,
        status: "APPROVED",
        paymentMode: "BANK",
        bankAccountId: validId
      });
      expect(result.success).toBe(true);
    });

    it("should fail if status is APPROVED, paymentMode is BANK, but bankAccountId is missing", () => {
      const result = approveLoanSchema.safeParse({
        loanId: validId,
        status: "APPROVED",
        paymentMode: "BANK"
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("bankAccountId");
      }
    });
  });

  describe("loanPaymentSchema", () => {
    const validId = "12345678-1234-1234-1234-1234567890ab";

    it("should validate a valid payment payload using cash", () => {
      const result = loanPaymentSchema.safeParse({
        loanId: validId,
        amount: 10000,
        paymentMode: "CASH"
      });
      expect(result.success).toBe(true);
    });

    it("should validate a valid payment payload using bank", () => {
      const result = loanPaymentSchema.safeParse({
        loanId: validId,
        amount: 10000,
        paymentMode: "BANK",
        bankAccountId: validId
      });
      expect(result.success).toBe(true);
    });

    it("should fail if paymentMode is BANK, but bankAccountId is missing", () => {
      const result = loanPaymentSchema.safeParse({
        loanId: validId,
        amount: 10000,
        paymentMode: "BANK"
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("LoanService Business Logic & Calculation Math", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });



  describe("calculateEmi", () => {
    it("should calculate monthly EMI correctly using flat rate", () => {
      const principal = 1000000; // 10,000 BDT in Paisa
      const annualRate = 12.00;  // 12% flat rate
      const durationMonths = 12;

      // Flat EMI: (1000000 + (1000000 * 0.12)) / 12 = 93333.33 -> 93333
      const emi = LoanService.calculateEmi(principal, annualRate, durationMonths);
      expect(emi).toBe(93333);
    });

    it("should calculate correct flat EMI if interest rate is 0%", () => {
      const emi = LoanService.calculateEmi(120000, 0, 12);
      expect(emi).toBe(10000);
    });
  });

  describe("generateAmortizationSchedule", () => {
    it("should generate proper month-by-month installments with flat rate calculation", () => {
      const principal = 1000000; // 10,000 BDT in Paisa
      const annualRate = 12.00;  // 12% flat rate
      const durationMonths = 12;
      const startDate = new Date("2026-06-15");

      const result = LoanService.generateAmortizationSchedule(principal, annualRate, durationMonths, "MONTHLY", startDate);
      const schedule = result.schedule;

      expect(schedule).toHaveLength(12);

      // Check first installment details
      // Principal = 1000000 / 12 = 83333
      // Interest = (1000000 * 0.12) / 12 = 10000
      // Total = 93333
      expect(schedule[0].emiNumber).toBe(1);
      expect(schedule[0].interestAmount).toBe(10000);
      expect(schedule[0].principalAmount).toBe(83333);
      expect(schedule[0].totalAmount).toBe(93333);

      // Sum of all principal amounts must equal the original principal
      const totalPrincipal = schedule.reduce((sum, s) => sum + s.principalAmount, 0);
      expect(totalPrincipal).toBe(principal);
    });
  });

  describe("applyLoan", () => {
    const memberId = "member-uuid";

    it("should throw NotFoundError if member profile does not exist", async () => {
      (prisma.member.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        LoanService.applyLoan(memberId, 50000, 10, 6, "MONTHLY", "guarantor-uuid")
      ).rejects.toThrow("সদস্য খুঁজে পাওয়া যায়নি।");
    });

    it("should successfully save application with PENDING status and calculated EMI", async () => {
      // Mock member lookup for member and guarantor
      (prisma.member.findUnique as jest.Mock).mockImplementation(({ where }) => {
        if (where.id === memberId) {
          return Promise.resolve({ id: memberId, name: "Sakib Al Hasan", deletedAt: null });
        }
        if (where.id === "guarantor-uuid") {
          return Promise.resolve({ id: "guarantor-uuid", name: "Mushfiqur Rahim", deletedAt: null });
        }
        return Promise.resolve(null);
      });

      (prisma.loan.findFirst as jest.Mock).mockResolvedValue(null);

      (prisma.deposit.findMany as jest.Mock).mockResolvedValue([
        {
          items: [
            { type: "WEEKLY_SUBSCRIPTION", amount: 2000000, deletedAt: null }
          ]
        }
      ]);

      (prisma.loan.create as jest.Mock).mockResolvedValue({
        id: "loan-uuid",
        status: LoanStatus.PENDING,
        emiAmount: 93333
      });

      const loan = await LoanService.applyLoan(memberId, 1000000, 12, 12, "MONTHLY", "guarantor-uuid", null, false, "Need standard loan");

      expect(loan.id).toBe("loan-uuid");
      expect(loan.status).toBe(LoanStatus.PENDING);
      expect(prisma.loan.create).toHaveBeenCalledWith({
        data: {
          memberId,
          amount: 1000000,
          interestRate: 12,
          durationMonths: 12,
          durationValue: 12,
          durationType: "MONTHLY",
          guarantor1Id: "guarantor-uuid",
          guarantor2Id: null,
          bypassLimit: false,
          emiAmount: 93333,
          remarks: "Need standard loan",
          status: LoanStatus.PENDING
        }
      });
    });
  });

  describe("approveLoan", () => {
    const loanId = "loan-uuid";
    const actorId = "user-uuid";

    it("should throw NotFoundError if loan is not found", async () => {
      (prisma.loan.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        LoanService.approveLoan(loanId, "APPROVED", actorId)
      ).rejects.toThrow("ঋণ আবেদনটি খুঁজে পাওয়া যায়নি।");
    });

    it("should throw ValidationError if loan is already APPROVED/ACTIVE", async () => {
      (prisma.loan.findUnique as jest.Mock).mockResolvedValue({
        id: loanId,
        status: LoanStatus.ACTIVE,
        deletedAt: null
      });

      await expect(
        LoanService.approveLoan(loanId, "APPROVED", actorId)
      ).rejects.toThrow("শুধুমাত্র পেন্ডিং ঋণ আবেদন অনুমোদন বা প্রত্যাখ্যান করা সম্ভব।");
    });

    it("should mark loan status as REJECTED when status = REJECTED is passed", async () => {
      const mockLoan = {
        id: loanId,
        status: LoanStatus.PENDING,
        amount: 100000,
        deletedAt: null,
        member: { name: "Adnan", memberCode: "MEM-001" }
      };
      (prisma.loan.findUnique as jest.Mock).mockResolvedValue(mockLoan);
      (prisma.userRole.findMany as jest.Mock).mockResolvedValue([
        { role: { name: "SUPER_ADMIN" } }
      ]);
      (prisma.loan.update as jest.Mock).mockResolvedValue({
        ...mockLoan,
        status: LoanStatus.REJECTED
      });

      const updated = await LoanService.approveLoan(loanId, "REJECTED", actorId, { remarks: "Failed verification" });

      expect(updated.status).toBe(LoanStatus.REJECTED);
      expect(prisma.loan.update).toHaveBeenCalledWith({
        where: { id: loanId },
        data: {
          status: LoanStatus.REJECTED,
          remarks: "Failed verification"
        }
      });
    });

    it("should disburse active loan, decrement cash/bank account, generate schedules, and post double entries", async () => {
      const mockLoan = {
        id: loanId,
        status: LoanStatus.PENDING,
        amount: 1000000,
        interestRate: 12,
        durationMonths: 12,
        durationValue: 12,
        durationType: "MONTHLY",
        presidentApproved: true,
        secretaryApproved: true,
        treasurerApproved: false,
        deletedAt: null,
        member: { id: "member-uuid", name: "Rana", memberCode: "MEM-002" }
      };

      (prisma.loan.findUnique as jest.Mock).mockResolvedValue(mockLoan);
      (prisma.userRole.findMany as jest.Mock).mockResolvedValue([
        { role: { name: "TREASURER" } }
      ]);
      (prisma.bankAccount.findFirst as jest.Mock).mockResolvedValue({
        id: "cash-acc-id",
        name: "Cash on Hand",
        balance: 1500000 // has sufficient balance
      });
      (prisma.loan.update as jest.Mock).mockImplementation(({ where, data }) => {
        if (data.status === LoanStatus.ACTIVE) {
          return Promise.resolve({
            ...mockLoan,
            presidentApproved: true,
            secretaryApproved: true,
            treasurerApproved: true,
            status: LoanStatus.ACTIVE,
            disbursedAt: new Date()
          });
        }
        return Promise.resolve({
          ...mockLoan,
          presidentApproved: true,
          secretaryApproved: true,
          treasurerApproved: true
        });
      });
      (prisma.loanSchedule.createMany as jest.Mock).mockResolvedValue({ count: 12 });

      const updated = await LoanService.approveLoan(loanId, "APPROVED", actorId, {
        paymentMode: PaymentMode.CASH,
        remarks: "Approved & Disbursed"
      });

      expect(updated.status).toBe(LoanStatus.ACTIVE);

      // Verify funding account check
      expect(prisma.bankAccount.findFirst).toHaveBeenCalled();
      expect(prisma.bankAccount.update).toHaveBeenCalledWith({
        where: { id: "cash-acc-id" },
        data: { balance: { decrement: mockLoan.amount } }
      });

      // Verify amortization schedules created
      expect(prisma.loanSchedule.createMany).toHaveBeenCalled();

      // Verify update schema
      expect(prisma.loan.update).toHaveBeenCalledWith({
        where: { id: loanId },
        data: {
          status: LoanStatus.ACTIVE,
          disbursedAt: expect.any(Date),
          disbursedById: actorId,
          emiAmount: 93333,
          remarks: "Approved & Disbursed"
        }
      });
    });
  });

  describe("receivePayment", () => {
    const loanId = "loan-uuid";
    const userUuid = "user-uuid";

    it("should throw ValidationError if payment exceeds total outstanding balance", async () => {
      const mockLoan = {
        id: loanId,
        status: LoanStatus.ACTIVE,
        deletedAt: null,
        schedules: [
          { id: "sched-1", totalAmount: 88849, paidAmount: 80000, status: ScheduleStatus.PARTIAL }
        ]
      };

      (prisma.loan.findUnique as jest.Mock).mockResolvedValue(mockLoan);
      (prisma.loanSchedule.findMany as jest.Mock).mockResolvedValue(mockLoan.schedules);

      await expect(
        LoanService.receivePayment(loanId, 15000, PaymentMode.CASH, null, userUuid)
      ).rejects.toThrow("পেমেন্টের পরিমাণ ঋণের মোট বকেয়া অপেক্ষা বেশি।");
    });

    it("should successfully record loan payment and allocate correctly to interest first and then principal", async () => {
      // Mock loan and its schedules
      // 1st schedule has total 88849 (interest 10000, principal 78849). Currently unpaid.
      const mockSchedules = [
        {
          id: "sched-1",
          emiNumber: 1,
          interestAmount: 10000,
          principalAmount: 78849,
          totalAmount: 88849,
          paidAmount: 0,
          status: ScheduleStatus.UNPAID
        }
      ];

      const mockLoan = {
        id: loanId,
        status: LoanStatus.ACTIVE,
        deletedAt: null,
        member: { id: "member-uuid", name: "Rana", memberCode: "MEM-002" },
        schedules: mockSchedules
      };

      (prisma.loan.findUnique as jest.Mock).mockResolvedValue(mockLoan);
      (prisma.loanSchedule.findMany as jest.Mock).mockResolvedValue(mockSchedules);
      (prisma.bankAccount.findFirst as jest.Mock).mockResolvedValue({
        id: "cash-acc-id",
        name: "Cash on Hand",
        balance: 50000
      });
      (prisma.loanPayment.create as jest.Mock).mockResolvedValue({
        id: "payment-uuid",
        amount: 50000,
        interestPaid: 10000,
        principalPaid: 40000
      });
      (prisma.loanSchedule.count as jest.Mock).mockResolvedValue(1); // 1 unpaid left because only 50000 out of 88849 is paid

      const payment = await LoanService.receivePayment(loanId, 50000, PaymentMode.CASH, null, userUuid, "Partial Repayment");

      expect(payment.id).toBe("payment-uuid");
      expect(payment.interestPaid).toBe(10000);
      expect(payment.principalPaid).toBe(40000);

      // Verify schedule update is called with correct allocations
      expect(prisma.loanSchedule.update).toHaveBeenCalledWith({
        where: { id: "sched-1" },
        data: {
          paidAmount: 50000,
          status: ScheduleStatus.PARTIAL,
          paidAt: null
        }
      });

      // Verify balance increment on Cash account
      expect(prisma.bankAccount.update).toHaveBeenCalledWith({
        where: { id: "cash-acc-id" },
        data: { balance: { increment: 50000 } }
      });
    });

    it("should mark loan as PAID if all schedules are fully settled", async () => {
      const mockSchedules = [
        {
          id: "sched-2",
          emiNumber: 1,
          interestAmount: 5000,
          principalAmount: 45000,
          totalAmount: 50000,
          paidAmount: 0,
          status: ScheduleStatus.UNPAID
        }
      ];

      const mockLoan = {
        id: loanId,
        status: LoanStatus.ACTIVE,
        deletedAt: null,
        member: { id: "member-uuid", name: "Rana", memberCode: "MEM-002" },
        schedules: mockSchedules
      };

      (prisma.loan.findUnique as jest.Mock).mockResolvedValue(mockLoan);
      (prisma.loanSchedule.findMany as jest.Mock).mockResolvedValue(mockSchedules);
      (prisma.bankAccount.findFirst as jest.Mock).mockResolvedValue({
        id: "cash-acc-id",
        name: "Cash on Hand",
        balance: 50000
      });
      (prisma.loanPayment.create as jest.Mock).mockResolvedValue({
        id: "payment-uuid-2",
        amount: 50000,
        interestPaid: 5000,
        principalPaid: 45000
      });
      (prisma.loanSchedule.count as jest.Mock).mockResolvedValue(0); // 0 unpaid left, meaning loan is fully paid

      await LoanService.receivePayment(loanId, 50000, PaymentMode.CASH, null, userUuid, "Fully paid");

      // Verify schedule update is called with status PAID
      expect(prisma.loanSchedule.update).toHaveBeenCalledWith({
        where: { id: "sched-2" },
        data: {
          paidAmount: 50000,
          status: ScheduleStatus.PAID,
          paidAt: expect.any(Date)
        }
      });

      // Loan should be marked PAID
      expect(prisma.loan.update).toHaveBeenCalledWith({
        where: { id: loanId },
        data: { status: LoanStatus.PAID }
      });
    });
  });
});
