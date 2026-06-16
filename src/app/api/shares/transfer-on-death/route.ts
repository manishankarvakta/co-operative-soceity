import { NextResponse } from "next/server";
import { ShareService } from "@/services/ShareService";
import { deathTransferSchema } from "@/backend/validations/member";
import { BaseError } from "@/backend/errors";
import { auth } from "@/lib/auth";
import { canAccess } from "@/lib/rbac";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 401 });
    }

    if (!canAccess(session.user as any, "members", "write")) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = deathTransferSchema.safeParse(body);
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

    const result = await ShareService.transferSharesOnDeath({
      deceasedMemberId: parsed.data.deceasedMemberId,
      recipientType: parsed.data.recipientType,
      recipientId: parsed.data.recipientId,
      actorId: session.user.id
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof BaseError) {
      return NextResponse.json(
        { success: false, code: error.errorCode, message: error.message },
        { status: error.statusCode }
      );
    }

    console.error("Death Transfer Exception:", error);
    return NextResponse.json(
      { success: false, code: "INTERNAL_SERVER_ERROR", message: "সার্ভারে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
