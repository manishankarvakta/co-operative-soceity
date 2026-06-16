import { BackupService, parseDatabaseUrl } from "../src/services/BackupService";
import { prisma } from "../src/lib/db";
import { redis } from "../src/lib/redis";
import { auth } from "../src/lib/auth";
import { GET as getBackups, POST as postBackup, DELETE as deleteBackupRoute } from "../src/app/api/backups/route";
import { POST as restoreBackupRoute } from "../src/app/api/backups/restore/route";
import * as fs from "fs";
import * as path from "path";
import * as child_process from "child_process";

// Mock database client
jest.mock("../src/lib/db", () => ({
  prisma: {
    backupHistory: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
      findFirst: jest.fn()
    },
    user: {
      findMany: jest.fn()
    },
    $transaction: jest.fn((input) => {
      if (typeof input === "function") return input(prisma);
      return Promise.all(input);
    }),
    $executeRawUnsafe: jest.fn()
  }
}));

// Mock Redis client
jest.mock("../src/lib/redis", () => ({
  redis: {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn()
  }
}));

// Mock NextAuth Authentication Module
jest.mock("../src/lib/auth", () => ({
  auth: jest.fn()
}));

// Mock Audit Service
jest.mock("../src/services/AuditService", () => ({
  AuditService: {
    log: jest.fn()
  }
}));

// Mock child_process exec
jest.mock("child_process", () => ({
  exec: jest.fn((cmd, opts, cb) => {
    if (typeof opts === "function") {
      opts(null, "stdout", "stderr");
    } else if (typeof cb === "function") {
      cb(null, "stdout", "stderr");
    }
  }),
  // promisify support
  promisify: (fn: any) => fn
}));

