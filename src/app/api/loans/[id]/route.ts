import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { BaseError } from "@/backend/errors";

interface Context {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: Context) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 401 });
    }

    const { id } = await params;

    const loan = await prisma.loan.findUnique({
      where: { id },
      include: {
        member: {
          include: { nominee: true }
        },
        schedules: {
          orderBy: { emiNumber: "asc" }
        },
        payments: {
          orderBy: { paymentDate: "desc" }
        }
      }
    });

    if (!loan || loan.deletedAt) {
      return NextResponse.json(
        { success: false, code: "NOT_FOUND", message: "ঋণ অ্যাকাউন্টটি খুঁজে পাওয়া যায়নি।" },
        { status: 404 }
      );
    }

    // Dynamic security checks
    const isOwner = session.user.memberId && session.user.memberId === loan.memberId;
    const isStaffOrAdmin = session.user.roles?.some((role: string) =>
      ["SUPER_ADMIN", "ACCOUNTANT", "PRESIDENT", "SECRETARY", "TREASURER"].includes(role)
    );

    if (!isOwner && !isStaffOrAdmin) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 403 });
    }

    return NextResponse.json(loan);
  } catch (error) {
    if (error instanceof BaseError) {
      return NextResponse.json(
        { success: false, code: error.errorCode, message: error.message },
        { status: error.statusCode }
      );
    }

    console.error("GET Specific Loan Exception:", error);
    return NextResponse.json(
      { success: false, code: "INTERNAL_SERVER_ERROR", message: "সার্ভারে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
