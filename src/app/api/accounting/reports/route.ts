import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { AccountingService } from "@/services/AccountingService";
import { BaseError } from "@/backend/errors";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    if (type === "TRIAL_BALANCE") {
      const result = await AccountingService.getTrialBalance();
      return NextResponse.json(result);
    } else if (type === "BALANCE_SHEET") {
      const result = await AccountingService.getBalanceSheet();
      return NextResponse.json(result);
    } else if (type === "PROFIT_LOSS") {
      const result = await AccountingService.getProfitLoss();
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { success: false, code: "VALIDATION_ERROR", message: "সঠিক রিপোর্টের ধরন দিন (TRIAL_BALANCE/BALANCE_SHEET/PROFIT_LOSS)।" },
        { status: 400 }
      );
    }
  } catch (error) {
    if (error instanceof BaseError) {
      return NextResponse.json(
        { success: false, code: error.errorCode, message: error.message },
        { status: error.statusCode }
      );
    }

    console.error("GET Financial Reports Exception:", error);
    return NextResponse.json(
      { success: false, code: "INTERNAL_SERVER_ERROR", message: "সার্ভারে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
