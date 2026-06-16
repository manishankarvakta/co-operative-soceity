import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ExpenseService } from "@/services/ExpenseService";
import { BaseError } from "@/backend/errors";
import { canAccess } from "@/lib/rbac";

interface Context { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Context) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 401 });
    }

    // RBAC access check
    if (!canAccess(session.user as any, "expenses", "approve")) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 403 });
    }

    const adminId = session.user.id;
    const { id } = await params;

    const result = await ExpenseService.approveExpense(adminId, id);
    return NextResponse.json({ success: true, expense: result });
  } catch (error) {
    if (error instanceof BaseError) {
      return NextResponse.json(
        { success: false, code: error.errorCode, message: error.message },
        { status: error.statusCode }
      );
    }

    console.error("POST Approve Expense Exception:", error);
    return NextResponse.json(
      { success: false, code: "INTERNAL_SERVER_ERROR", message: "সার্ভারে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}

