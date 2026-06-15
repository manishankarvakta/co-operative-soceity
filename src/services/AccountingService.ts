import { prisma } from "../lib/db";
import { NotFoundError, ValidationError } from "../backend/errors";
import { AccountType, JournalLineType } from "@prisma/client";

export class AccountingService {
  /**
   * Automatically initializes standard Chart of Accounts if empty.
   */
  static async initializeChartOfAccounts(tx: any = prisma) {
    const defaultAccounts = [
      // Assets (1000 - 1999)
      { code: "1000", name: "Cash on Hand (নগদ তহবিল)", type: AccountType.ASSET },
      { code: "1010", name: "Bank Account (ব্যাংক হিসাব)", type: AccountType.ASSET },
      { code: "1020", name: "Land and Assets (ভূমি ও সম্পত্তি)", type: AccountType.ASSET },
      { code: "1030", name: "Fixed Deposit Account (স্থায়ী আমানত হিসাব)", type: AccountType.ASSET },
      
      // Liabilities (2000 - 2999)
      { code: "2000", name: "Member Savings (সদস্য সঞ্চয়)", type: AccountType.LIABILITY },
      
      // Equity (3000 - 3999)
      { code: "3000", name: "Member Share Capital (শেয়ার মূলধন)", type: AccountType.EQUITY },
      { code: "3010", name: "Business Development Fund (ব্যবসা উন্নয়ন তহবিল)", type: AccountType.EQUITY },
      { code: "3020", name: "Poor & Destitute Fund (দরিদ্র তহবিল)", type: AccountType.EQUITY },
      { code: "3030", name: "Sports & Entertainment Fund (ক্রীড়া ও বিনোদন তহবিল)", type: AccountType.EQUITY },
      
      // Revenue (4000 - 4999)
      { code: "4000", name: "Admission Fee Income (ভর্তি ফি আয়)", type: AccountType.REVENUE },
      { code: "4010", name: "Penalty/Fine Income (জরিমানা আয়)", type: AccountType.REVENUE },
      { code: "4020", name: "Investment Revenue (বিনিয়োগ লভ্যাংশ আয়)", type: AccountType.REVENUE },
      
      // Expenses (5000 - 5999)
      { code: "5000", name: "Office Rent Expense (অফিস ভাড়া খরচ)", type: AccountType.EXPENSE },
      { code: "5010", name: "Transport Expense (যাতায়াত খরচ)", type: AccountType.EXPENSE },
      { code: "5020", name: "Entertainment Expense (আপ্যায়ন খরচ)", type: AccountType.EXPENSE },
      { code: "5030", name: "General Expense (সাধারণ খরচ)", type: AccountType.EXPENSE }
    ];

    for (const acc of defaultAccounts) {
      const existing = await tx.account.findUnique({
        where: { code: acc.code }
      });
      if (!existing) {
        await tx.account.create({
          data: acc
        });
      }
    }
  }

  /**
   * Creates a new account in Chart of Accounts.
   */
  static async createAccount(data: { code: string; name: string; type: AccountType }) {
    const existing = await prisma.account.findUnique({
      where: { code: data.code }
    });

    if (existing && !existing.deletedAt) {
      throw new ValidationError("এই অ্যাকাউন্ট কোডটি ইতিমধ্যে ব্যবহার করা হয়েছে।");
    }

    return await prisma.account.create({
      data: {
        code: data.code,
        name: data.name,
        type: data.type
      }
    });
  }

  /**
   * Safely posts a balanced journal entry and updates corresponding account balances.
   */
  static async postJournalEntry(
    tx: any,
    data: {
      reference?: string | null;
      description: string;
      date: Date | string;
      lines: Array<{
        accountCode: string;
        amount: number; // Stored in BDT Paisa/Cents
        type: "DEBIT" | "CREDIT";
      }>;
    }
  ) {
    // 1. Double-entry validation: Sum of Debits must equal Sum of Credits
    const debitSum = data.lines
      .filter((l) => l.type === "DEBIT")
      .reduce((sum, l) => sum + l.amount, 0);

    const creditSum = data.lines
      .filter((l) => l.type === "CREDIT")
      .reduce((sum, l) => sum + l.amount, 0);

    if (debitSum !== creditSum) {
      throw new ValidationError(
        `দ্বৈত দাখিলা নীতি লঙ্ঘন: ডেবিট (${debitSum / 100} BDT) ও ক্রেডিট (${creditSum / 100} BDT) সমান হতে হবে।`
      );
    }

    // Initialize Chart of Accounts if empty
    await this.initializeChartOfAccounts(tx);

    const entryDate = new Date(data.date);

    // 2. Create the parent JournalEntry record
    const entry = await tx.journalEntry.create({
      data: {
        reference: data.reference || undefined,
        description: data.description,
        date: entryDate
      }
    });

    // 3. Create lines and update balances
    for (const line of data.lines) {
      const account = await tx.account.findUnique({
        where: { code: line.accountCode }
      });

      if (!account || account.deletedAt) {
        throw new NotFoundError(`কোড ${line.accountCode} এর অ্যাকাউন্ট খুঁজে পাওয়া যায়নি।`);
      }

      // Create JournalLine record
      await tx.journalLine.create({
        data: {
          journalEntryId: entry.id,
          accountId: account.id,
          amount: line.amount,
          type: line.type as JournalLineType
        }
      });

      // Calculate new balance adjustment
      let balanceAdjustment = 0;
      if (line.type === "DEBIT") {
        if (account.type === AccountType.ASSET || account.type === AccountType.EXPENSE) {
          balanceAdjustment = line.amount;
        } else {
          balanceAdjustment = -line.amount;
        }
      } else {
        // CREDIT
        if (account.type === AccountType.ASSET || account.type === AccountType.EXPENSE) {
          balanceAdjustment = -line.amount;
        } else {
          balanceAdjustment = line.amount;
        }
      }

      // Update Account balance
      await tx.account.update({
        where: { id: account.id },
        data: {
          balance: { increment: balanceAdjustment }
        }
      });
    }

    return entry;
  }

