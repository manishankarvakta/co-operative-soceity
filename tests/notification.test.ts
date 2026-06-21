import { NotificationService } from "../src/services/NotificationService";
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
      create: jest.fn()
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
      upsert: jest.fn()
    },
    userRole: {
      findMany: jest.fn().mockResolvedValue([{ role: { name: "TREASURER" } }])
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
    notification: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn()
    },
    loan: {
      findUnique: jest.fn(),
      update: jest.fn()
    },
    loanSchedule: {
      createMany: jest.fn()
    },
    $transaction: jest.fn((cb) => cb(prisma))
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

describe("Notification System Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    NotificationService.clearSentEmails();
  });

  describe("NotificationService Basics", () => {
    it("should format deposit receipt correctly and record database notification logs", async () => {
      (prisma.notification.create as jest.Mock).mockResolvedValue({ id: "notif-1" });

      await NotificationService.sendDepositReceipt(
        "member@somity.com",
        "Ratul Ahmed",
        "REC-20260615-0001",
        1500, // 1500 BDT
        [{ type: "WEEKLY_SUBSCRIPTION", amountBdt: 1500 }],
        "user-uuid"
      );

      expect(NotificationService.sentEmails.length).toBe(1);
      const email = NotificationService.sentEmails[0];
      expect(email.to).toBe("member@somity.com");
      expect(email.subject).toContain("REC-20260615-0001");
      expect(email.html).toContain("Ratul Ahmed");
      expect(email.html).toContain("1500.00 BDT");

      // Verify db insert
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-uuid",
          title: expect.stringContaining("REC-20260615-0001"),
          message: expect.stringContaining("সমিতি সঞ্চয় জমা রশিদ"),
          read: false
        })
      });
    });

    it("should format and record penalty notices correctly", async () => {
      (prisma.notification.create as jest.Mock).mockResolvedValue({ id: "notif-2" });

      await NotificationService.sendPenaltyNotice(
        "member@somity.com",
        "Ratul Ahmed",
        150, // 150 BDT penalty
        "বিলম্ব কিস্তি ফি (Late Fee)",
        "user-uuid"
      );

      expect(NotificationService.sentEmails.length).toBe(1);
      const email = NotificationService.sentEmails[0];
      expect(email.to).toBe("member@somity.com");
      expect(email.subject).toBe("জরিমানা চার্জ নোটিশ (Penalty Assessed Notice)");
      expect(email.html).toContain("150.00 BDT");
      expect(email.html).toContain("Late Fee");
    });
  });

  describe("Service Integrations", () => {
    describe("Deposit Receipt & Penalty Notice (DepositService)", () => {
      it("should send Deposit Receipt and Penalty Notice when a deposit contains a penalty", async () => {
        (prisma.member.findUnique as jest.Mock).mockResolvedValue({
          id: "member-1",
          name: "Ratul Ahmed",
          memberCode: "SOM-2026-0001",
          phone: "01700000000",
          email: "ratul@somity.com",
          userId: "user-1",
          status: "ACTIVE"
        });

        (prisma.deposit.count as jest.Mock).mockResolvedValue(0);
        (prisma.deposit.create as jest.Mock).mockResolvedValue({ id: "deposit-1" });
        (prisma.depositItem.create as jest.Mock).mockResolvedValue({ id: "item-1" });
        
        (prisma.bankAccount.findFirst as jest.Mock).mockResolvedValue({
          id: "cash-acc",
          name: "Cash on Hand",
          balance: 10000
        });
        (prisma.bankAccount.update as jest.Mock).mockResolvedValue({ id: "cash-acc" });

        // Create deposit payload with Penalty item
        await DepositService.createBulkDeposit("officer-1", {
          memberId: "member-1",
          paymentMode: PaymentMode.CASH,
          remarks: "Special deposits",
          items: [
            { type: DepositType.WEEKLY_SUBSCRIPTION, amount: 100000, periodDetails: "W-24" }, // 1000 BDT
            { type: DepositType.PENALTY, amount: 15000, periodDetails: "Late Fee" } // 150 BDT
          ]
        });

        // We expect two emails to have been sent:
        // 1. The Deposit Receipt
        // 2. The Penalty Notice
        expect(NotificationService.sentEmails.length).toBe(2);
        
        const receiptEmail = NotificationService.sentEmails.find(e => e.subject.startsWith("জমা কালেকশন রশিদ"));
        expect(receiptEmail).toBeDefined();
        expect(receiptEmail!.to).toBe("ratul@somity.com");
        expect(receiptEmail!.html).toContain("1150.00 BDT");

        const penaltyEmail = NotificationService.sentEmails.find(e => e.subject === "জরিমানা চার্জ নোটিশ (Penalty Assessed Notice)");
        expect(penaltyEmail).toBeDefined();
        expect(penaltyEmail!.to).toBe("ratul@somity.com");
        expect(penaltyEmail!.html).toContain("150.00 BDT");
      });
    });

    describe("Suspension Notice (MemberService)", () => {
      it("should send suspension notice on manual update status to SUSPENDED", async () => {
        (prisma.member.findUnique as jest.Mock).mockResolvedValue({
          id: "member-1",
          name: "Ratul Ahmed",
          email: "ratul@somity.com",
          userId: "user-1",
          status: "ACTIVE"
        });

        (prisma.member.update as jest.Mock).mockResolvedValue({
          id: "member-1",
          name: "Ratul Ahmed",
          email: "ratul@somity.com",
          userId: "user-1",
          status: "SUSPENDED"
        });

        await MemberService.updateMember("member-1", { status: "SUSPENDED" });

        expect(NotificationService.sentEmails.length).toBe(1);
        const email = NotificationService.sentEmails[0];
        expect(email.subject).toBe("সদস্য অ্যাকাউন্ট স্থগিতকরণ নোটিশ (Suspension Notice)");
        expect(email.to).toBe("ratul@somity.com");
        expect(email.html).toContain("স্থগিতকরণ নোটিশ");
      });

      it("should automatically suspend and send suspension notices to members inactive for 12 weeks", async () => {
        // Mock members list: m-1 (active last week), m-2 (inactive for 12 weeks)
        (prisma.member.findMany as jest.Mock).mockResolvedValue([
          { id: "m-1", name: "Active User", email: "active@somity.com", userId: "u-1" },
          { id: "m-2", name: "Inactive User", email: "inactive@somity.com", userId: "u-2" }
        ]);

        // m-1 has a recent deposit
        (prisma.deposit.findFirst as jest.Mock)
          .mockResolvedValueOnce({ id: "dep-1" }) // for m-1
          .mockResolvedValueOnce(null);          // for m-2

        (prisma.member.update as jest.Mock).mockResolvedValue({ id: "m-2", status: "SUSPENDED" });

        const suspendedIds = await MemberService.evaluateSuspensions();

        expect(suspendedIds).toEqual(["m-2"]);
        expect(prisma.member.update).toHaveBeenCalledWith({
          where: { id: "m-2" },
          data: { status: "SUSPENDED" }
        });

        // m-2 should receive suspension notification email, but not m-1
        expect(NotificationService.sentEmails.length).toBe(1);
        expect(NotificationService.sentEmails[0].to).toBe("inactive@somity.com");
        expect(NotificationService.sentEmails[0].html).toContain("Inactive User");
      });
    });

    describe("Expense Approval Notice (ExpenseService)", () => {
      it("should trigger approval email to loggedBy user upon expense approval", async () => {
        (prisma.expense.findUnique as jest.Mock)
          .mockResolvedValueOnce({
            id: "exp-1",
            category: "Office Rent",
            amount: 1000000,
            status: "PENDING",
            location: "[CASH] Rental space"
          }) // mock call inside business logic
          .mockResolvedValueOnce({
            id: "exp-1",
            category: "Office Rent",
            amount: 1000000,
            loggedById: "officer-uuid",
            loggedBy: {
              email: "officer@somity.com"
            }
          }); // mock call in notification check block

        (prisma.bankAccount.findMany as jest.Mock).mockResolvedValue([
          { id: "cash-acc", name: "Cash on Hand", balance: 5000000 }
        ]);
        (prisma.bankAccount.findFirst as jest.Mock).mockResolvedValue({
          id: "cash-acc",
          name: "Cash on Hand",
          balance: 5000000
        });
        (prisma.bankAccount.update as jest.Mock).mockResolvedValue({ id: "cash-acc" });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ email: "admin@somity.com" });
        
        (prisma.expense.update as jest.Mock).mockResolvedValue({
          id: "exp-1",
          status: ExpenseStatus.APPROVED
        });

        await ExpenseService.approveExpense("admin-1", "exp-1");

        expect(NotificationService.sentEmails.length).toBe(1);
        const email = NotificationService.sentEmails[0];
        expect(email.to).toBe("officer@somity.com");
        expect(email.subject).toBe("অনুমোদন সম্পন্ন নোটিশ: ব্যয় বরাদ্দ (EXP-1)");
        expect(email.html).toContain("10000.00 BDT");
      });
    });

    describe("Bank Transaction Approval Notice (BankService)", () => {
      it("should trigger approval email on the third signature that fully approves bank transaction", async () => {
        (prisma.bankTransaction.findUnique as jest.Mock).mockResolvedValue({
          id: "tx-1",
          amount: 250000,
          type: TransactionType.CREDIT,
          presidentApproved: true,
          secretaryApproved: true,
          treasurerApproved: false,
          isApproved: false,
          bankAccountId: "acc-1",
          bankAccount: { name: "City Bank", balance: 100000 }
        });

        (prisma.bankAccount.update as jest.Mock).mockResolvedValue({ id: "acc-1" });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ email: "treasurer@somity.com" });
        
        (prisma.bankTransaction.update as jest.Mock).mockResolvedValue({
          id: "tx-1",
          amount: 250000,
          isApproved: true,
          reference: "REC-TX-1"
        });

        // Third signature approval by Treasurer
        await BankService.signTransaction("treasurer-uuid", "tx-1", "TREASURER");

        expect(NotificationService.sentEmails.length).toBe(1);
        const email = NotificationService.sentEmails[0];
        expect(email.to).toBe("treasurer@somity.com");
        expect(email.subject).toBe("অনুমোদন সম্পন্ন নোটিশ: ব্যাংক লেনদেন (REC-TX-1)");
        expect(email.html).toContain("2500.00 BDT");
      });
    });

    describe("Member Registration Welcome Email (MemberService)", () => {
      it("should trigger welcome notice email on member registration", async () => {
        (prisma.member.findUnique as jest.Mock).mockResolvedValue(null);
        (prisma.user.create as jest.Mock).mockResolvedValue({ id: "user-1" });
        (prisma.member.create as jest.Mock).mockResolvedValue({
          id: "member-1",
          memberCode: "SOM-2026-0001",
          name: "Ratul Ahmed",
          phone: "01700000000",
          email: "ratul@somity.com",
          userId: "user-1",
          status: "ACTIVE"
        });
        (prisma.notification.create as jest.Mock).mockResolvedValue({ id: "notif-1" });
        (prisma.notification.update as jest.Mock).mockResolvedValue({ id: "notif-1" });

        await MemberService.createMember({
          name: "Ratul Ahmed",
          phone: "01700000000",
          email: "ratul@somity.com",
          address: "Dhaka",
          joinDate: "2026-06-15",
          nominee: {
            name: "Nominee",
            relationship: "Brother",
            phone: "01800000000",
            address: "Dhaka",
            emergencyContact: "01900000000"
          }
        });

        // We expect the welcome email to have been sent
        expect(NotificationService.sentEmails.length).toBe(1);
        const welcomeEmail = NotificationService.sentEmails[0];
        expect(welcomeEmail.to).toBe("ratul@somity.com");
        expect(welcomeEmail.subject).toBe("সমিতি সদস্য নিবন্ধকরণ সম্পন্ন - স্বাগতম!");
        expect(welcomeEmail.html).toContain("SOM-2026-0001");
        expect(welcomeEmail.html).toContain("01700000000"); // default password
      });
    });

    describe("Loan Status Notification (LoanService)", () => {
      it("should trigger approval email on loan approval", async () => {
        const mockLoan = {
          id: "loan-1",
          amount: 500000,
          interestRate: 10,
          durationMonths: 12,
          durationValue: 12,
          durationType: "MONTHLY",
          presidentApproved: true,
          secretaryApproved: true,
          treasurerApproved: false,
          emiAmount: 45000,
          remarks: "Approval test",
          status: "PENDING",
          member: {
            id: "member-1",
            name: "Adnan",
            email: "adnan@somity.com",
            userId: "user-1"
          }
        };

        const { LoanService } = await import("../src/services/LoanService");
        
        (prisma.loan.findUnique as jest.Mock).mockResolvedValue(mockLoan);
        (prisma.bankAccount.findFirst as jest.Mock).mockResolvedValue({
          id: "cash-acc",
          name: "Cash on Hand",
          balance: 1000000
        });
        (prisma.loan.update as jest.Mock).mockImplementation(({ where, data }) => {
          if (data.status === "ACTIVE") {
            return Promise.resolve({
              ...mockLoan,
              presidentApproved: true,
              secretaryApproved: true,
              treasurerApproved: true,
              status: "ACTIVE",
              emiAmount: 45000
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
        (prisma.notification.create as jest.Mock).mockResolvedValue({ id: "notif-3" });
        (prisma.notification.update as jest.Mock).mockResolvedValue({ id: "notif-3" });

        await LoanService.approveLoan("loan-1", "APPROVED", "actor-1");

        expect(NotificationService.sentEmails.length).toBe(1);
        const email = NotificationService.sentEmails[0];
        expect(email.to).toBe("adnan@somity.com");
        expect(email.subject).toBe("ঋণ আবেদন অনুমোদিত ও বিতরণ সম্পন্ন");
        expect(email.html).toContain("5000.00 BDT"); // 500000 Paisa / 100
        expect(email.html).toContain("10.00%");
      });

      it("should trigger rejection email on loan rejection", async () => {
        const mockLoan = {
          id: "loan-1",
          amount: 500000,
          interestRate: 10,
          durationMonths: 12,
          emiAmount: 45000,
          remarks: "Rejection test",
          status: "PENDING",
          member: {
            id: "member-1",
            name: "Adnan",
            email: "adnan@somity.com",
            userId: "user-1"
          }
        };

        const { LoanService } = await import("../src/services/LoanService");
        
        (prisma.loan.findUnique as jest.Mock).mockResolvedValue(mockLoan);
        (prisma.loan.update as jest.Mock).mockResolvedValue({
          ...mockLoan,
          status: "REJECTED"
        });
        (prisma.notification.create as jest.Mock).mockResolvedValue({ id: "notif-4" });
        (prisma.notification.update as jest.Mock).mockResolvedValue({ id: "notif-4" });

        await LoanService.approveLoan("loan-1", "REJECTED", "actor-1", { remarks: "Risk score too high" });

        expect(NotificationService.sentEmails.length).toBe(1);
        const email = NotificationService.sentEmails[0];
        expect(email.to).toBe("adnan@somity.com");
        expect(email.subject).toBe("ঋণ আবেদন প্রত্যাখ্যান নোটিশ");
        expect(email.html).toContain("Risk score too high");
      });
    });

    describe("Notification Queue & Retries", () => {
      it("should fetch failed emails and retry sending", async () => {
        (prisma.notification.findMany as jest.Mock).mockResolvedValue([
          {
            id: "failed-notif-1",
            to: "failed-user@somity.com",
            title: "Retry Subject",
            htmlBody: "<p>Retry Body</p>",
            retryCount: 1,
            status: "FAILED"
          }
        ]);
        (prisma.notification.update as jest.Mock).mockResolvedValue({ id: "failed-notif-1" });

        await NotificationService.processQueue();

        expect(prisma.notification.findMany).toHaveBeenCalledWith({
          where: {
            status: "FAILED",
            retryCount: { lt: 3 }
          },
          take: 10
        });

        expect(prisma.notification.update).toHaveBeenCalledWith({
          where: { id: "failed-notif-1" },
          data: expect.objectContaining({
            status: "SENT",
            retryCount: 2,
            errorMessage: null
          })
        });
      });

      it("should halt retrying after 3 failed attempts", async () => {
        (prisma.notification.findMany as jest.Mock).mockResolvedValue([]);

        await NotificationService.processQueue();

        expect(prisma.notification.findMany).toHaveBeenCalledWith({
          where: {
            status: "FAILED",
            retryCount: { lt: 3 }
          },
          take: 10
        });
        expect(prisma.notification.update).not.toHaveBeenCalled();
      });
    });
  });
});
