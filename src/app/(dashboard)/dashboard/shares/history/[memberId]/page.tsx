"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/providers/LanguageProvider";
import { AlertTriangle } from "lucide-react";

interface HistoryPageProps {
  params: Promise<{
    memberId: string;
  }>;
}

export default function MemberShareHistoryPage({ params }: HistoryPageProps) {
  const { memberId } = use(params);
  const { lang } = useLanguage();
  const [history, setHistory] = useState<any[]>([]);
  const [member, setMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });

  const fetchHistory = async (pageNumber = 1) => {
    setLoading(true);
    setError(null);
    try {
      const urlParams = new URLSearchParams({
        page: pageNumber.toString(),
        limit: "10"
      });
      const response = await fetch(`/api/shares/history/${memberId}?${urlParams}`);
      const data = await response.json();
      if (!response.ok || (data.success === false)) {
        setError(data.message || "ইতিহাস লোড করতে ব্যর্থ হয়েছে।");
      } else {
        setHistory(data.history || []);
        setMember(data.member);
        setPagination(data.pagination || { currentPage: 1, totalPages: 1, totalItems: 0 });
        setPage(pageNumber);
      }
    } catch (err) {
      setError("সার্ভারে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(1);
  }, [memberId]);

  const labels = {
    BN: {
      title: "শেয়ার লেনদেন খতিয়ান (Share Transaction Log)",
      subtitle: "সদস্যের অর্জিত বা সমন্বিত শেয়ারের বিস্তারিত লেনদেন বিবরণী।",
      backBtn: "← খতিয়ানে ফিরে যান",
      member: "শেয়ার হোল্ডার",
      memberCode: "মেম্বার আইডি",
      sl: "ক্রমিক",
      date: "লেনদেন তারিখ",
      details: "বিবরণ / ব্যাখ্যা",
      shares: "শেয়ার সংখ্যা",
      value: "মূল্য (BDT)",
      receipt: "রসিদ",
      emptyHistory: "এই সদস্যের কোনো শেয়ার লেনদেনের তথ্য পাওয়া যায়নি।",
      loading: "অপেক্ষা করুন...",
      totalItems: "মোট লেনদেন রেকর্ড"
    },
    EN: {
      title: "Share Transaction Log",
      subtitle: "Detailed transaction history of shares purchased or adjusted for the member.",
      backBtn: "← Back to Ledger",
      member: "Shareholder Name",
      memberCode: "Member ID",
      sl: "SL",
      date: "Date",
      details: "Description / Details",
      shares: "Shares Count",
      value: "Value (BDT)",
      receipt: "Receipt Reference",
      emptyHistory: "No share transactions found for this member.",
      loading: "Loading...",
      totalItems: "Total Transaction Records"
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Back button */}
      <div className="flex justify-between items-center">
        <Link
          href="/dashboard/shares"
          className="px-4 py-2 bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-200 font-bold text-sm rounded-lg shadow-sm ring-1 ring-gray-200 dark:ring-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-all"
        >
          {labels[lang].backBtn}
        </Link>
      </div>

      {error && (
        <div className="p-3 text-sm font-semibold text-red-600 bg-red-50 dark:bg-red-950/20 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-900/40 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Shareholder Header Profile Card */}
      {member && (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm ring-1 ring-gray-900/5 dark:ring-white/10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-gray-500 uppercase font-bold tracking-wider block mb-1">
                {labels[lang].member}
              </span>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">{member.name}</h2>
            </div>
            <div>
              <span className="text-xs text-gray-500 uppercase font-bold tracking-wider block mb-1">
                {labels[lang].memberCode}
              </span>
              <strong className="font-mono text-emerald-700 dark:text-emerald-400 text-lg">{member.memberCode}</strong>
            </div>
          </div>
        </div>
      )}

      {/* History table list */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm ring-1 ring-gray-900/5 dark:ring-white/10 overflow-hidden transition-all duration-300">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50">
          <h1 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            {labels[lang].title}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{labels[lang].subtitle}</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white dark:bg-zinc-900 text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold border-b border-gray-100 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4 w-16 text-center">{labels[lang].sl}</th>
                <th className="px-6 py-4">{labels[lang].date}</th>
                <th className="px-6 py-4">{labels[lang].details}</th>
                <th className="px-6 py-4 text-center">{labels[lang].shares}</th>
                <th className="px-6 py-4 text-right">{labels[lang].value}</th>
                <th className="px-6 py-4 text-right">{labels[lang].receipt}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    {labels[lang].loading}
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    {labels[lang].emptyHistory}
                  </td>
                </tr>
              ) : (
                history.map((row, index) => (
                  <tr key={row.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4 text-center font-mono text-gray-500">
                      {lang === "BN" ? (index + 1).toLocaleString("bn-BD") : index + 1}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300 font-mono">
                      {new Date(row.createdAt).toLocaleDateString(lang === "BN" ? "bn-BD" : "en-US")}
                    </td>
                    <td className="px-6 py-4 text-gray-800 dark:text-zinc-200">
                      {row.details}
                    </td>
                    <td className="px-6 py-4 text-center font-mono font-bold text-gray-800 dark:text-white">
                      +{row.count.toLocaleString(lang === "BN" ? "bn-BD" : "en-US")}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-gray-800 dark:text-zinc-200">
                      {row.value.toLocaleString(lang === "BN" ? "bn-BD" : "en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-emerald-600 dark:text-emerald-400">
                      {row.receiptCode !== "N/A" ? (
                        <Link href={`/dashboard/deposits/${row.transactionId}/receipt`} className="underline">
                          {row.receiptCode}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Console */}
        {pagination.totalPages > 1 && (
          <div className="p-4 bg-gray-50/50 dark:bg-zinc-800/50 border-t border-gray-100 dark:border-zinc-800 flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
            <span>
              {labels[lang].totalItems}: {pagination.totalItems}
            </span>
            <div className="flex gap-2">
              <button
                disabled={pagination.currentPage === 1}
                onClick={() => fetchHistory(pagination.currentPage - 1)}
                className="px-3 py-1 bg-white dark:bg-zinc-800 border rounded-md disabled:opacity-50 transition"
              >
                {lang === "BN" ? "পূর্ববর্তী" : "Previous"}
              </button>
              <span className="py-1">
                {lang === "BN"
                  ? `পৃষ্ঠা ${pagination.currentPage} / ${pagination.totalPages}`
                  : `Page ${pagination.currentPage} of ${pagination.totalPages}`}
              </span>
              <button
                disabled={pagination.currentPage === pagination.totalPages}
                onClick={() => fetchHistory(pagination.currentPage + 1)}
                className="px-3 py-1 bg-white dark:bg-zinc-800 border rounded-md disabled:opacity-50 transition"
              >
                {lang === "BN" ? "পরবর্তী" : "Next"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
