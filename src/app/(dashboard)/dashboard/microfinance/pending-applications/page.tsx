"use client";

import LoansList from "@/components/widgets/LoansList";
import { useLanguage } from "@/providers/LanguageProvider";

export default function PendingApplicationsPage() {
  const { lang } = useLanguage();
  const title = lang === "BN" ? "পেন্ডিং লোন আবেদনসমূহ" : "Pending Applications";
  const subtitle = lang === "BN" ? "অনুমোদনের অপেক্ষায় থাকা লোন আবেদনসমূহ" : "Loan applications awaiting approvals";

  return (
    <LoansList
      status="PENDING"
      title={title}
      subtitle={subtitle}
      showApplyButton={true}
    />
  );
}
