import { prisma } from "../lib/db";
import { NotFoundError } from "../backend/errors";

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
}
