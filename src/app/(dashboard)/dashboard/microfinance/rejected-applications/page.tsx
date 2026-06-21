"use client";

import LoansList from "@/components/widgets/LoansList";
import { useLanguage } from "@/providers/LanguageProvider";

export default function RejectedApplicationsPage() {
  const { lang } = useLanguage();
  const title = lang === "BN" ? "প্রত্যাখ্যাত আবেদনসমূহ" : "Rejected Applications";
  const subtitle = lang === "BN" ? "যৌথ সিগনেচার বোর্ডে রিজেক্ট করা আবেদনসমূহ" : "Loan applications rejected by joint committee";

  return (
    <LoansList
      status="REJECTED"
      title={title}
      subtitle={subtitle}
    />
  );
}
