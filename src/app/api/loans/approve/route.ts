import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { LoanService } from "@/services/LoanService";
import { approveLoanSchema } from "@/backend/validations/loan";
import { BaseError } from "@/backend/errors";
import { canAccess } from "@/lib/rbac";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = approveLoanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          code: "VALIDATION_ERROR",
          message: parsed.error.issues[0].message
        },
        { status: 400 }
      );
    }

    const { loanId, status, paymentMode, bankAccountId, remarks } = parsed.data;

    // Dynamically check permission based on the status action
    const action = status === "APPROVED" ? "approve" : "reject";
    if (!canAccess(session.user as any, "loans", action)) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 403 });
    }

    const loan = await LoanService.approveLoan(loanId, status, session.user.id, {
      paymentMode,
      bankAccountId,
      remarks
    });

    return NextResponse.json({ success: true, loan });
  } catch (error) {
    if (error instanceof BaseError) {
      return NextResponse.json(
        { success: false, code: error.errorCode, message: error.message },
        { status: error.statusCode }
      );
    }

    console.error("POST Approve Loan Exception:", error);
    return NextResponse.json(
      { success: false, code: "INTERNAL_SERVER_ERROR", message: "সার্ভারে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
