"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, AlertTriangle } from "lucide-react";

export default function LoginForm() {
  const router = useRouter();
  const [lang, setLang] = useState<"BN" | "EN">("BN");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const labels = {
    BN: {
      title: "সমিতি ম্যানেজমেন্ট পোর্টাল",
      email: "ইমেইল, মোবাইল বা মেম্বার আইডি",
      password: "পাসওয়ার্ড",
      rememberMe: "মনে রাখুন (Remember Me)",
      forgotPass: "পাসওয়ার্ড ভুলে গেছেন?",
      loginBtn: "লগইন করুন",
      loadingBtn: "অপেক্ষা করুন...",
      emailPlaceholder: "ইমেইল, মোবাইল বা মেম্বার আইডি",
      passPlaceholder: "••••••",
      signupLink: "নতুন সদস্য? সাইন-আপ করুন"
    },
    EN: {
      title: "Cooperative Society ERP",
      email: "Email, Phone or Member ID",
      password: "Password",
      rememberMe: "Remember Me",
      forgotPass: "Forgot Password?",
      loginBtn: "Login Now",
      loadingBtn: "Logging in...",
      emailPlaceholder: "Email, Phone or Member ID",
      passPlaceholder: "••••••",
      signupLink: "New member? Sign Up"
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!email || !password) {
      setError(lang === "BN" ? "সবগুলো ঘর পূরণ করুন।" : "Please fill in all fields.");
      setLoading(false);
      return;
    }

    try {
      // Execute credentials signin via NextAuth
      const response = await signIn("credentials", {
        email,
        password,
        redirect: false
      });

      if (!response || response.error) {
        setError(
          lang === "BN" ? "আপনার আইডি বা পাসওয়ার্ড ভুল" : "Invalid ID or Password"
        );
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError(
        lang === "BN" ? "সার্ভারে সমস্যা হয়েছে।" : "Internal Server Error"
      );
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

      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">
            {labels[lang].email} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={labels[lang].emailPlaceholder}
            className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-zinc-800 dark:border-zinc-700 dark:text-white transition-all duration-200"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">
            {labels[lang].password} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={labels[lang].passPlaceholder}
              className="w-full pl-4 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-zinc-800 dark:border-zinc-700 dark:text-white transition-all duration-200"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <span>{labels[lang].rememberMe}</span>
          </label>

          <a
            href="/reset-password"
            className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline transition-all"
          >
            {labels[lang].forgotPass}
          </a>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 font-bold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-lg shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 mb-4"
        >
          {loading ? labels[lang].loadingBtn : labels[lang].loginBtn}
        </button>

        <div className="text-center text-sm">
          <a
            href="/signup"
            className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline transition-all"
          >
            {labels[lang].signupLink}
          </a>
        </div>
      </form>
    </div>
  );
}
