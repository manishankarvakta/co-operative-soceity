import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { canAccess } from "@/lib/rbac";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 401 });
    }
    if (!canAccess(session.user as any, "accounting", "read")) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 403 });
    }

    // Fetch members with deposits
    const members = await prisma.member.findMany({
      where: { deletedAt: null },
      include: {
        deposits: {
          where: { deletedAt: null },
          include: {
            items: {
              where: { deletedAt: null }
            }
          }
        }
      }
    });

    const list = members.map((m) => {
      let totalSavings = 0;
      m.deposits.forEach((d) => {
        d.items.forEach((item) => {
          if (item.type === "WEEKLY_SUBSCRIPTION" || item.type === "OTHER") {
            totalSavings += item.amount;
          }
        });
      });

      return {
        id: m.id,
        name: m.name,
        memberCode: m.memberCode,
        phone: m.phone,
        savingsBdt: totalSavings / 100
      };
    });

    return NextResponse.json({ success: true, payables: list });
  } catch (error) {
    console.error("GET Payables Exception:", error);
    return NextResponse.json(
      { success: false, code: "INTERNAL_SERVER_ERROR", message: "সার্ভারে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
