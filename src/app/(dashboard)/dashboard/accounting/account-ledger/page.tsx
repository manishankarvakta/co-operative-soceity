"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/providers/LanguageProvider";

export default function AccountLedgerPage() {
  const { lang } = useLanguage();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccCode, setSelectedAccCode] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [ledgerData, setLedgerData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const res = await fetch("/api/accounting/accounts");
        const data = await res.json();
        const accs = Array.isArray(data) ? data : (data?.accounts || []);
        setAccounts(accs);
        if (accs.length > 0) {
          setSelectedAccCode(accs[0].code);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadAccounts();
  }, []);

  const loadLedger = async () => {
    if (!selectedAccCode) return;
    setLoading(true);
    setLedgerData(null);
    try {
      const res = await fetch(
        `/api/accounting/ledger?code=${selectedAccCode}&startDate=${startDate}&endDate=${endDate}`
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setLedgerData(data);
      } else {
        alert(data.error || "লেজার ডাটা লোড করতে সমস্যা হয়েছে।");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const labels = {
    BN: {
      title: "হিসাব খতিয়ান বিবরণী (General Ledger)",
      subtitle: "নির্দিষ্ট লেজার হিসাবের লেনদেন খতিয়ান বিবরণী পর্যবেক্ষণ ও প্রিন্ট করুন।",
      account: "লেজার হিসাব",
      startDate: "শুরুর তারিখ",
      endDate: "শেষের তারিখ",
      fetch: "খতিয়ান খুঁজুন",
      print: "প্রিন্ট / PDF",
      startingBalance: "প্রারম্ভিক জের (Starting Balance)",
      endingBalance: "সমাপনী জের (Ending Balance)",
      code: "হিসাব কোড",
      name: "লেজার নাম",
      type: "অ্যাকাউন্টের ধরন",
      loading: "লোডিং হচ্ছে...",
      empty: "কোনো লেনদেনের তথ্য পাওয়া যায়নি।",
      colDate: "তারিখ",
      colDesc: "বিবরণ (Description)",
      colRef: "রেফারেন্স",
      colDebit: "ডেবিট (+)",
      colCredit: "ক্রেডিট (-)",
      colBal: "ব্যালেন্স (Running Balance)"
    },
    EN: {
      title: "General Account Ledger",
      subtitle: "Track chronological debits, credits, and running balance for specific ledgers.",
      account: "Ledger Account",
      startDate: "Start Date",
      endDate: "End Date",
      fetch: "Fetch Ledger",
      print: "Print / PDF",
      startingBalance: "Starting Balance",
      endingBalance: "Ending Balance",
      code: "Account Code",
      name: "Ledger Name",
      type: "Account Type",
      loading: "Loading...",
      empty: "No transactions recorded in this period.",
      colDate: "Date",
      colDesc: "Description",
      colRef: "Reference",
      colDebit: "Debit (+)",
      colCredit: "Credit (-)",
      colBal: "Balance"
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Card */}
      <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-black/5 dark:border-zinc-800 shadow no-print space-y-4">
        <h4 className="font-bold text-sm text-gray-800 dark:text-white uppercase tracking-wider">
          {labels[lang].title}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end font-sans">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">{labels[lang].account}</label>
            <select
              value={selectedAccCode}
              onChange={(e) => setSelectedAccCode(e.target.value)}
              className="w-full text-xs px-3 py-2.5 border rounded-lg dark:bg-zinc-850 dark:border-zinc-700 dark:text-white font-semibold"
            >
              <option value="">-- অ্যাকাউন্ট সিলেক্ট করুন --</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.code}>
                  {acc.code} - {acc.name} ({acc.type})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">{labels[lang].startDate}</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full text-xs px-3 py-2.5 border rounded-lg dark:bg-zinc-850 dark:border-zinc-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">{labels[lang].endDate}</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full text-xs px-3 py-2.5 border rounded-lg dark:bg-zinc-850 dark:border-zinc-700 dark:text-white"
            />
          </div>
          <button
            onClick={loadLedger}
            disabled={loading || !selectedAccCode}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-md transition disabled:opacity-50"
          >
            {loading ? labels[lang].loading : labels[lang].fetch}
          </button>
        </div>
      </div>

      {/* Result Panel */}
      {ledgerData && (
        <div className="space-y-6">
          <div className="p-4 bg-gray-50 dark:bg-zinc-850 border rounded-lg flex justify-between items-center no-print">
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

          <div className="p-8 bg-white dark:bg-zinc-900 border border-black/5 dark:border-zinc-800 rounded-xl shadow-md print:border-0 print:shadow-none print:p-0">
            {/* Header branding for print/reports */}
            <div className="text-center mb-6 border-b pb-4 dark:border-zinc-800">
              <h2 className="text-xl font-black text-gray-800 dark:text-white">উত্থান বহুমুখী সমবায় সমিতি লিমিটেড</h2>
              <span className="text-xs text-gray-500 uppercase tracking-widest block mt-1 font-semibold">
                Account Ledger Statement (খতিয়ান হিসাব বিবরণী)
              </span>
              <span className="text-[10px] text-gray-400 block mt-1">
                {lang === "BN" ? "উত্তোলনের তারিখ" : "Run date"}: {new Date().toLocaleDateString(lang === "BN" ? "bn-BD" : "en-US")}
              </span>
            </div>

            {/* Profile info */}
            <div className="grid grid-cols-2 gap-6 border-b pb-4 mb-4 dark:border-zinc-800 text-xs">
              <div className="space-y-1">
                <span className="block font-bold text-[10px] text-gray-400 uppercase tracking-widest">Account Details</span>
                <div>{labels[lang].code}: <strong className="font-mono text-gray-800 dark:text-white">{ledgerData.account.code}</strong></div>
                <div>{labels[lang].name}: <strong className="text-gray-800 dark:text-white">{ledgerData.account.name}</strong></div>
                <div>{labels[lang].type}: <strong className="uppercase text-gray-600">{ledgerData.account.type}</strong></div>
              </div>
              <div className="space-y-1 text-right">
                <span className="block font-bold text-[10px] text-gray-400 uppercase tracking-widest">Balances Overview</span>
                <div>{labels[lang].startingBalance}: <strong className="font-mono text-gray-850 dark:text-white">{ledgerData.startingBalanceBdt.toLocaleString()} BDT</strong></div>
                <div>{labels[lang].endingBalance}: <strong className="font-mono text-emerald-700 dark:text-emerald-450">{ledgerData.endingBalanceBdt.toLocaleString()} BDT</strong></div>
              </div>
            </div>

            <div className="overflow-x-auto text-xs font-sans">
              <table className="w-full text-left">
                <thead className="bg-gray-55 dark:bg-zinc-850 font-bold text-gray-500 border-b">
                  <tr>
                    <th className="px-4 py-3">{labels[lang].colDate}</th>
                    <th className="px-4 py-3">{labels[lang].colDesc}</th>
                    <th className="px-4 py-3">{labels[lang].colRef}</th>
                    <th className="px-4 py-3 text-right">{labels[lang].colDebit}</th>
                    <th className="px-4 py-3 text-right">{labels[lang].colCredit}</th>
                    <th className="px-4 py-3 text-right">{labels[lang].colBal}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                  {/* Starting Balance Line */}
                  <tr className="bg-gray-50/50 text-gray-500 font-bold italic">
                    <td className="px-4 py-3 font-mono">
                      {startDate ? new Date(startDate).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3" colSpan={2}>
                      {lang === "BN" ? "প্রারম্ভিক জের (Starting Balance)" : "Starting Balance"}
                    </td>
                    <td className="px-4 py-3 text-right">—</td>
                    <td className="px-4 py-3 text-right">—</td>
                    <td className="px-4 py-3 text-right font-mono font-bold">
                      {ledgerData.startingBalanceBdt.toLocaleString()} BDT
                    </td>
                  </tr>

                  {ledgerData.lines.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-gray-400 italic">
                        {labels[lang].empty}
                      </td>
                    </tr>
                  ) : (
                    ledgerData.lines.map((line: any) => (
                      <tr key={line.id} className="hover:bg-gray-50/30 dark:hover:bg-zinc-850/20">
                        <td className="px-4 py-3 font-mono text-gray-500">
                          {new Date(line.date).toLocaleDateString(lang === "BN" ? "bn-BD" : "en-US")}
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-800 dark:text-white">
                          {line.description}
                        </td>
                        <td className="px-4 py-3 font-mono text-gray-400 text-[10px]">
                          {line.reference || "N/A"}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-gray-700 dark:text-gray-300">
                          {line.debit > 0 ? line.debit.toLocaleString() : "—"}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-gray-700 dark:text-gray-300">
                          {line.credit > 0 ? line.credit.toLocaleString() : "—"}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-gray-850 dark:text-zinc-200">
                          {line.runningBalance.toLocaleString()} BDT
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
