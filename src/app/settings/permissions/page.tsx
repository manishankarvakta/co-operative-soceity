"use client";

import Link from "next/link";
import { ShieldAlert, Users, Layers, Key, ArrowRight } from "lucide-react";

export default function PermissionsDashboard() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          <span>অনুমতিসমূহ (Permissions)</span>
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
          ইউজার পারমিশন এবং পদবীভিত্তিক টেমপ্লেটসমূহ ম্যানেজ করুন।
        </p>
      </div>

      {/* Main Grid Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Templates Card */}
        <div className="group relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center rounded-xl transition-colors group-hover:bg-emerald-600 group-hover:text-white">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                পদবী টেমপ্লেট (Permission Templates)
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-405 mt-1.5 leading-relaxed">
                বিভিন্ন পদবীর (যেমনঃ ম্যানেজার, ক্যাশিয়ার) জন্য পারমিশন সেট তৈরি করে রাখুন।
              </p>
            </div>
          </div>
          <div className="mt-8">
            <Link
              href="/settings/permissions/templates"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white rounded-lg transition-all"
            >
              <span>Manage Templates</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* User Permissions Card */}
        <div className="group relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center rounded-xl transition-colors group-hover:bg-emerald-600 group-hover:text-white">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                ইউজার পারমিশন (User Permissions)
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-405 mt-1.5 leading-relaxed">
                নির্দিষ্ট ইউজারদের টেমপ্লেট অ্যাসাইন করুন এবং প্রয়োজনে পেজভিত্তিক কাস্টম পারমিশন দিন।
              </p>
            </div>
          </div>
          <div className="mt-8">
            <Link
              href="/settings/permissions/users"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-lg transition-all"
            >
              <span>Go to Users</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-4">
          Quick Actions
        </h3>
        <div className="flex flex-col gap-2">
          <Link
            href="/settings/permissions/templates?new=true"
            className="flex items-center justify-between p-3.5 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-950/30 dark:hover:bg-zinc-805/50 border border-zinc-100 dark:border-zinc-800 rounded-xl text-zinc-700 dark:text-zinc-200 text-sm font-semibold transition-all group"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg text-emerald-600 dark:text-emerald-400 font-light">+</span>
              <span>Create New Template</span>
            </div>
            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </Link>

          <Link
            href="/settings/permissions/users"
            className="flex items-center justify-between p-3.5 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-950/30 dark:hover:bg-zinc-805/50 border border-zinc-100 dark:border-zinc-800 rounded-xl text-zinc-700 dark:text-zinc-200 text-sm font-semibold transition-all group"
          >
            <div className="flex items-center gap-3">
              <Key className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
              <span>Assign Permissions to Users</span>
            </div>
            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </Link>
        </div>
      </div>
    </div>
  );
}
