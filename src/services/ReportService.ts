import { prisma } from "@/lib/db";
import { NotFoundError, ValidationError } from "@/backend/errors";
import { DepositType, PaymentMode, TransactionType } from "@prisma/client";

export class ReportService {
  /**
   * Generates a summary collection report of all member deposits.
   */
  static async getCollectionReport(params: {
    startDate?: string;
    endDate?: string;
    paymentMode?: "CASH" | "BANK";
  }) {
    const whereClause: any = { deletedAt: null };

    if (params.startDate || params.endDate) {
      whereClause.createdAt = {};
      if (params.startDate) {
        whereClause.createdAt.gte = new Date(params.startDate);
      }
      if (params.endDate) {
        // Set end of day for end date
        const end = new Date(params.endDate);
        end.setHours(23, 59, 59, 999);
        whereClause.createdAt.lte = end;
      }
    }

    if (params.paymentMode) {
      whereClause.paymentMode = params.paymentMode;
    }

    const deposits = await prisma.deposit.findMany({
      where: whereClause,
      include: {
        member: true,
        items: { where: { deletedAt: null } }
      },
      orderBy: { createdAt: "desc" }
    });

    // Compute aggregates
    let totalCollected = 0;
    let totalCash = 0;
    let totalBank = 0;

    const typeTotals: Record<DepositType, number> = {
      WEEKLY_SUBSCRIPTION: 0,
      ADMISSION_FEE: 0,
      PENALTY: 0,
      OTHER: 0,
      LOAN_REPAYMENT: 0
    };

    const details = deposits.map((d) => {
      const amount = d.items.reduce((sum, item) => sum + item.amount, 0);
      totalCollected += amount;

      if (d.paymentMode === "CASH") {
        totalCash += amount;
      } else {
        totalBank += amount;
      }

      d.items.forEach((item) => {
        typeTotals[item.type] = (typeTotals[item.type] || 0) + item.amount;
      });

      return {
        id: d.id,
        receiptCode: d.remarks?.split(" ")[0] || "N/A",
        memberCode: d.member.memberCode,
        memberName: d.member.name,
        date: d.createdAt,
        paymentMode: d.paymentMode,
        amountBdt: amount / 100,
        remarks: d.remarks || ""
      };
    });

    return {
      totals: {
        totalCollectedBdt: totalCollected / 100,
        totalCashBdt: totalCash / 100,
        totalBankBdt: totalBank / 100,
        weeklySubscriptionBdt: typeTotals.WEEKLY_SUBSCRIPTION / 100,
        admissionFeeBdt: typeTotals.ADMISSION_FEE / 100,
        penaltyBdt: typeTotals.PENALTY / 100,
        otherBdt: typeTotals.OTHER / 100,
        loanRepaymentBdt: typeTotals.LOAN_REPAYMENT / 100
      },
      details
    };
  }

  /**
   * Generates a categorized expenditure and project-level cost report.
   */
  static async getExpenseReport(params: {
    startDate?: string;
    endDate?: string;
    projectId?: string;
    category?: string;
  }) {
    const whereClause: any = { deletedAt: null };

    if (params.startDate || params.endDate) {
      whereClause.date = {};
      if (params.startDate) {
        whereClause.date.gte = new Date(params.startDate);
      }
      if (params.endDate) {
        const end = new Date(params.endDate);
        end.setHours(23, 59, 59, 999);
        whereClause.date.lte = end;
      }
    }

    if (params.projectId) {
      whereClause.projectId = params.projectId;
    }

    if (params.category) {
      whereClause.category = {
        contains: params.category,
        mode: "insensitive" as const
      };
    }

    const expenses = await prisma.expense.findMany({
      where: whereClause,
      include: {
        project: true,
        loggedBy: true,
        approvedBy: true
      },
      orderBy: { date: "desc" }
    });

    const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    const details = expenses.map((exp) => ({
      id: exp.id,
      category: exp.category,
      date: exp.date,
      amountBdt: exp.amount / 100,
      paymentMode: exp.location?.startsWith("[CASH]") ? "CASH" : "BANK",
      location: exp.location || "",
      projectName: exp.project?.name || exp.projectName || "General",
      status: exp.status,
      loggedBy: exp.loggedBy.email,
      approvedBy: exp.approvedBy?.email || "N/A"
    }));

    return {
      totalExpenseBdt: totalAmount / 100,
      details
    };
  }

