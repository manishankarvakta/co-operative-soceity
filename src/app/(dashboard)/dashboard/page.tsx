"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/providers/LanguageProvider";
import {
  Users,
  UserPlus,
  Wallet,
  PieChart,
  CreditCard,
  BookOpen,
  Landmark,
  Briefcase,
  FileText,
  Database,
  Settings,
  ChevronDown,
  Calculator,
  BarChart2,
  Activity,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  LayoutGrid,
  LayoutDashboard,
  FileCheck,
  History,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  ShieldAlert
} from "lucide-react";

interface ChartDataItem {
  monthBN: string;
  monthEN: string;
  collectionsBdt: number;
  expensesBdt: number;
}

interface StatsData {
  totalMembers: number;
  totalDepositsBdt: number;
  totalExpensesBdt: number;
  bankBalanceBdt: number;
  cashBalanceBdt: number;
  chartData: ChartDataItem[];
}

interface PortalItem {
  id: string;
  name: { EN: string; BN: string };
  description: { EN: string; BN: string };
  category: "members" | "deposits" | "loans" | "accounting" | "reports" | "system";
  href: string;
  icon: string;
  color: string;
  badge?: { EN: string; BN: string };
}

const categories = [
  { id: "all", nameEN: "All Modules", nameBN: "সকল মডিউল" },
  { id: "members", nameEN: "Members & Roles", nameBN: "সদস্য ও রোল" },
  { id: "deposits", nameEN: "Deposits & Shares", nameBN: "সঞ্চয় ও শেয়ার" },
  { id: "loans", nameEN: "Microcredit", nameBN: "মাইক্রোক্রেডিট" },
  { id: "accounting", nameEN: "Accounting", nameBN: "হিসাব ও খরচ" },
  { id: "reports", nameEN: "Financial Reports", nameBN: "আর্থিক রিপোর্ট" },
  { id: "system", nameEN: "System & Projects", nameBN: "সিস্টেম ও প্রজেক্ট" },
];

