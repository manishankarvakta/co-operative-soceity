"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/providers/LanguageProvider";

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

export default function ExecutiveDashboard() {
  const { lang } = useLanguage();
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<"LIVE" | "POLLING" | "ERROR">("LIVE");

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
      noData: "কোনো তথ্য পাওয়া যায়নি।"
    },
    EN: {
      title: "Executive Dashboard",
      subtitle: "Real-time overview of the society's financial status, deposits, and expenses.",
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
      noData: "No data available."
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
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-full dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30">
            <span className="w-2 h-2 bg-rose-500 rounded-full"></span>
            {labels[lang].error}
          </span>
        );
    }
  };

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
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto transition-all">
      {/* Upper header segment */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 gap-4 border-gray-200 dark:border-zinc-800">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white leading-tight">
            {labels[lang].title}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {labels[lang].subtitle}
          </p>
        </div>
        <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-start">
          {getStatusBadge()}
        </div>
      </div>

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
  );
}
