"use client";

import LoanApplicationForm from "@/components/forms/LoanApplicationForm";
import { useRouter } from "next/navigation";

export default function ApplyLoanPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/dashboard/microfinance/pending-applications");
  };

  const handleCancel = () => {
    router.push("/dashboard/microfinance/pending-applications");
  };

  return (
    <div className="max-w-3xl mx-auto py-2">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-6 md:p-8 shadow-sm">
        <LoanApplicationForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>
    </div>
  );
}
