import { DashboardService } from "../src/services/DashboardService";
import { prisma } from "../src/lib/db";
import { redis } from "../src/lib/redis";

// Mock prisma and redis clients
jest.mock("../src/lib/db", () => ({
  prisma: {
    member: {
      count: jest.fn()
    },
    depositItem: {
      aggregate: jest.fn()
    },
    expense: {
      aggregate: jest.fn()
    },
    bankAccount: {
      findMany: jest.fn()
    }
  }
}));

jest.mock("../src/lib/redis", () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn()
  }
}));

describe("DashboardService Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getDashboardStats", () => {
    it("should return cached statistics if present in Redis", async () => {
      const cachedData = {
        totalMembers: 15,
        totalDepositsBdt: 15000,
        totalExpensesBdt: 4500,
        bankBalanceBdt: 8500,
        cashBalanceBdt: 2000,
        chartData: [
          {
            monthBN: "জুন ২০২৬",
            monthEN: "June 2026",
            collectionsBdt: 2500,
            expensesBdt: 1000
          }
        ]
      };

      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(cachedData));

      const stats = await DashboardService.getDashboardStats();

      expect(redis.get).toHaveBeenCalledWith("dashboard_stats");
      // Database should not be queried
      expect(prisma.member.count).not.toHaveBeenCalled();
      expect(stats).toEqual(cachedData);
    });

    it("should fetch metrics from database and write to cache if Redis cache misses", async () => {
      (redis.get as jest.Mock).mockResolvedValue(null);
      (prisma.member.count as jest.Mock).mockResolvedValue(22);

      // Setup Deposit aggregate mocks
      // The first call returns the total deposits.
      // The subsequent 6 calls in the loop return the monthly deposits.
      (prisma.depositItem.aggregate as jest.Mock)
        .mockResolvedValueOnce({ _sum: { amount: 650000 } }) // 6500 BDT total
        .mockResolvedValue({ _sum: { amount: 100000 } });   // 1000 BDT monthly

      // Setup Expense aggregate mocks
      // The first call returns the total expenses.
      // The subsequent 6 calls in the loop return the monthly expenses.
      (prisma.expense.aggregate as jest.Mock)
        .mockResolvedValueOnce({ _sum: { amount: 320000 } }) // 3200 BDT total
        .mockResolvedValue({ _sum: { amount: 50000 } });    // 500 BDT monthly

      // Setup Bank account list mock
      (prisma.bankAccount.findMany as jest.Mock).mockResolvedValue([
        { name: "Cash on Hand", balance: 150000 }, // 1500 BDT
        { name: "Dutch-Bangla Bank Ltd", balance: 350000 } // 3500 BDT
      ]);

      const stats = await DashboardService.getDashboardStats();

      expect(redis.get).toHaveBeenCalledWith("dashboard_stats");
      expect(prisma.member.count).toHaveBeenCalledWith({ where: { deletedAt: null } });
      
      // Total deposit aggregations should run 7 times in total
      expect(prisma.depositItem.aggregate).toHaveBeenCalledTimes(7);
      // Total expense aggregations should run 7 times in total
      expect(prisma.expense.aggregate).toHaveBeenCalledTimes(7);
      
      expect(prisma.bankAccount.findMany).toHaveBeenCalledWith({ where: { deletedAt: null } });

      // Verifies cache saving
      expect(redis.set).toHaveBeenCalledWith(
        "dashboard_stats",
        expect.any(String),
        "EX",
        30
      );

      // Verifies correct calculation conversions from Paisa to BDT
      expect(stats.totalMembers).toBe(22);
      expect(stats.totalDepositsBdt).toBe(6500);
      expect(stats.totalExpensesBdt).toBe(3200);
      expect(stats.cashBalanceBdt).toBe(1500);
      expect(stats.bankBalanceBdt).toBe(3500);
      expect(stats.chartData.length).toBe(6);
      expect(stats.chartData[0].collectionsBdt).toBe(1000);
      expect(stats.chartData[0].expensesBdt).toBe(500);
    });
  });

  describe("invalidateCache", () => {
    it("should delete the dashboard stats cache key from Redis", async () => {
      (redis.del as jest.Mock).mockResolvedValue(1);

      await DashboardService.invalidateCache();

      expect(redis.del).toHaveBeenCalledWith("dashboard_stats");
    });
  });
});
