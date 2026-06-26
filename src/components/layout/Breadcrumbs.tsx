"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/providers/LanguageProvider";
import Link from "next/link";

const segmentMap: Record<"EN" | "BN", Record<string, string>> = {
  EN: {
    dashboard: "dashboard",
    people: "people",
    members: "members",
    new: "new",
    accounters: "accounters",
    admins: "admins",
    shares: "shares",
    ledger: "ledger",
    reports: "reports",
    history: "history",
    expenses: "expenses",
    pending: "pending",
    approved: "approved",
    rejected: "rejected",
    microfinance: "microfinance",
    "pending-applications": "pending applications",
    "running-loans": "running loans",
    "closed-loans": "closed loans",
    "rejected-applications": "rejected applications",
    accounting: "accounting",
    "chart-of-accounts": "chart of accounts",
    bank: "bank & cash",
    "journal-vouchers": "vouchers",
    "account-ledger": "account ledger",
    "trial-balance": "trial balance",
    "balance-sheet": "balance sheet",
    "profit-loss": "profit & loss",
    "profit-distribution": "profit distribution",
    "accounts-receivable": "receivables",
    "accounts-payable": "payables",
    projects: "projects",
    backups: "backups",
    details: "details",
  },
  BN: {
    dashboard: "ড্যাশবোর্ড",
    people: "পিপল",
    members: "সদস্য",
    new: "নতুন",
    accounters: "হিসাব রক্ষক",
    admins: "এডমিনগণ",
    shares: "শেয়ার",
    ledger: "লেজার",
    reports: "রিপোর্ট",
    history: "ইতিহাস",
    expenses: "খরচ",
    pending: "পেন্ডিং",
    approved: "অনুমোদিত",
    rejected: "প্রত্যাখ্যাত",
    microfinance: "ক্ষুদ্রঋণ",
    "pending-applications": "পেন্ডিং আবেদন",
    "running-loans": "চলতি লোন",
    "closed-loans": "পরিশোধিত লোন",
    "rejected-applications": "প্রত্যাখ্যাত আবেদন",
    accounting: "হিসাবরক্ষণ",
    "chart-of-accounts": "চার্ট অব অ্যাকাউন্টস",
    bank: "ব্যাংক ও নগদ",
    "journal-vouchers": "ভাউচার",
    "account-ledger": "অ্যাকাউন্ট খতিয়ান",
    "trial-balance": "রেওয়ামিল",
    "balance-sheet": "ব্যালেন্স শীট",
    "profit-loss": "লাভ-ক্ষতি",
    "profit-distribution": "লভ্যাংশ বন্টন",
    "accounts-receivable": "প্রাপ্য হিসাব",
    "accounts-payable": "প্রদেয় হিসাব",
    projects: "প্রজেক্ট",
    backups: "ব্যাকআপ",
    details: "বিস্তারিত",
  }
};

const isId = (val: string) => 
  /^\d+$/.test(val) || 
  /^[0-9a-fA-F]{24}$/.test(val) || 
  /^[0-9a-fA-F-]{36}$/.test(val);

export default function Breadcrumbs() {
  const pathname = usePathname();
  const { lang } = useLanguage();

  if (!pathname) return null;

  // Split and filter out empty segments
  const pathSegments = pathname.split("/").filter(Boolean);

  // If we are just on /dashboard, show only "dashboard"
  if (pathSegments.length === 1 && pathSegments[0] === "dashboard") {
    const label = segmentMap[lang]["dashboard"] || "dashboard";
    const formattedLabel = lang === "EN" ? label.toLowerCase() : label;
    return (
      <div className="flex items-center text-sm font-medium text-gray-500 dark:text-zinc-400 capitalize">
        {formattedLabel}
      </div>
    );
  }

  const items: { label: string; href?: string }[] = [];
  let currentPath = "/dashboard";

  const rawSubSegments = pathSegments.filter((seg) => seg !== "dashboard");

  if (rawSubSegments[0] === "members") {
    items.push({
      label: segmentMap[lang]["people"] || "people",
      href: "/dashboard/members",
    });
  }

  rawSubSegments.forEach((segment) => {
    currentPath += `/${segment}`;
    
    let label = segment;
    if (isId(segment)) {
      label = segmentMap[lang]["details"] || "details";
    } else {
      label = segmentMap[lang][segment] || segment;
    }

    items.push({
      label,
      href: currentPath,
    });
  });

  return (
    <nav className="flex items-center text-sm font-medium text-gray-500 dark:text-zinc-400 select-none">
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        const formattedLabel = lang === "EN" ? item.label.toLowerCase() : item.label;

        return (
          <React.Fragment key={idx}>
            {idx > 0 && (
              <span className="mx-2 text-gray-300 dark:text-zinc-700 font-normal">&gt;</span>
            )}
            {isLast ? (
              <span className="text-gray-900 dark:text-zinc-100 font-semibold">
                {formattedLabel}
              </span>
            ) : item.href ? (
              <Link
                href={item.href}
                className="hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
              >
                {formattedLabel}
              </Link>
            ) : (
              <span>{formattedLabel}</span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
