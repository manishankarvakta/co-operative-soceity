import { FiscalYearService } from "../src/services/FiscalYearService";
import { AccountingService } from "../src/services/AccountingService";
import { prisma } from "../src/lib/db";
import { auth } from "../src/lib/auth";
import { GET as getFiscalYears, POST as postFiscalYear } from "../src/app/api/accounting/fiscal-years/route";
import { POST as activateFiscalYearRoute } from "../src/app/api/accounting/fiscal-years/[id]/activate/route";
import { POST as reverseJournalRoute } from "../src/app/api/accounting/journal/[id]/reverse/route";

// Mock database client
jest.mock("../src/lib/db", () => ({
  prisma: {
    fiscalYear: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      findMany: jest.fn()
    },
    journalEntry: {
      findUnique: jest.fn(),
      create: jest.fn()
    },
    journalLine: {
      create: jest.fn()
    },
    account: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn()
    },
    $transaction: jest.fn((cb) => {
      if (typeof cb === "function") return cb(prisma);
      return Promise.all(cb);
    })
  }
}));

// Mock auth
jest.mock("../src/lib/auth", () => ({
  auth: jest.fn()
}));

describe("FiscalYearService Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createFiscalYear", () => {
    it("should successfully create a new fiscal year", async () => {
      (prisma.fiscalYear.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.fiscalYear.create as jest.Mock).mockResolvedValue({
        id: "fy-1",
        name: "FY 2025-2026",
        startDate: new Date("2025-07-01"),
        endDate: new Date("2026-06-30"),
        isActive: false
      });

      const res = await FiscalYearService.createFiscalYear({
        name: "FY 2025-2026",
        startDate: "2025-07-01",
        endDate: "2026-06-30",
        isActive: false
      });

      expect(res.name).toBe("FY 2025-2026");
      expect(prisma.fiscalYear.create).toHaveBeenCalled();
    });

    it("should throw error if startDate is not before endDate", async () => {
      await expect(
        FiscalYearService.createFiscalYear({
          name: "FY Invalid",
          startDate: "2026-07-01",
          endDate: "2025-06-30"
        })
      ).rejects.toThrow("শুরুর তারিখ অবশ্যই শেষের তারিখের চেয়ে আগে হতে হবে।");
    });

    it("should deactivate all other fiscal years if new one is active", async () => {
      (prisma.fiscalYear.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.fiscalYear.create as jest.Mock).mockResolvedValue({
        id: "fy-2",
        isActive: true
      });

      await FiscalYearService.createFiscalYear({
        name: "FY Active",
        startDate: "2025-07-01",
        endDate: "2026-06-30",
        isActive: true
      });

      expect(prisma.fiscalYear.updateMany).toHaveBeenCalledWith({
        data: { isActive: false }
      });
      expect(prisma.fiscalYear.create).toHaveBeenCalled();
    });
  });

  describe("validateDate", () => {
    it("should pass for date within boundaries", async () => {
      (prisma.fiscalYear.findFirst as jest.Mock).mockResolvedValue({
        name: "FY 2025-2026",
        startDate: new Date("2025-07-01T00:00:00.000Z"),
        endDate: new Date("2026-06-30T23:59:59.999Z"),
        isActive: true
      });

      const fy = await FiscalYearService.validateDate("2026-06-15");
      expect(fy.name).toBe("FY 2025-2026");
    });

    it("should throw validation error for dates outside boundaries", async () => {
      (prisma.fiscalYear.findFirst as jest.Mock).mockResolvedValue({
        name: "FY 2025-2026",
        startDate: new Date("2025-07-01T00:00:00.000Z"),
        endDate: new Date("2026-06-30T23:59:59.999Z"),
        isActive: true
      });

      await expect(
        FiscalYearService.validateDate("2027-01-01")
      ).rejects.toThrow("সক্রিয় অর্থবছর");
    });

    it("should throw error if no active fiscal year configured", async () => {
      (prisma.fiscalYear.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        FiscalYearService.validateDate("2026-06-15")
      ).rejects.toThrow("সক্রিয় অর্থবছর খুঁজে পাওয়া যায়নি");
    });
  });
});