  /**
   * Compiles an individual Member Ledger Passbook Statement.
   */
  static async getMemberStatement(memberId: string) {
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: { nominee: true }
    });

    if (!member || member.deletedAt) {
      throw new NotFoundError("সদস্য খুঁজে পাওয়া যায়নি।");
    }

    const [deposits, shares, loans] = await Promise.all([
      prisma.deposit.findMany({
        where: { memberId, deletedAt: null },
        include: { items: { where: { deletedAt: null } } },
        orderBy: { createdAt: "asc" }
      }),
      prisma.shareRecord.findMany({
        where: { memberId, deletedAt: null },
        orderBy: { createdAt: "asc" }
      }),
      prisma.loan.findMany({
        where: { memberId, deletedAt: null },
        include: {
          schedules: true,
          payments: true
        },
        orderBy: { createdAt: "desc" }
      })
    ]);

    // Calculate aggregates
    const totalShares = shares.reduce((sum, s) => sum + Number(s.count), 0);
    
    let totalSavingsPaisa = 0;
    let totalAdmissionFeePaisa = 0;
    let totalPenaltyPaisa = 0;
    let totalLoanRepaymentPaisa = 0;

    const passbook: any[] = [];

    deposits.forEach((dep) => {
      const receiptNo = dep.remarks?.split(" ")[0] || "REC";
      dep.items.forEach((item) => {
        if (item.type === "WEEKLY_SUBSCRIPTION") {
          totalSavingsPaisa += item.amount;
        } else if (item.type === "ADMISSION_FEE") {
          totalAdmissionFeePaisa += item.amount;
        } else if (item.type === "PENALTY") {
          totalPenaltyPaisa += item.amount;
        } else if (item.type === "LOAN_REPAYMENT") {
          totalLoanRepaymentPaisa += item.amount;
        }

        passbook.push({
          date: dep.createdAt,
          receiptCode: receiptNo,
          type: item.type,
          description: item.periodDetails || "",
          shares: item.sharesCount ? Number(item.sharesCount) : 0,
          amountBdt: item.amount / 100
        });
      });
    });

    // Calculate loan stats
    let totalLoanPrincipalPaisa = 0;
    let totalLoanPaidPaisa = 0;
    let totalLoanOutstandingPaisa = 0;

    loans.forEach((loan) => {
      if (loan.status === "ACTIVE" || loan.status === "PAID" || loan.status === "DEFAULTED") {
        totalLoanPrincipalPaisa += loan.amount;
        const paid = loan.payments.reduce((sum, p) => sum + p.amount, 0);
        totalLoanPaidPaisa += paid;
        
        const expected = loan.schedules.reduce((sum, s) => sum + s.totalAmount, 0);
        const schedPaid = loan.schedules.reduce((sum, s) => sum + s.paidAmount, 0);
        totalLoanOutstandingPaisa += (expected - schedPaid);
      }
    });

    // Sort passbook by date ascending
    passbook.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      memberInfo: {
        id: member.id,
        memberCode: member.memberCode,
        name: member.name,
        phone: member.phone,
        joinDate: member.joinDate,
        status: member.status,
        address: member.address,
        nominee: member.nominee ? {
          name: member.nominee.name,
          relationship: member.nominee.relationship,
          phone: member.nominee.phone
        } : null
      },
      totals: {
        totalShares,
        totalSavingsBdt: totalSavingsPaisa / 100,
        totalAdmissionFeeBdt: totalAdmissionFeePaisa / 100,
        totalPenaltyBdt: totalPenaltyPaisa / 100,
        totalLoanRepaymentBdt: totalLoanRepaymentPaisa / 100,
        totalDepositedBdt: (totalSavingsPaisa + totalAdmissionFeePaisa + totalPenaltyPaisa + totalLoanRepaymentPaisa) / 100,
        totalLoanPrincipalBdt: totalLoanPrincipalPaisa / 100,
        totalLoanPaidBdt: totalLoanPaidPaisa / 100,
        totalLoanOutstandingBdt: totalLoanOutstandingPaisa / 100
      },
      loans: loans.map((l) => ({
        id: l.id,
        amountBdt: l.amount / 100,
        interestRate: Number(l.interestRate),
        durationValue: l.durationValue,
        durationType: l.durationType,
        status: l.status,
        createdAt: l.createdAt,
        disbursedAt: l.disbursedAt
      })),
      passbook
    };
  }

  /**
   * Generates a detailed Cashbox/Bank account ledger statement sheet.
   */
  static async getBankStatement(params: {
    bankAccountId: string;
    startDate?: string;
    endDate?: string;
  }) {
    const account = await prisma.bankAccount.findUnique({
      where: { id: params.bankAccountId }
    });

    if (!account || account.deletedAt) {
      throw new NotFoundError("ব্যাংক অ্যাকাউন্ট খুঁজে পাওয়া যায়নি।");
    }

    const whereClause: any = {
      bankAccountId: params.bankAccountId,
      deletedAt: null
    };

    if (params.startDate || params.endDate) {
      whereClause.createdAt = {};
      if (params.startDate) {
        whereClause.createdAt.gte = new Date(params.startDate);
      }
      if (params.endDate) {
        const end = new Date(params.endDate);
        end.setHours(23, 59, 59, 999);
        whereClause.createdAt.lte = end;
      }
    }

    // Fetch transactions in date range (order by date ascending)
    const transactions = await prisma.bankTransaction.findMany({
      where: whereClause,
      orderBy: { createdAt: "asc" }
    });

    // Math calculation for Starting Balance:
    // startingBalance = currentBalance - netEffectOfAllTransactionsAfterStartDate
    let netEffectPaisa = 0;
    const filterStart = params.startDate ? new Date(params.startDate) : null;

    const afterStartFilter: any = {
      bankAccountId: params.bankAccountId,
      deletedAt: null,
      isApproved: true
    };
    if (filterStart) {
      afterStartFilter.createdAt = { gte: filterStart };
    }

    const approvedPostTransactions = await prisma.bankTransaction.findMany({
      where: afterStartFilter
    });

    approvedPostTransactions.forEach((tx) => {
      if (tx.type === TransactionType.CREDIT) {
        netEffectPaisa += tx.amount;
      } else {
        netEffectPaisa -= tx.amount;
      }
    });

    const startingBalancePaisa = account.balance - netEffectPaisa;

    // Compile statement lines with running balance
    let runningBalancePaisa = startingBalancePaisa;

    const statementLines = transactions.map((tx) => {
      let debitBdt = 0;
      let creditBdt = 0;

      if (tx.isApproved) {
        if (tx.type === TransactionType.CREDIT) {
          creditBdt = tx.amount / 100;
          runningBalancePaisa += tx.amount;
        } else {
          debitBdt = tx.amount / 100;
          runningBalancePaisa -= tx.amount;
        }
      }

      return {
        id: tx.id,
        date: tx.createdAt,
        type: tx.type,
        reference: tx.reference || "N/A",
        isApproved: tx.isApproved,
        presidentApproved: tx.presidentApproved,
        secretaryApproved: tx.secretaryApproved,
        treasurerApproved: tx.treasurerApproved,
        debitBdt,
        creditBdt,
        runningBalanceBdt: runningBalancePaisa / 100
      };
    });

    return {
      accountInfo: {
        id: account.id,
        name: account.name,
        accountNumber: account.accountNumber,
        currentBalanceBdt: account.balance / 100
      },
      totals: {
        startingBalanceBdt: startingBalancePaisa / 100,
        closingBalanceBdt: runningBalancePaisa / 100
      },
      details: statementLines
    };
  }
}
