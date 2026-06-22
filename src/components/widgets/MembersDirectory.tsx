"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Edit2, Trash2 } from "lucide-react";
import MemberSearchFilters from "@/components/widgets/MemberSearchFilters";
import { useLanguage } from "@/providers/LanguageProvider";
import { ConfirmModal, Toast, useToast } from "@/components/ui/ConfirmModal";

interface MembersDirectoryProps {
  role?: string;
}

export default function MembersDirectory({ role }: MembersDirectoryProps) {
  const { lang } = useLanguage();
  const router = useRouter();
  const [members, setMembers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });

  // Deletion state
  const { toast, showToast } = useToast();
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<any>(null);

  const fetchMembers = async (page = 1) => {
    setLoading(true);
    try {
      const urlParams = new URLSearchParams({
        page: page.toString(),
        search,
        status
      });
      if (role) {
        urlParams.append("role", role);
      }
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

  const handleConfirmDelete = async () => {
    if (!memberToDelete) return;
    setDeleteLoading(true);
    setDeleteModal(false);
    try {
      const response = await fetch(`/api/members/${memberToDelete.id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok || !result.success) {
        showToast("error", labels[lang].deleteFail, result.message || labels[lang].deleteFailMsg);
      } else {
        showToast("success", labels[lang].deleteSuccess, labels[lang].deleteSuccessMsg);
        fetchMembers(pagination.currentPage);
      }
    } catch (error) {
      showToast("error", labels[lang].serverError, labels[lang].serverError);
    } finally {
      setDeleteLoading(false);
      setMemberToDelete(null);
    }
  };

  const getRoleHeadings = () => {
    if (role === "ACCOUNTANT") {
      return {
        BN: {
          title: "হিসাব রক্ষক তালিকা (Accounters Directory)",
          subtitle: "সমিতির সকল হিসাব রক্ষকদের তালিকা।"
        },
        EN: {
          title: "Accounters Directory",
          subtitle: "List of all registered accountants."
        }
      }[lang];
    } else if (role === "SUPER_ADMIN") {
      return {
        BN: {
          title: "এডমিন তালিকা (Admins Directory)",
          subtitle: "সমিতির সকল সিস্টেম এডমিনদের তালিকা।"
        },
        EN: {
          title: "Admins Directory",
          subtitle: "List of all registered system administrators."
        }
      }[lang];
    } else {
      return {
        BN: {
          title: "সদস্য তালিকা (Members Directory)",
          subtitle: "সমিতির নিবন্ধিত সকল সদস্যদের তালিকা এবং তথ্য নিয়ন্ত্রণ প্যানেল।"
        },
        EN: {
          title: "Members Directory",
          subtitle: "List of all registered members and information control panel."
        }
      }[lang];
    }
  };

  const labels = {
    BN: {
      active: "সক্রিয় (Active)",
      inactive: "নিষ্ক্রিয় (Inactive)",
      suspended: "সাসপেন্ড (Suspended)",
      addBtn: "+ নতুন সদস্য ভর্তি",
      colId: "মেম্বার আইডি",
      colName: "সদস্যের নাম",
      colPhone: "মোবাইল নম্বর",
      colStatus: "অবস্থা (Status)",
      colDate: "যোগদানের তারিখ",
      colAction: "অ্যাকশন",
      loading: "অপেক্ষা করুন...",
      noData: "কোনো সদস্য খুঁজে পাওয়া যায়নি।",
      totalMembers: "মোট সদস্য",
      unit: "জন",
      prev: "পূর্ববর্তী",
      next: "পরবর্তী",
      page: "পৃষ্ঠা",
      deleteTitle: "সদস্য ডিলিট করুন",
      deleteMessage: "আপনি কি নিশ্চিতভাবে এই সদস্য অ্যাকাউন্টটি ডিলিট করতে চান? (এটি সফট-ডিলিট হবে)",
      deleteConfirm: "হ্যাঁ, ডিলিট করুন",
      cancel: "বাতিল করুন",
      deleteFail: "মুছে ফেলতে ব্যর্থ",
      deleteFailMsg: "সদস্য মুছে ফেলতে ব্যর্থ হয়েছে।",
      deleteSuccess: "সফলভাবে মুছে ফেলা হয়েছে",
      deleteSuccessMsg: "সদস্য অ্যাকাউন্টটি মুছে ফেলা হয়েছে।",
      serverError: "সার্ভারে সমস্যা হয়েছে।"
    },
    EN: {
      active: "Active",
      inactive: "Inactive",
      suspended: "Suspended",
      addBtn: "+ Add New Member",
      colId: "Member ID",
      colName: "Member Name",
      colPhone: "Mobile No.",
      colStatus: "Status",
      colDate: "Join Date",
      colAction: "Action",
      loading: "Please wait...",
      noData: "No members found.",
      totalMembers: "Total Members",
      unit: "members",
      prev: "Previous",
      next: "Next",
      page: "Page",
      deleteTitle: "Delete Member",
      deleteMessage: "Are you sure you want to delete this member account? (This will be a soft-delete)",
      deleteConfirm: "Yes, Delete",
      cancel: "Cancel",
      deleteFail: "Failed to delete",
      deleteFailMsg: "Failed to delete member.",
      deleteSuccess: "Successfully deleted",
      deleteSuccessMsg: "Member account has been deleted.",
      serverError: "Server error occurred."
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

  const headings = getRoleHeadings();

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Delete Confirm Modal */}
      <ConfirmModal
        open={deleteModal}
        variant="delete"
        title={labels[lang].deleteTitle}
        message={labels[lang].deleteMessage}
        confirmText={labels[lang].deleteConfirm}
        cancelText={labels[lang].cancel}
        loading={deleteLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteModal(false);
          setMemberToDelete(null);
        }}
      />

      {/* Toast */}
      <Toast toast={toast} />

      {/* Title block */}
      <div className="flex justify-between items-center border-b pb-4 border-gray-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{headings.title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{headings.subtitle}</p>
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
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-black/5 dark:border-zinc-800 shadow-md overflow-hidden transition-all duration-300">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-zinc-850 text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold border-b border-black/5 dark:border-zinc-800">
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
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/dashboard/members/${member.id}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-450 bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100/70 border border-emerald-250 dark:border-emerald-800/50 rounded-md transition-all shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{lang === "BN" ? "দেখুন" : "View"}</span>
                        </Link>
                        <Link
                          href={`/dashboard/members/${member.id}?edit=true`}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-450 bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100/70 border border-blue-200 dark:border-blue-800/50 rounded-md transition-all shadow-sm"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>{lang === "BN" ? "এডিট" : "Edit"}</span>
                        </Link>
                        <button
                          onClick={() => {
                            setMemberToDelete(member);
                            setDeleteModal(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-450 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100/70 border border-rose-200 dark:border-rose-800/50 rounded-md transition-all shadow-sm"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{lang === "BN" ? "ডিলিট" : "Delete"}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Console */}
        {pagination.totalPages > 1 && (
          <div className="p-4 bg-gray-50 dark:bg-zinc-850 border-t border-black/5 dark:border-zinc-850 flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
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
