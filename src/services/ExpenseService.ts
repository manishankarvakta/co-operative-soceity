import { prisma } from "@/lib/db";
import { NotFoundError, ValidationError } from "@/backend/errors";
import { DashboardService } from "./DashboardService";
import { ExpenseStatus } from "@prisma/client";
import { AccountingService } from "./AccountingService";
import { NotificationService } from "./NotificationService";
import { AuditService } from "./AuditService";

export class ExpenseService {
  /**
   * Helper to compute combined balance of all cash and bank accounts.
   */
  private static async getCombinedBalance(tx: any = prisma): Promise<number> {
    const accounts = await tx.bankAccount.findMany({
      where: { deletedAt: null }
    });
    return accounts.reduce((sum: number, acc: any) => sum + acc.balance, 0);
  }

  /**
   * Logs a new expense in PENDING status. Enforces combined balance validation.
   */
  static async createExpense(
    officerId: string,
    data: {
      category: string;
      date: string;
      amount: number; // Stored in Paisa/Cents
      paymentMode: "CASH" | "BANK";
      projectId?: string | null;
      location?: string | null;
      receiptId?: string | null;
      projectName?: string | null;
      bankAccountId?: string | null;
    }
  ) {
    const combinedBalance = await this.getCombinedBalance(prisma);
    if (combinedBalance < data.amount) {
      throw new ValidationError("পর্যাপ্ত ব্যালেন্স নেই।");
    }

    // Include payment mode and optional bank ID in location/remarks
    const bankSuffix = data.bankAccountId ? `:${data.bankAccountId}` : "";
    const formattedLocation = `[${data.paymentMode}${bankSuffix}] ${data.location || ""}`.trim();

    const expense = await prisma.expense.create({
      data: {
        category: data.category,
        date: new Date(data.date),
        amount: data.amount,
        projectId: data.projectId || undefined,
        location: formattedLocation,
        receiptId: data.receiptId || undefined,
        projectName: data.projectName || undefined,
        loggedById: officerId,
        status: ExpenseStatus.PENDING
      }
    });

    await DashboardService.invalidateCache();

    await AuditService.log({
      userId: officerId,
      action: "CREATE",
      tableName: "Expense",
      recordId: expense.id,
      newData: expense
    });

    return expense;
  }

