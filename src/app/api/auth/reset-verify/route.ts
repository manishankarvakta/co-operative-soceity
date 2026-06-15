import { NextResponse } from "next/server";
import { AuthService } from "../../../../services/AuthService";
import { resetVerifySchema } from "../../../../backend/validations/auth";
import { BaseError } from "../../../../backend/errors";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate request inputs using Zod
    const parsed = resetVerifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          code: "VALIDATION_ERROR",
          message: parsed.error.issues[0].message,
        },
        { status: 400 }
      );
    }

    const { emailOrPhone, otp, newPassword } = parsed.data;
    const result = await AuthService.verifyResetOTP(emailOrPhone, otp, newPassword);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof BaseError) {
      return NextResponse.json(
        { success: false, code: error.errorCode, message: error.message },
        { status: error.statusCode }
      );
    }
    
    console.error("Reset Verify API Exception:", error);
    return NextResponse.json(
      { success: false, code: "INTERNAL_SERVER_ERROR", message: "সার্ভারে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
