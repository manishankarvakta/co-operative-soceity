import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { AuditService } from "@/services/AuditService";

interface Context { params: Promise<{ id: string }> }

export async function PUT(request: Request, { params }: Context) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 401 });
    }

    // Role changes are restricted to SUPER_ADMIN
    const userRoles = (session.user as any).roles || [];
    if (!userRoles.includes("SUPER_ADMIN")) {
      return NextResponse.json({ error: "অনুমতি নেই। শুধুমাত্র সুপার এডমিন রোল পরিবর্তন করতে পারবেন।" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { role: newRoleName } = body;

    const allowedRoles = ["MEMBER", "ACCOUNTANT", "SUPER_ADMIN"];
    if (!newRoleName || !allowedRoles.includes(newRoleName)) {
      return NextResponse.json({ error: "ভুল রোল নির্বাচন করা হয়েছে।" }, { status: 400 });
    }

    const member = await prisma.member.findUnique({
      where: { id },
      select: { userId: true, name: true, memberCode: true }
    });

    if (!member) {
      return NextResponse.json({ error: "সদস্য পাওয়া যায়নি।" }, { status: 404 });
    }

    if (!member.userId) {
      return NextResponse.json({ error: "সদস্যের সাথে কোনো ইউজার অ্যাকাউন্ট যুক্ত নেই।" }, { status: 400 });
    }

    const targetRole = await prisma.role.findUnique({
      where: { name: newRoleName }
    });

    if (!targetRole) {
      return NextResponse.json({ error: "সিস্টেমে এই রোলটি খুঁজে পাওয়া যায়নি।" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // Delete existing roles
      await tx.userRole.deleteMany({
        where: { userId: member.userId as string }
      });

      // Create new role assignment
      await tx.userRole.create({
        data: {
          userId: member.userId as string,
          roleId: targetRole.id
        }
      });

      // Log the action to audit
      await AuditService.log({
        userId: session.user.id,
        action: "UPDATE",
        tableName: "UserRole",
        recordId: member.userId as string,
        newData: { memberId: id, memberName: member.name, memberCode: member.memberCode, newRole: newRoleName },
        tx
      });
    });

    return NextResponse.json({ success: true, message: "রোল সফলভাবে পরিবর্তন করা হয়েছে।" });
  } catch (error) {
    console.error("PUT Update Member Role Exception:", error);
    return NextResponse.json(
      { success: false, code: "INTERNAL_SERVER_ERROR", message: "সার্ভারে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
