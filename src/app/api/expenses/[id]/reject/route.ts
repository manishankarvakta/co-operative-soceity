import { NextResponse } from "next/server";
import { auth } from "../../../../lib/auth";
import { ExpenseService } from "../../../../services/ExpenseService";
import { BaseError } from "../../../../backend/errors";

interface Context {
  params: {
    id: string;
  };
}

export async function POST(request: Request, { params }: Context) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 401 });
    }

    const roles = (session.user as any).roles || [];
    const isAdminOrAccountant = roles.some((r: any) => r.role.name === "SUPER_ADMIN" || r.role.name === "ACCOUNTANT");
    if (!isAdminOrAccountant) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 403 });
    }

    const adminId = session.user.id;
    const { id } = params;

    const result = await ExpenseService.rejectExpense(adminId, id);
    return NextResponse.json({ success: true, expense: result });
  } catch (error) {
    if (error instanceof BaseError) {
      return NextResponse.json(
        { success: false, code: error.errorCode, message: error.message },
        { status: error.statusCode }
      );
    }

    console.error("POST Reject Expense Exception:", error);
    return NextResponse.json(
      { success: false, code: "INTERNAL_SERVER_ERROR", message: "সার্ভারে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
