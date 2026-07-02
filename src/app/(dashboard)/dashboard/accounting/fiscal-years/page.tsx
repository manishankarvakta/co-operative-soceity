"use client";

import { useEffect, useState } from "react";
import { ConfirmModal, Toast, useToast } from "@/components/ui/ConfirmModal";
import { useLanguage } from "@/providers/LanguageProvider";
import { Calendar, Plus, CheckCircle, AlertCircle, Power, Play } from "lucide-react";

export default function FiscalYearsPage() {
  const { lang } = useLanguage();
  const { toast, showToast } = useToast();

  const [fiscalYears, setFiscalYears] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isActive, setIsActive] = useState(false);

  // Activation Confirmation Modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetFy, setTargetFy] = useState<{ id: string; name: string } | null>(null);
  const [activationLoading, setActivationLoading] = useState(false);

  const loadFiscalYears = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/accounting/fiscal-years");
      const data = await res.json();
      if (res.ok) {
        setFiscalYears(Array.isArray(data) ? data : []);
      } else {
        setFiscalYears([]);
      }
    } catch (err) {
      console.error("Error loading fiscal years:", err);
      setFiscalYears([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiscalYears();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !startDate || !endDate) {
      showToast(
        "warning",
        lang === "BN" ? "অসম্পূর্ণ তথ্য" : "Incomplete Info",
        lang === "BN" ? "অনুগ্রহ করে সবগুলি ফিল্ড পূরণ করুন।" : "Please fill in all fields."
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/accounting/fiscal-years", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          startDate,
          endDate,
          isActive
        })
      });
      const data = await res.json();

      if (!res.ok || data.success === false) {
        showToast(
          "error",
          lang === "BN" ? "তৈরি করতে ব্যর্থ" : "Creation Failed",
          data.message || (lang === "BN" ? "অর্থবছর তৈরি করা যায়নি।" : "Failed to create fiscal year.")
        );
      } else {
        showToast(
          "success",
          lang === "BN" ? "সফল হয়েছে" : "Success",
          lang === "BN" ? "নতুন অর্থবছর সফলভাবে তৈরি করা হয়েছে।" : "Fiscal year created successfully."
        );
        // Reset form
        setName("");
        setStartDate("");
        setEndDate("");
        setIsActive(false);
        // Reload list
        loadFiscalYears();
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

  const handleOpenActivateConfirm = (id: string, name: string) => {
    setTargetFy({ id, name });
    setConfirmOpen(true);
  };

  const handleExecuteActivation = async () => {
    if (!targetFy) return;
    setConfirmOpen(false);
    setActivationLoading(true);

    try {
      const res = await fetch(`/api/accounting/fiscal-years/${targetFy.id}/activate`, {
        method: "POST"
      });
      const data = await res.json();

      if (!res.ok || data.success === false) {
        showToast(
          "error",
          lang === "BN" ? "অ্যাক্টিভেশন ব্যর্থ" : "Activation Failed",
          data.message || (lang === "BN" ? "অর্থবছর সক্রিয় করা যায়নি।" : "Failed to activate fiscal year.")
        );
      } else {
        showToast(
          "success",
          lang === "BN" ? "সক্রিয় করা হয়েছে" : "Activated",
          lang === "BN"
            ? `অর্থবছর '${targetFy.name}' সফলভাবে সক্রিয় করা হয়েছে এবং বাকি সবগুলো নিষ্ক্রিয় করা হয়েছে।`
            : `Fiscal year '${targetFy.name}' successfully activated and others deactivated.`
        );
        loadFiscalYears();
      }
    } catch (err) {
      console.error(err);
      showToast(
        "error",
        lang === "BN" ? "সার্ভার ত্রুটি" : "Server Error",
        lang === "BN" ? "সার্ভারে সমস্যা হয়েছে।" : "Something went wrong on the server."
      );
    } finally {
      setActivationLoading(false);
      setTargetFy(null);
    }
  };

  const labels = {
    BN: {
      title: "অর্থবছর ব্যবস্থাপনা (Fiscal Years)",
      subtitle: "হিসাবকাল ও অর্থবছর তৈরি এবং সক্রিয়করণ কনসোল। লেনদেন পরিচালনার জন্য সঠিক অর্থবছর সক্রিয় থাকা আবশ্যক।",
      createCardTitle: "নতুন অর্থবছর তৈরি করুন",
      nameLabel: "অর্থবছরের নাম",
      namePlaceholder: "যেমন: FY 2026-2027",
      startLabel: "শুরুর তারিখ (Start Date)",
      endLabel: "শেষের তারিখ (End Date)",
      activeLabel: "তৈরির সাথে সাথে সক্রিয় (Active) করুন",
      submitBtn: "অর্থবছর তৈরি করুন",
      submittingBtn: "তৈরি হচ্ছে...",
      listCardTitle: "অর্থবছরসমূহের তালিকা",
      thName: "অর্থবছরের নাম",
      thStart: "শুরুর তারিখ",
      thEnd: "শেষের তারিখ",
      thStatus: "অবস্থা (Status)",
      thAction: "অ্যাকশন",
      activeBadge: "সক্রিয় (Active)",
      inactiveBadge: "নিষ্ক্রিয় (Inactive)",
      activateBtn: "সক্রিয় করুন",
      confirmTitle: "অর্থবছর পরিবর্তন নিশ্চিত করুন",
      confirmMsg: `আপনি কি নিশ্চিতভাবে '${targetFy?.name}' অর্থবছরটি সক্রিয় করতে চান? এর ফলে বর্তমানে সক্রিয় অর্থবছরটি নিষ্ক্রিয় হয়ে যাবে।`,
      confirmYes: "হ্যাঁ, সক্রিয় করুন",
      confirmNo: "বাতিল করুন",
      loading: "তথ্য লোড করা হচ্ছে...",
      emptyList: "কোনো অর্থবছর খুঁজে পাওয়া যায়নি।",
      lockWarningBN: "উল্লেখ্য: ১ম অর্থবছর (৩০শে জুন, ২০২৬ইং পর্যন্ত) এবং ২য় অর্থবছর (১লা জুলাই, ২০২৬ইং থেকে ৩০শে জুন, ২০২৭ইং পর্যন্ত) এর হিসাবকাল পরিবর্তনযোগ্য নয়।"
    },
    EN: {
      title: "Fiscal Years Management",
      subtitle: "Configure and activate fiscal periods. An active fiscal year is required to process and record transactions.",
      createCardTitle: "Create New Fiscal Year",
      nameLabel: "Fiscal Year Name",
      namePlaceholder: "e.g., FY 2026-2027",
      startLabel: "Start Date",
      endLabel: "End Date",
      activeLabel: "Set as Active immediately",
      submitBtn: "Create Fiscal Year",
      submittingBtn: "Creating...",
      listCardTitle: "Configured Fiscal Years",
      thName: "Fiscal Year",
      thStart: "Start Date",
      thEnd: "End Date",
      thStatus: "Status",
      thAction: "Action",
      activeBadge: "Active",
      inactiveBadge: "Inactive",
      activateBtn: "Activate",
      confirmTitle: "Confirm Fiscal Year Activation",
      confirmMsg: `Are you sure you want to activate '${targetFy?.name}'? Activating it will deactivate the currently active fiscal year.`,
      confirmYes: "Yes, Activate",
      confirmNo: "Cancel",
      loading: "Loading fiscal years...",
      emptyList: "No fiscal years configured.",
      lockWarningBN: "Note: The 1st Fiscal Year (ends June 30, 2026) and 2nd Fiscal Year (July 1, 2026 - June 30, 2027) bounds are programmatically locked."
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
        loading={activationLoading}
        onConfirm={handleExecuteActivation}
        onCancel={() => { setConfirmOpen(false); setTargetFy(null); }}
      />

      <Toast toast={toast} />

      {/* Header */}
      <div className="border-b border-gray-100 dark:border-zinc-800 pb-4">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          {t.title}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {t.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Create Form */}
        <div className="lg:col-span-1">
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200/60 dark:border-zinc-800 shadow-md space-y-4">
            <h4 className="font-bold text-sm text-gray-800 dark:text-white flex items-center gap-1.5 border-b pb-3 border-gray-100 dark:border-zinc-800">
              <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              {t.createCardTitle}
            </h4>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5">
                  {t.nameLabel} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.namePlaceholder}
                  className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5">
                  {t.startLabel} <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5">
                  {t.endLabel} <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white font-mono"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <label htmlFor="isActive" className="text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
                  {t.activeLabel}
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-md transition disabled:opacity-50 uppercase tracking-wider mt-4"
              >
                {submitting ? t.submittingBtn : t.submitBtn}
              </button>
            </form>

            <div className="p-3 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/30 dark:border-amber-900/30 rounded-lg text-[10px] text-amber-700 dark:text-amber-300 flex gap-2 items-start leading-relaxed">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600 mt-0.5" />
              <span>{t.lockWarningBN}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Grid Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200/60 dark:border-zinc-800 shadow-md">
            <h3 className="font-bold text-sm text-gray-800 dark:text-white mb-4 uppercase tracking-wider flex items-center gap-1.5 border-b pb-3 border-gray-100 dark:border-zinc-800">
              <Calendar className="w-4 h-4 text-emerald-600" />
              {t.listCardTitle}
            </h3>

            {loading ? (
              <div className="py-12 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
                <div className="animate-spin w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full" />
                <span className="text-xs">{t.loading}</span>
              </div>
            ) : fiscalYears.length === 0 ? (
              <div className="py-12 text-center text-gray-400 border border-dashed rounded-lg dark:border-zinc-800 italic">
                {t.emptyList}
              </div>
            ) : (
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 dark:bg-zinc-800/80 text-gray-500 font-bold border-b dark:border-zinc-800">
                    <tr>
                      <th className="px-4 py-3">{t.thName}</th>
                      <th className="px-4 py-3">{t.thStart}</th>
                      <th className="px-4 py-3">{t.thEnd}</th>
                      <th className="px-4 py-3">{t.thStatus}</th>
                      <th className="px-4 py-3 text-right">{t.thAction}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                    {fiscalYears.map((fy) => (
                      <tr key={fy.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-gray-800 dark:text-white">
                          {fy.name}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-gray-500 dark:text-gray-300">
                          {new Date(fy.startDate).toLocaleDateString(lang === "BN" ? "bn-BD" : "en-US", { dateStyle: "medium" })}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-gray-500 dark:text-gray-300">
                          {new Date(fy.endDate).toLocaleDateString(lang === "BN" ? "bn-BD" : "en-US", { dateStyle: "medium" })}
                        </td>
                        <td className="px-4 py-3.5">
                          {fy.isActive ? (
                            <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 rounded-full inline-flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              {t.activeBadge}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-[10px] font-bold text-gray-500 bg-gray-50 dark:bg-zinc-800 dark:text-gray-400 rounded-full inline-flex items-center gap-1">
                              <Power className="w-3 h-3 text-gray-400" />
                              {t.inactiveBadge}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          {!fy.isActive && (
                            <button
                              onClick={() => handleOpenActivateConfirm(fy.id, fy.name)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded shadow-sm transition inline-flex items-center gap-1"
                            >
                              <Play className="w-3 h-3 fill-white" />
                              {t.activateBtn}
                            </button>
                          )}
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
    </div>
  );
}
