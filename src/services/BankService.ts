import { prisma } from "../lib/db";
import { NotFoundError, ValidationError } from "../backend/errors";
import { DashboardService } from "./DashboardService";
import { TransactionType } from "@prisma/client";
import { AccountingService } from "./AccountingService";
import { NotificationService } from "./NotificationService";
import { AuditService } from "./AuditService";

export class BankService {
  /**
   * Creates a new Bank or Cash on Hand account.
   */
  static async createAccount(
    data: { name: string; accountNumber: string; initialBalance: number },
    actorId?: string | null
  ) {
    const existing = await prisma.bankAccount.findUnique({
      where: { accountNumber: data.accountNumber }
    });

    if (existing && !existing.deletedAt) {
      throw new ValidationError("এই অ্যাকাউন্ট নম্বরটি ইতিমধ্যে ব্যবহার করা হয়েছে।");
    }

    return await prisma.$transaction(async (tx) => {
      const account = await tx.bankAccount.create({
        data: {
          name: data.name,
          accountNumber: data.accountNumber,
          balance: data.initialBalance
        }
      });

      await AuditService.log({
        userId: actorId || null,
        action: "CREATE",
        tableName: "BankAccount",
        recordId: account.id,
        newData: account,
        tx
      });

      // Post initial balance journal entries if initialBalance > 0
      if (data.initialBalance > 0) {
        const isCash = data.name === "Cash on Hand";
        const assetCode = isCash ? "1000" : "1010";

        await AccountingService.postJournalEntry(tx, {
          reference: "INIT",
          description: `${data.name} অ্যাকাউন্টের প্রারম্ভিক জমা তহবিল`,
          date: new Date(),
          lines: [
            { accountCode: assetCode, amount: data.initialBalance, type: "DEBIT" },
            { accountCode: "3000", amount: data.initialBalance, type: "CREDIT" } // Member Share Capital / Equity
          ]
        });
      }

      return account;
    });
  }

