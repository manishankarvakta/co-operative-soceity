import { NextResponse } from "next/server";
import { ProfitDistributionService } from "@/services/ProfitDistributionService";
import { createProfitDistributionSchema } from "@/backend/validations/accounting";
import { BaseError } from "@/backend/errors";
import { auth } from "@/lib/auth";
import { canAccess } from "@/lib/rbac";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 401 });
    }

    if (!canAccess(session.user as any, "accounting", "execute_distribution")) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 403 });
    }

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
      session.user.id,
      {
        amount: parsed.data.amount,
        paymentMode: parsed.data.paymentMode
      }
    );

    return NextResponse.json({ success: true, distribution: result }, { status: 200 });
  } catch (error) {
    if (error instanceof BaseError) {
      return NextResponse.json(
        { success: false, code: error.errorCode, message: error.message },
        { status: error.statusCode }
      );
    }

    console.error("Profit Distribution API Exception:", error);
    return NextResponse.json(
      { success: false, code: "INTERNAL_SERVER_ERROR", message: "সার্ভারে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
