"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/providers/LanguageProvider";
import { CheckCircle2 } from "lucide-react";

const translations = {
  BN: {
    title: "ভর্তি ফি সেটিংস",
    subtitle: "নতুন সদস্যদের ভর্তি ফি সেটিংস পরিবর্তন করুন",
    admissionFeeCardTitle: "ভর্তি ফি নির্ধারণ",
    admissionFeeCardDesc: "নতুন সদস্য নিবন্ধনের সময় ভর্তি ফি নির্ধারণ করুন",
    admissionFeeLabel: "ভর্তি ফি (টাকা)",

    helpText: "এখানে সেট করা ভর্তি ফি নতুন সদস্য ভর্তির সময় স্বয়ংক্রিয়ভাবে ব্যবহৃত হবে।",
    saveBtn: "সংরক্ষণ করুন",
    successMsg: "ভর্তি ফি সফলভাবে আপডেট করা হয়েছে!",
    saving: "সংরক্ষণ হচ্ছে..."
  },
  EN: {
    title: "Admission Fee Settings",
    subtitle: "Configure the admission fee for new member registrations",
    admissionFeeCardTitle: "Admission Fee Configuration",
    admissionFeeCardDesc: "Configure the standard admission fee amount for new members",
    admissionFeeLabel: "Admission Fee (BDT)",

    helpText: "The admission fee configured here will automatically apply to any new member registration.",
    saveBtn: "Save Settings",
    successMsg: "Admission fee updated successfully!",
    saving: "Saving..."
  }
};

export default function AdmitFeeSettingsPage() {
  const { lang } = useLanguage();
  const t = translations[lang];

  const [admissionFee, setAdmissionFee] = useState<number>(5000);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const savedFee = localStorage.getItem("somoby_admission_fee");
    if (savedFee) {
      const parsed = parseInt(savedFee, 10);
      if (!isNaN(parsed)) {
        setAdmissionFee(parsed);
      }
    }
  }, []);

  const handleSave = () => {
    setSaving(true);
    // Simulate professional transition delay
    setTimeout(() => {
      localStorage.setItem("somoby_admission_fee", admissionFee.toString());
      window.dispatchEvent(new Event("somoby_settings_changed"));
      setSaving(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }, 450);
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between border-b pb-4 border-gray-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {t.title}3
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t.subtitle}
          </p>
        </div>
      </div>

      {/* Settings Form Container */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden transition-all duration-200">
          <div className="p-6 border-b border-gray-100 dark:border-zinc-800">
            <h2 className="text-md font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-emerald-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-1.958-.59c-1.007-.733-1.007-1.921 0-2.654 1.008-.733 2.64-.733 3.648 0L14 9.182M12 3v3m0 12v3" />
              </svg>
              {t.admissionFeeCardTitle}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t.admissionFeeCardDesc}
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* Form Fields */}
            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                  {t.admissionFeeLabel}
                </label>
                <input
                  type="number"
                  min="0"
                  value={admissionFee}
                  onChange={(e) => setAdmissionFee(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-zinc-800 dark:text-white transition-colors"
                />
                <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                  {t.helpText}
                </p>
              </div>
            </div>

            {/* Success message banner */}
            {success && (
              <div className="p-3 text-sm font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-lg flex items-center gap-2 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{t.successMsg}</span>
              </div>
            )}

            {/* Actions */}
            <div className="pt-4 border-t border-gray-100 dark:border-zinc-800 flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[150px]"
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
    </div>
  );
}
