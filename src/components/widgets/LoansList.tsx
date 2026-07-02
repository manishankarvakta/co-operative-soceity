"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/providers/LanguageProvider";
import { AlertTriangle } from "lucide-react";
import LoanApplicationForm from "@/components/forms/LoanApplicationForm";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface LoansListProps {
  status?: "PENDING" | "ACTIVE" | "PAID" | "REJECTED";
  title?: string;
  subtitle?: string;
  showApplyButton?: boolean;
}

export default function LoansList({ status = "ACTIVE", title, subtitle, showApplyButton = true }: LoansListProps) {
  const { lang } = useLanguage();
  const [activeStatus, setActiveStatus] = useState<"PENDING" | "ACTIVE" | "PAID" | "REJECTED">(status);
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  const { data: session } = useSession();
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const userRoles = (session?.user as any)?.roles || [];
  const isSuperAdmin = userRoles.includes("SUPER_ADMIN");

  const handleApprove = async (loanId: string) => {
    setApprovingId(loanId);
    setError(null);
    try {
      const res = await fetch("/api/loans/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loanId,
          status: "APPROVED",
          paymentMode: "CASH",
          remarks: lang === "BN" ? "এডমিন প্যানেল থেকে অনুমোদিত।" : "Approved via Quick Admin Action"
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchLoans();
      } else {
        setError(data.message || (lang === "BN" ? "অনুমোদন ব্যর্থ হয়েছে।" : "Approval failed."));
      }
    } catch (err) {
      console.error(err);
      setError(lang === "BN" ? "সার্ভারে সমস্যা হয়েছে।" : "Internal server error.");
    } finally {
      setApprovingId(null);
    }
  };

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/loans?status=${activeStatus}`);
      const data = await res.json();
      if (data.success) {
        setLoans(data.loans || []);
      } else {
        setError(data.message || "Failed to load loans.");
      }
    } catch (err) {
      console.error(err);
      setError("Server error loading loans.");
    } finally {
      setLoading(false);
    }
  };

  const getTabHeadings = (st: string) => {
    switch (st) {
      case "PENDING":
        return {
          BN: { title: "পেন্ডিং লোন আবেদনসমূহ (Pending Applications)", subtitle: "অনুমোদনের অপেক্ষায় থাকা নতুন ঋণ আবেদনসমূহ" },
          EN: { title: "Pending Applications", subtitle: "New loan applications waiting for signatures and approvals" }
        }[lang];
      case "PAID":
        return {
          BN: { title: "পরিশোধিত লোনসমূহ (Paid Loans)", subtitle: "পরিশোধ সম্পন্ন হওয়া বন্ধকৃত ঋণসমূহ" },
          EN: { title: "Closed/Paid Loans", subtitle: "Loans that have been fully collected and settled" }
        }[lang];
      case "REJECTED":
        return {
          BN: { title: "প্রত্যাখ্যাত আবেদনসমূহ (Rejected Applications)", subtitle: "বাতিল বা নামঞ্জুর হওয়া ঋণের আবেদনসমূহ" },
          EN: { title: "Rejected Applications", subtitle: "Applications that were rejected by management" }
        }[lang];
      case "ACTIVE":
      default:
        return {
          BN: { title: "সক্রিয় লোনসমূহ (Running Loans)", subtitle: "বর্তমানে চলমান এবং কিস্তি আদায়যোগ্য লোনসমূহ" },
          EN: { title: "Running Loans", subtitle: "Active disbursed loans undergoing collection" }
        }[lang];
    }
  };

  useEffect(() => {
    fetchLoans();
  }, [activeStatus]);

  const labels = {
    BN: {
      newBtn: "লোন আবেদন করুন",
      member: "সদস্য",
      amount: "লোনের পরিমাণ",
      interest: "লাভের হার",
      duration: "মেয়াদ",
      signatures: "ডিজিটাল অনুমোদন",
      status: "অবস্থা",
      action: "অ্যাকশন",
      noLoans: "কোনো ঋণের তথ্য পাওয়া যায়নি।",
      viewDetails: "বিস্তারিত দেখুন",
      loading: "লোডিং হচ্ছে...",
      guarantor: "জামিনদার",
      president: "সভাপতি",
      secretary: "সম্পাদক",
      treasurer: "কোষাধ্যক্ষ",
      searchPlaceholder: "সদস্য নাম বা কোড দিয়ে খুঁজুন...",
    },
    EN: {
      newBtn: "Apply for Loan",
      member: "Member",
      amount: "Loan Principal",
      interest: "Interest Rate",
      duration: "Duration",
      signatures: "Joint Approvals",
      status: "Status",
      action: "Action",
      noLoans: "No loan records found.",
      viewDetails: "View Details",
      loading: "Loading loans...",
      guarantor: "Guarantor",
      president: "President",
      secretary: "Secretary",
      treasurer: "Treasurer",
      searchPlaceholder: "Search by member name or code...",
    }
  };

  const L = labels[lang];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <span className="px-3 py-1 text-xs font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-full border border-amber-200/50 dark:border-amber-900/30">পেন্ডিং (Pending)</span>;
      case "APPROVED":
        return <span className="px-3 py-1 text-xs font-bold bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-200/50 dark:border-indigo-900/30">অনুমোদিত (Approved)</span>;
      case "ACTIVE":
        return <span className="px-3 py-1 text-xs font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-200/50 dark:border-emerald-900/30">চলতি (Disbursed)</span>;
      case "PAID":
        return <span className="px-3 py-1 text-xs font-bold bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-full border border-zinc-200 dark:border-zinc-700">পরিশোধিত (Paid)</span>;
      case "REJECTED":
        return <span className="px-3 py-1 text-xs font-bold bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-full border border-rose-200/50 dark:border-rose-900/30">প্রত্যাখ্যাত (Rejected)</span>;
      default:
        return <span className="px-3 py-1 text-xs font-bold bg-gray-50 text-gray-500 rounded-full">{status}</span>;
    }
  };

  // Filter loans based on search term
  const filteredLoans = loans.filter((loan) => {
    const memberName = loan.member?.name?.toLowerCase() || "";
    const memberCode = loan.member?.memberCode?.toLowerCase() || "";
    const search = searchTerm.toLowerCase();
    return memberName.includes(search) || memberCode.includes(search);
  });

  const headings = getTabHeadings(activeStatus);
  const currentTitle = title || headings.title;
  const currentSubtitle = subtitle || headings.subtitle;

  return (
    <div className="w-full space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 dark:border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{currentTitle}</h1>
          <p className="text-xs text-gray-505 mt-1">{currentSubtitle}</p>
        </div>
        {showApplyButton && (
          <Link
            href="/dashboard/microfinance/apply"
            className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition duration-200 shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            {L.newBtn}
          </Link>
        )}
      </div>

      {/* Filters / Navigation Tabs */}
      <div className="flex gap-2 p-1.5 rounded-lg w-fit bg-gray-50/50 dark:bg-zinc-800/50 ring-1 ring-gray-200 dark:ring-zinc-800 text-xs font-semibold">
        {[
          { key: "PENDING", label: lang === "BN" ? "পেন্ডিং আবেদন" : "Pending Applications" },
          { key: "ACTIVE", label: lang === "BN" ? "চলতি লোনসমূহ" : "Running Loans" },
          { key: "PAID", label: lang === "BN" ? "পরিশোধিত লোন" : "Closed/Paid Loans" },
          { key: "REJECTED", label: lang === "BN" ? "প্রত্যাখ্যাত" : "Rejected Applications" },
        ].map((tab) => {
          const isActive = activeStatus === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveStatus(tab.key as any)}
              className={`px-3 py-1.5 rounded-md transition ${isActive ? "bg-white dark:bg-zinc-800 shadow text-gray-800 dark:text-white" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"}`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={L.searchPlaceholder}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:text-white text-sm"
        />
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 text-sm font-semibold text-red-600 bg-red-50 dark:bg-red-950/20 dark:text-red-400 rounded-xl border border-red-200/50 dark:border-red-900/50 flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="flex justify-center items-center py-20 text-sm text-gray-500">
          <svg className="animate-spin h-5 w-5 mr-3 text-emerald-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {L.loading}
        </div>
      ) : filteredLoans.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{L.noLoans}</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden w-full max-w-full">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[700px] md:min-w-full table-auto">
            <thead className="bg-gray-50 dark:bg-zinc-800/50 font-bold text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4">{L.member}</th>
                <th className="px-6 py-4">{L.amount}</th>
                <th className="px-6 py-4 hidden sm:table-cell">{L.interest}</th>
                <th className="px-6 py-4 hidden md:table-cell">{L.duration}</th>
                {activeStatus === "PENDING" && <th className="px-6 py-4 hidden md:table-cell">{L.signatures}</th>}
                <th className="px-6 py-4">{L.status}</th>
                <th className="px-6 py-4 text-right">{L.action}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 text-gray-700 dark:text-gray-300">
              {filteredLoans.map((loan) => (
                <tr key={loan.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/20 transition">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900 dark:text-white">{loan.member.name}</div>
                    <div className="text-xs text-gray-400 font-mono mt-0.5">{loan.member.memberCode}</div>
                  </td>
                  <td className="px-6 py-4 font-bold font-mono">
                    {(loan.amount / 100).toLocaleString()} BDT
                  </td>
                  <td className="px-6 py-4 font-semibold text-emerald-600 dark:text-emerald-400 font-mono hidden sm:table-cell">
                    {Number(loan.interestRate)}% Flat
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    {loan.durationValue} {loan.durationType === "WEEKLY" ? (lang === "BN" ? "সপ্তাহ" : "Weeks") : (lang === "BN" ? "মাস" : "Months")}
                  </td>
                  {activeStatus === "PENDING" && (
                    <td className="px-6 py-4 hidden md:table-cell">
                      {isSuperAdmin ? (
                        <button
                          onClick={() => handleApprove(loan.id)}
                          disabled={approvingId === loan.id}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
                        >
                          {approvingId === loan.id ? (
                            <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path>
                            </svg>
                          )}
                          {lang === "BN" ? "অনুমোদন" : "Approve"}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-405 font-bold">⏳ {lang === "BN" ? "পেন্ডিং" : "Pending"}</span>
                      )}
                    </td>
                  )}
                  <td className="px-6 py-4">
                    {getStatusBadge(loan.status)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/dashboard/microfinance/${loan.id}`}
                      className="inline-block px-4.5 py-2 border border-gray-200 dark:border-zinc-700 hover:border-emerald-600 dark:hover:border-emerald-500 rounded-xl hover:text-emerald-600 dark:hover:text-emerald-400 text-sm font-bold transition shadow-sm"
                    >
                      {L.viewDetails}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}


    </div>
  );
}
