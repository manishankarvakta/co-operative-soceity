"use client";

import { useEffect, useState } from "react";
import BankTransactionForm from "@/components/forms/BankTransactionForm";
import { ConfirmModal, Toast, useToast } from "@/components/ui/ConfirmModal";
import { useLanguage } from "@/providers/LanguageProvider";

export default function BankWorkspacePage() {
  const { lang } = useLanguage();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals / Toggles
  const [showTxForm, setShowTxForm] = useState(false);
  const [showAccountForm, setShowAccountForm] = useState(false);

  // Account Form states
  const [accName, setAccName] = useState("");
  const [accNumber, setAccNumber] = useState("");
  const [accBalance, setAccBalance] = useState("");

  // Modal & Toast
  const { toast, showToast } = useToast();
  const [signModal, setSignModal] = useState(false);
  const [pendingSign, setPendingSign] = useState<{ txId: string; role: string } | null>(null);
  const [signLoading, setSignLoading] = useState(false);

  const loadBankData = async () => {
    setLoading(true);
    try {
      const [resAcc, resTx] = await Promise.all([
        fetch("/api/bank/accounts"),
        fetch("/api/bank/transactions?limit=20")
      ]);
      const dataAcc = await resAcc.json();
      const dataTx = await resTx.json();
      setAccounts(Array.isArray(dataAcc) ? dataAcc : (dataAcc.accounts || []));
      setTransactions(Array.isArray(dataTx.transactions) ? dataTx.transactions : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBankData();
  }, []);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
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
      } else {
        showToast("success", lang === "BN" ? "অ্যাকাউন্ট তৈরি হয়েছে" : "Account Created", lang === "BN" ? "অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে।" : "Account created successfully.");
        setAccName("");
        setAccNumber("");
        setAccBalance("");
        setShowAccountForm(false);
        loadBankData();
      }
    } catch (err) {
      showToast("error", lang === "BN" ? "সার্ভার সমস্যা" : "Server Error", lang === "BN" ? "সার্ভারে সমস্যা হয়েছে।" : "Something went wrong.");
    }
  };

  // Open sign-off confirm modal
  const handleSignOff = (txId: string, role: string) => {
    setPendingSign({ txId, role });
    setSignModal(true);
  };

  // Execute sign-off after confirmation
  const handleConfirmSignOff = async () => {
    if (!pendingSign) return;
    setSignLoading(true);
    setSignModal(false);
    try {
      const res = await fetch(`/api/bank/transactions/${pendingSign.txId}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureType: pendingSign.role })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast("error", lang === "BN" ? "ব্যর্থ হয়েছে" : "Failed", data.message || (lang === "BN" ? "স্বাক্ষর সম্পন্ন করতে ব্যর্থ হয়েছে।" : "Sign-off failed."));
      } else {
        showToast("success", lang === "BN" ? "স্বাক্ষর সম্পন্ন" : "Signed Off", lang === "BN" ? "স্বাক্ষর সফলভাবে সম্পন্ন হয়েছে।" : "Signed off successfully.");
        loadBankData();
      }
    } catch (err) {
      showToast("error", lang === "BN" ? "সার্ভার সমস্যা" : "Server Error", lang === "BN" ? "সার্ভারে সমস্যা হয়েছে।" : "Something went wrong.");
    } finally {
      setSignLoading(false);
      setPendingSign(null);
    }
  };

  const getTxTypeBadge = (type: string) => {
    if (type === "CREDIT") {
      return <span className="text-emerald-600 font-bold">{lang === "BN" ? "জমা (Credit)" : "Deposit"}</span>;
    }
    return <span className="text-amber-600 font-bold">{lang === "BN" ? "উত্তোলন (Debit)" : "Withdrawal"}</span>;
  };

  const labels = {
    BN: {
      title: "ব্যাংক ও নগদ অ্যাকাউন্ট ব্যবস্থাপনা (Bank Workspace)",
      subtitle: "সমিতির ব্যাংক হিসাবসমূহ, স্থানান্তর খতিয়ান এবং অফিসারদের স্বাক্ষর কনসোল।",
      addAcc: "+ নতুন অ্যাকাউন্ট তৈরি",
      closeAcc: "ফর্ম বন্ধ করুন",
      addTx: "+ লেনদেন / স্থানান্তর এন্ট্রি",
      accName: "অ্যাকাউন্টের নাম",
      accNumber: "অ্যাকাউন্ট নম্বর",
      accBalance: "প্রারম্ভিক ব্যালেন্স (BDT)",
      submitAcc: "অ্যাকাউন্ট তৈরি করুন",
      accountsTitle: "সক্রিয় অ্যাকাউন্টসমূহ",
      txTitle: "সাম্প্রতিক লেনদেন এবং স্বাক্ষর অনুমোদন অবস্থা",
      colAccName: "অ্যাকাউন্ট",
      colAccNum: "অ্যাকাউন্ট নম্বর",
      colBalance: "বর্তমান ব্যালেন্স (BDT)",
      colTxType: "ধরন",
      colAmount: "পরিমাণ (BDT)",
      colSignatures: "স্বাক্ষর অবস্থা",
      colStatus: "অবস্থা",
      approved: "অনুমোদিত (Approved)",
      pending: "পেন্ডিং",
      signPresident: "President স্বাক্ষর",
      signSecretary: "Secretary স্বাক্ষর",
      signTreasurer: "Treasurer স্বাক্ষর",
      signed: "স্বাক্ষরিত",
      loading: "লোডিং হচ্ছে..."
    },
    EN: {
      title: "Bank & Cash Management",
      subtitle: "Bank accounts configuration, transaction sheets, and joint-approvals tracking.",
      addAcc: "+ Add Account",
      closeAcc: "Close Form",
      addTx: "+ Deposit / Withdraw / Transfer",
      accName: "Account Name",
      accNumber: "Account Number",
      accBalance: "Initial Balance (BDT)",
      submitAcc: "Create Account",
      accountsTitle: "Active Accounts & Cash Box",
      txTitle: "Recent Transactions & Joint-Signatures Status",
      colAccName: "Account Profile",
      colAccNum: "Account Number",
      colBalance: "Current Balance (BDT)",
      colTxType: "Type",
      colAmount: "Amount (BDT)",
      colSignatures: "Signatures",
      colStatus: "Status",
      approved: "Approved",
      pending: "Pending Sign-offs",
      signPresident: "Sign as President",
      signSecretary: "Sign as Secretary",
      signTreasurer: "Sign as Treasurer",
      signed: "Signed",
      loading: "Loading..."
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8">

      {/* Sign-off Confirm Modal */}
      <ConfirmModal
        open={signModal}
        variant="info"
        title={lang === "BN" ? "স্বাক্ষর নিশ্চিত করুন" : "Confirm Sign-off"}
        message={
          pendingSign
            ? lang === "BN"
              ? `আপনি কি নিশ্চিতভাবে এই লেনদেনে ${pendingSign.role} হিসেবে স্বাক্ষর করতে চান?`
              : `Are you sure you want to sign off as ${pendingSign.role}?`
            : ""
        }
        confirmText={lang === "BN" ? "হ্যাঁ, স্বাক্ষর করুন" : "Yes, Sign Off"}
        cancelText={lang === "BN" ? "বাতিল করুন" : "Cancel"}
        loading={signLoading}
        onConfirm={handleConfirmSignOff}
        onCancel={() => { setSignModal(false); setPendingSign(null); }}
      />

      {/* Toast */}
      <Toast toast={toast} />

      {/* Header */}
      <div className="flex justify-between items-center border-b pb-4 border-gray-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{labels[lang].title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{labels[lang].subtitle}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setShowAccountForm(!showAccountForm);
              setShowTxForm(false);
            }}
            className="px-4 py-2 bg-gray-150 hover:bg-gray-250 border border-gray-200 dark:bg-zinc-800 text-gray-850 dark:text-white font-bold text-sm rounded-lg shadow transition"
          >
            {showAccountForm ? labels[lang].closeAcc : labels[lang].addAcc}
          </button>
          <button
            onClick={() => {
              setShowTxForm(!showTxForm);
              setShowAccountForm(false);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg shadow transition"
          >
            {showTxForm ? "ফর্ম বন্ধ করুন" : labels[lang].addTx}
          </button>
        </div>
      </div>

      {/* Dynamic forms popup display */}
      {showAccountForm && (
        <div className="flex justify-center transition-all">
          <form onSubmit={handleCreateAccount} className="w-full max-w-md bg-white dark:bg-zinc-900 p-6 rounded-xl border border-black/5 shadow-md space-y-4">
            <h3 className="font-bold text-gray-800 dark:text-white">{labels[lang].addAcc}</h3>
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">{labels[lang].accName}</label>
              <input
                type="text"
                required
                value={accName}
                onChange={(e) => setAccName(e.target.value)}
                placeholder="যেমন: Cash on Hand, Sonali Bank"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-zinc-850 dark:border-zinc-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">{labels[lang].accNumber}</label>
              <input
                type="text"
                required
                value={accNumber}
                onChange={(e) => setAccNumber(e.target.value)}
                placeholder="যেমন: CASH_BOX, 100234892348"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-zinc-850 dark:border-zinc-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">{labels[lang].accBalance}</label>
              <input
                type="number"
                value={accBalance}
                onChange={(e) => setAccBalance(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-zinc-850 dark:border-zinc-700 dark:text-white"
              />
            </div>
            <button type="submit" className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow transition">
              {labels[lang].submitAcc}
            </button>
          </form>
        </div>
      )}

      {showTxForm && (
        <div className="flex justify-center transition-all">
          <BankTransactionForm onSuccess={() => {
            setShowTxForm(false);
            loadBankData();
          }} />
        </div>
      )}

      {/* Main Grid display: accounts summary + transactions approval list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Accounts Card List */}
        <div className="lg:col-span-1 space-y-6">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">{labels[lang].accountsTitle}</h2>
          {loading ? (
            <p className="text-sm text-gray-500">{labels[lang].loading}</p>
          ) : (
            <div className="space-y-4">
              {accounts.map((acc) => (
                <div key={acc.id} className="p-5 bg-white dark:bg-zinc-900 rounded-xl border border-black/5 dark:border-zinc-800 shadow flex justify-between items-center transition hover:shadow-md">
                  <div>
                    <h4 className="font-bold text-gray-850 dark:text-white">{acc.name}</h4>
                    <span className="text-xs text-gray-400 font-mono select-all">{acc.accountNumber}</span>
                  </div>
                  <strong className="text-lg font-black text-emerald-700 dark:text-emerald-400 font-mono">
                    {(acc.balance / 100).toLocaleString(lang === "BN" ? "bn-BD" : "en-US", { minimumFractionDigits: 2 })} BDT
                  </strong>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Transactions list & Sign off tracking */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">{labels[lang].txTitle}</h2>
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-black/5 dark:border-zinc-800 shadow overflow-hidden">
            <div className="overflow-x-auto text-sm">
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-zinc-850 text-gray-500 dark:text-gray-400 font-bold border-b dark:border-zinc-800">
                  <tr>
                    <th className="px-6 py-4">{labels[lang].colAccName}</th>
                    <th className="px-6 py-4">{labels[lang].colTxType}</th>
                    <th className="px-6 py-4">{labels[lang].colAmount}</th>
                    <th className="px-6 py-4">{labels[lang].colSignatures}</th>
                    <th className="px-6 py-4 text-right">{labels[lang].colStatus}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-500">{labels[lang].loading}</td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-500">লেনদেনের তথ্য নেই।</td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30">
                        <td className="px-6 py-4">
                          <span className="font-bold text-gray-800 dark:text-white">{tx.bankAccount.name}</span>
                          <span className="block text-[10px] text-gray-400 font-mono">{tx.reference || "No Reference"}</span>
                        </td>
                        <td className="px-6 py-4">{getTxTypeBadge(tx.type)}</td>
                        <td className="px-6 py-4 font-mono font-bold">
                          {(tx.amount / 100).toLocaleString(lang === "BN" ? "bn-BD" : "en-US", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 space-y-1">
                          <div className="flex gap-2 text-[10px] font-bold">
                            {tx.presidentApproved ? (
                              <span className="text-emerald-650 bg-emerald-50 px-1 rounded">Pres: {labels[lang].signed}</span>
                            ) : (
                              <button onClick={() => handleSignOff(tx.id, "PRESIDENT")} className="text-amber-700 bg-amber-50 px-1 rounded hover:bg-amber-100">{labels[lang].signPresident}</button>
                            )}

                            {tx.secretaryApproved ? (
                              <span className="text-emerald-650 bg-emerald-50 px-1 rounded">Sec: {labels[lang].signed}</span>
                            ) : (
                              <button onClick={() => handleSignOff(tx.id, "SECRETARY")} className="text-amber-700 bg-amber-50 px-1 rounded hover:bg-amber-100">{labels[lang].signSecretary}</button>
                            )}

                            {tx.treasurerApproved ? (
                              <span className="text-emerald-650 bg-emerald-50 px-1 rounded">Treas: {labels[lang].signed}</span>
                            ) : (
                              <button onClick={() => handleSignOff(tx.id, "TREASURER")} className="text-amber-700 bg-amber-50 px-1 rounded hover:bg-amber-100">{labels[lang].signTreasurer}</button>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {tx.isApproved ? (
                            <span className="px-2 py-0.5 text-xs font-bold text-emerald-700 bg-emerald-50 rounded dark:bg-emerald-950/20 dark:text-emerald-400">
                              {labels[lang].approved}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-xs font-bold text-amber-700 bg-amber-50 rounded dark:bg-amber-950/20 dark:text-amber-400">
                              {labels[lang].pending}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
