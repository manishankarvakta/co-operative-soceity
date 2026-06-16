import { prisma } from "../src/lib/db";
import { redis } from "../src/lib/redis";
import { auth } from "../src/lib/auth";

import { POST as resetRequestRoute } from "../src/app/api/auth/reset-request/route";
import { POST as resetVerifyRoute } from "../src/app/api/auth/reset-verify/route";
import { POST as createMemberRoute } from "../src/app/api/members/route";
import { POST as createDepositRoute } from "../src/app/api/deposits/route";
import { POST as applyLoanRoute } from "../src/app/api/loans/apply/route";
import { POST as approveLoanRoute } from "../src/app/api/loans/approve/route";
import { POST as receiveLoanPaymentRoute } from "../src/app/api/loans/payment/route";
import { POST as postJournalEntryRoute } from "../src/app/api/accounting/journal/route";
import { PaymentMode, DepositType, LoanStatus, ScheduleStatus } from "@prisma/client";

// Global variable to dynamically mock active session
let mockSession: any = null;

// Mock dependencies
jest.mock("../src/lib/db", () => ({
  prisma: {
    member: {
      findUnique: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn()
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    },
    deposit: {
      count: jest.fn(),
      create: jest.fn()
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
      update: jest.fn(),
      findMany: jest.fn()
    },
    loan: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    },
    loanSchedule: {
      createMany: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn()
    },
    loanPayment: {
      create: jest.fn()
    },
    notification: {
      create: jest.fn(),
      update: jest.fn()
    },
    fiscalYear: {
      findFirst: jest.fn(),
      findUnique: jest.fn()
    },
    account: {
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn()
    },
    journalEntry: {
      create: jest.fn()
    },
    journalLine: {
      create: jest.fn()
    },
    auditLog: {
      create: jest.fn()
    },
    $transaction: jest.fn((cb) => cb(prisma))
  }
}));

jest.mock("../src/lib/redis", () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn()
  }
}));

jest.mock("../src/lib/auth", () => ({
  auth: jest.fn(() => Promise.resolve(mockSession))
}));

