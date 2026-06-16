"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const router = useRouter();
  const [lang, setLang] = useState<"BN" | "EN">("BN");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states matching createMemberSchema + password
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [joinDate, setJoinDate] = useState(new Date().toISOString().split("T")[0]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Nominee states
  const [nomineeName, setNomineeName] = useState("");
  const [nomineeRelationship, setNomineeRelationship] = useState("");
  const [nomineePhone, setNomineePhone] = useState("");
  const [nomineeAddress, setNomineeAddress] = useState("");
  const [nomineeEmergency, setNomineeEmergency] = useState("");

  const labels = {
    BN: {
      title: "নতুন সদস্য নিবন্ধন (Member Sign-Up)",
      subtitle: "সমিতিতে নতুন সদস্য হিসেবে অ্যাকাউন্ট তৈরি করুন",
      memberHeader: "সদস্য তথ্য (Member Info)",
      nomineeHeader: "নমিনী তথ্য (Nominee Info)",
      name: "সদস্যের নাম",
      phone: "মোবাইল নম্বর",
      email: "ইমেইল (ঐচ্ছিক)",
      address: "বর্তমান ঠিকানা",
      joinDate: "যোগদানের তারিখ",
      admissionFee: "ভর্তি ফি (৫,০০০ BDT)",
      nomineeName: "নমিনীর নাম",
      nomineeRel: "সম্পর্ক",
      nomineePhone: "মোবাইল নম্বর",
      nomineeAddress: "ঠিকানা",
      nomineeEmergency: "জরুরি যোগাযোগের নম্বর",
      password: "পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)",
      confirmPassword: "পাসওয়ার্ড নিশ্চিত করুন",
      submit: "নিবন্ধন সম্পন্ন করুন",
      loadingBtn: "অপেক্ষা করুন...",
      loginLink: "ইতিমধ্যে অ্যাকাউন্ট আছে? লগইন করুন",
      passMismatch: "পাসওয়ার্ড দুটি মেলেনি!",
      successMsg: "নিবন্ধন সফল হয়েছে! ২ সেকেন্ডের মধ্যে লগইন পেজে রিডাইরেক্ট করা হচ্ছে..."
    },
    EN: {
      title: "New Member Sign-Up",
      subtitle: "Register as a member in the cooperative society",
      memberHeader: "Member Details",
      nomineeHeader: "Nominee Details",
      name: "Member Name",
      phone: "Phone Number",
      email: "Email (Optional)",
      address: "Mailing Address",
      joinDate: "Joining Date",
      admissionFee: "Admission Fee (5,000 BDT)",
      nomineeName: "Nominee Name",
      nomineeRel: "Relationship",
      nomineePhone: "Nominee Phone",
      nomineeAddress: "Nominee Address",
      nomineeEmergency: "Emergency Contact No",
      password: "Password (Min 6 chars)",
      confirmPassword: "Confirm Password",
      submit: "Sign Up Now",
      loadingBtn: "Please wait...",
      loginLink: "Already have an account? Login",
      passMismatch: "Passwords do not match!",
      successMsg: "Registration successful! Redirecting to login in 2 seconds..."
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError(labels[lang].passMismatch);
      setLoading(false);
      return;
    }

    const payload = {
      name,
      phone,
      email: email || undefined,
      address,
      joinDate,
      status: "ACTIVE",
      password,
      nominee: {
        name: nomineeName,
        relationship: nomineeRelationship,
        phone: nomineePhone,
        address: nomineeAddress,
        emergencyContact: nomineeEmergency
      }
    };

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || (lang === "BN" ? "নিবন্ধন করতে ব্যর্থ হয়েছে।" : "Registration failed."));
      } else {
        setSuccess(labels[lang].successMsg);
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    } catch (err) {
      setError(lang === "BN" ? "সার্ভারে সমস্যা হয়েছে।" : "Internal Server Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-gray-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 p-4">
      {/* Decorative blurred background shapes */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-emerald-200/30 dark:bg-emerald-900/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-teal-200/20 dark:bg-teal-900/10 rounded-full blur-3xl -z-10" />

      <div className="w-full max-w-4xl bg-white dark:bg-zinc-900 p-8 rounded-xl shadow-lg border border-gray-100 dark:border-zinc-800 transition-all">
        {/* Header and Language Switcher */}
        <div className="flex justify-between items-center mb-6 border-b pb-4 border-gray-100 dark:border-zinc-800">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              {labels[lang].title}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {labels[lang].subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setLang(lang === "BN" ? "EN" : "BN")}
            className="px-3 py-1 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-full border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-all"
          >
            {lang === "BN" ? "English" : "বাংলা"}
          </button>
        </div>

        {error && (
          <div className="p-3 mb-6 text-sm font-semibold text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-900/50">
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div className="p-3 mb-6 text-sm font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-lg border border-emerald-200 dark:border-emerald-900/50">
            ✅ {success}
          </div>
        )}

        <form onSubmit={handleSignUp} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Member Details Column */}
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
                  disabled={loading}
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
                  disabled={loading}
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
                  placeholder="example@email.com"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-zinc-850 dark:border-zinc-700 dark:text-white"
                  disabled={loading}
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
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
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
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                    {labels[lang].password} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-zinc-850 dark:border-zinc-700 dark:text-white"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                    {labels[lang].confirmPassword} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-zinc-850 dark:border-zinc-700 dark:text-white"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-lg flex justify-between items-center text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                <span>{labels[lang].admissionFee}</span>
                <span>৫,০০০ BDT</span>
              </div>
            </div>

            {/* Nominee Details Column */}
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
                  disabled={loading}
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
                  disabled={loading}
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
                  disabled={loading}
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
                  disabled={loading}
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
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-gray-100 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-center gap-4">
            <a
              href="/login"
              className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline transition-all"
            >
              {labels[lang].loginLink}
            </a>

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-md transition-all duration-200 disabled:opacity-50"
            >
              {loading ? labels[lang].loadingBtn : labels[lang].submit}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
