"use client";

import { useEffect, useState } from "react";
import { Toast, useToast } from "@/components/ui/ConfirmModal";
import { useLanguage } from "@/providers/LanguageProvider";
import { Calendar, FileText, Plus, Trash2, CheckCircle2, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";

export default function JournalVouchersPage() {
  const { lang } = useLanguage();
  const { toast, showToast } = useToast();

  // Dataset states
  const [accounts, setAccounts] = useState<any[]>([]);
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Form toggles & inputs
  const [showForm, setShowForm] = useState(false);
  const [journalDesc, setJournalDesc] = useState("");
  const [journalDate, setJournalDate] = useState(new Date().toISOString().split("T")[0]);
  const [journalRef, setJournalRef] = useState("");
  const [journalLines, setJournalLines] = useState<Array<{ accountCode: string; amount: string; type: "DEBIT" | "CREDIT" }>>([
    { accountCode: "", amount: "", type: "DEBIT" },
    { accountCode: "", amount: "", type: "CREDIT" }
  ]);
  const [submitting, setSubmitting] = useState(false);

  // Load Chart of Accounts
  const loadCOA = async () => {
    try {
      const res = await fetch("/api/accounting/accounts");
      const data = await res.json();
      setAccounts(res.ok && Array.isArray(data) ? data : (data?.accounts || []));
    } catch (err) {
      console.error("Error loading accounts:", err);
      setAccounts([]);
    }
  };

  // Load Journal Entries (paginated)
  const loadJournals = async (page = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/accounting/journal?page=${page}&limit=10`);
      const data = await res.json();
      if (res.ok && data?.entries) {
        setJournalEntries(data.entries);
        setCurrentPage(data.pagination?.currentPage || 1);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalItems(data.pagination?.totalItems || 0);
      } else {
        setJournalEntries([]);
      }
    } catch (err) {
      console.error("Error loading journal entries:", err);
      setJournalEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCOA();
    loadJournals(1);
  }, []);

  const handleAddLine = () => {
    setJournalLines([...journalLines, { accountCode: "", amount: "", type: "DEBIT" }]);
  };

  const handleRemoveLine = (index: number) => {
    if (journalLines.length <= 2) return;
    const lines = [...journalLines];
    lines.splice(index, 1);
    setJournalLines(lines);
  };

  const handleLineChange = (index: number, key: string, value: string) => {
    const lines = [...journalLines] as any;
    lines[index][key] = value;
    setJournalLines(lines);
  };

  // Calculations for live validation in UI
  const totalDebit = journalLines
    .filter((l) => l.type === "DEBIT")
    .reduce((sum, l) => sum + (parseFloat(l.amount) || 0), 0);

  const totalCredit = journalLines
    .filter((l) => l.type === "CREDIT")
    .reduce((sum, l) => sum + (parseFloat(l.amount) || 0), 0);

  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.001 && totalDebit > 0;

  const handleCreateJournal = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isBalanced) {
      showToast(
        "error",
        lang === "BN" ? "অসামঞ্জস্যপূর্ণ জার্নাল" : "Unbalanced Entry",
        lang === "BN" ? "মোট ডেবিট এবং মোট ক্রেডিট অবশ্যই সমান হতে হবে।" : "Total debits and credits must be equal and greater than zero."
      );
      return;
    }

    setSubmitting(true);
    const parsedLines = journalLines.map((l) => ({
      accountCode: l.accountCode,
      amount: Math.round((parseFloat(l.amount) || 0) * 100), // convert to Paisa
      type: l.type
    }));

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
        showToast(
          "error",
          lang === "BN" ? "ব্যর্থ হয়েছে" : "Failed",
          data.message || (lang === "BN" ? "ভাউচার পোস্টিং ব্যর্থ হয়েছে।" : "Journal voucher posting failed.")
        );
      } else {
        showToast(
          "success",
          lang === "BN" ? "ভাউচার সম্পন্ন" : "Success",
          lang === "BN" ? "জার্নাল ভাউচার সফলভাবে পোস্ট করা হয়েছে।" : "Journal voucher posted successfully."
        );
        setJournalDesc("");
        setJournalRef("");
        setJournalLines([
          { accountCode: "", amount: "", type: "DEBIT" },
          { accountCode: "", amount: "", type: "CREDIT" }
        ]);
        setShowForm(false);
        loadJournals(1);
      }
    } catch (err) {
      console.error(err);
      showToast(
        "error",
        lang === "BN" ? "সার্ভার সমস্যা" : "Server Error",
        lang === "BN" ? "সার্ভারে যোগাযোগ করতে সমস্যা হয়েছে।" : "Connection error."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const labels = {
    BN: {
      title: "জার্নাল ভাউচারসমূহ",
      desc: "সিস্টেমের সাধারণ খতিয়ান ভাউচার তৈরি করুন এবং পূর্ববর্তী জার্নাল এন্ট্রি রেকর্ড পর্যবেক্ষণ করুন।",
      recordBtn: "+ নতুন ভাউচার পোস্ট করুন",
      closeBtn: "ফর্ম বন্ধ করুন",
      description: "ভাউচার বিবরণ",
      date: "ভাউচার তারিখ",
      reference: "রেফারেন্স (ঐচ্ছিক)",
      linesTitle: "দাখিলা লাইনসমূহ (Journal lines)",
      account: "লেজার হিসাব",
      type: "টাইপ",
      amount: "পরিমাণ (BDT)",
      debit: "ডেবিট (+)",
      credit: "ক্রেডিট (-)",
      totalDebit: "মোট ডেবিট:",
      totalCredit: "মোট ক্রেডিট:",
      submit: "ভাউচার পোস্ট করুন",
      emptyList: "কোনো ভাউচার পাওয়া যায়নি।",
      loading: "ভাউচার তথ্য লোড করা হচ্ছে...",
      balanced: "ভারসাম্যপূর্ণ (Balanced)",
      unbalanced: "ভারসাম্যহীন (Unbalanced)",
      debitLabel: "ডেবিট",
      creditLabel: "ক্রেডিট",
      lineNo: "লাইন #",
      addLine: "+ লাইন যুক্ত করুন",
      removeLine: "মুছুন",
    },
    EN: {
      title: "Journal Vouchers Registry",
      desc: "Record manual double-entry vouchers to adjust account balances, or review chronological journal logs.",
      recordBtn: "+ Record Journal Entry",
      closeBtn: "Close Form",
      description: "Description / Narration",
      date: "Posting Date",
      reference: "Reference Number (Optional)",
      linesTitle: "Journal Entry Lines",
      account: "Ledger Account",
      type: "Type",
      amount: "Amount (BDT)",
      debit: "Debit (+)",
      credit: "Credit (-)",
      totalDebit: "Total Debit:",
      totalCredit: "Total Credit:",
      submit: "Post Journal Voucher",
      emptyList: "No journal entries found.",
      loading: "Loading journal entries...",
      balanced: "Balanced",
      unbalanced: "Unbalanced",
      debitLabel: "Debit",
      creditLabel: "Credit",
      lineNo: "Line #",
      addLine: "+ Add Line",
      removeLine: "Remove",
    }
  };

  const t = labels[lang];

  return (
    <div className="space-y-6 font-sans">
      <Toast toast={toast} />

      {/* Header and Toggle Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 dark:border-zinc-800 pb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            {t.title}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {t.desc}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`px-4 py-2 text-xs font-bold rounded-lg shadow-md transition-all duration-200 flex items-center gap-1.5 ${
            showForm
              ? "bg-zinc-200 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700"
              : "bg-emerald-600 hover:bg-emerald-700 text-white"
          }`}
        >
          {showForm ? t.closeBtn : t.recordBtn}
        </button>
      </div>

      {/* Create Voucher Form */}
      {showForm && (
        <div className="flex justify-center transition-all">
          <form
            onSubmit={handleCreateJournal}
            className="w-full max-w-4xl bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-250/60 dark:border-zinc-800 shadow-lg space-y-6"
          >
            <div className="flex items-center gap-2 border-b dark:border-zinc-800 pb-3">
              <span className="p-1.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg text-emerald-600 dark:text-emerald-400">
                <Plus className="w-4 h-4" />
              </span>
              <h4 className="font-bold text-sm text-gray-800 dark:text-white">
                {lang === "BN" ? "নতুন ডাবল এন্ট্রি জার্নাল দাখিলা" : "Record New Double Entry Journal Entry"}
              </h4>
            </div>

            {/* General Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5">
                  {t.description} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={journalDesc}
                  onChange={(e) => setJournalDesc(e.target.value)}
                  placeholder={lang === "BN" ? "যেমন: নতুন অফিস চেয়ার ক্রয়" : "e.g. Purchase of office supplies"}
                  className="w-full px-3.5 py-2.5 text-xs border rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-zinc-850 dark:border-zinc-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5">
                  {t.date} <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={journalDate}
                  onChange={(e) => setJournalDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs border rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-zinc-850 dark:border-zinc-700 dark:text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5">
                  {t.reference}
                </label>
                <input
                  type="text"
                  value={journalRef}
                  onChange={(e) => setJournalRef(e.target.value)}
                  placeholder="JV-2026-001"
                  className="w-full px-3.5 py-2.5 text-xs border rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-zinc-850 dark:border-zinc-700 dark:text-white"
                />
              </div>
            </div>

            {/* Lines List */}
            <div className="space-y-3 pt-3 border-t dark:border-zinc-800">
              <div className="flex justify-between items-center mb-1">
                <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                  {t.linesTitle}
                </span>
                <span className="text-[10px] text-gray-400">
                  {lang === "BN" ? "* কমপক্ষে ২টি ভিন্ন লাইন প্রয়োজন।" : "* At least 2 lines required."}
                </span>
              </div>

              <div className="space-y-3">
                {journalLines.map((line, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end border border-gray-100 dark:border-zinc-850/65 p-3 rounded-lg bg-gray-50/30 dark:bg-zinc-850/10"
                  >
                    <div className="md:col-span-1 text-xs font-bold text-gray-400 pb-2">
                      {t.lineNo} {index + 1}
                    </div>

                    {/* Account Dropdown */}
                    <div className="md:col-span-5">
                      <label className="block text-[10px] font-bold text-gray-500 mb-1">{t.account}</label>
                      <select
                        required
                        value={line.accountCode}
                        onChange={(e) => handleLineChange(index, "accountCode", e.target.value)}
                        className="w-full px-2.5 py-2 border text-xs rounded-lg dark:bg-zinc-850 dark:border-zinc-700 dark:text-white font-semibold"
                      >
                        <option value="">-- {lang === "BN" ? "হিসাব সিলেক্ট করুন" : "Select Account"} --</option>
                        {accounts.map((acc) => (
                          <option key={acc.id} value={acc.code}>
                            {acc.code} - {acc.name} ({acc.type})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Type Choice */}
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-gray-500 mb-1">{t.type}</label>
                      <select
                        value={line.type}
                        onChange={(e) => handleLineChange(index, "type", e.target.value as any)}
                        className="w-full px-2.5 py-2 border text-xs rounded-lg dark:bg-zinc-850 dark:border-zinc-700 dark:text-white font-semibold"
                      >
                        <option value="DEBIT">{t.debitLabel}</option>
                        <option value="CREDIT">{t.creditLabel}</option>
                      </select>
                    </div>

                    {/* Amount Input */}
                    <div className="md:col-span-3">
                      <label className="block text-[10px] font-bold text-gray-500 mb-1">{t.amount}</label>
                      <input
                        type="number"
                        required
                        step="0.01"
                        min="0.01"
                        value={line.amount}
                        onChange={(e) => handleLineChange(index, "amount", e.target.value)}
                        placeholder="0.00"
                        className="w-full px-2.5 py-2 border text-xs rounded-lg dark:bg-zinc-850 dark:border-zinc-700 dark:text-white font-mono"
                      />
                    </div>

                    {/* Delete Line */}
                    <div className="md:col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(index)}
                        disabled={journalLines.length <= 2}
                        className="p-2 text-red-500 hover:text-white border border-red-200/50 hover:bg-red-500 rounded-lg transition disabled:opacity-30 disabled:pointer-events-none"
                        title={lang === "BN" ? "লাইন মুছুন" : "Delete Line"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add row trigger */}
              <button
                type="button"
                onClick={handleAddLine}
                className="mt-2 text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 hover:underline"
              >
                <Plus className="w-4 h-4" />
                {t.addLine}
              </button>
            </div>

            {/* Validation Panel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl border border-dashed dark:border-zinc-800 text-xs bg-gray-50/50 dark:bg-zinc-850/10">
              <div className="flex flex-col gap-1">
                <span className="text-gray-400 font-bold uppercase text-[10px]">{t.totalDebit}</span>
                <span className="font-mono text-base font-black text-gray-700 dark:text-white">
                  {totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })} BDT
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-gray-400 font-bold uppercase text-[10px]">{t.totalCredit}</span>
                <span className="font-mono text-base font-black text-gray-700 dark:text-white">
                  {totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })} BDT
                </span>
              </div>
              <div className="flex items-center gap-2 md:justify-end">
                {isBalanced ? (
                  <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-450 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 rounded-lg font-bold border border-emerald-200/30">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t.balanced}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-amber-600 dark:text-amber-450 bg-amber-50 dark:bg-amber-950/20 px-3 py-1.5 rounded-lg font-bold border border-amber-200/30">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{t.unbalanced}</span>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !isBalanced}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50 disabled:pointer-events-none uppercase tracking-wider"
            >
              {submitting ? (lang === "BN" ? "পোস্ট করা হচ্ছে..." : "Posting Entry...") : t.submit}
            </button>
          </form>
        </div>
      )}

      {/* Journal Vouchers List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
            <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
            <span className="text-xs">{t.loading}</span>
          </div>
        ) : journalEntries.length === 0 ? (
          <div className="py-16 text-center text-gray-400 border border-dashed rounded-xl dark:border-zinc-800">
            <FileText className="w-8 h-8 text-gray-300 dark:text-zinc-700 mx-auto mb-2" />
            <p className="text-xs italic">{t.emptyList}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {journalEntries.map((entry) => (
              <div
                key={entry.id}
                className="bg-white dark:bg-zinc-900 rounded-xl border border-black/5 dark:border-zinc-800/80 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                {/* Entry Header */}
                <div className="p-4 bg-gray-50/80 dark:bg-zinc-850/60 border-b dark:border-zinc-800 flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-xs">
                  <div>
                    <h4 className="text-gray-800 dark:text-white text-sm font-bold">{entry.description}</h4>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-gray-400 mt-1 font-medium">
                      <span>ID: <strong className="font-mono text-[10px] text-gray-500 dark:text-gray-300">{entry.id.substring(0, 8).toUpperCase()}</strong></span>
                      <span>Ref: <strong className="text-gray-500 dark:text-gray-300">{entry.reference || "N/A"}</strong></span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-350 self-start sm:self-auto font-mono text-[11px] font-bold bg-white dark:bg-zinc-900 px-2.5 py-1 rounded-md border border-gray-100 dark:border-zinc-800 shadow-2xs">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>{new Date(entry.date).toLocaleDateString(lang === "BN" ? "bn-BD" : "en-US", { dateStyle: "medium" })}</span>
                  </div>
                </div>

                {/* Entry Lines */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-gray-450 bg-gray-50/20 dark:bg-zinc-900 border-b dark:border-zinc-855 font-bold">
                        <th className="px-6 py-2.5">{t.account}</th>
                        <th className="px-6 py-2.5 text-right font-bold text-gray-600 dark:text-gray-400">{t.debit}</th>
                        <th className="px-6 py-2.5 text-right font-bold text-gray-600 dark:text-gray-400">{t.credit}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-zinc-850">
                      {entry.lines.map((line: any) => (
                        <tr
                          key={line.id}
                          className="hover:bg-gray-50/20 dark:hover:bg-zinc-850/10 transition-colors"
                        >
                          <td className="px-6 py-3">
                            <div className={`flex flex-col ${line.type === "CREDIT" ? "pl-8" : ""}`}>
                              <span className={`font-semibold ${line.type === "DEBIT" ? "text-gray-800 dark:text-white" : "text-gray-500 dark:text-gray-400"}`}>
                                {line.account.name}
                              </span>
                              <span className="text-[10px] text-gray-400 font-mono mt-0.5">Code: {line.account.code}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3 text-right font-mono font-bold text-gray-800 dark:text-zinc-200">
                            {line.type === "DEBIT" ? (line.amount / 100).toLocaleString(undefined, { minimumFractionDigits: 2 }) : "—"}
                          </td>
                          <td className="px-6 py-3 text-right font-mono font-bold text-gray-800 dark:text-zinc-200">
                            {line.type === "CREDIT" ? (line.amount / 100).toLocaleString(undefined, { minimumFractionDigits: 2 }) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-100 dark:border-zinc-850/80 pt-4 text-xs font-semibold">
                <span className="text-gray-500">
                  {lang === "BN"
                    ? `মোট ${totalItems.toLocaleString("bn-BD")} টি ভাউচারের মধ্যে পৃষ্ঠা ${currentPage.toLocaleString("bn-BD")} / ${totalPages.toLocaleString("bn-BD")}`
                    : `Page ${currentPage} of ${totalPages} (Total ${totalItems} vouchers)`
                  }
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => loadJournals(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 border rounded-lg bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800 transition disabled:opacity-40 disabled:pointer-events-none"
                    title={lang === "BN" ? "পূর্ববর্তী পৃষ্ঠা" : "Previous Page"}
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  </button>
                  <button
                    onClick={() => loadJournals(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 border rounded-lg bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800 transition disabled:opacity-40 disabled:pointer-events-none"
                    title={lang === "BN" ? "পরবর্তী পৃষ্ঠা" : "Next Page"}
                  >
                    <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
