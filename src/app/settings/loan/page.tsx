"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/providers/LanguageProvider";

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

const translations = {
  BN: {
    title: "ঋণ পলিসি সেটিংস (Loan Rules)",
    subtitle: "নতুন ঋণ আবেদনের জন্য কিস্তির মেয়াদ এবং মেয়াদের ভিত্তিতে সুদের হার নির্ধারণ করুন",
    cardTitle: "ঋণের মেয়াদ ও সার্ভিস চার্জ পলিসি",
    cardDesc: "এখানে তৈরি করা নিয়ম অনুযায়ী ঋণ আবেদন ফরমে মেয়াদ ও লভ্যাংশ স্বয়ংক্রিয়ভাবে কার্যকর হবে।",
    addRule: "নতুন পলিসি যুক্ত করুন",
    durationValue: "মেয়াদ (সংখ্যা)",
    durationType: "মেয়াদের ধরন",
    interestRate: "লাভের হার / সার্ভিস চার্জ (% Flat)",
    weekly: "সাপ্তাহিক (Weekly)",
    monthly: "মাসিক (Monthly)",
    actions: "অ্যাকশন",
    delete: "মুছুন",
    saveBtn: "সেটিংস সংরক্ষণ করুন",
    successMsg: "ঋণ পলিসি সেটিংস সফলভাবে আপডেট করা হয়েছে!",
    saving: "সংরক্ষণ হচ্ছে...",
    emptyList: "কোনো ঋণ পলিসি তৈরি করা নেই। নতুন পলিসি যোগ করুন।",
    validationError: "দয়া করে মেয়াদ এবং সার্ভিস চার্জের সঠিক মান প্রদান করুন।",
    duplicateError: "এই মেয়াদ এবং ধরনের পলিসি ইতিমধ্যে বিদ্যমান রয়েছে।"
  },
  EN: {
    title: "Loan Rules & Rates Settings",
    subtitle: "Configure installment durations and interest rates for loan applications",
    cardTitle: "Loan Duration & Service Charge Policies",
    cardDesc: "Policies defined here will automatically populate and apply calculations in the Loan Application Form.",
    addRule: "Add New Policy Rule",
    durationValue: "Duration Value",
    durationType: "Duration Type",
    interestRate: "Service Charge / Interest Rate (% Flat)",
    weekly: "Weekly",
    monthly: "Monthly",
    actions: "Actions",
    delete: "Delete",
    saveBtn: "Save Policies",
    successMsg: "Loan policy settings updated successfully!",
    saving: "Saving...",
    emptyList: "No loan policies configured. Create a new policy rule above.",
    validationError: "Please enter valid positive numbers for duration and interest rate.",
    duplicateError: "A policy with this duration value and type already exists."
  }
};

