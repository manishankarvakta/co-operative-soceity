"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/providers/LanguageProvider";

export default function ReportsPage() {
  const [lang, setLang] = useState<"BN" | "EN">("BN");
  const [reportType, setReportType] = useState<
    "COLLECTION" | "EXPENSE" | "MEMBER" | "BANK" | "BALANCE_SHEET" | "PROFIT_LOSS"
  >("COLLECTION");

  // Filter values
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [selectedBankAccountId, setSelectedBankAccountId] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedPaymentMode, setSelectedPaymentMode] = useState("");

  // Lists for dropdown filters
  const [members, setMembers] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  // Report results
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Load selection options
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const [memRes, bankRes, projRes] = await Promise.all([
          fetch("/api/members?limit=100"),
          fetch("/api/bank/accounts"),
          fetch("/api/projects")
        ]);
        const memData = await memRes.json();
        const bankData = await bankRes.json();
        const projData = await projRes.json();

        setMembers(memData.members || []);
        setBankAccounts(bankData || []);
        setProjects(projData || []);
      } catch (err) {
        console.error("Error loading report options:", err);
      }
    };
    loadFilterOptions();
  }, []);

  const loadReport = async () => {
    setLoading(true);
    setReportData(null);
    try {
      let url = "";
      if (reportType === "COLLECTION") {
        url = `/api/reports/collection?startDate=${startDate}&endDate=${endDate}&paymentMode=${selectedPaymentMode}`;
      } else if (reportType === "EXPENSE") {
        url = `/api/reports/expense?startDate=${startDate}&endDate=${endDate}&projectId=${selectedProjectId}&category=${selectedCategory}`;
      } else if (reportType === "MEMBER") {
        url = `/api/reports/member-statement?memberId=${selectedMemberId}`;
      } else if (reportType === "BANK") {
        url = `/api/reports/bank-statement?bankAccountId=${selectedBankAccountId}&startDate=${startDate}&endDate=${endDate}`;
      } else if (reportType === "BALANCE_SHEET") {
        url = `/api/accounting/reports?type=BALANCE_SHEET`;
      } else if (reportType === "PROFIT_LOSS") {
        url = `/api/accounting/reports?type=PROFIT_LOSS`;
      }

      const res = await fetch(url);
      const data = await res.json();
      setReportData(data);
    } catch (err) {
      alert("রিপোর্ট লোড করতে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  // Triggers print dialog
  const handlePrint = () => {
    window.print();
  };

  // Helper for CSV compilation
  const handleExportCSV = () => {
    if (!reportData) return;

    let headers: string[] = [];
    let rows: any[][] = [];
    let filename = `report_${reportType.toLowerCase()}_${Date.now()}.csv`;

    if (reportType === "COLLECTION") {
      headers = ["Date", "Receipt No", "Member Code", "Member Name", "Payment Mode", "Amount (BDT)", "Remarks"];
      rows = (reportData.details || []).map((d: any) => [
        new Date(d.date).toLocaleDateString(),
        d.receiptCode,
        d.memberCode,
        d.memberName,
        d.paymentMode,
        d.amountBdt,
        d.remarks
      ]);
    } else if (reportType === "EXPENSE") {
      headers = ["Date", "Category", "Project", "Logged By", "Approved By", "Amount (BDT)", "Location"];
      rows = (reportData.details || []).map((e: any) => [
        new Date(e.date).toLocaleDateString(),
        e.category,
        e.projectName,
        e.loggedBy,
        e.approvedBy,
        e.amountBdt,
        e.location
      ]);
    } else if (reportType === "MEMBER") {
      headers = ["Date", "Receipt Code", "Billing Dues / Period", "Shares Count", "Amount (BDT)"];
      rows = (reportData.passbook || []).map((p: any) => [
        new Date(p.date).toLocaleDateString(),
        p.receiptCode,
        `${p.type} (${p.description})`,
        p.shares,
        p.amountBdt
      ]);
    } else if (reportType === "BANK") {
      headers = ["Date", "Reference", "Type", "Status", "Withdrawal (BDT)", "Deposit (BDT)", "Running Balance (BDT)"];
      rows = (reportData.details || []).map((d: any) => [
        new Date(d.date).toLocaleDateString(),
        d.reference,
        d.type,
        d.isApproved ? "Approved" : "Pending",
        d.debitBdt || "—",
        d.creditBdt || "—",
        d.runningBalanceBdt
      ]);
    } else if (reportType === "BALANCE_SHEET") {
      headers = ["Account Code", "Ledger Account Name", "Account Type", "Balance (BDT)"];
      const assets = (reportData.assets || []).map((a: any) => [a.code, a.name, "ASSET", a.balance]);
      const liab = (reportData.liabilities || []).map((l: any) => [l.code, l.name, "LIABILITY", l.balance]);
      const eq = (reportData.equity || []).map((e: any) => [e.code, e.name, "EQUITY", e.balance]);
      rows = [...assets, ...liab, ...eq];
    } else if (reportType === "PROFIT_LOSS") {
      headers = ["Account Code", "Ledger Account Name", "Account Type", "Balance (BDT)"];
      const rev = (reportData.revenue || []).map((r: any) => [r.code, r.name, "REVENUE", r.balance]);
      const exp = (reportData.expenses || []).map((e: any) => [e.code, e.name, "EXPENSE", e.balance]);
      rows = [...rev, ...exp];
    }

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const labels = {
    BN: {
      title: "রিপোর্ট ও আর্থিক স্টেটমেন্ট ড্যাশবোর্ড",
      subtitle: "সমিতির সার্বিক জমা কালেকশন, অফিস খরচ, খতিয়ান ব্যালেন্স শীট এবং পাসবই স্টেটমেন্ট ডাউনলোড করুন।",
      weekly: "সাপ্তাহিক সঞ্চয়",
      admission: "ভর্তি ফি",
      penalty: "জরিমানা",
      other: "অন্যান্য",
      loading: "রিপোর্ট জেনারেট হচ্ছে..."
    },
    EN: {
      title: "Reports Catalog Workspace",
      subtitle: "Analyze and export PDF/CSV statements of collections, bank ledger files, and balances.",
      weekly: "Weekly Savings",
      admission: "Admission Fee",
      penalty: "Late Fines/Penalty",
      other: "Others",
      loading: "Generating statement..."
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <style>{`
        @media print {
          nav, header, aside, .no-print {
            display: none !important;
          }
          body {
            background: white !important;
            color: black !important;
          }
          .print-area {
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      {/* Header Panel */}
      <div className="flex justify-between items-center border-b pb-4 border-gray-200 dark:border-zinc-800 no-print">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{labels[lang].title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{labels[lang].subtitle}</p>
        </div>
      </div>

      {/* Reports Tabs selection */}
      <div className="flex flex-wrap gap-3 no-print">
        {[
          { id: "COLLECTION", labelBN: "জমা কালেকশন রিপোর্ট", labelEN: "Collection Report" },
          { id: "EXPENSE", labelBN: "খরচ বিবরণী রিপোর্ট", labelEN: "Expense Report" },
          { id: "MEMBER", labelBN: "সদস্য খতিয়ান পাসবই", labelEN: "Member Passbook" },
          { id: "BANK", labelBN: "ব্যাংক হিসাব খতিয়ান", labelEN: "Bank Account Ledger" },
          { id: "BALANCE_SHEET", labelBN: "ব্যালেন্স শীট বিবরণী", labelEN: "Balance Sheet" },
          { id: "PROFIT_LOSS", labelBN: "লাভ-ক্ষতি আয় বিবরণী", labelEN: "Profit & Loss" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setReportType(tab.id as any);
              setReportData(null);
            }}
            className={`px-4 py-2 text-xs font-bold rounded-lg shadow-sm border transition ${
              reportType === tab.id
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50"
            }`}
          >
            {lang === "BN" ? tab.labelBN : tab.labelEN}
          </button>
        ))}
      </div>

      {/* Dynamic Filter Console */}
      <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-gray-150 dark:border-zinc-800 shadow no-print space-y-4">
        <h4 className="font-bold text-sm text-gray-800 dark:text-white uppercase tracking-wider">
          {lang === "BN" ? "রিপোর্ট ফিল্টারিং অপশন" : "Statement Filter Parameters"}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* Collection filters */}
          {reportType === "COLLECTION" && (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">{lang === "BN" ? "পেমেন্ট মোড" : "Payment Mode"}</label>
                <select
                  value={selectedPaymentMode}
                  onChange={(e) => setSelectedPaymentMode(e.target.value)}
                  className="w-full text-xs px-3 py-2 border rounded-lg dark:bg-zinc-850 dark:border-zinc-700 dark:text-white"
                >
                  <option value="">{lang === "BN" ? "সকল পেমেন্ট" : "All Modes"}</option>
                  <option value="CASH">CASH (নগদ)</option>
                  <option value="BANK">BANK (ব্যাংক)</option>
                </select>
              </div>
            </>
          )}

          {/* Expense filters */}
          {reportType === "EXPENSE" && (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">{lang === "BN" ? "প্রজেক্ট" : "Project Name"}</label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full text-xs px-3 py-2 border rounded-lg dark:bg-zinc-850 dark:border-zinc-700 dark:text-white"
                >
                  <option value="">{lang === "BN" ? "সকল প্রজেক্ট / সাধারণ খরচ" : "All Project / General Cost"}</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">{lang === "BN" ? "খরচের ক্যাটাগরি" : "Expense Category"}</label>
                <input
                  type="text"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  placeholder="যেমন: অফিস ভাড়া"
                  className="w-full text-xs px-3 py-2 border rounded-lg dark:bg-zinc-850 dark:border-zinc-700 dark:text-white"
                />
              </div>
            </>
          )}

          {/* Member filters */}
          {reportType === "MEMBER" && (
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">{lang === "BN" ? "মেম্বার নির্বাচন করুন" : "Select ERP Member"}</label>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="w-full text-xs px-3 py-2 border rounded-lg dark:bg-zinc-850 dark:border-zinc-700 dark:text-white"
              >
                <option value="">-- {lang === "BN" ? "মেম্বার সিলেক্ট করুন" : "Select Member"} --</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.memberCode} - {m.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Bank filters */}
          {reportType === "BANK" && (
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">{lang === "BN" ? "ব্যাংক অ্যাকাউন্ট" : "Bank Account"}</label>
              <select
                value={selectedBankAccountId}
                onChange={(e) => setSelectedBankAccountId(e.target.value)}
                className="w-full text-xs px-3 py-2 border rounded-lg dark:bg-zinc-850 dark:border-zinc-700 dark:text-white"
              >
                <option value="">-- {lang === "BN" ? "অ্যাকাউন্ট সিলেক্ট করুন" : "Select Account"} --</option>
                {bankAccounts.map((b) => (
                  <option key={b.id} value={b.id}>{b.name} ({b.accountNumber})</option>
                ))}
              </select>
            </div>
          )}

          {/* Date range inputs (Not for balance sheet & profit/loss) */}
          {reportType !== "BALANCE_SHEET" && reportType !== "PROFIT_LOSS" && reportType !== "MEMBER" && (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">{lang === "BN" ? "শুরুর তারিখ" : "Start Date"}</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 border rounded-lg dark:bg-zinc-850 dark:border-zinc-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">{lang === "BN" ? "শেষের তারিখ" : "End Date"}</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 border rounded-lg dark:bg-zinc-850 dark:border-zinc-700 dark:text-white"
                />
              </div>
            </>
          )}

          <button
            onClick={loadReport}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-md transition"
          >
            {lang === "BN" ? "রিপোর্ট খুঁজুন" : "Fetch Report"}
          </button>
        </div>
      </div>

      {/* Reports display and export panels */}
      {loading ? (
        <p className="text-center text-sm text-gray-500">{labels[lang].loading}</p>
      ) : !reportData ? (
        <div className="p-8 border border-dashed border-gray-300 dark:border-zinc-700 rounded-xl text-center text-sm text-gray-500 bg-gray-50/50 dark:bg-zinc-900/50 no-print">
          {lang === "BN" ? "রিপোর্ট জেনারেট করতে ফিল্টার নির্ধারণ করে 'রিপোর্ট খুঁজুন' বাটনে ক্লিক করুন।" : "Select filters above and click 'Fetch Report' to construct the statement."}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Export bar (Floating Panel) */}
          <div className="p-4 bg-gray-50 dark:bg-zinc-850 border rounded-lg flex justify-between items-center no-print">
            <span className="text-xs text-gray-500 font-bold">
              {lang === "BN" ? "রিপোর্ট এক্সপোর্ট করুন:" : "Available Statement Export formats:"}
            </span>
            <div className="flex gap-3">
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-white dark:bg-zinc-900 border text-xs font-bold rounded hover:bg-gray-100 transition shadow-sm"
              >
                🖨️ {lang === "BN" ? "প্রিন্ট / PDF" : "Print / PDF"}
              </button>
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-250 dark:border-emerald-800 text-xs font-bold rounded hover:bg-emerald-100 transition shadow-sm"
              >
                📥 {lang === "BN" ? "CSV ডাউনলোড" : "CSV spreadsheet"}
              </button>
            </div>
          </div>

          {/* Print Render Content Container */}
          <div className="p-8 bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-xl shadow-md print-area">
            {/* Header branding for print/reports */}
            <div className="text-center mb-6 border-b pb-4 dark:border-zinc-800">
              <h2 className="text-xl font-black text-gray-800 dark:text-white">উত্থান বহুমুখী সমবায় সমিতি লিমিটেড</h2>
              <span className="text-xs text-gray-500 uppercase tracking-widest block mt-1 font-semibold">
                {reportType === "COLLECTION"
                  ? "Deposit Collections Report (আমানত কালেকশন বিবরণী)"
                  : reportType === "EXPENSE"
                  ? "Expenditures Statement (ব্যয় খতিয়ান বিবরণী)"
                  : reportType === "MEMBER"
                  ? "Member Passbook statement (সদস্য পাসবই খতিয়ান)"
                  : reportType === "BANK"
                  ? "Bank Statement sheet (ব্যাংক হিসাব খতিয়ান বিবরণী)"
                  : reportType === "BALANCE_SHEET"
                  ? "Balance Sheet Statement (ব্যালেন্স শীট)"
                  : "Profit and Loss Statement (লাভ-ক্ষতি আয় বিবরণী)"}
              </span>
              <span className="text-[10px] text-gray-400 block mt-1">
                {lang === "BN" ? "উত্তোলনের তারিখ" : "Run date"}: {new Date().toLocaleDateString(lang === "BN" ? "bn-BD" : "en-US")}
              </span>
            </div>

            {/* Render 1: Collection Report */}
            {reportType === "COLLECTION" && (
              <div className="space-y-6">
                {/* Aggregates widgets */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div className="p-3 bg-gray-50 dark:bg-zinc-850 rounded border">
                    <span className="text-gray-400 font-bold block mb-1">মোট আদায়</span>
                    <strong className="text-base text-gray-800 dark:text-white">{reportData.totals.totalCollectedBdt.toLocaleString()} BDT</strong>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-zinc-850 rounded border">
                    <span className="text-gray-400 font-bold block mb-1">নগদ আদায় (CASH)</span>
                    <strong className="text-base text-emerald-600 dark:text-emerald-400">{reportData.totals.totalCashBdt.toLocaleString()} BDT</strong>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-zinc-850 rounded border">
                    <span className="text-gray-400 font-bold block mb-1">ব্যাংক আদায় (BANK)</span>
                    <strong className="text-base text-blue-600 dark:text-blue-400">{reportData.totals.totalBankBdt.toLocaleString()} BDT</strong>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-zinc-850 rounded border">
                    <span className="text-gray-400 font-bold block mb-1">জরিমানা জরিমানা আদায়</span>
                    <strong className="text-base text-amber-600">{reportData.totals.penaltyBdt.toLocaleString()} BDT</strong>
                  </div>
                </div>

                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-zinc-850 font-bold text-gray-500 border-b">
                      <tr>
                        <th className="px-4 py-2">{lang === "BN" ? "তারিখ" : "Date"}</th>
                        <th className="px-4 py-2">{lang === "BN" ? "রসিদ নম্বর" : "Receipt No"}</th>
                        <th className="px-4 py-2">{lang === "BN" ? "মেম্বার কোড" : "Member Code"}</th>
                        <th className="px-4 py-2">{lang === "BN" ? "নাম" : "Name"}</th>
                        <th className="px-4 py-2">{lang === "BN" ? "মোড" : "Mode"}</th>
                        <th className="px-4 py-2 text-right">{lang === "BN" ? "আদায়কৃত অর্থ" : "Amount"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {reportData.details.map((d: any) => (
                        <tr key={d.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 text-gray-500 font-mono">
                            {new Date(d.date).toLocaleDateString(lang === "BN" ? "bn-BD" : "en-US")}
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-emerald-700">{d.receiptCode}</td>
                          <td className="px-4 py-3 font-mono">{d.memberCode}</td>
                          <td className="px-4 py-3 font-semibold text-gray-800">{d.memberName}</td>
                          <td className="px-4 py-3 text-gray-550 uppercase font-bold text-[10px]">{d.paymentMode}</td>
                          <td className="px-4 py-3 text-right font-mono font-bold">{d.amountBdt.toLocaleString()} BDT</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Render 2: Expense Report */}
            {reportType === "EXPENSE" && (
              <div className="space-y-4">
                <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl flex justify-between items-center text-base font-bold">
                  <span className="text-amber-800">মোট অনুমোদিত/লগড ব্যয়:</span>
                  <span className="font-mono text-amber-800">{reportData.totalExpenseBdt.toLocaleString()} BDT</span>
                </div>

                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-zinc-850 font-bold text-gray-500 border-b">
                      <tr>
                        <th className="px-4 py-2">{lang === "BN" ? "তারিখ" : "Date"}</th>
                        <th className="px-4 py-2">{lang === "BN" ? "ক্যাটাগরি" : "Category"}</th>
                        <th className="px-4 py-2">{lang === "BN" ? "প্রজেক্ট" : "Project"}</th>
                        <th className="px-4 py-2">{lang === "BN" ? "স্থান/বিবরণ" : "Location"}</th>
                        <th className="px-4 py-2">{lang === "BN" ? "অবস্থা" : "Status"}</th>
                        <th className="px-4 py-2 text-right">{lang === "BN" ? "ব্যয়িত অর্থ" : "Amount"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {reportData.details.map((e: any) => (
                        <tr key={e.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 text-gray-500 font-mono">
                            {new Date(e.date).toLocaleDateString(lang === "BN" ? "bn-BD" : "en-US")}
                          </td>
                          <td className="px-4 py-3 font-semibold text-gray-800">{e.category}</td>
                          <td className="px-4 py-3 text-gray-550">{e.projectName}</td>
                          <td className="px-4 py-3 text-gray-500 font-mono text-[10px]">{e.location}</td>
                          <td className="px-4 py-3 uppercase text-[10px] font-bold">
                            <span className={e.status === "APPROVED" ? "text-emerald-600" : "text-amber-600"}>{e.status}</span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-amber-700">{e.amountBdt.toLocaleString()} BDT</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Render 3: Member Statement Passbook */}
            {reportType === "MEMBER" && (
              <div className="space-y-6">
                {/* Profile blocks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b pb-4 dark:border-zinc-800 text-xs">
                  <div className="space-y-1.5">
                    <span className="block font-bold text-[10px] text-gray-400 uppercase tracking-widest">member profiles info</span>
                    <div>{lang === "BN" ? "নাম" : "Name"}: <strong className="text-gray-800 dark:text-white text-sm">{reportData.memberInfo.name}</strong></div>
                    <div>{lang === "BN" ? "মেম্বার কোড" : "Member Code"}: <strong className="font-mono text-gray-800">{reportData.memberInfo.memberCode}</strong></div>
                    <div>{lang === "BN" ? "মোবাইল" : "Phone"}: <span className="font-mono">{reportData.memberInfo.phone}</span></div>
                    <div>{lang === "BN" ? "ঠিকানা" : "Address"}: <span>{reportData.memberInfo.address}</span></div>
                  </div>
                  <div className="space-y-1.5">
                    <span className="block font-bold text-[10px] text-gray-400 uppercase tracking-widest">balances overview</span>
                    <div>{lang === "BN" ? "মোট শেয়ার সংখ্যা" : "Active Share Count"}: <strong className="text-emerald-600 font-mono text-sm">{reportData.totals.totalShares} Shares</strong></div>
                    <div>{lang === "BN" ? "সঞ্চয় জমা (Savings)" : "Total Savings"}: <strong className="font-mono">{reportData.totals.totalSavingsBdt.toLocaleString()} BDT</strong></div>
                    <div>{lang === "BN" ? "জরিমানা পরিশোধ" : "Fines Paid"}: <span className="font-mono text-red-500">{reportData.totals.totalPenaltyBdt.toLocaleString()} BDT</span></div>
                    <div>{lang === "BN" ? "সর্বমোট জমা তহবিল" : "Net Deposited Value"}: <strong className="font-mono text-gray-800 dark:text-white">{reportData.totals.totalDepositedBdt.toLocaleString()} BDT</strong></div>
                  </div>
                </div>

                {/* Nominee details if present */}
                {reportData.memberInfo.nominee && (
                  <div className="p-4 bg-gray-50 dark:bg-zinc-850 rounded border border-gray-150 text-xs">
                    <span className="block font-bold text-[10px] text-gray-400 uppercase tracking-widest mb-1">nominee details</span>
                    <div className="grid grid-cols-3 gap-2">
                      <div>Name: <strong>{reportData.memberInfo.nominee.name}</strong></div>
                      <div>Relationship: <strong>{reportData.memberInfo.nominee.relationship}</strong></div>
                      <div>Phone: <span className="font-mono">{reportData.memberInfo.nominee.phone}</span></div>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-zinc-850 font-bold text-gray-500 border-b">
                      <tr>
                        <th className="px-4 py-2">{lang === "BN" ? "তারিখ" : "Date"}</th>
                        <th className="px-4 py-2">{lang === "BN" ? "রসিদ কোড" : "Receipt"}</th>
                        <th className="px-4 py-2">{lang === "BN" ? "বিবরণ" : "Dues Category / Dues Period"}</th>
                        <th className="px-4 py-2 text-right">{lang === "BN" ? "অর্জিত শেয়ার" : "Shares"}</th>
                        <th className="px-4 py-2 text-right">{lang === "BN" ? "জমা অর্থ" : "Amount"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {reportData.passbook.map((p: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 text-gray-500 font-mono">
                            {new Date(p.date).toLocaleDateString(lang === "BN" ? "bn-BD" : "en-US")}
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-emerald-700">{p.receiptCode}</td>
                          <td className="px-4 py-3">
                            <span className="font-semibold text-gray-800">{p.type}</span>{" "}
                            <span className="text-[10px] text-gray-400 font-mono">({p.description})</span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-emerald-600 font-semibold">{p.shares > 0 ? p.shares : "—"}</td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-gray-800">{p.amountBdt.toLocaleString()} BDT</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Render 4: Bank Statement */}
            {reportType === "BANK" && (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4 text-xs border-b pb-4 dark:border-zinc-800">
                  <div>
                    <span className="text-gray-400 block mb-1">ব্যাংক বিবরণী</span>
                    <strong className="text-sm text-gray-850 dark:text-white">{reportData.accountInfo.name}</strong>
                    <span className="block font-mono text-gray-400">{reportData.accountInfo.accountNumber}</span>
                  </div>
                  <div className="p-3 bg-gray-55 rounded border">
                    <span className="text-gray-400 block">প্রারম্ভিক ব্যালেন্স</span>
                    <strong className="font-mono text-gray-800">{reportData.totals.startingBalanceBdt.toLocaleString()} BDT</strong>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded border border-emerald-250">
                    <span className="text-emerald-700 block">সমাপনী ব্যালেন্স</span>
                    <strong className="font-mono text-emerald-800">{reportData.totals.closingBalanceBdt.toLocaleString()} BDT</strong>
                  </div>
                </div>

                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-zinc-850 font-bold text-gray-500 border-b">
                      <tr>
                        <th className="px-4 py-2">{lang === "BN" ? "তারিখ" : "Date"}</th>
                        <th className="px-4 py-2">{lang === "BN" ? "রেফারেন্স" : "Reference"}</th>
                        <th className="px-4 py-2">{lang === "BN" ? "টাইপ" : "Type"}</th>
                        <th className="px-4 py-2">{lang === "BN" ? "অনুমোদন" : "Status"}</th>
                        <th className="px-4 py-2 text-right">{lang === "BN" ? "ডেবিট (Withdrawal)" : "Debit"}</th>
                        <th className="px-4 py-2 text-right">{lang === "BN" ? "ক্রেডিট (Deposit)" : "Credit"}</th>
                        <th className="px-4 py-2 text-right">{lang === "BN" ? "জের (Balance)" : "Balance"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {reportData.details.map((d: any) => (
                        <tr key={d.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 text-gray-500 font-mono">
                            {new Date(d.date).toLocaleDateString(lang === "BN" ? "bn-BD" : "en-US")}
                          </td>
                          <td className="px-4 py-3 font-mono text-[10px]">{d.reference}</td>
                          <td className="px-4 py-3 font-bold uppercase text-[10px]">{d.type}</td>
                          <td className="px-4 py-3 uppercase text-[10px] font-bold">
                            <span className={d.isApproved ? "text-emerald-600" : "text-amber-600"}>
                              {d.isApproved ? "Approved" : "Pending Signature"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-red-600">{d.debitBdt > 0 ? d.debitBdt.toLocaleString() : "—"}</td>
                          <td className="px-4 py-3 text-right font-mono text-emerald-600">{d.creditBdt > 0 ? d.creditBdt.toLocaleString() : "—"}</td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-gray-800">{d.runningBalanceBdt.toLocaleString()} BDT</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Render 5: Balance Sheet */}
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

            {/* Render 6: Profit & Loss */}
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

                {/* Net Profit */}
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 rounded-xl flex justify-between items-center text-lg font-black">
                  <span className="text-emerald-800 dark:text-emerald-400 font-bold">Net Profit (নিট মুনাফা):</span>
                  <span className="font-mono text-emerald-800 dark:text-emerald-400">{reportData.totals.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })} BDT</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