describe("Backup System Comprehensive Tests", () => {
  const TEST_BACKUP_DIR = path.join(process.cwd(), "backups_test");

  beforeAll(() => {
    // Setup test environment variables
    process.env.BACKUP_DIR = TEST_BACKUP_DIR;
    process.env.DATABASE_URL = "postgresql://test_user:test_pwd@localhost:5432/test_db";
    (process.env as any).NODE_ENV = "test";
    
    if (!fs.existsSync(TEST_BACKUP_DIR)) {
      fs.mkdirSync(TEST_BACKUP_DIR, { recursive: true });
    }
  });

  afterAll(() => {
    // Clean up test directory
    if (fs.existsSync(TEST_BACKUP_DIR)) {
      const files = fs.readdirSync(TEST_BACKUP_DIR);
      for (const file of files) {
        fs.unlinkSync(path.join(TEST_BACKUP_DIR, file));
      }
      fs.rmdirSync(TEST_BACKUP_DIR);
    }
    jest.clearAllMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // SECTION 1: UNIT TESTS
  // ==========================================
  describe("Unit Tests - Logic & Helpers", () => {
    describe("parseDatabaseUrl", () => {
      it("should correctly parse a standard postgresql connection string", () => {
        const url = "postgresql://myuser:mypassword@dbhost.com:5432/mydatabase";
        const conn = parseDatabaseUrl(url);
        expect(conn.user).toBe("myuser");
        expect(conn.password).toBe("mypassword");
        expect(conn.host).toBe("dbhost.com");
        expect(conn.port).toBe("5432");
        expect(conn.database).toBe("mydatabase");
      });

      it("should default the port if omitted in the connection string", () => {
        const url = "postgresql://postgres:secret@127.0.0.1/society_db";
        const conn = parseDatabaseUrl(url);
        expect(conn.user).toBe("postgres");
        expect(conn.password).toBe("secret");
        expect(conn.host).toBe("127.0.0.1");
        expect(conn.port).toBe("5432");
        expect(conn.database).toBe("society_db");
      });

      it("should handle URI encoded characters in the password", () => {
        const url = "postgresql://postgres:p%40ss%23123@127.0.0.1/db";
        const conn = parseDatabaseUrl(url);
        expect(conn.password).toBe("p@ss#123");
      });

      it("should throw an error for invalid formats", () => {
        expect(() => parseDatabaseUrl("invalid-uri")).toThrow("Invalid DATABASE_URL format");
      });
    });

    describe("BackupService.parseDates", () => {
      it("should correctly parse an ISO Date string into a Date object", () => {
        const isoStr = "2026-06-15T12:00:00.000Z";
        const parsed = BackupService.parseDates(isoStr);
        expect(parsed).toBeInstanceOf(Date);
        expect(parsed.toISOString()).toBe(isoStr);
      });

      it("should leave non-date strings unchanged", () => {
        const nonDate = "this is not a date";
        const parsed = BackupService.parseDates(nonDate);
        expect(parsed).toBe(nonDate);
      });

      it("should recursively parse dates inside nested objects and arrays", () => {
        const payload = {
          id: 1,
          createdAt: "2026-06-15T12:00:00.000Z",
          nested: {
            updatedAt: "2026-06-15T18:00:00.000Z",
            tags: ["news", "updates"]
          },
          history: [
            { event: "log", time: "2026-06-15T19:30:00.000Z" }
          ]
        };

        const parsed = BackupService.parseDates(payload);
        expect(parsed.createdAt).toBeInstanceOf(Date);
        expect(parsed.nested.updatedAt).toBeInstanceOf(Date);
        expect(parsed.nested.tags).toEqual(["news", "updates"]);
        expect(parsed.history[0].time).toBeInstanceOf(Date);
      });

      it("should return null/undefined/primitive fields as-is", () => {
        expect(BackupService.parseDates(null)).toBe(null);
        expect(BackupService.parseDates(1234)).toBe(1234);
        expect(BackupService.parseDates(true)).toBe(true);
      });
    });
  });

  // ==========================================
  // SECTION 2: INTEGRATION TESTS
  // ==========================================
  describe("Integration Tests - File Ops, DB Updates & Locking", () => {
    it("should successfully run pg_dump SQL Backup when CLI utility is present", async () => {
      (prisma.backupHistory.create as jest.Mock).mockResolvedValue({ id: "hist-1" });
      (prisma.backupHistory.update as jest.Mock).mockResolvedValue({ id: "hist-1", status: "SUCCESS" });

      const execMock = child_process.exec as unknown as jest.Mock;
      execMock.mockImplementation((cmd, opts, cb) => {
        const filePath = cmd.match(/-f "([^"]+)"/)[1];
        fs.writeFileSync(filePath, "-- Mock PostgreSQL Dump", "utf8");
        
        if (typeof opts === "function") opts(null, { stdout: "" }, { stderr: "" });
        else if (typeof cb === "function") cb(null, { stdout: "" }, { stderr: "" });
      });

      const record = await BackupService.createBackup();

      expect(prisma.backupHistory.create).toHaveBeenCalled();
      expect(prisma.backupHistory.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "hist-1" },
          data: expect.objectContaining({ status: "SUCCESS" })
        })
      );
      expect(record.status).toBe("SUCCESS");
      expect(fs.readdirSync(TEST_BACKUP_DIR).some(f => f.endsWith(".sql"))).toBe(true);
    });

    it("should fall back to JSON backup if pg_dump throws an error", async () => {
      (prisma.backupHistory.create as jest.Mock).mockResolvedValue({ id: "hist-2" });
      (prisma.backupHistory.update as jest.Mock).mockResolvedValue({ id: "hist-2", status: "SUCCESS" });
      (prisma.user.findMany as jest.Mock).mockResolvedValue([{ id: "user-1", email: "test@coop.com" }]);

      const execMock = child_process.exec as unknown as jest.Mock;
      execMock.mockImplementation((cmd, opts, cb) => {
        const error = new Error("pg_dump not found");
        if (typeof opts === "function") opts(error, null, null);
        else if (typeof cb === "function") cb(error, null, null);
      });

      const record = await BackupService.createBackup();

      expect(prisma.backupHistory.create).toHaveBeenCalled();
      expect(prisma.backupHistory.update).toHaveBeenCalled();
      expect(fs.readdirSync(TEST_BACKUP_DIR).some(f => f.endsWith(".json"))).toBe(true);
    });

    it("should execute JSON restore in a single transaction", async () => {
      const jsonSnapshotPath = path.join(TEST_BACKUP_DIR, "snapshot.json");
      const testData = {
        metadata: { method: "prisma_json" },
        data: {
          user: [{ id: "user-9", email: "restore@test.com", createdAt: "2026-06-15T12:00:00.000Z" }]
        }
      };
      fs.writeFileSync(jsonSnapshotPath, JSON.stringify(testData), "utf8");

      (prisma.backupHistory.findUnique as jest.Mock).mockResolvedValue({
        id: "hist-json",
        filename: "snapshot.json",
        storagePath: jsonSnapshotPath,
        status: "SUCCESS"
      });

      const mockCreateMany = jest.fn();
      (prisma as any).user = {
        createMany: mockCreateMany
      };

      const result = await BackupService.restoreBackup("hist-json");
      expect(result).toBe(true);
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(mockCreateMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            id: "user-9",
            email: "restore@test.com",
            createdAt: expect.any(Date)
          })
        ]
      });
    });

    it("should delete physical file and database history item", async () => {
      const dumpPath = path.join(TEST_BACKUP_DIR, "delete_me.sql");
      fs.writeFileSync(dumpPath, "dummy dump", "utf8");

      (prisma.backupHistory.findUnique as jest.Mock).mockResolvedValue({
        id: "hist-del",
        filename: "delete_me.sql",
        storagePath: dumpPath
      });

      await BackupService.deleteBackup("hist-del");

      expect(prisma.backupHistory.delete).toHaveBeenCalledWith({
        where: { id: "hist-del" }
      });
      expect(fs.existsSync(dumpPath)).toBe(false);
    });

    it("should lock automated daily backup execution using Redis", async () => {
      (redis.set as jest.Mock).mockResolvedValue("OK");
      (prisma.backupHistory.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.backupHistory.create as jest.Mock).mockResolvedValue({ id: "auto-hist" });
      (prisma.backupHistory.update as jest.Mock).mockResolvedValue({ id: "auto-hist" });

      await BackupService.triggerDailyBackup();

      expect(redis.set).toHaveBeenCalledWith(
        expect.stringContaining("backup:run:"),
        "1",
        "EX",
        86400,
        "NX"
      );
    });
  });

  // ==========================================
  // SECTION 3: SECURITY TESTS
  // ==========================================
  describe("Security Tests - Access Guard & Role Guards", () => {
    it("should return 401 Unauthorized if request does not contain a session", async () => {
      (auth as unknown as jest.Mock).mockResolvedValue(null);

      // GET Route Guard Test
      const getRes = await getBackups();
      expect(getRes.status).toBe(401);
      expect(await getRes.json()).toEqual({ error: "অনুমতি নেই।" });

      // POST Route Guard Test
      const postRes = await postBackup();
      expect(postRes.status).toBe(401);

      // DELETE Route Guard Test
      const deleteRes = await deleteBackupRoute(new Request("http://localhost/api/backups?id=1", { method: "DELETE" }));
      expect(deleteRes.status).toBe(401);

      // Restore Route Guard Test
      const restoreRes = await restoreBackupRoute(new Request("http://localhost/api/backups/restore", { method: "POST" }));
      expect(restoreRes.status).toBe(401);
    });

    it("should return 403 Forbidden if user holds a non-admin role (e.g. MEMBER)", async () => {
      const memberSession = {
        user: {
          roles: ["MEMBER"]
        }
      };
      (auth as unknown as jest.Mock).mockResolvedValue(memberSession);

      const getRes = await getBackups();
      expect(getRes.status).toBe(403);
      expect(await getRes.json()).toEqual({ error: "অনুমতি নেই।" });

      const postRes = await postBackup();
      expect(postRes.status).toBe(403);

      const deleteRes = await deleteBackupRoute(new Request("http://localhost/api/backups?id=1", { method: "DELETE" }));
      expect(deleteRes.status).toBe(403);

      const restoreRes = await restoreBackupRoute(new Request("http://localhost/api/backups/restore", { method: "POST" }));
      expect(restoreRes.status).toBe(403);
    });

    it("should return 403 Forbidden if user is an ACCOUNTANT", async () => {
      const accountantSession = {
        user: {
          roles: ["ACCOUNTANT"]
        }
      };
      (auth as unknown as jest.Mock).mockResolvedValue(accountantSession);

      const getRes = await getBackups();
      expect(getRes.status).toBe(403);

      const restoreRes = await restoreBackupRoute(new Request("http://localhost/api/backups/restore", { method: "POST" }));
      expect(restoreRes.status).toBe(403);
    });
  });

  // ==========================================
  // SECTION 4: E2E ROUTE HANDLER TESTS
  // ==========================================
  describe("E2E Tests - Route Handler Operations under Admin Session", () => {
    const adminSession = {
      user: {
        id: "admin-uuid",
        roles: ["SUPER_ADMIN"]
      }
    };

    beforeEach(() => {
      (auth as unknown as jest.Mock).mockResolvedValue(adminSession);
    });

    it("should successfully list backups (GET)", async () => {
      (prisma.backupHistory.findMany as jest.Mock).mockResolvedValue([
        { id: "b1", filename: "b1.sql", fileSize: 100, status: "SUCCESS" }
      ]);

      const res = await getBackups();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveLength(1);
      expect(data[0].filename).toBe("b1.sql");
    });

    it("should successfully trigger manual backup snapshot creation (POST)", async () => {
      (prisma.backupHistory.create as jest.Mock).mockResolvedValue({ id: "hist-new" });
      (prisma.backupHistory.update as jest.Mock).mockResolvedValue({
        id: "hist-new",
        filename: "backup_e2e.json",
        fileSize: 10,
        status: "SUCCESS"
      });

      const res = await postBackup();
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.backup.filename).toBe("backup_e2e.json");
    });

    it("should delete backup snapshot when valid ID parameter is passed (DELETE)", async () => {
      (prisma.backupHistory.findUnique as jest.Mock).mockResolvedValue({
        id: "hist-delete",
        filename: "snapshot_del.sql",
        storagePath: ""
      });
      (prisma.backupHistory.delete as jest.Mock).mockResolvedValue({ id: "hist-delete" });

      const request = new Request("http://localhost/api/backups?id=hist-delete", {
        method: "DELETE"
      });

      const res = await deleteBackupRoute(request);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
    });

    it("should return validation error on delete if ID parameter is missing", async () => {
      const request = new Request("http://localhost/api/backups", {
        method: "DELETE"
      });

      const res = await deleteBackupRoute(request);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.code).toBe("VALIDATION_ERROR");
    });

    it("should successfully restore database from snapshot (POST /restore)", async () => {
      const jsonSnapshotPath = path.join(TEST_BACKUP_DIR, "restore_e2e.json");
      fs.writeFileSync(jsonSnapshotPath, JSON.stringify({ metadata: {}, data: {} }), "utf8");

      (prisma.backupHistory.findUnique as jest.Mock).mockResolvedValue({
        id: "b-restore",
        filename: "restore_e2e.json",
        storagePath: jsonSnapshotPath,
        status: "SUCCESS"
      });

      const request = new Request("http://localhost/api/backups/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "b-restore" })
      });

      const res = await restoreBackupRoute(request);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
    });
  });
});