  /**
   * Approves a pending expense, deducts from target account balance, and posts double-entry.
   */
  static async approveExpense(adminId: string, id: string) {
    const result = await prisma.$transaction(async (tx) => {
      const expense = await tx.expense.findUnique({
        where: { id },
        include: { project: true }
      });

      if (!expense || expense.deletedAt) {
        throw new NotFoundError("খরচ বিবরণী খুঁজে পাওয়া যায়নি।");
      }

      if (expense.status !== ExpenseStatus.PENDING) {
        throw new ValidationError("শুধুমাত্র পেন্ডিং খরচ অনুমোদন করা সম্ভব।");
      }

      // Re-evaluate combined balance
      const combinedBalance = await this.getCombinedBalance(tx);
      if (combinedBalance < expense.amount) {
        throw new ValidationError("পর্যাপ্ত ব্যালেন্স নেই।");
      }

      // Determine payment mode from the location prefix
      const isCash = expense.location?.startsWith("[CASH");
      const paymentMode = isCash ? "CASH" : "BANK";

      // Extract optional bank ID if present: e.g. "[BANK:1234-5678] location text"
      let specificBankId = null;
      if (paymentMode === "BANK" && expense.location?.startsWith("[BANK:")) {
        const endBracketIndex = expense.location.indexOf("]");
        if (endBracketIndex > 6) {
          specificBankId = expense.location.substring(6, endBracketIndex);
        }
      }

      // 1. Validate and update specific cash/bank account balance
      let bankAccount = null;
      if (paymentMode === "CASH") {
        bankAccount = await tx.bankAccount.findFirst({
          where: { OR: [{ accountNumber: "CASH-001" }, { name: "Cash on Hand" }] }
        });
      } else {
        if (specificBankId) {
          bankAccount = await tx.bankAccount.findUnique({
            where: { id: specificBankId }
          });
        } else {
          bankAccount = await tx.bankAccount.findFirst({
            where: { NOT: { OR: [{ accountNumber: "CASH-001" }, { name: "Cash on Hand" }] }, deletedAt: null }
          });
        }
      }

      if (!bankAccount || bankAccount.balance < expense.amount) {
        throw new ValidationError("পর্যাপ্ত ক্যাশ/ব্যাংক ব্যালেন্স নেই।");
      }

      // Decrement balance
      await tx.bankAccount.update({
        where: { id: bankAccount.id },
        data: { balance: { decrement: expense.amount } }
      });

      // 2. Map category to standard Chart of Account codes
      let expenseAccountCode = "5030"; // General Expense
      const normalizedCategory = expense.category.toUpperCase();
      if (normalizedCategory.includes("RENT") || normalizedCategory.includes("ভাড়া")) {
        expenseAccountCode = "5000"; // Office Rent Expense
      } else if (normalizedCategory.includes("TRANSPORT") || normalizedCategory.includes("যাতায়াত")) {
        expenseAccountCode = "5010"; // Transport Expense
      } else if (normalizedCategory.includes("ENTERTAINMENT") || normalizedCategory.includes("আপ্যায়ন")) {
        expenseAccountCode = "5020"; // Entertainment Expense
      } else if (normalizedCategory.includes("LAND") || normalizedCategory.includes("জমি")) {
        expenseAccountCode = "1020"; // Land and Assets (Asset Account)
      }

      // 3. Post balanced Double Entry Journal Entry
      const debitAccount = expenseAccountCode;
      const creditAccount = paymentMode === "CASH" ? "1000" : "1010";

      await AccountingService.postJournalEntry(tx, {
        reference: expense.id.substring(0, 8).toUpperCase(),
        description: `খরচ অনুমোদন - ${expense.category} (${expense.location || ""})`,
        date: new Date(),
        lines: [
          { accountCode: debitAccount, amount: expense.amount, type: "DEBIT" },
          { accountCode: creditAccount, amount: expense.amount, type: "CREDIT" }
        ]
      });

      const approvedExpense = await tx.expense.update({
        where: { id },
        data: {
          status: ExpenseStatus.APPROVED,
          approvedById: adminId,
          approvedAt: new Date()
        }
      });

      await AuditService.log({
        userId: adminId,
        action: "APPROVE",
        tableName: "Expense",
        recordId: id,
        oldData: expense,
        newData: approvedExpense,
        tx
      });

      return approvedExpense;
    });

    await DashboardService.invalidateCache();

    // Trigger Approval Notification
    if (result) {
      try {
        const admin = prisma.user ? await prisma.user.findUnique({ where: { id: adminId } }) : null;
        const approvedByLabel = admin?.email || "Admin";

        const exp = await prisma.expense.findUnique({
          where: { id },
          include: { loggedBy: true }
        });

        if (exp && exp.loggedBy && exp.loggedBy.email) {
          await NotificationService.sendApprovalNotice(
            exp.loggedBy.email,
            "EXPENSE",
            id.substring(0, 8).toUpperCase(),
            exp.amount / 100,
            approvedByLabel,
            exp.loggedById || undefined
          );
        }
      } catch (err) {
        console.error("Expense approval notification trigger failed:", err);
      }
    }

    return result;
  }

  /**
   * Rejects a pending expense.
   */
  static async rejectExpense(adminId: string, id: string) {
    const expense = await prisma.expense.findUnique({ where: { id } });

    if (!expense || expense.deletedAt) {
      throw new NotFoundError("খরচ বিবরণী খুঁজে পাওয়া যায়নি।");
    }

    if (expense.status !== ExpenseStatus.PENDING) {
      throw new ValidationError("শুধুমাত্র পেন্ডিং খরচ রিজেক্ট করা সম্ভব।");
    }

    const result = await prisma.expense.update({
      where: { id },
      data: {
        status: ExpenseStatus.REJECTED,
        approvedById: adminId,
        approvedAt: new Date()
      }
    });

    await AuditService.log({
      userId: adminId,
      action: "REJECT",
      tableName: "Expense",
      recordId: id,
      oldData: expense,
      newData: result
    });

    await DashboardService.invalidateCache();
    return result;
  }

  /**
   * Lists and searches expenses with page parameters and filters.
   */
  static async listExpenses(params: {
    page?: number;
    limit?: number;
    status?: ExpenseStatus;
    projectId?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const whereClause: any = { deletedAt: null };
    if (params.status) whereClause.status = params.status;
    if (params.projectId) whereClause.projectId = params.projectId;

    const [expenses, totalCount] = await Promise.all([
      prisma.expense.findMany({
        where: whereClause,
        include: {
          loggedBy: true,
          approvedBy: true,
          project: true,
          receipt: true
        },
        orderBy: { date: "desc" },
        skip,
        take: limit
      }),
      prisma.expense.count({ where: whereClause })
    ]);

    return {
      expenses,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        limit
      }
    };
  }
}
