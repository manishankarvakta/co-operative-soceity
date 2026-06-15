import { ShareService } from "../src/services/ShareService";
import { prisma } from "../src/lib/db";

// Mock database execution
jest.mock("../src/lib/db", () => ({
  prisma: {
    member: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn()
    },
    shareRecord: {
      findMany: jest.fn(),
      count: jest.fn()
    },
    deposit: {
      findMany: jest.fn()
    }
  }
}));

describe("ShareService Business Logic", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getShareLedger", () => {
    it("should retrieve ledger items and calculate total shares and BDT values sorted by total shares descending", async () => {
      const mockMembers = [
        {
          id: "member-1",
          memberCode: "MEM-001",
          name: "Ariful Islam",
          phone: "01712345678",
          status: "ACTIVE",
          shares: [
            { id: "s1", count: 10.0, createdAt: new Date("2026-06-10T10:00:00Z") },
            { id: "s2", count: 5.5, createdAt: new Date("2026-06-12T10:00:00Z") }
          ]
        },
        {
          id: "member-2",
          memberCode: "MEM-002",
          name: "Sajib Ahmed",
          phone: "01812345678",
          status: "ACTIVE",
          shares: [
            { id: "s3", count: 25.0, createdAt: new Date("2026-06-14T10:00:00Z") }
          ]
        }
      ];

      (prisma.member.findMany as jest.Mock).mockResolvedValue(mockMembers);
      (prisma.member.count as jest.Mock).mockResolvedValue(2);

      const result = await ShareService.getShareLedger({ page: 1, limit: 10 });

      expect(result.ledger).toHaveLength(2);
      
      // Sorted by shares descending: member-2 has 25.0, member-1 has 15.5
      expect(result.ledger[0].memberId).toBe("member-2");
      expect(result.ledger[0].totalShares).toBe(25.0);
      expect(result.ledger[0].totalValue).toBe(25000); // 25.0 * 1000

      expect(result.ledger[1].memberId).toBe("member-1");
      expect(result.ledger[1].totalShares).toBe(15.5);
      expect(result.ledger[1].totalValue).toBe(15500); // 15.5 * 1000
      expect(new Date(result.ledger[1].lastTransactionDate!).toISOString()).toBe(new Date("2026-06-12T10:00:00Z").toISOString());
    });
  });

  describe("getMemberShareHistory", () => {
    it("should throw NotFoundError if member profile is missing", async () => {
      (prisma.member.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        ShareService.getMemberShareHistory("member-99", { page: 1, limit: 10 })
      ).rejects.toThrow("সদস্য খুঁজে পাওয়া যায়নি।");
    });

    it("should return parsed chronological share history mapped with deposit receipt code", async () => {
      (prisma.member.findUnique as jest.Mock).mockResolvedValue({
        id: "member-1",
        name: "Ariful Islam",
        memberCode: "MEM-001"
      });

      const mockShareRecords = [
        {
          id: "r1",
          memberId: "member-1",
          transactionId: "deposit-1",
          count: 5.0,
          createdAt: new Date("2026-06-12T10:00:00Z")
        }
      ];

      const mockDeposits = [
        {
          id: "deposit-1",
          remarks: "REC-20260612-0001 Weekly payment"
        }
      ];

      (prisma.shareRecord.findMany as jest.Mock).mockResolvedValue(mockShareRecords);
      (prisma.shareRecord.count as jest.Mock).mockResolvedValue(1);
      (prisma.deposit.findMany as jest.Mock).mockResolvedValue(mockDeposits);

      const result = await ShareService.getMemberShareHistory("member-1", { page: 1, limit: 10 });

      expect(result.member.name).toBe("Ariful Islam");
      expect(result.history).toHaveLength(1);
      expect(result.history[0].count).toBe(5.0);
      expect(result.history[0].receiptCode).toBe("REC-20260612-0001");
      expect(result.history[0].details).toBe("সাপ্তাহিক জমা রসিদ REC-20260612-0001 থেকে স্বয়ংক্রিয় বরাদ্দ");
    });
  });

  describe("getShareReports", () => {
    it("should calculate total issued shares, cumulative capitalization, and bracket distribution lists", async () => {
      const mockRecords = [
        { memberId: "m1", count: 8.5, createdAt: new Date(), member: { id: "m1", memberCode: "MEM-001", name: "User 1" } },
        { memberId: "m1", count: 2.0, createdAt: new Date(), member: { id: "m1", memberCode: "MEM-001", name: "User 1" } }, // total m1 = 10.5 (tier2)
        { memberId: "m2", count: 4.0, createdAt: new Date(), member: { id: "m2", memberCode: "MEM-002", name: "User 2" } }, // total m2 = 4.0 (tier1)
        { memberId: "m3", count: 120.0, createdAt: new Date(), member: { id: "m3", memberCode: "MEM-003", name: "User 3" } } // total m3 = 120.0 (tier4)
      ];

      (prisma.shareRecord.findMany as jest.Mock).mockResolvedValue(mockRecords);

      const result = await ShareService.getShareReports();

      expect(result.summary.totalSharesIssued).toBe(134.5); // 10.5 + 4.0 + 120.0
      expect(result.summary.totalCapitalizationBdt).toBe(134500); // 134.5 * 1000
      expect(result.summary.activeShareholders).toBe(3);

      expect(result.distribution["1-10 Shares (১-১০ শেয়ার)"]).toBe(1); // m2
      expect(result.distribution["11-50 Shares (১১-৫০ শেয়ার)"]).toBe(1); // m1
      expect(result.distribution["51-100 Shares (৫১-১০০ শেয়ার)"]).toBe(0);
      expect(result.distribution["100+ Shares (১০০+ শেয়ার)"]).toBe(1); // m3
    });
  });
});
