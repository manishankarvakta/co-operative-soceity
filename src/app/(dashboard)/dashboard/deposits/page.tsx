"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/providers/LanguageProvider";

export default function DepositsListPage() {
  const { lang } = useLanguage();
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

  const labels = {
    BN: {
      title: "জমা ট্রানজেকশন তালিকা (Deposits Directory)",
      subtitle: "সমিতিতে সদস্যদের জমানো সাপ্তাহিক/মাসিক চাঁদা ও অন্যান্য ফি কালেকশন রেকর্ড।",
      addBtn: "+ নতুন জমা এন্ট্রি",
      cash: "ক্যাশ (Cash)",
      bank: "ব্যাংক (Bank)",
      colReceipt: "রসিদ নম্বর",
      colName: "সদস্যের নাম",
      colCode: "মেম্বার কোড",
      colMode: "পেমেন্ট মোড",
      colTotal: "মোট পরিমাণ (BDT)",
      colDate: "জমার তারিখ",
      colAction: "অ্যাকশন",
      loading: "অপেক্ষা করুন...",
      noData: "কোনো জমার তথ্য খুঁজে পাওয়া যায়নি।",
      viewReceipt: "রসিদ দেখুন/প্রিন্ট",
      totalRecords: "মোট জমা রেকর্ড",
      unit: "টি",
      prev: "পূর্ববর্তী",
      next: "পরবর্তী",
      page: "পৃষ্ঠা"
    },
    EN: {
      title: "Deposits Directory",
      subtitle: "Collection records of weekly/monthly subscriptions and other fees.",
      addBtn: "+ Add New Deposit",
      cash: "Cash",
      bank: "Bank",
      colReceipt: "Receipt No.",
      colName: "Member Name",
      colCode: "Member Code",
      colMode: "Payment Mode",
      colTotal: "Total Amount (BDT)",
      colDate: "Deposit Date",
      colAction: "Action",
      loading: "Please wait...",
      noData: "No deposit records found.",
      viewReceipt: "View/Print Receipt",
      totalRecords: "Total Deposit Records",
      unit: "entries",
      prev: "Previous",
      next: "Next",
      page: "Page"
    }
  };

  const getPaymentModeBadge = (mode: string) => {
    if (mode === "CASH") {
      return (
        <span className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-250 rounded-full dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50">
          {labels[lang].cash}
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-250 rounded-full dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50">
        {labels[lang].bank}
      </span>
    );
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Title block */}
      <div className="flex justify-between items-center border-b pb-4 border-gray-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{labels[lang].title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{labels[lang].subtitle}</p>
        </div>
        <Link
          href="/dashboard/deposits/new"
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg shadow-md transition-all duration-200"
        >
          {labels[lang].addBtn}
        </Link>
      </div>

      {/* Tables Grid */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-black/5 dark:border-zinc-800 shadow-md overflow-hidden transition-all duration-300">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-zinc-850 text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold border-b border-black/5 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4">{labels[lang].colReceipt}</th>
                <th className="px-6 py-4">{labels[lang].colName}</th>
                <th className="px-6 py-4">{labels[lang].colCode}</th>
                <th className="px-6 py-4">{labels[lang].colMode}</th>
                <th className="px-6 py-4">{labels[lang].colTotal}</th>
                <th className="px-6 py-4">{labels[lang].colDate}</th>
                <th className="px-6 py-4 text-right">{labels[lang].colAction}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    {labels[lang].loading}
                  </td>
                </tr>
              ) : deposits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    {labels[lang].noData}
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
                        {totalAmount.toLocaleString(lang === "BN" ? "bn-BD" : "en-US", { minimumFractionDigits: 2 })} BDT
                      </td>
                      <td className="px-6 py-4 text-gray-650 dark:text-gray-300">
                        {new Date(deposit.createdAt).toLocaleDateString(lang === "BN" ? "bn-BD" : "en-US")}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Link
                          href={`/deposits/${deposit.id}/receipt`}
                          className="inline-block px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 border border-emerald-250 dark:border-emerald-800 rounded-md transition-all"
                        >
                          {labels[lang].viewReceipt}
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
          <div className="p-4 bg-gray-50 dark:bg-zinc-850 border-t border-black/5 dark:border-zinc-850 flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
            <span>{labels[lang].totalRecords}: {pagination.totalItems} {labels[lang].unit}</span>
            <div className="flex gap-2">
              <button
                disabled={pagination.currentPage === 1}
                onClick={() => fetchDeposits(pagination.currentPage - 1)}
                className="px-3 py-1 bg-white dark:bg-zinc-800 border rounded-md disabled:opacity-50 transition"
              >
                {labels[lang].prev}
              </button>
              <span className="py-1">
                {labels[lang].page} {pagination.currentPage} / {pagination.totalPages}
              </span>
              <button
                disabled={pagination.currentPage === pagination.totalPages}
                onClick={() => fetchDeposits(pagination.currentPage + 1)}
                className="px-3 py-1 bg-white dark:bg-zinc-800 border rounded-md disabled:opacity-50 transition"
              >
                {labels[lang].next}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
