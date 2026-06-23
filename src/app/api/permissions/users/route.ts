import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { AuditService } from "@/services/AuditService";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 401 });
    }

    const userRoles = (session.user as any).roles || [];
    if (!userRoles.includes("SUPER_ADMIN")) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
        OR: [
          { email: { contains: search, mode: "insensitive" } },
          {
            members: {
              some: {
                name: { contains: search, mode: "insensitive" }
              }
            }
          }
        ]
      },
      include: {
        userRoles: {
          include: {
            role: true
          }
        },
        members: {
          select: {
            id: true,
            name: true,
            memberCode: true,
            phone: true,
            status: true,
            joinDate: true
          }
        }
      },
      orderBy: { email: "asc" }
    });

    // Map to a cleaner user object
    const result = users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.members[0]?.name || "User",
      memberCode: u.members[0]?.memberCode || null,
      phone: u.members[0]?.phone || "",
      status: u.members[0]?.status || "ACTIVE",
      joinDate: u.members[0]?.joinDate || null,
      memberId: u.members[0]?.id || null,
      roles: u.userRoles.map((ur) => ur.role.name),
      roleIds: u.userRoles.map((ur) => ur.roleId),
      permissions: u.permissions || []
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET Users Permissions Exception:", error);
    return NextResponse.json(
      { success: false, code: "INTERNAL_SERVER_ERROR", message: "সার্ভারে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 401 });
    }

    const userRoles = (session.user as any).roles || [];
    if (!userRoles.includes("SUPER_ADMIN")) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, roleIds, permissions } = body;

    if (!userId) {
      return NextResponse.json({ error: "ব্যবহারকারী আইডি আবশ্যক।" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: true
      }
    });

    if (!targetUser) {
      return NextResponse.json({ error: "ব্যবহারকারী খুঁজে পাওয়া যায়নি।" }, { status: 404 });
    }

    // Check if targetUser is SUPER_ADMIN and we are trying to remove their SUPER_ADMIN role
    const isTargetSuperAdmin = targetUser.id === session.user.id;
    if (isTargetSuperAdmin) {
      // Find the SUPER_ADMIN role ID
      const superAdminRole = await prisma.role.findUnique({ where: { name: "SUPER_ADMIN" } });
      if (superAdminRole && !roleIds.includes(superAdminRole.id)) {
        return NextResponse.json({ error: "আপনি নিজের সুপার এডমিন রোল বাতিল করতে পারবেন না।" }, { status: 400 });
      }
    }

    await prisma.$transaction(async (tx) => {
      // 1. Update direct permissions array
      await tx.user.update({
        where: { id: userId },
        data: {
          permissions: permissions || []
        }
      });

      // 2. Update user roles: delete old ones, add new ones
      await tx.userRole.deleteMany({
        where: { userId }
      });

      if (roleIds && Array.isArray(roleIds)) {
        for (const rId of roleIds) {
          await tx.userRole.create({
            data: {
              userId,
              roleId: rId
            }
          });
        }
      }

      await AuditService.log({
        userId: session.user.id,
        action: "UPDATE",
        tableName: "User",
        recordId: userId,
        newData: { roleIds, permissions },
        tx
      });
    });

    return NextResponse.json({ success: true, message: "ব্যবহারকারীর পারমিশন সফলভাবে পরিবর্তন করা হয়েছে।" });
  } catch (error) {
    console.error("PUT Users Permissions Exception:", error);
    return NextResponse.json(
      { success: false, code: "INTERNAL_SERVER_ERROR", message: "সার্ভারে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
