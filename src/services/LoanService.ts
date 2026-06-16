import { prisma } from "@/lib/db";
import { NotFoundError, ValidationError } from "@/backend/errors";
import { LoanStatus, ScheduleStatus, PaymentMode } from "@prisma/client";
import { AccountingService } from "./AccountingService";
import { AuditService } from "./AuditService";
import { DashboardService } from "./DashboardService";
import { NotificationService } from "./NotificationService";

export class LoanService {
  /**
   * Calculates the monthly EMI using the standard reducing balance method (PMT formula).
   */
  static calculateEmi(principal: number, annualRate: number, durationMonths: number): number {
    if (annualRate === 0) {
      return Math.round(principal / durationMonths);
    }
    const r = annualRate / 12 / 100;
    const emi = (principal * r * Math.pow(1 + r, durationMonths)) / (Math.pow(1 + r, durationMonths) - 1);
    return Math.round(emi);
  }

  /**
   * Generates the amortization schedule installments.
   * Ensures the remaining principal drops to exactly zero at the last month.
   */
  static generateAmortizationSchedule(
    principal: number,
    annualRate: number,
    durationMonths: number,
    startDate: Date
  ) {
    const schedule = [];
    let remainingPrincipal = principal;
    const r = annualRate / 12 / 100;
    const emi = this.calculateEmi(principal, annualRate, durationMonths);

    for (let i = 1; i <= durationMonths; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(startDate.getMonth() + i);

      const interestAmount = annualRate === 0 ? 0 : Math.round(remainingPrincipal * r);
      let principalAmount: number;
      let totalAmount: number;

      if (i === durationMonths) {
        principalAmount = remainingPrincipal;
        totalAmount = principalAmount + interestAmount;
      } else {
        principalAmount = emi - interestAmount;
        if (principalAmount > remainingPrincipal) {
          principalAmount = remainingPrincipal;
        }
        totalAmount = principalAmount + interestAmount;
      }

      remainingPrincipal -= principalAmount;

      schedule.push({
        emiNumber: i,
        dueDate,
        principalAmount,
        interestAmount,
        totalAmount
      });
    }

    return schedule;
  }

  /**
   * Allows a member to apply for a loan. Calculates draft EMI.
   */
  static async applyLoan(
    memberId: string,
    amount: number,
    interestRate: number,
    durationMonths: number,
    remarks?: string | null
  ) {
    const member = await prisma.member.findUnique({
      where: { id: memberId }
    });

    if (!member || member.deletedAt) {
      throw new NotFoundError("সদস্য খুঁজে পাওয়া যায়নি।");
    }

    const emiAmount = this.calculateEmi(amount, interestRate, durationMonths);

    const loan = await prisma.loan.create({
      data: {
        memberId,
        amount,
        interestRate,
        durationMonths,
        emiAmount,
        remarks,
        status: LoanStatus.PENDING
      }
    });

    return loan;
  }