describe("ERP System E2E Integration Route Tests", () => {
  const adminSession = {
    user: {
      id: "admin-user-uuid",
      email: "admin@somity.com",
      roles: ["SUPER_ADMIN"]
    }
  };

  const memberSession = {
    user: {
      id: "member-user-uuid",
      email: "member@somity.com",
      roles: ["MEMBER"],
      memberId: "11111111-1111-1111-1111-111111111111"
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSession = null;

    // 1. Mock active fiscal year globally
    (prisma.fiscalYear.findFirst as jest.Mock).mockResolvedValue({
      id: "fy-2026",
      name: "FY 2025-26",
      startDate: new Date("2025-07-01"),
      endDate: new Date("2026-06-30"),
      isActive: true
    });

    // 2. Mock account counts & queries globally to bypass initialization and balance validation
    (prisma.account.count as jest.Mock).mockResolvedValue(12);
    (prisma.account.findUnique as jest.Mock).mockImplementation((args: any) => {
      const code = args?.where?.code;
      if (code) {
        return Promise.resolve({
          id: `acc-id-${code}`,
          code,
          name: `Account ${code}`,
          type: code.startsWith("1") ? "ASSET" : code.startsWith("4") ? "REVENUE" : "LIABILITY",
          balance: 5000000
        });
      }
      return Promise.resolve(null);
    });
    (prisma.account.create as jest.Mock).mockResolvedValue({});
    (prisma.account.createMany as jest.Mock).mockResolvedValue({ count: 12 });

    // 3. Mock bank account queries globally
    (prisma.bankAccount.findFirst as jest.Mock).mockResolvedValue({
      id: "cash-acc-id",
      name: "Cash on Hand",
      balance: 5000000
    });
    (prisma.bankAccount.findUnique as jest.Mock).mockResolvedValue({
      id: "bank-acc-id",
      name: "Bank Account",
      balance: 5000000
    });

    // 4. Mock notifications database updates
    (prisma.notification.create as jest.Mock).mockResolvedValue({ id: "notif-uuid" });
    (prisma.notification.update as jest.Mock).mockResolvedValue({ id: "notif-uuid" });

    // 5. Mock audit logs
    (prisma.auditLog.create as jest.Mock).mockResolvedValue({ id: "audit-uuid" });

    // 6. Mock journal entry creation globally for accounting postings
    (prisma.journalEntry.create as jest.Mock).mockResolvedValue({ id: "journal-entry-uuid" });
    (prisma.journalLine.create as jest.Mock).mockResolvedValue({ id: "journal-line-uuid" });
  });

  describe("1. Authentication E2E Flow", () => {
    it("should process password reset request successfully", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "user-1", email: "test@domain.com" });
      (redis.set as jest.Mock).mockResolvedValue("OK");

      const req = new Request("http://localhost/api/auth/reset-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrPhone: "test@domain.com" })
      });

      const res = await resetRequestRoute(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });

    it("should process password reset OTP verification successfully", async () => {
      (redis.get as jest.Mock).mockResolvedValue("123456");
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "user-1", email: "test@domain.com" });
      (prisma.user.update as jest.Mock).mockResolvedValue({ id: "user-1" });
      (redis.del as jest.Mock).mockResolvedValue(1);

      const req = new Request("http://localhost/api/auth/reset-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailOrPhone: "test@domain.com",
          otp: "123456",
          newPassword: "mynewsecurepassword"
        })
      });

      const res = await resetVerifyRoute(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });
  });

  describe("2. Member Creation E2E Flow", () => {
    it("should block unauthenticated member creation", async () => {
      mockSession = null;
      const req = new Request("http://localhost/api/members", { method: "POST" });
      const res = await createMemberRoute(req);
      expect(res.status).toBe(401);
    });

    it("should allow admin to create a new member and generate initial audit and welcome logs", async () => {
      mockSession = adminSession;

      (prisma.member.findUnique as jest.Mock).mockResolvedValue(null); // Uniqueness check
      (prisma.user.create as jest.Mock).mockResolvedValue({ id: "new-user-1" });
      (prisma.member.create as jest.Mock).mockResolvedValue({
        id: "new-member-1",
        memberCode: "SOM-2026-0001",
        name: "Abir Hasan",
        phone: "01711111111",
        email: "abir@somity.com",
        userId: "new-user-1",
        status: "ACTIVE"
      });

      const req = new Request("http://localhost/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Abir Hasan",
          phone: "01711111111",
          email: "abir@somity.com",
          address: "Dhaka",
          joinDate: "2026-06-16",
          nominee: {
            name: "Nominee Name",
            relationship: "Spouse",
            phone: "01722222222",
            address: "Dhaka",
            emergencyContact: "01733333333"
          }
        })
      });

      const res = await createMemberRoute(req);
      expect(res.status).toBe(201); // resource successfully created
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.member.id).toBe("new-member-1");
      expect(data.member.memberCode).toBe("SOM-2026-0001");
    });
  });

  describe("3. Deposit Flow E2E Flow", () => {
    it("should allow admin/officer to collect deposit, update accounts, and record logs", async () => {
      mockSession = adminSession;

      (prisma.member.findUnique as jest.Mock).mockResolvedValue({
        id: "11111111-1111-1111-1111-111111111111",
        memberCode: "SOM-2026-0001",
        name: "Abir Hasan",
        status: "ACTIVE",
        deletedAt: null
      });
      (prisma.deposit.count as jest.Mock).mockResolvedValue(0);
      (prisma.deposit.create as jest.Mock).mockResolvedValue({ id: "deposit-1" });

      const req = new Request("http://localhost/api/deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: "11111111-1111-1111-1111-111111111111",
          paymentMode: PaymentMode.CASH,
          remarks: "Regular saving collection",
          items: [
            {
              type: DepositType.WEEKLY_SUBSCRIPTION,
              amount: 150000, // 1500 BDT
              periodDetails: "W-25"
            }
          ]
        })
      });

      const res = await createDepositRoute(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.depositId).toBe("deposit-1");
    });
  });

  describe("4. Loan Lifecycle E2E Flow", () => {
    it("should allow a member to apply for a loan", async () => {
      mockSession = memberSession;

      (prisma.member.findUnique as jest.Mock).mockResolvedValue({
        id: "11111111-1111-1111-1111-111111111111",
        name: "Sakib",
        deletedAt: null
      });
      (prisma.loan.create as jest.Mock).mockResolvedValue({
        id: "22222222-2222-2222-2222-222222222222",
        status: LoanStatus.PENDING,
        emiAmount: 88849
      });

      const req = new Request("http://localhost/api/loans/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: 1000000,
          interestRate: 12,
          durationMonths: 12,
          remarks: "Need business capital"
        })
      });

      const res = await applyLoanRoute(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.loan.status).toBe(LoanStatus.PENDING);
    });

    it("should allow admin to approve and disburse a pending loan", async () => {
      mockSession = adminSession;

      const mockLoan = {
        id: "22222222-2222-2222-2222-222222222222",
        amount: 1000000,
        interestRate: 12,
        durationMonths: 12,
        status: LoanStatus.PENDING,
        deletedAt: null,
        member: { id: "11111111-1111-1111-1111-111111111111", name: "Sakib", memberCode: "SOM-001" }
      };

      (prisma.loan.findUnique as jest.Mock).mockResolvedValue(mockLoan);
      (prisma.loan.update as jest.Mock).mockResolvedValue({
        ...mockLoan,
        status: LoanStatus.ACTIVE
      });
      (prisma.loanSchedule.createMany as jest.Mock).mockResolvedValue({ count: 12 });

      const req = new Request("http://localhost/api/loans/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loanId: "22222222-2222-2222-2222-222222222222",
          status: "APPROVED",
          paymentMode: "CASH",
          remarks: "Loan approved by audit"
        })
      });

      const res = await approveLoanRoute(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.loan.status).toBe(LoanStatus.ACTIVE);
    });

    it("should allow admin to record a loan repayment payment", async () => {
      mockSession = adminSession;

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
        id: "22222222-2222-2222-2222-222222222222",
        amount: 1000000,
        status: LoanStatus.ACTIVE,
        deletedAt: null,
        member: { id: "11111111-1111-1111-1111-111111111111", name: "Sakib", memberCode: "SOM-001" },
        schedules: mockSchedules
      };

      (prisma.loan.findUnique as jest.Mock).mockResolvedValue(mockLoan);
      (prisma.loanSchedule.findMany as jest.Mock).mockResolvedValue(mockSchedules);
      (prisma.loanPayment.create as jest.Mock).mockResolvedValue({
        id: "payment-1",
        amount: 88849
      });
      (prisma.loanSchedule.count as jest.Mock).mockResolvedValue(0); // Fully settled

      const req = new Request("http://localhost/api/loans/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loanId: "22222222-2222-2222-2222-222222222222",
          amount: 88849,
          paymentMode: PaymentMode.CASH
        })
      });

      const res = await receiveLoanPaymentRoute(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.payment.amount).toBe(88849);
    });
  });

  describe("5. Journal Entry Posting E2E Flow", () => {
    it("should post a balanced journal entry dynamically", async () => {
      mockSession = adminSession;

      (prisma.journalEntry.create as jest.Mock).mockResolvedValue({ id: "entry-1" });

      const req = new Request("http://localhost/api/accounting/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: "Capital collection E2E test",
          date: "2026-06-16",
          lines: [
            { accountCode: "1000", amount: 15000, type: "DEBIT" },
            { accountCode: "3000", amount: 1500, type: "DEBIT" } // unbalanced!
          ]
        })
      });

      // 1. Unbalanced check
      const resUnbalanced = await postJournalEntryRoute(req);
      expect(resUnbalanced.status).toBe(400); // balance validation fails

      // 2. Balanced check
      const reqBalanced = new Request("http://localhost/api/accounting/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: "Capital collection E2E test",
          date: "2026-06-16",
          lines: [
            { accountCode: "1000", amount: 15000, type: "DEBIT" },
            { accountCode: "3000", amount: 15000, type: "CREDIT" }
          ]
        })
      });

      const resBalanced = await postJournalEntryRoute(reqBalanced);
      expect(resBalanced.status).toBe(200);
      const data = await resBalanced.json();
      expect(data.success).toBe(true);
      expect(data.journalEntry.id).toBe("entry-1");
    });
  });
});
