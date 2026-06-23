"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/providers/LanguageProvider";

export default function ShareLedgerPage() {
  const { lang } = useLanguage();

  // Ledger state
  const [ledger, setLedger] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [ledgerPagination, setLedgerPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });
  const [loadingLedger, setLoadingLedger] = useState(true);

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
    } catch (error) {
      console.error("Failed to load ledger:", error);
    } finally {
      setLoadingLedger(false);
    }
  };

  useEffect(() => {
    fetchLedger(1);
  }, [search]);

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
      emptyLedger: "কোনো শেয়ার হোল্ডারের তথ্য পাওয়া যায়নি।",
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
      emptyLedger: "No shareholder records found.",
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


      {/* Main Tab Area */}
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
            placeholder={labels.searchPlaceholder}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-sm dark:text-white"
          />
        </div>

        {/* Ledger table */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm ring-1 ring-gray-900/5 dark:ring-white/10 overflow-hidden transition-all duration-300">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/80 dark:bg-zinc-850/50 text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold border-b border-gray-100 dark:border-zinc-800">
                <tr>
                  <th className="px-6 py-4">{labels.memberCode}</th>
                  <th className="px-6 py-4">{labels.name}</th>
                  <th className="px-6 py-4">{labels.phone}</th>
                  <th className="px-6 py-4 text-center">{labels.totalShares}</th>
                  <th className="px-6 py-4 text-right">{labels.shareValue}</th>
                  <th className="px-6 py-4">{labels.lastTx}</th>
                  <th className="px-6 py-4 text-right">{labels.action}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                {loadingLedger ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">
                      {labels.loading}
                    </td>
                  </tr>
                ) : ledger.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">
                      {labels.emptyLedger}
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
                        {item.totalValue.toLocaleString(lang === "BN" ? "bn-BD" : "en-US", { minimumFractionDigits: 2 })} BDT
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
                          {labels.viewHistory}
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
    </div>
  );
}
