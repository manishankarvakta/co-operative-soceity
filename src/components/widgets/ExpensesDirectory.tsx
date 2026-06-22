"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ConfirmModal, Toast, useToast } from "@/components/ui/ConfirmModal";
import { useLanguage } from "@/providers/LanguageProvider";

type PendingAction = { type: "approve" | "reject"; id: string } | null;

interface ExpensesDirectoryProps {
  status?: "PENDING" | "APPROVED" | "REJECTED";
}

export default function ExpensesDirectory({ status }: ExpensesDirectoryProps) {
  const { lang } = useLanguage();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });

  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const { toast, showToast } = useToast();

  const fetchExpenses = async (page = 1) => {
    setLoading(true);
    try {
      const urlParams = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        status: status || ""
      });
      const response = await fetch(`/api/expenses?${urlParams}`);
      const data = await response.json();
      setExpenses(data.expenses || []);
      setPagination(data.pagination || { currentPage: 1, totalPages: 1, totalItems: 0 });
    } catch (error) {
      console.error("Failed to load expenses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses(1);
  }, [status]);

  const handleConfirm = async () => {
    if (!pendingAction) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/expenses/${pendingAction.id}/${pendingAction.type}`, { method: "POST" });
      const result = await res.json();
      setPendingAction(null);
      if (!res.ok || !result.success) {
        showToast("error", lang === "BN" ? "ব্যর্থ হয়েছে" : "Failed", result.message);
      } else {
        const title = pendingAction.type === "approve"
          ? (lang === "BN" ? "সফলভাবে অনুমোদিত" : "Approved Successfully")
          : (lang === "BN" ? "সফলভাবে রিজেক্ট" : "Rejected Successfully");
        const msg = pendingAction.type === "approve"
          ? (lang === "BN" ? "খরচটি অনুমোদন করা হয়েছে।" : "The expense has been approved.")
          : (lang === "BN" ? "খরচটি রিজেক্ট করা হয়েছে।" : "The expense has been rejected.");
        showToast("success", title, msg);
        fetchExpenses(pagination.currentPage);
      }
    } catch {
      setPendingAction(null);
      showToast("error", lang === "BN" ? "সার্ভার সমস্যা" : "Server Error", lang === "BN" ? "সার্ভারে সমস্যা হয়েছে।" : "Something went wrong.");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (statusVal: string) => {
    switch (statusVal) {
      case "PENDING":
        return <span className="px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full dark:bg-amber-950/20 dark:text-amber-400">পেন্ডিং (Pending)</span>;
      case "APPROVED":
        return <span className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full dark:bg-emerald-950/20 dark:text-emerald-400">অনুমোদিত (Approved)</span>;
      case "REJECTED":
        return <span className="px-2.5 py-1 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-full dark:bg-red-950/20 dark:text-red-400">প্রত্যাখ্যাত (Rejected)</span>;
      default: return null;
    }
  };

  const getExpenseLabel = (cat: string) => {
    const categories: any = {
      OFFICE_RENT: { BN: "অফিস ভাড়া", EN: "Office Rent" },
      TRANSPORT: { BN: "যাতায়াত খরচ", EN: "Transport" },
      ENTERTAINMENT: { BN: "আপ্যায়ন খরচ", EN: "Entertainment" },
      LAND_PURCHASE: { BN: "ভূমি ক্রয়", EN: "Land Purchase" },
      OTHER: { BN: "অন্যান্য খরচ", EN: "Other Expense" }
    };
    return categories[cat]?.[lang] || cat;
  };

  const getHeadings = () => {
    if (status === "PENDING") {
      return {
        BN: {
          title: "পেন্ডিং অনুমোদন (Pending Sign-off)",
          subtitle: "অনুমোদনের জন্য পেন্ডিং থাকা সকল খরচের তালিকা ও ড্যাশবোর্ড।"
        },
        EN: {
          title: "Pending Approval",
          subtitle: "List of all expense records pending for sign-off approval."
        }
      }[lang];
    } else if (status === "APPROVED") {
      return {
        BN: {
          title: "অনুমোদিত খরচসমূহ (Approved Expenses)",
          subtitle: "সমিতির অনুমোদিত সকল খরচের তালিকা।"
        },
        EN: {
          title: "Approved Expenses",
          subtitle: "List of all approved cooperative expense records."
        }
      }[lang];
    } else if (status === "REJECTED") {
      return {
        BN: {
          title: "প্রত্যাখ্যাত খরচসমূহ (Rejected Expenses)",
          subtitle: "সমিতির প্রত্যাখ্যান করা সকল খরচের তালিকা।"
        },
        EN: {
          title: "Rejected Expenses",
          subtitle: "List of all rejected cooperative expense records."
        }
      }[lang];
    } else {
      return {
        BN: {
          title: "খরচ ব্যবস্থাপনা তালিকা (Expense Ledger)",
          subtitle: "সমিতির বিভিন্ন প্রজেক্ট ও সাধারণ খরচের তালিকা এবং অনুমোদন ড্যাশবোর্ড।"
        },
        EN: {
          title: "Expense Ledger",
          subtitle: "List of general/project expenses and sign-off approval dashboards."
        }
      }[lang];
    }
  };

  const H = getHeadings();

  const L = {
    BN: {
      addBtn: "+ নতুন খরচ এন্ট্রি",
      category: "ক্যাটাগরি", amount: "পরিমাণ (BDT)", date: "তারিখ", location: "স্থান / মাধ্যম",
      loggedBy: "এন্ট্রি করেছেন", status: "অবস্থা", action: "অ্যাকশন",
      approve: "অনুমোদন", reject: "রিজেক্ট",
      approveTitle: "খরচ অনুমোদন করুন", approveMsg: "আপনি কি নিশ্চিতভাবে এই খরচটি অনুমোদন করতে চান?",
      rejectTitle: "খরচ রিজেক্ট করুন", rejectMsg: "আপনি কি নিশ্চিতভাবে এই খরচটি রিজেক্ট করতে চান?",
      confirmApprove: "হ্যাঁ, অনুমোদন করুন", confirmReject: "হ্যাঁ, রিজেক্ট করুন", cancel: "বাতিল করুন",
      empty: "কোনো খরচের বিবরণ পাওয়া যায়নি।", loading: "লোডিং হচ্ছে...",
    },
    EN: {
      addBtn: "+ Record Expense",
      category: "Category", amount: "Amount (BDT)", date: "Date", location: "Location / Mode",
      loggedBy: "Logged By", status: "Status", action: "Action",
      approve: "Approve", reject: "Reject",
      approveTitle: "Approve Expense", approveMsg: "Are you sure you want to approve this expense?",
      rejectTitle: "Reject Expense", rejectMsg: "Are you sure you want to reject this expense?",
      confirmApprove: "Yes, Approve", confirmReject: "Yes, Reject", cancel: "Cancel",
      empty: "No expense records found.", loading: "Loading...",
    }
  }[lang];

  return (
    <div className="p-6 md:p-8 space-y-6">

      {/* Shared Modal */}
      <ConfirmModal
        open={!!pendingAction}
        variant={pendingAction?.type === "approve" ? "approve" : "reject"}
        title={pendingAction?.type === "approve" ? L.approveTitle : L.rejectTitle}
        message={pendingAction?.type === "approve" ? L.approveMsg : L.rejectMsg}
        confirmText={pendingAction?.type === "approve" ? L.confirmApprove : L.confirmReject}
        cancelText={L.cancel}
        loading={actionLoading}
        onConfirm={handleConfirm}
        onCancel={() => setPendingAction(null)}
      />

      {/* Shared Toast */}
      <Toast toast={toast} />

      {/* Title block */}
      <div className="flex justify-between items-center border-b pb-4 border-gray-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{H.title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{H.subtitle}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/expenses/new" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg shadow-md hover:shadow-md transition">
            {L.addBtn}
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm ring-1 ring-gray-900/5 dark:ring-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/80 dark:bg-zinc-850/50 text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold border-b border-gray-100 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4">{L.category}</th>
                <th className="px-6 py-4">{L.amount}</th>
                <th className="px-6 py-4">{L.date}</th>
                <th className="px-6 py-4">{L.location}</th>
                <th className="px-6 py-4">{L.loggedBy}</th>
                <th className="px-6 py-4">{L.status}</th>
                {(!status || status === "PENDING") && <th className="px-6 py-4 text-right">{L.action}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-500">{L.loading}</td></tr>
              ) : expenses.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-500">{L.empty}</td></tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-800 dark:text-white">{getExpenseLabel(exp.category)}</td>
                    <td className="px-6 py-4 font-bold font-mono text-gray-850 dark:text-zinc-200">
                      {(exp.amount / 100).toLocaleString(lang === "BN" ? "bn-BD" : "en-US", { minimumFractionDigits: 2 })} BDT
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-600 dark:text-gray-300">
                      {new Date(exp.date).toLocaleDateString(lang === "BN" ? "bn-BD" : "en-US")}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{exp.location}</td>
                    <td className="px-6 py-4 text-gray-650 dark:text-gray-400">{exp.loggedBy.name || exp.loggedBy.email}</td>
                    <td className="px-6 py-4">{getStatusBadge(exp.status)}</td>
                    {(!status || status === "PENDING") && (
                      <td className="px-6 py-4 text-right space-x-2">
                        {exp.status === "PENDING" && (
                          <>
                            <button onClick={() => setPendingAction({ type: "approve", id: exp.id })}
                              className="px-2.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition">
                              {L.approve}
                            </button>
                            <button onClick={() => setPendingAction({ type: "reject", id: exp.id })}
                              className="px-2.5 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded transition">
                              {L.reject}
                            </button>
                          </>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="p-4 bg-gray-50/50 dark:bg-zinc-850/50 border-t border-gray-100 dark:border-zinc-800 flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
            <span>{lang === "BN" ? "মোট খরচ এন্ট্রি" : "Total Entries"}: {pagination.totalItems} {lang === "BN" ? "টি" : ""}</span>
            <div className="flex gap-2">
              <button disabled={pagination.currentPage === 1} onClick={() => fetchExpenses(pagination.currentPage - 1)}
                className="px-3 py-1 bg-white dark:bg-zinc-800 border dark:border-zinc-700 rounded-md disabled:opacity-50 transition">{lang === "BN" ? "পূর্ববর্তী" : "Previous"}</button>
              <span className="py-1">{lang === "BN" ? "পৃষ্ঠা" : "Page"} {pagination.currentPage} / {pagination.totalPages}</span>
              <button disabled={pagination.currentPage === pagination.totalPages} onClick={() => fetchExpenses(pagination.currentPage + 1)}
                className="px-3 py-1 bg-white dark:bg-zinc-800 border dark:border-zinc-700 rounded-md disabled:opacity-50 transition">{lang === "BN" ? "পরবর্তী" : "Next"}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
