"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/providers/LanguageProvider";
import { Printer } from "lucide-react";

export default function TrialBalancePage() {
  const { lang } = useLanguage();
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadReport = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/accounting/reports?type=TRIAL_BALANCE");
      const data = await res.json();
      setReportData(res.ok && !data?.error ? data : null);
    } catch (err) {
      console.error(err);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const labels = {
    BN: {
      title: "রেওয়ামিল বিবরণী (Trial Balance)",
      subtitle: "হিসাব খতিয়ানের ডেবিট ও ক্রেডিট ব্যালেন্সের সমতা বিবরণী যাচাই করুন।",
      loading: "লোডিং হচ্ছে...",
      debit: "ডেবিট (Debit)",
      credit: "ক্রেডিট (Credit)",
      total: "সর্বমোট",
      print: "প্রিন্ট / PDF"
    },
    EN: {
      title: "Trial Balance Sheet",
      subtitle: "Verify double-entry balancing of all active ledger accounts.",
      loading: "Loading...",
      debit: "Debit",
      credit: "Credit",
      total: "Total",
      print: "Print / PDF"
    }
  };

  return (
    <div className="space-y-6">
      {/* Export Bar */}
      <div className="p-4 bg-gray-50 dark:bg-zinc-800 border rounded-lg flex justify-between items-center no-print">
        <span className="text-xs text-gray-500 font-bold">
          {lang === "BN" ? "রিপোর্ট এক্সপোর্ট করুন:" : "Available Statement Export formats:"}
        </span>
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-white dark:bg-zinc-900 border text-xs font-bold rounded hover:bg-gray-100 transition shadow-sm flex items-center gap-1.5"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>{labels[lang].print}</span>
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">{labels[lang].loading}</p>
      ) : !reportData ? (
        <p className="text-sm text-red-500">রিপোর্ট ডাটা পাওয়া যায়নি।</p>
      ) : (
        <div className="p-8 border rounded-lg bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 shadow max-w-3xl mx-auto print:border-0 print:shadow-none print:p-0">
          <div className="text-center mb-6 border-b pb-4 dark:border-zinc-800">
            <h2 className="text-xl font-black text-gray-800 dark:text-white">উত্থান বহুমুখী সমবায় সমিতি লিমিটেড</h2>
            <span className="text-xs text-gray-500 uppercase tracking-widest block mt-1 font-semibold">
              Trial Balance Sheet (রেওয়ামিল)
            </span>
            <span className="text-[10px] text-gray-400 block mt-1">As of: {new Date().toLocaleDateString()}</span>
          </div>

          <table className="w-full text-left text-sm border-collapse border border-gray-300 dark:border-zinc-800 font-sans">
            <thead>
              <tr className="bg-gray-50 dark:bg-zinc-800 text-gray-700 dark:text-zinc-200 font-bold border-b border-gray-300 dark:border-zinc-800">
                <th className="px-4 py-3 border-r border-gray-300 dark:border-zinc-800">হিসাব কোড / লেজার নাম</th>
                <th className="px-4 py-3 border-r border-gray-300 dark:border-zinc-800 text-right">{labels[lang].debit}</th>
                <th className="px-4 py-3 text-right">{labels[lang].credit}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
              {reportData.rows?.map((row: any) => (
                <tr key={row.code} className="text-gray-700 dark:text-zinc-300">
                  <td className="px-4 py-2.5 border-r border-gray-300 dark:border-zinc-800">
                    {row.code} - {row.name}
                  </td>
                  <td className="px-4 py-2.5 border-r border-gray-300 dark:border-zinc-800 text-right font-mono">
                    {row.debit > 0 ? row.debit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono">
                    {row.credit > 0 ? row.credit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 dark:bg-zinc-800 text-gray-805 dark:text-white font-bold border-t-2 border-gray-300 dark:border-zinc-700 text-base">
                <td className="px-4 py-3 border-r border-gray-300 dark:border-zinc-800 text-right">{labels[lang].total}:</td>
                <td className="px-4 py-3 border-r border-gray-300 dark:border-zinc-800 text-right font-mono text-emerald-700 dark:text-emerald-400">
                  {reportData.totals?.totalDebit?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || "0.00"} BDT
                </td>
                <td className="px-4 py-3 text-right font-mono text-emerald-700 dark:text-emerald-400">
                  {reportData.totals?.totalCredit?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || "0.00"} BDT
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
