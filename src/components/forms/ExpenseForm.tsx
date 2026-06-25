"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/providers/LanguageProvider";

interface ExpenseFormProps {
  onSuccess?: () => void;
}

export default function ExpenseForm({ onSuccess }: ExpenseFormProps) {
  const router = useRouter();
  const { lang } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [category, setCategory] = useState("OFFICE_RENT");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState<"CASH" | "BANK">("CASH");
  const [location, setLocation] = useState("");
  const [remarks, setRemarks] = useState("");
  const [projectId, setProjectId] = useState("");
  const [projects, setProjects] = useState<any[]>([]);

  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [bankAccountId, setBankAccountId] = useState("");

  useEffect(() => {
    // Fetch active projects to associate optionally
    const loadProjects = async () => {
      try {
        const res = await fetch("/api/projects");
        const data = await res.json();
        setProjects(data || []);
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

    loadProjects();
    loadBanks();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const bdtVal = parseFloat(amount);
    if (isNaN(bdtVal) || bdtVal <= 0) {
      setError(lang === "BN" ? "সঠিক খরচের পরিমাণ দিন।" : "Please enter a valid expense amount.");
      setLoading(false);
      return;
    }

    if (paymentMode === "BANK" && !bankAccountId) {
      setError(lang === "BN" ? "দয়া করে ব্যাংক অ্যাকাউন্ট নির্বাচন করুন।" : "Please select a bank account.");
      setLoading(false);
      return;
    }

    const payload = {
      category,
      date,
      amount: Math.round(bdtVal * 100), // Convert to BDT Paisa/Cents
      paymentMode,
      bankAccountId: paymentMode === "BANK" ? bankAccountId : undefined,
      location,
      projectId: projectId || null,
      projectName: remarks || null
    };

    try {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || (lang === "BN" ? "খরচ এন্ট্রি করতে ব্যর্থ হয়েছে।" : "Failed to record expense."));
      } else {
        setSuccessMsg(
          lang === "BN"
            ? "খরচ সফলভাবে এন্ট্রি হয়েছে এবং অনুমোদনের অপেক্ষায় রয়েছে।"
            : "Expense recorded successfully, pending approval."
        );
        setAmount("");
        setLocation("");
        setRemarks("");
        setProjectId("");
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/dashboard/expenses");
          router.refresh();
        }
      }
    } catch (err) {
      setError(lang === "BN" ? "সার্ভারে সমস্যা হয়েছে।" : "Internal Server Error");
    } finally {
      setLoading(false);
    }
  };

  const labels = {
    BN: {
      title: "নতুন খরচ এন্ট্রি ফর্ম",
      category: "খরচের ক্যাটাগরি",
      date: "খরচের তারিখ",
      amount: "খরচের পরিমাণ (BDT)",
      paymentMode: "পেমেন্ট মোড",
      location: "খরচের স্থান / বিবরণ",
      project: "প্রজেক্ট সম্পৃক্ততা (ঐচ্ছিক)",
      remarks: "বিশেষ মন্তব্য / নোট",
      submit: "খরচ এন্ট্রি করুন",
      submitting: "প্রক্রিয়াধীন...",
      cash: "ক্যাশ (ক্যাশ বক্স)",
      bank: "ব্যাংক অ্যাকাউন্ট",
      selectBank: "ব্যাংক অ্যাকাউন্ট সিলেক্ট করুন",
      rent: "অফিস ভাড়া",
      transport: "যাতায়াত খরচ",
      entertainment: "আপ্যায়ন খরচ",
      land: "ভূমি ও সম্পত্তি ক্রয়",
      other: "অন্যান্য খরচ"
    },
    EN: {
      title: "Record New Expense",
      category: "Expense Category",
      date: "Transaction Date",
      amount: "Expense Amount (BDT)",
      paymentMode: "Payment Method",
      location: "Location / Detail Description",
      project: "Project Link (Optional)",
      remarks: "Remarks / Notes",
      submit: "Record Expense",
      submitting: "Processing...",
      cash: "Cash on Hand",
      bank: "Bank Account",
      selectBank: "Select Bank Account",
      rent: "Office Rent",
      transport: "Transport",
      entertainment: "Entertainment",
      land: "Land Purchase",
      other: "Other Expense"
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm ring-1 ring-gray-900/5 dark:ring-white/10">
      <div className="flex justify-between items-center mb-8 border-b pb-5 dark:border-zinc-800">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
          {labels[lang].title}
        </h2>
      </div>

      {error && (
        <div className="p-3 mb-4 text-xs font-semibold text-red-650 bg-red-50 dark:bg-red-950/20 dark:text-red-400 rounded-lg border border-red-200">
          ⚠️ {error}
        </div>
      )}

      {successMsg && (
        <div className="p-3 mb-4 text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 rounded-lg border border-emerald-200">
          ✅ {successMsg}
        </div>
      )}

      <div className="space-y-6 text-sm">
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
            {labels[lang].category}
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2.5 text-sm bg-gray-50/50 dark:bg-zinc-850/50 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-sm dark:text-white"
          >
            <option value="OFFICE_RENT">{labels[lang].rent}</option>
            <option value="TRANSPORT">{labels[lang].transport}</option>
            <option value="ENTERTAINMENT">{labels[lang].entertainment}</option>
            <option value="LAND_PURCHASE">{labels[lang].land}</option>
            <option value="SALARY" disabled className="text-gray-450 dark:text-zinc-500 bg-gray-150/40 dark:bg-zinc-800/20 cursor-not-allowed">
              {lang === "BN" ? "বেতন (৫ বছরের জন্য লকড)" : "Salary (Locked for 5 Years)"}
            </option>
            <option value="OTHER">{labels[lang].other}</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
              {labels[lang].amount} <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-2.5 text-sm bg-gray-50/50 dark:bg-zinc-850/50 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-sm dark:text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
              {labels[lang].date}
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-gray-50/50 dark:bg-zinc-850/50 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-sm dark:text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
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
                <option value="CASH">{labels[lang].cash}</option>
                <option value="BANK">{labels[lang].bank}</option>
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
              {labels[lang].project}
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-gray-50/50 dark:bg-zinc-850/50 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-sm dark:text-white"
            >
              <option value="">-- {lang === "BN" ? "সিলেক্ট করুন" : "Select Project"} --</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
            {labels[lang].location} <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={lang === "BN" ? "যেমন: ঢাকা অফিস, রংপুর প্রজেক্ট এলাকা" : "e.g. Dhaka office"}
            className="w-full px-4 py-2.5 text-sm bg-gray-50/50 dark:bg-zinc-850/50 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-sm dark:text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
            {labels[lang].remarks}
          </label>
          <input
            type="text"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder={lang === "BN" ? "বিশেষ কোনো বিবরণ বা নোট..." : "Add descriptions or notes..."}
            className="w-full px-4 py-2.5 text-sm bg-gray-50/50 dark:bg-zinc-850/50 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-sm dark:text-white"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:hover:shadow-md"
          >
            {loading ? labels[lang].submitting : labels[lang].submit}
          </button>
        </div>
      </div>
    </form>
  );
}
