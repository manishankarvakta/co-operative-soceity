"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import LoansList from "@/components/widgets/LoansList";

function MicrofinancePageContent() {
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status") as any;
  const initialStatus = ["PENDING", "ACTIVE", "PAID", "REJECTED"].includes(statusParam)
    ? statusParam
    : "ACTIVE";

  return (
    <LoansList
      key={initialStatus}
      status={initialStatus}
      showApplyButton={true}
    />
  );
}

export default function MicrofinancePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500 font-semibold">Loading...</div>}>
      <MicrofinancePageContent />
    </Suspense>
  );
}
