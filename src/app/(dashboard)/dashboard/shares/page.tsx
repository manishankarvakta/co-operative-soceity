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
          <div className="relative max-w-md group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400 group-focus-within:text-emerald-500 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={labels[lang].searchPlaceholder}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-sm dark:text-white"
            />
          </div>

          {/* Ledger table */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm ring-1 ring-gray-900/5 dark:ring-white/10 overflow-hidden transition-all duration-300">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/80 dark:bg-zinc-850/50 text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold border-b border-gray-100 dark:border-zinc-800">
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
                            href={`/dashboard/shares/history/${item.memberId}`}
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
              <div className="p-4 bg-gray-50/50 dark:bg-zinc-850/50 border-t border-gray-100 dark:border-zinc-800 flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
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
                <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm ring-1 ring-gray-900/5 dark:ring-white/10 flex flex-col relative overflow-hidden group hover:shadow-md transition-all">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2 z-10">
                    {labels[lang].totalOutstanding}
                  </span>
                  <span className="text-2xl font-black text-gray-800 dark:text-white font-mono z-10">
                    {reports.summary.totalSharesIssued.toLocaleString(lang === "BN" ? "bn-BD" : "en-US")} Shares
                  </span>
                </div>

                <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm ring-1 ring-gray-900/5 dark:ring-white/10 flex flex-col relative overflow-hidden group hover:shadow-md transition-all">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2 z-10">
                    {labels[lang].totalCapital}
                  </span>
                  <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono z-10">
                    {reports.summary.totalCapitalizationBdt.toLocaleString(lang === "BN" ? "bn-BD" : "en-US", { minimumFractionDigits: 2 })} BDT
                  </span>
                </div>

                <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm ring-1 ring-gray-900/5 dark:ring-white/10 flex flex-col relative overflow-hidden group hover:shadow-md transition-all">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2 z-10">
                    {labels[lang].activeShareholders}
                  </span>
                  <span className="text-2xl font-black text-gray-800 dark:text-white font-mono z-10">
                    {reports.summary.activeShareholders.toLocaleString(lang === "BN" ? "bn-BD" : "en-US")} {lang === "BN" ? "জন" : "Members"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Distribution bracket list */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm ring-1 ring-gray-900/5 dark:ring-white/10 overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path></svg>
                      {labels[lang].distributionTitle}
                    </h3>
                  </div>
                  <div className="px-6 py-2">
                    <dl className="divide-y divide-gray-100 dark:divide-zinc-800">
                      {Object.entries(reports.distribution).map(([bracket, count]) => (
                        <div key={bracket} className="py-4 flex justify-between items-center text-sm">
                          <dt className="text-gray-600 dark:text-zinc-350">{bracket}</dt>
                          <dd className="text-gray-900 dark:text-white font-mono font-bold">
                            {Number(count).toLocaleString(lang === "BN" ? "bn-BD" : "en-US")} {lang === "BN" ? "জন" : "Shareholders"}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>

                {/* Recent share log history */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm ring-1 ring-gray-900/5 dark:ring-white/10 overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      {labels[lang].recentTitle}
                    </h3>
                  </div>
                  <div className="px-6 py-2">
                    <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                      {reports.recentLogs.map((log: any) => (
                        <div key={log.id} className="py-4 flex justify-between items-center text-sm">
                          <div>
                            <span className="font-bold text-gray-900 dark:text-white block">{log.memberName}</span>
                            <div className="flex gap-2 items-center mt-1">
                              <span className="text-xs text-gray-500 font-mono bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">{log.memberCode}</span>
                              {log.receiptCode !== "N/A" && (
                                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 px-1.5 py-0.5 rounded">
                                  #{log.receiptCode}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono block">+{log.count} <span className="text-[10px] font-bold text-emerald-700/50 dark:text-emerald-400/50 uppercase tracking-wider">Shares</span></span>
                            <span className="text-xs text-gray-500 font-mono mt-1 block font-semibold">
                              {log.value.toLocaleString()} BDT
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
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
