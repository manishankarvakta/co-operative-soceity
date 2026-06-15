import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ProfitDistributionService } from "@/services/ProfitDistributionService";
import { AccountingService } from "@/services/AccountingService";
import { createProfitDistributionSchema } from "@/backend/validations/accounting";
import { BaseError } from "@/backend/errors";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 401 });
    }

    // Get net profit from Profit & Loss statement (in BDT)
    const plReport = await AccountingService.getProfitLoss();
    const netProfitBdt = plReport.totals.netProfit;

    // Get list of previous profit distributions
    const distributions = await ProfitDistributionService.listDistributions();

    return NextResponse.json({
      success: true,
      netProfitBdt,
      distributions
    });
  } catch (error) {
    console.error("GET Profit Distribution Exception:", error);
    return NextResponse.json(
      { success: false, message: "সার্ভারে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 401 });
    }

    // Get admin user ID from session
    const adminId = session.user.id;
    const body = await request.json();

    const parsed = createProfitDistributionSchema.safeParse(body);
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

    const result = await ProfitDistributionService.executeGeneralDistribution(
      adminId,
      parsed.data
    );

    return NextResponse.json({
      success: true,
      distribution: result
    });
  } catch (error) {
    if (error instanceof BaseError) {
      return NextResponse.json(
        { success: false, code: error.errorCode, message: error.message },
        { status: error.statusCode }
      );
    }

    console.error("POST Profit Distribution Exception:", error);
    return NextResponse.json(
      { success: false, code: "INTERNAL_SERVER_ERROR", message: "সার্ভারে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
