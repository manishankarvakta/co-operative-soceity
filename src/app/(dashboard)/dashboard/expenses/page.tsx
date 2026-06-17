"use client";

import { useEffect, useState } from "react";
import ExpenseForm from "@/components/forms/ExpenseForm";

export default function ExpensesPage() {
  const [lang, setLang] = useState<"BN" | "EN">("BN");
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });

  const fetchExpenses = async (page = 1) => {
    setLoading(true);
    try {
      const urlParams = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        status: filterStatus
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
  }, [filterStatus]);

  const handleApprove = async (id: string) => {
    const confirmApprove = window.confirm(
      lang === "BN" ? "আপনি কি নিশ্চিতভাবে এই খরচটি অনুমোদন করতে চান?" : "Are you sure you want to approve this expense?"
    );
    if (!confirmApprove) return;

    try {
      const response = await fetch(`/api/expenses/${id}/approve`, { method: "POST" });
      const result = await response.json();
      if (!response.ok || !result.success) {
        alert(result.message || "অনুমোদন করতে ব্যর্থ হয়েছে।");
      } else {
        alert(lang === "BN" ? "খরচ সফলভাবে অনুমোদিত হয়েছে।" : "Expense approved successfully.");
        fetchExpenses(pagination.currentPage);
      }
    } catch (err) {
      alert("সার্ভারে সমস্যা হয়েছে।");
    }
  };

  const handleReject = async (id: string) => {
    const confirmReject = window.confirm(
      lang === "BN" ? "আপনি কি নিশ্চিতভাবে এই খরচটি রিজেক্ট করতে চান?" : "Are you sure you want to reject this expense?"
    );
    if (!confirmReject) return;

    try {
      const response = await fetch(`/api/expenses/${id}/reject`, { method: "POST" });
      const result = await response.json();
      if (!response.ok || !result.success) {
        alert(result.message || "রিজেক্ট করতে ব্যর্থ হয়েছে।");
      } else {
        alert(lang === "BN" ? "খরচ সফলভাবে রিজেক্ট করা হয়েছে।" : "Expense rejected successfully.");
        fetchExpenses(pagination.currentPage);
      }
    } catch (err) {
      alert("সার্ভারে সমস্যা হয়েছে।");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full dark:bg-amber-950/20 dark:text-amber-400">
            পেন্ডিং (Pending)
          </span>
        );
      case "APPROVED":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full dark:bg-emerald-950/20 dark:text-emerald-400">
            অনুমোদিত (Approved)
          </span>
        );
      case "REJECTED":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-full dark:bg-red-950/20 dark:text-red-400">
            প্রত্যাখ্যাত (Rejected)
          </span>
        );
      default:
        return null;
    }
  };

  const getExpenseLabel = (cat: string) => {
    const categories: any = {
      OFFICE_RENT: { BN: "অফিস ভাড়া", EN: "Office Rent" },
      TRANSPORT: { BN: "যাতায়াত খরচ", EN: "Transport" },
      ENTERTAINMENT: { BN: "আপ্যায়ন খরচ", EN: "Entertainment" },
      LAND_PURCHASE: { BN: "ভূমি ক্রয়", EN: "Land Purchase" },
      OTHER: { BN: "অন্যান্য খরচ", EN: "Other Expense" }
    };
    return categories[cat]?.[lang] || cat;
  };

  const labels = {
    BN: {
      title: "খরচ ব্যবস্থাপনা তালিকা (Expense Ledger)",
      subtitle: "সমিতির বিভিন্ন প্রজেক্ট ও সাধারণ খরচের তালিকা এবং অনুমোদন ড্যাশবোর্ড।",
      addBtn: "+ নতুন খরচ এন্ট্রি",
      closeBtn: "ফর্ম বন্ধ করুন",
      filterAll: "সকল খরচ",
      filterPending: "পেন্ডিং অনুমোদন",
      filterApproved: "অনুমোদিত খরচ",
      filterRejected: "প্রত্যাখ্যাত খরচ",
      category: "ক্যাটাগরি",
      amount: "পরিমাণ (BDT)",
      date: "তারিখ",
      location: "স্থান / মাধ্যম",
      loggedBy: "এন্ট্রি করেছেন",
      status: "অবস্থা",
      action: "অ্যাকশন",
      approve: "অনুমোদন",
      reject: "রিজেক্ট",
      empty: "কোনো খরচের বিবরণ পাওয়া যায়নি।",
      loading: "লোডিং হচ্ছে..."
    },
    EN: {
      title: "Expense Management",
      subtitle: "List of general/project expenses and sign-off approval dashboards.",
      addBtn: "+ Record Expense",
      closeBtn: "Close Form",
      filterAll: "All Expenses",
      filterPending: "Pending Approval",
      filterApproved: "Approved Expenses",
      filterRejected: "Rejected Expenses",
      category: "Category",
      amount: "Amount (BDT)",
      date: "Date",
      location: "Location / Mode",
      loggedBy: "Logged By",
      status: "Status",
      action: "Action",
      approve: "Approve",
      reject: "Reject",
      empty: "No expense records found.",
      loading: "Loading..."
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Title block */}
      <div className="flex justify-between items-center border-b pb-4 border-gray-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{labels[lang].title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{labels[lang].subtitle}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg shadow transition"
          >
            {showForm ? labels[lang].closeBtn : labels[lang].addBtn}
          </button>
          <button
            type="button"
            onClick={() => setLang(lang === "BN" ? "EN" : "BN")}
            className="px-3 py-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border hover:bg-emerald-100"
          >
            {lang === "BN" ? "English" : "বাংলা"}
          </button>
        </div>
      </div>

      {/* Expense Form Collapse */}
      {showForm && (
        <div className="flex justify-center transition-all">
          <ExpenseForm onSuccess={() => {
            setShowForm(false);
            fetchExpenses(1);
          }} />
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 p-2 bg-gray-55 dark:bg-zinc-850 rounded-lg max-w-lg border border-gray-150 dark:border-zinc-800 text-xs font-semibold">
        <button
          onClick={() => setFilterStatus("")}
          className={`px-3 py-1.5 rounded-md transition ${filterStatus === "" ? "bg-white dark:bg-zinc-800 shadow" : "text-gray-500 hover:text-gray-700"}`}
        >
          {labels[lang].filterAll}
        </button>
        <button
          onClick={() => setFilterStatus("PENDING")}
          className={`px-3 py-1.5 rounded-md transition ${filterStatus === "PENDING" ? "bg-white dark:bg-zinc-800 shadow" : "text-gray-500 hover:text-gray-700"}`}
        >
          {labels[lang].filterPending}
        </button>
        <button
          onClick={() => setFilterStatus("APPROVED")}
          className={`px-3 py-1.5 rounded-md transition ${filterStatus === "APPROVED" ? "bg-white dark:bg-zinc-800 shadow" : "text-gray-500 hover:text-gray-700"}`}
        >
          {labels[lang].filterApproved}
        </button>
        <button
          onClick={() => setFilterStatus("REJECTED")}
          className={`px-3 py-1.5 rounded-md transition ${filterStatus === "REJECTED" ? "bg-white dark:bg-zinc-800 shadow" : "text-gray-500 hover:text-gray-700"}`}
        >
          {labels[lang].filterRejected}
        </button>
      </div>

      {/* Tables Grid */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-150 dark:border-zinc-800 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-zinc-850 text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold border-b border-gray-150 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4">{labels[lang].category}</th>
                <th className="px-6 py-4">{labels[lang].amount}</th>
                <th className="px-6 py-4">{labels[lang].date}</th>
                <th className="px-6 py-4">{labels[lang].location}</th>
                <th className="px-6 py-4">{labels[lang].loggedBy}</th>
                <th className="px-6 py-4">{labels[lang].status}</th>
                <th className="px-6 py-4 text-right">{labels[lang].action}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    {labels[lang].loading}
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    {labels[lang].empty}
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-800 dark:text-white">
                      {getExpenseLabel(exp.category)}
                    </td>
                    <td className="px-6 py-4 font-bold font-mono text-gray-850 dark:text-zinc-200">
                      {(exp.amount / 100).toLocaleString(lang === "BN" ? "bn-BD" : "en-US", { minimumFractionDigits: 2 })} BDT
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-600 dark:text-gray-300">
                      {new Date(exp.date).toLocaleDateString(lang === "BN" ? "bn-BD" : "en-US")}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {exp.location}
                    </td>
                    <td className="px-6 py-4 text-gray-650 dark:text-gray-400">
                      {exp.loggedBy.name || exp.loggedBy.email}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(exp.status)}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {exp.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => handleApprove(exp.id)}
                            className="px-2.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition"
                          >
                            {labels[lang].approve}
                          </button>
                          <button
                            onClick={() => handleReject(exp.id)}
                            className="px-2.5 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded transition"
                          >
                            {labels[lang].reject}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination console */}
        {pagination.totalPages > 1 && (
          <div className="p-4 bg-gray-50 dark:bg-zinc-850 border-t border-gray-150 dark:border-zinc-850 flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
            <span>মোট খরচ এন্ট্রি: {pagination.totalItems} টি</span>
            <div className="flex gap-2">
              <button
                disabled={pagination.currentPage === 1}
                onClick={() => fetchExpenses(pagination.currentPage - 1)}
                className="px-3 py-1 bg-white dark:bg-zinc-800 border rounded-md disabled:opacity-50 transition"
              >
                পূর্ববর্তী
              </button>
              <span className="py-1">
                পৃষ্ঠা {pagination.currentPage} / {pagination.totalPages}
              </span>
              <button
                disabled={pagination.currentPage === pagination.totalPages}
                onClick={() => fetchExpenses(pagination.currentPage + 1)}
                className="px-3 py-1 bg-white dark:bg-zinc-800 border rounded-md disabled:opacity-50 transition"
              >
                পরবর্তী
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
