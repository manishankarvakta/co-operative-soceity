import { NomineeService } from "../src/services/NomineeService";
import { prisma } from "../src/lib/db";
import { nomineeSchema } from "../src/backend/validations/member";

// Mock prisma client
jest.mock("../src/lib/db", () => ({
  prisma: {
    nominee: {
      findUnique: jest.fn(),
      update: jest.fn()
    }
  }
}));

describe("Nominee Schema Validation", () => {
  it("should validate correctly formatted nominee properties", () => {
    const valid = nomineeSchema.safeParse({
      name: "নাসিমা আক্তার",
      relationship: "মাতা",
      phone: "01812345678",
      address: "রংপুর সদর",
      emergencyContact: "01812345678"
    });
    expect(valid.success).toBe(true);
  });

  it("should fail validation if name is empty or too short", () => {
    const invalid = nomineeSchema.safeParse({
      name: "ম",
      relationship: "মাতা",
      phone: "01812345678",
      address: "রংপুর",
      emergencyContact: "01812345678"
    });
    expect(invalid.success).toBe(false);
  });
});

describe("NomineeService Operations", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should throw NotFoundError if nominee does not exist in DB", async () => {
    (prisma.nominee.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(
      NomineeService.getNomineeByMemberId("member-1")
    ).rejects.toThrow("নমিনীর তথ্য খুঁজে পাওয়া যায়নি।");
  });

  it("should return nominee details if member ID exists", async () => {
    const mockNominee = {
      id: "nominee-1",
      memberId: "member-1",
      name: "নাসিমা আক্তার",
      relationship: "মাতা",
      phone: "01812345678",
      address: "রংপুর",
      emergencyContact: "01812345678",
      deletedAt: null
    };
    (prisma.nominee.findUnique as jest.Mock).mockResolvedValue(mockNominee);

    const result = await NomineeService.getNomineeByMemberId("member-1");
    expect(result.name).toBe("নাসিমা আক্তার");
    expect(result.memberId).toBe("member-1");
  });

  it("should update nominee details successfully", async () => {
    (prisma.nominee.findUnique as jest.Mock).mockResolvedValue({
      id: "nominee-1",
      memberId: "member-1",
      deletedAt: null
    });
    (prisma.nominee.update as jest.Mock).mockResolvedValue({
      id: "nominee-1",
      name: "নাসিমা খান"
    });

    const result = await NomineeService.updateNominee("member-1", {
      name: "নাসিমা খান"
    });

    expect(result.name).toBe("নাসিমা খান");
    expect(prisma.nominee.update).toHaveBeenCalledWith({
      where: { memberId: "member-1" },
      data: { name: "নাসিমা খান" }
    });
  });
});