export default function LoanSettingsPage() {
  const { lang } = useLanguage();
  const t = translations[lang];

  const [rules, setRules] = useState<LoanRule[]>([]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New Rule Input Fields
  const [newValue, setNewValue] = useState("");
  const [newType, setNewType] = useState<"WEEKLY" | "MONTHLY">("MONTHLY");
  const [newRate, setNewRate] = useState("");

  useEffect(() => {
    const fetchRules = async () => {
      try {
        const res = await fetch("/api/loans/rules");
        const data = await res.json();
        if (data.success && Array.isArray(data.rules) && data.rules.length > 0) {
          setRules(data.rules);
        } else {
          setRules(DEFAULT_RULES);
        }
      } catch (err) {
        console.error("Error fetching loan rules:", err);
        setRules(DEFAULT_RULES);
      }
    };
    fetchRules();
  }, []);

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const val = parseInt(newValue, 10);
    const rate = parseFloat(newRate);

    if (isNaN(val) || val <= 0 || isNaN(rate) || rate < 0) {
      setError(t.validationError);
      return;
    }

    // Check for duplicates
    const isDuplicate = rules.some(
      (r) => r.durationValue === val && r.durationType === newType
    );

    if (isDuplicate) {
      setError(t.duplicateError);
      return;
    }

    const newRule: LoanRule = {
      id: Date.now().toString(),
      durationValue: val,
      durationType: newType,
      interestRate: rate
    };

    setRules([...rules, newRule]);
    setNewValue("");
    setNewRate("");
  };

  const handleDeleteRule = (id: string) => {
    setRules(rules.filter((r) => r.id !== id));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/loans/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules })
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.rules)) {
        setRules(data.rules);
        // Dispatch custom event to notify other components in same window
        window.dispatchEvent(new Event("somoby_settings_changed"));
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(data.error || t.validationError);
      }
    } catch (err) {
      console.error("Error saving loan rules:", err);
      setError(t.validationError);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between border-b pb-4 border-gray-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {t.title}
          </h1>
          <p className="text-sm text-gray-505 dark:text-gray-400">
            {t.subtitle}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 text-sm font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/20 dark:text-rose-400 rounded-xl border border-rose-200 dark:border-rose-900/50">
          ⚠️ {error}
        </div>
      )}

      {/* Main Settings Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-zinc-800">
          <h2 className="text-md font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-emerald-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            {t.cardTitle}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {t.cardDesc}
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Add Rule Form */}
          <form onSubmit={handleAddRule} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end bg-gray-50/50 dark:bg-zinc-850/30 p-4 rounded-xl border border-gray-100 dark:border-zinc-800">
            <div className="col-span-1">
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5 uppercase">
                {t.durationValue}
              </label>
              <input
                type="number"
                required
                min="1"
                placeholder="e.g. 10"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-gray-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white font-mono"
              />
            </div>

            <div className="col-span-1">
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5 uppercase">
                {t.durationType}
              </label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as any)}
                className="w-full px-3.5 py-2 text-sm border border-gray-205 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
              >
                <option value="WEEKLY">{t.weekly}</option>
                <option value="MONTHLY">{t.monthly}</option>
              </select>
            </div>

            <div className="col-span-1">
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5 uppercase">
                {t.interestRate}
              </label>
              <input
                type="number"
                required
                step="0.1"
                min="0"
                placeholder="e.g. 12"
                value={newRate}
                onChange={(e) => setNewRate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-gray-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white font-mono"
              />
            </div>

            <div className="col-span-1">
              <button
                type="submit"
                className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-200 dark:border-emerald-900/50 font-bold text-sm rounded-xl transition"
              >
                + {t.addRule}
              </button>
            </div>
          </form>

          {/* Rules Table */}
          <div className="border border-gray-150 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-zinc-850/50 font-bold text-gray-500 dark:text-gray-400 border-b border-gray-150 dark:border-zinc-800">
                <tr>
                  <th className="px-5 py-3.5">{t.durationValue}</th>
                  <th className="px-5 py-3.5">{t.durationType}</th>
                  <th className="px-5 py-3.5">{t.interestRate}</th>
                  <th className="px-5 py-3.5 text-right w-24">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 text-gray-700 dark:text-gray-300 font-mono">
                {rules.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center font-sans text-gray-500 dark:text-gray-400">
                      {t.emptyList}
                    </td>
                  </tr>
                ) : (
                  rules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-850/20 transition">
                      <td className="px-5 py-3.5 text-gray-900 dark:text-white font-bold">{rule.durationValue}</td>
                      <td className="px-5 py-3.5 font-sans">
                        {rule.durationType === "WEEKLY" ? t.weekly : t.monthly}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-emerald-600 dark:text-emerald-400">
                        {rule.interestRate}% Flat
                      </td>
                      <td className="px-5 py-3.5 text-right font-sans">
                        <button
                          type="button"
                          onClick={() => handleDeleteRule(rule.id)}
                          className="text-xs font-bold text-rose-500 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/30 transition"
                        >
                          {t.delete}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Success banner */}
          {success && (
            <div className="p-3 text-sm font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900/50 rounded-xl flex items-center gap-2 animate-in fade-in duration-200">
              <span>✓</span>
              <span>{t.successMsg}</span>
            </div>
          )}

          {/* Actions Footer */}
          <div className="pt-4 border-t border-gray-150 dark:border-zinc-800 flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2 min-w-[150px]"
            >
              {saving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t.saving}
                </>
              ) : (
                t.saveBtn
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