const portalItems: PortalItem[] = [
  {
    id: "member-new",
    name: { EN: "Add New Member", BN: "সদস্য ভর্তি" },
    description: { EN: "Register and admit a new member into the society.", BN: "সমিতিতে নতুন সদস্য নিবন্ধন ও ভর্তি করুন।" },
    category: "members",
    href: "/dashboard/members/new",
    icon: "user-plus",
    color: "emerald",
    badge: { EN: "Quick Link", BN: "কুইক লিংক" }
  },
  {
    id: "member-list",
    name: { EN: "Member List", BN: "সদস্য তালিকা" },
    description: { EN: "View and manage all active and pending members.", BN: "সকল সক্রিয় ও পেন্ডিং সদস্য তালিকা দেখুন ও পরিচালনা করুন।" },
    category: "members",
    href: "/dashboard/members",
    icon: "users",
    color: "blue"
  },
  {
    id: "member-accounters",
    name: { EN: "Accounters List", BN: "হিসাব রক্ষক তালিকা" },
    description: { EN: "Manage accounts staff and assigned workspace roles.", BN: "হিসাবরক্ষণ কর্মকর্তা ও দায়িত্বপ্রাপ্ত কর্মকর্তাদের তালিকা।" },
    category: "members",
    href: "/dashboard/members/accounters",
    icon: "shield-check",
    color: "violet"
  },
  {
    id: "member-admins",
    name: { EN: "Admins List", BN: "এডমিন তালিকা" },
    description: { EN: "Administrator panel configuration and system operators.", BN: "সিস্টেম এডমিনিস্ট্রেটর এবং অপারেটরদের তালিকা।" },
    category: "members",
    href: "/dashboard/members/admins",
    icon: "shield-alert",
    color: "rose"
  },
  {
    id: "deposits-main",
    name: { EN: "Deposits & Savings", BN: "আমানত ও সঞ্চয় জমা" },
    description: { EN: "Manage member savings accounts and deposit schemes.", BN: "সদস্যদের সঞ্চয়ী হিসাব ও আমানত স্কিমসমূহ পরিচালনা করুন।" },
    category: "deposits",
    href: "/dashboard/deposits",
    icon: "wallet",
    color: "teal"
  },
  {
    id: "shares-ledger",
    name: { EN: "Share Ledger", BN: "শেয়ার লেজার" },
    description: { EN: "Track member equity shares, transactions and dividends.", BN: "সদস্যদের শেয়ার খতিয়ান, লেনদেন ও লভ্যাংশ ট্র্যাক করুন।" },
    category: "deposits",
    href: "/dashboard/shares/ledger",
    icon: "pie-chart",
    color: "amber"
  },
  {
    id: "shares-reports",
    name: { EN: "Share Reports", BN: "শেয়ার রিপোর্টস" },
    description: { EN: "Generate detailed analytics and summaries for equity shares.", BN: "শেয়ার মূলধনের বিস্তারিত রিপোর্ট ও বিবরণী তৈরি করুন।" },
    category: "reports",
    href: "/dashboard/shares/reports",
    icon: "bar-chart",
    color: "orange"
  },
  {
    id: "expenses-all",
    name: { EN: "All Expenses", BN: "সকল খরচ" },
    description: { EN: "View and log all operational and capital expenditures.", BN: "সকল অফিস ও পরিচালনা ব্যয়ের বিবরণ ও রেকর্ড দেখুন।" },
    category: "accounting",
    href: "/dashboard/expenses",
    icon: "credit-card",
    color: "red"
  },
  {
    id: "expenses-pending",
    name: { EN: "Pending Expenses", BN: "পেন্ডিং অনুমোদন" },
    description: { EN: "Approve or reject pending expense vouchers.", BN: "অনুমোদনের অপেক্ষায় থাকা খরচের আবেদনসমূহ পর্যালোচনা করুন।" },
    category: "accounting",
    href: "/dashboard/expenses/pending",
    icon: "file-check",
    color: "yellow",
    badge: { EN: "Review", BN: "রিভিউ" }
  },
  {
    id: "loans-pending",
    name: { EN: "Pending Loans", BN: "পেন্ডিং লোন আবেদন" },
    description: { EN: "Review submitted microcredit and loan applications.", BN: "আবেদনকৃত নতুন ঋণ ও মাইক্রোক্রেডিট আবেদনসমূহ যাচাই করুন।" },
    category: "loans",
    href: "/dashboard/microfinance/pending-applications",
    icon: "landmark",
    color: "sky",
    badge: { EN: "New", BN: "নতুন" }
  },
  {
    id: "loans-running",
    name: { EN: "Running Loans", BN: "চলতি লোনসমূহ" },
    description: { EN: "Monitor active loan disbursements and repayment status.", BN: "চলমান সকল ঋণের বিতরণ, কিস্তি আদায় ও বর্তমান স্থিতি দেখুন।" },
    category: "loans",
    href: "/dashboard/microfinance/running-loans",
    icon: "trending-up",
    color: "indigo"
  },
  {
    id: "loans-closed",
    name: { EN: "Closed & Paid Loans", BN: "পরিশোধিত লোনসমূহ" },
    description: { EN: "View fully settled and closed loan accounts history.", BN: "সম্পূর্ণ পরিশোধিত ও ক্লোজ হওয়া লোনসমূহের ইতিহাস দেখুন।" },
    category: "loans",
    href: "/dashboard/microfinance/closed-loans",
    icon: "history",
    color: "gray"
  },
  {
    id: "accounting-chart",
    name: { EN: "Chart of Accounts", BN: "চার্ট অব অ্যাকাউন্টস" },
    description: { EN: "Setup and configure ledger accounts and dimensions.", BN: "অ্যাকাউন্টিং লেজার গ্রুপ ও হিসাবের খাতসমূহ সেটআপ করুন।" },
    category: "accounting",
    href: "/dashboard/accounting/chart-of-accounts",
    icon: "calculator",
    color: "indigo"
  },
  {
    id: "accounting-bank",
    name: { EN: "Cash & Bank Accounts", BN: "নগদ ও ব্যাংক হিসাব" },
    description: { EN: "Manage cash in hand, vaults, and bank accounts balances.", BN: "হাতে নগদ, ক্যাশ ভল্ট ও ব্যাংক হিসাবের ব্যালেন্সসমূহ দেখুন।" },
    category: "accounting",
    href: "/dashboard/accounting/bank",
    icon: "landmark",
    color: "cyan"
  },
  {
    id: "accounting-vouchers",
    name: { EN: "Journal Vouchers", BN: "ভাউচারসমূহ" },
    description: { EN: "Record journal vouchers, cash receipts, and payments.", BN: "জার্নাল ভাউচার, ক্যাশ প্রাপ্তি ও ক্যাশ পেমেন্ট এন্ট্রি করুন।" },
    category: "accounting",
    href: "/dashboard/accounting/journal-vouchers",
    icon: "file-text",
    color: "pink"
  },
  {
    id: "accounting-ledger",
    name: { EN: "Account Ledger", BN: "অ্যাকাউন্ট খতিয়ান" },
    description: { EN: "Generate detailed ledger statements for any account.", BN: "যেকোনো হিসাবের সাধারণ খতিয়ান ও বিস্তারিত স্টেটমেন্ট দেখুন।" },
    category: "accounting",
    href: "/dashboard/accounting/account-ledger",
    icon: "book-open",
    color: "lime"
  },
  {
    id: "reports-trial",
    name: { EN: "Trial Balance", BN: "রেওয়ামিল (Trial Balance)" },
    description: { EN: "Generate and review debit-credit trial balance report.", BN: "ডেবিট-ক্রেডিট হিসাবের সমতা যাচাইয়ের রেওয়ামিল রিপোর্ট।" },
    category: "reports",
    href: "/dashboard/accounting/trial-balance",
    icon: "activity",
    color: "purple"
  },
  {
    id: "reports-balance-sheet",
    name: { EN: "Balance Sheet", BN: "ব্যালেন্স শীট" },
    description: { EN: "View the statement of financial position (Assets & Liabilities).", BN: "আর্থিক অবস্থার বিবরণী বা উদ্বর্তপত্র (সম্পদ ও দায়সমূহ) দেখুন।" },
    category: "reports",
    href: "/dashboard/accounting/balance-sheet",
    icon: "file-text",
    color: "violet"
  },
  {
    id: "reports-profit-loss",
    name: { EN: "Profit & Loss", BN: "লাভ-ক্ষতি বিবরণী" },
    description: { EN: "Generate income statement and net profit/loss analysis.", BN: "সমিতির আয়-ব্যয় হিসাব ও নীট লাভ-ক্ষতির বিশ্লেষণ দেখুন।" },
    category: "reports",
    href: "/dashboard/accounting/profit-loss",
    icon: "trending-up",
    color: "emerald"
  },
  {
    id: "reports-profit-dist",
    name: { EN: "Dividend Distribution", BN: "লভ্যাংশ বন্টন" },
    description: { EN: "Distribute accumulated profit and dividends to members.", BN: "অর্জিত নীট মুনাফা ও লভ্যাংশ সদস্যদের মাঝে বন্টন করুন।" },
    category: "reports",
    href: "/dashboard/accounting/profit-distribution",
    icon: "pie-chart",
    color: "fuchsia"
  },
  {
    id: "accounting-receivable",
    name: { EN: "Accounts Receivable", BN: "প্রাপ্য হিসাবসমূহ" },
    description: { EN: "Track outstanding amounts receivable from members/entities.", BN: "সদস্য বা অন্যান্য খাত থেকে অনাদায়ী বকেয়া পাওনা ট্র্যাক করুন।" },
    category: "accounting",
    href: "/dashboard/accounting/accounts-receivable",
    icon: "arrow-down-left",
    color: "rose"
  },
  {
    id: "accounting-payable",
    name: { EN: "Accounts Payable", BN: "প্রদেয় হিসাবসমূহ" },
    description: { EN: "Manage due liabilities and accounts payable records.", BN: "ব্যবসায়িক দেনাদার ও প্রদেয় হিসাবের বকেয়া পরিশোধ তালিকা।" },
    category: "accounting",
    href: "/dashboard/accounting/accounts-payable",
    icon: "arrow-up-right",
    color: "blue"
  },
  {
    id: "system-projects",
    name: { EN: "Projects", BN: "প্রজেক্টসমূহ" },
    description: { EN: "Manage development projects and venture capital assets.", BN: "সমিতির অর্থায়নে পরিচালিত বিশেষ প্রজেক্ট ও ব্যবসা পরিচালনা।" },
    category: "system",
    href: "/dashboard/projects",
    icon: "briefcase",
    color: "teal"
  },
  {
    id: "system-backups",
    name: { EN: "Backups", BN: "ব্যাকআপ ফাইল" },
    description: { EN: "Safely download database backups and check history.", BN: "সিস্টেম ডাটাবেজের ব্যাকআপ ফাইল ডাউনলোড ও হিস্ট্রি চেক করুন।" },
    category: "system",
    href: "/dashboard/backups",
    icon: "database",
    color: "slate"
  }
];

