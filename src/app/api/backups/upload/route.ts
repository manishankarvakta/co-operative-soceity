import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { BackupService } from "@/services/BackupService";
import { canAccess } from "@/lib/rbac";
import * as fs from "fs";
import * as path from "path";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !canAccess(session.user as any, "backups", "write")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ success: false, message: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const backupDir = BackupService.getBackupDir();
    
    // Create unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filename = `uploaded_${timestamp}_${originalName}`;
    const storagePath = path.join(backupDir, filename);

    fs.writeFileSync(storagePath, buffer);
    const fileSize = fs.statSync(storagePath).size;

    const newRecord = await prisma.backupHistory.create({
      data: {
        filename,
        fileSize,
        status: "SUCCESS",
        startedAt: new Date(),
        completedAt: new Date(),
        storagePath
      }
    });

    return NextResponse.json({ success: true, backup: newRecord });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ success: false, message: "Upload failed" }, { status: 500 });
  }
}
