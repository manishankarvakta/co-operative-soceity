import { NextResponse } from "next/server";
import { MemberService } from "@/services/MemberService";

export async function GET(request: Request) {
  try {
    // Verify bearer cron secret in production environments
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || "default_cron_secret";
    if (process.env.NODE_ENV === "production" && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const suspendedIds = await MemberService.evaluateSuspensions();
    return NextResponse.json({ success: true, count: suspendedIds.length, suspendedIds });
  } catch (error: any) {
    console.error("Cron Delinquency Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
