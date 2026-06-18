import { prisma } from "@/lib/db";
import { NotFoundError, ValidationError } from "@/backend/errors";
import { DashboardService } from "./DashboardService";
import { NotificationService } from "./NotificationService";
import { PaymentMode, DepositType } from "@prisma/client";
import { AccountingService } from "./AccountingService";
import { AuditService } from "./AuditService";

export class DepositService {
  /**
   * Auto-generates a unique sequence receipt number (REC-YYYYMMDD-XXXX).
   */
  private static async generateReceiptNumber(date: Date): Promise<string> {
    const yyyy = date.getFullYear();
    const mm = (date.getMonth() + 1).toString().padStart(2, "0");
    const dd = date.getDate().toString().padStart(2, "0");
    const dateStr = `${yyyy}${mm}${dd}`;

    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

    const count = await prisma.deposit.count({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    const sequence = (count + 1).toString().padStart(4, "0");
    return `REC-${dateStr}-${sequence}`;
  }

  /**
   * Processes a bulk deposit transaction.
   * Calculates shares, generates a receipt code, and updates account balances.
   */
  static async createBulkDeposit(
    officerId: string,
    data: {
      memberId: string;
      paymentMode: PaymentMode;
      bankAccountId?: string;
      receiptId?: string | null;
      remarks?: string | null;
      items: Array<{
        type: DepositType;
        amount: number; // Stored in Paisa/Cents
        periodDetails: string;
      }>;
    },
    tx?: any
  ) {
    const db = tx || prisma;
    const member = await db.member.findUnique({
      where: { id: data.memberId }
    });

    if (!member || member.deletedAt) {
      throw new NotFoundError("সদস্য খুঁজে পাওয়া যায়নি।");
    }

    if (member.status === "SUSPENDED" && !data.items.some(i => i.type === "PENALTY")) {
      throw new ValidationError(
        "সদস্য অ্যাকাউন্টটি সাসপেন্ড রয়েছে। বকেয়া ও ১০% জরিমানা (Penalty) পরিশোধ করে সচল করুন।"
      );
    }

    const today = new Date();
    const receiptCode = await this.generateReceiptNumber(today);
    const totalPaisa = data.items.reduce((sum, item) => sum + item.amount, 0);

    const execute = async (transactionClient: any) => {
      // 1. Create parent Deposit record
      const deposit = await transactionClient.deposit.create({
        data: {
          memberId: data.memberId,
          receivedById: officerId,
          paymentMode: data.paymentMode,
          receiptId: data.receiptId || undefined,
          remarks: `${receiptCode} ${data.remarks || ""}`,
          createdAt: today
        }
      });

      // 2. Loop items to process shares and create records
      for (const item of data.items) {
        // Auto share calculation (1 Share = 1,000 BDT = 100,000 Paisa)
        let shares = 0;
        if (item.type === "WEEKLY_SUBSCRIPTION") {
          shares = item.amount / 100000;
        }

        // Create DepositItem
        await transactionClient.depositItem.create({
          data: {
            depositId: deposit.id,
            type: item.type,
            amount: item.amount,
            sharesCount: shares,
            periodDetails: item.periodDetails
          }
        });

        // Generate ShareRecord for weekly subscriptions
        if (shares > 0) {
          await transactionClient.shareRecord.create({
            data: {
              memberId: data.memberId,
              transactionId: deposit.id,
              count: shares,
              createdAt: today
            }
          });
        }
      }

      // 3. Update Balance Ledgers
      if (data.paymentMode === "CASH") {
        // Auto-create "Cash on Hand" account if it doesn't exist, then increment balance.
        // Uses accountNumber as the unique key (accountNumber has @unique in schema).
        await transactionClient.bankAccount.upsert({
          where: { accountNumber: "CASH-001" },
          update: { balance: { increment: totalPaisa } },
          create: {
            name: "Cash on Hand",
            accountNumber: "CASH-001",
            balance: totalPaisa
          }
        });
      } else {
        // Increment the specific bank account if provided, else the first non-cash account.
        const bankAccount = data.bankAccountId
          ? await transactionClient.bankAccount.findUnique({ where: { id: data.bankAccountId } })
          : await transactionClient.bankAccount.findFirst({
              where: { NOT: { name: "Cash on Hand" }, deletedAt: null }
            });
        
        if (bankAccount) {
          await transactionClient.bankAccount.update({
            where: { id: bankAccount.id },
            data: { balance: { increment: totalPaisa } }
          });
        }
      }

      // 4. Auto-post balanced Double Entry Journal Entry
      const journalLines: Array<{ accountCode: string; amount: number; type: "DEBIT" | "CREDIT" }> = [
        {
          accountCode: data.paymentMode === "CASH" ? "1000" : "1010",
          amount: totalPaisa,
          type: "DEBIT" as const
        },
        ...data.items.map((item) => {
          let accountCode = "2000"; // Default to Member Savings (Liabilities)
          if (item.type === "WEEKLY_SUBSCRIPTION") {
            accountCode = "3000"; // Member Share Capital (Equity)
          } else if (item.type === "ADMISSION_FEE") {
            accountCode = "4000"; // Admission Fee Income (Revenue)
          } else if (item.type === "PENALTY") {
            accountCode = "4010"; // Penalty Income (Revenue)
          }
          return {
            accountCode,
            amount: item.amount,
            type: "CREDIT" as const
          };
        })
      ];

      await AccountingService.postJournalEntry(transactionClient, {
        reference: receiptCode,
        description: `সদস্য জমা কালেকশন - ${member.name} (${member.memberCode})`,
        date: today,
        lines: journalLines
      });

      // 5. Handle member reactivation if penalty paid
      if (member.status === "SUSPENDED" && data.items.some(i => i.type === "PENALTY")) {
        await transactionClient.member.update({
          where: { id: data.memberId },
          data: { status: "ACTIVE" }
        });
      }

      return {
        depositId: deposit.id,
        receiptCode,
        totalAmount: totalPaisa,
        memberCode: member.memberCode,
        memberName: member.name
      };
    };

    const result = tx ? await execute(tx) : await prisma.$transaction(execute);

    await DashboardService.invalidateCache();

    // Trigger Email/In-App Notifications
    if (member.email) {
      const formattedItems = data.items.map((item) => ({
        type: item.type,
        amountBdt: item.amount / 100
      }));

      await NotificationService.sendDepositReceipt(
        member.email,
        member.name,
        result.receiptCode,
        result.totalAmount / 100,
        formattedItems,
        member.userId || undefined
      );

      // If a penalty was paid in the deposit, send a Penalty Notice
      const penaltyItem = data.items.find((i) => i.type === "PENALTY");
      if (penaltyItem) {
        await NotificationService.sendPenaltyNotice(
          member.email,
          member.name,
          penaltyItem.amount / 100,
          "স্থগিত অ্যাকাউন্ট সচল করতে জরিমানা পরিশোধ",
          member.userId || undefined
        );
      }
    }

    await AuditService.log({
      userId: officerId,
      action: "CREATE",
      tableName: "Deposit",
      recordId: result.depositId,
      newData: result
    });

    return result;
  }

  /**
   * Retrieves specific deposit details.
   */
  static async getDepositById(id: string) {
    const deposit = await prisma.deposit.findUnique({
      where: { id },
      include: {
        member: true,
        items: true,
        receipt: true
      }
    });

    if (!deposit || deposit.deletedAt) {
      throw new NotFoundError("জমার তথ্য পাওয়া যায়নি।");
    }

    return deposit;
  }

  /**
   * Lists recent deposit slips.
   */
  static async listDeposits(params: { page?: number; limit?: number }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const [deposits, totalCount] = await Promise.all([
      prisma.deposit.findMany({
        where: { deletedAt: null },
        include: {
          member: true,
          items: true
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" }
      }),
      prisma.deposit.count({ where: { deletedAt: null } })
    ]);

    return {
      deposits,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        limit
      }
    };
  }
}
