"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/providers/LanguageProvider";

export default function AccountsReceivablePage() {
  const { lang } = useLanguage();
  const [totalReceivableBdt, setTotalReceivableBdt] = useState(0);
  const [activeLoans, setActiveLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resLedger, resLoans] = await Promise.all([
        fetch("/api/accounting/ledger?code=1040"), // Loan Receivable (Asset)
        fetch("/api/loans?status=ACTIVE")          // Active loans
      ]);

      const dataLedger = await resLedger.json();
      const dataLoans = await resLoans.json();

      if (resLedger.ok && dataLedger.success) {
        setTotalReceivableBdt(dataLedger.account.currentBalanceBdt);
      }
      if (resLoans.ok && dataLoans.success) {
        setActiveLoans(dataLoans.loans || []);
      }
    } catch (err) {
      console.error("Error loading receivables:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const calculateOutstanding = (loan: any) => {
    let expected = loan.schedules.reduce((sum: number, s: any) => sum + s.totalAmount, 0);
    let paid = loan.schedules.reduce((sum: number, s: any) => sum + s.paidAmount, 0);
    return (expected - paid) / 100;
  };

  const calculateTotalPaid = (loan: any) => {
    return loan.schedules.reduce((sum: number, s: any) => sum + s.paidAmount, 0) / 100;
  };

  const labels = {
    BN: {
      title: "প্রাপ্য হিসাবসমূহ (Accounts Receivable)",
      subtitle: "সদস্যদের বিতরণকৃত ঋণের বকেয়া ব্যালেন্স এবং প্রাপ্য খতিয়ানের বিবরণী।",
      totalTitle: "মোট বকেয়া প্রাপ্য ঋণ (Total Outstanding Receivables)",
      listTitle: "সক্রিয় ঋণ প্রাপ্যতার তালিকা (Active Members Outstanding)",
      colMember: "সদস্য বিবরণী",
      colDisbursed: "বিতরণকৃত ঋণ",
      colPaid: "পরিশোধিত লভ্যাংশ",
      colOutstanding: "বকেয়া ঋণ (Outstanding BDT)",
      colRate: "সুদের হার",
      colDate: "বিতরণের তারিখ",
      loading: "লোডিং হচ্ছে...",
      empty: "কোনো ঋণ প্রাপ্যতার তথ্য পাওয়া যায়নি।"
    },
    EN: {
      title: "Accounts Receivable",
      subtitle: "Review outstanding loan receivables and member balance sheets.",
      totalTitle: "Total Outstanding Loan Receivables",
      listTitle: "Active Member Receivables Listing",
      colMember: "Member Info",
      colDisbursed: "Disbursed Principal",
      colPaid: "Amount Repaid",
      colOutstanding: "Outstanding Balance (BDT)",
      colRate: "Interest Rate",
      colDate: "Disbursement Date",
      loading: "Loading...",
      empty: "No outstanding member receivables found."
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
            {totalReceivableBdt.toLocaleString(undefined, { minimumFractionDigits: 2 })} BDT
          </h3>
        </div>
        <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-600">
          ↙️
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
                <th className="px-4 py-3">{labels[lang].colDate}</th>
                <th className="px-4 py-3 text-right">{labels[lang].colDisbursed}</th>
                <th className="px-4 py-3 text-right">{labels[lang].colPaid}</th>
                <th className="px-4 py-3 text-right font-bold text-emerald-700 dark:text-emerald-400">{labels[lang].colOutstanding}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-gray-400 italic">
                    {labels[lang].loading}
                  </td>
                </tr>
              ) : activeLoans.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-gray-400 italic">
                    {labels[lang].empty}
                  </td>
                </tr>
              ) : (
                activeLoans.map((loan) => {
                  const outstanding = calculateOutstanding(loan);
                  const paid = calculateTotalPaid(loan);
                  return (
                    <tr key={loan.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/10">
                      <td className="px-4 py-3">
                        <span className="font-bold text-gray-800 dark:text-white block mb-0.5">{loan.member.name}</span>
                        <span className="text-[10px] text-gray-400 font-mono">{loan.member.memberCode} | {loan.member.phone}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-gray-500">
                        {loan.disbursedAt ? new Date(loan.disbursedAt).toLocaleDateString() : "Pending"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold">
                        {(loan.amount / 100).toLocaleString()} BDT
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-gray-500">
                        {paid.toLocaleString()} BDT
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-705 dark:text-emerald-400">
                        {outstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })} BDT
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