const getPortalIcon = (iconName: string, className = "w-6 h-6") => {
  switch (iconName) {
    case "users": return <Users className={className} />;
    case "user-plus": return <UserPlus className={className} />;
    case "wallet": return <Wallet className={className} />;
    case "pie-chart": return <PieChart className={className} />;
    case "credit-card": return <CreditCard className={className} />;
    case "book-open": return <BookOpen className={className} />;
    case "landmark": return <Landmark className={className} />;
    case "briefcase": return <Briefcase className={className} />;
    case "file-text": return <FileText className={className} />;
    case "database": return <Database className={className} />;
    case "settings": return <Settings className={className} />;
    case "calculator": return <Calculator className={className} />;
    case "bar-chart": return <BarChart2 className={className} />;
    case "activity": return <Activity className={className} />;
    case "trending-up": return <TrendingUp className={className} />;
    case "arrow-down-left": return <ArrowDownLeft className={className} />;
    case "arrow-up-right": return <ArrowUpRight className={className} />;
    case "search": return <Search className={className} />;
    case "layout-grid": return <LayoutGrid className={className} />;
    case "layout-dashboard": return <LayoutDashboard className={className} />;
    case "file-check": return <FileCheck className={className} />;
    case "history": return <History className={className} />;
    case "chevron-right": return <ChevronRight className={className} />;
    case "arrow-right": return <ArrowRight className={className} />;
    case "shield-check": return <ShieldCheck className={className} />;
    case "shield-alert": return <ShieldAlert className={className} />;
    default: return <LayoutGrid className={className} />;
  }
};

