import { createDepositSchema } from "../src/backend/validations/deposit";
import { DepositService } from "../src/services/DepositService";
import { prisma } from "../src/lib/db";

// Mock database execution
jest.mock("../src/lib/db", () => ({
  prisma: {
    member: {
      findUnique: jest.fn(),
      update: jest.fn()
    },
    deposit: {
      count: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn()
    },
    depositItem: {
      create: jest.fn()
    },
    shareRecord: {
      create: jest.fn()
    },
    bankAccount: {
      findFirst: jest.fn(),
      update: jest.fn()
    },
    $transaction: jest.fn((cb) => cb(prisma))
  }
}));

jest.mock("../src/services/AccountingService", () => ({
  AccountingService: {
    postJournalEntry: jest.fn().mockResolvedValue({ id: "mock-journal-entry-id" })
  }
}));

describe("Deposit Creation Validation Layer (Zod)", () => {
  it("should validate valid bulk deposit payload", () => {
    const valid = createDepositSchema.safeParse({
      memberId: "12345678-1234-1234-1234-1234567890ab",
      paymentMode: "CASH",
      remarks: "Test remark",
      items: [
        {
          type: "WEEKLY_SUBSCRIPTION",
          amount: 100000, // 1000 BDT in Paisa
          periodDetails: "Week 01"
        },
        {
          type: "PENALTY",
          amount: 5000, // 50 BDT in Paisa
          periodDetails: "Fine"
        }
      ]
    });
    expect(valid.success).toBe(true);
  });

  it("should fail validation if items list is empty", () => {
    const invalid = createDepositSchema.safeParse({
      memberId: "12345678-1234-1234-1234-1234567890ab",
      paymentMode: "BANK",
      items: []
    });
    expect(invalid.success).toBe(false);
  });

  it("should fail validation if amount is not positive", () => {
    const invalid = createDepositSchema.safeParse({
      memberId: "12345678-1234-1234-1234-1234567890ab",
      paymentMode: "CASH",
      items: [
        {
          type: "WEEKLY_SUBSCRIPTION",
          amount: -500,
          periodDetails: "Week 01"
        }
      ]
    });
    expect(invalid.success).toBe(false);
  });
});

describe("DepositService Business Logic", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should throw NotFoundError if member profile is missing or soft-deleted", async () => {
    (prisma.member.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(
      DepositService.createBulkDeposit("officer-1", {
        memberId: "member-1",
        paymentMode: "CASH",
        items: [
          {
            type: "WEEKLY_SUBSCRIPTION",
            amount: 100000,
            periodDetails: "Week 01"
          }
        ]
      })
    ).rejects.toThrow("সদস্য খুঁজে পাওয়া যায়নি।");
  });

  it("should throw ValidationError if member is SUSPENDED and does not pay penalty", async () => {
    (prisma.member.findUnique as jest.Mock).mockResolvedValue({
      id: "member-1",
      status: "SUSPENDED",
      deletedAt: null
    });

    await expect(
      DepositService.createBulkDeposit("officer-1", {
        memberId: "member-1",
        paymentMode: "CASH",
        items: [
          {
            type: "WEEKLY_SUBSCRIPTION",
            amount: 100000,
            periodDetails: "Week 01"
          }
        ]
      })
    ).rejects.toThrow("সদস্য অ্যাকাউন্টটি সাসপেন্ড রয়েছে। বকেয়া ও ১০% জরিমানা (Penalty) পরিশোধ করে সচল করুন।");
  });

  it("should successfully log deposit, compute shares, and update Cash account balance", async () => {
    (prisma.member.findUnique as jest.Mock).mockResolvedValue({
      id: "member-1",
      memberCode: "MEM-001",
      name: "Ratul Ahmed",
      status: "ACTIVE",
      deletedAt: null
    });
    (prisma.deposit.count as jest.Mock).mockResolvedValue(0);
    (prisma.deposit.create as jest.Mock).mockResolvedValue({
      id: "deposit-1"
    });
    (prisma.bankAccount.findFirst as jest.Mock).mockResolvedValue({
      id: "cash-acc",
      name: "Cash on Hand",
      balance: 10000
    });

    const result = await DepositService.createBulkDeposit("officer-1", {
      memberId: "member-1",
      paymentMode: "CASH",
      remarks: "Main remark",
      items: [
        {
          type: "WEEKLY_SUBSCRIPTION",
          amount: 150000, // 1500 BDT in Paisa = 1.5 Shares
          periodDetails: "Week 02"
        },
        {
          type: "ADMISSION_FEE",
          amount: 500000, // 5000 BDT in Paisa = 0 Shares
          periodDetails: "Registration"
        }
      ]
    });

    expect(result.depositId).toBe("deposit-1");
    expect(result.receiptCode).toMatch(/^REC-\d{8}-0001$/);
    expect(result.totalAmount).toBe(650000);
    expect(result.memberName).toBe("Ratul Ahmed");

    // Verify weekly subscription share calculations (1.5 shares) and records creation
    expect(prisma.depositItem.create).toHaveBeenCalledTimes(2);
    expect(prisma.depositItem.create).toHaveBeenNthCalledWith(1, {
      data: {
        depositId: "deposit-1",
        type: "WEEKLY_SUBSCRIPTION",
        amount: 150000,
        sharesCount: 1.5,
        periodDetails: "Week 02"
      }
    });

    expect(prisma.shareRecord.create).toHaveBeenCalledTimes(1);
    expect(prisma.shareRecord.create).toHaveBeenCalledWith({
      data: {
        memberId: "member-1",
        transactionId: "deposit-1",
        count: 1.5,
        createdAt: expect.any(Date)
      }
    });

    // Cash box account balance incremented by 650000 (total amount in Paisa)
    expect(prisma.bankAccount.update).toHaveBeenCalledWith({
      where: { id: "cash-acc" },
      data: { balance: { increment: 650000 } }
    });
  });

  it("should reactivate a SUSPENDED member if their deposit includes a PENALTY item", async () => {
    (prisma.member.findUnique as jest.Mock).mockResolvedValue({
      id: "member-1",
      memberCode: "MEM-001",
      name: "Ratul Ahmed",
      status: "SUSPENDED",
      deletedAt: null
    });
    (prisma.deposit.count as jest.Mock).mockResolvedValue(5);
    (prisma.deposit.create as jest.Mock).mockResolvedValue({
      id: "deposit-2"
    });
    (prisma.bankAccount.findFirst as jest.Mock).mockResolvedValue({
      id: "bank-acc",
      name: "Bank Asia Account",
      balance: 50000
    });

    const result = await DepositService.createBulkDeposit("officer-1", {
      memberId: "member-1",
      paymentMode: "BANK",
      items: [
        {
          type: "PENALTY",
          amount: 50000,
          periodDetails: "Due fine penalty"
        }
      ]
    });

    expect(result.depositId).toBe("deposit-2");
    expect(prisma.member.update).toHaveBeenCalledWith({
      where: { id: "member-1" },
      data: { status: "ACTIVE" }
    });
    expect(prisma.bankAccount.update).toHaveBeenCalledWith({
      where: { id: "bank-acc" },
      data: { balance: { increment: 50000 } }
    });
  });
});
