"use client";

import LoansList from "@/components/widgets/LoansList";
import { useLanguage } from "@/providers/LanguageProvider";

export default function ClosedLoansPage() {
  const { lang } = useLanguage();
  const title = lang === "BN" ? "পরিশোধিত লোনসমূহ (Paid Loans)" : "Closed / Paid Loans";
  const subtitle = lang === "BN" ? "সম্পূর্ণ পরিশোধ এবং ক্লোজ করা লোনসমূহ" : "Fully settled and closed loan accounts";

  return (
    <LoansList
      status="PAID"
      title={title}
      subtitle={subtitle}
    />
  );
}
