"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import ExpensesList from "@/components/widgets/ExpensesList";

function ExpensesPageContent() {
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status") || "";

  return <ExpensesList key={statusParam} status={statusParam as any} />;
}

export default function ExpensesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500 font-semibold">Loading...</div>}>
      <ExpensesPageContent />
    </Suspense>
  );
}
