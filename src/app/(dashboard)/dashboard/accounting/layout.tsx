"use client";

import { useLanguage } from "@/providers/LanguageProvider";

export default function AccountingLayout({ children }: { children: React.ReactNode }) {
  const { lang } = useLanguage();

  const labels = {
    BN: {
      title: "হিসাবরক্ষণ ও ব্যাংক ড্যাশবোর্ড (Accounts & Bank)",
      subtitle: "চার্ট অব অ্যাকাউন্টস, ব্যাংক হিসাব, লেজার, ভাউচার পোস্টিং এবং ফাইনান্সিয়াল রিপোর্টিং স্টেটমেন্ট।",
    },
    EN: {
      title: "Accounts & Bank Console",
      subtitle: "Chart of accounts, bank ledgers, vouchers, statements, and profit distribution.",
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      {/* <div className="flex justify-between items-center border-b pb-4 border-gray-200 dark:border-zinc-800 no-print">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{labels[lang].title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{labels[lang].subtitle}</p>
        </div>
      </div> */}

      {/* Content */}
      <div>{children}</div>
    </div>
  );
}
