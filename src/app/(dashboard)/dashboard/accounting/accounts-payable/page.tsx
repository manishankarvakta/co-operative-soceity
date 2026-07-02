"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/providers/LanguageProvider";

export default function AccountsPayablePage() {
  const { lang } = useLanguage();
  const [totalLiabilityBdt, setTotalLiabilityBdt] = useState(0);
  const [memberPayables, setMemberPayables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resLedger, resPayables] = await Promise.all([
        fetch("/api/accounting/ledger?code=2000"), // Member Savings (Liability)
        fetch("/api/accounting/payables")          // Member savings list
      ]);

      const dataLedger = await resLedger.json();
      const dataPayables = await resPayables.json();

      if (resLedger.ok && dataLedger.success) {
        setTotalLiabilityBdt(dataLedger.account.currentBalanceBdt);
      }
      if (resPayables.ok && dataPayables.success) {
        setMemberPayables(dataPayables.payables || []);
      }
    } catch (err) {
      console.error("Error loading payables:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const labels = {
    BN: {
      title: "প্রদেয় হিসাবসমূহ (Accounts Payable)",
      subtitle: "সদস্যদের সঞ্চিত আমানতের মোট পরিমাণ এবং প্রদেয় খতিয়ানের বিবরণী।",
      totalTitle: "মোট প্রদেয় সদস্য সঞ্চয় আমানত (Total Member Savings Liabilities)",
      listTitle: "সদস্য প্রদেয় সঞ্চয়ের তালিকা (Member Savings Liabilities List)",
      colMember: "সদস্য বিবরণী",
      colSavings: "সঞ্চিত সঞ্চয় ব্যালেন্স (Savings BDT)",
      loading: "লোডিং হচ্ছে...",
      empty: "কোনো প্রদেয় আমানতের তথ্য পাওয়া যায়নি।"
    },
    EN: {
      title: "Accounts Payable",
      subtitle: "Review outstanding member savings liabilities and totals.",
      totalTitle: "Total Member Savings Liabilities",
      listTitle: "Member Savings Liabilities Directory",
      colMember: "Member Info",
      colSavings: "Deposited Savings (BDT)",
      loading: "Loading...",
      empty: "No outstanding member savings payables found."
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Stat Card */}
      <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-black/5 dark:border-zinc-800 shadow flex justify-between items-center">
        <div>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">
            {labels[lang].totalTitle}
          </span>
          <h3 className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
            {totalLiabilityBdt.toLocaleString(undefined, { minimumFractionDigits: 2 })} BDT
          </h3>
        </div>
        <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-600">
          ↗️
        </div>
      </div>

      {/* List Card */}
      <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-black/5 dark:border-zinc-800 shadow space-y-4">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white">
          {labels[lang].listTitle}
        </h2>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-zinc-800 text-gray-500 font-bold border-b dark:border-zinc-800">
              <tr>
                <th className="px-4 py-3">{labels[lang].colMember}</th>
                <th className="px-4 py-3 text-right font-bold text-emerald-700 dark:text-emerald-400">{labels[lang].colSavings}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={2} className="text-center py-6 text-gray-400 italic">
                    {labels[lang].loading}
                  </td>
                </tr>
              ) : memberPayables.length === 0 ? (
                <tr>
                  <td colSpan={2} className="text-center py-6 text-gray-400 italic">
                    {labels[lang].empty}
                  </td>
                </tr>
              ) : (
                memberPayables.map((payable) => (
                  <tr key={payable.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/10">
                    <td className="px-4 py-3">
                      <span className="font-bold text-gray-800 dark:text-white block mb-0.5">{payable.name}</span>
                      <span className="text-[10px] text-gray-400 font-mono">{payable.memberCode} | {payable.phone}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {payable.savingsBdt.toLocaleString(undefined, { minimumFractionDigits: 2 })} BDT
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
