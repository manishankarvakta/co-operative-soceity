import { NextResponse } from "next/server";
import { MemberService } from "@/services/MemberService";
import { createMemberSchema } from "@/backend/validations/member";
import { BaseError } from "@/backend/errors";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate inputs using Zod
    const parsed = createMemberSchema.safeParse(body);
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

    const result = await MemberService.createMember(parsed.data, null);
    return NextResponse.json({ success: true, member: result }, { status: 201 });
  } catch (error) {
    if (error instanceof BaseError) {
      return NextResponse.json(
        { success: false, code: error.errorCode, message: error.message },
        { status: error.statusCode }
      );
    }

    console.error("POST Signup Exception:", error);
    return NextResponse.json(
      { success: false, code: "INTERNAL_SERVER_ERROR", message: "সার্ভারে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
