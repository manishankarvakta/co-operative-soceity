"use client";

import { use, useEffect, useState } from "react";
import { useLanguage } from "@/providers/LanguageProvider";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function LoanDetailsPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { lang } = useLanguage();
  const { data: session } = useSession();

  const [loan, setLoan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Approval Form states
  const [actionLoading, setActionLoading] = useState(false);
  const [paymentMode, setPaymentMode] = useState<"CASH" | "BANK">("CASH");
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [bankAccountId, setBankAccountId] = useState("");
  const [remarks, setRemarks] = useState("");
  const [selectedRole, setSelectedRole] = useState<"PRESIDENT" | "SECRETARY" | "TREASURER" | "">("");

  const fetchLoanDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/loans/${id}`);
      const data = await res.json();
      if (!res.ok || data.success === false) {
        setError(data.message || "Failed to load loan details.");
      } else {
        setLoan(data);
      }
    } catch {
      setError("Server error loading loan details.");
    } finally {
      setLoading(false);
    }
  };

  const fetchBankAccounts = async () => {
    try {
      const res = await fetch("/api/bank/accounts");
      const data = await res.json();
      if (Array.isArray(data)) {
        setBankAccounts(data.filter((acc) => acc.accountNumber !== "CASH-001" && acc.name !== "Cash on Hand"));
      }
    } catch (err) {
      console.error("Error fetching bank accounts:", err);
    }
  };

  useEffect(() => {
    fetchLoanDetails();
    fetchBankAccounts();
  }, [id]);

  // Determine current user eligibility to approve
  const user = session?.user as any;
  const userRoles: string[] = user?.roles || [];
  const isPresident = userRoles.includes("PRESIDENT");
  const isSecretary = userRoles.includes("SECRETARY");
  const isTreasurer = userRoles.includes("TREASURER");
  const isSuperAdmin = userRoles.includes("SUPER_ADMIN");
  const isStaffOrAdmin = isPresident || isSecretary || isTreasurer || isSuperAdmin;

  // Auto-set the role to sign if they have one role
  useEffect(() => {
    if (isSuperAdmin) {
      // Super admin can select role, so we don't auto-set
      return;
    }
    if (isPresident) setSelectedRole("PRESIDENT");
    else if (isSecretary) setSelectedRole("SECRETARY");
    else if (isTreasurer) setSelectedRole("TREASURER");
  }, [session]);

  const handleApproval = async (status: "APPROVED" | "REJECTED") => {
    setActionLoading(true);
    setError(null);

    const activeRole = selectedRole || undefined;
    if (status === "APPROVED" && !activeRole && isSuperAdmin) {
      setError(lang === "BN" ? "দয়া করে অনুমোদনের ভূমিকা সিলেক্ট করুন।" : "Please select an approval role.");
      setActionLoading(false);
      return;
    }

    if (status === "APPROVED" && paymentMode === "BANK" && !bankAccountId) {
      setError(lang === "BN" ? "দয়া করে ব্যাংক অ্যাকাউন্ট সিলেক্ট করুন।" : "Please select a bank account.");
      setActionLoading(false);
      return;
    }

    const payload = {
      loanId: id,
      status,
      paymentMode,
      bankAccountId: paymentMode === "BANK" ? bankAccountId : null,
      remarks: remarks || null,
      approveAsRole: activeRole || null
    };

    try {
      const res = await fetch("/api/loans/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        setError(data.message || "Failed to process loan action.");
      } else {
        setRemarks("");
        fetchLoanDetails();
      }
    } catch {
      setError("Server error processing action.");
    } finally {
      setActionLoading(false);
    }
  };

  const getBackLink = () => {
    if (!loan) return "/dashboard/microfinance/pending-applications";
    switch (loan.status) {
      case "PENDING":
      case "APPROVED":
        return "/dashboard/microfinance/pending-applications";
      case "ACTIVE":
        return "/dashboard/microfinance/running-loans";
      case "PAID":
        return "/dashboard/microfinance/closed-loans";
      case "REJECTED":
        return "/dashboard/microfinance/rejected-applications";
      default:
        return "/dashboard/microfinance/pending-applications";
    }
  };

  const labels = {
    BN: {
      title: "ঋণ বিবরণী ও অনুমোদন ট্র্যাকার",
      backLink: "ঋণ তালিকায় ফিরে যান",
      memberCard: "আবেদনকারী সদস্যের প্রোফাইল",
      loanCard: "ঋণের সংক্ষিপ্ত বিবরণ",
      memberCode: "সদস্য কোড",
      phone: "মোবাইল নম্বর",
      address: "ঠিকানা",
      amount: "ঋণের পরিমাণ",
      interest: "লাভের হার / সার্ভিস চার্জ",
      duration: "মেয়াদ",
      emi: "প্রতি কিস্তির পরিমাণ",
      status: "অবস্থা",
      guarantorCard: "ঋণ গ্যারান্টার (জামিনদার)",
      guarantor1: "১ম জামিনদার",
      guarantor2: "২য় জামিনদার",
      notSet: "নির্ধারিত নেই",
      jointApprovals: "যৌথ ডিজিটাল স্বাক্ষর ট্র্যাকিং",
      approver: "পদবী / ভূমিকা",
      signed: "স্বাক্ষরিত (Approved)",
      pendingSign: "অপেক্ষমান (Pending)",
      actionPanel: "ডিজিটাল স্বাক্ষর ও তহবিল ছাড় প্যানেল",
      roleSelect: "স্বাক্ষর করার ভূমিকা নির্বাচন করুন",
      paymentMode: "তহবিল ছাড়ের মাধ্যম (Payment Mode)",
      bankSelect: "ব্যাংক হিসাব সিলেক্ট করুন",
      remarksPlaceholder: "অনুমোদন বা রিজেক্টের মন্তব্য লিখুন...",
      approveBtn: "অনুমোদন (Approve) করুন",
      rejectBtn: "প্রত্যাখ্যান (Reject) করুন",
      processing: "প্রক্রিয়াধীন...",
      scheduleTitle: "ঋণ পরিশোধের কিস্তি সূচী (Amortization Schedule)",
      emiNum: "কিস্তি নং",
      dueDate: "পরিশোধের শেষ তারিখ",
      principal: "আসল (Principal)",
      profit: "লাভ (Service Charge)",
      total: "সর্বমোট কিস্তি BDT",
      paid: "পরিশোধিত",
      rem: "বকেয়া",
      paymentLogsTitle: "কিস্তি পরিশোধের ইতিহাস (Repayment Ledger)",
      paymentDate: "তারিখ",
      receipt: "রসিদ কোড",
      totalPaid: "মোট জমা",
      remarks: "মন্তব্য",
      president: "সভাপতি (President)",
      secretary: "সম্পাদক (Secretary)",
      treasurer: "কোষাধ্যক্ষ (Treasurer)"
    },
    EN: {
      title: "Loan Details & Approval Tracker",
      backLink: "Back to Loans List",
      memberCard: "Applicant Member Profile",
      loanCard: "Loan Summary Details",
      memberCode: "Member Code",
      phone: "Phone Number",
      address: "Address",
      amount: "Loan Principal",
      interest: "Interest Rate / Charge",
      duration: "Duration",
      emi: "EMI Installment BDT",
      status: "Status",
      guarantorCard: "Loan Guarantors",
      guarantor1: "Guarantor 1",
      guarantor2: "Guarantor 2",
      notSet: "Not set",
      jointApprovals: "Joint Digital Signatures Progress",
      approver: "Designation / Role",
      signed: "Approved / Signed",
      pendingSign: "Awaiting Signature",
      actionPanel: "Digital Signature & Disbursement Desk",
      roleSelect: "Select Signing Role",
      paymentMode: "Disbursement Method (Payment Mode)",
      bankSelect: "Select Bank Account",
      remarksPlaceholder: "Enter remarks for approval or rejection...",
      approveBtn: "Affirm / Approve Loan",
      rejectBtn: "Reject Application",
      processing: "Processing...",
      scheduleTitle: "Loan Amortization Repayment Schedule",
      emiNum: "EMI #",
      dueDate: "Due Date",
      principal: "Principal Portion",
      profit: "Interest Portion",
      total: "Total EMI BDT",
      paid: "Paid Amount",
      rem: "Remaining",
      paymentLogsTitle: "Loan Payment Receipts Ledger",
      paymentDate: "Repayment Date",
      receipt: "Receipt Reference",
      totalPaid: "Amount Paid",
      remarks: "Remarks",
      president: "President",
      secretary: "Secretary",
      treasurer: "Treasurer"
    }
  };

  const L = labels[lang];

  if (loading && !loan) return (
    <div className="flex justify-center items-center py-40 text-sm text-gray-500">
      <svg className="animate-spin h-5 w-5 mr-3 text-emerald-600" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      {lang === "BN" ? "ঋণের তথ্য লোড হচ্ছে..." : "Loading details..."}
    </div>
  );

  if (error && !loan) return (
    <div className="p-4 text-sm font-semibold text-red-600 bg-red-50 dark:bg-red-950/20 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-900/50">
      ⚠️ {error}
      <div className="mt-3">
        <Link href={getBackLink()} className="text-xs text-blue-600 dark:text-blue-400 underline">{L.backLink}</Link>
      </div>
    </div>
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <span className="px-3 py-1 text-xs font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-full border border-amber-200/50 dark:border-amber-900/30">আবেদন (Pending)</span>;
      case "APPROVED":
        return <span className="px-3 py-1 text-xs font-bold bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-200/50 dark:border-indigo-900/30">আংশিক অনুমোদিত (Approved)</span>;
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

  const getScheduleStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded border border-emerald-100 dark:border-emerald-900/30">পরিশোধিত</span>;
      case "PARTIAL":
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded border border-indigo-100 dark:border-indigo-900/30">আংশিক</span>;
      case "OVERDUE":
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded border border-red-100 dark:border-red-900/30">ওভারডিউ</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded border border-amber-100 dark:border-amber-900/30">অনাদায়ী</span>;
    }
  };

  const isPendingApproval = loan.status === "PENDING" || loan.status === "APPROVED";

  // Calculate dynamic outstanding totals
  const totalPrincipal = loan.amount;
  const totalInterest = Math.round(totalPrincipal * (Number(loan.interestRate) / 100));
  const totalPayable = totalPrincipal + totalInterest;
  const totalPaid = loan.payments.reduce((sum: number, p: any) => sum + p.amount, 0);
  const outstanding = Math.max(0, totalPayable - totalPaid);

  return (
    <div className="w-full space-y-6">
      {/* Header and Back Link */}
      <div className="flex justify-between items-center border-b border-gray-100 dark:border-zinc-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
            {L.title}
          </h2>
          <Link href={getBackLink()} className="text-xs text-emerald-650 hover:underline flex items-center gap-1 mt-1 font-semibold">
            ← {L.backLink}
          </Link>
        </div>
        <div>
          {getStatusBadge(loan.status)}
        </div>
      </div>

      {error && (
        <div className="p-3 text-sm font-semibold text-red-600 bg-red-50 dark:bg-red-950/20 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-900/50">
          ⚠️ {error}
        </div>
      )}

      {/* Profile and Loan Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Applicant Profile */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-6 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-gray-800 dark:text-white border-b pb-2 border-gray-100 dark:border-zinc-800 uppercase tracking-wide">{L.memberCard}</h3>
          <div className="space-y-3.5 text-sm">
            <div>
              <span className="block text-[10px] font-bold text-gray-400 uppercase">{lang === "BN" ? "সদস্যের নাম" : "Name"}</span>
              <strong className="text-gray-900 dark:text-white">{loan.member.name}</strong>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-gray-400 uppercase">{L.memberCode}</span>
              <strong className="font-mono text-gray-900 dark:text-white">{loan.member.memberCode}</strong>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-gray-400 uppercase">{L.phone}</span>
              <strong className="font-mono text-gray-900 dark:text-white">{loan.member.phone}</strong>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-gray-400 uppercase">{L.address}</span>
              <strong className="text-gray-800 dark:text-gray-250">{loan.member.address}</strong>
            </div>
          </div>
        </div>

        {/* Loan Details */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-6 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-gray-800 dark:text-white border-b pb-2 border-gray-100 dark:border-zinc-800 uppercase tracking-wide">{L.loanCard}</h3>
          <div className="space-y-3.5 text-sm">
            <div>
              <span className="block text-[10px] font-bold text-gray-400 uppercase">{L.amount}</span>
              <strong className="font-mono text-gray-900 dark:text-white">{(loan.amount / 100).toLocaleString()} BDT</strong>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-gray-400 uppercase">{L.interest}</span>
              <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{Number(loan.interestRate)}% Flat</strong>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-gray-400 uppercase">{L.duration}</span>
              <strong className="text-gray-900 dark:text-white">{loan.durationValue} {loan.durationType === "WEEKLY" ? (lang === "BN" ? "সপ্তাহ" : "Weeks") : (lang === "BN" ? "মাস" : "Months")}</strong>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-gray-400 uppercase">{L.emi}</span>
              <strong className="font-mono text-emerald-700 dark:text-emerald-400">{(loan.emiAmount / 100).toLocaleString()} BDT</strong>
            </div>
          </div>
        </div>

        {/* Guarantors & Remarks */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-6 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-gray-800 dark:text-white border-b pb-2 border-gray-100 dark:border-zinc-800 uppercase tracking-wide">{L.guarantorCard}</h3>
          <div className="space-y-3.5 text-sm">
            <div>
              <span className="block text-[10px] font-bold text-gray-400 uppercase">{L.guarantor1}</span>
              {loan.guarantor1 ? (
                <div>
                  <strong className="text-gray-900 dark:text-white">{loan.guarantor1.name}</strong>
                  <span className="block text-xs font-mono text-gray-400">{loan.guarantor1.memberCode}</span>
                </div>
              ) : (
                <span className="text-gray-400 text-xs italic">{L.notSet}</span>
              )}
            </div>
            <div>
              <span className="block text-[10px] font-bold text-gray-400 uppercase">{L.guarantor2}</span>
              {loan.guarantor2 ? (
                <div>
                  <strong className="text-gray-900 dark:text-white">{loan.guarantor2.name}</strong>
                  <span className="block text-xs font-mono text-gray-400">{loan.guarantor2.memberCode}</span>
                </div>
              ) : (
                <span className="text-gray-400 text-xs italic">{L.notSet}</span>
              )}
            </div>
            {loan.remarks && (
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase">{lang === "BN" ? "মন্তব্য" : "Remarks"}</span>
                <p className="text-xs text-gray-500 mt-0.5">{loan.remarks}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Joint Approval board and Actions Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Joint Approval progress tracker */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-6 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-gray-800 dark:text-white border-b pb-2 border-gray-100 dark:border-zinc-800 uppercase tracking-wide">{L.jointApprovals}</h3>
          
          <div className="space-y-3.5">
            {/* President */}
            <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50/50 dark:bg-zinc-850 border border-gray-100/50 dark:border-zinc-800 text-sm">
              <div className="flex flex-col">
                <span className="font-bold text-gray-900 dark:text-white">{lang === "BN" ? "মোঃ জহিরুল ইসলাম সবুজ" : "Md. Johirul Islam Sobuj"}</span>
                <span className="text-[10px] text-gray-400 uppercase mt-0.5">{L.president}</span>
              </div>
              <div>
                {loan.presidentApproved ? (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">✅ {L.signed}</span>
                ) : (
                  <span className="text-xs font-semibold text-amber-500 flex items-center gap-1">⏳ {L.pendingSign}</span>
                )}
              </div>
            </div>

            {/* Secretary */}
            <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50/50 dark:bg-zinc-850 border border-gray-100/50 dark:border-zinc-800 text-sm">
              <div className="flex flex-col">
                <span className="font-bold text-gray-900 dark:text-white">{lang === "BN" ? "সম্পাদক" : "Secretary"}</span>
                <span className="text-[10px] text-gray-400 uppercase mt-0.5">{lang === "BN" ? "ডিজিটাল সিগনেচার" : "Digital Signature"}</span>
              </div>
              <div>
                {loan.secretaryApproved ? (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">✅ {L.signed}</span>
                ) : (
                  <span className="text-xs font-semibold text-amber-500 flex items-center gap-1">⏳ {L.pendingSign}</span>
                )}
              </div>
            </div>

            {/* Treasurer */}
            <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50/50 dark:bg-zinc-850 border border-gray-100/50 dark:border-zinc-800 text-sm">
              <div className="flex flex-col">
                <span className="font-bold text-gray-900 dark:text-white">{lang === "BN" ? "কোষাধ্যক্ষ" : "Treasurer"}</span>
                <span className="text-[10px] text-gray-400 uppercase mt-0.5">{lang === "BN" ? "ডিজিটাল সিগনেচার" : "Digital Signature"}</span>
              </div>
              <div>
                {loan.treasurerApproved ? (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">✅ {L.signed}</span>
                ) : (
                  <span className="text-xs font-semibold text-amber-500 flex items-center gap-1">⏳ {L.pendingSign}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Action signature Desk (Only shown if pending approval) */}
        {isPendingApproval && isStaffOrAdmin && (
          <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-6 rounded-2xl shadow-sm space-y-4 ring-1 ring-emerald-500/10">
            <h3 className="text-sm font-extrabold text-emerald-800 dark:text-emerald-400 border-b pb-2 border-gray-100 dark:border-zinc-800 uppercase tracking-wide flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
              {L.actionPanel}
            </h3>

            <div className="space-y-4">
              {/* Role select (For Super Admin only) */}
              {isSuperAdmin && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">
                    {L.roleSelect}
                  </label>
                  <select
                     value={selectedRole}
                     onChange={(e) => setSelectedRole(e.target.value as any)}
                     className="w-full px-4 py-2.5 text-sm bg-gray-50/50 dark:bg-zinc-850/50 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none dark:text-white"
                  >
                    <option value="">-- Role Select --</option>
                    {!loan.presidentApproved && <option value="PRESIDENT">{L.president}</option>}
                    {!loan.secretaryApproved && <option value="SECRETARY">{L.secretary}</option>}
                    {!loan.treasurerApproved && <option value="TREASURER">{L.treasurer}</option>}
                  </select>
                </div>
              )}

              {/* Show role if inferred */}
              {!isSuperAdmin && (
                <div className="text-xs text-gray-505">
                  {lang === "BN" ? "আপনি স্বাক্ষর করছেন হিসেবে:" : "You are signing as:"} <strong className="text-emerald-700 dark:text-emerald-400">
                    {selectedRole === "PRESIDENT" ? L.president : selectedRole === "SECRETARY" ? L.secretary : L.treasurer}
                  </strong>
                </div>
              )}

              {/* CASH/BANK paymentMode selection - only triggers on the 3rd final sign, but good to collect */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">
                  {L.paymentMode}
                </label>
                <div className="flex gap-2">
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as any)}
                    className="w-1/2 px-4 py-2.5 text-sm bg-gray-50/50 dark:bg-zinc-850/50 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none dark:text-white"
                  >
                    <option value="CASH">Cash (ক্যাশ বক্স)</option>
                    <option value="BANK">Bank Account (ব্যাংক)</option>
                  </select>

                  {paymentMode === "BANK" && (
                    <select
                      required
                      value={bankAccountId}
                      onChange={(e) => setBankAccountId(e.target.value)}
                      className="w-1/2 px-4 py-2.5 text-sm bg-gray-50/50 dark:bg-zinc-850/50 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none dark:text-white"
                    >
                      <option value="">-- {lang === "BN" ? "ব্যাংক নির্বাচন" : "Select Bank"} --</option>
                      {bankAccounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({acc.accountNumber})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Remarks */}
              <div>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder={L.remarksPlaceholder}
                  rows={2}
                  className="w-full px-4 py-2.5 text-sm bg-gray-50/50 dark:bg-zinc-850/50 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none dark:text-white resize-none"
                />
              </div>

              {/* Actions buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleApproval("REJECTED")}
                  className="flex-1 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-sm rounded-xl border border-rose-200 transition"
                >
                  {L.rejectBtn}
                </button>
                <button
                  type="button"
                  disabled={actionLoading || (!selectedRole && isSuperAdmin)}
                  onClick={() => handleApproval("APPROVED")}
                  className="flex-1 px-4 py-2.5 bg-emerald-650 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow transition"
                >
                  {actionLoading ? L.processing : L.approveBtn}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Amortization Schedule table */}
      {loan.status !== "PENDING" && loan.status !== "REJECTED" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-gray-800 dark:text-white">{L.scheduleTitle}</h3>
            <div className="text-xs text-gray-500 font-mono space-x-4">
              <span>{lang === "BN" ? "মোট প্রদেয়" : "Total Payable"}: <strong className="text-gray-800 dark:text-white">{(totalPayable / 100).toFixed(2)}</strong></span>
              <span>{lang === "BN" ? "মোট পরিশোধ" : "Total Repaid"}: <strong className="text-emerald-600">{(totalPaid / 100).toFixed(2)}</strong></span>
              <span>{lang === "BN" ? "বকেয়া" : "Outstanding"}: <strong className="text-rose-500">{(outstanding / 100).toFixed(2)}</strong></span>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-zinc-850/50 font-bold text-gray-500 dark:text-gray-400 border-b border-gray-150 dark:border-zinc-800">
                <tr>
                  <th className="px-5 py-3 w-16 text-center">{L.emiNum}</th>
                  <th className="px-5 py-3">{L.dueDate}</th>
                  <th className="px-5 py-3 text-right">{L.principal}</th>
                  <th className="px-5 py-3 text-right">{L.profit}</th>
                  <th className="px-5 py-3 text-right">{L.total}</th>
                  <th className="px-5 py-3 text-right">{L.paid}</th>
                  <th className="px-5 py-3 text-right">{L.rem}</th>
                  <th className="px-5 py-3 text-center">{L.status}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 text-gray-700 dark:text-gray-300 font-mono">
                {loan.schedules.map((s: any) => {
                  const rem = Math.max(0, s.totalAmount - s.paidAmount);
                  return (
                    <tr key={s.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-850/20 transition">
                      <td className="px-5 py-3 text-center font-bold">{s.emiNumber}</td>
                      <td className="px-5 py-3 text-gray-600 dark:text-gray-450 font-sans">
                        {new Date(s.dueDate).toLocaleDateString(lang === "BN" ? "bn-BD" : "en-US", { year: "numeric", month: "short", day: "numeric" })}
                      </td>
                      <td className="px-5 py-3 text-right">{(s.principalAmount / 100).toFixed(2)}</td>
                      <td className="px-5 py-3 text-right">{(s.interestAmount / 100).toFixed(2)}</td>
                      <td className="px-5 py-3 text-right font-bold">{(s.totalAmount / 100).toFixed(2)}</td>
                      <td className="px-5 py-3 text-right text-emerald-600 font-bold">{(s.paidAmount / 100).toFixed(2)}</td>
                      <td className="px-5 py-3 text-right text-rose-500">{(rem / 100).toFixed(2)}</td>
                      <td className="px-5 py-3 text-center font-sans">{getScheduleStatusBadge(s.status)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment logs (Receipt history) */}
      {loan.status !== "PENDING" && loan.status !== "REJECTED" && loan.payments.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-gray-800 dark:text-white">{L.paymentLogsTitle}</h3>
          
          <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-zinc-850/50 font-bold text-gray-500 dark:text-gray-400 border-b border-gray-150 dark:border-zinc-800">
                <tr>
                  <th className="px-5 py-3">{L.paymentDate}</th>
                  <th className="px-5 py-3">{L.receipt}</th>
                  <th className="px-5 py-3">{lang === "BN" ? "পেমেন্ট মোড" : "Payment Mode"}</th>
                  <th className="px-5 py-3 text-right">{L.principal}</th>
                  <th className="px-5 py-3 text-right">{L.profit}</th>
                  <th className="px-5 py-3 text-right">{L.totalPaid} BDT</th>
                  <th className="px-5 py-3">{L.remarks}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 text-gray-700 dark:text-gray-300">
                {loan.payments.map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-850/20 transition">
                    <td className="px-5 py-3 text-gray-600 dark:text-gray-450 text-xs">
                      {new Date(p.paymentDate).toLocaleDateString(lang === "BN" ? "bn-BD" : "en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-5 py-3 font-mono font-bold text-emerald-700 dark:text-emerald-400">{p.remarks?.split(" ").slice(0,1).join("") || "LN-PAY"}</td>
                    <td className="px-5 py-3 text-xs">{p.paymentMode === "CASH" ? "Cash" : "Bank"}</td>
                    <td className="px-5 py-3 text-right font-mono">{(p.principalPaid / 100).toFixed(2)}</td>
                    <td className="px-5 py-3 text-right font-mono">{(p.interestPaid / 100).toFixed(2)}</td>
                    <td className="px-5 py-3 text-right font-mono font-bold">{(p.amount / 100).toFixed(2)}</td>
                    <td className="px-5 py-3 text-xs text-gray-500">{p.remarks || "—"}</td>
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
