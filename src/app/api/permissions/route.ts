import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export const ALL_PERMISSIONS = [
  { name: "members:read", description: "সদস্য তালিকা ও প্রোফাইল দেখার অনুমতি" },
  { name: "members:write", description: "নতুন সদস্য যোগ ও পরিবর্তনের অনুমতি" },
  { name: "members:delete", description: "সদস্য অ্যাকাউন্ট বাতিলের অনুমতি" },
  { name: "deposits:read", description: "আমানত ও শেয়ার দেখার অনুমতি" },
  { name: "deposits:write", description: "আমানত জমা ও পরিশোধের অনুমতি" },
  { name: "expenses:read", description: "খরচের হিসাব দেখার অনুমতি" },
  { name: "expenses:write", description: "খরচের এন্ট্রি দেওয়ার অনুমতি" },
  { name: "expenses:approve", description: "খরচ অনুমোদনের অনুমতি" },
  { name: "expenses:reject", description: "খরচ প্রত্যাখ্যানের অনুমতি" },
  { name: "loans:read", description: "ঋণের আবেদন ও তালিকা দেখার অনুমতি" },
  { name: "loans:write", description: "নতুন ঋণের আবেদন এন্ট্রি দেওয়ার অনুমতি" },
  { name: "loans:approve", description: "ঋণ অনুমোদনের অনুমতি" },
  { name: "loans:reject", description: "ঋণ প্রত্যাখ্যানের অনুমতি" },
  { name: "accounting:read", description: "হিসাবরক্ষণ ও লেজার দেখার অনুমতি" },
  { name: "accounting:write", description: "চার্ট অব অ্যাকাউন্টস ও ভাউচার পরিবর্তনের অনুমতি" },
  { name: "accounting:execute_distribution", description: "লভ্যাংশ বন্টন কার্যকরের অনুমতি" },
  { name: "projects:read", description: "প্রজেক্টের বিবরণ ও তালিকা দেখার অনুমতি" },
  { name: "projects:write", description: "নতুন প্রজেক্ট খোলার অনুমতি" },
  { name: "projects:invest", description: "প্রজেক্টে বিনিয়োগ যুক্ত করার অনুমতি" },
  { name: "projects:distribute_roi", description: "প্রজেক্টের মুনাফা হিসাব করার অনুমতি" },
  { name: "backups:read", description: "ডাটাবেজ ব্যাকআপ ফাইল দেখার অনুমতি" },
  { name: "backups:write", description: "ডাটাবেজ ব্যাকআপ নেওয়ার অনুমতি" },
  { name: "backups:restore", description: "ব্যাকআপ থেকে রিস্টোর করার অনুমতি" },
  { name: "reports:read", description: "সকল প্রকার আর্থিক বিবরণী ও রিপোর্ট দেখার অনুমতি" },
  { name: "bank:read", description: "ব্যাংক হিসাব ও ট্রানজেকশন দেখার অনুমতি" },
  { name: "bank:write", description: "ব্যাংক ট্রানজেকশন তৈরি করার অনুমতি" },
  { name: "bank:sign", description: "ব্যাংক ট্রানজেকশন অনুমোদন/স্বাক্ষরের অনুমতি" },
];

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

    // Upsert all defined permissions to make sure they exist in the DB
    for (const perm of ALL_PERMISSIONS) {
      await prisma.permission.upsert({
        where: { name: perm.name },
        update: { description: perm.description },
        create: { name: perm.name, description: perm.description },
      });
    }

    const permissions = await prisma.permission.findMany({
      orderBy: { name: "asc" }
    });

    return NextResponse.json(permissions);
  } catch (error) {
    console.error("GET Permissions Exception:", error);
    return NextResponse.json(
      { success: false, code: "INTERNAL_SERVER_ERROR", message: "সার্ভারে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
