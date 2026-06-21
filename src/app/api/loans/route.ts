import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canAccess } from "@/lib/rbac";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 401 });
    }

    if (!canAccess(session.user as any, "loans", "read")) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const reqMemberId = searchParams.get("memberId");

    const isStaffOrAdmin = session.user.roles?.some((role: string) =>
      ["SUPER_ADMIN", "ACCOUNTANT", "PRESIDENT", "SECRETARY", "TREASURER"].includes(role)
    );

    let whereClause: any = { deletedAt: null };

    // If member, restrict to their own records
    if (!isStaffOrAdmin) {
      if (!session.user.memberId) {
        return NextResponse.json({ success: true, loans: [] });
      }
      whereClause.memberId = session.user.memberId;
    } else if (reqMemberId) {
      whereClause.memberId = reqMemberId;
    }

    if (status) {
      whereClause.status = status;
    }

    const loans = await prisma.loan.findMany({
      where: whereClause,
      include: {
        member: true,
        schedules: {
          orderBy: { emiNumber: "asc" }
        },
        payments: {
          orderBy: { paymentDate: "desc" }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, loans });
  } catch (error) {
    console.error("GET Loans List Exception:", error);
    return NextResponse.json(
      { success: false, code: "INTERNAL_SERVER_ERROR", message: "সার্ভারে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
