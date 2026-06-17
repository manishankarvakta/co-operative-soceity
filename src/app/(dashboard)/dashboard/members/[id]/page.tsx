"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MemberForm from "@/components/forms/MemberForm";
import NomineeForm from "@/components/forms/NomineeForm";
import { ConfirmModal, Toast, useToast } from "@/components/ui/ConfirmModal";

interface ProfilePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function MemberProfilePage({ params }: ProfilePageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [member, setMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editNomineeMode, setEditNomineeMode] = useState(false);

  // Modal & Toast
  const { toast, showToast } = useToast();
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/members/${id}`);
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "সদস্য তথ্য লোড করতে ব্যর্থ হয়েছে।");
      } else {
        setMember(data);
      }
    } catch (err) {
      setError("সার্ভারে সমস্যা হয়েছে।");
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
        showToast("error", "মুছে ফেলতে ব্যর্থ", result.message || "সদস্য মুছে ফেলতে ব্যর্থ হয়েছে।");
      } else {
        showToast("success", "সফলভাবে মুছে ফেলা হয়েছে", "সদস্য অ্যাকাউন্টটি মুছে ফেলা হয়েছে।");
        setTimeout(() => {
          router.push("/dashboard/members");
          router.refresh();
        }, 1200);
      }
    } catch (error) {
      showToast("error", "সার্ভার সমস্যা", "সার্ভারে সমস্যা হয়েছে।");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">লোডিং হচ্ছে...</div>;
  }

  if (error || !member) {
    return (
      <div className="p-8 text-center text-red-500 font-bold">
        ⚠️ {error || "সদস্যের তথ্য পাওয়া যায়নি।"}
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
          ← ফিরে যান (Cancel)
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
        title="সদস্য ডিলিট করুন"
        message="আপনি কি নিশ্চিতভাবে এই সদস্য অ্যাকাউন্টটি ডিলিট করতে চান? (এটি সফট-ডিলিট হবে)"
        confirmText="হ্যাঁ, ডিলিট করুন"
        cancelText="বাতিল করুন"
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
            সম্পাদনা (Edit)
          </button>
          <button
            onClick={() => setDeleteModal(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-lg shadow-md transition-all duration-200"
          >
            ডিলিট করুন
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Member Profile Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm ring-1 ring-gray-900/5 dark:ring-white/10 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50">
            <h2 className="text-lg font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              সদস্যের বিবরণ (Profile Summary)
            </h2>
          </div>
          <div className="px-6 py-2">
            <dl className="divide-y divide-gray-100 dark:divide-zinc-800 text-sm">
              <div className="py-4 flex justify-between items-center">
                <dt className="text-gray-500 dark:text-gray-400 font-medium">মোবাইল নম্বর</dt>
                <dd className="font-bold font-mono text-gray-900 dark:text-white">{member.phone}</dd>
              </div>
              <div className="py-4 flex justify-between items-center">
                <dt className="text-gray-500 dark:text-gray-400 font-medium">ইমেইল</dt>
                <dd className="font-semibold text-gray-900 dark:text-white">{member.email || "—"}</dd>
              </div>
              <div className="py-4 flex justify-between items-center">
                <dt className="text-gray-500 dark:text-gray-400 font-medium">যোগদানের তারিখ</dt>
                <dd className="font-semibold text-gray-900 dark:text-white font-mono">
                  {new Date(member.joinDate).toLocaleDateString("bn-BD")}
                </dd>
              </div>
              <div className="py-4 flex justify-between items-center">
                <dt className="text-gray-500 dark:text-gray-400 font-medium">সদস্যপদ স্ট্যাটাস</dt>
                <dd>
                  <span className="px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                    {member.status}
                  </span>
                </dd>
              </div>
              <div className="py-4">
                <dt className="text-gray-500 dark:text-gray-400 font-medium mb-2">বর্তমান ঠিকানা</dt>
                <dd className="bg-gray-50 dark:bg-zinc-850/50 p-4 rounded-xl text-gray-700 dark:text-zinc-300 leading-relaxed ring-1 ring-gray-900/5 dark:ring-white/5">
                  {member.address}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Nominee Profile Card */}
        {member.nominee && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm ring-1 ring-gray-900/5 dark:ring-white/10 overflow-hidden h-fit">
            <div className="px-6 py-5 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50 flex justify-between items-center">
              <h2 className="text-lg font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                নমিনী বিবরণ (Nominee Summary)
              </h2>
              <button
                onClick={() => setEditNomineeMode(true)}
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 ring-1 ring-gray-200 dark:ring-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-all shadow-sm"
              >
                এডিট করুন
              </button>
            </div>
            <div className="px-6 py-2">
              <dl className="divide-y divide-gray-100 dark:divide-zinc-800 text-sm">
                <div className="py-4 flex justify-between items-center">
                  <dt className="text-gray-500 dark:text-gray-400 font-medium">নমিনীর নাম</dt>
                  <dd className="font-bold text-gray-900 dark:text-white">{member.nominee.name}</dd>
                </div>
                <div className="py-4 flex justify-between items-center">
                  <dt className="text-gray-500 dark:text-gray-400 font-medium">সম্পর্ক</dt>
                  <dd className="font-semibold text-gray-900 dark:text-white px-2.5 py-0.5 rounded-md bg-gray-100 dark:bg-zinc-800">{member.nominee.relationship}</dd>
                </div>
                <div className="py-4 flex justify-between items-center">
                  <dt className="text-gray-500 dark:text-gray-400 font-medium">মোবাইল নম্বর</dt>
                  <dd className="font-bold font-mono text-gray-900 dark:text-white">{member.nominee.phone}</dd>
                </div>
                <div className="py-4 flex justify-between items-center">
                  <dt className="text-gray-500 dark:text-gray-400 font-medium">জরুরি যোগাযোগ</dt>
                  <dd className="font-bold font-mono text-rose-600 dark:text-rose-400">{member.nominee.emergencyContact}</dd>
                </div>
                <div className="py-4">
                  <dt className="text-gray-500 dark:text-gray-400 font-medium mb-2">ঠিকানা</dt>
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
