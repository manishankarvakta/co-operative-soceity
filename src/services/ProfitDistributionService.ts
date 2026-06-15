import { prisma } from "../lib/db";
import { NotFoundError, ValidationError } from "../backend/errors";
import { AccountingService } from "./AccountingService";

export class ProfitDistributionService {
  /**
   * Calculates profit distribution splits without saving to the database.
   */
  static calculateSplits(totalProfit: number) {
    if (totalProfit <= 0) {
      throw new ValidationError("লভ্যাংশের পরিমাণ অবশ্যই পজিটিভ হতে হবে।");
    }

    const devFund = Math.round(totalProfit * 0.95);
    const destituteFund = Math.round(totalProfit * 0.025);
    // Adjust sportsFund to ensure total sum equals totalProfit
    const sportsFund = totalProfit - devFund - destituteFund;
    const fixedDeposit = Math.round(totalProfit * 0.075);

    return {
      totalProfit,
      devFund,
      destituteFund,
      sportsFund,
      fixedDeposit
    };
  }

  /**
   * Executes a general/year-end profit distribution.
   * Posts double-entry journal logs, adjusts target account balances, and creates the record.
   */
  static async executeGeneralDistribution(
    adminId: string,
    data: {
      amount: number; // Stored in Paisa/Cents
      paymentMode: "CASH" | "BANK";
    }
  ) {
    const splits = this.calculateSplits(data.amount);

    return await prisma.$transaction(async (tx) => {
      // 1. Validate source account funds for the FD Transfer leg
      let sourceBankAccount = null;
      if (data.paymentMode === "CASH") {
        sourceBankAccount = await tx.bankAccount.findFirst({
          where: { name: "Cash on Hand" }
        });
      } else {
        sourceBankAccount = await tx.bankAccount.findFirst({
          where: { NOT: { name: "Cash on Hand" } }
        });
      }

      if (!sourceBankAccount || sourceBankAccount.balance < splits.fixedDeposit) {
        throw new ValidationError(
          `এফডি রিজার্ভের জন্য পর্যাপ্ত ব্যালেন্স নেই। প্রয়োজনীয়: ${(splits.fixedDeposit / 100).toLocaleString()} BDT`
        );
      }

      // 2. Decrement source account balance
      await tx.bankAccount.update({
        where: { id: sourceBankAccount.id },
        data: { balance: { decrement: splits.fixedDeposit } }
      });

      // 3. Increment or create Fixed Deposit bank account
      let fdBankAccount = await tx.bankAccount.findFirst({
        where: { name: "Fixed Deposit Reserve" }
      });

      if (!fdBankAccount) {
        fdBankAccount = await tx.bankAccount.create({
          data: {
            name: "Fixed Deposit Reserve",
            accountNumber: "FD-RESERVE-01",
            balance: splits.fixedDeposit
          }
        });
      } else {
        await tx.bankAccount.update({
          where: { id: fdBankAccount.id },
          data: { balance: { increment: splits.fixedDeposit } }
        });
      }

      // 4. Create ProfitDistribution record
      const distribution = await tx.profitDistribution.create({
        data: {
          projectId: null, // Indicates general/year-end profit distribution
          totalProfit: splits.totalProfit,
          devFund: splits.devFund,
          destituteFund: splits.destituteFund,
          sportsFund: splits.sportsFund,
          fixedDeposit: splits.fixedDeposit
        }
      });

      // 5. Post Journal Entries:
      // Entry A: Profit Distribution
      // Debit: Investment Revenue (4020) — 100% of profit
      // Credit: Business Development Fund (3010) — 95%
      // Credit: Poor & Destitute Fund (3020) — 2.5%
      // Credit: Sports & Entertainment Fund (3030) — 2.5%
      await AccountingService.postJournalEntry(tx, {
        reference: `DIST-${distribution.id.substring(0, 4).toUpperCase()}`,
        description: `বার্ষিক নিট লভ্যাংশ বন্টন ও সাধারণ তহবিল স্থানান্তর`,
        date: new Date(),
        lines: [
          { accountCode: "4020", amount: splits.totalProfit, type: "DEBIT" },
          { accountCode: "3010", amount: splits.devFund, type: "CREDIT" },
          { accountCode: "3020", amount: splits.destituteFund, type: "CREDIT" },
          { accountCode: "3030", amount: splits.sportsFund, type: "CREDIT" }
        ]
      });

      // Entry B: Fixed Deposit Transfer
      // Debit: Fixed Deposit Account (1030) — 7.5%
      // Credit: Cash on Hand (1000) or Bank Account (1010) — 7.5%
      const creditAssetCode = data.paymentMode === "CASH" ? "1000" : "1010";
      await AccountingService.postJournalEntry(tx, {
        reference: `FD-${distribution.id.substring(0, 4).toUpperCase()}`,
        description: `লভ্যাংশ হতে ৭.৫% স্থায়ী আমানত (FD Reserve) তহবিলে স্থানান্তর`,
        date: new Date(),
        lines: [
          { accountCode: "1030", amount: splits.fixedDeposit, type: "DEBIT" },
          { accountCode: creditAssetCode, amount: splits.fixedDeposit, type: "CREDIT" }
        ]
      });

      return distribution;
    });
  }

  /**
   * Lists all past distributions (general and project-specific).
   */
  static async listDistributions() {
    return await prisma.profitDistribution.findMany({
      orderBy: { createdAt: "desc" }
    });
  }
}
