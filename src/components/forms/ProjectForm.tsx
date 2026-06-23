"use client";

import { useEffect, useState } from "react";

interface ProjectFormProps {
  onSuccess?: () => void;
}

export default function ProjectForm({ onSuccess }: ProjectFormProps) {
  const [lang, setLang] = useState<"BN" | "EN">("BN");
  const [mode, setMode] = useState<"project" | "investment">("project");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Selector datasets
  const [projects, setProjects] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);

  // Project creation states
  const [projectName, setProjectName] = useState("");
  const [location, setLocation] = useState("");
  const [targetCapital, setTargetCapital] = useState("");

  // Investment states
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [investmentAmount, setInvestmentAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState<"CASH" | "BANK">("CASH");

  const loadData = async () => {
    try {
      const [resProj, resMem] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/members?limit=100")
      ]);
      const dataProj = await resProj.json();
      const dataMem = await resMem.json();
      setProjects(dataProj || []);
      setMembers(dataMem.members || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    if (mode === "project") {
      const capitalVal = parseFloat(targetCapital);
      if (isNaN(capitalVal) || capitalVal <= 0) {
        setError(lang === "BN" ? "সঠিক মূলধনের পরিমাণ দিন।" : "Please enter a valid capital amount.");
        setLoading(false);
        return;
      }
      
      const payload = {
        name: projectName,
        location,
        targetCapital: Math.round(capitalVal * 100) // Paisa
      };

      try {
        const response = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const result = await response.json();

        if (!response.ok || !result.success) {
          setError(result.message || (lang === "BN" ? "প্রজেক্ট তৈরি করতে ব্যর্থ হয়েছে।" : "Failed to create project."));
        } else {
          setSuccessMsg(lang === "BN" ? "প্রজেক্ট সফলভাবে তৈরি হয়েছে।" : "Project created successfully.");
          setProjectName("");
          setLocation("");
          setTargetCapital("");
          if (onSuccess) onSuccess();
        }
      } catch (err) {
        setError(lang === "BN" ? "সার্ভারে সমস্যা হয়েছে।" : "Internal Server Error");
      } finally {
        setLoading(false);
      }
    } else {
      // Record Investment mode
      const amtVal = parseFloat(investmentAmount);
      if (isNaN(amtVal) || amtVal <= 0) {
        setError(lang === "BN" ? "সঠিক বিনিয়োগের পরিমাণ দিন।" : "Please enter a valid investment amount.");
        setLoading(false);
        return;
      }

      if (!selectedProjectId || !selectedMemberId) {
        setError(lang === "BN" ? "মেম্বার এবং প্রজেক্ট সিলেক্ট করুন।" : "Please select member and project.");
        setLoading(false);
        return;
      }

      const payload = {
        memberId: selectedMemberId,
        amount: Math.round(amtVal * 100), // Paisa
        paymentMode
      };

      try {
        const response = await fetch(`/api/projects/${selectedProjectId}/investments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const result = await response.json();

        if (!response.ok || !result.success) {
          setError(result.message || (lang === "BN" ? "বিনিয়োগ এন্ট্রি করতে ব্যর্থ হয়েছে।" : "Failed to record investment."));
        } else {
          setSuccessMsg(lang === "BN" ? "বিনিয়োগ সফলভাবে যুক্ত করা হয়েছে।" : "Investment recorded successfully.");
          setInvestmentAmount("");
          if (onSuccess) onSuccess();
        }
      } catch (err) {
        setError(lang === "BN" ? "সার্ভারে সমস্যা হয়েছে।" : "Internal Server Error");
      } finally {
        setLoading(false);
      }
    }
  };

  const labels = {
    BN: {
      titleProj: "নতুন প্রজেক্ট তৈরি ফর্ম",
      titleInv: "নতুন প্রজেক্ট বিনিয়োগ এন্ট্রি",
      projectName: "প্রজেক্টের নাম",
      location: "প্রজেক্টের অবস্থান/এলাকা",
      targetCapital: "টার্গেট মূলধন (BDT)",
      projectSelect: "প্রজেক্ট সিলেক্ট করুন",
      memberSelect: "সদস্য সিলেক্ট করুন",
      amount: "বিনিয়োগের পরিমাণ (BDT)",
      paymentMode: "পেমেন্ট মাধ্যম",
      submitProj: "প্রজেক্ট তৈরি করুন",
      submitInv: "বিনিয়োগ এন্ট্রি করুন",
      submitting: "প্রক্রিয়াধীন...",
      tabProj: "প্রজেক্ট তৈরি",
      tabInv: "বিনিয়োগ এন্ট্রি",
      cash: "ক্যাশ (Cash)",
      bank: "ব্যাংক (Bank)"
    },
    EN: {
      titleProj: "Create New Project",
      titleInv: "Log Project Investment",
      projectName: "Project Name",
      location: "Project Location",
      targetCapital: "Target Capital (BDT)",
      projectSelect: "Select Target Project",
      memberSelect: "Select Member Shareholder",
      amount: "Investment Amount (BDT)",
      paymentMode: "Payment Method",
      submitProj: "Create Project",
      submitInv: "Record Investment",
      submitting: "Processing...",
      tabProj: "Setup Project",
      tabInv: "Log Investment",
      cash: "Cash",
      bank: "Bank"
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
      {/* Tab Switcher */}
      <div className="flex gap-6 border-b border-gray-100 dark:border-zinc-800/50 pb-0 mb-8">
        <button
          type="button"
          onClick={() => {
            setMode("project");
            setError(null);
            setSuccessMsg(null);
          }}
          className={`pb-2 text-sm font-bold border-b-2 transition-all ${
            mode === "project" ? "border-emerald-650 text-emerald-600 dark:text-emerald-400" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          {labels[lang].tabProj}
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("investment");
            setError(null);
            setSuccessMsg(null);
          }}
          className={`pb-2 text-sm font-bold border-b-2 transition-all ${
            mode === "investment" ? "border-emerald-650 text-emerald-600 dark:text-emerald-400" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          {labels[lang].tabInv}
        </button>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-extrabold text-gray-800 dark:text-white">
          {mode === "project" ? labels[lang].titleProj : labels[lang].titleInv}
        </h2>
        <button
          type="button"
          onClick={() => setLang(lang === "BN" ? "EN" : "BN")}
          className="px-2 py-0.5 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 rounded"
        >
          {lang === "BN" ? "English" : "বাংলা"}
        </button>
      </div>

      {error && (
        <div className="p-3 mb-4 text-xs font-semibold text-red-650 bg-red-50 dark:bg-red-950/20 dark:text-red-400 rounded-lg border border-red-200">
          ⚠️ {error}
        </div>
      )}

      {successMsg && (
        <div className="p-3 mb-4 text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 rounded-lg border border-emerald-200">
          ✅ {successMsg}
        </div>
      )}

      <div className="space-y-5 text-sm">
        {mode === "project" ? (
          <>
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                {labels[lang].projectName} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="যেমন: তুষভাণ্ডার বাজার ভূমি প্রকল্প"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800/50 border border-transparent rounded-xl focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 dark:text-white transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                {labels[lang].location} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="যেমন: তুষভাণ্ডার, হাতীবান্ধা"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800/50 border border-transparent rounded-xl focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 dark:text-white transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                {labels[lang].targetCapital} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                value={targetCapital}
                onChange={(e) => setTargetCapital(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800/50 border border-transparent rounded-xl focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 dark:text-white transition-all outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-lg shadow-emerald-600/20 transition-all duration-300 disabled:opacity-50 disabled:shadow-none tracking-wide"
            >
              {loading ? labels[lang].submitting : labels[lang].submitProj}
            </button>
          </>
        ) : (
          <>
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                {labels[lang].projectSelect} <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800/50 border border-transparent rounded-xl focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 dark:text-white transition-all outline-none appearance-none"
              >
                <option value="">-- {lang === "BN" ? "সিলেক্ট করুন" : "Select Project"} --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                {labels[lang].memberSelect} <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800/50 border border-transparent rounded-xl focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 dark:text-white transition-all outline-none appearance-none"
              >
                <option value="">-- {lang === "BN" ? "সিলেক্ট করুন" : "Select Member"} --</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.memberCode})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                  {labels[lang].amount} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800/50 border border-transparent rounded-xl focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 dark:text-white transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                  {labels[lang].paymentMode}
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as any)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800/50 border border-transparent rounded-xl focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 dark:text-white transition-all outline-none appearance-none"
                >
                  <option value="CASH">{labels[lang].cash}</option>
                  <option value="BANK">{labels[lang].bank}</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-lg shadow-emerald-600/20 transition-all duration-300 disabled:opacity-50 disabled:shadow-none tracking-wide"
            >
              {loading ? labels[lang].submitting : labels[lang].submitInv}
            </button>
          </>
        )}
      </div>
    </form>
  );
}
