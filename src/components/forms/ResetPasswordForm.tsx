"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

export default function ResetPasswordForm() {
  const router = useRouter();
  const [lang, setLang] = useState<"BN" | "EN">("BN");
  const [step, setStep] = useState<1 | 2>(1);
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const labels = {
    BN: {
      title: "পাসওয়ার্ড রিসেট করুন",
      emailOrPhone: "ইমেইল বা মোবাইল নম্বর",
      sendOtpBtn: "ভেরিফিকেশন কোড পাঠান",
      sendingOtp: "পাঠানো হচ্ছে...",
      otpLabel: "৬ ডিজিটের ভেরিফিকেশন কোড (OTP)",
      newPassLabel: "নতুন পাসওয়ার্ড",
      resetBtn: "পাসওয়ার্ড পরিবর্তন করুন",
      resetting: "পরিবর্তন করা হচ্ছে...",
      backToLogin: "লগইন পেজে ফিরে যান",
      otpPlaceholder: "123456",
      passPlaceholder: "••••••"
    },
    EN: {
      title: "Reset Your Password",
      emailOrPhone: "Email or Phone Number",
      sendOtpBtn: "Send Verification Code",
      sendingOtp: "Sending...",
      otpLabel: "6-Digit Verification Code (OTP)",
      newPassLabel: "New Password",
      resetBtn: "Confirm Password Reset",
      resetting: "Resetting...",
      backToLogin: "Back to Login",
      otpPlaceholder: "123456",
      passPlaceholder: "••••••"
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    if (!emailOrPhone) {
      setError(lang === "BN" ? "ইমেইল বা মোবাইল নম্বর লিখুন।" : "Please enter email or phone.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/reset-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrPhone })
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || (lang === "BN" ? "কোড পাঠাতে ব্যর্থ হয়েছে।" : "Failed to send code."));
      } else {
        setSuccessMsg(data.message);
        setStep(2);
      }
    } catch (err) {
      setError(lang === "BN" ? "সংযোগ বিচ্ছিন্ন হয়েছে।" : "Network connection failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!otp || !newPassword) {
      setError(lang === "BN" ? "সবগুলো ঘর পূরণ করুন।" : "Please fill in all fields.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/reset-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrPhone, otp, newPassword })
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || (lang === "BN" ? "পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে।" : "Password reset failed."));
      } else {
        setSuccessMsg(data.message);
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      }
    } catch (err) {
      setError(lang === "BN" ? "সংযোগ বিচ্ছিন্ন হয়েছে।" : "Network connection failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg border border-gray-100 dark:bg-zinc-900 dark:border-zinc-800 transition-all duration-300">
      {/* Language Switcher */}
      <div className="flex justify-end mb-6">
        <button
          onClick={() => setLang(lang === "BN" ? "EN" : "BN")}
          className="px-3 py-1 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-full border border-emerald-200 dark:border-emerald-800 transition-all duration-200 hover:bg-emerald-100"
        >
          {lang === "BN" ? "English" : "বাংলা"}
        </button>
      </div>

      <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-6 tracking-wide">
        {labels[lang].title}
      </h2>

      {error && (
        <div className="p-3 mb-4 text-sm font-semibold text-red-600 bg-red-50 dark:bg-red-950/20 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-900/40 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 mb-4 text-sm font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 rounded-lg border border-emerald-200 dark:border-emerald-900/40 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {step === 1 ? (
        <form onSubmit={handleSendOtp} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">
              {labels[lang].emailOrPhone} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              placeholder="example@email.com / 017xxxxxxxx"
              className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-zinc-800 dark:border-zinc-700 dark:text-white transition-all duration-200"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 font-bold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-lg shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {loading ? labels[lang].sendingOtp : labels[lang].sendOtpBtn}
          </button>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">
              {labels[lang].otpLabel} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder={labels[lang].otpPlaceholder}
              className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-zinc-800 dark:border-zinc-700 dark:text-white transition-all duration-200"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">
              {labels[lang].newPassLabel} <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={labels[lang].passPlaceholder}
              className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-zinc-800 dark:border-zinc-700 dark:text-white transition-all duration-200"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 font-bold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-lg shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {loading ? labels[lang].resetting : labels[lang].resetBtn}
          </button>
        </form>
      )}

      <div className="mt-6 text-center">
        <a
          href="/login"
          className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline transition-all"
        >
          ← {labels[lang].backToLogin}
        </a>
      </div>
    </div>
  );
}
