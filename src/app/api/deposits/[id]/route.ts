import { NextResponse } from "next/server";
import { DepositService } from "@/services/DepositService";
import { BaseError } from "@/backend/errors";

interface Context { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: Context) {
  try {
    const { id } = await params;
    const deposit = await DepositService.getDepositById(id);
    return NextResponse.json(deposit);
  } catch (error) {
    if (error instanceof BaseError) {
      return NextResponse.json(
        { success: false, code: error.errorCode, message: error.message },
        { status: error.statusCode }
      );
    }

    console.error("GET Specific Deposit Exception:", error);
    return NextResponse.json(
      { success: false, code: "INTERNAL_SERVER_ERROR", message: "সার্ভারে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
