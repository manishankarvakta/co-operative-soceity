"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/providers/LanguageProvider";

export default function ShareWorkspacePage() {
  const { lang } = useLanguage();
  const [activeTab, setActiveTab] = useState<"ledger" | "reports">("ledger");

  // Ledger state
  const [ledger, setLedger] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerPagination, setLedgerPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });
  const [loadingLedger, setLoadingLedger] = useState(true);

  // Reports state
  const [reports, setReports] = useState<any>(null);
  const [loadingReports, setLoadingReports] = useState(true);

  const fetchLedger = async (page = 1) => {
    setLoadingLedger(true);
    try {
      const urlParams = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        search
      });
      const response = await fetch(`/api/shares/ledger?${urlParams}`);
      const data = await response.json();
      setLedger(data.ledger || []);
      setLedgerPagination(data.pagination || { currentPage: 1, totalPages: 1, totalItems: 0 });
      setLedgerPage(page);
    } catch (error) {
      console.error("Failed to load ledger:", error);
    } finally {
      setLoadingLedger(false);
    }
  };

  const fetchReports = async () => {
    setLoadingReports(true);
    try {
      const response = await fetch("/api/shares/reports");
      const data = await response.json();
      setReports(data);
    } catch (error) {
      console.error("Failed to load share reports:", error);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    if (activeTab === "ledger") {
      fetchLedger(1);
    } else {
      fetchReports();
    }
  }, [activeTab, search]);

  const labels = {
    BN: {
      title: "শেয়ার ব্যবস্থাপনা প্যানেল (Share Workspace)",
      subtitle: "সদস্যদের শেয়ার খতিয়ান, ক্যাপিটাল ব্যালেন্স এবং শেয়ার রিপোর্টিং কনসোল।",
      tabLedger: "শেয়ার লেজার (Ledger)",
      tabReports: "শেয়ার রিপোর্টস (Reports)",
      searchPlaceholder: "নাম বা কোড দিয়ে শেয়ার হোল্ডার খুঁজুন...",
      memberCode: "মেম্বার আইডি",
      name: "সদস্যের নাম",
      phone: "মোবাইল নম্বর",
      totalShares: "মোট শেয়ার সংখ্যা",
      shareValue: "শেয়ার মূল্য (BDT)",
      lastTx: "সর্বশেষ লেনদেন",
      action: "অ্যাকশন",
      viewHistory: "ইতিহাস দেখুন",
      totalOutstanding: "মোট ইস্যুকৃত শেয়ার",
      totalCapital: "মোট শেয়ার ক্যাপিটাল",
      activeShareholders: "সক্রিয় শেয়ার হোল্ডার",
      distributionTitle: "শেয়ার হোল্ডিং বন্টন তালিকা",
      distributionBracket: "শেয়ার সীমা (Bracket)",
      distributionCount: "শেয়ার হোল্ডার সংখ্যা",
      recentTitle: "সাম্প্রতিক শেয়ার লেনদেন লগ",
      recentMember: "শেয়ার হোল্ডার",
      recentDate: "তারিখ",
      recentShares: "শেয়ার যোগ",
      recentValue: "মূল্য (BDT)",
      recentReceipt: "রসিদ",
      emptyLedger: "কোনো শেয়ার হোল্ডারের তথ্য পাওয়া যায়নি।",
      emptyReports: "রিপোর্ট পাওয়া যায়নি।",
      loading: "লোডিং হচ্ছে..."
    },
    EN: {
      title: "Share Management Workspace",
      subtitle: "Member share ledger registry, cumulative capital balance, and reports.",
      tabLedger: "Share Ledger",
      tabReports: "Share Reports",
      searchPlaceholder: "Search shareholder by name or code...",
      memberCode: "Member ID",
      name: "Member Name",
      phone: "Phone Number",
      totalShares: "Total Shares",
      shareValue: "Share Value (BDT)",
      lastTx: "Last Transaction",
      action: "Action",
      viewHistory: "View History",
      totalOutstanding: "Total Outstanding Shares",
      totalCapital: "Total Capitalization",
      activeShareholders: "Active Shareholders",
      distributionTitle: "Share Distribution Statistics",
      distributionBracket: "Holding Bracket",
      distributionCount: "Shareholders Count",
      recentTitle: "Recent Share Transaction Logs",
      recentMember: "Shareholder",
      recentDate: "Transaction Date",
      recentShares: "Shares Added",
      recentValue: "Value (BDT)",
      recentReceipt: "Receipt Link",
      emptyLedger: "No shareholder records found.",
      emptyReports: "Failed to load reports.",
      loading: "Loading..."
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Title Header */}
      <div className="flex justify-between items-center border-b pb-4 border-gray-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{labels[lang].title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{labels[lang].subtitle}</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-4 border-b border-gray-200 dark:border-zinc-800">
        <button
          onClick={() => setActiveTab("ledger")}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === "ledger"
              ? "border-emerald-650 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          {labels[lang].tabLedger}
        </button>
        <button
          onClick={() => setActiveTab("reports")}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === "reports"
              ? "border-emerald-650 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          {labels[lang].tabReports}
        </button>
      </div>

      {/* Main Tab Area */}
      {activeTab === "ledger" ? (
        <div className="space-y-6">
          {/* Search bar input */}
          <div className="relative max-w-md">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={labels[lang].searchPlaceholder}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-zinc-850 dark:border-zinc-700 dark:text-white"
            />
            <div className="absolute left-3 top-2.5 text-gray-400">🔍</div>
          </div>

          {/* Ledger table */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-150 dark:border-zinc-800 shadow-md overflow-hidden transition-all duration-300">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-zinc-850 text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold border-b border-gray-150 dark:border-zinc-800">
                  <tr>
                    <th className="px-6 py-4">{labels[lang].memberCode}</th>
                    <th className="px-6 py-4">{labels[lang].name}</th>
                    <th className="px-6 py-4">{labels[lang].phone}</th>
                    <th className="px-6 py-4 text-center">{labels[lang].totalShares}</th>
                    <th className="px-6 py-4 text-right">{labels[lang].shareValue}</th>
                    <th className="px-6 py-4">{labels[lang].lastTx}</th>
                    <th className="px-6 py-4 text-right">{labels[lang].action}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                  {loadingLedger ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-500">
                        {labels[lang].loading}
                      </td>
                    </tr>
                  ) : ledger.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-500">
                        {labels[lang].emptyLedger}
                      </td>
                    </tr>
                  ) : (
                    ledger.map((item) => (
                      <tr key={item.memberId} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          {item.memberCode}
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-800 dark:text-white">
                          {item.name}
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300 font-mono">
                          {item.phone}
                        </td>
                        <td className="px-6 py-4 text-center font-mono font-bold text-gray-800 dark:text-white">
                          {item.totalShares.toLocaleString(lang === "BN" ? "bn-BD" : "en-US")}
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-gray-850 dark:text-zinc-200">
                          {item.totalValue.toLocaleString(lang === "BN" ? "bn-BD" : "en-US", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                          {item.lastTransactionDate
                            ? new Date(item.lastTransactionDate).toLocaleDateString(lang === "BN" ? "bn-BD" : "en-US")
                            : "—"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/shares/history/${item.memberId}`}
                            className="inline-block px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 border border-emerald-250 dark:border-emerald-800 rounded-md transition-all"
                          >
                            {labels[lang].viewHistory}
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination console */}
            {ledgerPagination.totalPages > 1 && (
              <div className="p-4 bg-gray-50 dark:bg-zinc-850 border-t border-gray-150 dark:border-zinc-850 flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                <span>
                  {lang === "BN"
                    ? `মোট শেয়ার হোল্ডার: ${ledgerPagination.totalItems} জন`
                    : `Total Shareholders: ${ledgerPagination.totalItems}`}
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={ledgerPagination.currentPage === 1}
                    onClick={() => fetchLedger(ledgerPagination.currentPage - 1)}
                    className="px-3 py-1 bg-white dark:bg-zinc-800 border rounded-md disabled:opacity-50 transition"
                  >
                    {lang === "BN" ? "পূর্ববর্তী" : "Previous"}
                  </button>
                  <span className="py-1">
                    {lang === "BN"
                      ? `পৃষ্ঠা ${ledgerPagination.currentPage} / ${ledgerPagination.totalPages}`
                      : `Page ${ledgerPagination.currentPage} of ${ledgerPagination.totalPages}`}
                  </span>
                  <button
                    disabled={ledgerPagination.currentPage === ledgerPagination.totalPages}
                    onClick={() => fetchLedger(ledgerPagination.currentPage + 1)}
                    className="px-3 py-1 bg-white dark:bg-zinc-800 border rounded-md disabled:opacity-50 transition"
                  >
                    {lang === "BN" ? "পরবর্তী" : "Next"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Reports and analytics tab */
        <div className="space-y-8">
          {loadingReports ? (
            <div className="p-8 text-center text-gray-500 font-semibold">{labels[lang].loading}</div>
          ) : !reports ? (
            <div className="p-8 text-center text-red-500 font-bold">{labels[lang].emptyReports}</div>
          ) : (
            <>
              {/* Summary stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-gray-150 dark:border-zinc-800 shadow-md flex flex-col">
                  <span className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">
                    {labels[lang].totalOutstanding}
                  </span>
                  <span className="text-2xl font-black text-gray-800 dark:text-white font-mono">
                    {reports.summary.totalSharesIssued.toLocaleString(lang === "BN" ? "bn-BD" : "en-US")} Shares
                  </span>
                </div>

                <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-gray-150 dark:border-zinc-800 shadow-md flex flex-col">
                  <span className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">
                    {labels[lang].totalCapital}
                  </span>
                  <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
                    {reports.summary.totalCapitalizationBdt.toLocaleString(lang === "BN" ? "bn-BD" : "en-US", { minimumFractionDigits: 2 })} BDT
                  </span>
                </div>

                <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-gray-150 dark:border-zinc-800 shadow-md flex flex-col">
                  <span className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">
                    {labels[lang].activeShareholders}
                  </span>
                  <span className="text-2xl font-black text-gray-800 dark:text-white font-mono">
                    {reports.summary.activeShareholders.toLocaleString(lang === "BN" ? "bn-BD" : "en-US")} {lang === "BN" ? "জন" : "Members"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Distribution bracket list */}
                <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-gray-150 dark:border-zinc-800 shadow-md">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 border-b pb-2">
                    {labels[lang].distributionTitle}
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(reports.distribution).map(([bracket, count]) => (
                      <div key={bracket} className="flex justify-between items-center text-sm border-b pb-2 dark:border-zinc-800">
                        <span className="text-gray-600 dark:text-zinc-350">{bracket}</span>
                        <strong className="text-gray-800 dark:text-white font-mono text-base">
                          {Number(count).toLocaleString(lang === "BN" ? "bn-BD" : "en-US")} {lang === "BN" ? "জন" : "Shareholders"}
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent share log history */}
                <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-gray-150 dark:border-zinc-800 shadow-md">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 border-b pb-2">
                    {labels[lang].recentTitle}
                  </h3>
                  <div className="overflow-x-auto text-xs">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-gray-550 border-b dark:border-zinc-800 font-bold">
                          <th className="pb-2">{labels[lang].recentMember}</th>
                          <th className="pb-2 text-center">{labels[lang].recentShares}</th>
                          <th className="pb-2 text-right">{labels[lang].recentValue}</th>
                          <th className="pb-2 text-right">{labels[lang].recentReceipt}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-zinc-850">
                        {reports.recentLogs.map((log: any) => (
                          <tr key={log.id} className="text-gray-700 dark:text-zinc-300">
                            <td className="py-2.5">
                              <span className="font-bold">{log.memberName}</span>
                              <span className="block text-[10px] text-gray-500 font-mono">{log.memberCode}</span>
                            </td>
                            <td className="py-2.5 text-center font-bold font-mono">
                              +{log.count}
                            </td>
                            <td className="py-2.5 text-right font-mono">
                              {log.value.toLocaleString()}
                            </td>
                            <td className="py-2.5 text-right font-mono text-emerald-600 dark:text-emerald-400">
                              {log.receiptCode !== "N/A" ? (
                                <span className="underline select-all">{log.receiptCode}</span>
                              ) : (
                                "—"
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
