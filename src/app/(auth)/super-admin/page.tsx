"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

export default function SuperAdminPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!email || !password) {
      setError("সবগুলো ঘর পূরণ করুন।");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "অ্যাকাউন্ট তৈরি করতে ব্যর্থ হয়েছে।");
      } else {
        setSuccess("সুপার এডমিন অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে! ২ সেকেন্ড পর লগইন পেজে রিডাইরেক্ট করা হচ্ছে...");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    } catch (err) {
      setError("সার্ভারে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-gray-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 p-4">
      {/* Decorative blurred background shapes */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-emerald-200/30 dark:bg-emerald-900/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-teal-200/20 dark:bg-teal-900/10 rounded-full blur-3xl -z-10" />

      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg border border-gray-100 dark:bg-zinc-900 dark:border-zinc-800 transition-all duration-300">
        <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-2 tracking-wide">
          নতুন সুপার এডমিন তৈরি করুন
        </h2>
        <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-6">
          সিস্টেমের প্রথম ব্যবহারের জন্য একটি সুপার এডমিন অ্যাকাউন্ট তৈরি করুন
        </p>

        {error && (
          <div className="p-3 mb-4 text-sm font-semibold text-red-600 bg-red-50 dark:bg-red-950/20 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-900/40 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 mb-4 text-sm font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 rounded-lg border border-emerald-200 dark:border-emerald-900/40 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">
              ইমেইল অ্যাড্রেস <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@somoby.com"
              className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-zinc-800 dark:border-zinc-700 dark:text-white transition-all duration-200"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">
              পাসওয়ার্ড <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-zinc-800 dark:border-zinc-700 dark:text-white transition-all duration-200"
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 font-bold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-lg shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? "অপেক্ষা করুন..." : "সুপার এডমিন অ্যাকাউন্ট তৈরি করুন"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <a
            href="/login"
            className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline transition-all"
          >
            ইতিমধ্যে অ্যাকাউন্ট আছে? লগইন করুন
          </a>
        </div>
      </div>
    </main>
  );
}
