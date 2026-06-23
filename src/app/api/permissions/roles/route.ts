import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { AuditService } from "@/services/AuditService";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 401 });
    }

    const userRoles = (session.user as any).roles || [];
    if (!userRoles.includes("SUPER_ADMIN")) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 403 });
    }

    const roles = await prisma.role.findMany({
      where: {
        NOT: {
          name: { startsWith: "CUSTOM_" } // Hide internal custom override roles
        }
      },
      include: {
        rolePermissions: {
          include: {
            permission: true
          }
        }
      },
      orderBy: { name: "asc" }
    });

    return NextResponse.json(roles);
  } catch (error) {
    console.error("GET Roles Exception:", error);
    return NextResponse.json(
      { success: false, code: "INTERNAL_SERVER_ERROR", message: "সার্ভারে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 401 });
    }

    const userRoles = (session.user as any).roles || [];
    if (!userRoles.includes("SUPER_ADMIN")) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, permissionIds } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "টেমপ্লেটের নাম আবশ্যক।" }, { status: 400 });
    }

    const normalizedName = name.trim().toUpperCase();

    // Check if role already exists
    const existing = await prisma.role.findUnique({
      where: { name: normalizedName }
    });

    if (existing) {
      return NextResponse.json({ error: "এই নামের একটি টেমপ্লেট/রোল ইতোমধ্যে বিদ্যমান রয়েছে।" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const role = await tx.role.create({
        data: {
          name: normalizedName,
          description: description || ""
        }
      });

      if (permissionIds && Array.isArray(permissionIds)) {
        for (const pId of permissionIds) {
          await tx.rolePermission.create({
            data: {
              roleId: role.id,
              permissionId: pId
            }
          });
        }
      }

      await AuditService.log({
        userId: session.user.id,
        action: "CREATE",
        tableName: "Role",
        recordId: role.id,
        newData: { name: normalizedName, description, permissionIds },
        tx
      });

      return role;
    });

    return NextResponse.json({ success: true, role: result }, { status: 201 });
  } catch (error) {
    console.error("POST Roles Exception:", error);
    return NextResponse.json(
      { success: false, code: "INTERNAL_SERVER_ERROR", message: "সার্ভারে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 401 });
    }

    const userRoles = (session.user as any).roles || [];
    if (!userRoles.includes("SUPER_ADMIN")) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 403 });
    }

    const body = await request.json();
    const { id, description, permissionIds } = body;

    if (!id) {
      return NextResponse.json({ error: "রোল আইডি আবশ্যক।" }, { status: 400 });
    }

    const role = await prisma.role.findUnique({
      where: { id }
    });

    if (!role) {
      return NextResponse.json({ error: "টেমপ্লেট পাওয়া যায়নি।" }, { status: 404 });
    }

    if (role.name === "SUPER_ADMIN") {
      return NextResponse.json({ error: "সুপার এডমিন টেমপ্লেটের অনুমতি পরিবর্তন করা যাবে না।" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.role.update({
        where: { id },
        data: { description: description || "" }
      });

      // Clear existing permissions
      await tx.rolePermission.deleteMany({
        where: { roleId: id }
      });

      // Create new links
      if (permissionIds && Array.isArray(permissionIds)) {
        for (const pId of permissionIds) {
          await tx.rolePermission.create({
            data: {
              roleId: id,
              permissionId: pId
            }
          });
        }
      }

      await AuditService.log({
        userId: session.user.id,
        action: "UPDATE",
        tableName: "Role",
        recordId: id,
        newData: { description, permissionIds },
        tx
      });
    });

    return NextResponse.json({ success: true, message: "টেমপ্লেট সফলভাবে আপডেট করা হয়েছে।" });
  } catch (error) {
    console.error("PUT Roles Exception:", error);
    return NextResponse.json(
      { success: false, code: "INTERNAL_SERVER_ERROR", message: "সার্ভারে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
