"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface MemberFormProps {
  initialData?: any;
  memberId?: string;
}

export default function MemberForm({ initialData, memberId }: MemberFormProps) {
  const router = useRouter();
  const [lang, setLang] = useState<"BN" | "EN">("BN");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states matching schemas
  const [name, setName] = useState(initialData?.name || "");
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [address, setAddress] = useState(initialData?.address || "");
  const [joinDate, setJoinDate] = useState(
    initialData?.joinDate ? new Date(initialData.joinDate).toISOString().split("T")[0] : ""
  );
  const [status, setStatus] = useState(initialData?.status || "ACTIVE");

  // Nominee states
  const [nomineeName, setNomineeName] = useState(initialData?.nominee?.name || "");
  const [nomineeRelationship, setNomineeRelationship] = useState(initialData?.nominee?.relationship || "");
  const [nomineePhone, setNomineePhone] = useState(initialData?.nominee?.phone || "");
  const [nomineeAddress, setNomineeAddress] = useState(initialData?.nominee?.address || "");
  const [nomineeEmergency, setNomineeEmergency] = useState(initialData?.nominee?.emergencyContact || "");

  const isEditMode = !!initialData;

  const labels = {
    BN: {
      memberHeader: "সদস্য তথ্য (Member Info)",
      nomineeHeader: "নমিনী তথ্য (Nominee Info)",
      name: "সদস্যের নাম",
      phone: "মোবাইল নম্বর",
      email: "ইমেইল (ঐচ্ছিক)",
      address: "বর্তমান ঠিকানা",
      joinDate: "যোগদানের তারিখ",
      status: "অবস্থা (Status)",
      admissionFee: "ভর্তি ফি (৫,০০০ টাকা)",
      nomineeName: "নমিনীর নাম",
      nomineeRel: "সম্পর্ক",
      nomineePhone: "মোবাইল নম্বর",
      nomineeAddress: "ঠিকানা",
      nomineeEmergency: "জরুরি যোগাযোগের নম্বর",
      submitCreate: "সদস্য নিবন্ধন সম্পন্ন করুন",
      submitEdit: "সদস্য তথ্য আপডেট করুন",
      saving: "সংরক্ষণ করা হচ্ছে...",
      successCreate: "সদস্য সফলভাবে নিবন্ধিত হয়েছে!",
      successEdit: "তথ্য সফলভাবে আপডেট করা হয়েছে!"
    },
    EN: {
      memberHeader: "Member Details",
      nomineeHeader: "Nominee Details",
      name: "Member Name",
      phone: "Phone Number",
      email: "Email (Optional)",
      address: "Mailing Address",
      joinDate: "Joining Date",
      status: "Status",
      admissionFee: "Admission Fee (5,000 BDT)",
      nomineeName: "Nominee Name",
      nomineeRel: "Relationship",
      nomineePhone: "Nominee Phone",
      nomineeAddress: "Nominee Address",
      nomineeEmergency: "Emergency Contact No",
      submitCreate: "Complete Member Registration",
      submitEdit: "Update Member Details",
      saving: "Saving...",
      successCreate: "Member successfully registered!",
      successEdit: "Details successfully updated!"
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      name,
      phone,
      email: email || undefined,
      address,
      joinDate,
      status,
      nominee: {
        name: nomineeName,
        relationship: nomineeRelationship,
        phone: nomineePhone,
        address: nomineeAddress,
        emergencyContact: nomineeEmergency
      }
    };

    try {
      const url = isEditMode ? `/api/members/${memberId}` : "/api/members";
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || (lang === "BN" ? "সংরক্ষণ করতে ব্যর্থ হয়েছে।" : "Save failed."));
      } else {
        router.push(isEditMode ? `/dashboard/members/${memberId}` : "/dashboard/members");
        router.refresh();
      }
    } catch (err) {
      setError(lang === "BN" ? "সার্ভারে সমস্যা হয়েছে।" : "Internal Server Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-4xl bg-white dark:bg-zinc-900 p-8 rounded-xl shadow-lg border border-gray-100 dark:border-zinc-800 transition-all">
      {/* Header Language switch */}
      <div className="flex justify-between items-center mb-6 border-b pb-4 border-gray-100 dark:border-zinc-800">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
          {isEditMode ? labels[lang].submitEdit : "নতুন সদস্য ভর্তি ফর্ম"}
        </h2>
        <button
          type="button"
          onClick={() => setLang(lang === "BN" ? "EN" : "BN")}
          className="px-3 py-1 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-full border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
        >
          {lang === "BN" ? "English" : "বাংলা"}
        </button>
      </div>

      {error && (
        <div className="p-3 mb-6 text-sm font-semibold text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-900/50">
          ⚠️ {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Member details column */}
        <div className="space-y-4">
          <h3 className="text-md font-bold text-emerald-600 dark:text-emerald-400 border-b pb-2 border-emerald-100 dark:border-emerald-900/30">
            {labels[lang].memberHeader}
          </h3>

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
              {labels[lang].phone} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01xxxxxxxxx"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-zinc-850 dark:border-zinc-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
              {labels[lang].email}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-zinc-850 dark:border-zinc-700 dark:text-white h-20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                {labels[lang].joinDate} <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={joinDate}
                onChange={(e) => setJoinDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-zinc-850 dark:border-zinc-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                {labels[lang].status}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-zinc-850 dark:border-zinc-700 dark:text-white"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
          </div>

          {!isEditMode && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-lg flex justify-between items-center text-sm font-semibold text-emerald-800 dark:text-emerald-300">
              <span>{labels[lang].admissionFee}</span>
              <span>৫,০০০ BDT</span>
            </div>
          )}
        </div>

        {/* Nominee details column */}
        <div className="space-y-4">
          <h3 className="text-md font-bold text-emerald-600 dark:text-emerald-400 border-b pb-2 border-emerald-100 dark:border-emerald-900/30">
            {labels[lang].nomineeHeader}
          </h3>

          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
              {labels[lang].nomineeName} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={nomineeName}
              onChange={(e) => setNomineeName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-zinc-850 dark:border-zinc-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
              {labels[lang].nomineeRel} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={nomineeRelationship}
              onChange={(e) => setNomineeRelationship(e.target.value)}
              placeholder="যেমন: স্ত্রী, পুত্র, ভাই"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-zinc-850 dark:border-zinc-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
              {labels[lang].nomineePhone} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={nomineePhone}
              onChange={(e) => setNomineePhone(e.target.value)}
              placeholder="01xxxxxxxxx"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-zinc-850 dark:border-zinc-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
              {labels[lang].nomineeAddress} <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              value={nomineeAddress}
              onChange={(e) => setNomineeAddress(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-zinc-850 dark:border-zinc-700 dark:text-white h-16"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
              {labels[lang].nomineeEmergency} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={nomineeEmergency}
              onChange={(e) => setNomineeEmergency(e.target.value)}
              placeholder="জরুরি ফোন নম্বর"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-zinc-850 dark:border-zinc-700 dark:text-white"
            />
          </div>
        </div>
      </div>

      <div className="mt-8 pt-4 border-t border-gray-100 dark:border-zinc-800 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-md transition-all duration-200 disabled:opacity-50"
        >
          {loading ? labels[lang].saving : (isEditMode ? labels[lang].submitEdit : labels[lang].submitCreate)}
        </button>
      </div>
    </form>
  );
}