  /**
   * Lists recent journal entries.
   */
  static async listJournalEntries(params: { page?: number; limit?: number }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const [entries, totalCount] = await Promise.all([
      prisma.journalEntry.findMany({
        include: {
          lines: {
            include: { account: true }
          }
        },
        orderBy: { date: "desc" },
        skip,
        take: limit
      }),
      prisma.journalEntry.count()
    ]);

    return {
      entries,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        limit
      }
    };
  }

  /**
   * Retrieves full Chart of Accounts directory.
   */
  static async getChartOfAccounts() {
    await this.initializeChartOfAccounts(prisma);
    return await prisma.account.findMany({
      where: { deletedAt: null },
      orderBy: { code: "asc" }
    });
  }

  /**
   * Compiles Trial Balance.
   */
  static async getTrialBalance() {
    await this.initializeChartOfAccounts(prisma);
    const accounts = await prisma.account.findMany({
      where: { deletedAt: null },
      orderBy: { code: "asc" }
    });

    let totalDebit = 0;
    let totalCredit = 0;

    const rows = accounts.map((acc) => {
      let debit = 0;
      let credit = 0;

      if (acc.type === AccountType.ASSET || acc.type === AccountType.EXPENSE) {
        if (acc.balance >= 0) {
          debit = acc.balance;
        } else {
          credit = Math.abs(acc.balance);
        }
      } else {
        // Liabilities, Equity, Revenue
        if (acc.balance >= 0) {
          credit = acc.balance;
        } else {
          debit = Math.abs(acc.balance);
        }
      }

      totalDebit += debit;
      totalCredit += credit;

      return {
        code: acc.code,
        name: acc.name,
        type: acc.type,
        debit: debit / 100, // Convert to raw BDT
        credit: credit / 100 // Convert to raw BDT
      };
    });

    return {
      rows,
      totals: {
        totalDebit: totalDebit / 100,
        totalCredit: totalCredit / 100
      }
    };
  }

  /**
   * Compiles Balance Sheet.
   */
  static async getBalanceSheet() {
    await this.initializeChartOfAccounts(prisma);
    const accounts = await prisma.account.findMany({
      where: { deletedAt: null }
    });

    const assetsList: any[] = [];
    const liabilitiesList: any[] = [];
    const equityList: any[] = [];

    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;

    accounts.forEach((acc) => {
      const valueBdt = acc.balance / 100;
      if (acc.type === AccountType.ASSET) {
        assetsList.push({ code: acc.code, name: acc.name, balance: valueBdt });
        totalAssets += valueBdt;
      } else if (acc.type === AccountType.LIABILITY) {
        liabilitiesList.push({ code: acc.code, name: acc.name, balance: valueBdt });
        totalLiabilities += valueBdt;
      } else if (acc.type === AccountType.EQUITY) {
        equityList.push({ code: acc.code, name: acc.name, balance: valueBdt });
        totalEquity += valueBdt;
      }
    });

    return {
      assets: assetsList,
      liabilities: liabilitiesList,
      equity: equityList,
      totals: {
        totalAssets,
        totalLiabilities,
        totalEquity,
        totalLiabilitiesAndEquity: totalLiabilities + totalEquity
      }
    };
  }

  /**
   * Compiles Profit and Loss Statement.
   */
  static async getProfitLoss() {
    await this.initializeChartOfAccounts(prisma);
    const accounts = await prisma.account.findMany({
      where: { deletedAt: null }
    });

    const revenueList: any[] = [];
    const expenseList: any[] = [];

    let totalRevenue = 0;
    let totalExpenses = 0;

    accounts.forEach((acc) => {
      const valueBdt = acc.balance / 100;
      if (acc.type === AccountType.REVENUE) {
        revenueList.push({ code: acc.code, name: acc.name, balance: valueBdt });
        totalRevenue += valueBdt;
      } else if (acc.type === AccountType.EXPENSE) {
        expenseList.push({ code: acc.code, name: acc.name, balance: valueBdt });
        totalExpenses += valueBdt;
      }
    });

    return {
      revenue: revenueList,
      expenses: expenseList,
      totals: {
        totalRevenue,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses
      }
    };
  }
}
