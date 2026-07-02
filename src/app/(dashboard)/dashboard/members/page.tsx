"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import MembersDirectory from "@/components/widgets/MembersDirectory";

function MembersListPageContent() {
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role") as string;
  const initialRole = roleParam || "MEMBER";

  return <MembersDirectory key={initialRole} role={initialRole} />;
}

export default function MembersListPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500 font-semibold">Loading...</div>}>
      <MembersListPageContent />
    </Suspense>
  );
}
