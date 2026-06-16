"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MemberForm from "@/components/forms/MemberForm";
import NomineeForm from "@/components/forms/NomineeForm";

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


  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/members/${id}`);
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "সদস্য তথ্য লোড করতে ব্যর্থ হয়েছে।");
      } else {
        setMember(data);
      }
    } catch (err) {
      setError("সার্ভারে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      "আপনি কি নিশ্চিতভাবে এই সদস্য অ্যাকাউন্টটি ডিলিট করতে চান? (এটি সফট-ডিলিট হবে)"
    );
    if (!confirmDelete) return;

    try {
      const response = await fetch(`/api/members/${id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok || !result.success) {
        alert(result.message || "মুছে ফেলতে ব্যর্থ হয়েছে।");
      } else {
        alert("সদস্য অ্যাকাউন্টটি মুছে ফেলা হয়েছে।");
        router.push("/members");
        router.refresh();
      }
    } catch (error) {
      alert("সার্ভারে সমস্যা হয়েছে।");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">লোডিং হচ্ছে...</div>;
  }

  if (error || !member) {
    return (
      <div className="p-8 text-center text-red-500 font-bold">
        ⚠️ {error || "সদস্যের তথ্য পাওয়া যায়নি।"}
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
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-lg shadow-md transition-all duration-200"
          >
            ডিলিট করুন
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Member Profile Card */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-150 dark:border-zinc-800 shadow-md">
          <h2 className="text-lg font-bold text-emerald-600 dark:text-emerald-400 border-b pb-2 mb-4">
            সদস্যের বিবরণ (Profile Summary)
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b pb-2 dark:border-zinc-800">
              <span className="text-gray-500">মোবাইল নম্বর</span>
              <span className="font-bold text-gray-800 dark:text-white">{member.phone}</span>
            </div>
            <div className="flex justify-between border-b pb-2 dark:border-zinc-800">
              <span className="text-gray-500">ইমেইল</span>
              <span className="font-semibold text-gray-800 dark:text-white">{member.email || "—"}</span>
            </div>
            <div className="flex justify-between border-b pb-2 dark:border-zinc-800">
              <span className="text-gray-500">যোগদানের তারিখ</span>
              <span className="font-semibold text-gray-800 dark:text-white">
                {new Date(member.joinDate).toLocaleDateString("bn-BD")}
              </span>
            </div>
            <div className="flex justify-between border-b pb-2 dark:border-zinc-800">
              <span className="text-gray-500">সদস্যপদ স্ট্যাটাস</span>
              <span className="font-bold uppercase text-emerald-600">{member.status}</span>
            </div>
            <div className="pt-2">
              <span className="text-gray-500 block mb-1">বর্তমান ঠিকানা</span>
              <p className="text-gray-800 dark:text-zinc-350 bg-gray-50 dark:bg-zinc-850 p-3 rounded-lg border border-gray-100 dark:border-zinc-800">
                {member.address}
              </p>
            </div>
          </div>
        </div>

        {/* Nominee Profile Card */}
        {member.nominee && (
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-gray-150 dark:border-zinc-800 shadow-md">
            <div className="flex justify-between items-center border-b pb-2 mb-4">
              <h2 className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                নমিনী বিবরণ (Nominee Summary)
              </h2>
              <button
                onClick={() => setEditNomineeMode(true)}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                নমিনী এডিট করুন
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2 dark:border-zinc-800">
                <span className="text-gray-500">নমিনীর নাম</span>
                <span className="font-bold text-gray-800 dark:text-white">{member.nominee.name}</span>
              </div>
              <div className="flex justify-between border-b pb-2 dark:border-zinc-800">
                <span className="text-gray-500">সম্পর্ক</span>
                <span className="font-semibold text-gray-800 dark:text-white">{member.nominee.relationship}</span>
              </div>
              <div className="flex justify-between border-b pb-2 dark:border-zinc-800">
                <span className="text-gray-500">মোবাইল নম্বর</span>
                <span className="font-semibold text-gray-800 dark:text-white">{member.nominee.phone}</span>
              </div>
              <div className="flex justify-between border-b pb-2 dark:border-zinc-800">
                <span className="text-gray-500">জরুরি যোগাযোগের নম্বর</span>
                <span className="font-bold text-red-600 dark:text-red-400">{member.nominee.emergencyContact}</span>
              </div>
              <div className="pt-2">
                <span className="text-gray-500 block mb-1">ঠিকানা</span>
                <p className="text-gray-800 dark:text-zinc-350 bg-gray-50 dark:bg-zinc-850 p-3 rounded-lg border border-gray-100 dark:border-zinc-800">
                  {member.nominee.address}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
