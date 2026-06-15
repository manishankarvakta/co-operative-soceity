import { prisma } from "@/lib/db";
import { NotFoundError, ValidationError } from "@/backend/errors";
import { ProjectStatus } from "@prisma/client";
import { AccountingService } from "./AccountingService";

export class ProjectService {
  /**
   * Creates a new investment project.
   */
  static async createProject(data: { name: string; location: string; targetCapital: number }) {
    return await prisma.project.create({
      data: {
        name: data.name,
        location: data.location,
        targetCapital: data.targetCapital,
        currentCapital: 0,
        status: ProjectStatus.FUNDING
      }
    });
  }

  /**
   * Records a member's investment capital in a project.
   * Increments project capital, increments bank balance, and posts double-entry journal.
   */
  static async recordInvestment(data: {
    projectId: string;
    memberId: string;
    amount: number; // Stored in Paisa/Cents
    paymentMode: "CASH" | "BANK";
  }) {
    const project = await prisma.project.findUnique({
      where: { id: data.projectId }
    });

    if (!project || project.deletedAt) {
      throw new NotFoundError("প্রজেক্ট খুঁজে পাওয়া যায়নি।");
    }

    if (project.status !== ProjectStatus.FUNDING && project.status !== ProjectStatus.ACTIVE) {
      throw new ValidationError("এই প্রজেক্টে বর্তমানে বিনিয়োগ গ্রহণ করা সম্ভব নয়।");
    }

    const member = await prisma.member.findUnique({
      where: { id: data.memberId }
    });

    if (!member || member.deletedAt) {
      throw new NotFoundError("সদস্য খুঁজে পাওয়া যায়নি।");
    }

    if (member.status === "SUSPENDED") {
      throw new ValidationError("সদস্য অ্যাকাউন্টটি সাসপেন্ড রয়েছে। বিনিয়োগ করার অনুমতি নেই।");
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Create ProjectInvestment record
      const investment = await tx.projectInvestment.create({
        data: {
          projectId: data.projectId,
          memberId: data.memberId,
          amount: data.amount
        }
      });

      // 2. Increment project current capital
      await tx.project.update({
        where: { id: data.projectId },
        data: { currentCapital: { increment: data.amount } }
      });

      // 3. Increment primary cash/bank account balance
      let bankAccount = null;
      if (data.paymentMode === "CASH") {
        bankAccount = await tx.bankAccount.findFirst({
          where: { name: "Cash on Hand" }
        });
      } else {
        bankAccount = await tx.bankAccount.findFirst({
          where: { NOT: { name: "Cash on Hand" } }
        });
      }

      if (bankAccount) {
        await tx.bankAccount.update({
          where: { id: bankAccount.id },
          data: { balance: { increment: data.amount } }
        });
      }

      // 4. Auto-post balanced Double Entry Journal Entry
      const assetCode = data.paymentMode === "CASH" ? "1000" : "1010";
      
      await AccountingService.postJournalEntry(tx, {
        reference: investment.id.substring(0, 8).toUpperCase(),
        description: `প্রজেক্ট বিনিয়োগ - ${project.name} (${member.name})`,
        date: new Date(),
        lines: [
          { accountCode: assetCode, amount: data.amount, type: "DEBIT" }, // Debit Cash/Bank Asset (increases)
          { accountCode: "3000", amount: data.amount, type: "CREDIT" } // Credit Member Share Capital Equity (increases)
        ]
      });

      return investment;
    });
  }

  /**
   * Calculates capital contribution ratio and projected ROI parameters for a project.
   */
  static async calculateROI(projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        investments: {
          where: { deletedAt: null },
          include: { member: true }
        }
      }
    });

    if (!project || project.deletedAt) {
      throw new NotFoundError("প্রজেক্ট খুঁজে পাওয়া যায়নি।");
    }

    const totalCapital = project.investments.reduce((sum, inv) => sum + inv.amount, 0);

    const membersRatios = project.investments.map((inv) => {
      const ratio = totalCapital > 0 ? inv.amount / totalCapital : 0;
      return {
        memberId: inv.memberId,
        memberCode: inv.member.memberCode,
        memberName: inv.member.name,
        amount: inv.amount / 100, // Convert to BDT
        ratio: ratio,
        percentage: ratio * 100
      };
    });

    return {
      projectId: project.id,
      projectName: project.name,
      totalCapitalBdt: totalCapital / 100,
      ratios: membersRatios
    };
  }

  /**
   * Distributes profit to project investors proportional to their capital share.
   * Logs distributions under ProfitDistribution and posts balanced journal entries.
   */
  static async distributeProjectProfit(
    projectId: string,
    data: {
      totalProfit: number; // Stored in Paisa/Cents
    }
  ) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        investments: {
          where: { deletedAt: null },
          include: { member: true }
        }
      }
    });

    if (!project || project.deletedAt) {
      throw new NotFoundError("প্রজেক্ট খুঁজে পাওয়া যায়নি।");
    }

    if (project.investments.length === 0) {
      throw new ValidationError("প্রজেক্টে কোনো বিনিয়োগকারী পাওয়া যায়নি।");
    }

    const totalCapital = project.investments.reduce((sum, inv) => sum + inv.amount, 0);
    if (totalCapital <= 0) {
      throw new ValidationError("প্রজেক্টে বিনিয়োগকৃত মূলধনের পরিমাণ শূন্য।");
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Calculate standard splits (95% Dev, 2.5% Destitute, 2.5% Sports, 7.5% FD as reserve)
      const devFund = Math.round(data.totalProfit * 0.95);
      const destituteFund = Math.round(data.totalProfit * 0.025);
      const sportsFund = Math.round(data.totalProfit * 0.025);
      const fixedDeposit = Math.round(data.totalProfit * 0.075);

      // Create ProfitDistribution record
      const distribution = await tx.profitDistribution.create({
        data: {
          projectId,
          totalProfit: data.totalProfit,
          devFund,
          destituteFund,
          sportsFund,
          fixedDeposit
        }
      });

      // 2. Loop investors and distribute profit share proportional to investment ratios
      for (const inv of project.investments) {
        const ratio = inv.amount / totalCapital;
        const memberSharePaisa = Math.round(data.totalProfit * ratio);

        if (memberSharePaisa > 0) {
          // Double-Entry Posting:
          // Debit: Investment Revenue (Code 4020) — decreases organization's revenue
          // Credit: Member Savings (Code 2000) — increases member savings balance (liability)
          await AccountingService.postJournalEntry(tx, {
            reference: `ROI-${project.id.substring(0, 4).toUpperCase()}`,
            description: `লভ্যাংশ বন্টন - ${project.name} (${inv.member.name})`,
            date: new Date(),
            lines: [
              { accountCode: "4020", amount: memberSharePaisa, type: "DEBIT" }, // Debit Income account
              { accountCode: "2000", amount: memberSharePaisa, type: "CREDIT" } // Credit Member Savings liability
            ]
          });
        }
      }

      // 3. Mark project completed if profit is distributed and status closing is preferred
      await tx.project.update({
        where: { id: projectId },
        data: { status: ProjectStatus.COMPLETED }
      });

      return distribution;
    });
  }

  /**
   * Lists active projects.
   */
  static async listProjects() {
    return await prisma.project.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" }
    });
  }
}
