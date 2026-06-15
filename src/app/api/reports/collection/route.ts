import { NextResponse } from "next/server";
import { auth } from "../../../../../lib/auth";
import { ReportService } from "../../../../../services/ReportService";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const paymentMode = (searchParams.get("paymentMode") as any) || undefined;

    const report = await ReportService.getCollectionReport({
      startDate,
      endDate,
      paymentMode
    });

    return NextResponse.json({ success: true, ...report });
  } catch (error) {
    console.error("GET Collection Report Exception:", error);
    return NextResponse.json(
      { success: false, message: "সার্ভারে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
