import { NextResponse } from "next/server";
import { MemberService } from "@/services/MemberService";
import { updateMemberSchema } from "@/backend/validations/member";
import { BaseError } from "@/backend/errors";

interface Context { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: Context) {
  try {
    const { id } = await params;
    const member = await MemberService.getMemberById(id);
    return NextResponse.json(member);
  } catch (error) {
    if (error instanceof BaseError) {
      return NextResponse.json(
        { success: false, code: error.errorCode, message: error.message },
        { status: error.statusCode }
      );
    }

    console.error("GET Member Detail Exception:", error);
    return NextResponse.json(
      { success: false, code: "INTERNAL_SERVER_ERROR", message: "সার্ভারে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: Context) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate update payload
    const parsed = updateMemberSchema.safeParse(body);
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

    const result = await MemberService.updateMember(id, parsed.data);
    return NextResponse.json({ success: true, member: result });
  } catch (error) {
    if (error instanceof BaseError) {
      return NextResponse.json(
        { success: false, code: error.errorCode, message: error.message },
        { status: error.statusCode }
      );
    }

    console.error("PUT Member Detail Exception:", error);
    return NextResponse.json(
      { success: false, code: "INTERNAL_SERVER_ERROR", message: "সার্ভারে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: Context) {
  try {
    const { id } = await params;
    const result = await MemberService.deleteMember(id);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof BaseError) {
      return NextResponse.json(
        { success: false, code: error.errorCode, message: error.message },
        { status: error.statusCode }
      );
    }

    console.error("DELETE Member Exception:", error);
    return NextResponse.json(
      { success: false, code: "INTERNAL_SERVER_ERROR", message: "সার্ভারে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
