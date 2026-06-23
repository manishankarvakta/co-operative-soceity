"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Search, User, Shield, CheckSquare, Square, Info, Eye, Edit2, Trash2, Lock, X } from "lucide-react";
import { ConfirmModal, Toast, useToast } from "@/components/ui/ConfirmModal";
import { useLanguage } from "@/providers/LanguageProvider";

interface Permission {
  id: string;
  name: string;
  description: string;
}

interface RolePermission {
  permissionId: string;
  permission: Permission;
}

interface Role {
  id: string;
  name: string;
  description: string;
  rolePermissions: RolePermission[];
}

interface UserListItem {
  id: string;
  email: string;
  name: string;
  memberCode: string | null;
  phone: string;
  status: string;
  joinDate: string | null;
  memberId: string | null;
  roles: string[];
  roleIds: string[];
  permissions: string[];
}

export default function UserPermissions() {
  const { lang } = useLanguage();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);

  // Editing state for selected user
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [customPermissions, setCustomPermissions] = useState<string[]>([]);

  const [actionSuccess, setActionSuccess] = useState("");
  const [actionError, setActionError] = useState("");

  // Modal / overlay states
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const { toast, showToast } = useToast();
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<UserListItem | null>(null);

  const categoryOrder = [
    "dashboard",
    "deposits",
    "members",
    "shares",
    "expenses",
    "loans",
    "accounting",
    "bank",
    "projects",
    "reports",
    "backups"
  ];

  const labels = {
    BN: {
      title: "ব্যবহারকারী পারমিশন কাস্টমাইজেশন (User Permissions)",
      subtitle: "সদস্য ও ইউজারদের পদবীভিত্তিক এবং পেজ বাই পেজ পারমিশন নিয়ন্ত্রণ প্যানেল।",
      searchPlaceholder: "নাম, মেম্বার আইডি বা মোবাইল নম্বর দিয়ে খুঁজুন...",
      colId: "মেম্বার আইডি",
      colName: "সদস্যের নাম",
      colPhone: "মোবাইল নম্বর",
      colStatus: "অবস্থা (Status)",
      colDate: "যোগদানের তারিখ (Join Date)",
      colAction: "অ্যাকশন",
      active: "সক্রিয় (Active)",
      inactive: "নিষ্ক্রিয় (Inactive)",
      suspended: "সাসপেন্ড (Suspended)",
      saveBtn: "পারমিশন সংরক্ষণ করুন",
      cancel: "বাতিল করুন",
      close: "বন্ধ করুন",
      loading: "অপেক্ষা করুন...",
      deleteTitle: "সদস্য ডিলিট করুন",
      deleteMessage: "আপনি কি নিশ্চিতভাবে এই সদস্য অ্যাকাউন্টটি ডিলিট করতে চান? (এটি সফট-ডিলিট হবে)",
      deleteConfirm: "হ্যাঁ, ডিলিট করুন",
      deleteSuccess: "সফলভাবে মুছে ফেলা হয়েছে",
      deleteFail: "মুছে ফেলতে ব্যর্থ",
      designation: "ইউজার পদবী (Template Designation)",
      designationDesc: "ব্যবহারকারীর জন্য মূল টেমপ্লেট নির্বাচন করুন।",
      shortcuts: "ডিজাইন টেমপ্লেট লোড (Template Shortcuts)",
      shortcutsDesc: "নিচের যে কোনো টেমপ্লেট পারমিশন সেটটি এই ইউজারের বক্সে তাৎক্ষণিক লোড করুন।",
      superAdminNotice: "এই ইউজারটি একজন সুপার এডমিন। তাই সিস্টেমে তার ফুল অ্যাক্সেস থাকবে, নিচের কাস্টম পারমিশন নির্বিশেষে।",
      modalTitle: "পারমিশন এডিট করুন - ",
    },
    EN: {
      title: "User Permissions Customization",
      subtitle: "Control role designations and granular page-by-page access control policies.",
      searchPlaceholder: "Search by name, member code, or phone number...",
      colId: "Member ID",
      colName: "Member Name",
      colPhone: "Mobile No.",
      colStatus: "Status",
      colDate: "Join Date",
      colAction: "Action",
      active: "Active",
      inactive: "Inactive",
      suspended: "Suspended",
      saveBtn: "Save Permissions",
      cancel: "Cancel",
      close: "Close",
      loading: "Please wait...",
      deleteTitle: "Delete Member",
      deleteMessage: "Are you sure you want to delete this member account? (This will be a soft-delete)",
      deleteConfirm: "Yes, Delete",
      deleteSuccess: "Successfully deleted",
      deleteFail: "Failed to delete",
      designation: "Template Designation",
      designationDesc: "Select the primary role template for the user.",
      shortcuts: "Template Shortcuts",
      shortcutsDesc: "Instantly load any role template permissions into the user's checklist.",
      superAdminNotice: "This user is a SUPER_ADMIN. They have full access to all resources irrespective of custom rules.",
      modalTitle: "Edit Permissions - ",
    }
  };

  const L = labels[lang];

  const getCategoryTitle = (key: string) => {
    switch (key) {
      case "dashboard":
        return "Dashboard (ড্যাশবোর্ড)";
      case "members":
        return "People (সদস্য ও ইউজার)";
      case "deposits":
        return "Deposits (আমানত)";
      case "shares":
        return "Shares (শেয়ার)";
      case "expenses":
        return "Expenses (খরচসমূহ)";
      case "loans":
        return "Microfinance Loans (ঋণসমূহ)";
      case "accounting":
        return "Accounting (হিসাবরক্ষণ)";
      case "projects":
        return "Projects (প্রজেক্টসমূহ)";
      case "backups":
        return "Backups (ব্যাকআপস)";
      case "reports":
        return "Reports (রিপোর্টস)";
      case "bank":
        return "Bank (ব্যাংক হিসাব)";
      default:
        return key.toUpperCase();
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const permRes = await fetch("/api/permissions");
      const permData = await permRes.json();
      setAllPermissions(permData);

      const rolesRes = await fetch("/api/permissions/roles");
      const rolesData = await rolesRes.json();
      setRoles(rolesData);

      const usersRes = await fetch("/api/permissions/users");
      const usersData = await usersRes.json();
      setUsers(usersData);

      if (selectedUser) {
        const updatedUser = usersData.find((u: UserListItem) => u.id === selectedUser.id);
        if (updatedUser) {
          selectUser(updatedUser);
        }
      }
    } catch (err) {
      console.error("Error loading user permissions data:", err);
      showToast("error", lang === "BN" ? "ডাটা লোড ব্যর্থ" : "Load Failed", lang === "BN" ? "ডাটা লোড করতে ব্যর্থ হয়েছে।" : "Failed to load user permissions data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectUser = (user: UserListItem) => {
    setSelectedUser(user);
    setSelectedRoleIds(user.roleIds);
    setCustomPermissions(user.permissions);
    setActionSuccess("");
    setActionError("");
  };

  const handleRoleToggle = (roleId: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  };

  const handlePermissionToggle = (permName: string) => {
    setCustomPermissions((prev) =>
      prev.includes(permName) ? prev.filter((name) => name !== permName) : [...prev, permName]
    );
  };

  const applyRoleTemplate = (role: Role) => {
    const templatePermNames = role.rolePermissions.map((rp) => rp.permission.name);
    setCustomPermissions(templatePermNames);
    if (!selectedRoleIds.includes(role.id)) {
      setSelectedRoleIds([role.id]);
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;
    setActionError("");
    setActionSuccess("");

    try {
      const res = await fetch("/api/permissions/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          roleIds: selectedRoleIds,
          permissions: customPermissions
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "সংরক্ষণ ব্যর্থ হয়েছে");
      }

      showToast("success", lang === "BN" ? "সফল হয়েছে" : "Success", lang === "BN" ? "ব্যবহারকারীর পারমিশন সফলভাবে আপডেট করা হয়েছে।" : "User permissions updated successfully.");
      setIsPermissionModalOpen(false);
      fetchData();
    } catch (err: any) {
      setActionError(err.message || "সংরক্ষণ করতে ব্যর্থ হয়েছে।");
      showToast("error", lang === "BN" ? "ত্রুটি" : "Error", err.message || "সংরক্ষণ করতে ব্যর্থ হয়েছে।");
    }
  };

  const handleConfirmDelete = async () => {
    if (!memberToDelete || !memberToDelete.memberId) return;
    setDeleteLoading(true);
    setDeleteModal(false);
    try {
      const response = await fetch(`/api/members/${memberToDelete.memberId}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok || !result.success) {
        showToast("error", L.deleteFail, result.message || (lang === "BN" ? "সদস্য ডিলিট করতে ব্যর্থ হয়েছে।" : "Failed to delete member."));
      } else {
        showToast("success", L.deleteSuccess, lang === "BN" ? "সদস্য সফলভাবে মুছে ফেলা হয়েছে।" : "Member has been deleted.");
        fetchData();
      }
    } catch (error) {
      showToast("error", lang === "BN" ? "সার্ভার এরর" : "Server Error", lang === "BN" ? "সার্ভারে সমস্যা হয়েছে।" : "Server error.");
    } finally {
      setDeleteLoading(false);
      setMemberToDelete(null);
    }
  };

  const getGroupedPermissions = () => {
    const groups: Record<string, Permission[]> = {};
    allPermissions.forEach((p) => {
      const parts = p.name.split(":");
      const groupName = parts[0] || "others";
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(p);
    });
    return groups;
  };

  const groupedPermissions = getGroupedPermissions();

  const sortedCategories = Object.keys(groupedPermissions).sort((a, b) => {
    const idxA = categoryOrder.indexOf(a);
    const idxB = categoryOrder.indexOf(b);
    if (idxA === -1 && idxB === -1) return a.localeCompare(b);
    if (idxA === -1) return 1;
    if (idxB === -1) return -1;
    return idxA - idxB;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-205 rounded-full dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50">
            {L.active}
          </span>
        );
      case "INACTIVE":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold text-gray-650 bg-gray-50 border border-gray-200 rounded-full dark:bg-zinc-800 dark:text-gray-400 dark:border-zinc-700">
            {L.inactive}
          </span>
        );
      case "SUSPENDED":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50">
            {L.suspended}
          </span>
        );
      default:
        return null;
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      u.name.toLowerCase().includes(q) ||
      (u.memberCode && u.memberCode.toLowerCase().includes(q)) ||
      (u.phone && u.phone.includes(q))
    );
  });

  const isSuperAdmin = selectedUser?.roles.includes("SUPER_ADMIN");

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-305">
      <Toast toast={toast} />

      {/* Delete Confirm Modal */}
      <ConfirmModal
        open={deleteModal}
        variant="delete"
        title={L.deleteTitle}
        message={L.deleteMessage}
        confirmText={L.deleteConfirm}
        cancelText={L.cancel}
        loading={deleteLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteModal(false);
          setMemberToDelete(null);
        }}
      />

      {/* Top Header Row */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/settings/permissions"
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-550 dark:text-zinc-400"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
              {L.title}
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              {L.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Search Console */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
          placeholder={L.searchPlaceholder}
        />
      </div>

      {/* Users Table List */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-black/5 dark:border-zinc-800 shadow-md overflow-hidden transition-all duration-300">
        <div className="overflow-x-auto text-sm">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-zinc-850 text-gray-500 dark:text-gray-400 font-bold border-b dark:border-zinc-800 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">{L.colId}</th>
                <th className="px-6 py-4">{L.colName}</th>
                <th className="px-6 py-4">{L.colPhone}</th>
                <th className="px-6 py-4">{L.colStatus}</th>
                <th className="px-6 py-4">{L.colDate}</th>
                <th className="px-6 py-4 text-right">{L.colAction}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150 dark:divide-zinc-800">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-zinc-450 font-medium">
                    কোনো ব্যবহারকারী পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-emerald-700 dark:text-emerald-450 select-all">
                      {u.memberCode || "SYSTEM"}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-800 dark:text-white">
                      {u.name}
                      <span className="block text-[10px] text-gray-400 font-normal mt-0.5">{u.email}</span>
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-600 dark:text-zinc-300">
                      {u.phone || "—"}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(u.status)}
                    </td>
                    <td className="px-6 py-4 text-zinc-650 dark:text-zinc-300">
                      {u.joinDate ? new Date(u.joinDate).toLocaleDateString(lang === "BN" ? "bn-BD" : "en-US") : "—"}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex gap-2 justify-end">
                        {u.memberId ? (
                          <>
                            <Link
                              href={`/dashboard/members/${u.memberId}`}
                              className="p-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-250 dark:border-emerald-900/40 transition"
                              title={lang === "BN" ? "বিস্তারিত দেখুন" : "View Details"}
                            >
                              <Eye className="w-4.5 h-4.5" />
                            </Link>
                            <Link
                              href={`/dashboard/members/${u.memberId}?edit=true`}
                              className="p-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-200 dark:border-blue-900/40 transition"
                              title={lang === "BN" ? "সম্পাদনা" : "Edit"}
                            >
                              <Edit2 className="w-4.5 h-4.5" />
                            </Link>
                            <button
                              onClick={() => {
                                setMemberToDelete(u);
                                setDeleteModal(true);
                              }}
                              className="p-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 rounded-lg border border-rose-200 dark:border-rose-900/40 transition"
                              title={lang === "BN" ? "মুছে ফেলুন" : "Delete"}
                            >
                              <Trash2 className="w-4.5 h-4.5" />
                            </button>
                          </>
                        ) : (
                          <span className="text-[10px] text-zinc-400 italic font-medium pr-2">System Admin</span>
                        )}
                        <button
                          onClick={() => {
                            selectUser(u);
                            setIsPermissionModalOpen(true);
                          }}
                          className="p-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-lg border border-amber-250 dark:border-amber-900/40 transition"
                          title={lang === "BN" ? "পারমিশন সেট করুন" : "Set Permissions"}
                        >
                          <Lock className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permission Editing Modal Overlay */}
      {isPermissionModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto space-y-6 animate-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b pb-4 dark:border-zinc-800">
              <div>
                <h2 className="text-xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
                  <span>{L.modalTitle} {selectedUser.name}</span>
                  <span className="text-xs font-semibold text-zinc-400 font-mono">({selectedUser.memberCode || "No Code"})</span>
                </h2>
                <p className="text-xs text-zinc-500 mt-1">
                  Email: {selectedUser.email}
                </p>
              </div>
              <button
                onClick={() => setIsPermissionModalOpen(false)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status indicators inside Modal */}
            {actionSuccess && (
              <div className="p-3 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900/50 rounded-xl">
                {actionSuccess}
              </div>
            )}
            {actionError && (
              <div className="p-3 text-xs font-bold text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/20 border border-rose-250 dark:border-rose-900/50 rounded-xl">
                {actionError}
              </div>
            )}

            {/* Template Selection Section */}
            <div className="bg-gray-50 dark:bg-zinc-950/30 border dark:border-zinc-800/80 p-5 rounded-2xl space-y-4">
              {/* Primary Designation */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-300">{L.designation}</h3>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">{L.designationDesc}</p>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {roles.map((role) => {
                    const isChecked = selectedRoleIds.includes(role.id);
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => handleRoleToggle(role.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                          isChecked
                            ? "bg-zinc-900 border-zinc-900 text-white dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-400 font-bold"
                            : "border-zinc-200 dark:border-zinc-800 text-zinc-550 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                        }`}
                      >
                        <Shield className="w-3.5 h-3.5" />
                        <span>{role.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Template shortcuts */}
              <div className="border-t border-zinc-200 dark:border-zinc-800/60 pt-4 space-y-3">
                <div>
                  <h3 className="text-xs font-bold text-zinc-805 dark:text-zinc-300">{L.shortcuts}</h3>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">{L.shortcutsDesc}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {roles
                    .filter((r) => r.name !== "SUPER_ADMIN")
                    .map((role) => (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => applyRoleTemplate(role)}
                        className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 text-zinc-700 dark:text-zinc-350 text-[10px] font-bold rounded-lg transition-colors border dark:border-zinc-700"
                      >
                        {role.name} এর সেট ইম্পোর্ট করুন
                      </button>
                    ))}
                </div>
              </div>

              {isSuperAdmin && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-900/30 rounded-xl flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
                  <Info className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                  <p className="leading-relaxed font-medium">{L.superAdminNotice}</p>
                </div>
              )}
            </div>

            {/* Granular checkboxes (grouped categories) */}
            <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-1">
              {sortedCategories.map((category) => {
                const perms = groupedPermissions[category] || [];
                return (
                  <div
                    key={category}
                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm"
                  >
                    <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-950/40 border-b border-zinc-200 dark:border-zinc-800">
                      <h3 className="text-xs font-bold text-zinc-850 dark:text-zinc-200 uppercase tracking-wider">
                        {getCategoryTitle(category)}
                      </h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {perms.map((perm) => {
                        const isChecked = customPermissions.includes(perm.name) || isSuperAdmin;
                        return (
                          <button
                            key={perm.id}
                            disabled={isSuperAdmin}
                            onClick={() => handlePermissionToggle(perm.name)}
                            className={`flex items-start text-left gap-3.5 p-3 rounded-xl border transition-all ${
                              isChecked
                                ? "border-emerald-550/30 bg-emerald-50/10 dark:bg-emerald-950/5 text-zinc-900 dark:text-white"
                                : "border-zinc-150 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-805/30 text-zinc-650 dark:text-zinc-400"
                            } ${isSuperAdmin ? "opacity-90" : ""}`}
                          >
                            <div className="shrink-0 mt-0.5">
                              {isChecked ? (
                                <CheckSquare className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-450" />
                              ) : (
                                <Square className="w-4.5 h-4.5 text-zinc-300 dark:text-zinc-650" />
                              )}
                            </div>
                            <div>
                              <div className="text-xs font-bold leading-tight font-mono tracking-tight">{perm.name}</div>
                              <div className="text-[10px] text-zinc-450 dark:text-zinc-550 mt-1">{perm.description}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 border-t pt-4 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setIsPermissionModalOpen(false)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-350 dark:border-zinc-800 transition"
              >
                {L.cancel}
              </button>
              <button
                type="button"
                onClick={handleSavePermissions}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition"
              >
                {L.saveBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
