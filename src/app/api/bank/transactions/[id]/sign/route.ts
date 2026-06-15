import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { BankService } from "@/services/BankService";
import { BaseError } from "@/backend/errors";

interface Context { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Context) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { signatureType } = body;

    if (!signatureType || !["PRESIDENT", "SECRETARY", "TREASURER"].includes(signatureType)) {
      return NextResponse.json(
        { success: false, code: "VALIDATION_ERROR", message: "সঠিক স্বাক্ষরের ধরন দিন (PRESIDENT/SECRETARY/TREASURER)।" },
        { status: 400 }
      );
    }

    // Role-based auth gate
    const roles = (session.user as any).roles || [];
    const isAdminOrAccountant = roles.some((r: any) => r.role.name === "SUPER_ADMIN" || r.role.name === "ACCOUNTANT");
    if (!isAdminOrAccountant) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 403 });
    }

    const userId = session.user.id;
    const result = await BankService.signTransaction(userId, id, signatureType);
    return NextResponse.json({ success: true, transaction: result });
  } catch (error) {
    if (error instanceof BaseError) {
      return NextResponse.json(
        { success: false, code: error.errorCode, message: error.message },
        { status: error.statusCode }
      );
    }

    console.error("POST Sign Bank Transaction Exception:", error);
    return NextResponse.json(
      { success: false, code: "INTERNAL_SERVER_ERROR", message: "সার্ভারে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
