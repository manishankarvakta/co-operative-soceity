import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";
import { AuthenticationError, ForbiddenError, NotFoundError, ValidationError } from "@/backend/errors";

export class AuthService {
  /**
   * Verifies credentials during login.
   * Checks password hash and active status restrictions.
   */
  static async verifyCredentials(email: string, passwordInput: string) {
    let user = await prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        },
        members: true
      }
    });

    if (!user) {
      const member = await prisma.member.findFirst({
        where: {
          deletedAt: null,
          OR: [
            { phone: email },
            { memberCode: { equals: email, mode: "insensitive" } }
          ]
        },
        include: {
          user: {
            include: {
              userRoles: {
                include: {
                  role: {
                    include: {
                      rolePermissions: {
                        include: {
                          permission: true
                        }
                      }
                    }
                  }
                }
              },
              members: true
            }
          }
        }
      });
      if (member && member.user) {
        user = member.user as any;
      }
    }

    if (!user || user.deletedAt) {
      throw new AuthenticationError();
    }

    // Verify Password Hash
    const passwordMatch = await bcrypt.compare(passwordInput, user.passwordHash);
    if (!passwordMatch) {
      throw new AuthenticationError();
    }

    // Check Member Profile Status if linked
    const memberProfile = user.members[0];
    if (memberProfile) {
      if (memberProfile.status === "SUSPENDED") {
        throw new ForbiddenError(
          "আপনার মেম্বারশিপ অ্যাকাউন্টটি সাসপেন্ড করা হয়েছে। বকেয়া ও ১০% জরিমানা দিয়ে সচল করুন।"
        );
      }
      if (memberProfile.status === "INACTIVE" || memberProfile.deletedAt) {
        throw new ForbiddenError("আপনার অ্যাকাউন্টটি সক্রিয় নয়।");
      }
    }

    // Extract roles and flat permission arrays
    const roles = user.userRoles.map((ur) => ur.role.name);
    const permissions = Array.from(
      new Set([
        ...(user.permissions || []),
        ...user.userRoles.flatMap((ur) =>
          ur.role.rolePermissions.map((rp) => rp.permission.name)
        )
      ])
    );

    return {
      id: user.id,
      email: user.email,
      roles,
      permissions,
      name: memberProfile?.name || "User",
      memberId: memberProfile?.id || null
    };
  }

  /**
   * Generates a 6-digit verification code and saves it to Redis.
   */
  static async generateResetOTP(emailOrPhone: string) {
    // Determine query mechanism
    const isEmail = emailOrPhone.includes("@");
    let userExists = false;

    if (isEmail) {
      const user = await prisma.user.findUnique({ where: { email: emailOrPhone } });
      userExists = !!user;
    } else {
      const member = await prisma.member.findUnique({ where: { phone: emailOrPhone } });
      userExists = !!member;
    }

    if (!userExists) {
      throw new NotFoundError("এই ইমেইল বা মোবাইল নম্বরটি সিস্টেমে নিবন্ধিত নয়।");
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Cache the OTP in Redis for 10 minutes
    const redisKey = `reset_otp:${emailOrPhone}`;
    await redis.set(redisKey, otp, "EX", 600);

    // In production, integrate SMS/Email gateway here.
    // For local logs and audit checks, log execution:
    console.info(`[AuthService] Generated OTP for ${emailOrPhone}: ${otp}`);

    return { success: true, message: "ভেরিফিকেশন কোড পাঠানো হয়েছে।" };
  }

  /**
   * Verifies the OTP and resets user's password.
   */
  static async verifyResetOTP(emailOrPhone: string, otpInput: string, newPasswordInput: string) {
    const redisKey = `reset_otp:${emailOrPhone}`;
    const cachedOtp = await redis.get(redisKey);

    if (!cachedOtp || cachedOtp !== otpInput) {
      throw new ValidationError("ভেরিফিকেশন কোডটি সঠিক নয় বা মেয়াদ শেষ হয়েছে।");
    }

    // Identify user
    const isEmail = emailOrPhone.includes("@");
    let userToUpdate = null;

    if (isEmail) {
      userToUpdate = await prisma.user.findUnique({ where: { email: emailOrPhone } });
    } else {
      const member = await prisma.member.findUnique({
        where: { phone: emailOrPhone },
        include: { user: true }
      });
      userToUpdate = member?.user;
    }

    if (!userToUpdate) {
      throw new NotFoundError("ব্যবহারকারী খুঁজে পাওয়া যায়নি।");
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(12);
    const newPasswordHash = await bcrypt.hash(newPasswordInput, salt);

    // Update password in DB
    await prisma.user.update({
      where: { id: userToUpdate.id },
      data: { passwordHash: newPasswordHash }
    });

    // Clean up Redis key
    await redis.del(redisKey);

    return { success: true, message: "পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে।" };
  }
}
