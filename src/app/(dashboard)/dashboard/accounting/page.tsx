"use client";

import { useEffect, useState } from "react";

export default function AccountingPage() {
  const [lang, setLang] = useState<"BN" | "EN">("BN");
  const [activeTab, setActiveTab] = useState<"coa" | "journal" | "reports" | "distribution">("coa");

  // Profit Distribution states
  const [netProfitBdt, setNetProfitBdt] = useState(0);
  const [distributionsList, setDistributionsList] = useState<any[]>([]);
  const [distAmountBdt, setDistAmountBdt] = useState("");
  const [distPaymentMode, setDistPaymentMode] = useState<"CASH" | "BANK">("CASH");
  const [submittingDist, setSubmittingDist] = useState(false);

  // Datasets
  const [accounts, setAccounts] = useState<any[]>([]);
  const [journalEntries, setJournalEntries] = useState<any[]>([]);

  // Reports
  const [reportType, setReportType] = useState<"TRIAL_BALANCE" | "BALANCE_SHEET" | "PROFIT_LOSS">("TRIAL_BALANCE");
  const [reportData, setReportData] = useState<any>(null);

  // Modals & Form states
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [newAccCode, setNewAccCode] = useState("");
  const [newAccName, setNewAccName] = useState("");
  const [newAccType, setNewAccType] = useState("ASSET");

  const [showJournalForm, setShowJournalForm] = useState(false);
  const [journalDesc, setJournalDesc] = useState("");
  const [journalDate, setJournalDate] = useState(new Date().toISOString().split("T")[0]);
  const [journalRef, setJournalRef] = useState("");
  const [journalLines, setJournalLines] = useState<Array<{ accountCode: string; amount: string; type: "DEBIT" | "CREDIT" }>>([
    { accountCode: "", amount: "", type: "DEBIT" },
    { accountCode: "", amount: "", type: "CREDIT" }
  ]);

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

  const loadJournal = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/accounting/journal");
      const data = await res.json();
      setJournalEntries(res.ok ? (data?.entries || []) : []);
    } catch (err) {
      console.error(err);
      setJournalEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const loadReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/accounting/reports?type=${reportType}`);
      const data = await res.json();
      setReportData(res.ok && !data?.error ? data : null);
    } catch (err) {
      console.error(err);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const loadDistributionData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/accounting/profit-distribution");
      const data = await res.json();
      if (res.ok && data?.success) {
        setNetProfitBdt(data.netProfitBdt || 0);
        setDistributionsList(data.distributions || []);
      } else {
        setDistributionsList([]);
      }
    } catch (err) {
      console.error(err);
      setDistributionsList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteDistribution = async (e: React.FormEvent) => {
    e.preventDefault();
    const bdtVal = parseFloat(distAmountBdt) || 0;
    if (bdtVal <= 0) {
      alert(lang === "BN" ? "সঠিক লভ্যাংশের পরিমাণ লিখুন।" : "Please enter a valid amount.");
      return;
    }

    const confirmDist = window.confirm(
      lang === "BN"
        ? `আপনি কি নিশ্চিতভাবে ${bdtVal.toLocaleString()} BDT লভ্যাংশ বন্টন ও রিজার্ভ ফান্ড স্থানান্তর সম্পন্ন করতে চান?`
        : `Are you sure you want to execute profit distribution of ${bdtVal.toLocaleString()} BDT?`
    );
    if (!confirmDist) return;

    setSubmittingDist(true);
    try {
      const res = await fetch("/api/accounting/profit-distribution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.round(bdtVal * 100),
          paymentMode: distPaymentMode
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || "লভ্যাংশ বন্টন ব্যর্থ হয়েছে।");
      } else {
        alert(lang === "BN" ? "বার্ষিক লভ্যাংশ বন্টন ও এফডি রিজার্ভ সফলভাবে সম্পন্ন হয়েছে!" : "Profit distribution successfully executed!");
        setDistAmountBdt("");
        loadDistributionData();
      }
    } catch (err) {
      alert("সার্ভারে সমস্যা হয়েছে।");
    } finally {
      setSubmittingDist(false);
    }
  };

  useEffect(() => {
    if (activeTab === "coa") loadCOA();
    if (activeTab === "journal") loadJournal();
    if (activeTab === "reports") loadReport();
    if (activeTab === "distribution") loadDistributionData();
  }, [activeTab, reportType]);

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
        alert(data.message || "অ্যাকাউন্ট তৈরি ব্যর্থ হয়েছে।");
      } else {
        alert(lang === "BN" ? "অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে।" : "Account created successfully.");
        setNewAccCode("");
        setNewAccName("");
        setShowAccountForm(false);
        loadCOA();
      }
    } catch (err) {
      alert("সার্ভারে সমস্যা হয়েছে।");
    }
  };

  const handleAddJournalLine = () => {
    setJournalLines([...journalLines, { accountCode: "", amount: "", type: "DEBIT" }]);
  };

  const handleRemoveJournalLine = (index: number) => {
    const lines = [...journalLines];
    lines.splice(index, 1);
    setJournalLines(lines);
  };

  const handleJournalLineChange = (index: number, key: string, value: string) => {
    const lines = [...journalLines] as any;
    lines[index][key] = value;
    setJournalLines(lines);
  };

  const handleCreateJournal = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate entries
    const parsedLines = journalLines.map((l) => {
      const amt = parseFloat(l.amount) || 0;
      return {
        accountCode: l.accountCode,
        amount: Math.round(amt * 100), // Paisa
        type: l.type
      };
    });

    const payload = {
      description: journalDesc,
      date: journalDate,
      reference: journalRef || null,
      lines: parsedLines
    };

    try {
      const res = await fetch("/api/accounting/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || "জার্নাল পোস্টিং ব্যর্থ হয়েছে।");
      } else {
        alert(lang === "BN" ? "জার্নাল সফলভাবে পোস্ট করা হয়েছে।" : "Journal posted successfully.");
        setJournalDesc("");
        setJournalRef("");
        setJournalLines([
          { accountCode: "", amount: "", type: "DEBIT" },
          { accountCode: "", amount: "", type: "CREDIT" }
        ]);
        setShowJournalForm(false);
        loadJournal();
      }
    } catch (err) {
      alert("সার্ভারে সমস্যা হয়েছে।");
    }
  };

  const labels = {
    BN: {
      title: "হিসাবরক্ষণ ও ডাবল এন্ট্রি খতিয়ান (Accounting Console)",
      subtitle: "চার্ট অব অ্যাকাউন্টস, জার্নাল ভাউচার পোস্টিং এবং ফাইনান্সিয়াল রিপোর্টিং স্টেটমেন্ট।",
      tabCOA: "চার্ট অব অ্যাকাউন্টস (COA)",
      tabJournal: "জার্নাল ভাউচার (Journal Logs)",
      tabReports: "আর্থিক বিবরণী (Statements)",
      addAcc: "+ নতুন লেজার হিসাব তৈরি",
      submitAcc: "হিসাব তৈরি করুন",
      addJournal: "+ নতুন জার্নাল এন্ট্রি পোস্ট",
      submitJournal: "জার্নাল পোস্ট করুন",
      removeLine: "মুছুন",
      addLine: "+ লাইন যুক্ত করুন",
      code: "হিসাব কোড",
      name: "লেজার হিসাবের নাম",
      type: "অ্যাকাউন্টের ধরন",
      balance: "বর্তমান ব্যালেন্স (BDT)",
      loading: "লোডিং হচ্ছে...",
      debit: "ডেবিট (Debit)",
      credit: "ক্রেডিট (Credit)",
      total: "সর্বমোট",
      ref: "রেফারেন্স",
      date: "তারিখ"
    },
    EN: {
      title: "Accounting & Retained Ledger",
      subtitle: "Chart of accounts configuration, double-entry vouchers, and reports.",
      tabCOA: "Chart of Accounts",
      tabJournal: "Journal Vouchers",
      tabReports: "Financial Statements",
      addAcc: "+ Create Account",
      submitAcc: "Create Ledger",
      addJournal: "+ Record Journal Entry",
      submitJournal: "Post Journal Voucher",
      removeLine: "Remove",
      addLine: "+ Add Line",
      code: "Account Code",
      name: "Ledger Account Name",
      type: "Account Type",
      balance: "Current Balance (BDT)",
      loading: "Loading...",
      debit: "Debit",
      credit: "Credit",
      total: "Total",
      ref: "Reference",
      date: "Date"
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-4 border-gray-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{labels[lang].title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{labels[lang].subtitle}</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setLang(lang === "BN" ? "EN" : "BN")}
            className="px-3 py-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg hover:bg-emerald-100"
          >
            {lang === "BN" ? "English" : "বাংলা"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200 dark:border-zinc-800">
        <button
          onClick={() => setActiveTab("coa")}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${activeTab === "coa" ? "border-emerald-650 text-emerald-600 dark:text-emerald-400" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
        >
          {labels[lang].tabCOA}
        </button>
        <button
          onClick={() => setActiveTab("journal")}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${activeTab === "journal" ? "border-emerald-650 text-emerald-600 dark:text-emerald-400" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
        >
          {labels[lang].tabJournal}
        </button>
        <button
          onClick={() => setActiveTab("reports")}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${activeTab === "reports" ? "border-emerald-650 text-emerald-600 dark:text-emerald-400" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
        >
          {labels[lang].tabReports}
        </button>
        <button
          onClick={() => setActiveTab("distribution")}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${activeTab === "distribution" ? "border-emerald-650 text-emerald-600 dark:text-emerald-400" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
        >
          {lang === "BN" ? "লভ্যাংশ বন্টন (Profit Distribution)" : "Profit Distribution"}
        </button>
      </div>

      {/* Tab 1: Chart of Accounts */}
      {activeTab === "coa" && (
        <div className="space-y-6">
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
                <h4 className="font-bold text-gray-850 dark:text-white">{labels[lang].addAcc}</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">{labels[lang].code}</label>
                    <input
                      type="text"
                      required
                      value={newAccCode}
                      onChange={(e) => setNewAccCode(e.target.value)}
                      placeholder="e.g. 4010"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-zinc-850 dark:border-zinc-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">{labels[lang].type}</label>
                    <select
                      value={newAccType}
                      onChange={(e) => setNewAccType(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-850 dark:border-zinc-700 dark:text-white"
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
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-zinc-850 dark:border-zinc-700 dark:text-white"
                  />
                </div>
                <button type="submit" className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow transition">
                  {labels[lang].submitAcc}
                </button>
              </form>
            </div>
          )}

          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-150 dark:border-zinc-800 shadow-md overflow-hidden">
            <div className="overflow-x-auto text-sm">
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-zinc-850 text-gray-500 dark:text-gray-400 font-bold border-b dark:border-zinc-800">
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
                        <td className="px-6 py-4 font-semibold text-xs uppercase text-gray-550">{acc.type}</td>
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
      )}

      {/* Tab 2: Journal Logs */}
      {activeTab === "journal" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-gray-800 dark:text-white">Double Entry Journal Logs Registry</h3>
            <button
              onClick={() => setShowJournalForm(!showJournalForm)}
              className="px-3 py-1.5 bg-emerald-600 text-white font-bold text-sm rounded shadow hover:bg-emerald-700 transition"
            >
              {showJournalForm ? "পোস্টিং বন্ধ করুন" : labels[lang].addJournal}
            </button>
          </div>

          {showJournalForm && (
            <div className="flex justify-center transition-all">
              <form onSubmit={handleCreateJournal} className="w-full max-w-3xl bg-white dark:bg-zinc-900 p-6 rounded-xl border shadow-md space-y-4">
                <h4 className="font-bold text-gray-850 dark:text-white">{labels[lang].addJournal}</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">লেনদেনের বিবরণ</label>
                    <input
                      type="text"
                      required
                      value={journalDesc}
                      onChange={(e) => setJournalDesc(e.target.value)}
                      placeholder="যেমন: নতুন অফিস চেয়ার ক্রয়"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-zinc-850 dark:border-zinc-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">{labels[lang].date}</label>
                    <input
                      type="date"
                      required
                      value={journalDate}
                      onChange={(e) => setJournalDate(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-850 dark:border-zinc-700 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-3">
                  <span className="block text-xs font-bold text-gray-500">দাখিলা লাইনসমূহ (Journal Entries Lines)</span>
                  {journalLines.map((line, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end border-b pb-3 dark:border-zinc-850">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">লেজার অ্যাকাউন্ট</label>
                        <select
                          required
                          value={line.accountCode}
                          onChange={(e) => handleJournalLineChange(index, "accountCode", e.target.value)}
                          className="w-full px-2 py-1.5 border rounded dark:bg-zinc-850 dark:border-zinc-700 dark:text-white"
                        >
                          <option value="">-- অ্যাকাউন্ট সিলেক্ট করুন --</option>
                          {accounts.map((acc) => (
                            <option key={acc.id} value={acc.code}>
                              {acc.code} - {acc.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">টাইপ</label>
                        <select
                          value={line.type}
                          onChange={(e) => handleJournalLineChange(index, "type", e.target.value as any)}
                          className="w-full px-2 py-1.5 border rounded dark:bg-zinc-850 dark:border-zinc-700 dark:text-white"
                        >
                          <option value="DEBIT">{labels[lang].debit}</option>
                          <option value="CREDIT">{labels[lang].credit}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">পরিমাণ (BDT)</label>
                        <input
                          type="number"
                          required
                          value={line.amount}
                          onChange={(e) => handleJournalLineChange(index, "amount", e.target.value)}
                          placeholder="0.00"
                          className="w-full px-2 py-1.5 border rounded dark:bg-zinc-850 dark:border-zinc-700 dark:text-white"
                        />
                      </div>

                      <div className="flex justify-end">
                        {journalLines.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveJournalLine(index)}
                            className="px-2 py-1.5 bg-red-50 text-red-600 border border-red-250 text-xs font-bold rounded hover:bg-red-100"
                          >
                            {labels[lang].removeLine}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleAddJournalLine}
                    className="mt-2 text-xs font-bold text-emerald-600 hover:underline"
                  >
                    {labels[lang].addLine}
                  </button>
                </div>

                <button type="submit" className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow transition">
                  {labels[lang].submitJournal}
                </button>
              </form>
            </div>
          )}

          {/* Journal vouchers lists log */}
          <div className="space-y-4">
            {loading ? (
              <p className="text-sm text-gray-500">{labels[lang].loading}</p>
            ) : (
              journalEntries.map((entry) => (
                <div key={entry.id} className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-150 dark:border-zinc-800 shadow overflow-hidden">
                  <div className="p-4 bg-gray-50 dark:bg-zinc-850 border-b dark:border-zinc-800 flex justify-between items-center text-xs text-gray-500">
                    <div>
                      <strong className="text-gray-800 dark:text-white text-sm block mb-1">{entry.description}</strong>
                      <span>রসিদ রেফারেন্স: {entry.reference || "N/A"}</span>
                    </div>
                    <span className="font-mono text-gray-800 dark:text-gray-300">
                      {new Date(entry.date).toLocaleDateString(lang === "BN" ? "bn-BD" : "en-US")}
                    </span>
                  </div>
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-gray-500 bg-gray-50/50 dark:bg-zinc-900 border-b dark:border-zinc-800 font-bold">
                        <th className="px-6 py-2">লেজার হিসাব</th>
                        <th className="px-6 py-2 text-right">{labels[lang].debit}</th>
                        <th className="px-6 py-2 text-right">{labels[lang].credit}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-zinc-850">
                      {entry.lines.map((line: any) => (
                        <tr key={line.id}>
                          <td className="px-6 py-2.5">
                            <span className={line.type === "CREDIT" ? "pl-6 text-gray-650" : "font-semibold text-gray-800 dark:text-white"}>
                              {line.account.code} - {line.account.name}
                            </span>
                          </td>
                          <td className="px-6 py-2.5 text-right font-mono text-gray-800 dark:text-zinc-200">
                            {line.type === "DEBIT" ? (line.amount / 100).toLocaleString() : ""}
                          </td>
                          <td className="px-6 py-2.5 text-right font-mono text-gray-800 dark:text-zinc-200">
                            {line.type === "CREDIT" ? (line.amount / 100).toLocaleString() : ""}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Reports Statements */}
      {activeTab === "reports" && (
        <div className="space-y-6">
          <div className="flex gap-2 p-1.5 bg-gray-55 dark:bg-zinc-850 rounded-lg max-w-md border border-gray-150 text-xs font-semibold">
            <button
              onClick={() => setReportType("TRIAL_BALANCE")}
              className={`px-3 py-1.5 rounded-md transition ${reportType === "TRIAL_BALANCE" ? "bg-white dark:bg-zinc-800 shadow" : "text-gray-500"}`}
            >
              Trial Balance
            </button>
            <button
              onClick={() => setReportType("BALANCE_SHEET")}
              className={`px-3 py-1.5 rounded-md transition ${reportType === "BALANCE_SHEET" ? "bg-white dark:bg-zinc-800 shadow" : "text-gray-500"}`}
            >
              Balance Sheet
            </button>
            <button
              onClick={() => setReportType("PROFIT_LOSS")}
              className={`px-3 py-1.5 rounded-md transition ${reportType === "PROFIT_LOSS" ? "bg-white dark:bg-zinc-800 shadow" : "text-gray-500"}`}
            >
              Profit & Loss
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-gray-500">{labels[lang].loading}</p>
          ) : !reportData ? (
            <p className="text-sm text-red-500">রিপোর্ট ডাটা পাওয়া যায়নি।</p>
          ) : (
            <div className="p-8 border rounded-lg bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 shadow max-w-3xl mx-auto print:border-0 print:shadow-none print:p-0">
              <div className="text-center mb-6 border-b pb-4 dark:border-zinc-800">
                <h2 className="text-xl font-black text-gray-800 dark:text-white">উত্থান বহুমুখী সমবায় সমিতি লিমিটেড</h2>
                <span className="text-xs text-gray-500 uppercase tracking-widest block mt-1 font-semibold">
                  {reportType === "TRIAL_BALANCE" ? "Trial Balance Sheet" : reportType === "BALANCE_SHEET" ? "Balance Sheet Statement" : "Profit and Loss Income Statement"}
                </span>
                <span className="text-[10px] text-gray-400 block mt-1">As of: {new Date().toLocaleDateString()}</span>
              </div>

              {/* Trial Balance table */}
              {reportType === "TRIAL_BALANCE" && (
                <table className="w-full text-left text-sm border-collapse border border-gray-300 dark:border-zinc-800">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-zinc-850 text-gray-700 dark:text-zinc-200 font-bold border-b border-gray-300 dark:border-zinc-800">
                      <th className="px-4 py-2 border-r border-gray-300 dark:border-zinc-800">হিসাব কোড / লেজার নাম</th>
                      <th className="px-4 py-2 border-r border-gray-300 dark:border-zinc-800 text-right">{labels[lang].debit}</th>
                      <th className="px-4 py-2 text-right">{labels[lang].credit}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
                    {reportData.rows.map((row: any) => (
                      <tr key={row.code} className="text-gray-700 dark:text-zinc-300">
                        <td className="px-4 py-2.5 border-r border-gray-300 dark:border-zinc-800">
                          {row.code} - {row.name}
                        </td>
                        <td className="px-4 py-2.5 border-r border-gray-300 dark:border-zinc-800 text-right font-mono">
                          {row.debit > 0 ? row.debit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono">
                          {row.credit > 0 ? row.credit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 dark:bg-zinc-850 text-gray-800 dark:text-white font-bold border-t-2 border-gray-350 dark:border-zinc-700 text-base">
                      <td className="px-4 py-2 border-r border-gray-300 dark:border-zinc-800 text-right">{labels[lang].total}:</td>
                      <td className="px-4 py-2 border-r border-gray-300 dark:border-zinc-800 text-right font-mono text-emerald-700 dark:text-emerald-400">
                        {reportData.totals.totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-emerald-700 dark:text-emerald-400">
                        {reportData.totals.totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}

              {/* Balance Sheet Statement */}
              {reportType === "BALANCE_SHEET" && (
                <div className="space-y-6 text-sm">
                  {/* Assets */}
                  <div>
                    <h4 className="font-bold border-b pb-1 mb-2 text-gray-800 dark:text-white uppercase tracking-wider">assets (সম্পদসমূহ)</h4>
                    <div className="space-y-2">
                      {reportData.assets.map((item: any) => (
                        <div key={item.code} className="flex justify-between border-b pb-1 dark:border-zinc-850 text-gray-750 dark:text-zinc-350">
                          <span>{item.name}</span>
                          <span className="font-mono font-semibold">{item.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between font-bold text-gray-850 dark:text-white pt-2 text-base">
                      <span>Total Assets:</span>
                      <span className="font-mono text-emerald-700 dark:text-emerald-400">{reportData.totals.totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })} BDT</span>
                    </div>
                  </div>

                  {/* Liabilities & Equity */}
                  <div className="pt-4">
                    <h4 className="font-bold border-b pb-1 mb-2 text-gray-800 dark:text-white uppercase tracking-wider">liabilities & equity (দায় ও মূলধন)</h4>
                    <div className="space-y-2">
                      {reportData.liabilities.map((item: any) => (
                        <div key={item.code} className="flex justify-between border-b pb-1 dark:border-zinc-850 text-gray-750 dark:text-zinc-350">
                          <span>{item.name}</span>
                          <span className="font-mono font-semibold">{item.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                      ))}
                      {reportData.equity.map((item: any) => (
                        <div key={item.code} className="flex justify-between border-b pb-1 dark:border-zinc-850 text-gray-750 dark:text-zinc-350">
                          <span>{item.name}</span>
                          <span className="font-mono font-semibold">{item.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between font-bold text-gray-850 dark:text-white pt-2 text-base">
                      <span>Total Liabilities & Equity:</span>
                      <span className="font-mono text-emerald-700 dark:text-emerald-400">{reportData.totals.totalLiabilitiesAndEquity.toLocaleString(undefined, { minimumFractionDigits: 2 })} BDT</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Profit & Loss statement */}
              {reportType === "PROFIT_LOSS" && (
                <div className="space-y-6 text-sm">
                  {/* Revenue */}
                  <div>
                    <h4 className="font-bold border-b pb-1 mb-2 text-gray-800 dark:text-white uppercase tracking-wider">Revenue (আয়সমূহ)</h4>
                    <div className="space-y-2">
                      {reportData.revenue.map((item: any) => (
                        <div key={item.code} className="flex justify-between border-b pb-1 dark:border-zinc-850 text-gray-750 dark:text-zinc-350">
                          <span>{item.name}</span>
                          <span className="font-mono font-semibold">{item.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between font-bold text-gray-850 dark:text-white pt-2 text-base">
                      <span>Total Revenue:</span>
                      <span className="font-mono text-emerald-700 dark:text-emerald-400">{reportData.totals.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })} BDT</span>
                    </div>
                  </div>

                  {/* Expenses */}
                  <div>
                    <h4 className="font-bold border-b pb-1 mb-2 text-gray-800 dark:text-white uppercase tracking-wider">Expenses (ব্যয়সমূহ)</h4>
                    <div className="space-y-2">
                      {reportData.expenses.map((item: any) => (
                        <div key={item.code} className="flex justify-between border-b pb-1 dark:border-zinc-850 text-gray-750 dark:text-zinc-350">
                          <span>{item.name}</span>
                          <span className="font-mono font-semibold">{item.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between font-bold text-gray-850 dark:text-white pt-2 text-base">
                      <span>Total Expenses:</span>
                      <span className="font-mono text-amber-700 dark:text-amber-400">{reportData.totals.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })} BDT</span>
                    </div>
                  </div>

                  {/* Net Profit indicator */}
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 rounded-xl flex justify-between items-center text-lg font-black">
                    <span className="text-emerald-800 dark:text-emerald-400">Net Profit (নিট মুনাফা):</span>
                    <span className="font-mono text-emerald-800 dark:text-emerald-400">{reportData.totals.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })} BDT</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Profit Distribution */}
      {activeTab === "distribution" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-sm">
          {/* Left panel: Available Net Profit and Execution */}
          <div className="lg:col-span-1 space-y-6">
            <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-gray-150 dark:border-zinc-800 shadow-md space-y-6">
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">available net profit</span>
                <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {netProfitBdt.toLocaleString(lang === "BN" ? "bn-BD" : "en-US", { minimumFractionDigits: 2 })} BDT
                </h3>
              </div>

              {/* Distribute form */}
              <form onSubmit={handleExecuteDistribution} className="space-y-4 pt-4 border-t border-gray-100 dark:border-zinc-850">
                <h4 className="font-bold text-sm text-gray-850 dark:text-white">
                  {lang === "BN" ? "বার্ষিক লভ্যাংশ বন্টন প্যানেল" : "Year-End Profit Distribution Panel"}
                </h4>
                <div>
                  <label className="block text-xs font-bold text-gray-650 dark:text-gray-300 mb-1">
                    {lang === "BN" ? "বন্টনযোগ্য মুনাফার পরিমাণ (BDT)" : "Amount to Distribute (BDT)"} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={distAmountBdt}
                    onChange={(e) => setDistAmountBdt(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-zinc-850 dark:border-zinc-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-650 dark:text-gray-300 mb-1">
                    {lang === "BN" ? "রিজার্ভ স্থানান্তর ক্যাটাগরি" : "FD Reserve Transfer Source"}
                  </label>
                  <select
                    value={distPaymentMode}
                    onChange={(e) => setDistPaymentMode(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-850 dark:border-zinc-700 dark:text-white"
                  >
                    <option value="CASH">{lang === "BN" ? "নগদ তহবিল (Cash)" : "Cash"}</option>
                    <option value="BANK">{lang === "BN" ? "ব্যাংক হিসাব (Bank)" : "Bank Account"}</option>
                  </select>
                </div>

                {/* Calculation preview */}
                {parseFloat(distAmountBdt) > 0 && (
                  <div className="p-4 bg-gray-50 dark:bg-zinc-850 border rounded-lg text-xs space-y-2 text-gray-650 dark:text-gray-350">
                    <span className="block font-bold text-[10px] text-gray-400 uppercase tracking-wider mb-2">calculated fund splits</span>
                    <div className="flex justify-between">
                      <span>Business Dev Fund (95%):</span>
                      <strong className="font-mono text-gray-800 dark:text-white">
                        {(parseFloat(distAmountBdt) * 0.95).toLocaleString(undefined, { minimumFractionDigits: 2 })} BDT
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Poor & Destitute Fund (2.5%):</span>
                      <strong className="font-mono text-gray-800 dark:text-white">
                        {(parseFloat(distAmountBdt) * 0.025).toLocaleString(undefined, { minimumFractionDigits: 2 })} BDT
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Sports & Entertainment Fund (2.5%):</span>
                      <strong className="font-mono text-gray-800 dark:text-white">
                        {(parseFloat(distAmountBdt) - (Math.round(parseFloat(distAmountBdt) * 0.95 * 100) / 100) - (Math.round(parseFloat(distAmountBdt) * 0.025 * 100) / 100)).toLocaleString(undefined, { minimumFractionDigits: 2 })} BDT
                      </strong>
                    </div>
                    <div className="flex justify-between border-t pt-2 mt-2 font-bold text-emerald-600 dark:text-emerald-400">
                      <span>Fixed Deposit Reserve (7.5%):</span>
                      <strong className="font-mono">
                        {(parseFloat(distAmountBdt) * 0.075).toLocaleString(undefined, { minimumFractionDigits: 2 })} BDT
                      </strong>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submittingDist}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow transition disabled:opacity-50"
                >
                  {submittingDist ? (lang === "BN" ? "বন্টন করা হচ্ছে..." : "Processing...") : (lang === "BN" ? "বন্টন ও রিজার্ভ ফান্ড সম্পন্ন করুন" : "Execute & Transfer")}
                </button>
              </form>
            </div>
          </div>

          {/* Right panel: History of distributions */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-gray-150 dark:border-zinc-800 shadow-md">
              <h3 className="font-bold text-gray-800 dark:text-white mb-4">
                {lang === "BN" ? "পূর্ববর্তী লভ্যাংশ বন্টন ও স্থানান্তর ইতিহাস" : "Previous Distributions & Transfers History"}
              </h3>
              {distributionsList.length === 0 ? (
                <p className="text-sm text-gray-500">কোনো লভ্যাংশ বন্টনের তথ্য পাওয়া যায়নি।</p>
              ) : (
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-zinc-850 text-gray-500 font-bold border-b dark:border-zinc-800">
                      <tr>
                        <th className="px-4 py-3">{lang === "BN" ? "তারিখ" : "Date"}</th>
                        <th className="px-4 py-3">{lang === "BN" ? "বন্টন মুনাফা" : "Distributed Profit"}</th>
                        <th className="px-4 py-3">{lang === "BN" ? "ব্যবসা উন্নয়ন (95%)" : "Biz Dev (95%)"}</th>
                        <th className="px-4 py-3">{lang === "BN" ? "দরিদ্র তহবিল (2.5%)" : "Poor (2.5%)"}</th>
                        <th className="px-4 py-3">{lang === "BN" ? "ক্রীড়া (2.5%)" : "Sports (2.5%)"}</th>
                        <th className="px-4 py-3">{lang === "BN" ? "স্থায়ী আমানত (7.5%)" : "FD Reserve (7.5%)"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                      {distributionsList.map((d) => (
                        <tr key={d.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30">
                          <td className="px-4 py-3 text-gray-500 font-mono">
                            {new Date(d.createdAt).toLocaleDateString(lang === "BN" ? "bn-BD" : "en-US")}
                          </td>
                          <td className="px-4 py-3 font-bold">{(d.totalProfit / 100).toLocaleString()} BDT</td>
                          <td className="px-4 py-3 text-gray-750 dark:text-zinc-350">{(d.devFund / 100).toLocaleString()}</td>
                          <td className="px-4 py-3 text-gray-750 dark:text-zinc-350">{(d.destituteFund / 100).toLocaleString()}</td>
                          <td className="px-4 py-3 text-gray-750 dark:text-zinc-350">{(d.sportsFund / 100).toLocaleString()}</td>
                          <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400 font-bold">{(d.fixedDeposit / 100).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
