import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canAccess } from "@/lib/rbac";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 401 });
    }

    if (!canAccess(session.user as any, "loans", "read")) {
      return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("memberId");

    if (!memberId) {
      return NextResponse.json({ error: "সদস্য আইডি প্রদান করা আবশ্যক।" }, { status: 400 });
    }

    // 1. Fetch Member Savings Balance
    const deposits = await prisma.deposit.findMany({
      where: { memberId, deletedAt: null },
      include: { items: { where: { deletedAt: null } } }
    });

    let totalSavingsPaisa = 0;
    for (const dep of deposits) {
      for (const item of dep.items) {
        if (item.type === "WEEKLY_SUBSCRIPTION" || item.type === "OTHER") {
          totalSavingsPaisa += item.amount;
        }
      }
    }

    // 2. Fetch Active Loan
    const loan = await prisma.loan.findFirst({
      where: {
        memberId,
        status: "ACTIVE",
        deletedAt: null
      },
      include: {
        schedules: {
          orderBy: { emiNumber: "asc" }
        },
        payments: {
          orderBy: { paymentDate: "desc" }
        }
      }
    });

    if (!loan) {
      return NextResponse.json({
        success: true,
        hasActiveLoan: false,
        totalSavingsBdt: totalSavingsPaisa / 100
      });
    }

    // 3. Calculate Outstanding & Overdue Penalties
    const today = new Date();
    today.setHours(0, 0, 0, 0); // normalize today to date boundary

    let totalExpectedPaisa = 0;
    let totalPaidPaisa = 0;
    let overdueCount = 0;
    let penaltyAmountPaisa = 0;
    let nextSchedule: any = null;

    loan.schedules.forEach((s) => {
      totalExpectedPaisa += s.totalAmount;
      totalPaidPaisa += s.paidAmount;

      const isUnpaidOrPartial = s.status === "UNPAID" || s.status === "PARTIAL";

      if (isUnpaidOrPartial) {
        if (!nextSchedule) {
          nextSchedule = s;
        }

        const dueDate = new Date(s.dueDate);
        dueDate.setHours(0, 0, 0, 0);

        if (dueDate < today) {
          overdueCount++;
          const diffTime = today.getTime() - dueDate.getTime();
          const delayDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
          // Penalty of 50 BDT per day of delay
          penaltyAmountPaisa += delayDays * 50 * 100;
        }
      }
    });

    const outstandingPaisa = totalExpectedPaisa - totalPaidPaisa;

    return NextResponse.json({
      success: true,
      hasActiveLoan: true,
      loan: {
        id: loan.id,
        amount: loan.amount,
        interestRate: Number(loan.interestRate),
        durationValue: loan.durationValue,
        durationType: loan.durationType,
        status: loan.status,
        disbursedAt: loan.disbursedAt
      },
      totalSavingsBdt: totalSavingsPaisa / 100,
      outstandingBdt: outstandingPaisa / 100,
      overdueCount,
      penaltyAmountBdt: penaltyAmountPaisa / 100,
      nextSchedule: nextSchedule ? {
        id: nextSchedule.id,
        emiNumber: nextSchedule.emiNumber,
        dueDate: nextSchedule.dueDate,
        totalAmountBdt: nextSchedule.totalAmount / 100,
        paidAmountBdt: nextSchedule.paidAmount / 100,
        remainingAmountBdt: (nextSchedule.totalAmount - nextSchedule.paidAmount) / 100,
        status: nextSchedule.status
      } : null
    });
  } catch (error) {
    console.error("GET Active Loan Exception:", error);
    return NextResponse.json(
      { success: false, code: "INTERNAL_SERVER_ERROR", message: "সার্ভারে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
