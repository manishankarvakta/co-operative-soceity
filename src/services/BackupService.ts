import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";
import { AuditService } from "./AuditService";
import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const STATIC_TABLE_NAMES = [
  "Permission",
  "Role",
  "RolePermission",
  "User",
  "UserRole",
  "BankAccount",
  "FiscalYear",
  "Project",
  "Receipt",
  "Member",
  "Nominee",
  "ShareRecord",
  "Deposit",
  "DepositItem",
  "Expense",
  "ProjectInvestment",
  "ProfitDistribution",
  "BankTransaction",
  "Notification",
  "AuditLog",
  "Account",
  "JournalEntry",
  "JournalLine",
  "Loan",
  "LoanSchedule",
  "LoanPayment",
  "BackupHistory"
];



export function parseDatabaseUrl(url: string) {
  const regex = /^(?:postgres|postgresql):\/\/([^:]+):([^@]+)@([^:/]+)(?::(\d+))?\/([^?]+)/;
  const match = url.match(regex);
  if (!match) {
    throw new Error("Invalid DATABASE_URL format");
  }
  return {
    user: match[1],
    password: decodeURIComponent(match[2]),
    host: match[3],
    port: match[4] || "5432",
    database: match[5]
  };
}

export class BackupService {
  private static schedulerInterval: NodeJS.Timeout | null = null;

  /**
   * Recursively parses ISO date strings back to Date objects in JSON payloads.
   */
  static parseDates(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === "string") {
      const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/;
      if (isoDateRegex.test(obj)) {
        const date = new Date(obj);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj.map(BackupService.parseDates);
    }
    if (typeof obj === "object") {
      const parsed: any = {};
      for (const key of Object.keys(obj)) {
        parsed[key] = BackupService.parseDates(obj[key]);
      }
      return parsed;
    }
    return obj;
  }

