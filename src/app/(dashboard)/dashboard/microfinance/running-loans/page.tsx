"use client";

import LoansList from "@/components/widgets/LoansList";
import { useLanguage } from "@/providers/LanguageProvider";

export default function RunningLoansPage() {
  const { lang } = useLanguage();
  const title = lang === "BN" ? "সক্রিয় লোনসমূহ (Running Loans)" : "Running Loans";
  const subtitle = lang === "BN" ? "বর্তমানে চলমান এবং কিস্তি আদায়যোগ্য লোনসমূহ" : "Active disbursed loans undergoing collection";

  return (
    <LoansList
      status="ACTIVE"
      title={title}
      subtitle={subtitle}
    />
  );
}
