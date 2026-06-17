"use client";

import { useLanguage } from "@/providers/LanguageProvider";

export function LanguageToggle() {
  const { lang, toggleLanguage } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 rounded-full transition-all shadow-sm"
      aria-label="Toggle Language"
    >
      <span className="font-mono text-[10px] uppercase opacity-70">
        {lang === "BN" ? "EN" : "BN"}
      </span>
      <span>{lang === "BN" ? "English" : "বাংলা"}</span>
    </button>
  );
}
