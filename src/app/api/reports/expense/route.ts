import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ReportService } from "@/services/ReportService";
import { canAccess } from "@/lib/rbac";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 401 });
    }
    if (!canAccess(session.user as any, "expenses", "read")) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const projectId = searchParams.get("projectId") || undefined;
    const category = searchParams.get("category") || undefined;

    const report = await ReportService.getExpenseReport({
      startDate,
      endDate,
      projectId,
      category
    });

    return NextResponse.json({ success: true, ...report });
  } catch (error) {
    console.error("GET Expense Report Exception:", error);
    return NextResponse.json(
      { success: false, message: "সার্ভারে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
