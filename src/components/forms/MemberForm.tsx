"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/providers/LanguageProvider";

interface MemberFormProps {
  initialData?: any;
  memberId?: string;
}

// Per-field error state shape
interface FieldErrors {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  joinDate?: string;
  nomineeName?: string;
  nomineeRelationship?: string;
  nomineePhone?: string;
  nomineeAddress?: string;
  nomineeEmergency?: string;
}

const bdPhoneRegex = /^(?:\+88|88)?(01[3-9]\d{8})$/;

// ── Stable module-level components (must NOT be inside MemberForm) ──────────
// If defined inside the parent, React recreates them every render and
// unmounts/remounts the input, losing focus after each keystroke.
function Field({
  label,
  required,
  error,
  children
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
}

function inputClass(hasError?: string) {
  return `w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-zinc-850 dark:text-white transition-colors ${
    hasError
      ? "border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-950/20"
      : "border-gray-300 dark:border-zinc-700"
  }`;
}

export default function MemberForm({ initialData, memberId }: MemberFormProps) {
  const router = useRouter();
  const { lang } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Form states
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
      formTitle: "নতুন সদস্য ভর্তি ফর্ম",
      editTitle: "সদস্য তথ্য আপডেট করুন",
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
      submitEdit: "তথ্য আপডেট করুন",
      saving: "সংরক্ষণ হচ্ছে...",
      // Validation messages
      nameRequired: "সদস্যের নাম কমপক্ষে ২ অক্ষরের হতে হবে।",
      phoneRequired: "সঠিক ১১ ডিজিটের মোবাইল নম্বর লিখুন (01xxxxxxxxx)।",
      phoneConflict: "এই মোবাইল নম্বরটি দিয়ে ইতিমধ্যে সদস্য নিবন্ধিত আছে।",
      emailInvalid: "সঠিক ইমেইল ঠিকানা লিখুন।",
      emailConflict: "এই ইমেইলটি ইতিমধ্যে ব্যবহার হয়েছে।",
      addressRequired: "বর্তমান ঠিকানা কমপক্ষে ৫ অক্ষরের হতে হবে।",
      joinDateRequired: "ভর্তির তারিখ উল্লেখ করুন।",
      nomineeNameRequired: "নমিনীর নাম কমপক্ষে ২ অক্ষরের হতে হবে।",
      nomineeRelRequired: "সম্পর্ক উল্লেখ করুন।",
      nomineePhoneRequired: "নমিনীর সঠিক ১১ ডিজিটের মোবাইল নম্বর লিখুন।",
      nomineeAddressRequired: "নমিনীর ঠিকানা কমপক্ষে ৫ অক্ষরের হতে হবে।",
      nomineeEmergencyRequired: "জরুরি যোগাযোগের নম্বর বা বিবরণ দিন।",
      serverError: "সার্ভারে সমস্যা হয়েছে। আবার চেষ্টা করুন।",
    },
    EN: {
      formTitle: "New Member Registration Form",
      editTitle: "Update Member Details",
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
      // Validation messages
      nameRequired: "Member name must be at least 2 characters.",
      phoneRequired: "Enter a valid 11-digit phone number (01xxxxxxxxx).",
      phoneConflict: "A member with this phone number already exists.",
      emailInvalid: "Enter a valid email address.",
      emailConflict: "This email address is already in use.",
      addressRequired: "Address must be at least 5 characters.",
      joinDateRequired: "Please enter the joining date.",
      nomineeNameRequired: "Nominee name must be at least 2 characters.",
      nomineeRelRequired: "Please specify the relationship.",
      nomineePhoneRequired: "Enter a valid 11-digit nominee phone number.",
      nomineeAddressRequired: "Nominee address must be at least 5 characters.",
      nomineeEmergencyRequired: "Emergency contact info is required.",
      serverError: "Server error. Please try again.",
    }
  };

  const L = labels[lang];

  // ── Client-side validation ──────────────────────────────────────────────────
  const validate = (): boolean => {
    const errors: FieldErrors = {};

    if (!name || name.trim().length < 2) errors.name = L.nameRequired;
    if (!bdPhoneRegex.test(phone)) errors.phone = L.phoneRequired;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = L.emailInvalid;
    if (!address || address.trim().length < 5) errors.address = L.addressRequired;
    if (!joinDate) errors.joinDate = L.joinDateRequired;

    if (!nomineeName || nomineeName.trim().length < 2) errors.nomineeName = L.nomineeNameRequired;
    if (!nomineeRelationship || nomineeRelationship.trim().length < 2) errors.nomineeRelationship = L.nomineeRelRequired;
    if (!bdPhoneRegex.test(nomineePhone)) errors.nomineePhone = L.nomineePhoneRequired;
    if (!nomineeAddress || nomineeAddress.trim().length < 5) errors.nomineeAddress = L.nomineeAddressRequired;
    if (!nomineeEmergency || nomineeEmergency.trim().length < 5) errors.nomineeEmergency = L.nomineeEmergencyRequired;

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Map server error codes → field-level messages ───────────────────────────
  const handleServerError = (code: string, message: string) => {
    // Specific conflict errors → highlight the right field
    if (code === "CONFLICT_ERROR") {
      if (message.toLowerCase().includes("মোবাইল") || message.toLowerCase().includes("phone")) {
        setFieldErrors({ phone: L.phoneConflict });
        return;
      }
      if (message.toLowerCase().includes("ইমেইল") || message.toLowerCase().includes("email")) {
        setFieldErrors({ email: L.emailConflict });
        return;
      }
    }
    // Zod validation from server → show as top-level banner (already translated by schema)
    setServerError(message);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setFieldErrors({});

    if (!validate()) return; // Stop if client errors found

    setLoading(true);

    const payload = {
      name: name.trim(),
      phone,
      email: email || undefined,
      address: address.trim(),
      joinDate,
      status,
      nominee: {
        name: nomineeName.trim(),
        relationship: nomineeRelationship.trim(),
        phone: nomineePhone,
        address: nomineeAddress.trim(),
        emergencyContact: nomineeEmergency.trim()
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
        handleServerError(result.code || "", result.message || L.serverError);
      } else {
        router.push(isEditMode ? `/dashboard/members/${memberId}` : "/dashboard/members");
        router.refresh();
      }
    } catch {
      setServerError(L.serverError);
    } finally {
      setLoading(false);
    }
  };



  return (
    <form onSubmit={handleSubmit} className="w-full max-w-4xl bg-white dark:bg-zinc-900 p-8 rounded-xl shadow-lg border border-gray-100 dark:border-zinc-800 transition-all">
      {/* Header */}
      <div className="mb-6 border-b pb-4 border-gray-100 dark:border-zinc-800">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
          {isEditMode ? L.editTitle : L.formTitle}
        </h2>
      </div>

      {/* Server-level error banner */}
      {serverError && (
        <div className="p-3 mb-6 text-sm font-semibold text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-900/50 flex items-start gap-2">
          <span className="mt-0.5">⚠️</span>
          <span>{serverError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* ── Member Details ── */}
        <div className="space-y-4">
          <h3 className="text-md font-bold text-emerald-600 dark:text-emerald-400 border-b pb-2 border-emerald-100 dark:border-emerald-900/30">
            {L.memberHeader}
          </h3>

          <Field label={L.name} required error={fieldErrors.name}>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setFieldErrors(f => ({ ...f, name: undefined })); }}
              className={inputClass(fieldErrors.name)}
              placeholder={lang === "BN" ? "সম্পূর্ণ নাম লিখুন" : "Full name"}
            />
          </Field>

          <Field label={L.phone} required error={fieldErrors.phone}>
            <input
              type="text"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); setFieldErrors(f => ({ ...f, phone: undefined })); }}
              placeholder="01xxxxxxxxx"
              className={inputClass(fieldErrors.phone)}
            />
          </Field>

          <Field label={L.email} error={fieldErrors.email}>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setFieldErrors(f => ({ ...f, email: undefined })); }}
              placeholder={lang === "BN" ? "name@example.com (ঐচ্ছিক)" : "name@example.com (optional)"}
              className={inputClass(fieldErrors.email)}
            />
          </Field>

          <Field label={L.address} required error={fieldErrors.address}>
            <textarea
              value={address}
              onChange={(e) => { setAddress(e.target.value); setFieldErrors(f => ({ ...f, address: undefined })); }}
              className={`${inputClass(fieldErrors.address)} h-20 resize-none`}
              placeholder={lang === "BN" ? "বিস্তারিত ঠিকানা লিখুন" : "Full mailing address"}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label={L.joinDate} required error={fieldErrors.joinDate}>
              <input
                type="date"
                value={joinDate}
                onChange={(e) => { setJoinDate(e.target.value); setFieldErrors(f => ({ ...f, joinDate: undefined })); }}
                className={inputClass(fieldErrors.joinDate)}
              />
            </Field>
            <Field label={L.status}>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={inputClass()}
              >
                <option value="ACTIVE">{lang === "BN" ? "সক্রিয়" : "Active"}</option>
                <option value="INACTIVE">{lang === "BN" ? "নিষ্ক্রিয়" : "Inactive"}</option>
                <option value="SUSPENDED">{lang === "BN" ? "স্থগিত" : "Suspended"}</option>
              </select>
            </Field>
          </div>

          {!isEditMode && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-lg flex justify-between items-center text-sm font-semibold text-emerald-800 dark:text-emerald-300">
              <span>{L.admissionFee}</span>
              <span>৫,০০০ BDT</span>
            </div>
          )}
        </div>

        {/* ── Nominee Details ── */}
        <div className="space-y-4">
          <h3 className="text-md font-bold text-emerald-600 dark:text-emerald-400 border-b pb-2 border-emerald-100 dark:border-emerald-900/30">
            {L.nomineeHeader}
          </h3>

          <Field label={L.nomineeName} required error={fieldErrors.nomineeName}>
            <input
              type="text"
              value={nomineeName}
              onChange={(e) => { setNomineeName(e.target.value); setFieldErrors(f => ({ ...f, nomineeName: undefined })); }}
              className={inputClass(fieldErrors.nomineeName)}
              placeholder={lang === "BN" ? "নমিনীর সম্পূর্ণ নাম" : "Full nominee name"}
            />
          </Field>

          <Field label={L.nomineeRel} required error={fieldErrors.nomineeRelationship}>
            <input
              type="text"
              value={nomineeRelationship}
              onChange={(e) => { setNomineeRelationship(e.target.value); setFieldErrors(f => ({ ...f, nomineeRelationship: undefined })); }}
              placeholder={lang === "BN" ? "যেমন: স্ত্রী, পুত্র, ভাই" : "e.g. Wife, Son, Brother"}
              className={inputClass(fieldErrors.nomineeRelationship)}
            />
          </Field>

          <Field label={L.nomineePhone} required error={fieldErrors.nomineePhone}>
            <input
              type="text"
              value={nomineePhone}
              onChange={(e) => { setNomineePhone(e.target.value); setFieldErrors(f => ({ ...f, nomineePhone: undefined })); }}
              placeholder="01xxxxxxxxx"
              className={inputClass(fieldErrors.nomineePhone)}
            />
          </Field>

          <Field label={L.nomineeAddress} required error={fieldErrors.nomineeAddress}>
            <textarea
              value={nomineeAddress}
              onChange={(e) => { setNomineeAddress(e.target.value); setFieldErrors(f => ({ ...f, nomineeAddress: undefined })); }}
              className={`${inputClass(fieldErrors.nomineeAddress)} h-16 resize-none`}
              placeholder={lang === "BN" ? "নমিনীর বিস্তারিত ঠিকানা" : "Nominee's full address"}
            />
          </Field>

          <Field label={L.nomineeEmergency} required error={fieldErrors.nomineeEmergency}>
            <input
              type="text"
              value={nomineeEmergency}
              onChange={(e) => { setNomineeEmergency(e.target.value); setFieldErrors(f => ({ ...f, nomineeEmergency: undefined })); }}
              placeholder={lang === "BN" ? "জরুরি ফোন নম্বর বা যোগাযোগের তথ্য" : "Emergency phone or contact details"}
              className={inputClass(fieldErrors.nomineeEmergency)}
            />
          </Field>
        </div>
      </div>

      {/* Submit */}
      <div className="mt-8 pt-4 border-t border-gray-100 dark:border-zinc-800 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? L.saving : (isEditMode ? L.submitEdit : L.submitCreate)}
        </button>
      </div>
    </form>
  );
}
