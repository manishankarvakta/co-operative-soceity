"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/providers/LanguageProvider";

interface BackupRecord {
  id: string;
  filename: string;
  fileSize: number;
  status: string;
  startedAt: string;
  completedAt: string | null;
}

export default function BackupsPage() {
  const { lang } = useLanguage();
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Modals / Confirmation States
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupRecord | null>(null);
  const [confirmText, setConfirmText] = useState("");

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/backups");
      if (res.ok) {
        const data = await res.json();
        setBackups(data);
      } else {
        console.error("Failed to load backups history.");
      }
    } catch (err) {
      console.error("Error fetching backups:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleCreateBackup = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/backups", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(lang === "BN" ? "ব্যাকআপ সফলভাবে তৈরি করা হয়েছে।" : "Backup created successfully.");
        fetchBackups();
      } else {
        alert(data.message || (lang === "BN" ? "ব্যাকআপ তৈরি করতে ব্যর্থ হয়েছে।" : "Failed to create backup."));
      }
    } catch (err) {
      alert(lang === "BN" ? "ব্যাকআপ প্রক্রিয়ায় সমস্যা হয়েছে।" : "An error occurred during backup process.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestoreBackup = async () => {
    if (!selectedBackup) return;
    
    // Safety check: require user to type "RESTORE" to prevent accidental clicks
    if (confirmText !== "RESTORE") {
      alert(lang === "BN" ? "দয়া করে নিশ্চিতকরণ শব্দ 'RESTORE' সঠিকভাবে টাইপ করুন।" : "Please type the confirmation word 'RESTORE' correctly.");
      return;
    }

    setActionLoading(true);
    setShowRestoreModal(false);
    try {
      const res = await fetch("/api/backups/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedBackup.id })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(lang === "BN" ? "ডাটাবেজ সফলভাবে রিস্টোর করা হয়েছে!" : "Database restored successfully!");
        fetchBackups();
      } else {
        alert(data.message || (lang === "BN" ? "রিস্টোর করতে ব্যর্থ হয়েছে।" : "Failed to restore database."));
      }
    } catch (err) {
      alert(lang === "BN" ? "ডাটাবেজ রিস্টোর করার সময় ত্রুটি ঘটেছে।" : "An error occurred during database restoration.");
    } finally {
      setActionLoading(false);
      setSelectedBackup(null);
      setConfirmText("");
    }
  };

  const handleDeleteBackup = async () => {
    if (!selectedBackup) return;

    setActionLoading(true);
    setShowDeleteModal(false);
    try {
      const res = await fetch(`/api/backups?id=${selectedBackup.id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(lang === "BN" ? "ব্যাকআপ ফাইলটি মুছে ফেলা হয়েছে।" : "Backup file deleted successfully.");
        fetchBackups();
      } else {
        alert(data.message || (lang === "BN" ? "ব্যাকআপ ফাইলটি মুছতে ব্যর্থ হয়েছে।" : "Failed to delete backup file."));
      }
    } catch (err) {
      alert(lang === "BN" ? "ফাইলটি মুছার সময় ত্রুটি ঘটেছে।" : "An error occurred during file deletion.");
    } finally {
      setActionLoading(false);
      setSelectedBackup(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-250 rounded-full dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30">
            {lang === "BN" ? "সফল" : "Success"}
          </span>
        );
      case "FAILED":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-full dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30">
            {lang === "BN" ? "ব্যর্থ" : "Failed"}
          </span>
        );
      case "RUNNING":
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
            {lang === "BN" ? "চলমান" : "Running"}
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-xs font-semibold text-gray-650 bg-gray-50 border border-gray-200 rounded-full dark:bg-zinc-800 dark:text-gray-400 dark:border-zinc-700">
            {status}
          </span>
        );
    }
  };

  // Helper for displaying human readable file sizes
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const labels = {
    BN: {
      title: "সিস্টেম ব্যাকআপ ও রিস্টোর হাব",
      subtitle: "সমিতির সার্বিক হিসাব ও ডেটাবেজ ব্যাকআপ রাখুন। যেকোনো সময় আগের অবস্থায় রিস্টোর করতে পারবেন।",
      createBtn: "নতুন ব্যাকআপ তৈরি করুন",
      tableHeaderFile: "ব্যাকআপ ফাইলের নাম",
      tableHeaderSize: "ফাইলের সাইজ",
      tableHeaderStatus: "অবস্থা (Status)",
      tableHeaderTime: "শুরুর সময়",
      tableHeaderActions: "অ্যাকশন",
      restoreBtn: "রিস্টোর করুন",
      deleteBtn: "মুছুন",
      noBackups: "এখনো কোনো ব্যাকআপ ফাইল তৈরি করা হয়নি।",
      loadingText: "ডেটাবেজ ব্যাকআপ তালিকা লোড হচ্ছে...",
      actionLoadingText: "দয়া করে অপেক্ষা করুন...",
      warningTitle: "অত্যন্ত গুরুত্বপূর্ণ নোটিশ",
      warningContent: "রিস্টোর করার অর্থ হলো বর্তমান ডেটাবেজের সমস্ত তথ্য মুছে ফেলা হবে এবং ব্যাকআপ ফাইলের ডেটা দিয়ে প্রতিস্থাপন করা হবে। এই প্রক্রিয়াটি কোনোভাবেই ফেরত আনা সম্ভব নয়।"
    },
    EN: {
      title: "System Backup & Restore Hub",
      subtitle: "Generate database snapshot files. Restore system databases to historic backup points.",
      createBtn: "Create Backup Snapshot",
      tableHeaderFile: "Backup Filename",
      tableHeaderSize: "File Size",
      tableHeaderStatus: "Status",
      tableHeaderTime: "Started Time",
      tableHeaderActions: "Actions",
      restoreBtn: "Restore",
      deleteBtn: "Delete",
      noBackups: "No database backups have been generated yet.",
      loadingText: "Fetching backup history log...",
      actionLoadingText: "Processing request, please wait...",
      warningTitle: "Critical Security Notice",
      warningContent: "Restoring database snapshots is destructive. Current transaction records, logs, and accounts will be wiped and replaced with snapshot states."
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto transition-all relative">
      {/* Loading Overlay */}
      {actionLoading && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white font-bold tracking-wide drop-shadow">
            {labels[lang].actionLoadingText}
          </p>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 gap-4 border-gray-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white leading-tight flex items-center gap-2">
            🛡️ {labels[lang].title}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {labels[lang].subtitle}
          </p>
        </div>
        <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-start">
          <button
            onClick={handleCreateBackup}
            disabled={actionLoading}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-md transition-all"
          >
            + {labels[lang].createBtn}
          </button>
        </div>
      </div>

      {/* Warning Alert Banner */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl dark:bg-amber-950/20 dark:border-amber-900/30 flex items-start gap-3">
        <span className="text-xl">⚠️</span>
        <div>
          <strong className="block text-sm text-amber-800 dark:text-amber-400 font-bold">
            {labels[lang].warningTitle}
          </strong>
          <span className="text-xs text-amber-700 dark:text-amber-500 mt-0.5 block leading-relaxed">
            {labels[lang].warningContent}
          </span>
        </div>
      </div>

      {/* Backups log table */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-150 dark:border-zinc-800 shadow-md overflow-hidden transition-all duration-300">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-zinc-850 text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold border-b border-gray-150 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4">{labels[lang].tableHeaderFile}</th>
                <th className="px-6 py-4">{labels[lang].tableHeaderSize}</th>
                <th className="px-6 py-4">{labels[lang].tableHeaderStatus}</th>
                <th className="px-6 py-4">{labels[lang].tableHeaderTime}</th>
                <th className="px-6 py-4 text-right">{labels[lang].tableHeaderActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-500">
                    <div className="flex justify-center items-center gap-2">
                      <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>{labels[lang].loadingText}</span>
                    </div>
                  </td>
                </tr>
              ) : backups.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400 font-medium">
                    {labels[lang].noBackups}
                  </td>
                </tr>
              ) : (
                backups.map((backup) => (
                  <tr key={backup.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-emerald-800 dark:text-emerald-450 font-bold max-w-xs truncate">
                      {backup.filename}
                    </td>
                    <td className="px-6 py-4 text-gray-650 dark:text-gray-300 font-mono text-xs">
                      {formatFileSize(backup.fileSize)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(backup.status)}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-xs font-mono">
                      {new Date(backup.startedAt).toLocaleString(lang === "BN" ? "bn-BD" : "en-US")}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                      {backup.status === "SUCCESS" && (
                        <button
                          onClick={() => {
                            setSelectedBackup(backup);
                            setShowRestoreModal(true);
                          }}
                          className="px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-900/40 rounded-md transition"
                        >
                          🔄 {labels[lang].restoreBtn}
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedBackup(backup);
                          setShowDeleteModal(true);
                        }}
                        className="px-3 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-450 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 border border-rose-200 dark:border-rose-900/40 rounded-md transition"
                      >
                        🗑️ {labels[lang].deleteBtn}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal: Restore Database */}
      {showRestoreModal && selectedBackup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-black text-rose-600 flex items-center gap-1.5">
              🛑 Critical DB Restoration
            </h3>
            <p className="text-sm text-gray-650 dark:text-gray-300 leading-relaxed">
              {lang === "BN"
                ? `আপনি কি নিশ্চিতভাবে "${selectedBackup.filename}" ফাইলটি থেকে ডাটাবেজ রিস্টোর করতে চান? এটি আপনার বর্তমান সমস্ত পরিবর্তন মুছে ফেলবে।`
                : `Are you sure you want to restore the database to "${selectedBackup.filename}" snapshot? All current data will be permanently overwritten.`}
            </p>
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg dark:bg-rose-950/10 dark:border-rose-900/30 text-xs text-rose-800 dark:text-rose-450 leading-relaxed font-bold">
              {lang === "BN"
                ? "নিশ্চিত করতে নিচে খালি ঘরে বড় হাতের অক্ষরে 'RESTORE' টাইপ করুন:"
                : "To confirm, please type 'RESTORE' in uppercase in the input field below:"}
            </div>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="RESTORE"
              className="w-full border border-gray-300 dark:border-zinc-700 px-3 py-2 text-sm rounded-lg dark:bg-zinc-800 dark:text-white uppercase font-mono text-center tracking-widest"
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setShowRestoreModal(false);
                  setSelectedBackup(null);
                  setConfirmText("");
                }}
                className="px-4 py-2 border rounded-lg text-xs font-semibold hover:bg-gray-50 dark:hover:bg-zinc-800 transition"
              >
                {lang === "BN" ? "বাতিল করুন" : "Cancel"}
              </button>
              <button
                onClick={handleRestoreBackup}
                disabled={confirmText !== "RESTORE"}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow disabled:opacity-50 transition"
              >
                {lang === "BN" ? "হ্যাঁ, রিস্টোর করুন" : "Yes, Restore"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete Backup */}
      {showDeleteModal && selectedBackup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-black text-gray-800 dark:text-white">
              🗑️ Delete Backup Snapshot
            </h3>
            <p className="text-sm text-gray-650 dark:text-gray-300 leading-relaxed">
              {lang === "BN"
                ? `আপনি কি নিশ্চিতভাবে "${selectedBackup.filename}" ব্যাকআপ ফাইলটি মুছে ফেলতে চান? ফাইলটি স্থায়ীভাবে ডিলিট হয়ে যাবে।`
                : `Are you sure you want to permanently delete the backup file "${selectedBackup.filename}" from disk?`}
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedBackup(null);
                }}
                className="px-4 py-2 border rounded-lg text-xs font-semibold hover:bg-gray-50 dark:hover:bg-zinc-800 transition"
              >
                {lang === "BN" ? "বাতিল করুন" : "Cancel"}
              </button>
              <button
                onClick={handleDeleteBackup}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow transition"
              >
                {lang === "BN" ? "হ্যাঁ, ডিলিট করুন" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
