"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { canAccess, Resource } from "@/lib/rbac";
import Link from "next/link";

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const user = session?.user;
  const userRoles = (user as any)?.roles || [];

  if (userRoles.includes("SUPER_ADMIN")) {
    return <>{children}</>;
  }

  let resource: Resource | null = null;
  if (pathname.startsWith("/dashboard/members")) resource = "members";
  else if (pathname.startsWith("/dashboard/deposits")) resource = "deposits";
  else if (pathname.startsWith("/dashboard/shares")) resource = "deposits"; // Shares are checked via deposits:read
  else if (pathname.startsWith("/dashboard/expenses")) resource = "expenses";
  else if (pathname.startsWith("/dashboard/microfinance")) resource = "loans";
  else if (pathname.startsWith("/dashboard/accounting")) resource = "accounting";
  else if (pathname.startsWith("/dashboard/projects")) resource = "projects";
  else if (pathname.startsWith("/dashboard/reports")) resource = "reports";
  else if (pathname.startsWith("/dashboard/backups")) resource = "backups";

  // Check access if a resource is mapped
  if (resource && !canAccess(user as any, resource, "read")) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[60vh] text-center">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-950/20 text-red-600 dark:text-red-400 flex items-center justify-center rounded-full mb-6 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">অনুমতি নেই (Access Denied)</h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6 text-sm leading-relaxed">
          আপনার এই পেজটি দেখার বা অ্যাক্সেস করার অনুমতি নেই। দয়া করে সিস্টেম এডমিনের সাথে যোগাযোগ করুন।
        </p>
        <Link href="/dashboard" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-emerald-950/10 dark:shadow-emerald-950/20">
          ড্যাশবোর্ডে ফিরে যান
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
