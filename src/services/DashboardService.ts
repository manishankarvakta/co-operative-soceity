import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";

export class DashboardService {
  /**
   * Invalidates the dashboard cache.
   */
  static async invalidateCache() {
    try {
      await redis.del("dashboard_stats");
    } catch (err) {
      console.error("Redis cache invalidation error:", err);
    }
  }

  /**
   * Retrieves dashboard statistics, using Redis cache if available.
   */
  static async getDashboardStats() {
    const CACHE_KEY = "dashboard_stats";

    try {
      // Try fetching from Redis cache
      const cached = await redis.get(CACHE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      console.error("Redis get cache error:", err);
    }

    // Cache miss: Query database
    const now = new Date();

    // Calculate last 6 months collection vs expense comparison queries concurrently
    const monthPromises = [];
    for (let i = 5; i >= 0; i--) {
      const targetMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = targetMonth.getFullYear();
      const month = targetMonth.getMonth();

      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

      monthPromises.push((async () => {
        const [monthlyDepAggregate, monthlyExpAggregate] = await Promise.all([
          prisma.depositItem.aggregate({
            where: {
              deletedAt: null,
              deposit: {
                createdAt: { gte: startOfMonth, lte: endOfMonth }
              }
            },
            _sum: { amount: true }
          }),
          prisma.expense.aggregate({
            where: {
              status: "APPROVED",
              deletedAt: null,
              date: { gte: startOfMonth, lte: endOfMonth }
            },
            _sum: { amount: true }
          })
        ]);

        const collectionsBdt = (monthlyDepAggregate._sum.amount || 0) / 100;
        const expensesBdt = (monthlyExpAggregate._sum.amount || 0) / 100;

        const monthNamesBN = [
          "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
          "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
        ];
        const monthNamesEN = [
          "January", "February", "March", "April", "May", "June",
          "July", "August", "September", "October", "November", "December"
        ];

        return {
          monthBN: `${monthNamesBN[month]} ${year}`,
          monthEN: `${monthNamesEN[month]} ${year}`,
          collectionsBdt,
          expensesBdt
        };
      })());
    }

    const [
      totalMembers,
      depositAggregate,
      expenseAggregate,
      bankAccountBalances,
      chartData
    ] = await Promise.all([
      prisma.member.count({
        where: { deletedAt: null }
      }),
      prisma.depositItem.aggregate({
        where: { deletedAt: null },
        _sum: { amount: true }
      }),
      prisma.expense.aggregate({
        where: { status: "APPROVED", deletedAt: null },
        _sum: { amount: true }
      }),
      prisma.bankAccount.findMany({
        where: { deletedAt: null }
      }),
      Promise.all(monthPromises)
    ]);

    const totalDepositsPaisa = depositAggregate._sum.amount || 0;
    const totalExpensesPaisa = expenseAggregate._sum.amount || 0;

    const cashAccount = bankAccountBalances.find((acc) => acc.name === "Cash on Hand");
    const cashBalancePaisa = cashAccount ? cashAccount.balance : 0;

    // Bank accounts excluding the cash on hand
    const bankBalancePaisa = bankAccountBalances
      .filter((acc) => acc.name !== "Cash on Hand")
      .reduce((sum, acc) => sum + acc.balance, 0);

    const stats = {
      totalMembers,
      totalDepositsBdt: totalDepositsPaisa / 100,
      totalExpensesBdt: totalExpensesPaisa / 100,
      bankBalanceBdt: bankBalancePaisa / 100,
      cashBalanceBdt: cashBalancePaisa / 100,
      chartData
    };

    try {
      // Store in Redis with a 30-second TTL
      await redis.set(CACHE_KEY, JSON.stringify(stats), "EX", 30);
    } catch (err) {
      console.error("Redis set cache error:", err);
    }

    return stats;
  }
}
