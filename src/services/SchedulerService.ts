import { redis } from "@/lib/redis";
import { MemberService } from "./MemberService";
import { BackupService } from "./BackupService";
import { NotificationService } from "./NotificationService";

export class SchedulerService {
  private static schedulerInterval: NodeJS.Timeout | null = null;

  /**
   * Starts the background interval clock scheduler.
   */
  static start() {
    if (this.schedulerInterval) {
      return; // Already running
    }

    console.log("[SchedulerService] Initializing background scheduler service...");

    // Check conditions every 60 seconds
    this.schedulerInterval = setInterval(async () => {
      try {
        const now = new Date();

        // 1. Daily Backup Check (matches target hour & minute)
        const targetHour = parseInt(process.env.BACKUP_CRON_HOUR || "0", 10);
        const targetMinute = parseInt(process.env.BACKUP_CRON_MINUTE || "0", 10);

        if (now.getHours() === targetHour && now.getMinutes() === targetMinute) {
          await BackupService.triggerDailyBackup();
        }

        // 2. Weekly Delinquency Scan (Runs every Sunday at 00:00)
        if (now.getDay() === 0 && now.getHours() === 0 && now.getMinutes() === 0) {
          await this.triggerWeeklyDelinquency();
        }

        // 3. Process Failed Email Retry Queue (Runs every 60 seconds)
        await NotificationService.processQueue();
      } catch (err) {
        console.error("[SchedulerService] Scheduler tick error:", err);
      }
    }, 60000);

    // Unref the timer to allow clean process termination during testing
    if (this.schedulerInterval.unref) {
      this.schedulerInterval.unref();
    }
  }

  /**
   * Stops the background scheduler (for testing clean up).
   */
  static stop() {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
      console.log("[SchedulerService] Background scheduler stopped.");
    }
  }

  /**
   * Triggers the weekly delinquency scan using Redis locking to run exactly once.
   */
  static async triggerWeeklyDelinquency(): Promise<string[]> {
    const today = new Date();
    // Get start of the current week (Sunday)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const weekStr = startOfWeek.toISOString().split("T")[0];
    const lockKey = `delinquency:run:${weekStr}`;

    try {
      // Try acquiring Redis lock for this week's delinquency run
      const acquired = await redis.set(lockKey, "1", "EX", 604800, "NX" as any);

      // Skip if lock exists in production environment
      if (!acquired && process.env.NODE_ENV === "production") {
        console.log(`[SchedulerService] Delinquency check skipped for week ${weekStr}: already run by another instance.`);
        return [];
      }

      console.log(`[SchedulerService] Executing weekly member delinquency scan for week: ${weekStr}`);
      return await MemberService.evaluateSuspensions();
    } catch (err) {
      console.error("[SchedulerService] Weekly delinquency automated execution failed:", err);
      throw err;
    }
  }
}