describe("Accounting Fiscal & Reversal API Routes Tests", () => {
  const adminSession = {
    user: {
      id: "admin-uuid",
      roles: ["SUPER_ADMIN"]
    }
  };

  const memberSession = {
    user: {
      id: "member-uuid",
      roles: ["MEMBER"]
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/accounting/fiscal-years", () => {
    it("should return 401 if not logged in", async () => {
      (auth as jest.Mock).mockResolvedValue(null);
      const res = await getFiscalYears();
      expect(res.status).toBe(401);
    });

    it("should return 403 if not authorized", async () => {
      (auth as jest.Mock).mockResolvedValue(memberSession);
      const res = await getFiscalYears();
      expect(res.status).toBe(403);
    });

    it("should return list of fiscal years for admin/accountant", async () => {
      (auth as jest.Mock).mockResolvedValue(adminSession);
      (prisma.fiscalYear.findMany as jest.Mock).mockResolvedValue([
        { id: "fy-1", name: "FY 2025-26", isActive: true }
      ]);

      const res = await getFiscalYears();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveLength(1);
      expect(data[0].name).toBe("FY 2025-26");
    });
  });

  describe("POST /api/accounting/fiscal-years", () => {
    it("should create new fiscal year", async () => {
      (auth as jest.Mock).mockResolvedValue(adminSession);
      (prisma.fiscalYear.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.fiscalYear.create as jest.Mock).mockResolvedValue({ id: "fy-new", name: "FY 2026-27" });

      const request = new Request("http://localhost/api/accounting/fiscal-years", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "FY 2026-27",
          startDate: "2026-07-01",
          endDate: "2027-06-30",
          isActive: false
        })
      });

      const res = await postFiscalYear(request);
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.fiscalYear.name).toBe("FY 2026-27");
    });
  });

  describe("POST /api/accounting/fiscal-years/[id]/activate", () => {
    it("should activate a fiscal year", async () => {
      (auth as jest.Mock).mockResolvedValue(adminSession);
      (prisma.fiscalYear.findUnique as jest.Mock).mockResolvedValue({ id: "fy-id", name: "FY 2025-26" });
      (prisma.fiscalYear.update as jest.Mock).mockResolvedValue({ id: "fy-id", isActive: true });

      const request = new Request("http://localhost/api/accounting/fiscal-years/fy-id/activate", {
        method: "POST"
      });

      const res = await activateFiscalYearRoute(request, { params: Promise.resolve({ id: "fy-id" }) });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.fiscalYear.isActive).toBe(true);
    });
  });

  describe("POST /api/accounting/journal/[id]/reverse", () => {
    it("should successfully reverse journal entry via endpoint", async () => {
      (auth as jest.Mock).mockResolvedValue(adminSession);

      const originalEntry = {
        id: "orig-id",
        description: "Rent pay",
        date: new Date("2026-06-15"),
        lines: [
          { account: { code: "1000" }, amount: 5000, type: "DEBIT" },
          { account: { code: "5000" }, amount: 5000, type: "CREDIT" }
        ]
      };

      (prisma.fiscalYear.findFirst as jest.Mock).mockResolvedValue({
        id: "fy-2025",
        startDate: new Date("2025-07-01"),
        endDate: new Date("2026-06-30"),
        isActive: true
      });
      (prisma.journalEntry.findUnique as jest.Mock).mockResolvedValue(originalEntry);
      (prisma.journalEntry.create as jest.Mock).mockResolvedValue({ id: "rev-id", description: "Reversed" });
      (prisma.account.findUnique as jest.Mock).mockImplementation((args: any) => {
        if (args.where.code === "1000") return Promise.resolve({ id: "a1", code: "1000", type: "ASSET" });
        if (args.where.code === "5000") return Promise.resolve({ id: "a2", code: "5000", type: "EXPENSE" });
        return null;
      });

      const request = new Request("http://localhost/api/accounting/journal/orig-id/reverse", {
        method: "POST"
      });

      const res = await reverseJournalRoute(request, { params: Promise.resolve({ id: "orig-id" }) });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.journalEntry.id).toBe("rev-id");
    });
  });
});
