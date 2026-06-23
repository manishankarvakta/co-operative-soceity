"use client";

import { useEffect, useState } from "react";

interface BankTransactionFormProps {
  onSuccess?: () => void;
}

export default function BankTransactionForm({ onSuccess }: BankTransactionFormProps) {
  const [lang, setLang] = useState<"BN" | "EN">("BN");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Selector lists
  const [accounts, setAccounts] = useState<any[]>([]);

  // Form states
  const [txType, setTxType] = useState<"CREDIT" | "DEBIT" | "TRANSFER">("CREDIT");
  const [sourceAccountId, setSourceAccountId] = useState("");
  const [destAccountId, setDestAccountId] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");

  const loadAccounts = async () => {
    try {
      const res = await fetch("/api/bank/accounts");
      const data = await res.json();
      setAccounts(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const bdtVal = parseFloat(amount);
    if (isNaN(bdtVal) || bdtVal <= 0) {
      setError(lang === "BN" ? "সঠিক পরিমাণ লিখুন।" : "Please enter a valid amount.");
      setLoading(false);
      return;
    }

    const paisaVal = Math.round(bdtVal * 100);
    let payload: any = { amount: paisaVal, reference };

    if (txType === "TRANSFER") {
      if (!sourceAccountId || !destAccountId) {
        setError(lang === "BN" ? "উৎস ও গন্তব্য অ্যাকাউন্ট সিলেক্ট করুন।" : "Please select source and destination accounts.");
        setLoading(false);
        return;
      }
      payload.type = "TRANSFER";
      payload.sourceBankAccountId = sourceAccountId;
      payload.destinationBankAccountId = destAccountId;
    } else {
      if (!bankAccountId) {
        setError(lang === "BN" ? "ব্যাংক অ্যাকাউন্ট সিলেক্ট করুন।" : "Please select a bank account.");
        setLoading(false);
        return;
      }
      payload.type = txType;
      payload.bankAccountId = bankAccountId;
    }

    try {
      const response = await fetch("/api/bank/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || (lang === "BN" ? "লেনদেন এন্ট্রি করতে ব্যর্থ হয়েছে।" : "Transaction logging failed."));
      } else {
        setSuccessMsg(
          lang === "BN"
            ? "লেনদেন সফলভাবে এন্ট্রি হয়েছে এবং ৩ জন কর্মকর্তার যৌথ স্বাক্ষরের অপেক্ষায় রয়েছে।"
            : "Transaction recorded, pending joint-signatures sign-off."
        );
        setAmount("");
        setReference("");
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
      title: "ব্যাংক লেনদেন এন্ট্রি ফর্ম",
      txType: "লেনদেনের ধরন",
      source: "উৎস অ্যাকাউন্ট (Source)",
      dest: "গন্তব্য অ্যাকাউন্ট (Destination)",
      account: "ব্যাংক অ্যাকাউন্ট",
      amount: "পরিমাণ (BDT)",
      ref: "রেফারেন্স / বিবরণ",
      submit: "লেনদেন সাবমিট করুন",
      submitting: "প্রক্রিয়াধীন...",
      deposit: "ব্যাংক ডিপোজিট (Credit)",
      withdrawal: "ব্যাংক উইথড্র (Debit)",
      transfer: "তহবিল স্থানান্তর (Transfer)"
    },
    EN: {
      title: "New Bank Transaction",
      txType: "Transaction Type",
      source: "Source Account",
      dest: "Destination Account",
      account: "Bank Account",
      amount: "Amount (BDT)",
      ref: "Reference / Description",
      submit: "Submit Transaction",
      submitting: "Processing...",
      deposit: "Deposit (Credit)",
      withdrawal: "Withdrawal (Debit)",
      transfer: "Fund Transfer"
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-150 dark:border-zinc-800 shadow-md">
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
            {labels[lang].txType}
          </label>
          <select
            value={txType}
            onChange={(e) => setTxType(e.target.value as any)}
            className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-850 dark:border-zinc-700 dark:text-white"
          >
            <option value="CREDIT">{labels[lang].deposit}</option>
            <option value="DEBIT">{labels[lang].withdrawal}</option>
            <option value="TRANSFER">{labels[lang].transfer}</option>
          </select>
        </div>

        {txType === "TRANSFER" ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                {labels[lang].source} <span className="text-red-500">*</span>
              </label>
              <select
                value={sourceAccountId}
                onChange={(e) => setSourceAccountId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-850 dark:border-zinc-700 dark:text-white"
              >
                <option value="">-- {lang === "BN" ? "সিলেক্ট করুন" : "Select Source"} --</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.accountNumber})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                {labels[lang].dest} <span className="text-red-500">*</span>
              </label>
              <select
                value={destAccountId}
                onChange={(e) => setDestAccountId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-850 dark:border-zinc-700 dark:text-white"
              >
                <option value="">-- {lang === "BN" ? "সিলেক্ট করুন" : "Select Destination"} --</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.accountNumber})
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
              {labels[lang].account} <span className="text-red-500">*</span>
            </label>
            <select
              value={bankAccountId}
              onChange={(e) => setBankAccountId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-850 dark:border-zinc-700 dark:text-white"
            >
              <option value="">-- {lang === "BN" ? "সিলেক্ট করুন" : "Select Account"} --</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.accountNumber})
                </option>
              ))}
            </select>
          </div>
        )}

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
            {labels[lang].ref}
          </label>
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder={lang === "BN" ? "চেক নম্বর বা ট্রানজেকশন রেফারেন্স..." : "Check number or txn ref..."}
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
