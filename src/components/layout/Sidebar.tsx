"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/providers/LanguageProvider";
import { useState, useEffect } from "react";
import { useSession, signOut as nextAuthSignOut } from "next-auth/react";
import {
  Home,
  Users,
  Wallet,
  PieChart,
  CreditCard,
  BookOpen,
  Landmark,
  Banknote,
  Briefcase,
  FileText,
  Database,
  Settings,
  LogOut,
  ChevronDown
} from "lucide-react";

interface NavChild {
  key: string;
  href: string;
}

interface NavItem {
  key: string;
  icon: string;
  href?: string;
  children?: NavChild[];
}

const navigation: NavItem[] = [
  { key: "Dashboard", href: "/dashboard", icon: "home" },
  { key: "Members", href: "/dashboard/members", icon: "users" },
  { key: "Deposits", href: "/dashboard/deposits", icon: "wallet" },
  { key: "Shares", href: "/dashboard/shares", icon: "pie-chart" },
  { key: "Expenses", href: "/dashboard/expenses", icon: "credit-card" },
  { key: "Accounting", href: "/dashboard/accounting", icon: "book-open" },
  { key: "Bank", href: "/dashboard/bank", icon: "building" },
  {
    key: "Microfinance",
    icon: "bank-notes",
    children: [
      { key: "PendingApplications", href: "/dashboard/microfinance/pending-applications" },
      { key: "RunningLoans", href: "/dashboard/microfinance/running-loans" },
      { key: "ClosedPaidLoans", href: "/dashboard/microfinance/closed-loans" },
      { key: "RejectedApplications", href: "/dashboard/microfinance/rejected-applications" },
    ]
  },
  { key: "Projects", href: "/dashboard/projects", icon: "briefcase" },
  { key: "Reports", href: "/dashboard/reports", icon: "file-text" },
  { key: "Backups", href: "/dashboard/backups", icon: "database" },
];

const translations: Record<"BN" | "EN", Record<string, string>> = {
  BN: {
    Dashboard: "ড্যাশবোর্ড",
    Members: "সদস্যবৃন্দ",
    Deposits: "আমানত/জমা",
    Shares: "শেয়ার",
    Expenses: "খরচসমূহ",
    Accounting: "হিসাবরক্ষণ",
    Bank: "ব্যাংক হিসাব",
    Microfinance: "মাইক্রোফাইনান্স",
    PendingApplications: "পেন্ডিং লোন আবেদন",
    RunningLoans: "চলতি লোনসমূহ",
    ClosedPaidLoans: "পরিশোধিত লোনসমূহ",
    RejectedApplications: "প্রত্যাখ্যাত আবেদন",
    Projects: "প্রজেক্টসমূহ",
    Reports: "রিপোর্ট ও বিবরণী",
    Backups: "ব্যাকআপ ফাইল",
    logout: "লগ আউট",
    activeUser: "সক্রিয় ব্যবহারকারী",
    signedIn: "লগইন করা আছে",
    settings: "সেটিংস",
  },
  EN: {
    Dashboard: "Dashboard",
    Members: "Members",
    Deposits: "Deposits",
    Shares: "Shares",
    Expenses: "Expenses",
    Accounting: "Accounting",
    Bank: "Bank",
    Microfinance: "Microfinance",
    PendingApplications: "Pending Applications",
    RunningLoans: "Running Loans",
    ClosedPaidLoans: "Closed / Paid Loans",
    RejectedApplications: "Rejected Applications",
    Projects: "Projects",
    Reports: "Reports",
    Backups: "Backups",
    logout: "Log out",
    activeUser: "Active User",
    signedIn: "Signed in",
    settings: "Settings",
  }
};

