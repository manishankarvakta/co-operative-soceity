import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 401 });
    }

    const rules = await prisma.loanRule.findMany({
      where: { deletedAt: null },
      orderBy: [
        { durationType: "desc" }, // WEEKLY first, then MONTHLY
        { durationValue: "asc" }
      ]
    });

    const formattedRules = rules.map((r) => ({
      id: r.id,
      durationValue: r.durationValue,
      durationType: r.durationType,
      interestRate: Number(r.interestRate)
    }));

    return NextResponse.json({ success: true, rules: formattedRules });
  } catch (error) {
    console.error("GET Loan Rules Exception:", error);
    return NextResponse.json(
      { success: false, code: "INTERNAL_SERVER_ERROR", message: "সার্ভারে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 401 });
    }

    // Only allow staff/admin roles to write rules settings
    const isStaffOrAdmin = session.user.roles?.some((role: string) =>
      ["SUPER_ADMIN", "ACCOUNTANT", "PRESIDENT", "SECRETARY", "TREASURER"].includes(role)
    );
    if (!isStaffOrAdmin) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 403 });
    }

    const body = await request.json();
    const { rules } = body;

    if (!Array.isArray(rules)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    const savedRules = await prisma.$transaction(async (tx) => {
      // 1. Delete all existing rules
      await tx.loanRule.deleteMany({});

      // 2. Insert new ones
      const created = [];
      for (const r of rules) {
        const item = await tx.loanRule.create({
          data: {
            durationValue: parseInt(r.durationValue.toString(), 10),
            durationType: r.durationType,
            interestRate: parseFloat(r.interestRate.toString())
          }
        });
        created.push(item);
      }
      return created;
    });

    const formattedRules = savedRules.map((r) => ({
      id: r.id,
      durationValue: r.durationValue,
      durationType: r.durationType,
      interestRate: Number(r.interestRate)
    }));

    return NextResponse.json({ success: true, rules: formattedRules });
  } catch (error) {
    console.error("POST Loan Rules Exception:", error);
    return NextResponse.json(
      { success: false, code: "INTERNAL_SERVER_ERROR", message: "সার্ভারে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
