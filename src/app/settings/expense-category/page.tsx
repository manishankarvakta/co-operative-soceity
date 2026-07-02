"use client";

import { useState } from "react";
import { useLanguage } from "@/providers/LanguageProvider";
import { useExpenseCategory } from "@/providers/ExpenseCategoryProvider";
import { Plus, Trash2, Tag, Edit, Check, X } from "lucide-react";

export default function ExpenseCategorySettingsPage() {
  const { lang } = useLanguage();
  const { categories, addCategory, updateCategory, deleteCategory } = useExpenseCategory();

  const [newNameBN, setNewNameBN] = useState("");
  const [newNameEN, setNewNameEN] = useState("");

  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNameBN, setEditNameBN] = useState("");
  const [editNameEN, setEditNameEN] = useState("");

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNameBN.trim() || !newNameEN.trim()) return;

    addCategory({
      nameBN: newNameBN.trim(),
      nameEN: newNameEN.trim(),
    });

    setNewNameBN("");
    setNewNameEN("");
  };

  const handleStartEdit = (id: string, nameBN: string, nameEN: string) => {
    setEditingId(id);
    setEditNameBN(nameBN);
    setEditNameEN(nameEN);
  };

  const handleSaveEdit = (id: string) => {
    if (!editNameBN.trim() || !editNameEN.trim()) return;
    updateCategory(id, {
      nameBN: editNameBN.trim(),
      nameEN: editNameEN.trim(),
    });
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const labels = {
    BN: {
      title: "খরচ ক্যাটাগরি ম্যানেজমেন্ট",
      subtitle: "এখানে আপনার সিস্টেমের সব খরচের ক্যাটাগরি যোগ করুন, সম্পাদন করুন অথবা মুছুন।",
      addTitle: "নতুন ক্যাটাগরি যোগ করুন",
      nameBN: "নাম (বাংলা)",
      nameEN: "নাম (ইংরেজি)",
      addBtn: "যোগ করুন",
      tableHeaderBN: "বাংলা নাম",
      tableHeaderEN: "ইংরেজি নাম",
      action: "অ্যাকশন",
      delete: "ডিলিট করুন",
      edit: "সম্পাদন করুন",
      save: "সংরক্ষণ",
      cancel: "বাতিল",
    },
    EN: {
      title: "Expense Category Management",
      subtitle: "Add, edit, or remove expense categories used across your system.",
      addTitle: "Add New Category",
      nameBN: "Name (Bengali)",
      nameEN: "Name (English)",
      addBtn: "Add Category",
      tableHeaderBN: "Bengali Name",
      tableHeaderEN: "English Name",
      action: "Action",
      delete: "Delete",
      edit: "Edit",
      save: "Save",
      cancel: "Cancel",
    },
  };

  return (
    <div className="p-6 md:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
          <Tag className="w-6 h-6 text-emerald-500" />
          {labels[lang].title}
        </h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
          {labels[lang].subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="md:col-span-1">
          <form
            onSubmit={handleAddCategory}
            className="bg-white dark:bg-zinc-900/50 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800/50"
          >
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
              {labels[lang].addTitle}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1">
                  {labels[lang].nameEN}
                </label>
                <input
                  type="text"
                  required
                  value={newNameEN}
                  onChange={(e) => setNewNameEN(e.target.value)}
                  placeholder="e.g. Office Rent"
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1">
                  {labels[lang].nameBN}
                </label>
                <input
                  type="text"
                  required
                  value={newNameBN}
                  onChange={(e) => setNewNameBN(e.target.value)}
                  placeholder="যেমন: অফিস ভাড়া"
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-xl transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                {labels[lang].addBtn}
              </button>
            </div>
          </form>
        </div>

        {/* List Section */}
        <div className="md:col-span-2">
          <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 dark:text-zinc-400 uppercase bg-gray-50 dark:bg-zinc-800/50 border-b border-gray-100 dark:border-zinc-800">
                  <tr>
                    <th className="px-6 py-4 font-medium">{labels[lang].tableHeaderEN}</th>
                    <th className="px-6 py-4 font-medium">{labels[lang].tableHeaderBN}</th>
                    <th className="px-6 py-4 font-medium text-right">{labels[lang].action}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/50">
                  {categories.map((cat) => (
                    <tr
                      key={cat.id}
                      className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-colors animate-in fade-in duration-200"
                    >
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                        {editingId === cat.id ? (
                          <input
                            type="text"
                            value={editNameEN}
                            onChange={(e) => setEditNameEN(e.target.value)}
                            className="w-full px-2 py-1 text-sm bg-gray-50 dark:bg-zinc-805 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all dark:text-white"
                          />
                        ) : (
                          cat.nameEN
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-zinc-300">
                        {editingId === cat.id ? (
                          <input
                            type="text"
                            value={editNameBN}
                            onChange={(e) => setEditNameBN(e.target.value)}
                            className="w-full px-2 py-1 text-sm bg-gray-50 dark:bg-zinc-850 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all dark:text-white"
                          />
                        ) : (
                          cat.nameBN
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-1">
                          {editingId === cat.id ? (
                            <>
                              <button
                                onClick={() => handleSaveEdit(cat.id)}
                                className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors"
                                title={labels[lang].save}
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                title={labels[lang].cancel}
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleStartEdit(cat.id, cat.nameBN, cat.nameEN)}
                                className="p-2 text-gray-405 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors"
                                title={labels[lang].edit}
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteCategory(cat.id)}
                                className="p-2 text-gray-405 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                title={labels[lang].delete}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {categories.length === 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-6 py-8 text-center text-gray-500 dark:text-zinc-400"
                      >
                        No categories found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
