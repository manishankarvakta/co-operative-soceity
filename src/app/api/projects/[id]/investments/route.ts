import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ProjectService } from "@/services/ProjectService";
import { createInvestmentSchema } from "@/backend/validations/project";
import { BaseError } from "@/backend/errors";

interface Context { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Context) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    body.projectId = id; // Enforce URL path ID

    const parsed = createInvestmentSchema.safeParse(body);
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

    const result = await ProjectService.recordInvestment(parsed.data);
    return NextResponse.json({ success: true, investment: result });
  } catch (error) {
    if (error instanceof BaseError) {
      return NextResponse.json(
        { success: false, code: error.errorCode, message: error.message },
        { status: error.statusCode }
      );
    }

    console.error("POST Project Investment Exception:", error);
    return NextResponse.json(
      { success: false, code: "INTERNAL_SERVER_ERROR", message: "সার্ভারে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
