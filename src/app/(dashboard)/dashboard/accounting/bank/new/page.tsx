"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Toast, useToast } from "@/components/ui/ConfirmModal";
import { useLanguage } from "@/providers/LanguageProvider";

export default function NewBankAccountPage() {
  const { lang } = useLanguage();
  const router = useRouter();
  const [accName, setAccName] = useState("");
  const [accNumber, setAccNumber] = useState("");
  const [accBalance, setAccBalance] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast, showToast } = useToast();

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const initBal = parseFloat(accBalance) || 0;
    const payload = {
      name: accName,
      accountNumber: accNumber,
      initialBalance: Math.round(initBal * 100)
    };

    try {
      const res = await fetch("/api/bank/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast("error", lang === "BN" ? "ব্যর্থ হয়েছে" : "Failed", data.message || (lang === "BN" ? "অ্যাকাউন্ট তৈরি করতে ব্যর্থ হয়েছে।" : "Account creation failed."));
        setLoading(false);
      } else {
        showToast("success", lang === "BN" ? "অ্যাকাউন্ট তৈরি হয়েছে" : "Account Created", lang === "BN" ? "অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে।" : "Account created successfully.");
        setTimeout(() => {
          router.push("/dashboard/accounting/bank");
        }, 1000);
      }
    } catch (err) {
      showToast("error", lang === "BN" ? "সার্ভার সমস্যা" : "Server Error", lang === "BN" ? "সার্ভারে সমস্যা হয়েছে।" : "Something went wrong.");
      setLoading(false);
    }
  };

  const labels = {
    BN: {
      title: "নতুন ব্যাংক অ্যাকাউন্ট তৈরি করুন",
      subtitle: "প্রতিষ্ঠানের নতুন ব্যাংক হিসাব বা ক্যাশ বাক্স যুক্ত করুন",
      accName: "অ্যাকাউন্টের নাম",
      accNumber: "অ্যাকাউন্ট নম্বর",
      accBalance: "প্রারম্ভিক ব্যালেন্স (BDT)",
      submitAcc: "অ্যাকাউন্ট সংরক্ষণ করুন",
      back: "ফিরে যান"
    },
    EN: {
      title: "Create New Bank Account",
      subtitle: "Add a new institutional bank account or cash box",
      accName: "Account Name",
      accNumber: "Account Number",
      accBalance: "Initial Balance (BDT)",
      submitAcc: "Save Account",
      back: "Go Back"
    }
  };

  return (
    <div className="space-y-6">
      <Toast toast={toast} />
      <div className="flex justify-between items-center border-b pb-4 border-gray-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{labels[lang].title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{labels[lang].subtitle}</p>
        </div>
        <button
          onClick={() => router.push("/dashboard/accounting/bank")}
          className="px-4 py-2 border rounded-lg text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition"
        >
          {labels[lang].back}
        </button>
      </div>

      <form onSubmit={handleCreateAccount} className="bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-xl border border-black/5 dark:border-zinc-800 shadow-md space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{labels[lang].accName}</label>
          <input
            type="text"
            required
            value={accName}
            onChange={(e) => setAccName(e.target.value)}
            placeholder="e.g. Cash on Hand, Sonali Bank"
            className="w-full px-4 py-3 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-zinc-800 dark:text-white transition"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{labels[lang].accNumber}</label>
          <input
            type="text"
            required
            value={accNumber}
            onChange={(e) => setAccNumber(e.target.value)}
            placeholder="e.g. CASH_BOX, 100234892348"
            className="w-full px-4 py-3 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-zinc-800 dark:text-white transition"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{labels[lang].accBalance}</label>
          <input
            type="number"
            step="0.01"
            value={accBalance}
            onChange={(e) => setAccBalance(e.target.value)}
            placeholder="0.00"
            className="w-full px-4 py-3 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-zinc-800 dark:text-white transition"
          />
        </div>
        
        <div className="pt-4 border-t border-gray-100 dark:border-zinc-800">
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-md disabled:opacity-50 transition"
          >
            {loading ? "..." : labels[lang].submitAcc}
          </button>
        </div>
      </form>
    </div>
  );
}
