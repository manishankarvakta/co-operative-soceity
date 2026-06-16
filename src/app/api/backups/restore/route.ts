import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { BackupService } from "@/services/BackupService";
import { BaseError } from "@/backend/errors";
import { canAccess } from "@/lib/rbac";

/**
 * POST: Restores the database to the state of a given backup ID.
 * Restricts access via RBAC checks.
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 401 });
    }

    if (!canAccess(session.user as any, "backups", "restore")) {
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

