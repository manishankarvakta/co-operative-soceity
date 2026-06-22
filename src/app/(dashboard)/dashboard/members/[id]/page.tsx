"use client";

import { use, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ShieldAlert } from "lucide-react";
import MemberForm from "@/components/forms/MemberForm";
import NomineeForm from "@/components/forms/NomineeForm";
import { ConfirmModal, Toast, useToast } from "@/components/ui/ConfirmModal";
import { useLanguage } from "@/providers/LanguageProvider";

interface ProfilePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function MemberProfilePage({ params }: ProfilePageProps) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { lang } = useLanguage();
  const [member, setMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editNomineeMode, setEditNomineeMode] = useState(false);

  const [selectedRole, setSelectedRole] = useState("");
  const [roleUpdating, setRoleUpdating] = useState(false);

  const isSuperAdmin = session?.user && (session.user as any).roles?.includes("SUPER_ADMIN");

  useEffect(() => {
    if (searchParams.get("edit") === "true") {
      setEditMode(true);
    }
  }, [searchParams]);

  // Modal & Toast
  const { toast, showToast } = useToast();
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const labels = {
    BN: {
      loading: "লোডিং হচ্ছে...",
      errorNotFoud: "সদস্যের তথ্য পাওয়া যায়নি।",
      serverError: "সার্ভারে সমস্যা হয়েছে।",
      deleteTitle: "সদস্য ডিলিট করুন",
      deleteMessage: "আপনি কি নিশ্চিতভাবে এই সদস্য অ্যাকাউন্টটি ডিলিট করতে চান? (এটি সফট-ডিলিট হবে)",
      deleteConfirm: "হ্যাঁ, ডিলিট করুন",
      cancel: "বাতিল করুন",
      deleteFail: "মুছে ফেলতে ব্যর্থ",
      deleteFailMsg: "সদস্য মুছে ফেলতে ব্যর্থ হয়েছে।",
      deleteSuccess: "সফলভাবে মুছে ফেলা হয়েছে",
      deleteSuccessMsg: "সদস্য অ্যাকাউন্টটি মুছে ফেলা হয়েছে।",
      backCancel: "← ফিরে যান (Cancel)",
      editBtn: "সম্পাদনা (Edit)",
      deleteBtn: "ডিলিট করুন",
      profileSummary: "সদস্যের বিবরণ (Profile Summary)",
      mobile: "মোবাইল নম্বর",
      email: "ইমেইল",
      joinDate: "যোগদানের তারিখ",
      status: "সদস্যপদ স্ট্যাটাস",
      address: "বর্তমান ঠিকানা",
      nomineeSummary: "নমিনী বিবরণ (Nominee Summary)",
      editNominee: "এডিট করুন",
      nomineeName: "নমিনীর নাম",
      relation: "সম্পর্ক",
      nomineeMobile: "মোবাইল নম্বর",
      nomineeEmergency: "জরুরি যোগাযোগ",
      nomineeAddress: "ঠিকানা"
    },
    EN: {
      loading: "Loading...",
      errorNotFoud: "Member information not found.",
      serverError: "Server error occurred.",
      deleteTitle: "Delete Member",
      deleteMessage: "Are you sure you want to delete this member account? (This will be a soft-delete)",
      deleteConfirm: "Yes, Delete",
      cancel: "Cancel",
      deleteFail: "Failed to delete",
      deleteFailMsg: "Failed to delete member.",
      deleteSuccess: "Successfully deleted",
      deleteSuccessMsg: "Member account has been deleted.",
      backCancel: "← Go Back (Cancel)",
      editBtn: "Edit",
      deleteBtn: "Delete",
      profileSummary: "Profile Summary",
      mobile: "Mobile Number",
      email: "Email",
      joinDate: "Join Date",
      status: "Membership Status",
      address: "Current Address",
      nomineeSummary: "Nominee Summary",
      editNominee: "Edit",
      nomineeName: "Nominee Name",
      relation: "Relationship",
      nomineeMobile: "Mobile Number",
      nomineeEmergency: "Emergency Contact",
      nomineeAddress: "Address"
    }
  };

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/members/${id}`);
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || labels[lang].errorNotFoud);
      } else {
        setMember(data);
        const roles = data.user?.userRoles?.map((ur: any) => ur.role.name) || [];
        if (roles.includes("SUPER_ADMIN")) {
          setSelectedRole("SUPER_ADMIN");
        } else if (roles.includes("ACCOUNTANT")) {
          setSelectedRole("ACCOUNTANT");
        } else {
          setSelectedRole("MEMBER");
        }
      }
    } catch (err) {
      setError(labels[lang].serverError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const handleConfirmDelete = async () => {
    setDeleteLoading(true);
    setDeleteModal(false);
    try {
      const response = await fetch(`/api/members/${id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok || !result.success) {
        showToast("error", labels[lang].deleteFail, result.message || labels[lang].deleteFailMsg);
      } else {
        showToast("success", labels[lang].deleteSuccess, labels[lang].deleteSuccessMsg);
        setTimeout(() => {
          router.push("/dashboard/members");
          router.refresh();
        }, 1200);
      }
    } catch (error) {
      showToast("error", labels[lang].serverError, labels[lang].serverError);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleRoleUpdate = async () => {
    setRoleUpdating(true);
    try {
      const response = await fetch(`/api/members/${id}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selectedRole })
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        showToast("error", lang === "BN" ? "রোল আপডেট ব্যর্থ" : "Role Update Failed", result.message || result.error || "");
      } else {
        showToast("success", lang === "BN" ? "রোল আপডেট সফল" : "Role Updated", result.message || "");
        fetchProfile();
      }
    } catch (error) {
      showToast("error", labels[lang].serverError, labels[lang].serverError);
    } finally {
      setRoleUpdating(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">{labels[lang].loading}</div>;
  }

  if (error || !member) {
    return (
      <div className="p-8 text-center text-red-500 font-bold">
        ⚠️ {error || labels[lang].errorNotFoud}
      </div>
    );
  }

  if (editMode) {
    return (
      <div className="p-6 md:p-8 flex flex-col items-center space-y-4">
        <button
          onClick={() => setEditMode(false)}
          className="self-start px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-lg border transition-all mb-4"
        >
          {labels[lang].backCancel}
        </button>
        <MemberForm initialData={member} memberId={id} />
      </div>
    );
  }

  const handleNomineeUpdateSuccess = (updatedNominee: any) => {
    setMember((prev: any) => ({ ...prev, nominee: updatedNominee }));
    setEditNomineeMode(false);
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto relative">

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
        onCancel={() => setDeleteModal(false)}
      />

      {/* Toast */}
      <Toast toast={toast} />

      {/* Standalone Nominee Form Overlay */}
      {editNomineeMode && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <NomineeForm
            memberId={id}
            initialData={member.nominee}
            onSuccess={handleNomineeUpdateSuccess}
            onCancel={() => setEditNomineeMode(false)}
          />
        </div>
      )}

      {/* Header with actions */}
      <div className="flex justify-between items-center border-b pb-4 border-gray-200 dark:border-zinc-800">
        <div>
          <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 font-mono text-xs font-bold rounded-full border border-emerald-200 dark:border-emerald-900/50">
            {member.memberCode}
          </span>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mt-2">
            {member.name}
          </h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setEditMode(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg shadow-md transition-all duration-200"
          >
            {labels[lang].editBtn}
          </button>
          <button
            onClick={() => setDeleteModal(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-lg shadow-md transition-all duration-200"
          >
            {labels[lang].deleteBtn}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Member Profile Card & Role Settings */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm ring-1 ring-gray-900/5 dark:ring-white/10 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50">
              <h2 className="text-lg font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                {labels[lang].profileSummary}
              </h2>
            </div>
            <div className="px-6 py-2">
              <dl className="divide-y divide-gray-100 dark:divide-zinc-800 text-sm">
                <div className="py-4 flex justify-between items-center">
                  <dt className="text-gray-500 dark:text-gray-400 font-medium">{labels[lang].mobile}</dt>
                  <dd className="font-bold font-mono text-gray-900 dark:text-white">{member.phone}</dd>
                </div>
                <div className="py-4 flex justify-between items-center">
                  <dt className="text-gray-500 dark:text-gray-400 font-medium">{labels[lang].email}</dt>
                  <dd className="font-semibold text-gray-900 dark:text-white">{member.email || "—"}</dd>
                </div>
                <div className="py-4 flex justify-between items-center">
                  <dt className="text-gray-500 dark:text-gray-400 font-medium">{labels[lang].joinDate}</dt>
                  <dd className="font-semibold text-gray-900 dark:text-white font-mono">
                    {new Date(member.joinDate).toLocaleDateString(lang === "BN" ? "bn-BD" : "en-US")}
                  </dd>
                </div>
                <div className="py-4 flex justify-between items-center">
                  <dt className="text-gray-500 dark:text-gray-400 font-medium">{labels[lang].status}</dt>
                  <dd>
                    <span className="px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                      {member.status}
                    </span>
                  </dd>
                </div>
                <div className="py-4 flex justify-between items-center">
                  <dt className="text-gray-500 dark:text-gray-400 font-medium">
                    {lang === "BN" ? "সিস্টেম রোল" : "System Role"}
                  </dt>
                  <dd className="font-bold text-gray-900 dark:text-white">
                    <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 dark:bg-zinc-800 border dark:border-zinc-700">
                      {(() => {
                        const roles = member.user?.userRoles?.map((ur: any) => ur.role.name) || [];
                        if (roles.includes("SUPER_ADMIN")) return lang === "BN" ? "এডমিন" : "Admin";
                        if (roles.includes("ACCOUNTANT")) return lang === "BN" ? "হিসাব রক্ষক" : "Accounter";
                        return lang === "BN" ? "সাধারণ সদস্য" : "Member";
                      })()}
                    </span>
                  </dd>
                </div>
                <div className="py-4">
                  <dt className="text-gray-500 dark:text-gray-400 font-medium mb-2">{labels[lang].address}</dt>
                  <dd className="bg-gray-50 dark:bg-zinc-850/50 p-4 rounded-xl text-gray-700 dark:text-zinc-300 leading-relaxed ring-1 ring-gray-900/5 dark:ring-white/5">
                    {member.address}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Role Settings Card */}
          {isSuperAdmin && (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm ring-1 ring-gray-900/5 dark:ring-white/10 overflow-hidden p-6">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <ShieldAlert className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-450" />
                {lang === "BN" ? "ভূমিকা ও অ্যাক্সেস নিয়ন্ত্রণ" : "Role & Access Control"}
              </h3>
              <div className="flex items-center gap-4">
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="block w-full max-w-xs px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:text-white"
                >
                  <option value="MEMBER">{lang === "BN" ? "সদস্য (Member)" : "Member"}</option>
                  <option value="ACCOUNTANT">{lang === "BN" ? "হিসাব রক্ষক (Accounter)" : "Accounter"}</option>
                  <option value="SUPER_ADMIN">{lang === "BN" ? "এডমিন (Admin)" : "Admin"}</option>
                </select>
                <button
                  onClick={handleRoleUpdate}
                  disabled={roleUpdating}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-650 hover:bg-emerald-700 rounded-lg shadow-sm disabled:opacity-50 transition-all shrink-0"
                >
                  {roleUpdating ? (lang === "BN" ? "আপডেট হচ্ছে..." : "Updating...") : (lang === "BN" ? "রোল পরিবর্তন করুন" : "Update Role")}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Nominee Profile Card */}
        {member.nominee && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm ring-1 ring-gray-900/5 dark:ring-white/10 overflow-hidden h-fit">
            <div className="px-6 py-5 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50 flex justify-between items-center">
              <h2 className="text-lg font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                {labels[lang].nomineeSummary}
              </h2>
              <button
                onClick={() => setEditNomineeMode(true)}
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 ring-1 ring-gray-200 dark:ring-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-all shadow-sm"
              >
                {labels[lang].editNominee}
              </button>
            </div>
            <div className="px-6 py-2">
              <dl className="divide-y divide-gray-100 dark:divide-zinc-800 text-sm">
                <div className="py-4 flex justify-between items-center">
                  <dt className="text-gray-500 dark:text-gray-400 font-medium">{labels[lang].nomineeName}</dt>
                  <dd className="font-bold text-gray-900 dark:text-white">{member.nominee.name}</dd>
                </div>
                <div className="py-4 flex justify-between items-center">
                  <dt className="text-gray-500 dark:text-gray-400 font-medium">{labels[lang].relation}</dt>
                  <dd className="font-semibold text-gray-900 dark:text-white px-2.5 py-0.5 rounded-md bg-gray-100 dark:bg-zinc-800">{member.nominee.relationship}</dd>
                </div>
                <div className="py-4 flex justify-between items-center">
                  <dt className="text-gray-500 dark:text-gray-400 font-medium">{labels[lang].nomineeMobile}</dt>
                  <dd className="font-bold font-mono text-gray-900 dark:text-white">{member.nominee.phone}</dd>
                </div>
                <div className="py-4 flex justify-between items-center">
                  <dt className="text-gray-500 dark:text-gray-400 font-medium">{labels[lang].nomineeEmergency}</dt>
                  <dd className="font-bold font-mono text-rose-600 dark:text-rose-400">{member.nominee.emergencyContact}</dd>
                </div>
                <div className="py-4">
                  <dt className="text-gray-500 dark:text-gray-400 font-medium mb-2">{labels[lang].nomineeAddress}</dt>
                  <dd className="bg-gray-50 dark:bg-zinc-850/50 p-4 rounded-xl text-gray-700 dark:text-zinc-300 leading-relaxed ring-1 ring-gray-900/5 dark:ring-white/5">
                    {member.nominee.address}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
