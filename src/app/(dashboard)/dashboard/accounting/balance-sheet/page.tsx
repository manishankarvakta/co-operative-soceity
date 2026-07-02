"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/providers/LanguageProvider";

export default function BalanceSheetPage() {
  const { lang } = useLanguage();
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadReport = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/accounting/reports?type=BALANCE_SHEET");
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
      title: "ব্যালেন্স শীট আর্থিক বিবরণী (Balance Sheet)",
      subtitle: "সমিতির মোট সম্পদ এবং দায় ও মূলধন তহবিলের সমাপনী বিবরণী দেখুন।",
      loading: "লোডিং হচ্ছে...",
      print: "প্রিন্ট / PDF"
    },
    EN: {
      title: "Balance Sheet Statement",
      subtitle: "Summarize ending balances of assets, liabilities, and equity funds.",
      loading: "Loading...",
      print: "Print / PDF"
    }
  };

  return (
    <div className="space-y-6">
      {/* Export Bar */}
      <div className="p-4 bg-zinc-100/50 dark:bg-zinc-900/50 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl flex justify-between items-center no-print">
        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-bold">
          {lang === "BN" ? "রিপোর্ট এক্সপোর্ট করুন:" : "Available Statement Export formats:"}
        </span>
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-white dark:bg-zinc-900 border dark:border-zinc-800 text-xs font-bold rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition shadow-sm"
        >
          🖨️ {labels[lang].print}
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">{labels[lang].loading}</p>
      ) : !reportData ? (
        <p className="text-sm text-red-500">রিপোর্ট ডাটা পাওয়া যায়নি।</p>
      ) : (
        <div className="p-8 bg-white dark:bg-zinc-900 rounded-2xl border-t-4 border-t-emerald-600 dark:border-t-emerald-500 border-x border-b border-black/5 dark:border-zinc-800/60 shadow-xl max-w-3xl mx-auto print:border-0 print:shadow-none print:p-0 transition-all duration-300">
          <div className="text-center mb-6 border-b pb-4 dark:border-zinc-800">
            <h2 className="text-xl font-black text-gray-800 dark:text-white">উত্থান বহুমুখী সমবায় সমিতি লিমিটেড</h2>
            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest block mt-1 font-semibold">
              Balance Sheet Statement (ব্যালেন্স শীট বিবরণী)
            </span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 block mt-1 font-medium">As of: {new Date().toLocaleDateString()}</span>
          </div>

          <div className="space-y-6 text-sm font-sans">
            {/* Assets */}
            <div>
              <h4 className="font-bold border-b pb-1 mb-2 text-gray-800 dark:text-white uppercase tracking-wider">assets (সম্পদসমূহ)</h4>
              <div className="space-y-2">
                {reportData.assets?.map((item: any) => (
                  <div key={item.code} className="flex justify-between border-b pb-1 border-gray-100 dark:border-zinc-800/40 text-gray-700 dark:text-zinc-300">
                    <span>{item.name} ({item.code})</span>
                    <span className="font-mono font-semibold">{item.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} BDT</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-bold text-gray-800 dark:text-white pt-2 text-base">
                <span>Total Assets:</span>
                <span className="font-mono text-emerald-700 dark:text-emerald-450">
                  {reportData.totals?.totalAssets?.toLocaleString(undefined, { minimumFractionDigits: 2 })} BDT
                </span>
              </div>
            </div>

            {/* Liabilities & Equity */}
            <div className="pt-4">
              <h4 className="font-bold border-b pb-1 mb-2 text-gray-800 dark:text-white uppercase tracking-wider">liabilities & equity (দায় ও মূলধন)</h4>
              <div className="space-y-2">
                {reportData.liabilities?.map((item: any) => (
                  <div key={item.code} className="flex justify-between border-b pb-1 border-gray-100 dark:border-zinc-800/40 text-gray-700 dark:text-zinc-300">
                    <span>{item.name} ({item.code})</span>
                    <span className="font-mono font-semibold">{item.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} BDT</span>
                  </div>
                ))}
                {reportData.equity?.map((item: any) => (
                  <div key={item.code} className="flex justify-between border-b pb-1 border-gray-100 dark:border-zinc-800/40 text-gray-700 dark:text-zinc-300">
                    <span>{item.name} ({item.code})</span>
                    <span className="font-mono font-semibold">{item.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} BDT</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-bold text-gray-800 dark:text-white pt-2 text-base">
                <span>Total Liabilities & Equity:</span>
                <span className="font-mono text-emerald-700 dark:text-emerald-450 font-black">
                  {reportData.totals?.totalLiabilitiesAndEquity?.toLocaleString(undefined, { minimumFractionDigits: 2 })} BDT
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
