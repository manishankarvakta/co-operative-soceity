import { NextResponse } from "next/server";
import { auth } from "../../../lib/auth";
import { BackupService } from "../../../services/BackupService";
import { BaseError } from "../../../backend/errors";

/**
 * GET: Retrieves a list of all database backups.
 * Restricts access to SUPER_ADMIN only.
 */
export async function GET() {
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

    const backups = await BackupService.listBackups();
    return NextResponse.json(backups);
  } catch (error) {
    console.error("GET Backups Exception:", error);
    return NextResponse.json(
      { success: false, code: "INTERNAL_SERVER_ERROR", message: "সার্ভারে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}

/**
 * POST: Triggers a manual database backup immediately.
 * Restricts access to SUPER_ADMIN only.
 */
export async function POST() {
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

    const result = await BackupService.createBackup();
    return NextResponse.json({ success: true, backup: result });
  } catch (error) {
    if (error instanceof BaseError) {
      return NextResponse.json(
        { success: false, code: error.errorCode, message: error.message },
        { status: error.statusCode }
      );
    }

    console.error("POST Backup Exception:", error);
    return NextResponse.json(
      { success: false, code: "INTERNAL_SERVER_ERROR", message: "ব্যাকআপ তৈরি করতে ব্যর্থ হয়েছে।" },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Deletes a backup record and its corresponding file.
 * Restricts access to SUPER_ADMIN only.
 */
export async function DELETE(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, code: "VALIDATION_ERROR", message: "ব্যাকআপ আইডি প্রয়োজন।" },
        { status: 400 }
      );
    }

    await BackupService.deleteBackup(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof BaseError) {
      return NextResponse.json(
        { success: false, code: error.errorCode, message: error.message },
        { status: error.statusCode }
      );
    }

    console.error("DELETE Backup Exception:", error);
    return NextResponse.json(
      { success: false, code: "INTERNAL_SERVER_ERROR", message: "ব্যাকআপ ফাইল মুছে ফেলতে ব্যর্থ হয়েছে।" },
      { status: 500 }
    );
  }
}
