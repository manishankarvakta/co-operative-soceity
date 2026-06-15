"use client";

import { useState } from "react";

interface NomineeFormProps {
  memberId: string;
  initialData: any;
  onSuccess: (updatedNominee: any) => void;
  onCancel: () => void;
}

export default function NomineeForm({
  memberId,
  initialData,
  onSuccess,
  onCancel
}: NomineeFormProps) {
  const [lang, setLang] = useState<"BN" | "EN">("BN");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Nominee field states
  const [name, setName] = useState(initialData?.name || "");
  const [relationship, setRelationship] = useState(initialData?.relationship || "");
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [address, setAddress] = useState(initialData?.address || "");
  const [emergencyContact, setEmergencyContact] = useState(initialData?.emergencyContact || "");

  const labels = {
    BN: {
      title: "নমিনী তথ্য সম্পাদনা",
      name: "নমিনীর নাম",
      relation: "সম্পর্ক",
      phone: "মোবাইল নম্বর",
      address: "ঠিকানা",
      emergency: "জরুরি যোগাযোগের নম্বর",
      save: "তথ্য সংরক্ষণ করুন",
      saving: "সংরক্ষণ করা হচ্ছে...",
      cancel: "বাতিল করুন"
    },
    EN: {
      title: "Edit Nominee Details",
      name: "Nominee Name",
      relation: "Relationship",
      phone: "Phone Number",
      address: "Address",
      emergency: "Emergency Contact No",
      save: "Save Changes",
      saving: "Saving...",
      cancel: "Cancel"
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      name,
      relationship,
      phone,
      address,
      emergencyContact
    };

    try {
      const response = await fetch(`/api/members/${memberId}/nominee`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || (lang === "BN" ? "সংরক্ষণ করতে ব্যর্থ হয়েছে।" : "Save failed."));
      } else {
        onSuccess(result.nominee);
      }
    } catch (err) {
      setError(lang === "BN" ? "সার্ভারে সমস্যা হয়েছে।" : "Internal Server Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-lg bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-lg transition-all">
      <div className="flex justify-between items-center mb-6 border-b pb-3 border-gray-100 dark:border-zinc-800">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white">
          {labels[lang].title}
        </h3>
        <button
          type="button"
          onClick={() => setLang(lang === "BN" ? "EN" : "BN")}
          className="px-2.5 py-1 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-full border border-emerald-250 dark:border-emerald-800 hover:bg-emerald-100"
        >
          {lang === "BN" ? "English" : "বাংলা"}
        </button>
      </div>

      {error && (
        <div className="p-3 mb-4 text-sm font-semibold text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-900/50">
          ⚠️ {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
            {labels[lang].name} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-zinc-850 dark:border-zinc-700 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
            {labels[lang].relation} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-zinc-850 dark:border-zinc-700 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
            {labels[lang].phone} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-zinc-850 dark:border-zinc-700 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
            {labels[lang].address} <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-zinc-850 dark:border-zinc-700 dark:text-white h-16"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
            {labels[lang].emergency} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={emergencyContact}
            onChange={(e) => setEmergencyContact(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-zinc-850 dark:border-zinc-700 dark:text-white"
          />
        </div>
      </div>

      <div className="mt-6 pt-3 border-t border-gray-100 dark:border-zinc-800 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-150 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-lg transition-all"
        >
          {labels[lang].cancel}
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg shadow-md transition-all duration-200"
        >
          {loading ? labels[lang].saving : labels[lang].save}
        </button>
      </div>
    </form>
  );
}
