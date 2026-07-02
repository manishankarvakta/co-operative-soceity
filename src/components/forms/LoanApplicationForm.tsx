"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/providers/LanguageProvider";
import { AlertTriangle } from "lucide-react";

interface LoanRule {
  id: string;
  durationValue: number;
  durationType: "WEEKLY" | "MONTHLY";
  interestRate: number;
}

const DEFAULT_RULES: LoanRule[] = [
  { id: "1", durationValue: 10, durationType: "WEEKLY", interestRate: 10 },
  { id: "2", durationValue: 20, durationType: "WEEKLY", interestRate: 12 },
  { id: "3", durationValue: 3, durationType: "MONTHLY", interestRate: 8 },
  { id: "4", durationValue: 6, durationType: "MONTHLY", interestRate: 10 },
  { id: "5", durationValue: 12, durationType: "MONTHLY", interestRate: 12 }
];

interface LoanApplicationFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function LoanApplicationForm({ onSuccess, onCancel }: LoanApplicationFormProps) {
  const { lang } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lists
  const [members, setMembers] = useState<any[]>([]);
  const [loanRules, setLoanRules] = useState<LoanRule[]>(DEFAULT_RULES);
  
  // Form State
  const [memberId, setMemberId] = useState("");
  const [amount, setAmount] = useState("");
  const [interestRate, setInterestRate] = useState("10");
  const [durationValue, setDurationValue] = useState("10");
  const [durationType, setDurationType] = useState<"MONTHLY" | "WEEKLY">("MONTHLY");
  const [guarantor1Id, setGuarantor1Id] = useState("");
  const [guarantor2Id, setGuarantor2Id] = useState("");
  const [bypassLimit, setBypassLimit] = useState(true);
  const [remarks, setRemarks] = useState("");
  const [selectedRuleId, setSelectedRuleId] = useState("");

  // Member Status / Savings Check
  const [checkingSavings, setCheckingSavings] = useState(false);
  const [hasActiveLoan, setHasActiveLoan] = useState(false);
  const [totalSavingsBdt, setTotalSavingsBdt] = useState(0);

  const handleRuleChange = (ruleId: string) => {
    setSelectedRuleId(ruleId);
    const rule = loanRules.find((r) => r.id === ruleId);
    if (rule) {
      setDurationValue(rule.durationValue.toString());
      setDurationType(rule.durationType);
      setInterestRate(rule.interestRate.toString());
    }
  };

  useEffect(() => {
    // Fetch members to populate dropdown selectors
    const loadMembers = async () => {
      try {
        const res = await fetch("/api/members?limit=200");
        const data = await res.json();
        setMembers(data.members || []);
      } catch (err) {
        console.error("Error loading members:", err);
      }
    };
    loadMembers();

    const loadLoanRules = async () => {
      try {
        const res = await fetch("/api/loans/rules");
        const data = await res.json();
        if (data.success && Array.isArray(data.rules) && data.rules.length > 0) {
          setLoanRules(data.rules);
          const first = data.rules[0];
          setSelectedRuleId(first.id);
          setDurationValue(first.durationValue.toString());
          setDurationType(first.durationType);
          setInterestRate(first.interestRate.toString());
        } else {
          setLoanRules(DEFAULT_RULES);
          const firstDefault = DEFAULT_RULES[0];
          setSelectedRuleId(firstDefault.id);
          setDurationValue(firstDefault.durationValue.toString());
          setDurationType(firstDefault.durationType);
          setInterestRate(firstDefault.interestRate.toString());
        }
      } catch (err) {
        console.error("Error loading loan rules:", err);
        setLoanRules(DEFAULT_RULES);
        const firstDefault = DEFAULT_RULES[0];
        setSelectedRuleId(firstDefault.id);
        setDurationValue(firstDefault.durationValue.toString());
        setDurationType(firstDefault.durationType);
        setInterestRate(firstDefault.interestRate.toString());
      }
    };
    loadLoanRules();

    window.addEventListener("somoby_settings_changed", loadLoanRules);
    return () => {
      window.removeEventListener("somoby_settings_changed", loadLoanRules);
    };
  }, []);

