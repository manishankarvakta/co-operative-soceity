import { prisma } from "@/lib/db";
import { NotFoundError, ValidationError } from "@/backend/errors";
import { AuditService } from "./AuditService";
import { DashboardService } from "./DashboardService";
import { AccountingService } from "./AccountingService";
import { MemberService } from "./MemberService";
import * as bcrypt from "bcryptjs";

export class ShareService {
  /**
   * Retrieves the Share Ledger: a paginated summary of all members and their total shares.
   */
  static async getShareLedger(params: { page?: number; limit?: number; search?: string }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;
    const search = params.search || "";

    const whereClause: any = { deletedAt: null };
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { memberCode: { contains: search, mode: "insensitive" } }
      ];
    }

    const [members, totalCount] = await Promise.all([
      prisma.member.findMany({
        where: whereClause,
        include: {
          shares: {
            where: { deletedAt: null }
          }
        },
        orderBy: { memberCode: "asc" }
      }),
      prisma.member.count({ where: whereClause })
    ]);

    // Compute total shares per member and calculate values
    const ledger = members.map((m) => {
      const totalShares = m.shares.reduce(
        (sum, s) => sum + (parseFloat(s.count as any) || 0),
        0
      );
      // Find the latest transaction date
      const latestTx = m.shares.length > 0 
        ? m.shares.reduce((latest, current) => 
            new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
          )
        : null;

      return {
        memberId: m.id,
        memberCode: m.memberCode,
        name: m.name,
        phone: m.phone,
        status: m.status,
        totalShares,
        totalValue: totalShares * 1000, // 1 Share = 1,000 BDT
        lastTransactionDate: latestTx ? latestTx.createdAt : null
      };
    });

    // Sort by total shares descending, or member code if shares are equal
    ledger.sort((a, b) => b.totalShares - a.totalShares || a.memberCode.localeCompare(b.memberCode));

    // Slice for pagination
    const paginatedLedger = ledger.slice(skip, skip + limit);

    return {
      ledger: paginatedLedger,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        limit
      }
    };
  }

  /**
   * Retrieves chronological share records for a specific member.
   */
  static async getMemberShareHistory(
    memberId: string,
    params: { page?: number; limit?: number }
  ) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const member = await prisma.member.findUnique({
      where: { id: memberId }
    });

    if (!member || member.deletedAt) {
      throw new NotFoundError("সদস্য খুঁজে পাওয়া যায়নি।");
    }

    const [shareRecords, totalCount] = await Promise.all([
      prisma.shareRecord.findMany({
        where: { memberId, deletedAt: null },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      prisma.shareRecord.count({
        where: { memberId, deletedAt: null }
      })
    ]);

    // Fetch related deposits to display receipt numbers and details
    const txIds = shareRecords
      .map((r) => r.transactionId)
      .filter(Boolean) as string[];

    const deposits = txIds.length > 0
      ? await prisma.deposit.findMany({
          where: { id: { in: txIds } }
        })
      : [];

    const depositMap = new Map<string, any>(deposits.map((d) => [d.id, d]));

    const history = shareRecords.map((r) => {
      const deposit = r.transactionId ? depositMap.get(r.transactionId) : null;
      let receiptCode = "N/A";
      let details = "সরাসরি শেয়ার বরাদ্দ / Share Allocation";

      if (deposit && deposit.remarks) {
        if (deposit.remarks.startsWith("REC-")) {
          receiptCode = deposit.remarks.split(" ")[0];
          details = `সাপ্তাহিক জমা রসিদ ${receiptCode} থেকে স্বয়ংক্রিয় বরাদ্দ`;
        } else {
          details = deposit.remarks;
        }
      }

      const countVal = parseFloat(r.count as any) || 0;

      return {
        id: r.id,
        count: countVal,
        value: countVal * 1000,
        createdAt: r.createdAt,
        transactionId: r.transactionId,
        receiptCode,
        details
      };
    });

    return {
      member: {
        id: member.id,
        name: member.name,
        memberCode: member.memberCode
      },
      history,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        limit
      }
    };
  }

  /**
   * Retrieves aggregate share reports statistics.
   */
  static async getShareReports() {
    const allRecords = await prisma.shareRecord.findMany({
      where: { deletedAt: null },
      include: {
        member: true
      }
    });

    // Total outstanding shares
    const totalShares = allRecords.reduce(
      (sum, r) => sum + (parseFloat(r.count as any) || 0),
      0
    );

    // Sum shares per member to count active shareholders
    const memberSharesMap = new Map<string, number>();
    allRecords.forEach((r) => {
      const current = memberSharesMap.get(r.memberId) || 0;
      memberSharesMap.set(r.memberId, current + (parseFloat(r.count as any) || 0));
    });

    let activeShareholdersCount = 0;
    const brackets = {
      tier1: 0, // 1-10 shares
      tier2: 0, // 11-50 shares
      tier3: 0, // 51-100 shares
      tier4: 0  // 100+ shares
    };

    memberSharesMap.forEach((shares) => {
      if (shares > 0) {
        activeShareholdersCount++;
        if (shares <= 10) brackets.tier1++;
        else if (shares <= 50) brackets.tier2++;
        else if (shares <= 100) brackets.tier3++;
        else brackets.tier4++;
      }
    });

    // Fetch the 5 most recent share transaction records
    const recentRecords = await prisma.shareRecord.findMany({
      where: { deletedAt: null },
      include: {
        member: true
      },
      orderBy: { createdAt: "desc" },
      take: 5
    });

    // Parse receipt codes for recent logs
    const txIds = recentRecords
      .map((r) => r.transactionId)
      .filter(Boolean) as string[];

    const deposits = txIds.length > 0
      ? await prisma.deposit.findMany({
          where: { id: { in: txIds } }
        })
      : [];

    const depositMap = new Map<string, any>(deposits.map((d) => [d.id, d]));

    const recentLogs = recentRecords.map((r) => {
      const deposit = r.transactionId ? depositMap.get(r.transactionId) : null;
      let receiptCode = "N/A";
      if (deposit && deposit.remarks && deposit.remarks.startsWith("REC-")) {
        receiptCode = deposit.remarks.split(" ")[0];
      }

      return {
        id: r.id,
        memberCode: r.member.memberCode,
        memberName: r.member.name,
        count: parseFloat(r.count as any) || 0,
        value: (parseFloat(r.count as any) || 0) * 1000,
        createdAt: r.createdAt,
        receiptCode
      };
    });

    return {
      summary: {
        totalSharesIssued: totalShares,
        totalCapitalizationBdt: totalShares * 1000,
        activeShareholders: activeShareholdersCount
      },
      distribution: {
        "1-10 Shares (১-১০ শেয়ার)": brackets.tier1,
        "11-50 Shares (১১-৫০ শেয়ার)": brackets.tier2,
        "51-100 Shares (৫১-১০০ শেয়ার)": brackets.tier3,
        "100+ Shares (১০০+ শেয়ার)": brackets.tier4
      },
      recentLogs
    };
  }

  /**
   * Transfers all outstanding shares from a deceased member to their nominee or an existing member.
   * Marks the deceased member as INACTIVE and posts double-entry accounting records.
   */
  static async transferSharesOnDeath(data: {
    deceasedMemberId: string;
    recipientType: "NOMINEE" | "MEMBER";
    recipientId?: string;
    actorId: string;
  }) {
    const deceased = await prisma.member.findUnique({
      where: { id: data.deceasedMemberId },
      include: { nominee: true, shares: { where: { deletedAt: null } } }
    });

    if (!deceased || deceased.deletedAt) {
      throw new NotFoundError("মৃত সদস্য খুঁজে পাওয়া যায়নি।");
    }

    const totalShares = deceased.shares.reduce(
      (sum, s) => sum + (parseFloat(s.count as any) || 0),
      0
    );

    if (totalShares <= 0) {
      throw new ValidationError("মৃত সদস্যের কোনো শেয়ার নেই যা স্থানান্তর করা যাবে।");
    }

    let recipientMemberId: string;

    const result = await prisma.$transaction(async (tx) => {
      if (data.recipientType === "NOMINEE") {
        if (!deceased.nominee) {
          throw new ValidationError("মৃত সদস্যের কোনো নমিনি নেই।");
        }

        // Check if nominee is already registered as a member using phone number
        let nomineeMember = await tx.member.findUnique({
          where: { phone: deceased.nominee.phone }
        });

        if (!nomineeMember || nomineeMember.deletedAt) {
          // Register nominee as a new member
          const parsedJoinDate = new Date();
          const memberCode = await MemberService.generateMemberCode(parsedJoinDate);

          const salt = await bcrypt.genSalt(12);
          const defaultPasswordHash = await bcrypt.hash(deceased.nominee.phone, salt);
          const defaultEmail = `${memberCode.toLowerCase()}@somity.com`;

          const user = await tx.user.create({
            data: {
              email: defaultEmail,
              passwordHash: defaultPasswordHash,
              userRoles: {
                create: {
                  role: {
                    connect: { name: "MEMBER" }
                  }
                }
              }
            }
          });

          nomineeMember = await tx.member.create({
            data: {
              userId: user.id,
              memberCode,
              name: deceased.nominee.name,
              phone: deceased.nominee.phone,
              email: defaultEmail,
              address: deceased.nominee.address,
              joinDate: parsedJoinDate,
              status: "ACTIVE"
            }
          });
        }

        recipientMemberId = nomineeMember.id;
      } else {
        if (!data.recipientId) {
          throw new ValidationError("স্থানান্তরের জন্য গ্রহীতা সদস্যের আইডি প্রয়োজন।");
        }
        const recipient = await tx.member.findUnique({
          where: { id: data.recipientId }
        });
        if (!recipient || recipient.deletedAt) {
          throw new NotFoundError("গ্রহীতা সদস্য খুঁজে পাওয়া যায়নি।");
        }
        recipientMemberId = recipient.id;
      }

      const today = new Date();
      const valuePaisa = totalShares * 1000 * 100; // 1 share = 1,000 BDT = 100,000 Paisa

      // Create negative share record for deceased member
      await tx.shareRecord.create({
        data: {
          memberId: deceased.id,
          count: -totalShares,
          createdAt: today
        }
      });

      // Create positive share record for recipient member
      await tx.shareRecord.create({
        data: {
          memberId: recipientMemberId,
          count: totalShares,
          createdAt: today
        }
      });

      // Post double-entry journal logs to attribute equity to the recipient
      const reference = `DTH-TR-${deceased.memberCode.replace("SOM-", "")}`;
      await AccountingService.postJournalEntry(tx, {
        reference,
        description: `মৃত সদস্য ${deceased.name} (${deceased.memberCode}) এর শেয়ার স্থানান্তর গ্রহীতা সদস্য আইডি ${recipientMemberId} এ`,
        date: today,
        lines: [
          {
            accountCode: "3000",
            amount: valuePaisa,
            type: "DEBIT"
          },
          {
            accountCode: "3000",
            amount: valuePaisa,
            type: "CREDIT"
          }
        ]
      });

      // Update deceased member status to INACTIVE
      await tx.member.update({
        where: { id: deceased.id },
        data: { status: "INACTIVE" }
      });

      // Write transaction logs
      await AuditService.log({
        userId: data.actorId,
        action: "UPDATE",
        tableName: "ShareRecord",
        recordId: deceased.id,
        oldData: { totalShares },
        newData: { transferredTo: recipientMemberId, count: totalShares },
        tx
      });

      return {
        success: true,
        transferredShares: totalShares,
        recipientMemberId
      };
    });

    await DashboardService.invalidateCache();
    return result;
  }
}
