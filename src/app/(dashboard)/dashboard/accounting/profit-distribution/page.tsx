"use client";

import { useEffect, useState } from "react";
import { ConfirmModal, Toast, useToast } from "@/components/ui/ConfirmModal";
import { useLanguage } from "@/providers/LanguageProvider";
import { TrendingUp, Coins, PiggyBank, History, Percent, Sparkles } from "lucide-react";

export default function ProfitDistributionPage() {
  const { lang } = useLanguage();
  const { toast, showToast } = useToast();

  // API datasets
  const [netProfitBdt, setNetProfitBdt] = useState(0);
  const [distributionsList, setDistributionsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [distAmountBdt, setDistAmountBdt] = useState("");
  const [distPaymentMode, setDistPaymentMode] = useState<"CASH" | "BANK">("CASH");
  const [submitting, setSubmitting] = useState(false);

  // Modal confirmation states
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAmount, setPendingAmount] = useState(0);

  // Load stats & history
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
      console.error("Error loading distribution data:", err);
      setDistributionsList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDistributionData();
  }, []);

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(distAmountBdt) || 0;
    if (amount <= 0) {
      showToast(
        "warning",
        lang === "BN" ? "অকার্যকর পরিমাণ" : "Invalid Amount",
        lang === "BN" ? "অনুগ্রহ করে একটি সঠিক লভ্যাংশ বন্টন পরিমাণ লিখুন।" : "Please enter a valid amount to distribute."
      );
      return;
    }
    setPendingAmount(amount);
    setConfirmOpen(true);
  };

  const handleExecute = async () => {
    setConfirmOpen(false);
    setSubmitting(true);
    try {
      const res = await fetch("/api/accounting/profit-distribution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.round(pendingAmount * 100), // convert BDT to Paisa
          paymentMode: distPaymentMode
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(
          "error",
          lang === "BN" ? "বন্টন ব্যর্থ হয়েছে" : "Distribution Failed",
          data.message || (lang === "BN" ? "তহবিল বন্টন সম্পন্ন করা যায়নি।" : "Failed to execute profit distribution.")
        );
      } else {
        showToast(
          "success",
          lang === "BN" ? "বন্টন সম্পন্ন হয়েছে" : "Distribution Successful",
          lang === "BN"
            ? "লভ্যাংশ সফলভাবে বন্টন এবং স্থায়ী আমানতে স্থানান্তর করা হয়েছে।"
            : "Profit distribution splits successfully executed and funds transferred."
        );
        setDistAmountBdt("");
        loadDistributionData();
      }
    } catch (err) {
      console.error(err);
      showToast(
        "error",
        lang === "BN" ? "সার্ভার ত্রুটি" : "Server Error",
        lang === "BN" ? "সার্ভারে সমস্যা হয়েছে।" : "Something went wrong on the server."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Perform split preview matching exact backend logic (calculations in Paisa, formatted as BDT)
  const inputAmountBdt = parseFloat(distAmountBdt) || 0;
  const totalProfitPaisa = Math.round(inputAmountBdt * 100);

  const devFundPaisa = Math.round(totalProfitPaisa * 0.95);
  const destituteFundPaisa = Math.round(totalProfitPaisa * 0.025);
  const sportsFundPaisa = totalProfitPaisa - devFundPaisa - destituteFundPaisa;
  const fixedDepositPaisa = Math.round(totalProfitPaisa * 0.075);

  const devFundBdt = devFundPaisa / 100;
  const destituteFundBdt = destituteFundPaisa / 100;
  const sportsFundBdt = sportsFundPaisa / 100;
  const fixedDepositBdt = fixedDepositPaisa / 100;

  const labels = {
    BN: {
      title: "লভ্যাংশ বন্টন ও তহবিল ব্যবস্থাপনা",
      desc: "সমবায় সমিতির বছর শেষে জমাকৃত মোট মুনাফা থেকে বিভিন্ন তহবিলে নিয়মানুযায়ী লভ্যাংশ বন্টন করুন।",
      availableProfit: "বন্টনযোগ্য বর্তমান নিট মুনাফা (Net Profit)",
      panelTitle: "বার্ষিক লভ্যাংশ বন্টন প্যানেল",
      amountLabel: "বন্টনযোগ্য মুনাফার পরিমাণ (BDT)",
      modeLabel: "রিজার্ভ স্থানান্তর ক্যাটাগরি",
      cashOption: "নগদ তহবিল (Cash)",
      bankOption: "ব্যাংক হিসাব (Bank)",
      splitsTitle: "প্রস্তাবিত তহবিল ভাগসমূহ (Calculated Splits)",
      devSplit: "উন্নয়ন তহবিল (95%):",
      destituteSplit: "দুস্থ কল্যাণ তহবিল (2.5%):",
      sportsSplit: "ক্রীড়া ও সাংস্কৃতিক তহবিল (2.5%):",
      fdReserve: "স্থায়ী আমানত রিজার্ভ (FD Reserve 7.5%):",
      submitBtn: "বন্টন ও রিজার্ভ ফান্ড সম্পন্ন করুন",
      submittingBtn: "বন্টন প্রক্রিয়া চলছে...",
      historyTitle: "পূর্ববর্তী লভ্যাংশ বন্টন ও স্থানান্তর ইতিহাস",
      dateCol: "তারিখ",
      totalCol: "বন্টনকৃত মুনাফা",
      devCol: "উন্নয়ন (95%)",
      poorCol: "দুস্থ (2.5%)",
      sportsCol: "ক্রীড়া (2.5%)",
      fdCol: "স্থায়ী আমানত (7.5%)",
      emptyHistory: "কোনো লভ্যাংশ বন্টনের তথ্য পাওয়া যায়নি।",
      loading: "তথ্য লোড করা হচ্ছে...",
      confirmTitle: "লভ্যাংশ বন্টন নিশ্চিত করুন",
      confirmMsg: `আপনি কি নিশ্চিতভাবে ${pendingAmount.toLocaleString()} BDT লভ্যাংশ বন্টন এবং স্থায়ী আমানতে (FD Reserve) ৭.৫% তহবিল স্থানান্তর প্রক্রিয়াটি সম্পন্ন করতে চান?`,
      confirmYes: "হ্যাঁ, সম্পন্ন করুন",
      confirmNo: "বাতিল করুন"
    },
    EN: {
      title: "Profit Distribution & Reserves",
      desc: "Distribute accumulated net profits to various co-operative funds and fixed reserves at the fiscal year-end.",
      availableProfit: "Available Net Profit (To Distribute)",
      panelTitle: "Year-End Profit Distribution Panel",
      amountLabel: "Amount to Distribute (BDT)",
      modeLabel: "FD Reserve Transfer Source",
      cashOption: "Cash on Hand",
      bankOption: "Bank Account",
      splitsTitle: "Calculated Fund Splits",
      devSplit: "Business Dev Fund (95%):",
      destituteSplit: "Poor & Destitute Fund (2.5%):",
      sportsSplit: "Sports & Cultural Fund (2.5%):",
      fdReserve: "Fixed Deposit Reserve (7.5%):",
      submitBtn: "Execute Distribution & FD Transfer",
      submittingBtn: "Processing Split Allocation...",
      historyTitle: "Previous Distributions & Transfers History",
      dateCol: "Date",
      totalCol: "Distributed Profit",
      devCol: "Biz Dev (95%)",
      poorCol: "Poor (2.5%)",
      sportsCol: "Sports (2.5%)",
      fdCol: "FD Reserve (7.5%)",
      emptyHistory: "No profit distributions recorded yet.",
      loading: "Loading information...",
      confirmTitle: "Confirm Profit Distribution",
      confirmMsg: `Are you sure you want to execute profit distribution of ${pendingAmount.toLocaleString()} BDT, transferring 7.5% of the total to the FD Reserve?`,
      confirmYes: "Yes, Execute",
      confirmNo: "Cancel"
    }
  };

  const t = labels[lang];

  return (
    <div className="space-y-6 font-sans">
      <ConfirmModal
        open={confirmOpen}
        variant="warning"
        title={t.confirmTitle}
        message={t.confirmMsg}
        confirmText={t.confirmYes}
        cancelText={t.confirmNo}
        loading={submitting}
        onConfirm={handleExecute}
        onCancel={() => setConfirmOpen(false)}
      />

      <Toast toast={toast} />

      {/* Header */}
      <div className="border-b border-gray-100 dark:border-zinc-800 pb-4">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          {t.title}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {t.desc}
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
          <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
          <span className="text-xs">{t.loading}</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel: Available profit & Execution */}
          <div className="lg:col-span-1 space-y-6">
            <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200/60 dark:border-zinc-800 shadow-md space-y-6">
              {/* Profit Indicator Card */}
              <div className="p-4 bg-gradient-to-r from-emerald-50/50 to-teal-50/20 dark:from-emerald-950/20 dark:to-teal-950/5 rounded-xl border border-emerald-100/50 dark:border-emerald-950/30 flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-emerald-500/10 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Coins className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                    {t.availableProfit}
                  </span>
                  <h4 className="text-xl font-black text-emerald-700 dark:text-emerald-400">
                    {netProfitBdt.toLocaleString(undefined, { minimumFractionDigits: 2 })} BDT
                  </h4>
                </div>
              </div>

              {/* Distribute Form */}
              <form onSubmit={handleOpenConfirm} className="space-y-4 pt-4 border-t border-gray-100 dark:border-zinc-800">
                <h4 className="font-bold text-sm text-gray-800 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  {t.panelTitle}
                </h4>

                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5">
                    {t.amountLabel} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="1"
                    value={distAmountBdt}
                    onChange={(e) => setDistAmountBdt(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 text-xs border rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5">
                    {t.modeLabel}
                  </label>
                  <select
                    value={distPaymentMode}
                    onChange={(e) => setDistPaymentMode(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 text-xs border rounded-lg dark:bg-zinc-800 dark:border-zinc-700 dark:text-white font-semibold"
                  >
                    <option value="CASH">{t.cashOption}</option>
                    <option value="BANK">{t.bankOption}</option>
                  </select>
                </div>

                {/* Calculation Preview */}
                {inputAmountBdt > 0 && (
                  <div className="p-4 bg-gray-50/50 dark:bg-zinc-800/20 border border-gray-100/40 dark:border-zinc-800 rounded-lg text-xs space-y-2.5 text-gray-600 dark:text-gray-300">
                    <span className="block font-bold text-[10px] text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Percent className="w-3.5 h-3.5 text-emerald-500" />
                      {t.splitsTitle}
                    </span>

                    <div className="flex justify-between items-center">
                      <span>{t.devSplit}</span>
                      <strong className="font-mono text-gray-800 dark:text-white">
                        {devFundBdt.toLocaleString(undefined, { minimumFractionDigits: 2 })} BDT
                      </strong>
                    </div>

                    <div className="flex justify-between items-center">
                      <span>{t.destituteSplit}</span>
                      <strong className="font-mono text-gray-800 dark:text-white">
                        {destituteFundBdt.toLocaleString(undefined, { minimumFractionDigits: 2 })} BDT
                      </strong>
                    </div>

                    <div className="flex justify-between items-center">
                      <span>{t.sportsSplit}</span>
                      <strong className="font-mono text-gray-800 dark:text-white">
                        {sportsFundBdt.toLocaleString(undefined, { minimumFractionDigits: 2 })} BDT
                      </strong>
                    </div>

                    <div className="flex justify-between items-center border-t border-dashed dark:border-zinc-800 pt-2 font-bold text-emerald-600 dark:text-emerald-400">
                      <span className="flex items-center gap-1">
                        <PiggyBank className="w-3.5 h-3.5 text-emerald-600" />
                        {t.fdReserve}
                      </span>
                      <strong className="font-mono">
                        {fixedDepositBdt.toLocaleString(undefined, { minimumFractionDigits: 2 })} BDT
                      </strong>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || inputAmountBdt <= 0}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50 uppercase tracking-wider mt-2"
                >
                  {submitting ? t.submittingBtn : t.submitBtn}
                </button>
              </form>
            </div>
          </div>

          {/* Right Panel: History of distributions */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200/60 dark:border-zinc-800 shadow-md">
              <h3 className="font-bold text-sm text-gray-800 dark:text-white mb-4 uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                {t.historyTitle}
              </h3>

              {distributionsList.length === 0 ? (
                <div className="py-12 text-center text-gray-400 border border-dashed rounded-lg dark:border-zinc-800 italic">
                  {t.emptyHistory}
                </div>
              ) : (
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-zinc-800/80 text-gray-500 font-bold border-b dark:border-zinc-800">
                      <tr>
                        <th className="px-4 py-3">{t.dateCol}</th>
                        <th className="px-4 py-3 text-right">{t.totalCol}</th>
                        <th className="px-4 py-3 text-right">{t.devCol}</th>
                        <th className="px-4 py-3 text-right">{t.poorCol}</th>
                        <th className="px-4 py-3 text-right">{t.sportsCol}</th>
                        <th className="px-4 py-3 text-right">{t.fdCol}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                      {distributionsList.map((d) => (
                        <tr key={d.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                          <td className="px-4 py-3.5 text-gray-500 font-mono">
                            {new Date(d.createdAt).toLocaleDateString(lang === "BN" ? "bn-BD" : "en-US", { dateStyle: "medium" })}
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono font-bold text-gray-800 dark:text-white">
                            {(d.totalProfit / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })} BDT
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono text-gray-500 dark:text-gray-300">
                            {(d.devFund / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono text-gray-500 dark:text-gray-300">
                            {(d.destituteFund / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono text-gray-500 dark:text-gray-300">
                            {(d.sportsFund / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {(d.fixedDeposit / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
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
