import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ReportService } from "@/services/ReportService";
import { BaseError } from "@/backend/errors";
import { canAccess } from "@/lib/rbac";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 401 });
    }
    if (!canAccess(session.user as any, "bank", "read")) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const bankAccountId = searchParams.get("bankAccountId");
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    if (!bankAccountId) {
      return NextResponse.json(
        { success: false, message: "ব্যাংক অ্যাকাউন্ট আইডি সিলেক্ট করুন।" },
        { status: 400 }
      );
    }

    const report = await ReportService.getBankStatement({
      bankAccountId,
      startDate,
      endDate
    });

    return NextResponse.json({ success: true, ...report });
  } catch (error) {
    if (error instanceof BaseError) {
      return NextResponse.json(
        { success: false, code: error.errorCode, message: error.message },
        { status: error.statusCode }
      );
    }

    console.error("GET Bank Statement Exception:", error);
    return NextResponse.json(
      { success: false, message: "সার্ভারে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
