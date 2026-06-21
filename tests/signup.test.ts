import { MemberService } from "../src/services/MemberService";
import { AuthService } from "../src/services/AuthService";
import { prisma } from "../src/lib/db";

describe("Public Signup & Login Verification", () => {
  const cleanTestData = async () => {
    try {
      const existingMember = await prisma.member.findFirst({
        where: { phone: "01799999999" }
      });
      if (existingMember) {
        await prisma.nominee.deleteMany({ where: { memberId: existingMember.id } });
        await prisma.shareRecord.deleteMany({ where: { memberId: existingMember.id } });
        
        const deposits = await prisma.deposit.findMany({ where: { memberId: existingMember.id } });
        const depositIds = deposits.map(d => d.id);
        
        await prisma.depositItem.deleteMany({ where: { depositId: { in: depositIds } } });
        await prisma.deposit.deleteMany({ where: { memberId: existingMember.id } });
        
        await prisma.member.delete({ where: { id: existingMember.id } });
      }
      await prisma.user.deleteMany({
        where: { email: "testsignedup@example.com" }
      });
    } catch (e) {
      console.error("Cleanup error:", e);
    }
  };

  beforeEach(async () => {
    await cleanTestData();
  });

  afterAll(async () => {
    await cleanTestData();
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
