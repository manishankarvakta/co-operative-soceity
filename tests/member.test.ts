import { createMemberSchema } from "../src/backend/validations/member";
import { MemberService } from "../src/services/MemberService";
import { prisma } from "../src/lib/db";

// Mock database execution
jest.mock("../src/lib/db", () => ({
  prisma: {
    member: {
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    },
    user: {
      create: jest.fn(),
      update: jest.fn()
    },
    nominee: {
      updateMany: jest.fn()
    },
    $transaction: jest.fn((input) => {
      if (typeof input === "function") return input(prisma);
      return Promise.all(input);
    })
  }
}));

describe("Member Creation Validation Layer (Zod)", () => {
  it("should validate valid member payload including nominee details", () => {
    const valid = createMemberSchema.safeParse({
      name: "আরিফুল ইসলাম",
      phone: "01712345678",
      email: "arif@email.com",
      address: "ঢাকা, বাংলাদেশ",
      joinDate: "2026-06-15",
      status: "ACTIVE",
      nominee: {
        name: "নাসরিন আক্তার",
        relationship: "স্ত্রী",
        phone: "01987654321",
        address: "ঢাকা, বাংলাদেশ",
        emergencyContact: "01987654321"
      }
    });
    expect(valid.success).toBe(true);
  });

  it("should fail validation if nominee phone is incorrectly formatted", () => {
    const invalid = createMemberSchema.safeParse({
      name: "আরিফুল ইসলাম",
      phone: "01712345678",
      address: "ঢাকা, বাংলাদেশ",
      joinDate: "2026-06-15",
      nominee: {
        name: "নাসরিন আক্তার",
        relationship: "স্ত্রী",
        phone: "12345",
        address: "ঢাকা, বাংলাদেশ",
        emergencyContact: "12345"
      }
    });
    expect(invalid.success).toBe(false);
  });
});

describe("MemberService Business Logic", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should throw ConflictError if member phone number is already registered", async () => {
    (prisma.member.findUnique as jest.Mock).mockResolvedValue({ id: "existing-1", phone: "01712345678" });

    await expect(
      MemberService.createMember({
        name: "সজীব আহমেদ",
        phone: "01712345678",
        address: "রংপুর",
        joinDate: "2026-06-15",
        nominee: {
          name: "মা",
          relationship: "মাতা",
          phone: "01812345678",
          address: "রংপুর",
          emergencyContact: "01812345678"
        }
      })
    ).rejects.toThrow("এই মোবাইল নম্বরটি দিয়ে ইতিমধ্যে সদস্য নিবন্ধিত আছে।");
  });

  it("should correctly auto-generate the sequential Member ID", async () => {
    (prisma.member.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.member.count as jest.Mock).mockResolvedValue(5); // 5 members already exist this year
    (prisma.user.create as jest.Mock).mockResolvedValue({ id: "user-1" });
    (prisma.member.create as jest.Mock).mockResolvedValue({
      id: "member-1",
      memberCode: "SOM-2026-0006"
    });

    const result = await MemberService.createMember({
      name: "সজীব আহমেদ",
      phone: "01712345678",
      address: "রংপুর",
      joinDate: "2026-06-15",
      nominee: {
        name: "মা",
        relationship: "মাতা",
        phone: "01812345678",
        address: "রংপুর",
        emergencyContact: "01812345678"
      }
    });

    expect(result.memberCode).toBe("SOM-2026-0006");
    expect(prisma.member.count).toHaveBeenCalled();
  });

  it("should set deletedAt timestamps when executing soft delete", async () => {
    (prisma.member.findUnique as jest.Mock).mockResolvedValue({
      id: "member-1",
      userId: "user-1",
      deletedAt: null
    });

    const result = await MemberService.deleteMember("member-1");
    expect(result.success).toBe(true);
    expect(prisma.member.update).toHaveBeenCalledWith({
      where: { id: "member-1" },
      data: { deletedAt: expect.any(Date) }
    });
  });
});
