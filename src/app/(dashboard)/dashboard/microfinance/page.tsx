"use client";

import LoansList from "@/components/widgets/LoansList";

export default function MicrofinancePage() {
  return (
    <LoansList
      status="ACTIVE"
      showApplyButton={true}
    />
  );
}