  /**
   * Lists all active bank/cash accounts.
   */
  static async listAccounts() {
    return await prisma.bankAccount.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" }
    });
  }

  /**
   * Creates a pending deposit or withdrawal bank transaction.
   */
  static async createTransaction(data: {
    bankAccountId: string;
    amount: number; // Stored in Paisa/Cents
    type: "DEBIT" | "CREDIT";
    reference?: string | null;
  }) {
    const account = await prisma.bankAccount.findUnique({
      where: { id: data.bankAccountId }
    });

    if (!account || account.deletedAt) {
      throw new NotFoundError("ব্যাংক অ্যাকাউন্ট খুঁজে পাওয়া যায়নি।");
    }

    // Overdraft check for withdrawal during entry creation phase
    if (data.type === "DEBIT" && account.balance < data.amount) {
      throw new ValidationError("পর্যাপ্ত ব্যালেন্স নেই।");
    }

    return await prisma.bankTransaction.create({
      data: {
        bankAccountId: data.bankAccountId,
        amount: data.amount,
        type: data.type as TransactionType,
        reference: data.reference || undefined,
        isApproved: false
      }
    });
  }

  /**
   * Records a transfer transaction between two accounts.
   * Creates linked withdrawal and deposit transactions.
   */
  static async createTransfer(
    data: {
      sourceBankAccountId: string;
      destinationBankAccountId: string;
      amount: number;
      reference?: string | null;
    },
    actorId?: string | null
  ) {
    if (data.sourceBankAccountId === data.destinationBankAccountId) {
      throw new ValidationError("উৎস ও গন্তব্য অ্যাকাউন্ট একই হতে পারবে না।");
    }

    const source = await prisma.bankAccount.findUnique({
      where: { id: data.sourceBankAccountId }
    });
    const dest = await prisma.bankAccount.findUnique({
      where: { id: data.destinationBankAccountId }
    });

    if (!source || source.deletedAt || !dest || dest.deletedAt) {
      throw new NotFoundError("উৎস বা গন্তব্য অ্যাকাউন্ট খুঁজে পাওয়া যায়নি।");
    }

    // Overdraft check
    if (source.balance < data.amount) {
      throw new ValidationError("উৎস অ্যাকাউন্টে পর্যাপ্ত ব্যালেন্স নেই।");
    }

    const transferRef = `TRANSFER-${Date.now()}`;
    const formattedRef = `${transferRef} ${data.reference || ""}`.trim();

    const result = await prisma.$transaction(async (tx) => {
      // 1. Withdrawal transaction (DEBIT) on source account
      const txDebit = await tx.bankTransaction.create({
        data: {
          bankAccountId: data.sourceBankAccountId,
          amount: data.amount,
          type: TransactionType.DEBIT,
          reference: formattedRef,
          isApproved: false
        }
      });

      // 2. Deposit transaction (CREDIT) on destination account
      await tx.bankTransaction.create({
        data: {
          bankAccountId: data.destinationBankAccountId,
          amount: data.amount,
          type: TransactionType.CREDIT,
          reference: formattedRef,
          isApproved: false
        }
      });

      return txDebit;
    });

    await AuditService.log({
      userId: actorId || null,
      action: "CREATE",
      tableName: "BankTransaction",
      recordId: result.id,
      newData: result
    });

    return result;
  }

  /**
   * Records a joint signature approval. Once all 3 roles approve, commits balance and journal entries.
   */
  static async signTransaction(
    userId: string,
    id: string,
    signatureType: "PRESIDENT" | "SECRETARY" | "TREASURER"
  ) {
    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.bankTransaction.findUnique({
        where: { id },
        include: { bankAccount: true }
      });

      if (!transaction || transaction.deletedAt) {
        throw new NotFoundError("লেনদেন বিবরণী খুঁজে পাওয়া যায়নি।");
      }

      if (transaction.isApproved) {
        throw new ValidationError("এই লেনদেনটি ইতিমধ্যে অনুমোদিত হয়েছে।");
      }

      const updateData: any = {};
      if (signatureType === "PRESIDENT") updateData.presidentApproved = true;
      if (signatureType === "SECRETARY") updateData.secretaryApproved = true;
      if (signatureType === "TREASURER") updateData.treasurerApproved = true;

      // Update signature fields
      const updatedTx = await tx.bankTransaction.update({
        where: { id },
        data: updateData,
        include: { bankAccount: true }
      });

      // Log the APPROVE audit entry for joint signatures
      await AuditService.log({
        userId,
        action: "APPROVE",
        tableName: "BankTransaction",
        recordId: id,
        oldData: transaction,
        newData: updatedTx,
        tx
      });

      // Check if all 3 joint signatures are now true
      const isApprovedNow =
        updatedTx.presidentApproved &&
        updatedTx.secretaryApproved &&
        updatedTx.treasurerApproved;

      if (isApprovedNow) {
        // Enforce overdraft block for DEBIT transactions
        if (updatedTx.type === TransactionType.DEBIT && updatedTx.bankAccount.balance < updatedTx.amount) {
          throw new ValidationError("পর্যাপ্ত ব্যাংক ব্যালেন্স নেই।");
        }

        // 1. Commit bank account balance update
        const balanceChange =
          updatedTx.type === TransactionType.CREDIT ? updatedTx.amount : -updatedTx.amount;

        await tx.bankAccount.update({
          where: { id: updatedTx.bankAccountId },
          data: { balance: { increment: balanceChange } }
        });

        // 2. Auto-post balanced double entry journal lines
        const isCash = updatedTx.bankAccount.name === "Cash on Hand";
        const assetCode = isCash ? "1000" : "1010";

        if (updatedTx.type === TransactionType.CREDIT) {
          // Deposit: Debit Cash/Bank, Credit Revenue or Equity
          await AccountingService.postJournalEntry(tx, {
            reference: updatedTx.id.substring(0, 8).toUpperCase(),
            description: `ব্যাংক ডিপোজিট অনুমোদন - ${updatedTx.bankAccount.name} (${updatedTx.reference || ""})`,
            date: new Date(),
            lines: [
              { accountCode: assetCode, amount: updatedTx.amount, type: "DEBIT" },
              { accountCode: "4020", amount: updatedTx.amount, type: "CREDIT" } // General Investment Income
            ]
          });
        } else {
          // Withdrawal or Transfer Withdrawal leg
          // Check if this is a Transfer by reading reference prefix
          const isTransfer = updatedTx.reference?.startsWith("TRANSFER-") ?? false;

          if (isTransfer) {
            const transferRef = updatedTx.reference!.split(" ")[0];
            // Find the sister deposit transaction of this transfer
            const sisterTx = await tx.bankTransaction.findFirst({
              where: {
                reference: { startsWith: transferRef },
                type: TransactionType.CREDIT,
                id: { not: updatedTx.id }
              },
              include: { bankAccount: true }
            });

            if (sisterTx) {
              // Mark sister as approved and update destination bank account balance too
              await tx.bankTransaction.update({
                where: { id: sisterTx.id },
                data: {
                  presidentApproved: true,
                  secretaryApproved: true,
                  treasurerApproved: true,
                  isApproved: true
                }
              });

              await tx.bankAccount.update({
                where: { id: sisterTx.bankAccountId },
                data: { balance: { increment: sisterTx.amount } }
              });

              const destIsCash = sisterTx.bankAccount.name === "Cash on Hand";
              const destAssetCode = destIsCash ? "1000" : "1010";

              // Post double entry transfer journal
              await AccountingService.postJournalEntry(tx, {
                reference: updatedTx.id.substring(0, 8).toUpperCase(),
                description: `তহবিল স্থানান্তর - ${updatedTx.bankAccount.name} থেকে ${sisterTx.bankAccount.name}`,
                date: new Date(),
                lines: [
                  { accountCode: destAssetCode, amount: updatedTx.amount, type: "DEBIT" }, // Debit Destination (increases)
                  { accountCode: assetCode, amount: updatedTx.amount, type: "CREDIT" } // Credit Source (decreases)
                ]
              });
            }
          } else {
            // Standard withdrawal: Credit Bank Asset, Debit Expense Account
            await AccountingService.postJournalEntry(tx, {
              reference: updatedTx.id.substring(0, 8).toUpperCase(),
              description: `ব্যাংক প্রত্যাহার অনুমোদন - ${updatedTx.bankAccount.name} (${updatedTx.reference || ""})`,
              date: new Date(),
              lines: [
                { accountCode: "5030", amount: updatedTx.amount, type: "DEBIT" }, // Debit General Expense
                { accountCode: assetCode, amount: updatedTx.amount, type: "CREDIT" } // Credit Cash/Bank Asset
              ]
            });
          }
        }

        // Set approved status on the primary transaction
        return await tx.bankTransaction.update({
          where: { id },
          data: { isApproved: true }
        });
      }
      return updatedTx;
    });

    await DashboardService.invalidateCache();

    // Trigger Approval Notification
    if (result && result.isApproved) {
      try {
        const signer = prisma.user ? await prisma.user.findUnique({ where: { id: userId } }) : null;
        const signerEmail = signer?.email || "admin@somity.com";

        await NotificationService.sendApprovalNotice(
          signerEmail,
          "BANK_TRANSACTION",
          result.reference || id.substring(0, 8).toUpperCase(),
          result.amount / 100,
          signatureType,
          userId
        );
      } catch (err) {
        console.error("Bank transaction approval notification trigger failed:", err);
      }
    }

    return result;
  }

  /**
   * Lists recent bank transactions with pagination.
   */
  static async listTransactions(params: { page?: number; limit?: number; bankAccountId?: string }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const whereClause: any = { deletedAt: null };
    if (params.bankAccountId) whereClause.bankAccountId = params.bankAccountId;

    const [transactions, totalCount] = await Promise.all([
      prisma.bankTransaction.findMany({
        where: whereClause,
        include: { bankAccount: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      prisma.bankTransaction.count({ where: whereClause })
    ]);

    return {
      transactions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        limit
      }
    };
  }
}
