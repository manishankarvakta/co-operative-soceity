"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function DepositsListPage() {
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });

  const fetchDeposits = async (page = 1) => {
    setLoading(true);
    try {
      const urlParams = new URLSearchParams({
        page: page.toString(),
        limit: "10"
      });
      const response = await fetch(`/api/deposits?${urlParams}`);
      const data = await response.json();
      setDeposits(data.deposits || []);
      setPagination(data.pagination || { currentPage: 1, totalPages: 1, totalItems: 0 });
    } catch (error) {
      console.error("Failed to load deposits:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits(1);
  }, []);

  const getReceiptCode = (remarks: string | null) => {
    const r = remarks || "";
    if (r.startsWith("REC-")) {
      return r.split(" ")[0];
    }
    return "REC-N/A";
  };

  const getPaymentModeBadge = (mode: string) => {
    if (mode === "CASH") {
      return (
        <span className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-250 rounded-full dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50">
          ক্যাশ (Cash)
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-250 rounded-full dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50">
        ব্যাংক (Bank)
      </span>
    );
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Title block */}
      <div className="flex justify-between items-center border-b pb-4 border-gray-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">জমা ট্রানজেকশন তালিকা (Deposits Directory)</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">সমিতিতে সদস্যদের জমানো সাপ্তাহিক/মাসিক চাঁদা ও অন্যান্য ফি কালেকশন রেকর্ড।</p>
        </div>
        <Link
          href="/deposits/new"
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg shadow-md transition-all duration-200"
        >
          + নতুন জমা এন্ট্রি
        </Link>
      </div>

      {/* Tables Grid */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-150 dark:border-zinc-800 shadow-md overflow-hidden transition-all duration-300">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-zinc-850 text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold border-b border-gray-150 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4">রসিদ নম্বর</th>
                <th className="px-6 py-4">সদস্যের নাম</th>
                <th className="px-6 py-4">মেম্বার কোড</th>
                <th className="px-6 py-4">পেমেন্ট মোড</th>
                <th className="px-6 py-4">মোট পরিমাণ (BDT)</th>
                <th className="px-6 py-4">জমার তারিখ</th>
                <th className="px-6 py-4 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    অপেক্ষা করুন...
                  </td>
                </tr>
              ) : deposits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    কোনো জমার তথ্য খুঁজে পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                deposits.map((deposit) => {
                  const totalAmount = deposit.items.reduce((sum: number, item: any) => sum + item.amount, 0) / 100;
                  return (
                    <tr key={deposit.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {getReceiptCode(deposit.remarks)}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-800 dark:text-white">
                        {deposit.member.name}
                      </td>
                      <td className="px-6 py-4 font-mono text-gray-600 dark:text-gray-300">
                        {deposit.member.memberCode}
                      </td>
                      <td className="px-6 py-4">
                        {getPaymentModeBadge(deposit.paymentMode)}
                      </td>
                      <td className="px-6 py-4 font-bold font-mono text-gray-800 dark:text-white">
                        {totalAmount.toLocaleString("bn-BD", { minimumFractionDigits: 2 })} BDT
                      </td>
                      <td className="px-6 py-4 text-gray-650 dark:text-gray-300">
                        {new Date(deposit.createdAt).toLocaleDateString("bn-BD")}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Link
                          href={`/deposits/${deposit.id}/receipt`}
                          className="inline-block px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 border border-emerald-250 dark:border-emerald-800 rounded-md transition-all"
                        >
                          রসিদ দেখুন/প্রিন্ট
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Console */}
        {pagination.totalPages > 1 && (
          <div className="p-4 bg-gray-50 dark:bg-zinc-850 border-t border-gray-150 dark:border-zinc-850 flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
            <span>মোট জমা রেকর্ড: {pagination.totalItems} টি</span>
            <div className="flex gap-2">
              <button
                disabled={pagination.currentPage === 1}
                onClick={() => fetchDeposits(pagination.currentPage - 1)}
                className="px-3 py-1 bg-white dark:bg-zinc-800 border rounded-md disabled:opacity-50 transition"
              >
                পূর্ববর্তী
              </button>
              <span className="py-1">
                পৃষ্ঠা {pagination.currentPage} / {pagination.totalPages}
              </span>
              <button
                disabled={pagination.currentPage === pagination.totalPages}
                onClick={() => fetchDeposits(pagination.currentPage + 1)}
                className="px-3 py-1 bg-white dark:bg-zinc-800 border rounded-md disabled:opacity-50 transition"
              >
                পরবর্তী
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