  /**
   * Approves or rejects a loan. Disburses funds and posts accounting logs.
   */
  static async approveLoan(
    loanId: string,
    status: "APPROVED" | "REJECTED",
    actorId: string,
    options?: {
      paymentMode?: PaymentMode;
      bankAccountId?: string | null;
      remarks?: string | null;
    }
  ) {
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: { member: true }
    });

    if (!loan || loan.deletedAt) {
      throw new NotFoundError("ঋণ আবেদনটি খুঁজে পাওয়া যায়নি।");
    }

    if (loan.status !== LoanStatus.PENDING) {
      throw new ValidationError("শুধুমাত্র পেন্ডিং ঋণ আবেদন অনুমোদন বা প্রত্যাখ্যান করা সম্ভব।");
    }

    const today = new Date();

    const result = await prisma.$transaction(async (tx) => {
      if (status === "REJECTED") {
        const updatedLoan = await tx.loan.update({
          where: { id: loanId },
          data: {
            status: LoanStatus.REJECTED,
            remarks: options?.remarks || "প্রত্যাখ্যান করা হয়েছে।"
          }
        });

        await AuditService.log({
          userId: actorId,
          action: "REJECT",
          tableName: "Loan",
          recordId: loanId,
          oldData: loan,
          newData: updatedLoan,
          tx
        });

        return updatedLoan;
      }

      // APPROVED logic
      const paymentMode = options?.paymentMode || PaymentMode.CASH;
      const bankAccountId = options?.bankAccountId;

      // 1. Validate funding and deduct bank account balance
      let fundingAccount = null;
      if (paymentMode === PaymentMode.CASH) {
        fundingAccount = await tx.bankAccount.findFirst({
          where: { name: "Cash on Hand" }
        });
      } else {
        if (!bankAccountId) {
          throw new ValidationError("ব্যাংক পেমেন্টের জন্য ব্যাংক অ্যাকাউন্ট আইডি প্রদান করা আবশ্যক।");
        }
        fundingAccount = await tx.bankAccount.findUnique({
          where: { id: bankAccountId }
        });
      }

      if (!fundingAccount || fundingAccount.balance < loan.amount) {
        throw new ValidationError("ঋণ বিতরণের জন্য পর্যাপ্ত ক্যাশ/ব্যাংক ব্যালেন্স নেই।");
      }

      // Deduct balance
      await tx.bankAccount.update({
        where: { id: fundingAccount.id },
        data: { balance: { decrement: loan.amount } }
      });

      // 2. Update Loan Status
      const updatedLoan = await tx.loan.update({
        where: { id: loanId },
        data: {
          status: LoanStatus.ACTIVE,
          disbursedAt: today,
          disbursedById: actorId,
          remarks: options?.remarks
        }
      });

      // 3. Generate Loan Schedule entries
      const scheduleData = this.generateAmortizationSchedule(
        loan.amount,
        Number(loan.interestRate),
        loan.durationMonths,
        today
      );

      await tx.loanSchedule.createMany({
        data: scheduleData.map((s) => ({
          loanId: loan.id,
          dueDate: s.dueDate,
          emiNumber: s.emiNumber,
          principalAmount: s.principalAmount,
          interestAmount: s.interestAmount,
          totalAmount: s.totalAmount,
          paidAmount: 0,
          status: ScheduleStatus.UNPAID
        }))
      });

      // 4. Post balanced Double Entry Journal Log
      const assetCreditCode = paymentMode === PaymentMode.CASH ? "1000" : "1010";
      const reference = `LN-DISB-${loan.id.substring(0, 8).toUpperCase()}`;

      await AccountingService.postJournalEntry(tx, {
        reference,
        description: `ঋণ বিতরণ - সদস্য: ${loan.member.name} (${loan.member.memberCode})`,
        date: today,
        lines: [
          { accountCode: "1040", amount: loan.amount, type: "DEBIT" }, // Loan Receivable (Asset)
          { accountCode: assetCreditCode, amount: loan.amount, type: "CREDIT" } // Cash/Bank (Asset)
        ]
      });

      // 5. Track Audit Log
      await AuditService.log({
        userId: actorId,
        action: "APPROVE",
        tableName: "Loan",
        recordId: loanId,
        oldData: loan,
        newData: updatedLoan,
        tx
      });

      return updatedLoan;
    });

    await DashboardService.invalidateCache();

    // Trigger loan status notifications (Approved or Rejected) outside transaction block
    if (loan.member.email) {
      try {
        if (status === "APPROVED") {
          await NotificationService.sendLoanApprovalNotice(
            loan.member.email,
            loan.member.name,
            loan.amount / 100,
            Number(loan.interestRate),
            loan.durationMonths,
            loan.emiAmount / 100,
            loan.member.userId || undefined
          );
        } else {
          await NotificationService.sendLoanRejectionNotice(
            loan.member.email,
            loan.member.name,
            loan.amount / 100,
            options?.remarks || "প্রত্যাখ্যান করা হয়েছে।",
            loan.member.userId || undefined
          );
        }
      } catch (err) {
        console.error("[LoanService] Loan approval/rejection email notification failed:", err);
      }
    }

    return result;
  }

  /**
   * Records a repayment payment against a loan.
   * Splits payment between principal & interest, updates schedules, and marks paid status.
   */
  static async receivePayment(
    loanId: string,
    amount: number,
    paymentMode: PaymentMode,
    bankAccountId: string | null | undefined,
    receivedById: string,
    remarks?: string | null
  ) {
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        member: true,
        schedules: {
          where: { status: { in: [ScheduleStatus.UNPAID, ScheduleStatus.PARTIAL] } },
          orderBy: { emiNumber: "asc" }
        }
      }
    });

    if (!loan || loan.deletedAt) {
      throw new NotFoundError("সক্রিয় ঋণ অ্যাকাউন্ট খুঁজে পাওয়া যায়নি।");
    }

    if (loan.status !== LoanStatus.ACTIVE) {
      throw new ValidationError("পেমেন্ট শুধুমাত্র সক্রিয় ঋণের বিপরীতে গ্রহণ করা সম্ভব।");
    }

    // Calculate total outstanding balance to prevent overpayments
    const allSchedules = await prisma.loanSchedule.findMany({
      where: { loanId }
    });

    const totalExpected = allSchedules.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalPaid = allSchedules.reduce((sum, s) => sum + s.paidAmount, 0);
    const totalOutstanding = totalExpected - totalPaid;

    if (amount > totalOutstanding) {
      throw new ValidationError(`পেমেন্টের পরিমাণ ঋণের মোট বকেয়া অপেক্ষা বেশি। বকেয়া পরিমাণ: ${(totalOutstanding / 100).toFixed(2)} BDT`);
    }

    const today = new Date();

    const result = await prisma.$transaction(async (tx) => {
      // 1. Process schedules allocation (Interest first, then Principal)
      let remainingPayment = amount;
      let principalPaid = 0;
      let interestPaid = 0;

      for (const schedule of loan.schedules) {
        if (remainingPayment <= 0) break;

        const scheduleTotal = schedule.totalAmount;
        const currentPaid = schedule.paidAmount;
        const remainingInstAmount = scheduleTotal - currentPaid;

        // Calculate outstanding interest
        const instInterest = schedule.interestAmount;
        const paidInterest = Math.min(currentPaid, instInterest);
        const outstandingInterest = instInterest - paidInterest;

        // Apply to interest
        const interestAllocation = Math.min(remainingPayment, outstandingInterest);
        remainingPayment -= interestAllocation;
        interestPaid += interestAllocation;

        // Calculate outstanding principal
        const instPrincipal = schedule.principalAmount;
        const paidPrincipal = Math.max(0, currentPaid - instInterest);
        const outstandingPrincipal = instPrincipal - paidPrincipal;

        // Apply to principal
        const principalAllocation = Math.min(remainingPayment, outstandingPrincipal);
        remainingPayment -= principalAllocation;
        principalPaid += principalAllocation;

        // Update schedule
        const newPaidAmount = currentPaid + interestAllocation + principalAllocation;
        const isPaid = newPaidAmount >= scheduleTotal;

        await tx.loanSchedule.update({
          where: { id: schedule.id },
          data: {
            paidAmount: newPaidAmount,
            status: isPaid ? ScheduleStatus.PAID : ScheduleStatus.PARTIAL,
            paidAt: isPaid ? today : null
          }
        });
      }

      // 2. Increment Cash/Bank account
      let incrementAccount = null;
      if (paymentMode === PaymentMode.CASH) {
        incrementAccount = await tx.bankAccount.findFirst({
          where: { name: "Cash on Hand" }
        });
      } else {
        if (!bankAccountId) {
          throw new ValidationError("ব্যাংক পেমেন্টের জন্য ব্যাংক অ্যাকাউন্ট প্রদান করা আবশ্যক।");
        }
        incrementAccount = await tx.bankAccount.findUnique({
          where: { id: bankAccountId }
        });
      }

      if (!incrementAccount) {
        throw new ValidationError("পেমেন্ট জমার জন্য ব্যাংক অ্যাকাউন্ট খুঁজে পাওয়া যায়নি।");
      }

      await tx.bankAccount.update({
        where: { id: incrementAccount.id },
        data: { balance: { increment: amount } }
      });

      // 3. Create LoanPayment record
      const payment = await tx.loanPayment.create({
        data: {
          loanId,
          amount,
          interestPaid,
          principalPaid,
          paymentDate: today,
          paymentMode,
          bankAccountId: paymentMode === PaymentMode.BANK ? bankAccountId : null,
          receivedById,
          remarks
        }
      });

      // 4. Post Double Entry Journal Entry
      const assetDebitCode = paymentMode === PaymentMode.CASH ? "1000" : "1010";
      const reference = `LN-PAY-${payment.id.substring(0, 8).toUpperCase()}`;

      // Assemble lines dynamically based on values
      const journalLines: Array<{ accountCode: string; amount: number; type: "DEBIT" | "CREDIT" }> = [
        { accountCode: assetDebitCode, amount, type: "DEBIT" }
      ];

      if (principalPaid > 0) {
        journalLines.push({ accountCode: "1040", amount: principalPaid, type: "CREDIT" as const }); // Loan Receivable (Asset)
      }
      if (interestPaid > 0) {
        journalLines.push({ accountCode: "4030", amount: interestPaid, type: "CREDIT" as const }); // Interest Income (Revenue)
      }

      await AccountingService.postJournalEntry(tx, {
        reference,
        description: `ঋণ কিস্তি আদায় - সদস্য: ${loan.member.name} (${loan.member.memberCode})`,
        date: today,
        lines: journalLines
      });

      // 5. Check if loan is completely repaid
      const remainingUnpaidCount = await tx.loanSchedule.count({
        where: {
          loanId,
          status: { in: [ScheduleStatus.UNPAID, ScheduleStatus.PARTIAL] }
        }
      });

      if (remainingUnpaidCount === 0) {
        await tx.loan.update({
          where: { id: loanId },
          data: { status: LoanStatus.PAID }
        });
      }

      // 6. Audit Log
      await AuditService.log({
        userId: receivedById,
        action: "CREATE",
        tableName: "LoanPayment",
        recordId: payment.id,
        newData: payment,
        tx
      });

      return payment;
    });

    await DashboardService.invalidateCache();
    return result;
  }
}
