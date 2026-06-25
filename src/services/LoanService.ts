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
  /**
   * Calculates the monthly/weekly flat EMI.
   */
  static calculateEmi(principal: number, annualRate: number, durationValue: number): number {
    const totalInterest = Math.round(principal * (annualRate / 100));
    const totalPayable = principal + totalInterest;
    return Math.round(totalPayable / durationValue);
  }

  /**
   * Generates the flat-rate amortization schedule installments.
   * Spacings: WEEKLY (7 days) or MONTHLY (1 month).
   * Ensures the remaining principal/interest drops to exactly zero at the last period.
   */
  static generateAmortizationSchedule(
    principal: number,
    interestRatePercent: number,
    durationValue: number,
    durationType: string,
    startDate: Date
  ) {
    const totalInterest = Math.round(principal * (interestRatePercent / 100));
    const totalPayable = principal + totalInterest;
    
    const emiTotal = Math.round(totalPayable / durationValue);
    const emiPrincipal = Math.round(principal / durationValue);
    const emiInterest = emiTotal - emiPrincipal;

    const schedule = [];
    let remainingPrincipal = principal;
    let remainingInterest = totalInterest;

    for (let i = 1; i <= durationValue; i++) {
      const dueDate = new Date(startDate);
      if (durationType === "WEEKLY") {
        dueDate.setDate(startDate.getDate() + (i * 7));
      } else {
        dueDate.setMonth(startDate.getMonth() + i);
      }

      let instPrincipal = emiPrincipal;
      let instInterest = emiInterest;
      
      if (i === durationValue) {
        // Last installment gets the remaining balance to avoid rounding errors
        instPrincipal = remainingPrincipal;
        instInterest = remainingInterest;
      } else {
        if (instPrincipal > remainingPrincipal) {
          instPrincipal = remainingPrincipal;
        }
        if (instInterest > remainingInterest) {
          instInterest = remainingInterest;
        }
      }

      remainingPrincipal -= instPrincipal;
      remainingInterest -= instInterest;

      schedule.push({
        emiNumber: i,
        dueDate,
        principalAmount: instPrincipal,
        interestAmount: instInterest,
        totalAmount: instPrincipal + instInterest
      });
    }

    return {
      schedule,
      emiAmount: emiTotal,
      totalPayable,
      totalInterest
    };
  }

  /**
   * Allows a member to apply for a loan. Enforces single active loan lock and 80% savings limit.
   */
  static async applyLoan(
    memberId: string,
    amount: number,
    interestRate: number,
    durationValue: number,
    durationType: "MONTHLY" | "WEEKLY",
    guarantor1Id: string,
    guarantor2Id?: string | null,
    bypassLimit: boolean = false,
    remarks?: string | null
  ) {
    const member = await prisma.member.findUnique({
      where: { id: memberId }
    });

    if (!member || member.deletedAt) {
      throw new NotFoundError("সদস্য খুঁজে পাওয়া যায়নি।");
    }

    // 1. Enforce Single Active Loan Lock
    const activeOrPendingLoan = await prisma.loan.findFirst({
      where: {
        memberId,
        status: { in: [LoanStatus.PENDING, LoanStatus.APPROVED, LoanStatus.ACTIVE] },
        deletedAt: null
      }
    });

    if (activeOrPendingLoan) {
      throw new ValidationError("সদস্যের ইতিমধ্যে একটি সক্রিয় বা পেন্ডিং ঋণ রয়েছে। সেটি সম্পূর্ণ পরিশোধ না করা পর্যন্ত নতুন ঋণের আবেদন করা যাবে না।");
    }

    // 2. Validate Guarantors
    if (guarantor1Id === memberId || guarantor2Id === memberId) {
      throw new ValidationError("সদস্য নিজে নিজের জামিনদার হতে পারবেন না।");
    }

    const g1 = await prisma.member.findUnique({ where: { id: guarantor1Id } });
    if (!g1 || g1.deletedAt) {
      throw new ValidationError("প্রথম জামিনদার সদস্যটি খুঁজে পাওয়া যায়নি।");
    }

    if (guarantor2Id) {
      const g2 = await prisma.member.findUnique({ where: { id: guarantor2Id } });
      if (!g2 || g2.deletedAt) {
        throw new ValidationError("দ্বিতীয় জামিনদার সদস্যটি খুঁজে পাওয়া যায়নি।");
      }
      if (guarantor1Id === guarantor2Id) {
        throw new ValidationError("প্রথম ও দ্বিতীয় জামিনদার একই সদস্য হতে পারবে না।");
      }
    }

    // 3. Enforce 80% Savings Limit (Weekly Subscription + Other deposits)
    const deposits = await prisma.deposit.findMany({
      where: { memberId, deletedAt: null },
      include: { items: { where: { deletedAt: null } } }
    });

    let totalSavings = 0;
    for (const dep of deposits) {
      for (const item of dep.items) {
        if (item.type === "WEEKLY_SUBSCRIPTION" || item.type === "OTHER") {
          totalSavings += item.amount;
        }
      }
    }

    const maxEligibleLoan = Math.round(totalSavings * 0.80);
    if (amount > maxEligibleLoan && !bypassLimit) {
      throw new ValidationError(
        `ঋণের পরিমাণ সদস্যের মোট জমানো সঞ্চয়/শেয়ার মূল্যের ৮০% এর বেশি। সর্বোচ্চ অনুমোদিত ঋণ: ${(maxEligibleLoan / 100).toFixed(2)} BDT (মোট সঞ্চয়: ${(totalSavings / 100).toFixed(2)} BDT)।`
      );
    }

    const emiAmount = this.calculateEmi(amount, interestRate, durationValue);
    const durationMonths = durationType === "WEEKLY" ? Math.ceil(durationValue / 4) : durationValue;

    const loan = await prisma.loan.create({
      data: {
        memberId,
        amount,
        interestRate,
        durationMonths,
        durationValue,
        durationType,
        guarantor1Id,
        guarantor2Id: guarantor2Id || null,
        bypassLimit,
        emiAmount,
        remarks,
        status: LoanStatus.PENDING
      }
    });

    return loan;
  }

  /**
   * Approves or rejects a loan. Tracks joint approvals (MD, Secretary, Treasurer).
   * Disburses funds and posts accounting logs only after all 3 approvals.
   */
  static async approveLoan(
    loanId: string,
    status: "APPROVED" | "REJECTED",
    actorId: string,
    options?: {
      paymentMode?: PaymentMode;
      bankAccountId?: string | null;
      remarks?: string | null;
      approveAsRole?: "PRESIDENT" | "SECRETARY" | "TREASURER" | null;
    }
  ) {
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: { member: true }
    });

    if (!loan || loan.deletedAt) {
      throw new NotFoundError("ঋণ আবেদনটি খুঁজে পাওয়া যায়নি।");
    }

    if (loan.status !== LoanStatus.PENDING && loan.status !== LoanStatus.APPROVED) {
      throw new ValidationError("শুধুমাত্র পেন্ডিং ঋণ আবেদন অনুমোদন বা প্রত্যাখ্যান করা সম্ভব।");
    }

    const today = new Date();

    // Query actor roles
    const userRoles = await prisma.userRole.findMany({
      where: { userId: actorId },
      include: { role: true }
    });
    const roles = userRoles.map((ur) => ur.role.name);

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

      // APPROVED logic (Joint signature tracking)
      let pApp = false;
      let sApp = false;
      let tApp = false;

      if (options?.approveAsRole) {
        const role = options.approveAsRole;
        if (role === "PRESIDENT" && (roles.includes("PRESIDENT") || roles.includes("SUPER_ADMIN"))) pApp = true;
        if (role === "SECRETARY" && (roles.includes("SECRETARY") || roles.includes("SUPER_ADMIN"))) sApp = true;
        if (role === "TREASURER" && (roles.includes("TREASURER") || roles.includes("SUPER_ADMIN"))) tApp = true;
      } else {
        if (roles.includes("PRESIDENT")) pApp = true;
        if (roles.includes("SECRETARY")) sApp = true;
        if (roles.includes("TREASURER")) tApp = true;
        if (roles.includes("SUPER_ADMIN")) {
          // If SUPER_ADMIN approves and no role is specified, fully approve by setting all signatures to true
          pApp = true;
          sApp = true;
          tApp = true;
        }
      }

      if (!pApp && !sApp && !tApp) {
        throw new ValidationError("অনুমোদনকারী ব্যবহারকারীর এই ঋণে স্বাক্ষর করার অনুমতি নেই।");
      }

      // Update approval flags
      const updatedLoan = await tx.loan.update({
        where: { id: loanId },
        data: {
          presidentApproved: pApp ? true : undefined,
          secretaryApproved: sApp ? true : undefined,
          treasurerApproved: tApp ? true : undefined,
        }
      });

      const isFullyApproved = updatedLoan.presidentApproved && updatedLoan.secretaryApproved && updatedLoan.treasurerApproved;

      if (!isFullyApproved) {
        // If not yet fully approved, return the partially approved loan
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
      }

      // Fully Approved: Execute disbursement and generate schedule
      const paymentMode = options?.paymentMode || PaymentMode.CASH;
      const bankAccountId = options?.bankAccountId;

      // 1. Validate funding and deduct bank account balance
      let fundingAccount = null;
      if (paymentMode === PaymentMode.CASH) {
        fundingAccount = await tx.bankAccount.findFirst({
          where: { OR: [{ accountNumber: "CASH-001" }, { name: "Cash on Hand" }] }
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

      // 2. Generate flat schedule
      const scheduleResult = this.generateAmortizationSchedule(
        loan.amount,
        Number(loan.interestRate),
        updatedLoan.durationValue,
        updatedLoan.durationType,
        today
      );

      // 3. Update Loan Status
      const finalLoan = await tx.loan.update({
        where: { id: loanId },
        data: {
          status: LoanStatus.ACTIVE,
          disbursedAt: today,
          disbursedById: actorId,
          emiAmount: scheduleResult.emiAmount,
          remarks: options?.remarks
        }
      });

      // Create Schedule Entries
      await tx.loanSchedule.createMany({
        data: scheduleResult.schedule.map((s) => ({
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
        newData: finalLoan,
        tx
      });

      return finalLoan;
    });

    await DashboardService.invalidateCache();

    // Trigger loan status notifications (Approved or Rejected) outside transaction block
    if (loan.member.email) {
      try {
        if (status === "APPROVED") {
          if (result.status === LoanStatus.ACTIVE) {
            await NotificationService.sendLoanApprovalNotice(
              loan.member.email,
              loan.member.name,
              loan.amount / 100,
              Number(loan.interestRate),
              result.durationMonths,
              result.emiAmount / 100,
              loan.member.userId || undefined
            );
          }
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
