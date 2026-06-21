import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { LoanService } from "@/services/LoanService";
import { applyLoanSchema } from "@/backend/validations/loan";
import { BaseError } from "@/backend/errors";
import { canAccess } from "@/lib/rbac";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 401 });
    }

    if (!canAccess(session.user as any, "loans", "write")) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 403 });
    }

    const isStaffOrAdmin = session.user.roles?.some((role: string) =>
      ["SUPER_ADMIN", "ACCOUNTANT", "PRESIDENT", "SECRETARY", "TREASURER"].includes(role)
    );

    const memberId = session.user.memberId;
    if (!memberId && !isStaffOrAdmin) {
      return NextResponse.json(
        { success: false, code: "FORBIDDEN", message: "শুধুমাত্র নিবন্ধিত সদস্যরাই ঋণের জন্য আবেদন করতে পারবেন।" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = applyLoanSchema.safeParse(body);
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

    const targetMemberId = (isStaffOrAdmin && parsed.data.memberId) ? parsed.data.memberId : session.user.memberId;

    if (!targetMemberId) {
      return NextResponse.json(
        { success: false, code: "BAD_REQUEST", message: "ঋণের জন্য সদস্য আইডি প্রদান করা আবশ্যক।" },
        { status: 400 }
      );
    }

    const { amount, interestRate, durationValue, durationType, guarantor1Id, guarantor2Id, bypassLimit, remarks } = parsed.data;
    const loan = await LoanService.applyLoan(
      targetMemberId,
      amount,
      interestRate,
      durationValue,
      durationType,
      guarantor1Id,
      guarantor2Id,
      bypassLimit,
      remarks
    );

    return NextResponse.json({ success: true, loan }, { status: 201 });
  } catch (error) {
    if (error instanceof BaseError) {
      return NextResponse.json(
        { success: false, code: error.errorCode, message: error.message },
        { status: error.statusCode }
      );
    }

    console.error("POST Apply Loan Exception:", error);
    return NextResponse.json(
      { success: false, code: "INTERNAL_SERVER_ERROR", message: "সার্ভারে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
