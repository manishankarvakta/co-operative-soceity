import { NextResponse } from "next/server";
import { auth } from "../../../../lib/auth";
import { BankService } from "../../../../services/BankService";
import { createBankAccountSchema } from "../../../../backend/validations/bank";
import { BaseError } from "../../../../backend/errors";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 401 });
    }

    const result = await BankService.listAccounts();
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET Bank Accounts Exception:", error);
    return NextResponse.json(
      { success: false, code: "INTERNAL_SERVER_ERROR", message: "সার্ভারে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 401 });
    }

    const body = await request.json();

    const parsed = createBankAccountSchema.safeParse(body);
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

    const result = await BankService.createAccount(parsed.data);
    return NextResponse.json({ success: true, account: result });
  } catch (error) {
    if (error instanceof BaseError) {
      return NextResponse.json(
        { success: false, code: error.errorCode, message: error.message },
        { status: error.statusCode }
      );
    }

    console.error("POST Bank Account Exception:", error);
    return NextResponse.json(
      { success: false, code: "INTERNAL_SERVER_ERROR", message: "সার্ভারে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
