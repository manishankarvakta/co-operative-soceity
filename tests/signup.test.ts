import { MemberService } from "../src/services/MemberService";
import { AuthService } from "../src/services/AuthService";
import { prisma } from "../src/lib/db";

describe("Public Signup & Login Verification", () => {
  beforeEach(async () => {
    // Clean up test data if any
    try {
      await prisma.member.deleteMany({
        where: { phone: "01799999999" }
      });
      await prisma.user.deleteMany({
        where: { email: "testsignedup@example.com" }
      });
    } catch (e) { }
  });

  afterAll(async () => {
    // Clean up test data
    try {
      await prisma.member.deleteMany({
        where: { phone: "01799999999" }
      });
      await prisma.user.deleteMany({
        where: { email: "testsignedup@example.com" }
      });
    } catch (e) { }
    await prisma.$disconnect();
  });

  it("should successfully register a member with a custom password and verify login", async () => {
    const nominee = {
      name: "Test Nominee",
      relationship: "Spouse",
      phone: "01788888888",
      address: "Dhaka, Bangladesh",
      emergencyContact: "01788888888"
    };

    // Register member with custom password
    const member = await MemberService.createMember({
      name: "Test Signed Up Member",
      phone: "01799999999",
      email: "testsignedup@example.com",
      address: "Dhaka, Bangladesh",
      joinDate: new Date().toISOString(),
      nominee,
      password: "secretpassword123"
    });

    expect(member).toBeDefined();
    expect(member.name).toBe("Test Signed Up Member");

    // Login verification using Email
    const userViaEmail = await AuthService.verifyCredentials("testsignedup@example.com", "secretpassword123");
    expect(userViaEmail).toBeDefined();
    expect(userViaEmail.email).toBe("testsignedup@example.com");

    // Login verification using Phone Number
    const userViaPhone = await AuthService.verifyCredentials("01799999999", "secretpassword123");
    expect(userViaPhone).toBeDefined();
    expect(userViaPhone.email).toBe("testsignedup@example.com");

    // Login verification using Member ID (memberCode)
    const userViaCode = await AuthService.verifyCredentials(member.memberCode, "secretpassword123");
    expect(userViaCode).toBeDefined();
    expect(userViaCode.email).toBe("testsignedup@example.com");

    // Failed login verification with wrong password
    await expect(AuthService.verifyCredentials("01799999999", "wrongpassword")).rejects.toThrow();
  });
});
