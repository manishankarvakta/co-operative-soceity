import { NextResponse } from "next/server";
import { NomineeService } from "../../../../../services/NomineeService";
import { nomineeSchema } from "../../../../../backend/validations/member";
import { BaseError } from "../../../../../backend/errors";

interface Context {
  params: {
    id: string;
  };
}

export async function GET(request: Request, { params }: Context) {
  try {
    const { id } = params;
    const nominee = await NomineeService.getNomineeByMemberId(id);
    return NextResponse.json(nominee);
  } catch (error) {
    if (error instanceof BaseError) {
      return NextResponse.json(
        { success: false, code: error.errorCode, message: error.message },
        { status: error.statusCode }
      );
    }

    console.error("GET Nominee Exception:", error);
    return NextResponse.json(
      { success: false, code: "INTERNAL_SERVER_ERROR", message: "সার্ভারে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: Context) {
  try {
    const { id } = params;
    const body = await request.json();

    // Validate nominee schema using Zod
    const parsed = nomineeSchema.partial().safeParse(body);
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

    const result = await NomineeService.updateNominee(id, parsed.data);
    return NextResponse.json({ success: true, nominee: result });
  } catch (error) {
    if (error instanceof BaseError) {
      return NextResponse.json(
        { success: false, code: error.errorCode, message: error.message },
        { status: error.statusCode }
      );
    }

    console.error("PUT Nominee Exception:", error);
    return NextResponse.json(
      { success: false, code: "INTERNAL_SERVER_ERROR", message: "সার্ভারে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
