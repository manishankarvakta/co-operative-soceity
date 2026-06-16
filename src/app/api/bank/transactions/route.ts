import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { BankService } from "@/services/BankService";
import { createBankTransactionSchema, createBankTransferSchema } from "@/backend/validations/bank";
import { BaseError } from "@/backend/errors";
import { canAccess } from "@/lib/rbac";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 401 });
    }
    if (!canAccess(session.user as any, "bank", "read")) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const bankAccountId = searchParams.get("bankAccountId") || undefined;

    const result = await BankService.listTransactions({ page, limit, bankAccountId });
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET Bank Transactions Exception:", error);
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
    if (!canAccess(session.user as any, "bank", "write")) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 403 });
    }

    const body = await request.json();

    if (body.type === "TRANSFER") {
      const parsed = createBankTransferSchema.safeParse(body);
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
      const result = await BankService.createTransfer(parsed.data);
      return NextResponse.json({ success: true, transaction: result });
    } else {
      const parsed = createBankTransactionSchema.safeParse(body);
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
      const result = await BankService.createTransaction(parsed.data);
      return NextResponse.json({ success: true, transaction: result });
    }
  } catch (error) {
    if (error instanceof BaseError) {
      return NextResponse.json(
        { success: false, code: error.errorCode, message: error.message },
        { status: error.statusCode }
      );
    }

    console.error("POST Bank Transaction Exception:", error);
    return NextResponse.json(
      { success: false, code: "INTERNAL_SERVER_ERROR", message: "সার্ভারে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}