const getIcon = (iconName: string, className = "w-5 h-5") => {
  switch (iconName) {
    case "home":
      return <Home className={className} />;
    case "users":
      return <Users className={className} />;
    case "wallet":
      return <Wallet className={className} />;
    case "pie-chart":
      return <PieChart className={className} />;
    case "credit-card":
      return <CreditCard className={className} />;
    case "book-open":
      return <BookOpen className={className} />;
    case "building":
      return <Landmark className={className} />;
    case "bank-notes":
      return <Banknote className={className} />;
    case "briefcase":
      return <Briefcase className={className} />;
    case "file-text":
      return <FileText className={className} />;
    case "database":
      return <Database className={className} />;
    case "settings":
      return <Settings className={className} />;
    case "logout":
      return <LogOut className={className} />;
    default:
      return null;
  }
};

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { lang } = useLanguage();

  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    Microfinance: true,
  });

  const user = session?.user;
  const userInitials = user?.name
    ? user.name.substring(0, 2).toUpperCase()
    : user?.email
      ? user.email.substring(0, 2).toUpperCase()
      : "US";

  const t = translations[lang];

  useEffect(() => {
    if (pathname?.startsWith("/dashboard/microfinance")) {
      setExpandedMenus((prev) => ({ ...prev, Microfinance: true }));
    }
  }, [pathname]);

  return (
    <div className="flex h-screen w-64 flex-col bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-sm fixed z-40 overflow-y-auto select-none transition-colors duration-300">
      {/* Brand Header */}
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shadow-md shadow-emerald-900/10 dark:shadow-emerald-900/30">
            <Landmark className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="text-lg font-bold text-slate-900 dark:text-white tracking-wide">
            Somoby ERP
          </span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex flex-1 flex-col px-4 py-6 space-y-1">
        {navigation.map((item) => {
          if (item.children) {
            const isMenuExpanded = !!expandedMenus[item.key];
            const isAnyChildActive = item.children.some(child => pathname === child.href);
            const parentDisplayName = t[item.key] || item.key;

            return (
              <div key={item.key} className="space-y-1">
                <button
                  onClick={() => setExpandedMenus(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                  className={`flex w-full items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 text-left outline-none ${
                    isAnyChildActive
                      ? "bg-slate-200/60 dark:bg-slate-800 text-slate-900 dark:text-white"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/40 dark:hover:bg-slate-800/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {getIcon(item.icon, `w-4.5 h-4.5 ${isAnyChildActive ? "text-slate-900 dark:text-slate-100" : "text-slate-500 dark:text-slate-400"}`)}
                    <span>{parentDisplayName}</span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-300 ease-in-out ${
                      isAnyChildActive ? "text-slate-900 dark:text-slate-350" : "text-slate-400 dark:text-slate-500"
                    } ${isMenuExpanded ? "rotate-180" : ""}`}
                  />
                </button>
                
                {/* Smooth transition container */}
                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isMenuExpanded ? "max-h-48 opacity-100 mt-1" : "max-h-0 opacity-0 pointer-events-none"
                  }`}
                >
                  <div className="pl-4 space-y-1">
                    {item.children.map((child) => {
                      const isChildActive = pathname === child.href;
                      const childDisplayName = t[child.key] || child.key;
                      return (
                        <Link
                          key={child.key}
                          href={child.href}
                          className={`flex items-center gap-3 px-6.5 py-2 rounded-md text-xs font-medium tracking-wide transition-all duration-200 ${
                            isChildActive
                              ? "bg-slate-200/40 dark:bg-slate-800/60 text-slate-900 dark:text-white font-semibold"
                              : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-250 hover:bg-slate-200/20 dark:hover:bg-slate-800/20"
                          }`}
                        >
                          <span>{childDisplayName}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          }

          const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href!));
          const displayName = t[item.key] || item.key;
          return (
            <Link
              key={item.key}
              href={item.href!}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? "bg-slate-200/60 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border-l-2 border-slate-600 dark:border-slate-450 rounded-l-none"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/40 dark:hover:bg-slate-800/40"
              }`}
            >
              {getIcon(item.icon, `w-4.5 h-4.5 ${isActive ? "text-slate-900 dark:text-slate-100" : "text-slate-500 dark:text-slate-400"}`)}
              <span>{displayName}</span>
            </Link>
          );
        })}
      </nav>

      {/* Settings Block */}
      <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-800">
        <Link
          href="/settings/admitFee"
          className={`flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
            pathname?.startsWith("/settings")
              ? "bg-slate-200/60 dark:bg-slate-800 text-slate-900 dark:text-white"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-100 hover:bg-slate-200/40 dark:hover:bg-slate-800/40"
          }`}
        >
          <Settings className="w-4.5 h-4.5 text-slate-500 dark:text-slate-400" />
          <span>{t.settings}</span>
        </Link>
      </div>

      {/* User Profile Block */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-100/30 dark:bg-slate-950/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 px-1 py-2 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-slate-250 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {userInitials}
              </span>
            </div>
            <div className="truncate min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                {user?.name || t.activeUser}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-500 truncate">
                {user?.email || t.signedIn}
              </p>
            </div>
          </div>
          <button
            onClick={() => nextAuthSignOut({ callbackUrl: "/login" })}
            className="text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800/50 shrink-0 transition-colors"
            title={t.logout}
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
