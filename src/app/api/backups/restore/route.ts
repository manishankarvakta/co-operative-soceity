import { NextResponse } from "next/server";
import { auth } from "../../../../lib/auth";
import { BackupService } from "../../../../services/BackupService";
import { BaseError } from "../../../../backend/errors";

/**
 * POST: Restores the database to the state of a given backup ID.
 * Restricts access to SUPER_ADMIN only.
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 401 });
    }

    const roles = (session.user as any).roles || [];
    const isSuperAdmin = roles.some((r: any) => r.role.name === "SUPER_ADMIN");
    if (!isSuperAdmin) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 403 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, code: "VALIDATION_ERROR", message: "ব্যাকআপ আইডি প্রয়োজন।" },
        { status: 400 }
      );
    }

    await BackupService.restoreBackup(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof BaseError) {
      return NextResponse.json(
        { success: false, code: error.errorCode, message: error.message },
        { status: error.statusCode }
      );
    }

    console.error("POST Restore Database Exception:", error);
    return NextResponse.json(
      { success: false, code: "INTERNAL_SERVER_ERROR", message: "ডাটাবেজ রিস্টোর করতে ব্যর্থ হয়েছে।" },
      { status: 500 }
    );
  }
}
