"use client";

import { useEffect, useState } from "react";
import ProjectForm from "@/components/forms/ProjectForm";
import { ConfirmModal, Toast, useToast } from "@/components/ui/ConfirmModal";
import { useLanguage } from "@/providers/LanguageProvider";

export default function ProjectsPage() {
  const { lang } = useLanguage();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Selected project for ROI details & distribution
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [roiData, setRoiData] = useState<any>(null);
  const [loadingRoi, setLoadingRoi] = useState(false);

  // Profit distribution input
  const [distributeAmount, setDistributeAmount] = useState("");
  const [distributing, setDistributing] = useState(false);

  // Modal & Toast
  const { toast, showToast } = useToast();
  const [confirmModal, setConfirmModal] = useState(false);
  const [pendingAmount, setPendingAmount] = useState(0);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      setProjects(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleSelectProject = async (proj: any) => {
    setSelectedProject(proj);
    setLoadingRoi(true);
    try {
      const res = await fetch(`/api/projects/${proj.id}/roi`);
      const data = await res.json();
      setRoiData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRoi(false);
    }
  };

  // Step 1: validate then open confirm modal
  const handleDistributeProfit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    const bdtVal = parseFloat(distributeAmount);
    if (isNaN(bdtVal) || bdtVal <= 0) {
      showToast("warning", lang === "BN" ? "অবৈধ পরিমাণ" : "Invalid Amount", lang === "BN" ? "সঠিক লভ্যাংশের পরিমাণ লিখুন।" : "Please enter a valid amount.");
      return;
    }

    setPendingAmount(bdtVal);
    setConfirmModal(true);
  };

  // Step 2: execute after confirmation
  const handleConfirmDistribution = async () => {
    setConfirmModal(false);
    setDistributing(true);
    const paisaVal = Math.round(pendingAmount * 100);

    try {
      const res = await fetch(`/api/projects/${selectedProject.id}/roi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalProfit: paisaVal })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast("error", lang === "BN" ? "বন্টন ব্যর্থ" : "Distribution Failed", data.message || (lang === "BN" ? "লভ্যাংশ বন্টন ব্যর্থ হয়েছে।" : "Distribution failed."));
      } else {
        showToast("success", lang === "BN" ? "সফলভাবে বন্টন হয়েছে" : "Distribution Complete", lang === "BN" ? "লভ্যাংশ বন্টন সফলভাবে সম্পন্ন হয়েছে!" : "Profit distributed successfully!");
        setDistributeAmount("");
        setSelectedProject(null);
        setRoiData(null);
        loadProjects();
      }
    } catch (err) {
      showToast("error", lang === "BN" ? "সার্ভার সমস্যা" : "Server Error", lang === "BN" ? "সার্ভারে সমস্যা হয়েছে।" : "Something went wrong.");
    } finally {
      setDistributing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "FUNDING":
        return <span className="px-2 py-0.5 text-xs font-semibold text-blue-700 bg-blue-50 rounded-full">তহবিল সংগ্রহ (Funding)</span>;
      case "ACTIVE":
        return <span className="px-2 py-0.5 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-full">চলমান (Active)</span>;
      case "COMPLETED":
        return <span className="px-2 py-0.5 text-xs font-semibold text-gray-750 bg-gray-50 rounded-full">সমাপ্ত (Completed)</span>;
      case "CANCELLED":
        return <span className="px-2 py-0.5 text-xs font-semibold text-red-700 bg-red-50 rounded-full">বাতিল (Cancelled)</span>;
      default:
        return null;
    }
  };

  const labels = {
    BN: {
      title: "প্রজেক্ট এবং সদস্য বিনিয়োগ ব্যবস্থাপনা (Projects Workspace)",
      subtitle: "নতুন প্রজেক্ট তৈরি, মূলধন সংগ্রহ পর্যবেক্ষণ এবং লভ্যাংশ (ROI) বন্টন ড্যাশবোর্ড।",
      addBtn: "+ নতুন এন্ট্রি ফর্ম",
      closeBtn: "ফর্ম বন্ধ করুন",
      target: "টার্গেট মূলধন",
      collected: "সংগৃহীত মূলধন",
      status: "অবস্থা",
      roiBtn: "ROI ও লভ্যাংশ হিসাব",
      investorName: "বিনিয়োগকারী",
      investorCode: "মেম্বার কোড",
      investorAmt: "বিনিয়োগ (BDT)",
      investorRatio: "মূলধন অনুপাত",
      distTitle: "লভ্যাংশ (Dividend) বন্টন প্যানেল",
      distAmt: "বন্টনযোগ্য নিট মুনাফা (BDT)",
      distSubmit: "লভ্যাংশ বন্টন করুন",
      distributing: "বন্টন করা হচ্ছে...",
      loading: "লোডিং হচ্ছে..."
    },
    EN: {
      title: "Project Investments",
      subtitle: "Setup investment projects, track member capitals, and distribute dividends.",
      addBtn: "+ Setup / Invest",
      closeBtn: "Close Form",
      target: "Target Capital",
      collected: "Collected Capital",
      status: "Status",
      roiBtn: "ROI & Profit Distribution",
      investorName: "Investor Name",
      investorCode: "Member Code",
      investorAmt: "Contribution (BDT)",
      investorRatio: "Capital Ratio",
      distTitle: "Profit Distribution Panel",
      distAmt: "Total Profit to Distribute (BDT)",
      distSubmit: "Distribute Profit",
      distributing: "Processing Distribution...",
      loading: "Loading..."
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">

      {/* Confirm Modal — Profit Distribution */}
      <ConfirmModal
        open={confirmModal}
        variant="warning"
        title={lang === "BN" ? "লভ্যাংশ বন্টন নিশ্চিত করুন" : "Confirm Profit Distribution"}
        message={
          lang === "BN"
            ? `আপনি কি নিশ্চিতভাবে "${selectedProject?.name}" প্রজেক্টের লভ্যাংশ হিসেবে ${pendingAmount.toLocaleString()} BDT বন্টন করতে চান?`
            : `Are you sure you want to distribute ${pendingAmount.toLocaleString()} BDT profit for "${selectedProject?.name}"?`
        }
        confirmText={lang === "BN" ? "হ্যাঁ, বন্টন করুন" : "Yes, Distribute"}
        cancelText={lang === "BN" ? "বাতিল করুন" : "Cancel"}
        loading={distributing}
        onConfirm={handleConfirmDistribution}
        onCancel={() => setConfirmModal(false)}
      />

      {/* Toast */}
      <Toast toast={toast} />

      {/* Title block */}
      <div className="flex justify-between items-center border-b pb-4 border-gray-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{labels[lang].title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{labels[lang].subtitle}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg shadow transition"
          >
            {showForm ? labels[lang].closeBtn : labels[lang].addBtn}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="flex justify-center transition-all">
          <ProjectForm onSuccess={() => {
            setShowForm(false);
            loadProjects();
          }} />
        </div>
      )}

      {/* Main Grid display */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Projects list */}
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <p className="text-sm text-gray-500">{labels[lang].loading}</p>
          ) : projects.length === 0 ? (
            <p className="text-sm text-gray-500">কোনো প্রজেক্টের তথ্য পাওয়া যায়নি।</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map((proj) => {
                const percentage = proj.targetCapital > 0 ? (proj.currentCapital / proj.targetCapital) * 100 : 0;
                return (
                  <div key={proj.id} className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-black/5 dark:border-zinc-800 shadow hover:shadow-md transition flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-bold text-gray-800 dark:text-white text-base">{proj.name}</h4>
                        {getStatusBadge(proj.status)}
                      </div>
                      <span className="block text-xs text-gray-500 dark:text-gray-400 mb-4">📍 {proj.location}</span>

                      {/* Progress meter */}
                      <div className="space-y-1 mb-4">
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{labels[lang].collected}: {(proj.currentCapital / 100).toLocaleString()} BDT</span>
                          <span>{percentage.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-zinc-850 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full transition-all duration-300"
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-right text-gray-400">
                          {labels[lang].target}: {(proj.targetCapital / 100).toLocaleString()} BDT
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSelectProject(proj)}
                      className="w-full mt-4 py-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-250 dark:border-emerald-800 text-xs font-bold rounded hover:bg-emerald-100 transition"
                    >
                      {labels[lang].roiBtn}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ROI and distribution console panel */}
        <div className="lg:col-span-1">
          {selectedProject ? (
            <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-black/5 dark:border-zinc-800 shadow-md space-y-6 sticky top-6">
              <div className="border-b pb-3 dark:border-zinc-800">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">selected project</span>
                <h3 className="font-bold text-gray-850 dark:text-white text-base">{selectedProject.name}</h3>
              </div>

              {/* Investors list */}
              <div>
                <h4 className="font-bold text-xs text-gray-500 mb-2 uppercase">Investors & Capital ratios</h4>
                {loadingRoi ? (
                  <p className="text-xs text-gray-400">{labels[lang].loading}</p>
                ) : !roiData || roiData.ratios.length === 0 ? (
                  <p className="text-xs text-gray-400">কোনো বিনিয়োগকারী যুক্ত হয়নি।</p>
                ) : (
                  <div className="space-y-3 max-h-48 overflow-y-auto pr-1 text-xs">
                    {roiData.ratios.map((r: any) => (
                      <div key={r.memberId} className="flex justify-between items-center border-b pb-2 dark:border-zinc-850">
                        <div>
                          <strong className="text-gray-800 dark:text-white block">{r.memberName}</strong>
                          <span className="text-[10px] text-gray-400 font-mono">{r.memberCode}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono block font-semibold">{r.amount.toLocaleString()} BDT</span>
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{r.percentage.toFixed(2)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Profit distribution form */}
              {selectedProject.status !== "COMPLETED" && roiData && roiData.ratios.length > 0 && (
                <form onSubmit={handleDistributeProfit} className="pt-4 border-t border-gray-100 dark:border-zinc-800 space-y-4">
                  <h4 className="font-bold text-sm text-gray-850 dark:text-white">{labels[lang].distTitle}</h4>
                  <div>
                    <label className="block text-xs font-bold text-gray-650 dark:text-gray-300 mb-1">
                      {labels[lang].distAmt} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={distributeAmount}
                      onChange={(e) => setDistributeAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-zinc-850 dark:border-zinc-700 dark:text-white"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={distributing}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow transition disabled:opacity-50"
                  >
                    {distributing ? labels[lang].distributing : labels[lang].distSubmit}
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div className="p-8 border border-dashed border-gray-300 dark:border-zinc-700 rounded-xl text-center text-sm text-gray-500 bg-gray-50/50 dark:bg-zinc-900/50">
              প্রজেক্টের লভ্যাংশ বন্টন ও মূলধন অনুপাত দেখতে যেকোনো প্রজেক্টের নিচে &quot;ROI ও লভ্যাংশ হিসাব&quot; বাটনে ক্লিক করুন।
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
