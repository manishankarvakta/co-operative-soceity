"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/providers/LanguageProvider";

export default function ProfitLossPage() {
  const { lang } = useLanguage();
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadReport = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/accounting/reports?type=PROFIT_LOSS");
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
      title: "লাভ-ক্ষতি বিবরণী (Profit & Loss Statement)",
      subtitle: "সমিতির মোট আয় ও মোট ব্যয়ের বিবরণী এবং নিট লভ্যাংশ দেখুন।",
      loading: "লোডিং হচ্ছে...",
      print: "প্রিন্ট / PDF"
    },
    EN: {
      title: "Profit & Loss Income Statement",
      subtitle: "Review operational revenues, office expenditures, and overall net profit.",
      loading: "Loading...",
      print: "Print / PDF"
    }
  };

  return (
    <div className="space-y-6">
      {/* Export Bar */}
      <div className="p-4 bg-gray-55 dark:bg-zinc-855 border rounded-lg flex justify-between items-center no-print">
        <span className="text-xs text-gray-500 font-bold">
          {lang === "BN" ? "রিপোর্ট এক্সপোর্ট করুন:" : "Available Statement Export formats:"}
        </span>
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-white dark:bg-zinc-900 border text-xs font-bold rounded hover:bg-gray-100 transition shadow-sm"
        >
          🖨️ {labels[lang].print}
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
            <span className="text-xs text-gray-550 uppercase tracking-widest block mt-1 font-semibold">
              Profit and Loss Income Statement (লাভ-ক্ষতি বিবরণী)
            </span>
            <span className="text-[10px] text-gray-400 block mt-1">As of: {new Date().toLocaleDateString()}</span>
          </div>

          <div className="space-y-6 text-sm font-sans">
            {/* Revenue */}
            <div>
              <h4 className="font-bold border-b pb-1 mb-2 text-gray-800 dark:text-white uppercase tracking-wider">Revenue (আয়সমূহ)</h4>
              <div className="space-y-2">
                {reportData.revenue?.map((item: any) => (
                  <div key={item.code} className="flex justify-between border-b pb-1 dark:border-zinc-850 text-gray-700 dark:text-zinc-300">
                    <span>{item.name} ({item.code})</span>
                    <span className="font-mono font-semibold">{item.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} BDT</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-bold text-gray-850 dark:text-white pt-2 text-base">
                <span>Total Revenue:</span>
                <span className="font-mono text-emerald-700 dark:text-emerald-450">
                  {reportData.totals?.totalRevenue?.toLocaleString(undefined, { minimumFractionDigits: 2 })} BDT
                </span>
              </div>
            </div>

            {/* Expenses */}
            <div>
              <h4 className="font-bold border-b pb-1 mb-2 text-gray-800 dark:text-white uppercase tracking-wider">Expenses (ব্যয়সমূহ)</h4>
              <div className="space-y-2">
                {reportData.expenses?.map((item: any) => (
                  <div key={item.code} className="flex justify-between border-b pb-1 dark:border-zinc-850 text-gray-700 dark:text-zinc-300">
                    <span>{item.name} ({item.code})</span>
                    <span className="font-mono font-semibold">{item.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} BDT</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-bold text-gray-850 dark:text-white pt-2 text-base">
                <span>Total Expenses:</span>
                <span className="font-mono text-amber-700 dark:text-amber-450">
                  {reportData.totals?.totalExpenses?.toLocaleString(undefined, { minimumFractionDigits: 2 })} BDT
                </span>
              </div>
            </div>

            {/* Net Profit */}
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 rounded-xl flex justify-between items-center text-lg font-black">
              <span className="text-emerald-800 dark:text-emerald-400">Net Profit (নিট লভ্যাংশ):</span>
              <span className="font-mono text-emerald-800 dark:text-emerald-400">
                {reportData.totals?.netProfit?.toLocaleString(undefined, { minimumFractionDigits: 2 })} BDT
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
