"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/providers/LanguageProvider";

export default function DepositForm() {
  const router = useRouter();
  const { lang } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Members lists for selection
  const [members, setMembers] = useState<any[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  
  // Bank accounts
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [bankAccountId, setBankAccountId] = useState("");
  
  // Form input parameters
  const [paymentMode, setPaymentMode] = useState<"CASH" | "BANK">("CASH");
  const [remarks, setRemarks] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  // Billing types checkboxes and amounts (values in raw BDT)
  const [bills, setBills] = useState({
    WEEKLY_SUBSCRIPTION: { checked: false, amount: "1000", period: "Week 01", visible: true },
    ADMISSION_FEE: { checked: false, amount: "5000", period: "Admission", visible: true },
    PENALTY: { checked: false, amount: "500", period: "Late Fine", visible: true },
    OTHER: { checked: false, amount: "0", period: "Miscellaneous", visible: true },
    LOAN_REPAYMENT: { checked: false, amount: "0", period: "Installment", visible: false }
  });

  useEffect(() => {
    // Fetch active members to populate dropdown selectors
    const loadMembers = async () => {
      try {
        const res = await fetch("/api/members?limit=200");
        const data = await res.json();
        setMembers(data.members || []);
      } catch (err) {
        console.error(err);
      }
    };

    // Fetch bank accounts
    const loadBanks = async () => {
      try {
        const res = await fetch("/api/bank/accounts");
        const data = await res.json();
        if (Array.isArray(data)) {
          setBankAccounts(data.filter((acc) => acc.accountNumber !== "CASH-001" && acc.name !== "Cash on Hand"));
        }
      } catch (err) {
        console.error(err);
      }
    };

    loadMembers();
    loadBanks();
  }, []);

  // Fetch active loan and late penalties when member selection changes
  useEffect(() => {
    if (!selectedMemberId) {
      setBills((prev) => ({
        ...prev,
        LOAN_REPAYMENT: { checked: false, amount: "0", period: "Installment", visible: false }
      }));
      return;
    }

    const loadActiveLoan = async () => {
      try {
        const res = await fetch(`/api/loans/active?memberId=${selectedMemberId}`);
        const data = await res.json();
        if (data.success && data.hasActiveLoan) {
          setBills((prev) => {
            const nextState = {
              ...prev,
              LOAN_REPAYMENT: {
                checked: true, // auto-check active installment
                amount: String(data.nextSchedule?.remainingAmountBdt || 0),
                period: data.nextSchedule ? `Installment ${data.nextSchedule.emiNumber}` : "Installment",
                visible: true
              }
            };
            
            // If there's an overdue penalty fee calculated, auto-check and pre-populate Penalty
            if (data.penaltyAmountBdt > 0) {
              nextState.PENALTY = {
                checked: true,
                amount: String(data.penaltyAmountBdt),
                period: `Late Fine (${data.overdueCount} schedule(s))`,
                visible: true
              };
            }
            return nextState;
          });
        } else {
          setBills((prev) => ({
            ...prev,
            LOAN_REPAYMENT: { checked: false, amount: "0", period: "Installment", visible: false }
          }));
        }
      } catch (err) {
        console.error("Error loading active loan details:", err);
      }
    };

    loadActiveLoan();
  }, [selectedMemberId]);

  const handleCheckboxChange = (type: keyof typeof bills) => {
    setBills((prev) => ({
      ...prev,
      [type]: { ...prev[type], checked: !prev[type].checked }
    }));
  };

  const handleAmountChange = (type: keyof typeof bills, value: string) => {
    setBills((prev) => ({
      ...prev,
      [type]: { ...prev[type], amount: value }
    }));
  };

  const handlePeriodChange = (type: keyof typeof bills, value: string) => {
    setBills((prev) => ({
      ...prev,
      [type]: { ...prev[type], period: value }
    }));
  };

  // Calculate dynamic totals
  const totalBdt = Object.values(bills)
    .filter((b) => b.checked && b.visible)
    .reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0);

  // Auto share calculation (1 Share = 1,000 BDT subscription)
  const calculatedShares = bills.WEEKLY_SUBSCRIPTION.checked
    ? (parseFloat(bills.WEEKLY_SUBSCRIPTION.amount) || 0) / 1000
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!selectedMemberId) {
      setError(lang === "BN" ? "অনুগ্রহ করে সদস্য সিলেক্ট করুন।" : "Please select a member.");
      setLoading(false);
      return;
    }

    const activeItems = Object.entries(bills)
      .filter(([_, b]) => b.checked && b.visible)
      .map(([type, b]) => ({
        type,
        amount: Math.round((parseFloat(b.amount) || 0) * 100), // Convert to Paisa/Cents
        periodDetails: b.period
      }));

    if (activeItems.length === 0) {
      setError(lang === "BN" ? "কমপক্ষে একটি খাত সিলেক্ট করুন।" : "Please check at least one billing type.");
      setLoading(false);
      return;
    }

    if (paymentMode === "BANK" && !bankAccountId) {
      setError(lang === "BN" ? "দয়া করে ব্যাংক অ্যাকাউন্ট নির্বাচন করুন।" : "Please select a bank account.");
      setLoading(false);
      return;
    }

    const payload = {
      memberId: selectedMemberId,
      paymentMode,
      bankAccountId: paymentMode === "BANK" ? bankAccountId : undefined,
      remarks,
      items: activeItems
    };

    try {
      const response = await fetch("/api/deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || (lang === "BN" ? "জমা করতে ব্যর্থ হয়েছে।" : "Transaction failed."));
      } else {
        // Redirect directly to printable money receipt
        router.push(`/dashboard/deposits/${result.depositId}/receipt`);
        router.refresh();
      }
    } catch (err) {
      setError(lang === "BN" ? "সার্ভারে সমস্যা হয়েছে।" : "Internal Server Error");
    } finally {
      setLoading(false);
    }
  };

  const labels = {
    BN: {
      title: "ওয়ান-টাইম মাল্টিপল বিল রেকর্ড Form",
      member: "সদস্য সিলেক্ট করুন",
      paymentMode: "জমার খাত (Payment Mode)",
      selectBank: "ব্যাংক অ্যাকাউন্ট সিলেক্ট করুন",
      remarks: "বিশেষ মন্তব্য বা নোট",
      type: "খাত",
      amount: "টাকার অংক (BDT)",
      period: "মাস / সপ্তাহ",
      receipt: "রসিদ আপলোড করুন (Slip Attachment)",
      total: "সর্বমোট জমা",
      shares: "অর্জিত শেয়ার",
      submit: "জমা এন্ট্রি করুন এবং রসিদ প্রিন্ট করুন",
      submitting: "প্রক্রিয়াধীন..."
    },
    EN: {
      title: "One-Time Bulk Deposit Entry",
      member: "Select Member Profile",
      paymentMode: "Payment Method",
      selectBank: "Select Bank Account",
      remarks: "Remarks / Notes",
      type: "Bill Type",
      amount: "Amount (BDT)",
      period: "Period (Month/Week)",
      receipt: "Upload Payment Slip",
      total: "Total Collected",
      shares: "Earned Shares",
      submit: "Record Deposit & Generate Receipt",
      submitting: "Processing..."
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm ring-1 ring-gray-900/5 dark:ring-white/10 transition-all">
      <div className="flex justify-between items-center mb-8 border-b pb-5 border-gray-100 dark:border-zinc-800">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
          {labels[lang].title}
        </h2>
      </div>

      {error && (
        <div className="p-3 mb-6 text-sm font-semibold text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-900/50">
          ⚠️ {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
            {labels[lang].member} <span className="text-rose-500">*</span>
          </label>
          <select
            required
            value={selectedMemberId}
            onChange={(e) => setSelectedMemberId(e.target.value)}
            className="w-full px-4 py-2.5 text-sm bg-gray-50/50 dark:bg-zinc-850/50 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-sm dark:text-white"
          >
            <option value="">-- মেম্বার সিলেক্ট করুন --</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.memberCode})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
            {labels[lang].paymentMode}
          </label>
          <div className="flex gap-2">
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value as any)}
              className="w-full px-4 py-2.5 text-sm bg-gray-50/50 dark:bg-zinc-850/50 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-sm dark:text-white"
            >
              <option value="CASH">Cash (ক্যাশ বক্স)</option>
              <option value="BANK">Bank Account (ব্যাংক)</option>
            </select>

            {paymentMode === "BANK" && (
              <select
                required
                value={bankAccountId}
                onChange={(e) => setBankAccountId(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-gray-50/50 dark:bg-zinc-850/50 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-sm dark:text-white"
              >
                <option value="">-- {labels[lang].selectBank} --</option>
                {bankAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.accountNumber})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
            {labels[lang].receipt}
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
            className="w-full text-xs text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition-colors shadow-sm"
          />
        </div>
      </div>

      {/* Bulk checkboxes table list */}
      <div className="rounded-xl overflow-hidden mb-8 ring-1 ring-gray-200 dark:ring-zinc-800 shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-zinc-850/50 font-bold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-zinc-800">
            <tr>
              <th className="px-5 py-4 w-16 text-center">সিলেক্ট</th>
              <th className="px-5 py-4">{labels[lang].type}</th>
              <th className="px-5 py-4">{labels[lang].amount}</th>
              <th className="px-5 py-4">{labels[lang].period}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
            {Object.entries(bills).filter(([_, b]) => b.visible).map(([type, b]) => (
              <tr key={type} className="hover:bg-gray-50/50 dark:hover:bg-zinc-850/30 transition-colors">
                <td className="px-5 py-4 text-center">
                  <input
                    type="checkbox"
                    checked={b.checked}
                    onChange={() => handleCheckboxChange(type as any)}
                    className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 dark:focus:ring-emerald-600 dark:ring-offset-zinc-800 focus:ring-2 dark:bg-zinc-700 dark:border-zinc-600 cursor-pointer"
                  />
                </td>
                <td className="px-5 py-4 font-bold text-gray-800 dark:text-gray-200">
                  {type === "WEEKLY_SUBSCRIPTION"
                    ? "সাপ্তাহিক চাঁদা (Weekly)"
                    : type === "ADMISSION_FEE"
                    ? "ভর্তি ফি (Admission)"
                    : type === "PENALTY"
                    ? "জরিমানা (Penalty)"
                    : type === "LOAN_REPAYMENT"
                    ? "লোন কিস্তি (Loan Repayment)"
                    : "অন্যান্য (Other)"}
                </td>
                <td className="px-5 py-4">
                  <input
                    type="number"
                    disabled={!b.checked}
                    value={b.amount}
                    onChange={(e) => handleAmountChange(type as any, e.target.value)}
                    className="w-32 px-3 py-2 text-sm bg-gray-50/50 dark:bg-zinc-850/50 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all disabled:opacity-40 font-mono"
                  />
                </td>
                <td className="px-5 py-4">
                  <input
                    type="text"
                    disabled={!b.checked}
                    value={b.period}
                    onChange={(e) => handlePeriodChange(type as any, e.target.value)}
                    placeholder="যেমন: Week 12, June"
                    className="w-full max-w-xs px-3 py-2 text-sm bg-gray-50/50 dark:bg-zinc-850/50 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all disabled:opacity-40"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start border-t pt-8 border-gray-100 dark:border-zinc-800">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="p-5 bg-gray-50 dark:bg-zinc-850/50 rounded-xl ring-1 ring-gray-900/5 dark:ring-white/5 flex flex-col flex-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 mb-1">{labels[lang].total}</span>
            <span className="text-2xl font-black text-gray-800 dark:text-white font-mono">{totalBdt.toLocaleString()} BDT</span>
          </div>

          <div className="p-5 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl ring-1 ring-emerald-200 dark:ring-emerald-900/30 flex flex-col flex-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 mb-1">{labels[lang].shares}</span>
            <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono">{calculatedShares} <span className="text-sm font-bold">Shares</span></span>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
              {labels[lang].remarks}
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="ব্যাংক ট্রানজেকশন আইডি বা অন্য মন্তব্য..."
              className="w-full px-4 py-2.5 text-sm bg-gray-50/50 dark:bg-zinc-850/50 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-sm dark:text-white"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:hover:shadow-md"
            >
              {loading ? labels[lang].submitting : labels[lang].submit}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
