"use client";

import { useEffect, useState } from "react";
import { Toast, useToast } from "@/components/ui/ConfirmModal";
import { useLanguage } from "@/providers/LanguageProvider";

export default function ChartOfAccountsPage() {
  const { lang } = useLanguage();
  const [accounts, setAccounts] = useState<any[]>([]);
  const { toast, showToast } = useToast();
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [newAccCode, setNewAccCode] = useState("");
  const [newAccName, setNewAccName] = useState("");
  const [newAccType, setNewAccType] = useState("ASSET");
  const [loading, setLoading] = useState(true);

  const loadCOA = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/accounting/accounts");
      const data = await res.json();
      setAccounts(res.ok && Array.isArray(data) ? data : (data?.accounts || []));
    } catch (err) {
      console.error(err);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCOA();
  }, []);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      code: newAccCode,
      name: newAccName,
      type: newAccType
    };

    try {
      const res = await fetch("/api/accounting/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast("error", lang === "BN" ? "ব্যর্থ হয়েছে" : "Failed", data.message || (lang === "BN" ? "অ্যাকাউন্ট তৈরি ব্যর্থ হয়েছে।" : "Account creation failed."));
      } else {
        showToast("success", lang === "BN" ? "অ্যাকাউন্ট তৈরি হয়েছে" : "Account Created", lang === "BN" ? "নতুন লেজার হিসাব সফলভাবে তৈরি হয়েছে।" : "Account created successfully.");
        setNewAccCode("");
        setNewAccName("");
        setShowAccountForm(false);
        loadCOA();
      }
    } catch (err) {
      showToast("error", lang === "BN" ? "সার্ভার সমস্যা" : "Server Error", lang === "BN" ? "সার্ভারে সমস্যা হয়েছে।" : "Something went wrong.");
    }
  };

  const labels = {
    BN: {
      addAcc: "+ নতুন লেজার হিসাব তৈরি",
      submitAcc: "হিসাব তৈরি করুন",
      code: "হিসাব কোড",
      name: "লেজার হিসাবের নাম",
      type: "অ্যাকাউন্টের ধরন",
      balance: "বর্তমান ব্যালেন্স (BDT)",
      loading: "লোডিং হচ্ছে...",
    },
    EN: {
      addAcc: "+ Create Account",
      submitAcc: "Create Ledger",
      code: "Account Code",
      name: "Ledger Account Name",
      type: "Account Type",
      balance: "Current Balance (BDT)",
      loading: "Loading...",
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <Toast toast={toast} />

      <div className="flex justify-between items-center">
        <h3 className="font-bold text-gray-800 dark:text-white">Chart of Accounts Ledger Registry</h3>
        <button
          onClick={() => setShowAccountForm(!showAccountForm)}
          className="px-3 py-1.5 bg-emerald-600 text-white font-bold text-sm rounded shadow hover:bg-emerald-700 transition"
        >
          {showAccountForm ? "ফর্ম বন্ধ করুন" : labels[lang].addAcc}
        </button>
      </div>

      {showAccountForm && (
        <div className="flex justify-center transition-all">
          <form onSubmit={handleCreateAccount} className="w-full max-w-md bg-white dark:bg-zinc-900 p-6 rounded-xl border shadow-md space-y-4">
            <h4 className="font-bold text-gray-800 dark:text-white">{labels[lang].addAcc}</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">{labels[lang].code}</label>
                <input
                  type="text"
                  required
                  value={newAccCode}
                  onChange={(e) => setNewAccCode(e.target.value)}
                  placeholder="e.g. 4010"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">{labels[lang].type}</label>
                <select
                  value={newAccType}
                  onChange={(e) => setNewAccType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
                >
                  <option value="ASSET">ASSET (সম্পদ)</option>
                  <option value="LIABILITY">LIABILITY (দায়)</option>
                  <option value="EQUITY">EQUITY (মূলধন)</option>
                  <option value="REVENUE">REVENUE (আয়)</option>
                  <option value="EXPENSE">EXPENSE (ব্যয়)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">{labels[lang].name}</label>
              <input
                type="text"
                required
                value={newAccName}
                onChange={(e) => setNewAccName(e.target.value)}
                placeholder="যেমন: ভর্তি ফি আয়"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
              />
            </div>
            <button type="submit" className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow transition">
              {labels[lang].submitAcc}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-black/5 dark:border-zinc-800 shadow-md overflow-hidden">
        <div className="overflow-x-auto text-sm">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 font-bold border-b dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4">{labels[lang].code}</th>
                <th className="px-6 py-4">{labels[lang].name}</th>
                <th className="px-6 py-4">{labels[lang].type}</th>
                <th className="px-6 py-4 text-right">{labels[lang].balance}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-500">{labels[lang].loading}</td>
                </tr>
              ) : (
                accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30">
                    <td className="px-6 py-4 font-mono font-bold text-emerald-700 dark:text-emerald-400">{acc.code}</td>
                    <td className="px-6 py-4 font-bold text-gray-800 dark:text-white">{acc.name}</td>
                    <td className="px-6 py-4 font-semibold text-xs uppercase text-gray-500">{acc.type}</td>
                    <td className="px-6 py-4 text-right font-mono font-bold">
                      {(acc.balance / 100).toLocaleString(lang === "BN" ? "bn-BD" : "en-US", { minimumFractionDigits: 2 })} BDT
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
