import * as bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { ConflictError, NotFoundError, ValidationError } from "@/backend/errors";
import { DashboardService } from "./DashboardService";
import { MemberStatus } from "@prisma/client";
import { NotificationService } from "./NotificationService";
import { AuditService } from "./AuditService";

export class MemberService {
  /**
   * Auto-generates a sequential Member ID (SOM-YYYY-XXXX).
   */
  static async generateMemberCode(joinDate: Date): Promise<string> {
    const year = joinDate.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);

    // Get count of members registered in the target year
    const count = await prisma.member.count({
      where: {
        joinDate: {
          gte: startOfYear,
          lte: endOfYear
        }
      }
    });

    const nextSequence = (count + 1).toString().padStart(4, "0");
    return `SOM-${year}-${nextSequence}`;
  }

  /**
   * Registers a new member along with nominee details and a default user account.
   */
  static async createMember(
    data: {
      name: string;
      phone: string;
      email?: string;
      address: string;
      joinDate: string;
      status?: MemberStatus;
      nominee: {
        name: string;
        relationship: string;
        phone: string;
        address: string;
        emergencyContact: string;
      };
      password?: string;
      paymentMode?: "CASH" | "BANK";
      bankAccountId?: string | null;
      admissionFee?: number;
    },
    actorId?: string | null
  ) {
    if (data.phone === data.nominee.phone) {
      throw new ValidationError("সদস্য এবং নমিনীর মোবাইল নম্বর একই হতে পারবে না।");
    }
    // 1. Validate phone uniqueness
    const existingPhone = await prisma.member.findUnique({
      where: { phone: data.phone }
    });

    if (existingPhone && !existingPhone.deletedAt) {
      throw new ConflictError("এই মোবাইল নম্বরটি দিয়ে ইতিমধ্যে সদস্য নিবন্ধিত আছে।");
    }

    const parsedJoinDate = new Date(data.joinDate);
    const memberCode = await this.generateMemberCode(parsedJoinDate);

    // 2. Hash default credentials (use password if provided, else fall back to phone number)
    const salt = await bcrypt.genSalt(12);
    const passwordToHash = data.password || data.phone;
    const defaultPasswordHash = await bcrypt.hash(passwordToHash, salt);
    const defaultEmail = data.email || `${memberCode.toLowerCase()}@somity.com`;

    // 3. Execute transaction creating User, Member, and Nominee
    const result = await prisma.$transaction(async (tx) => {
      // Create user login credentials
      const user = await tx.user.create({
        data: {
          email: defaultEmail,
          passwordHash: defaultPasswordHash,
          userRoles: {
            create: {
              role: {
                connect: { name: "MEMBER" }
              }
            }
          }
        }
      });

      // Create member profile linked to user account
      const member = await tx.member.create({
        data: {
          userId: user.id,
          memberCode,
          name: data.name,
          phone: data.phone,
          email: defaultEmail,
          address: data.address,
          joinDate: parsedJoinDate,
          status: data.status || "ACTIVE",
          nominee: {
            create: {
              name: data.nominee.name,
              relationship: data.nominee.relationship,
              phone: data.nominee.phone,
              address: data.nominee.address,
              emergencyContact: data.nominee.emergencyContact
            }
          }
        },
        include: {
          nominee: true
        }
      });

      // Create audit log for Member creation
      await AuditService.log({
        userId: actorId || null,
        action: "CREATE",
        tableName: "Member",
        recordId: member.id,
        newData: member,
        tx
      });

      // Automatically generate Admission Fee deposit if deposit model is mocked/available
      if (tx.deposit) {
        const mockCheck = await tx.member.findUnique({ where: { id: member.id } });
        if (mockCheck) {
          const { DepositService } = await import("./DepositService");
          const feeInPaisa = typeof data.admissionFee === "number" ? data.admissionFee * 100 : 500000;
          await DepositService.createBulkDeposit(
            actorId || user.id,
            {
              memberId: member.id,
              paymentMode: (data.paymentMode as any) || "CASH",
              bankAccountId: data.bankAccountId,
              remarks: "স্বয়ংক্রিয় ভর্তি ফি জমাকরণ",
              items: [
                {
                  type: "ADMISSION_FEE",
                  amount: feeInPaisa,
                  periodDetails: `Admission Fee - ${member.memberCode}`
                }
              ]
            },
            tx
          );
        }
      }

      return member;
    });

    await DashboardService.invalidateCache();

    if (result.email) {
      try {
        await NotificationService.sendWelcomeNotice(
          result.email,
          result.name,
          result.memberCode,
          data.phone, // phone acts as default password
          result.userId || undefined
        );
      } catch (err) {
        console.error("[MemberService] Welcome email notification trigger failed:", err);
      }
    }

    return result;
  }

  /**
   * Updates existing member and nominee profiles.
   */
  static async updateMember(
    id: string,
    data: {
      name?: string;
      phone?: string;
      email?: string;
      address?: string;
      joinDate?: string;
      status?: MemberStatus;
      nominee?: {
        name?: string;
        relationship?: string;
        phone?: string;
        address?: string;
        emergencyContact?: string;
      };
    },
    actorId?: string | null
  ) {
    const member = await prisma.member.findUnique({
      where: { id },
      include: { nominee: true }
    });

    if (!member || member.deletedAt) {
      throw new NotFoundError("সদস্য খুঁজে পাওয়া যায়নি।");
    }

    // Handle phone update uniqueness
    if (data.phone && data.phone !== member.phone) {
      const existingPhone = await prisma.member.findUnique({
        where: { phone: data.phone }
      });
      if (existingPhone && !existingPhone.deletedAt) {
        throw new ConflictError("এই মোবাইল নম্বরটি ইতিমধ্যে ব্যবহার করা হয়েছে।");
      }
    }

    const targetPhone = data.phone || member.phone;
    const targetNomineePhone = data.nominee?.phone || member.nominee?.phone;
    if (targetPhone && targetNomineePhone && targetPhone === targetNomineePhone) {
      throw new ValidationError("সদস্য এবং নমিনীর মোবাইল নম্বর একই হতে পারবে না।");
    }

    const updatedData: any = {
      name: data.name,
      phone: data.phone,
      email: data.email,
      address: data.address,
      status: data.status,
      joinDate: data.joinDate ? new Date(data.joinDate) : undefined
    };

    // Include nominee nested updates if provided
    if (data.nominee && member.nominee) {
      updatedData.nominee = {
        update: {
          name: data.nominee.name,
          relationship: data.nominee.relationship,
          phone: data.nominee.phone,
          address: data.nominee.address,
          emergencyContact: data.nominee.emergencyContact
        }
      };
    }

    const statusChangedToSuspended =
      data.status === "SUSPENDED" && member.status !== "SUSPENDED";

    const result = await prisma.member.update({
      where: { id },
      data: updatedData,
      include: { nominee: true }
    });

    await DashboardService.invalidateCache();

    if (statusChangedToSuspended && result.email) {
      await NotificationService.sendSuspensionNotice(
        result.email,
        result.name,
        "ম্যানুয়াল রিভিউয়ের ভিত্তিতে স্থগিতকরণ নোটিশ",
        result.userId || undefined
      );
    }

    await AuditService.log({
      userId: actorId || null,
      action: "UPDATE",
      tableName: "Member",
      recordId: id,
      oldData: member,
      newData: result
    });

    return result;
  }

  /**
   * Performs a soft delete on the Member, Nominee, and linked User account.
   */
  static async deleteMember(id: string, actorId?: string | null) {
    const member = await prisma.member.findUnique({ where: { id } });

    if (!member || member.deletedAt) {
      throw new NotFoundError("সদস্য খুঁজে পাওয়া যায়নি।");
    }

    const timestamp = new Date();

    await prisma.$transaction([
      // Soft-delete member profile
      prisma.member.update({
        where: { id },
        data: { deletedAt: timestamp }
      }),
      // Soft-delete linked nominee details
      prisma.nominee.updateMany({
        where: { memberId: id },
        data: { deletedAt: timestamp }
      }),
      // Soft-delete linked user account if exists
      ...(member.userId
        ? [
            prisma.user.update({
              where: { id: member.userId },
              data: { deletedAt: timestamp }
            })
          ]
        : [])
    ]);

    await DashboardService.invalidateCache();

    await AuditService.log({
      userId: actorId || null,
      action: "DELETE",
      tableName: "Member",
      recordId: id,
      oldData: member,
      newData: { deletedAt: timestamp }
    });

    return { success: true, message: "সদস্য অ্যাকাউন্টটি সফলভাবে মুছে ফেলা হয়েছে।" };
  }

  /**
   * Lists and searches members with filter params.
   */
  static async listMembers(params: {
    search?: string;
    status?: MemberStatus;
    page?: number;
    limit?: number;
    role?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      deletedAt: null,
      status: params.status || undefined
    };

    if (params.role) {
      whereClause.user = {
        userRoles: {
          some: {
            role: {
              name: params.role
            }
          }
        }
      };
    }

    if (params.search) {
      whereClause.OR = [
        { name: { contains: params.search, mode: "insensitive" } },
        { phone: { contains: params.search } },
        { memberCode: { contains: params.search, mode: "insensitive" } }
      ];
    }

    const [members, totalCount] = await Promise.all([
      prisma.member.findMany({
        where: whereClause,
        include: { nominee: true },
        skip,
        take: limit,
        orderBy: { memberCode: "asc" }
      }),
      prisma.member.count({ where: whereClause })
    ]);

    return {
      members,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        limit
      }
    };
  }

  /**
   * Fetches specific profile by ID.
   */
  static async getMemberById(id: string) {
    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        nominee: true,
        user: {
          include: {
            userRoles: {
              include: {
                role: true
              }
            }
          }
        }
      }
    });

    if (!member || member.deletedAt) {
      throw new NotFoundError("সদস্য খুঁজে পাওয়া যায়নি।");
    }

    return member;
  }

  /**
   * Evaluates active member deposits and suspends accounts with zero contributions over 12 consecutive weeks.
   */
  static async evaluateSuspensions(): Promise<string[]> {
    const twelveWeeksAgo = new Date();
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 12 * 7);

    // Query active members
    const activeMembers = await prisma.member.findMany({
      where: {
        status: "ACTIVE",
        deletedAt: null
      }
    });

    const suspendedIds: string[] = [];

    for (const member of activeMembers) {
      // Find if there is any deposit recorded in the last 12 weeks
      const recentDeposit = await prisma.deposit.findFirst({
        where: {
          memberId: member.id,
          deletedAt: null,
          createdAt: { gte: twelveWeeksAgo }
        }
      });

      if (!recentDeposit) {
        // Suspend the member
        await prisma.member.update({
          where: { id: member.id },
          data: { status: "SUSPENDED" }
        });

        // Trigger suspension email/in-app notification
        if (member.email) {
          await NotificationService.sendSuspensionNotice(
            member.email,
            member.name,
            "গত ১২ সপ্তাহ ধরে কোনো সঞ্চয় বা কিস্তি জমা পরিশোধ না করার জন্য সাময়িক স্থগিতকরণ নোটিশ।",
            member.userId || undefined
          );
        }

        suspendedIds.push(member.id);
      }
    }

    if (suspendedIds.length > 0) {
      await DashboardService.invalidateCache();
    }

    return suspendedIds;
  }
}
