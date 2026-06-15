"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DepositForm() {
  const router = useRouter();
  const [lang, setLang] = useState<"BN" | "EN">("BN");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Members lists for selection
  const [members, setMembers] = useState<any[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  
  // Form input parameters
  const [paymentMode, setPaymentMode] = useState<"CASH" | "BANK">("CASH");
  const [remarks, setRemarks] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  // Billing types checkboxes and amounts (values in raw BDT)
  const [bills, setBills] = useState({
    WEEKLY_SUBSCRIPTION: { checked: false, amount: "1000", period: "Week 01" },
    ADMISSION_FEE: { checked: false, amount: "5000", period: "Admission" },
    PENALTY: { checked: false, amount: "500", period: "Late Fine" },
    OTHER: { checked: false, amount: "0", period: "Miscellaneous" }
  });

  useEffect(() => {
    // Fetch active members to populate dropdown selectors
    const loadMembers = async () => {
      try {
        const res = await fetch("/api/members?limit=100");
        const data = await res.json();
        setMembers(data.members || []);
      } catch (err) {
        console.error(err);
      }
    };
    loadMembers();
  }, []);

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
    .filter((b) => b.checked)
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
      .filter(([_, b]) => b.checked)
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

    const payload = {
      memberId: selectedMemberId,
      paymentMode,
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
        router.push(`/deposits/${result.depositId}/receipt`);
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
    <form onSubmit={handleSubmit} className="w-full max-w-4xl bg-white dark:bg-zinc-900 p-8 rounded-xl shadow-lg border border-gray-100 dark:border-zinc-800 transition-all">
      <div className="flex justify-between items-center mb-6 border-b pb-4 border-gray-100 dark:border-zinc-800">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
          {labels[lang].title}
        </h2>
        <button
          type="button"
          onClick={() => setLang(lang === "BN" ? "EN" : "BN")}
          className="px-3 py-1 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-full border border-emerald-250 dark:border-emerald-800 hover:bg-emerald-100"
        >
          {lang === "BN" ? "English" : "বাংলা"}
        </button>
      </div>

      {error && (
        <div className="p-3 mb-6 text-sm font-semibold text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-900/50">
          ⚠️ {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div>
          <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
            {labels[lang].member} <span className="text-red-500">*</span>
          </label>
          <select
            required
            value={selectedMemberId}
            onChange={(e) => setSelectedMemberId(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-zinc-850 dark:border-zinc-700 dark:text-white"
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
          <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
            {labels[lang].paymentMode}
          </label>
          <select
            value={paymentMode}
            onChange={(e) => setPaymentMode(e.target.value as any)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-zinc-850 dark:border-zinc-700 dark:text-white"
          >
            <option value="CASH">Cash (ক্যাশ বক্স)</option>
            <option value="BANK">Bank Account (ব্যাংক অ্যাকাউন্ট)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
            {labels[lang].receipt}
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
            className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
          />
        </div>
      </div>

      {/* Bulk checkboxes table list */}
      <div className="border rounded-xl border-gray-200 dark:border-zinc-850 overflow-hidden mb-6">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-zinc-850 font-bold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-zinc-800">
            <tr>
              <th className="px-4 py-3 w-16">সিলেক্ট</th>
              <th className="px-4 py-3">{labels[lang].type}</th>
              <th className="px-4 py-3">{labels[lang].amount}</th>
              <th className="px-4 py-3">{labels[lang].period}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-150 dark:divide-zinc-800">
            {Object.entries(bills).map(([type, b]) => (
              <tr key={type} className="hover:bg-gray-50/50 dark:hover:bg-zinc-850/30">
                <td className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={b.checked}
                    onChange={() => handleCheckboxChange(type as any)}
                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
                  />
                </td>
                <td className="px-4 py-3 font-semibold text-gray-800 dark:text-white">
                  {type === "WEEKLY_SUBSCRIPTION"
                    ? "সাপ্তাহিক চাঁদা (Weekly)"
                    : type === "ADMISSION_FEE"
                    ? "ভর্তি ফি (Admission)"
                    : type === "PENALTY"
                    ? "জরিমানা (Penalty)"
                    : "অন্যান্য (Other)"}
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    disabled={!b.checked}
                    value={b.amount}
                    onChange={(e) => handleAmountChange(type as any, e.target.value)}
                    className="w-32 px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-emerald-500 dark:bg-zinc-850 dark:border-zinc-700 disabled:opacity-50"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    disabled={!b.checked}
                    value={b.period}
                    onChange={(e) => handlePeriodChange(type as any, e.target.value)}
                    placeholder="যেমন: Week 12, June"
                    className="w-48 px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-emerald-500 dark:bg-zinc-850 dark:border-zinc-700 disabled:opacity-50"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center border-t pt-6 border-gray-100 dark:border-zinc-850">
        <div className="flex gap-8 text-sm font-semibold">
          <div className="p-3 bg-gray-50 dark:bg-zinc-850 rounded-lg border flex flex-col min-w-32">
            <span className="text-xs text-gray-500 mb-1">{labels[lang].total}</span>
            <span className="text-lg font-bold text-gray-800 dark:text-white">{totalBdt.toLocaleString()} BDT</span>
          </div>

          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-150 flex flex-col min-w-32">
            <span className="text-xs text-emerald-600 mb-1">{labels[lang].shares}</span>
            <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{calculatedShares} Shares</span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
              {labels[lang].remarks}
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="ব্যাংক ট্রানজেকশন আইডি বা অন্য মন্তব্য..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-zinc-850 dark:border-zinc-700 dark:text-white"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-md transition-all duration-200 disabled:opacity-50"
            >
              {loading ? labels[lang].submitting : labels[lang].submit}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
