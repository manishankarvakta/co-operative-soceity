import { NextResponse } from "next/server";
import { auth } from "../../../../../lib/auth";
import { ProjectService } from "../../../../../services/ProjectService";
import { BaseError } from "../../../../../backend/errors";

interface Context {
  params: {
    id: string;
  };
}

export async function GET(request: Request, { params }: Context) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 401 });
    }

    const { id } = params;
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

    const roles = (session.user as any).roles || [];
    const isAdminOrAccountant = roles.some((r: any) => r.role.name === "SUPER_ADMIN" || r.role.name === "ACCOUNTANT");
    if (!isAdminOrAccountant) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();
    const totalProfit = parseInt(body.totalProfit, 10);

    if (isNaN(totalProfit) || totalProfit <= 0) {
      return NextResponse.json(
        { success: false, code: "VALIDATION_ERROR", message: "লভ্যাংশের পরিমাণ অবশ্যই পজিটিভ সংখ্যা হতে হবে।" },
        { status: 400 }
      );
    }

    const result = await ProjectService.distributeProjectProfit(id, { totalProfit });
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
