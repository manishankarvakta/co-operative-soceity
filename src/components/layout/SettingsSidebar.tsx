"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/providers/LanguageProvider";

import { useSession } from "next-auth/react";

const translations = {
  BN: {
    settingsTitle: "সিস্টেম সেটিংস",
    admitFeeLink: "ভর্তি ফি (Admit Fee)",
    loanLink: "ঋণ পলিসি (Loan Rules)",
    expenseCategoryLink: "খরচ ক্যাটাগরি (Expense Category)",
    permissionsLink: "অনুমতিসমূহ (Permissions)",
    backToDashboard: "ড্যাশবোর্ডে ফিরে যান",
  },
  EN: {
    settingsTitle: "System Settings",
    admitFeeLink: "Admission Fee Settings",
    loanLink: "Loan Rules & Rates",
    expenseCategoryLink: "Expense Categories",
    permissionsLink: "User Permissions",
    backToDashboard: "Back to Dashboard",
  }
};

export default function SettingsSidebar() {
  const pathname = usePathname();
  const { lang } = useLanguage();
  const t = translations[lang];
  const { data: session } = useSession();
  
  const userRoles = (session?.user as any)?.roles || [];
  const isSuperAdmin = userRoles.includes("SUPER_ADMIN");

  const menuItems = [
    {
      key: "admitFee",
      href: "/settings/admitFee",
      label: t.admitFeeLink,
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-1.958-.59c-1.007-.733-1.007-1.921 0-2.654 1.008-.733 2.64-.733 3.648 0L14 9.182M12 3v3m0 12v3" />
      )
    },
    {
      key: "loan",
      href: "/settings/loan",
      label: t.loanLink,
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      )
    },
    {
      key: "expense-category",
      href: "/settings/expense-category",
      label: t.expenseCategoryLink,
      icon: (
        <>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581a1.5 1.5 0 0 0 2.122 0l4.318-4.318a1.5 1.5 0 0 0 0-2.122L11.159 3.659A2.25 2.25 0 0 0 9.568 3Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 7.5h.008v.008H6V7.5Z" />
        </>
      )
    },
    ...(isSuperAdmin ? [{
      key: "permissions",
      href: "/settings/permissions",
      label: t.permissionsLink,
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286zm-1.136 10.708a3 3 0 11-4.243-4.243 3 3 0 014.243 4.243z" />
      )
    }] : [])
  ];

  return (
    <div className="flex h-screen w-64 flex-col bg-white dark:bg-zinc-950 border-r border-gray-200 dark:border-zinc-800 shadow-sm fixed z-40 overflow-y-auto">
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-gray-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47c-.22.128-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.43l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          </div>
          <span className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {t.settingsTitle}
          </span>
        </div>
      </div>
      <nav className="flex flex-1 flex-col px-4 py-6 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href);
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all duration-200 ${isActive
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-white dark:hover:bg-zinc-900/50"
                }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                {item.icon}
              </svg>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-200 dark:border-zinc-800">
        <Link
          href="/dashboard"
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-gray-650 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-white dark:hover:bg-zinc-900/50 transition-all duration-200 text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
          </svg>
          {t.backToDashboard}
        </Link>
      </div>
    </div>
  );
}
