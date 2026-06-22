import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canAccess } from "@/lib/rbac";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 401 });
    }
    if (!canAccess(session.user as any, "accounting", "read")) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!code) {
      return NextResponse.json({ error: "অ্যাকাউন্ট কোড প্রদান করা আবশ্যক।" }, { status: 400 });
    }

    const account = await prisma.account.findUnique({
      where: { code }
    });

    if (!account) {
      return NextResponse.json({ error: "অ্যাকাউন্ট খুঁজে পাওয়া যায়নি।" }, { status: 404 });
    }

    // 1. Calculate Starting Balance (sum of debits/credits before startDate)
    let startingBalance = 0;
    if (startDate) {
      const beforeLines = await prisma.journalLine.findMany({
        where: {
          accountId: account.id,
          journalEntry: {
            date: { lt: new Date(startDate) }
          }
        }
      });

      beforeLines.forEach((line) => {
        const amt = line.amount;
        if (line.type === "DEBIT") {
          if (account.type === "ASSET" || account.type === "EXPENSE") {
            startingBalance += amt;
          } else {
            startingBalance -= amt;
          }
        } else {
          // CREDIT
          if (account.type === "ASSET" || account.type === "EXPENSE") {
            startingBalance -= amt;
          } else {
            startingBalance += amt;
          }
        }
      });
    }

    // 2. Fetch ledger journal lines
    const whereClause: any = {
      accountId: account.id
    };

    if (startDate || endDate) {
      whereClause.journalEntry = {};
      if (startDate) {
        whereClause.journalEntry.date = { ...whereClause.journalEntry.date, gte: new Date(startDate) };
      }
      if (endDate) {
        whereClause.journalEntry.date = { ...whereClause.journalEntry.date, lte: new Date(endDate) };
      }
    }

    const lines = await prisma.journalLine.findMany({
      where: whereClause,
      include: {
        journalEntry: true
      },
      orderBy: {
        journalEntry: { date: "asc" }
      }
    });

    // 3. Format lines and compute running balance
    let runningBalance = startingBalance;
    const formattedLines = lines.map((line) => {
      let debit = 0;
      let credit = 0;
      const amt = line.amount;

      if (line.type === "DEBIT") {
        debit = amt;
        if (account.type === "ASSET" || account.type === "EXPENSE") {
          runningBalance += amt;
        } else {
          runningBalance -= amt;
        }
      } else {
        // CREDIT
        credit = amt;
        if (account.type === "ASSET" || account.type === "EXPENSE") {
          runningBalance -= amt;
        } else {
          runningBalance += amt;
        }
      }

      return {
        id: line.id,
        date: line.journalEntry.date,
        description: line.journalEntry.description,
        reference: line.journalEntry.reference,
        debit: debit / 100, // raw BDT
        credit: credit / 100, // raw BDT
        runningBalance: runningBalance / 100 // raw BDT
      };
    });

    return NextResponse.json({
      success: true,
      account: {
        id: account.id,
        code: account.code,
        name: account.name,
        type: account.type,
        currentBalanceBdt: account.balance / 100
      },
      startingBalanceBdt: startingBalance / 100,
      endingBalanceBdt: runningBalance / 100,
      lines: formattedLines
    });
  } catch (error) {
    console.error("GET Account Ledger Exception:", error);
    return NextResponse.json(
      { success: false, code: "INTERNAL_SERVER_ERROR", message: "সার্ভারে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
