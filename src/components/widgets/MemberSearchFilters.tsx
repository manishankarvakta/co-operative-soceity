"use client";

interface MemberSearchFiltersProps {
  search: string;
  status: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
}

export default function MemberSearchFilters({
  search,
  status,
  onSearchChange,
  onStatusChange
}: MemberSearchFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 dark:bg-zinc-900 rounded-xl border border-gray-150 dark:border-zinc-800 transition-all mb-6">
      {/* Search Input */}
      <div className="flex-1 relative">
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="নাম, মোবাইল নম্বর বা মেম্বার আইডি দিয়ে খুঁজুন..."
          className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-zinc-850 dark:border-zinc-700 dark:text-white"
        />
        <div className="absolute left-3 top-2.5 text-gray-400">
          🔍
        </div>
      </div>

      {/* Status Filter */}
      <div className="w-full sm:w-48">
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-zinc-850 dark:border-zinc-700 dark:text-white"
        >
          <option value="">সকল সদস্য (All Status)</option>
          <option value="ACTIVE">সক্রিয় (Active)</option>
          <option value="INACTIVE">নিষ্ক্রিয় (Inactive)</option>
          <option value="SUSPENDED">সাসপেন্ড (Suspended)</option>
        </select>
      </div>
    </div>
  );
}
