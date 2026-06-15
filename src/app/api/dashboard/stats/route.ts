import { NextResponse } from "next/server";
import { auth } from "../../../../lib/auth";
import { DashboardService } from "../../../../services/DashboardService";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 401 });
    }

    const stats = await DashboardService.getDashboardStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("GET Dashboard Stats Exception:", error);
    return NextResponse.json(
      { success: false, message: "সার্ভারে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
