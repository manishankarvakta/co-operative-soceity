import { NextResponse } from "next/server";
import { DepositService } from "@/services/DepositService";
import { BaseError } from "@/backend/errors";
import { auth } from "@/lib/auth";
import { canAccess } from "@/lib/rbac";

interface Context { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: Context) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 401 });
    }

    const { id } = await params;
    const deposit = await DepositService.getDepositById(id);

    // Allow if user is SUPER_ADMIN/ACCOUNTANT, or if deposit belongs to the requesting member
    const isOwner = session.user.memberId && session.user.memberId === deposit.memberId;
    const hasReadAccess = canAccess(session.user as any, "deposits", "read");

    if (!isOwner && !hasReadAccess) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 403 });
    }

    return NextResponse.json(deposit);
  } catch (error) {
    if (error instanceof BaseError) {
      return NextResponse.json(
        { success: false, code: error.errorCode, message: error.message },
        { status: error.statusCode }
      );
    }

    console.error("GET Specific Deposit Exception:", error);
    return NextResponse.json(
      { success: false, code: "INTERNAL_SERVER_ERROR", message: "সার্ভারে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}