  // When selected member changes, check active loan and total savings
  useEffect(() => {
    if (!memberId) {
      setHasActiveLoan(false);
      setTotalSavingsBdt(0);
      return;
    }

    const checkActiveLoanAndSavings = async () => {
      setCheckingSavings(true);
      try {
        const res = await fetch(`/api/loans/active?memberId=${memberId}`);
        const data = await res.json();
        if (data.success) {
          setHasActiveLoan(data.hasActiveLoan);
          setTotalSavingsBdt(data.totalSavingsBdt || 0);
        }
      } catch (err) {
        console.error("Error checking active loan:", err);
      } finally {
        setCheckingSavings(false);
      }
    };

    checkActiveLoanAndSavings();
  }, [memberId]);

  // Calculations
  const principal = parseFloat(amount) || 0;
  const rate = parseFloat(interestRate) || 0;
  const duration = parseInt(durationValue) || 1;

  const totalInterest = Math.round(principal * (rate / 100));
  const totalPayable = principal + totalInterest;
  const emiAmount = Math.round(totalPayable / duration);

  const maxEligible = totalSavingsBdt * 0.8;
  const exceedsLimit = principal > maxEligible;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!memberId) {
      setError(lang === "BN" ? "দয়া করে সদস্য নির্বাচন করুন।" : "Please select a member.");
      setLoading(false);
      return;
    }

    if (hasActiveLoan) {
      setError(lang === "BN" ? "এই সদস্যের ইতিমধ্যে একটি সক্রিয় ঋণ রয়েছে।" : "This member already has an active loan.");
      setLoading(false);
      return;
    }

    if (!guarantor1Id) {
      setError(lang === "BN" ? "প্রথম জামিনদার নির্বাচন করা আবশ্যক।" : "Guarantor 1 is required.");
      setLoading(false);
      return;
    }

    if (guarantor1Id === memberId || guarantor2Id === memberId) {
      setError(lang === "BN" ? "সদস্য নিজে নিজের জামিনদার হতে পারবেন না।" : "Member cannot be their own guarantor.");
      setLoading(false);
      return;
    }

    if (guarantor2Id && guarantor1Id === guarantor2Id) {
      setError(lang === "BN" ? "দুইজন ভিন্ন জামিনদার নির্বাচন করুন।" : "Please select two different guarantors.");
      setLoading(false);
      return;
    }

    if (exceedsLimit && !bypassLimit) {
      setError(lang === "BN" ? "ঋণের পরিমাণ সর্বোচ্চ সীমার বেশি (৮০% সঞ্চয়)। অগ্রসর হতে 'Bypass Limit' চেক করুন।" : "Loan exceeds the maximum eligibility limit. Check 'Bypass Limit' to proceed.");
      setLoading(false);
      return;
    }

    const payload = {
      memberId,
      amount: Math.round(principal * 100), // convert BDT to Paisa
      interestRate: rate,
      durationValue: duration,
      durationType,
      guarantor1Id,
      guarantor2Id: guarantor2Id || null,
      bypassLimit,
      remarks: remarks || null
    };

    try {
      const res = await fetch("/api/loans/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        setError(data.message || (lang === "BN" ? "আবেদন করতে ব্যর্থ হয়েছে।" : "Application failed."));
      } else {
        onSuccess();
      }
    } catch (err) {
      setError(lang === "BN" ? "সার্ভারে সমস্যা হয়েছে।" : "Internal server error.");
    } finally {
      setLoading(false);
    }
  };

  const labels = {
    BN: {
      title: "নতুন লোন আবেদন ফর্ম",
      member: "সদস্য নির্বাচন করুন",
      checking: "যাচাই করা হচ্ছে...",
      activeLoanError: "এই সদস্যের ইতিমধ্যে একটি রানিং লোন রয়েছে! লোন পরিশোধ হওয়ার আগে নতুন আবেদন করা যাবে না।",
      savingsInfo: "মোট সঞ্চয়:",
      limitInfo: "সর্বোচ্চ ঋণ সীমা (৮০%):",
      amount: "লোনের পরিমাণ (Principal BDT)",
      interestRate: "লাভের হার / সার্ভিস চার্জ (% Flat)",
      duration: "মেয়াদ",
      durationType: "কিস্তির ধরণ",
      monthly: "মাসিক",
      weekly: "সাপ্তাহিক",
      guarantor1: "১ম জামিনদার (সমিতির অন্য সদস্য)",
      guarantor2: "২য় জামিনদার (ঐচ্ছিক)",
      bypass: "বিশেষ অনুমতি (Bypass Limit)",
      remarks: "বিশেষ মন্তব্য / বিবরণ",
      previewTitle: "কিস্তি বিবরণী (EMI Preview)",
      totalInterest: "মোট লাভ",
      totalPayable: "সর্বমোট পরিশোধ",
      emi: "প্রতি কিস্তি",
      cancel: "বাতিল করুন",
      submit: "আবেদন জমা দিন",
      submitting: "প্রক্রিয়াধীন..."
    },
    EN: {
      title: "Apply for a New Loan",
      member: "Select Member Profile",
      checking: "Checking details...",
      activeLoanError: "This member already has an active loan! Cannot apply for another until closed.",
      savingsInfo: "Total Savings:",
      limitInfo: "Max Eligible Limit (80%):",
      amount: "Loan Principal Amount (BDT)",
      interestRate: "Service Charge / Interest Rate (% Flat)",
      duration: "Duration Value",
      durationType: "Installment Frequency",
      monthly: "Monthly",
      weekly: "Weekly",
      guarantor1: "1st Guarantor Member",
      guarantor2: "2nd Guarantor Member (Optional)",
      bypass: "Special Permission (Bypass Limit Check)",
      remarks: "Remarks / Notes",
      previewTitle: "Installment Details (EMI Preview)",
      totalInterest: "Total Interest",
      totalPayable: "Total Payable",
      emi: "Installment Amount",
      cancel: "Cancel",
      submit: "Submit Application",
      submitting: "Processing..."
    }
  };

  const L = labels[lang];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="border-b border-gray-100 dark:border-zinc-800 pb-3">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white">{L.title}</h3>
      </div>

      {error && (
        <div className="p-3.5 text-sm font-semibold text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-900/50">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Member Selector */}
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
            {L.member} <span className="text-rose-500">*</span>
          </label>
          <select
            required
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            className="w-full px-4 py-2.5 text-sm bg-gray-50/50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all dark:text-white"
          >
            <option value="">-- {lang === "BN" ? "সদস্য খুঁজুন" : "Search Member"} --</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.memberCode})
              </option>
            ))}
          </select>

          {checkingSavings && (
            <p className="text-xs text-gray-400 mt-1">{L.checking}</p>
          )}

          {memberId && !checkingSavings && hasActiveLoan && (
            <div className="mt-2.5 p-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-800 text-xs text-gray-600 dark:text-gray-400">
              <p className="text-rose-500 font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{L.activeLoanError}</span>
              </p>
            </div>
          )}
        </div>

        {/* Guarantor 1 */}
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
            {L.guarantor1} <span className="text-rose-500">*</span>
          </label>
          <select
            required
            value={guarantor1Id}
            onChange={(e) => setGuarantor1Id(e.target.value)}
            className="w-full px-4 py-2.5 text-sm bg-gray-50/50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all dark:text-white"
          >
            <option value="">-- {lang === "BN" ? "১ম জামিনদার খুঁজুন" : "Select Guarantor 1"} --</option>
            {members
              .filter((m) => m.id !== memberId)
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.memberCode})
                </option>
              ))}
          </select>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
            {L.amount} <span className="text-rose-500">*</span>
          </label>
          <input
            type="number"
            required
            disabled={hasActiveLoan || !memberId}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-2.5 text-sm bg-gray-50/50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all dark:text-white font-mono"
            placeholder="e.g. 10000"
          />

        </div>

        {/* Guarantor 2 */}
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
            {L.guarantor2}
          </label>
          <select
            value={guarantor2Id}
            onChange={(e) => setGuarantor2Id(e.target.value)}
            className="w-full px-4 py-2.5 text-sm bg-gray-50/50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all dark:text-white"
          >
            <option value="">-- {lang === "BN" ? "২য় জামিনদার খুঁজুন (ঐচ্ছিক)" : "Select Guarantor 2 (Optional)"} --</option>
            {members
              .filter((m) => m.id !== memberId && m.id !== guarantor1Id)
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.memberCode})
                </option>
              ))}
          </select>
        </div>

        {/* Duration & Policy Selection */}
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
            {lang === "BN" ? "ঋণের মেয়াদ (Duration & Rate)" : "Loan Duration & Rate"} <span className="text-rose-500">*</span>
          </label>
          <select
            value={selectedRuleId}
            onChange={(e) => handleRuleChange(e.target.value)}
            className="w-full px-4 py-2.5 text-sm bg-gray-50/50 dark:bg-zinc-800/50 border border-gray-205 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all dark:text-white"
          >
            {loanRules.map((rule) => {
              const typeStr = rule.durationType === "WEEKLY" ? (lang === "BN" ? "সপ্তাহ" : "Weeks") : (lang === "BN" ? "মাস" : "Months");
              return (
                <option key={rule.id} value={rule.id}>
                  {rule.durationValue} {typeStr} ({rule.interestRate}% Flat)
                </option>
              );
            })}
          </select>
        </div>

        {/* Interest Rate (Auto-filled & Read-only) */}
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
            {L.interestRate}
          </label>
          <input
            type="text"
            readOnly
            disabled
            value={`${interestRate}% Flat`}
            className="w-full px-4 py-2.5 text-sm bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl dark:text-zinc-400 font-mono font-semibold cursor-not-allowed"
          />
        </div>



        {/* Remarks */}
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
            {L.remarks}
          </label>
          <input
            type="text"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="w-full px-4 py-2.5 text-sm bg-gray-50/50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all dark:text-white"
            placeholder="বিশেষ জামানত বা অনুমোদনের বিবরণ..."
          />
        </div>
      </div>

      {/* Real-time preview */}
      {principal > 0 && (
        <div className="p-5 rounded-2xl bg-emerald-50/30 dark:bg-emerald-950/10 border border-emerald-100/50 dark:border-emerald-900/20">
          <h4 className="text-xs font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-wide mb-3">{L.previewTitle}</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">{L.totalInterest}</span>
              <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-400 font-mono">{totalInterest.toLocaleString()} BDT</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">{L.totalPayable}</span>
              <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-400 font-mono">{totalPayable.toLocaleString()} BDT</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">{L.emi} ({durationType === "WEEKLY" ? "সাপ্তাহিক" : "মাসিক"})</span>
              <span className="text-base font-black text-emerald-700 dark:text-emerald-400 font-mono">{emiAmount.toLocaleString()} BDT</span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 border-t border-gray-100 dark:border-zinc-800 pt-5">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 text-sm font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl transition"
        >
          {L.cancel}
        </button>
        <button
          type="submit"
          disabled={loading || hasActiveLoan || !memberId}
          className="px-6 py-2.5 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition disabled:opacity-50"
        >
          {loading ? L.submitting : L.submit}
        </button>
      </div>
    </form>
  );
}
