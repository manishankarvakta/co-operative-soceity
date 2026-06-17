"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MemberSearchFilters from "@/components/widgets/MemberSearchFilters";
import { useLanguage } from "@/providers/LanguageProvider";

export default function MembersListPage() {
  const { lang } = useLanguage();
  const [members, setMembers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });

  const fetchMembers = async (page = 1) => {
    setLoading(true);
    try {
      const urlParams = new URLSearchParams({
        page: page.toString(),
        search,
        status
      });
      const response = await fetch(`/api/members?${urlParams}`);
      const data = await response.json();
      setMembers(data.members || []);
      setPagination(data.pagination || { currentPage: 1, totalPages: 1, totalItems: 0 });
    } catch (error) {
      console.error("Failed to load members:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers(1);
  }, [search, status]);

  const labels = {
    BN: {
      active: "সক্রিয় (Active)",
      inactive: "নিষ্ক্রিয় (Inactive)",
      suspended: "সাসপেন্ড (Suspended)",
      title: "সদস্য তালিকা (Members Directory)",
      subtitle: "সমিতির নিবন্ধিত সকল সদস্যদের তালিকা এবং তথ্য নিয়ন্ত্রণ প্যানেল।",
      addBtn: "+ নতুন সদস্য ভর্তি",
      colId: "মেম্বার আইডি",
      colName: "সদস্যের নাম",
      colPhone: "মোবাইল নম্বর",
      colStatus: "অবস্থা (Status)",
      colDate: "যোগদানের তারিখ",
      colAction: "অ্যাকশন",
      loading: "অপেক্ষা করুন...",
      noData: "কোনো সদস্য খুঁজে পাওয়া যায়নি।",
      viewProfile: "প্রোফাইল দেখুন",
      totalMembers: "মোট সদস্য",
      unit: "জন",
      prev: "পূর্ববর্তী",
      next: "পরবর্তী",
      page: "পৃষ্ঠা"
    },
    EN: {
      active: "Active",
      inactive: "Inactive",
      suspended: "Suspended",
      title: "Members Directory",
      subtitle: "List of all registered members and information control panel.",
      addBtn: "+ Add New Member",
      colId: "Member ID",
      colName: "Member Name",
      colPhone: "Mobile No.",
      colStatus: "Status",
      colDate: "Join Date",
      colAction: "Action",
      loading: "Please wait...",
      noData: "No members found.",
      viewProfile: "View Profile",
      totalMembers: "Total Members",
      unit: "members",
      prev: "Previous",
      next: "Next",
      page: "Page"
    }
  };

  const getStatusBadge = (memStatus: string) => {
    switch (memStatus) {
      case "ACTIVE":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50">
            {labels[lang].active}
          </span>
        );
      case "INACTIVE":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-full dark:bg-zinc-800 dark:text-gray-400 dark:border-zinc-700">
            {labels[lang].inactive}
          </span>
        );
      case "SUSPENDED":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50">
            {labels[lang].suspended}
          </span>
        );
      default:
        return null;
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
        <Link
          href="/dashboard/members/new"
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg shadow-md transition-all duration-200"
        >
          {labels[lang].addBtn}
        </Link>
      </div>

      {/* Filter panel */}
      <MemberSearchFilters
        search={search}
        status={status}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
      />

      {/* Tables Grid */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-150 dark:border-zinc-800 shadow-md overflow-hidden transition-all duration-300">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-zinc-850 text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold border-b border-gray-150 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4">{labels[lang].colId}</th>
                <th className="px-6 py-4">{labels[lang].colName}</th>
                <th className="px-6 py-4">{labels[lang].colPhone}</th>
                <th className="px-6 py-4">{labels[lang].colStatus}</th>
                <th className="px-6 py-4">{labels[lang].colDate}</th>
                <th className="px-6 py-4 text-right">{labels[lang].colAction}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    {labels[lang].loading}
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    {labels[lang].noData}
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4 font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                      {member.memberCode}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-800 dark:text-white">
                      {member.name}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {member.phone}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(member.status)}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {new Date(member.joinDate).toLocaleDateString(lang === "BN" ? "bn-BD" : "en-US")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/dashboard/members/${member.id}`}
                        className="px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 border border-emerald-250 dark:border-emerald-800 rounded-md transition-all"
                      >
                        {labels[lang].viewProfile}
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Console */}
        {pagination.totalPages > 1 && (
          <div className="p-4 bg-gray-50 dark:bg-zinc-850 border-t border-gray-150 dark:border-zinc-850 flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
            <span>{labels[lang].totalMembers}: {pagination.totalItems} {labels[lang].unit}</span>
            <div className="flex gap-2">
              <button
                disabled={pagination.currentPage === 1}
                onClick={() => fetchMembers(pagination.currentPage - 1)}
                className="px-3 py-1 bg-white dark:bg-zinc-800 border rounded-md disabled:opacity-50 transition"
              >
                {labels[lang].prev}
              </button>
              <span className="py-1">
                {labels[lang].page} {pagination.currentPage} / {pagination.totalPages}
              </span>
              <button
                disabled={pagination.currentPage === pagination.totalPages}
                onClick={() => fetchMembers(pagination.currentPage + 1)}
                className="px-3 py-1 bg-white dark:bg-zinc-800 border rounded-md disabled:opacity-50 transition"
              >
                {labels[lang].next}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
