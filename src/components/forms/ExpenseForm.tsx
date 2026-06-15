"use client";

import { useEffect, useState } from "react";

interface ExpenseFormProps {
  onSuccess?: () => void;
}

export default function ExpenseForm({ onSuccess }: ExpenseFormProps) {
  const [lang, setLang] = useState<"BN" | "EN">("BN");
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
    loadProjects();
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

    const payload = {
      category,
      date,
      amount: Math.round(bdtVal * 100), // Convert to BDT Paisa/Cents
      paymentMode,
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
        if (onSuccess) onSuccess();
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
      rent: "Office Rent",
      transport: "Transport",
      entertainment: "Entertainment",
      land: "Land Purchase",
      other: "Other Expense"
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-150 dark:border-zinc-800 shadow-md">
      <div className="flex justify-between items-center mb-6 border-b pb-3 dark:border-zinc-800">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white">{labels[lang].title}</h2>
        <button
          type="button"
          onClick={() => setLang(lang === "BN" ? "EN" : "BN")}
          className="px-2.5 py-1 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 rounded-md hover:bg-emerald-100"
        >
          {lang === "BN" ? "English" : "বাংলা"}
        </button>
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

      <div className="space-y-4 text-sm">
        <div>
          <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
            {labels[lang].category}
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-850 dark:border-zinc-700 dark:text-white"
          >
            <option value="OFFICE_RENT">{labels[lang].rent}</option>
            <option value="TRANSPORT">{labels[lang].transport}</option>
            <option value="ENTERTAINMENT">{labels[lang].entertainment}</option>
            <option value="LAND_PURCHASE">{labels[lang].land}</option>
            <option value="OTHER">{labels[lang].other}</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
              {labels[lang].amount} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-zinc-850 dark:border-zinc-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
              {labels[lang].date}
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-850 dark:border-zinc-700 dark:text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
              {labels[lang].paymentMode}
            </label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value as any)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-850 dark:border-zinc-700 dark:text-white"
            >
              <option value="CASH">{labels[lang].cash}</option>
              <option value="BANK">{labels[lang].bank}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
              {labels[lang].project}
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-850 dark:border-zinc-700 dark:text-white"
            >
              <option value="">-- {lang === "BN" ? "সিলেক্ট করুন" : "Select Project"} --</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
            {labels[lang].location} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={lang === "BN" ? "যেমন: ঢাকা অফিস, রংপুর প্রজেক্ট এলাকা" : "e.g. Dhaka office"}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-zinc-850 dark:border-zinc-700 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
            {labels[lang].remarks}
          </label>
          <input
            type="text"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder={lang === "BN" ? "বিশেষ কোনো বিবরণ বা নোট..." : "Add descriptions or notes..."}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-zinc-850 dark:border-zinc-700 dark:text-white"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow transition disabled:opacity-50"
        >
          {loading ? labels[lang].submitting : labels[lang].submit}
        </button>
      </div>
    </form>
  );
}
