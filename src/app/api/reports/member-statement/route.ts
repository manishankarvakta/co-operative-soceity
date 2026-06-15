import { NextResponse } from "next/server";
import { auth } from "../../../../../lib/auth";
import { ReportService } from "../../../../../services/ReportService";
import { BaseError } from "../../../../../backend/errors";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("memberId");

    if (!memberId) {
      return NextResponse.json(
        { success: false, message: "মেম্বার আইডি সিলেক্ট করুন।" },
        { status: 400 }
      );
    }

    const report = await ReportService.getMemberStatement(memberId);

    return NextResponse.json({ success: true, ...report });
  } catch (error) {
    if (error instanceof BaseError) {
      return NextResponse.json(
        { success: false, code: error.errorCode, message: error.message },
        { status: error.statusCode }
      );
    }

    console.error("GET Member Statement Exception:", error);
    return NextResponse.json(
      { success: false, message: "সার্ভারে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
