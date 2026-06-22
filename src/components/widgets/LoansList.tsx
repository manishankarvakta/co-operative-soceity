"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/providers/LanguageProvider";
import LoanApplicationForm from "@/components/forms/LoanApplicationForm";
import Link from "next/link";

interface LoansListProps {
  status: "PENDING" | "ACTIVE" | "PAID" | "REJECTED";
  title: string;
  subtitle: string;
  showApplyButton?: boolean;
}

export default function LoansList({ status, title, subtitle, showApplyButton = false }: LoansListProps) {
  const { lang } = useLanguage();
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/loans?status=${status}`);
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

  useEffect(() => {
    fetchLoans();
  }, [status]);

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

  return (
    <div className="w-full space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 dark:border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{title}</h1>
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
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
        <div className="p-4 text-sm font-semibold text-red-600 bg-red-50 dark:bg-red-950/20 dark:text-red-400 rounded-xl border border-red-200/50 dark:border-red-900/50">
          ⚠️ {error}
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
          <svg className="w-12 h-12 text-gray-350 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{L.noLoans}</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-zinc-850/50 font-bold text-gray-500 dark:text-gray-400 border-b border-gray-150 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4">{L.member}</th>
                <th className="px-6 py-4">{L.amount}</th>
                <th className="px-6 py-4">{L.interest}</th>
                <th className="px-6 py-4">{L.duration}</th>
                {status === "PENDING" && <th className="px-6 py-4">{L.signatures}</th>}
                <th className="px-6 py-4">{L.status}</th>
                <th className="px-6 py-4 text-right">{L.action}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 text-gray-700 dark:text-gray-300">
              {filteredLoans.map((loan) => (
                <tr key={loan.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-850/20 transition">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900 dark:text-white">{loan.member.name}</div>
                    <div className="text-xs text-gray-400 font-mono mt-0.5">{loan.member.memberCode}</div>
                  </td>
                  <td className="px-6 py-4 font-bold font-mono">
                    {(loan.amount / 100).toLocaleString()} BDT
                  </td>
                  <td className="px-6 py-4 font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                    {Number(loan.interestRate)}% Flat
                  </td>
                  <td className="px-6 py-4">
                    {loan.durationValue} {loan.durationType === "WEEKLY" ? (lang === "BN" ? "সপ্তাহ" : "Weeks") : (lang === "BN" ? "মাস" : "Months")}
                  </td>
                  {status === "PENDING" && (
                    <td className="px-6 py-4">
                      <div className="flex gap-2.5 text-xs">
                        <span className={`px-2 py-0.5 rounded font-bold ${loan.presidentApproved ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400" : "bg-gray-100 dark:bg-zinc-800 text-gray-450"}`}>
                          {L.president}: {loan.presidentApproved ? "✅" : "⏳"}
                        </span>
                        <span className={`px-2 py-0.5 rounded font-bold ${loan.secretaryApproved ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400" : "bg-gray-100 dark:bg-zinc-800 text-gray-450"}`}>
                          {L.secretary}: {loan.secretaryApproved ? "✅" : "⏳"}
                        </span>
                        <span className={`px-2 py-0.5 rounded font-bold ${loan.treasurerApproved ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400" : "bg-gray-100 dark:bg-zinc-800 text-gray-455"}`}>
                          {L.treasurer}: {loan.treasurerApproved ? "✅" : "⏳"}
                        </span>
                      </div>
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
      )}


    </div>
  );
}
