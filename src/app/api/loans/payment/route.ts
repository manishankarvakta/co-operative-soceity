import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { LoanService } from "@/services/LoanService";
import { loanPaymentSchema } from "@/backend/validations/loan";
import { BaseError } from "@/backend/errors";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 401 });
    }

    const isOfficer = session.user.roles?.some((role: string) =>
      ["SUPER_ADMIN", "ACCOUNTANT"].includes(role)
    );
    if (!isOfficer) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = loanPaymentSchema.safeParse(body);
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

    const { loanId, amount, paymentMode, bankAccountId, remarks } = parsed.data;

    const payment = await LoanService.receivePayment(
      loanId,
      amount,
      paymentMode,
      bankAccountId,
      session.user.id,
      remarks
    );

    return NextResponse.json({ success: true, payment }, { status: 201 });
  } catch (error) {
    if (error instanceof BaseError) {
      return NextResponse.json(
        { success: false, code: error.errorCode, message: error.message },
        { status: error.statusCode }
      );
    }

    console.error("POST Loan Payment Exception:", error);
    return NextResponse.json(
      { success: false, code: "INTERNAL_SERVER_ERROR", message: "সার্ভারে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
