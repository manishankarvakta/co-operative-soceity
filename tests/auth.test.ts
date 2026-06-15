import { loginSchema, resetRequestSchema, resetVerifySchema } from "../src/backend/validations/auth";
import { AuthService } from "../src/services/AuthService";
import { prisma } from "../src/lib/db";
import { redis } from "../src/lib/redis";

// Mock database and cache engines
jest.mock("../src/lib/db", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn()
    },
    member: {
      findUnique: jest.fn()
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

describe("Authentication Validation Layer (Zod)", () => {
  it("should validate correctly formatted emails and pass settings", () => {
    const valid = loginSchema.safeParse({
      email: "test@domain.com",
      password: "securepassword",
      rememberMe: true
    });
    expect(valid.success).toBe(true);
  });

  it("should fail validation if password is less than 6 characters", () => {
    const invalid = loginSchema.safeParse({
      email: "test@domain.com",
      password: "123"
    });
    expect(invalid.success).toBe(false);
    if (!invalid.success) {
      expect(invalid.error.issues[0].message).toBe("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।");
    }
  });

  it("should validate Bangladeshi phone operator structures", () => {
    const phoneValid = resetRequestSchema.safeParse({
      emailOrPhone: "01712345678"
    });
    expect(phoneValid.success).toBe(true);

    const intlPhoneValid = resetRequestSchema.safeParse({
      emailOrPhone: "+8801912345678"
    });
    expect(intlPhoneValid.success).toBe(true);

    const invalid = resetRequestSchema.safeParse({
      emailOrPhone: "12345"
    });
    expect(invalid.success).toBe(false);
  });
});

describe("AuthService Reset Password Flow", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should generate a 6-digit OTP code and store it in Redis", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "user-1", email: "test@domain.com" });
    (redis.set as jest.Mock).mockResolvedValue("OK");

    const result = await AuthService.generateResetOTP("test@domain.com");
    expect(result.success).toBe(true);
    expect(redis.set).toHaveBeenCalledWith(
      "reset_otp:test@domain.com",
      expect.stringMatching(/^\d{6}$/),
      "EX",
      600
    );
  });

  it("should block resetting password if OTP is incorrect or expired", async () => {
    (redis.get as jest.Mock).mockResolvedValue(null); // Simulated expire state

    await expect(
      AuthService.verifyResetOTP("test@domain.com", "123456", "newpassword")
    ).rejects.toThrow("ভেরিফিকেশন কোডটি সঠিক নয় বা মেয়াদ শেষ হয়েছে।");
  });

  it("should reset password and clean Redis key if OTP is correct", async () => {
    (redis.get as jest.Mock).mockResolvedValue("123456");
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "user-1", email: "test@domain.com" });
    (prisma.user.update as jest.Mock).mockResolvedValue({ id: "user-1" });
    (redis.del as jest.Mock).mockResolvedValue(1);

    const result = await AuthService.verifyResetOTP("test@domain.com", "123456", "newpassword");
    expect(result.success).toBe(true);
    expect(prisma.user.update).toHaveBeenCalled();
    expect(redis.del).toHaveBeenCalledWith("reset_otp:test@domain.com");
  });
});
