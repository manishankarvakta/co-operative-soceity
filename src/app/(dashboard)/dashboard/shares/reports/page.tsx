"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/providers/LanguageProvider";

export default function ShareReportsPage() {
  const { lang } = useLanguage();

  // Reports state
  const [reports, setReports] = useState<any>(null);
  const [loadingReports, setLoadingReports] = useState(true);

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
    fetchReports();
  }, []);

  const labels = {
    BN: {
      title: "শেয়ার ব্যবস্থাপনা প্যানেল (Share Workspace)",
      subtitle: "সদস্যদের শেয়ার খতিয়ান, ক্যাপিটাল ব্যালেন্স এবং শেয়ার রিপোর্টিং কনসোল।",
      tabLedger: "শেয়ার লেজার (Ledger)",
      tabReports: "শেয়ার রিপোর্টস (Reports)",
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
      emptyReports: "রিপোর্ট পাওয়া যায়নি।",
      loading: "লোডিং হচ্ছে..."
    },
    EN: {
      title: "Share Management Workspace",
      subtitle: "Member share ledger registry, cumulative capital balance, and reports.",
      tabLedger: "Share Ledger",
      tabReports: "Share Reports",
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
      emptyReports: "Failed to load reports.",
      loading: "Loading..."
    }
  }[lang];

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Title Header */}
      <div className="flex justify-between items-center border-b pb-4 border-gray-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{labels.title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{labels.subtitle}</p>
        </div>
      </div>


      {/* Reports and analytics tab */}
      <div className="space-y-8">
        {loadingReports ? (
          <div className="p-8 text-center text-gray-500 font-semibold">{labels.loading}</div>
        ) : !reports ? (
          <div className="p-8 text-center text-red-500 font-bold">{labels.emptyReports}</div>
        ) : (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm ring-1 ring-gray-900/5 dark:ring-white/10 flex flex-col relative overflow-hidden group hover:shadow-md transition-all">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2 z-10">
                  {labels.totalOutstanding}
                </span>
                <span className="text-2xl font-black text-gray-800 dark:text-white font-mono z-10">
                  {reports.summary.totalSharesIssued.toLocaleString(lang === "BN" ? "bn-BD" : "en-US")} Shares
                </span>
              </div>

              <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm ring-1 ring-gray-900/5 dark:ring-white/10 flex flex-col relative overflow-hidden group hover:shadow-md transition-all">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2 z-10">
                  {labels.totalCapital}
                </span>
                <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono z-10">
                  {reports.summary.totalCapitalizationBdt.toLocaleString(lang === "BN" ? "bn-BD" : "en-US", { minimumFractionDigits: 2 })} BDT
                </span>
              </div>

              <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm ring-1 ring-gray-900/5 dark:ring-white/10 flex flex-col relative overflow-hidden group hover:shadow-md transition-all">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2 z-10">
                  {labels.activeShareholders}
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
                    {labels.distributionTitle}
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
                    {labels.recentTitle}
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
    </div>
  );
}