export default function ExecutiveDashboard() {
  const { lang } = useLanguage();
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<"LIVE" | "POLLING" | "ERROR">("LIVE");

  // Dual-view state: 'portal' by default
  const [dashboardView, setDashboardView] = useState<"portal" | "executive">("portal");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let fallbackInterval: NodeJS.Timeout | null = null;

    const connectSSE = () => {
      eventSource = new EventSource("/api/dashboard/sse");

      eventSource.onmessage = (event) => {
        try {
          const stats = JSON.parse(event.data);
          setData(stats);
          setConnectionStatus("LIVE");
          setLoading(false);
        } catch (err) {
          console.error("Failed to parse SSE stats:", err);
        }
      };

      eventSource.onerror = (err) => {
        console.warn("SSE stream error, shifting to fallback REST polling.", err);
        if (eventSource) {
          eventSource.close();
        }
        setConnectionStatus("POLLING");
        startPolling();
      };
    };

    const startPolling = () => {
      if (fallbackInterval) return;

      const fetchFallback = async () => {
        try {
          const res = await fetch("/api/dashboard/stats");
          if (res.ok) {
            const stats = await res.json();
            setData(stats);
            setConnectionStatus("POLLING");
            setLoading(false);
          } else {
            setConnectionStatus("ERROR");
          }
        } catch (err) {
          console.error("Dashboard stats polling error:", err);
          setConnectionStatus("ERROR");
        }
      };

      fetchFallback();
      fallbackInterval = setInterval(fetchFallback, 8000); // Check every 8s
    };

    // Begin with SSE
    connectSSE();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (fallbackInterval) {
        clearInterval(fallbackInterval);
      }
    };
  }, []);

  const labels = {
    BN: {
      title: "নির্বাহী ড্যাশবোর্ড",
      subtitle: "সমিতির সার্বিক আর্থিক অবস্থা, সংগ্রহ এবং ব্যয়ের রিয়েল-টাইম ওভারভিউ।",
      portalTitle: "কুইক অ্যাক্সেস পোর্টাল",
      portalSubtitle: "সমিতির বিভিন্ন মডিউল ও ফিচারে দ্রুত নেভিগেট করুন।",
      live: "সরাসরি আপডেট",
      polling: "অটো রিফ্রেশ হচ্ছে",
      error: "সংযোগ বিচ্ছিন্ন",
      totalMembers: "মোট সদস্য",
      totalDeposits: "মোট সঞ্চয় জমা",
      totalExpenses: "মোট খরচ",
      bankBalance: "ব্যাংক ব্যালেন্স",
      cashBalance: "ক্যাশ ব্যালেন্স",
      chartTitle: "আদায় বনাম খরচ তুলনা (গত ৬ মাস)",
      chartSubtitle: "মাসিক অর্জিত কালেকশন এবং অনুমোদিত ব্যয়ের তুলনামূলক চিত্র।",
      collections: "আদায় (Collection)",
      expenses: "খরচ (Expense)",
      memberUnit: "জন",
      currencyUnit: "টাকা",
      loading: "তথ্য লোড হচ্ছে...",
      noData: "কোনো তথ্য পাওয়া যায়নি。",
      searchPlaceholder: "মডিউল অনুসন্ধান করুন...",
      noResults: "কোনো মডিউল পাওয়া যায়নি!"
    },
    EN: {
      title: "Executive Dashboard",
      subtitle: "Real-time overview of the society's financial status, deposits, and expenses.",
      portalTitle: "Quick Access Portal",
      portalSubtitle: "Navigate quickly to the core modules and tools of your society.",
      live: "Live Updates",
      polling: "Auto Refreshing",
      error: "Offline",
      totalMembers: "Total Members",
      totalDeposits: "Total Deposits",
      totalExpenses: "Total Expenses",
      bankBalance: "Bank Balance",
      cashBalance: "Cash Balance",
      chartTitle: "Collection vs Expense Comparison (Last 6 Months)",
      chartSubtitle: "Comparative analysis of monthly deposits collected and approved expenses.",
      collections: "Collections",
      expenses: "Expenses",
      memberUnit: "Members",
      currencyUnit: "BDT",
      loading: "Loading dashboard stats...",
      noData: "No data available.",
      searchPlaceholder: "Search modules...",
      noResults: "No modules found!"
    }
  };

  // Find max value in chart data to scale heights proportionally
  const chartMax = data?.chartData?.reduce((max, item) => {
    return Math.max(max, item.collectionsBdt, item.expensesBdt);
  }, 1000) || 1000;

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case "LIVE":
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            {labels[lang].live}
          </span>
        );
      case "POLLING":
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping"></span>
            {labels[lang].polling}
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-full dark:bg-rose-955/20 dark:text-rose-450 dark:border-rose-900/30">
            <span className="w-2 h-2 bg-rose-500 rounded-full"></span>
            {labels[lang].error}
          </span>
        );
    }
  };

  // Filter portal items based on category and search query
  const filteredPortalItems = portalItems.filter((item) => {
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      item.name.EN.toLowerCase().includes(searchLower) ||
      item.name.BN.includes(searchQuery) ||
      item.description.EN.toLowerCase().includes(searchLower) ||
      item.description.BN.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
          {labels[lang].loading}
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-lg font-bold text-rose-600 dark:text-rose-400">
          {labels[lang].noData}
        </p>
      </div>
    );
  }

  const kpis = [
    {
      title: labels[lang].totalMembers,
      value: data.totalMembers,
      unit: ` ${labels[lang].memberUnit}`,
      isCurrency: false,
      colorClass: "from-blue-500/10 to-indigo-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/20",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
        </svg>
      )
    },
    {
      title: labels[lang].totalDeposits,
      value: data.totalDepositsBdt,
      unit: ` ${labels[lang].currencyUnit}`,
      isCurrency: true,
      colorClass: "from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/20",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      )
    },
    {
      title: labels[lang].totalExpenses,
      value: data.totalExpensesBdt,
      unit: ` ${labels[lang].currencyUnit}`,
      isCurrency: true,
      colorClass: "from-rose-500/10 to-red-500/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/20",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5 21 12m0 0-11.25 7.5M21 12H3.75" />
        </svg>
      )
    },
    {
      title: labels[lang].bankBalance,
      value: data.bankBalanceBdt,
      unit: ` ${labels[lang].currencyUnit}`,
      isCurrency: true,
      colorClass: "from-sky-500/10 to-blue-500/10 text-sky-600 dark:text-sky-400 border-sky-100 dark:border-sky-900/20",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
        </svg>
      )
    },
    {
      title: labels[lang].cashBalance,
      value: data.cashBalanceBdt,
      unit: ` ${labels[lang].currencyUnit}`,
      isCurrency: true,
      colorClass: "from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/20",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 12m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v6" />
        </svg>
      )
    }
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 transition-all">
      {/* Upper header segment */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-6 gap-4 border-gray-200 dark:border-zinc-800">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white leading-tight">
            {dashboardView === "portal" ? labels[lang].portalTitle : labels[lang].title}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 font-medium">
            {dashboardView === "portal" ? labels[lang].portalSubtitle : labels[lang].subtitle}
          </p>
        </div>

        {/* Action Controls Side: Switcher and Connection Indicator */}
        <div className="flex flex-wrap items-center gap-4 self-stretch md:self-auto justify-between md:justify-start">
          {/* Segmented Switcher Controls */}
          <div className="flex bg-gray-200/50 dark:bg-zinc-800/80 p-1 rounded-xl shadow-inner border border-black/5 dark:border-zinc-700/50">
            <button
              onClick={() => setDashboardView("portal")}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${
                dashboardView === "portal"
                  ? "bg-white dark:bg-zinc-950 text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              {lang === "BN" ? "পোর্টাল হাব" : "Portal Hub"}
            </button>
            <button
              onClick={() => setDashboardView("executive")}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${
                dashboardView === "executive"
                  ? "bg-white dark:bg-zinc-950 text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              {lang === "BN" ? "বিশ্লেষণ ড্যাশবোর্ড" : "Executive View"}
            </button>
          </div>

          <div className="flex items-center gap-3">
            {getStatusBadge()}
          </div>
        </div>
      </div>

      {/* RENDER VIEW DEPENDING ON ACTIVE MODE */}
      {dashboardView === "portal" ? (
        <div className="space-y-6">
          {/* Search and Category Filter Section */}
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center bg-white dark:bg-zinc-900 p-4 md:p-6 rounded-2xl border border-black/5 dark:border-zinc-800 shadow-sm">
            <div className="relative flex-1 max-w-lg">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                <Search className="w-5 h-5 text-gray-400 dark:text-zinc-500" />
              </span>
              <input
                type="text"
                placeholder={labels[lang].searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-10 py-2.5 text-sm bg-gray-55 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl text-gray-900 dark:text-white placeholder-gray-450 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-bold text-gray-450 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Pills Selector */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none max-w-full -mx-4 px-4 lg:mx-0 lg:px-0">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all duration-300 ${
                    selectedCategory === cat.id
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10 hover:bg-emerald-700"
                      : "bg-gray-100 hover:bg-gray-200/80 text-gray-600 dark:bg-zinc-850 dark:text-zinc-450 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                  }`}
                >
                  {lang === "BN" ? cat.nameBN : cat.nameEN}
                </button>
              ))}
            </div>
          </div>

          {/* Module Cards Grid */}
          {filteredPortalItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredPortalItems.map((item) => {
                const colorMap: Record<string, { bg: string; text: string; ring: string; hoverBorder: string; gradient: string }> = {
                  emerald: {
                    bg: "bg-emerald-50 dark:bg-emerald-950/20",
                    text: "text-emerald-650 dark:text-emerald-400",
                    ring: "ring-emerald-500/10 dark:ring-emerald-500/20",
                    hoverBorder: "hover:border-emerald-500/40 dark:hover:border-emerald-500/30",
                    gradient: "from-emerald-500/[0.04] to-teal-500/[0.04]",
                  },
                  blue: {
                    bg: "bg-blue-50 dark:bg-blue-950/20",
                    text: "text-blue-650 dark:text-blue-400",
                    ring: "ring-blue-500/10 dark:ring-blue-500/20",
                    hoverBorder: "hover:border-blue-500/40 dark:hover:border-blue-500/30",
                    gradient: "from-blue-500/[0.04] to-indigo-500/[0.04]",
                  },
                  violet: {
                    bg: "bg-violet-50 dark:bg-violet-950/20",
                    text: "text-violet-650 dark:text-violet-400",
                    ring: "ring-violet-500/10 dark:ring-violet-500/20",
                    hoverBorder: "hover:border-violet-500/40 dark:hover:border-violet-500/30",
                    gradient: "from-violet-500/[0.04] to-purple-500/[0.04]",
                  },
                  rose: {
                    bg: "bg-rose-50 dark:bg-rose-950/20",
                    text: "text-rose-650 dark:text-rose-455",
                    ring: "ring-rose-500/10 dark:ring-rose-500/20",
                    hoverBorder: "hover:border-rose-500/40 dark:hover:border-rose-500/30",
                    gradient: "from-rose-500/[0.04] to-red-500/[0.04]",
                  },
                  teal: {
                    bg: "bg-teal-50 dark:bg-teal-950/20",
                    text: "text-teal-650 dark:text-teal-400",
                    ring: "ring-teal-500/10 dark:ring-teal-500/20",
                    hoverBorder: "hover:border-teal-500/40 dark:hover:border-teal-500/30",
                    gradient: "from-teal-500/[0.04] to-emerald-500/[0.04]",
                  },
                  amber: {
                    bg: "bg-amber-50 dark:bg-amber-950/20",
                    text: "text-amber-650 dark:text-amber-455",
                    ring: "ring-amber-500/10 dark:ring-amber-500/20",
                    hoverBorder: "hover:border-amber-500/40 dark:hover:border-amber-500/30",
                    gradient: "from-amber-500/[0.04] to-yellow-500/[0.04]",
                  },
                  orange: {
                    bg: "bg-orange-50 dark:bg-orange-950/20",
                    text: "text-orange-650 dark:text-orange-400",
                    ring: "ring-orange-500/10 dark:ring-orange-500/20",
                    hoverBorder: "hover:border-orange-500/40 dark:hover:border-orange-500/30",
                    gradient: "from-orange-500/[0.04] to-amber-500/[0.04]",
                  },
                  red: {
                    bg: "bg-red-50 dark:bg-red-950/20",
                    text: "text-red-650 dark:text-red-400",
                    ring: "ring-red-500/10 dark:ring-red-500/20",
                    hoverBorder: "hover:border-red-500/40 dark:hover:border-red-500/30",
                    gradient: "from-red-500/[0.04] to-rose-500/[0.04]",
                  },
                  yellow: {
                    bg: "bg-yellow-50 dark:bg-yellow-950/20",
                    text: "text-yellow-650 dark:text-yellow-400",
                    ring: "ring-yellow-500/10 dark:ring-yellow-500/20",
                    hoverBorder: "hover:border-yellow-500/40 dark:hover:border-yellow-500/30",
                    gradient: "from-yellow-500/[0.04] to-amber-500/[0.04]",
                  },
                  sky: {
                    bg: "bg-sky-50 dark:bg-sky-950/20",
                    text: "text-sky-650 dark:text-sky-400",
                    ring: "ring-sky-500/10 dark:ring-sky-500/20",
                    hoverBorder: "hover:border-sky-500/40 dark:hover:border-sky-500/30",
                    gradient: "from-sky-500/[0.04] to-cyan-500/[0.04]",
                  },
                  indigo: {
                    bg: "bg-indigo-50 dark:bg-indigo-950/20",
                    text: "text-indigo-650 dark:text-indigo-400",
                    ring: "ring-indigo-500/10 dark:ring-indigo-500/20",
                    hoverBorder: "hover:border-indigo-500/40 dark:hover:border-indigo-500/30",
                    gradient: "from-indigo-500/[0.04] to-purple-500/[0.04]",
                  },
                  gray: {
                    bg: "bg-gray-55 dark:bg-zinc-800/55",
                    text: "text-gray-600 dark:text-zinc-350",
                    ring: "ring-gray-500/10 dark:ring-zinc-755",
                    hoverBorder: "hover:border-gray-500/45 dark:hover:border-zinc-650",
                    gradient: "from-gray-500/[0.03] to-zinc-500/[0.03]",
                  },
                  cyan: {
                    bg: "bg-cyan-50 dark:bg-cyan-950/20",
                    text: "text-cyan-650 dark:text-cyan-400",
                    ring: "ring-cyan-500/10 dark:ring-cyan-500/20",
                    hoverBorder: "hover:border-cyan-500/40 dark:hover:border-cyan-500/30",
                    gradient: "from-cyan-500/[0.04] to-blue-500/[0.04]",
                  },
                  pink: {
                    bg: "bg-pink-50 dark:bg-pink-950/20",
                    text: "text-pink-650 dark:text-pink-400",
                    ring: "ring-pink-500/10 dark:ring-pink-500/20",
                    hoverBorder: "hover:border-pink-500/40 dark:hover:border-pink-500/30",
                    gradient: "from-pink-500/[0.04] to-rose-500/[0.04]",
                  },
                  lime: {
                    bg: "bg-lime-50 dark:bg-lime-950/20",
                    text: "text-lime-655 dark:text-lime-400",
                    ring: "ring-lime-500/10 dark:ring-lime-500/20",
                    hoverBorder: "hover:border-lime-500/40 dark:hover:border-lime-500/30",
                    gradient: "from-lime-500/[0.04] to-emerald-500/[0.04]",
                  },
                  purple: {
                    bg: "bg-purple-50 dark:bg-purple-950/20",
                    text: "text-purple-650 dark:text-purple-400",
                    ring: "ring-purple-500/10 dark:ring-purple-500/20",
                    hoverBorder: "hover:border-purple-500/40 dark:hover:border-purple-500/30",
                    gradient: "from-purple-500/[0.04] to-fuchsia-500/[0.04]",
                  },
                  fuchsia: {
                    bg: "bg-fuchsia-50 dark:bg-fuchsia-950/20",
                    text: "text-fuchsia-650 dark:text-fuchsia-400",
                    ring: "ring-fuchsia-500/10 dark:ring-fuchsia-500/20",
                    hoverBorder: "hover:border-fuchsia-500/45 dark:hover:border-fuchsia-500/30",
                    gradient: "from-fuchsia-500/[0.04] to-pink-500/[0.04]",
                  },
                  slate: {
                    bg: "bg-slate-50 dark:bg-slate-950/20",
                    text: "text-slate-650 dark:text-slate-400",
                    ring: "ring-slate-500/10 dark:ring-slate-500/20",
                    hoverBorder: "hover:border-slate-500/40 dark:hover:border-slate-500/30",
                    gradient: "from-slate-500/[0.04] to-zinc-500/[0.04]",
                  },
                };

                const c = colorMap[item.color] || colorMap.emerald;

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`group relative flex flex-col justify-between bg-white dark:bg-zinc-900 rounded-2xl border border-black/5 dark:border-zinc-800 shadow-sm p-6 hover:shadow-lg hover:scale-[1.01] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden ${c.hoverBorder}`}
                  >
                    {/* Subtle gradient pattern background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${c.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none -z-10`} />

                    <div className="space-y-4.5">
                      <div className="flex items-center justify-between">
                        {/* Icon frame */}
                        <div className={`p-3 rounded-xl ${c.bg} ${c.text} ring-4 ${c.ring} group-hover:scale-105 transition-transform duration-300`}>
                          {getPortalIcon(item.icon, "w-5.5 h-5.5")}
                        </div>

                        {/* Badge */}
                        {item.badge && (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 text-amber-700 bg-amber-50 border border-amber-200 rounded-full dark:bg-amber-955/20 dark:text-amber-400 dark:border-amber-900/30">
                            {lang === "BN" ? item.badge.BN : item.badge.EN}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-455 transition-colors duration-250">
                          {lang === "BN" ? item.name.BN : item.name.EN}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                          {lang === "BN" ? item.description.BN : item.description.EN}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 pt-3.5 border-t border-gray-100 dark:border-zinc-850 flex items-center justify-between text-xs font-bold text-gray-400 dark:text-zinc-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-455 transition-colors duration-250">
                      <span>{lang === "BN" ? "মডিউলে প্রবেশ" : "Open Module"}</span>
                      <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-black/5 dark:border-zinc-800 shadow-sm min-h-[320px] animate-fadeIn">
              <div className="p-3.5 rounded-full bg-rose-50 dark:bg-rose-955/20 text-rose-500 dark:text-rose-455 mb-4">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {labels[lang].noResults}
              </h3>
              <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1.5 max-w-sm leading-relaxed">
                {lang === "BN"
                  ? "আপনার অনুসন্ধানের সাথে মেলে এমন কোনো মডিউল খুঁজে পাওয়া যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।"
                  : "We couldn't find any modules matching your search. Please check your keywords and try again."}
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                className="mt-5 px-5 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors shadow-md shadow-emerald-600/10"
              >
                {lang === "BN" ? "অনুসন্ধান রিসেট করুন" : "Reset Search"}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8 animate-fadeIn">
          {/* Metric Cards Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {kpis.map((kpi, idx) => (
              <div
                key={idx}
                className="relative bg-white dark:bg-zinc-900 rounded-xl border border-black/5 dark:border-zinc-800 shadow-sm p-6 flex flex-col justify-between hover:shadow-md hover:scale-[1.01] transition-all duration-300 overflow-hidden group"
              >
                {/* Glossy hover decorative gradient */}
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none -z-10" />
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">
                    {kpi.title}
                  </span>
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${kpi.colorClass} shadow-inner`}>
                    {kpi.icon}
                  </div>
                </div>
                
                <div className="mt-4 flex items-baseline">
                  <span className="text-2xl font-black text-gray-850 dark:text-zinc-100 font-mono tracking-tight">
                    {kpi.isCurrency
                      ? kpi.value.toLocaleString(lang === "BN" ? "bn-BD" : "en-US", { minimumFractionDigits: 2 })
                      : kpi.value.toLocaleString(lang === "BN" ? "bn-BD" : "en-US")}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 ml-1 font-bold">
                    {kpi.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Comparison Analytics Chart Section */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-black/5 dark:border-zinc-800 shadow-md p-6 md:p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white leading-snug">
                {labels[lang].chartTitle}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {labels[lang].chartSubtitle}
              </p>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 text-xs font-semibold pb-2 border-b border-gray-100 dark:border-zinc-850">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-emerald-500 block"></span>
                <span className="text-gray-650 dark:text-gray-300">{labels[lang].collections}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-rose-500 block"></span>
                <span className="text-gray-650 dark:text-gray-300">{labels[lang].expenses}</span>
              </div>
            </div>

            {/* CSS Chart Render Grid */}
            <div className="h-80 w-full mt-4 flex items-end justify-between gap-4 pt-6 select-none relative font-mono">
              {/* Y Axis Guide Lines */}
              <div className="absolute inset-x-0 bottom-0 top-6 flex flex-col justify-between pointer-events-none z-0">
                <div className="w-full border-t border-dashed border-gray-100 dark:border-zinc-850" />
                <div className="w-full border-t border-dashed border-gray-100 dark:border-zinc-850" />
                <div className="w-full border-t border-dashed border-gray-100 dark:border-zinc-850" />
                <div className="w-full border-t border-dashed border-gray-100 dark:border-zinc-850" />
                <div className="w-full border-t border-gray-200 dark:border-zinc-800" />
              </div>

              {data.chartData.map((item, idx) => {
                const colHeight = (item.collectionsBdt / chartMax) * 100;
                const expHeight = (item.expensesBdt / chartMax) * 100;

                return (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center h-full justify-end z-10 group/month"
                  >
                    {/* Columns alignment side-by-side */}
                    <div className="flex items-end justify-center w-full gap-2 md:gap-3 h-full pb-2">
                      {/* Collections Bar */}
                      <div className="w-6 sm:w-8 md:w-10 flex flex-col justify-end h-full relative group/bar">
                        <div
                          style={{ height: `${Math.max(colHeight, 2)}%` }}
                          className="w-full rounded-t bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 transition-all duration-700 ease-out shadow-sm origin-bottom"
                        />
                        {/* Hover Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 text-white text-[10px] py-1.5 px-2.5 rounded shadow-lg whitespace-nowrap opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none z-30">
                          <strong className="block text-[9px] text-emerald-400">
                            {lang === "BN" ? "আদায়" : "Collection"}
                          </strong>
                          {item.collectionsBdt.toLocaleString(lang === "BN" ? "bn-BD" : "en-US")} BDT
                        </div>
                      </div>

                      {/* Expenses Bar */}
                      <div className="w-6 sm:w-8 md:w-10 flex flex-col justify-end h-full relative group/bar2">
                        <div
                          style={{ height: `${Math.max(expHeight, 2)}%` }}
                          className="w-full rounded-t bg-rose-500 hover:bg-rose-600 dark:bg-rose-600 dark:hover:bg-rose-500 transition-all duration-700 ease-out shadow-sm origin-bottom"
                        />
                        {/* Hover Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 text-white text-[10px] py-1.5 px-2.5 rounded shadow-lg whitespace-nowrap opacity-0 group-hover/bar2:opacity-100 transition-opacity pointer-events-none z-30">
                          <strong className="block text-[9px] text-rose-400">
                            {lang === "BN" ? "খরচ" : "Expense"}
                          </strong>
                          {item.expensesBdt.toLocaleString(lang === "BN" ? "bn-BD" : "en-US")} BDT
                        </div>
                      </div>
                    </div>

                    {/* X Axis label (month name) */}
                    <span className="text-[10px] md:text-xs font-bold text-gray-500 dark:text-gray-400 mt-2 text-center truncate w-full">
                      {lang === "BN" ? item.monthBN : item.monthEN}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