  /**
   * Retrieves the configured backup directory path.
   * Encourages Docker Volume support by being easily configurable via environment variables.
   */
  static getBackupDir(): string {
    const dir = process.env.BACKUP_DIR || path.join(process.cwd(), "backups");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  /**
   * Lists all backup history records.
   */
  static async listBackups() {
    return await prisma.backupHistory.findMany({
      orderBy: { startedAt: "desc" }
    });
  }

  /**
   * Creates a new backup file (SQL format using pg_dump, or JSON format as fallback).
   */
  static async createBackup() {
    const backupDir = this.getBackupDir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    
    // We create the history record first in RUNNING state
    const historyRecord = await prisma.backupHistory.create({
      data: {
        filename: `pending-${timestamp}`,
        fileSize: 0,
        status: "RUNNING",
        startedAt: new Date(),
        storagePath: ""
      }
    });

    let filename = "";
    let storagePath = "";
    let status: "SUCCESS" | "FAILED" = "FAILED";
    let fileSize = 0;
    const dbUrl = process.env.DATABASE_URL || "";

    try {
      // Primary Attempt: pg_dump SQL Backup
      if (dbUrl && !process.env.FORCE_JSON_BACKUP) {
        try {
          const conn = parseDatabaseUrl(dbUrl);
          filename = `backup_${timestamp}.sql`;
          storagePath = path.join(backupDir, filename);

          const pgDumpCmd = process.env.PG_DUMP_PATH || "pg_dump";
          // Run pg_dump command with environment variables for safety
          const cmd = `"${pgDumpCmd}" -h "${conn.host}" -p "${conn.port}" -U "${conn.user}" -F p -b -d "${conn.database}" -f "${storagePath}"`;
          
          await execAsync(cmd, {
            env: {
              ...process.env,
              PGPASSWORD: conn.password
            }
          });

          if (fs.existsSync(storagePath)) {
            fileSize = fs.statSync(storagePath).size;
            status = "SUCCESS";
          }
        } catch (pgDumpErr) {
          console.warn("[BackupService] pg_dump failed or was not found, falling back to JSON backup:", pgDumpErr);
        }
      }

      // Secondary Fallback: Prisma JSON Backup
      if (status !== "SUCCESS") {
        filename = `backup_${timestamp}.json`;
        storagePath = path.join(backupDir, filename);
        
        const backupData: Record<string, any[]> = {};
        for (const table of STATIC_TABLE_NAMES) {
          const modelName = table.charAt(0).toLowerCase() + table.slice(1);
          if (modelName in prisma && typeof (prisma as any)[modelName].findMany === "function") {
            backupData[modelName] = await (prisma as any)[modelName].findMany();
          }
        }

        const payload = {
          metadata: {
            version: "1.0",
            timestamp: new Date().toISOString(),
            method: "prisma_json"
          },
          data: backupData
        };

        fs.writeFileSync(storagePath, JSON.stringify(payload, null, 2), "utf8");
        fileSize = fs.statSync(storagePath).size;
        status = "SUCCESS";
      }

      // Update backup history record upon success
      const updated = await prisma.backupHistory.update({
        where: { id: historyRecord.id },
        data: {
          filename,
          fileSize,
          status,
          completedAt: new Date(),
          storagePath
        }
      });

      await AuditService.log({
        action: "CREATE",
        tableName: "BackupHistory",
        recordId: updated.id,
        newData: { filename, size: fileSize, method: filename.endsWith(".sql") ? "sql" : "json" }
      });

      return updated;

    } catch (error) {
      console.error("[BackupService] Create Backup Exception:", error);
      
      // Update record as failed
      await prisma.backupHistory.update({
        where: { id: historyRecord.id },
        data: {
          filename: `failed-${timestamp}`,
          status: "FAILED",
          completedAt: new Date()
        }
      });

      throw error;
    }
  }

  /**
   * Restores the database from a given backup history ID.
   */
  static async restoreBackup(id: string) {
    const history = await prisma.backupHistory.findUnique({
      where: { id }
    });

    if (!history || !history.storagePath || history.status !== "SUCCESS") {
      throw new Error("Invalid or unsuccessful backup record.");
    }

    if (!fs.existsSync(history.storagePath)) {
      throw new Error(`Backup file not found on disk at: ${history.storagePath}`);
    }

    const dbUrl = process.env.DATABASE_URL || "";
    console.log(`[BackupService] Starting restore from: ${history.filename}`);

    try {
      if (history.filename.endsWith(".sql")) {
        // SQL Restore via psql
        const conn = parseDatabaseUrl(dbUrl);
        const psqlCmd = process.env.PSQL_PATH || "psql";

        // Step 1: Wipe current database public schema
        await prisma.$executeRawUnsafe(`DROP SCHEMA public CASCADE;`);
        await prisma.$executeRawUnsafe(`CREATE SCHEMA public;`);
        await prisma.$executeRawUnsafe(`GRANT ALL ON SCHEMA public TO public;`);

        // Step 2: Restore from SQL script
        const cmd = `"${psqlCmd}" -h "${conn.host}" -p "${conn.port}" -U "${conn.user}" -d "${conn.database}" -f "${history.storagePath}"`;
        await execAsync(cmd, {
          env: {
            ...process.env,
            PGPASSWORD: conn.password
          }
        });
      } else if (history.filename.endsWith(".json")) {
        // JSON Restore via Prisma Transaction
        const raw = fs.readFileSync(history.storagePath, "utf8");
        const payload = JSON.parse(raw);

        if (!payload.data) {
          throw new Error("Invalid JSON backup format: missing 'data' field.");
        }

        const backupData = payload.data;

        await prisma.$transaction(async (tx) => {
          // Truncate tables in reverse order to avoid FK errors
          for (const table of [...STATIC_TABLE_NAMES].reverse()) {
            await tx.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
          }

          // Insert data in topological order
          for (const table of STATIC_TABLE_NAMES) {
            const modelName = table.charAt(0).toLowerCase() + table.slice(1);
            const records = backupData[modelName];
            if (records && records.length > 0) {
              const parsedRecords = BackupService.parseDates(records);
              await (tx as any)[modelName].createMany({
                data: parsedRecords
              });
            }
          }
        }, {
          timeout: 45000 // Allow up to 45 seconds for restoration transaction
        });
      } else {
        throw new Error("Unsupported file extension. Only .sql and .json are supported.");
      }

      await AuditService.log({
        action: "UPDATE",
        tableName: "BackupHistory",
        recordId: id,
        newData: { filename: history.filename, restoredAt: new Date() }
      });

      console.log(`[BackupService] Database restore completed successfully.`);
      return true;

    } catch (error) {
      console.error("[BackupService] Database Restore Exception:", error);
      throw error;
    }
  }

  /**
   * Deletes a backup record and deletes the dump file from storage.
   */
  static async deleteBackup(id: string) {
    const history = await prisma.backupHistory.findUnique({
      where: { id }
    });

    if (!history) {
      throw new Error("Backup record not found.");
    }

    if (history.storagePath && fs.existsSync(history.storagePath)) {
      try {
        fs.unlinkSync(history.storagePath);
      } catch (err) {
        console.error(`[BackupService] Failed to delete file at: ${history.storagePath}`, err);
      }
    }

    const deleted = await prisma.backupHistory.delete({
      where: { id }
    });

    await AuditService.log({
      action: "DELETE",
      tableName: "BackupHistory",
      recordId: id,
      oldData: { filename: history.filename }
    });

    return deleted;
  }

  /**
   * Triggers the daily backup with multi-instance checking using Redis locks.
   */
  static async triggerDailyBackup() {
    const todayStr = new Date().toISOString().split("T")[0];
    const lockKey = `backup:run:${todayStr}`;

    try {
      // Try acquiring Redis lock for today's backup
      const acquired = await redis.set(lockKey, "1", "EX", 86400, "NX" as any);
      
      // If we could not acquire the lock and we are in production, skip (another server is running it)
      if (!acquired && process.env.NODE_ENV === "production") {
        return;
      }

      // Check DB to make sure no success backup ran today (extra safety)
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      const existing = await prisma.backupHistory.findFirst({
        where: {
          startedAt: {
            gte: startOfToday,
            lte: endOfToday
          },
          status: {
            in: ["SUCCESS", "RUNNING"]
          }
        }
      });

      if (existing) {
        return;
      }

      console.log("[BackupService] Triggering daily automated backup...");
      await this.createBackup();

    } catch (err) {
      console.error("[BackupService] Daily automated backup execution failed:", err);
    }
  }

  /**
   * Starts the background interval clock scheduler.
   */
  static initScheduler() {
    const { SchedulerService } = require("./SchedulerService");
    SchedulerService.start();
  }

  /**
   * Clean-up function for shutting down timers (useful in test suites).
   */
  static stopScheduler() {
    const { SchedulerService } = require("./SchedulerService");
    SchedulerService.stop();
  }
}
