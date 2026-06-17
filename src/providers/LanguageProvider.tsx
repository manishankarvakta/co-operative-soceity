"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { en } from "@/locales/en";
import { bn } from "@/locales/bn";

type Language = "EN" | "BN";
type Dictionary = typeof en;

interface LanguageContextType {
  lang: Language;
  toggleLanguage: () => void;
  setLang: (lang: Language) => void;
  t: (key: string) => any;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>("BN");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem("app_lang") as Language;
    if (savedLang) {
      setLang(savedLang);
    }
    setMounted(true);
  }, []);

  const toggleLanguage = () => {
    const newLang = lang === "EN" ? "BN" : "EN";
    setLang(newLang);
    localStorage.setItem("app_lang", newLang);
  };

  const handleSetLang = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem("app_lang", newLang);
  };

  // Helper function to fetch nested keys like "dashboard.title"
  const t = (keyPath: string) => {
    const dict = lang === "BN" ? bn : en;
    const keys = keyPath.split(".");
    let current: any = dict;
    
    for (const key of keys) {
      if (current[key] === undefined) {
        console.warn(`Translation key not found: ${keyPath}`);
        return keyPath;
      }
      current = current[key];
    }
    
    return current;
  };

  // Prevent hydration mismatch by not rendering the actual UI until mounted
  if (!mounted) {
    return (
      <LanguageContext.Provider value={{ lang, toggleLanguage, setLang: handleSetLang, t }}>
        <div className="invisible">{children}</div>
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage, setLang: handleSetLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
