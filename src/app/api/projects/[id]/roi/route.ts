import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ProjectService } from "@/services/ProjectService";
import { BaseError } from "@/backend/errors";
import { canAccess } from "@/lib/rbac";

interface Context { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: Context) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 401 });
    }
    if (!canAccess(session.user as any, "projects", "read")) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 403 });
    }

    const { id } = await params;
    const result = await ProjectService.calculateROI(id);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof BaseError) {
      return NextResponse.json(
        { success: false, code: error.errorCode, message: error.message },
        { status: error.statusCode }
      );
    }

    console.error("GET Project ROI Exception:", error);
    return NextResponse.json(
      { success: false, code: "INTERNAL_SERVER_ERROR", message: "সার্ভারে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, { params }: Context) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 401 });
    }
    if (!canAccess(session.user as any, "projects", "distribute_roi")) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const totalProfit = parseInt(body.totalProfit, 10);
    const paymentMode = body.paymentMode;

    if (isNaN(totalProfit) || totalProfit <= 0) {
      return NextResponse.json(
        { success: false, code: "VALIDATION_ERROR", message: "লভ্যাংশের পরিমাণ অবশ্যই পজিটিভ সংখ্যা হতে হবে।" },
        { status: 400 }
      );
    }

    if (paymentMode && paymentMode !== "CASH" && paymentMode !== "BANK") {
      return NextResponse.json(
        { success: false, code: "VALIDATION_ERROR", message: "অকার্যকর পেমেন্ট মোড।" },
        { status: 400 }
      );
    }

    const result = await ProjectService.distributeProjectProfit(id, { totalProfit, paymentMode });
    return NextResponse.json({ success: true, distribution: result });
  } catch (error) {
    if (error instanceof BaseError) {
      return NextResponse.json(
        { success: false, code: error.errorCode, message: error.message },
        { status: error.statusCode }
      );
    }

    console.error("POST Distribute Profit Exception:", error);
    return NextResponse.json(
      { success: false, code: "INTERNAL_SERVER_ERROR", message: "সার্ভারে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}

