"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Plus, ShieldCheck, CheckSquare, Square, Info } from "lucide-react";

interface Permission {
  id: string;
  name: string;
  description: string;
}

interface RolePermission {
  roleId: string;
  permissionId: string;
  permission: Permission;
}

interface Role {
  id: string;
  name: string;
  description: string;
  rolePermissions: RolePermission[];
}

export default function DesignationTemplates() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  
  // New role form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  
  // Selected role's permissions edit state
  const [checkedPermissionIds, setCheckedPermissionIds] = useState<string[]>([]);
  const [editDesc, setEditDesc] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [actionError, setActionError] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch permissions first to make sure they exist/seeded
      const permRes = await fetch("/api/permissions");
      const permData = await permRes.json();
      setAllPermissions(permData);

      const rolesRes = await fetch("/api/permissions/roles");
      const rolesData = await rolesRes.json();
      setRoles(rolesData);

      // Auto-select first non-admin role if none selected
      if (rolesData.length > 0 && !selectedRole) {
        const defaultSelect = rolesData.find((r: Role) => r.name !== "SUPER_ADMIN") || rolesData[0];
        selectRole(defaultSelect);
      } else if (selectedRole) {
        // Refresh selected role data
        const updatedSelected = rolesData.find((r: Role) => r.id === selectedRole.id);
        if (updatedSelected) {
          selectRole(updatedSelected);
        }
      }
    } catch (error) {
      console.error("Error fetching role templates:", error);
      setActionError("ডাটা লোড করতে ব্যর্থ হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Check if '?new=true' is in url to open modal
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("new") === "true") {
        setShowCreateModal(true);
      }
    }
  }, []);

  const selectRole = (role: Role) => {
    setSelectedRole(role);
    setEditDesc(role.description || "");
    const permIds = role.rolePermissions.map((rp) => rp.permissionId);
    setCheckedPermissionIds(permIds);
    setActionSuccess("");
    setActionError("");
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError("");
    setActionSuccess("");

    if (!newRoleName.trim()) {
      setActionError("টেমপ্লেটের নাম লিখুন।");
      return;
    }

    try {
      const res = await fetch("/api/permissions/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRoleName,
          description: newRoleDesc,
          permissionIds: []
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "সার্ভার এরর");
      }

      setActionSuccess("নতুন টেমপ্লেট সফলভাবে তৈরি হয়েছে।");
      setShowCreateModal(false);
      setNewRoleName("");
      setNewRoleDesc("");
      
      // Refresh roles and select the new one
      const rolesRes = await fetch("/api/permissions/roles");
      const rolesData = await rolesRes.json();
      setRoles(rolesData);
      const created = rolesData.find((r: Role) => r.name === data.role.name);
      if (created) {
        selectRole(created);
      }
    } catch (err: any) {
      setActionError(err.message || "টেমপ্লেট তৈরি করতে ব্যর্থ হয়েছে।");
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    setActionError("");
    setActionSuccess("");

    try {
      const res = await fetch("/api/permissions/roles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedRole.id,
          description: editDesc,
          permissionIds: checkedPermissionIds
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "আপডেট ব্যর্থ হয়েছে");
      }

      setActionSuccess("টেমপ্লেট পারমিশন সফলভাবে আপডেট করা হয়েছে।");
      // Refresh local roles list
      const rolesRes = await fetch("/api/permissions/roles");
      const rolesData = await rolesRes.json();
      setRoles(rolesData);
    } catch (err: any) {
      setActionError(err.message || "আপডেট করতে ব্যর্থ হয়েছে।");
    }
  };

  const togglePermission = (permId: string) => {
    if (selectedRole?.name === "SUPER_ADMIN") return; // Super admin locked
    setCheckedPermissionIds((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  // Predefined sequential category order matching sidebar modules
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

  // Group permissions by resource category (first part before the ':')
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

  // Sort categories sequentially
  const sortedCategories = Object.keys(groupedPermissions).sort((a, b) => {
    const idxA = categoryOrder.indexOf(a);
    const idxB = categoryOrder.indexOf(b);
    if (idxA === -1 && idxB === -1) return a.localeCompare(b);
    if (idxA === -1) return 1;
    if (idxB === -1) return -1;
    return idxA - idxB;
  });

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

  if (loading && roles.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-305">
      {/* Top Navigation Row */}
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
              পদবী টেমপ্লেটসমূহ
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              পদবীভিত্তিক পারমিশন টেমপ্লেট সেট তৈরি ও এডিট করুন।
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-md shadow-emerald-950/10"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন টেমপ্লেট</span>
        </button>
      </div>

      {/* Main Grid: Sidebar (Role list) & Core Content (Permission config) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Templates Sidebar */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 space-y-2 lg:col-span-1 shadow-sm">
          <h2 className="text-xs font-bold text-zinc-400 tracking-wider uppercase px-2 mb-3">
            সকল টেমপ্লেট
          </h2>
          <div className="space-y-1">
            {roles.map((role) => {
              const isActive = selectedRole?.id === role.id;
              return (
                <button
                  key={role.id}
                  onClick={() => selectRole(role)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                      : "text-zinc-650 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{role.name}</span>
                    {role.name === "SUPER_ADMIN" && (
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Permission Configuration Panels */}
        {selectedRole && (
          <div className="lg:col-span-3 space-y-6">
            {/* Status alerts */}
            {actionSuccess && (
              <div className="p-3 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900/50 rounded-xl animate-in fade-in">
                {actionSuccess}
              </div>
            )}
            {actionError && (
              <div className="p-3 text-xs font-bold text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/20 border border-rose-250 dark:border-rose-900/50 rounded-xl animate-in fade-in">
                {actionError}
              </div>
            )}

            {/* Template Header Panel */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">
                      {selectedRole.name}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-350 rounded-md">
                      Template Config
                    </span>
                  </div>
                  <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-1">
                    নিচে এই পদবীর ব্যবহারকারীদের ডিফল্ট অ্যাক্সেস কনফিগার করুন।
                  </p>
                </div>

                {selectedRole.name !== "SUPER_ADMIN" && (
                  <button
                    onClick={handleSavePermissions}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all self-end sm:self-auto"
                  >
                    <Save className="w-4 h-4" />
                    <span>সংরক্ষণ করুন</span>
                  </button>
                )}
              </div>

              {/* Description editor */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider">
                  বিবরণ (Description)
                </label>
                <input
                  type="text"
                  value={editDesc}
                  disabled={selectedRole.name === "SUPER_ADMIN"}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-850 dark:bg-zinc-950/20 dark:text-white rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="যেমনঃ হিসাবরক্ষণ ও বিল ভাউচার এন্ট্রি নেওয়ার পদবী।"
                />
              </div>

              {selectedRole.name === "SUPER_ADMIN" && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-900/30 rounded-xl flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="leading-relaxed font-medium">
                    সুপার এডমিনের সকল পারমিশন ডিফল্টভাবে ইনেবল করা থাকে এবং এটি পরিবর্তনযোগ্য নয়।
                  </p>
                </div>
              )}
            </div>

            {/* Permissions list grouped by Category */}
            <div className="space-y-4">
              {sortedCategories.map((category) => {
                const perms = groupedPermissions[category] || [];
                return (
                  <div
                    key={category}
                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm"
                  >
                    {/* Category Header */}
                    <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-950/40 border-b border-zinc-200 dark:border-zinc-800">
                      <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
                        {getCategoryTitle(category)}
                      </h3>
                    </div>

                  {/* Checkboxes Area */}
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {perms.map((perm) => {
                      const isChecked = checkedPermissionIds.includes(perm.id) || selectedRole.name === "SUPER_ADMIN";
                      const isSuper = selectedRole.name === "SUPER_ADMIN";
                      return (
                        <button
                          key={perm.id}
                          disabled={isSuper}
                          onClick={() => togglePermission(perm.id)}
                          className={`flex items-start text-left gap-3.5 p-3 rounded-xl border transition-all ${
                            isChecked
                              ? "border-emerald-550/30 bg-emerald-50/10 dark:bg-emerald-950/5 text-zinc-900 dark:text-white"
                              : "border-zinc-150 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-805/30 text-zinc-600 dark:text-zinc-400"
                          } ${isSuper ? "opacity-90" : ""}`}
                        >
                          <div className="shrink-0 mt-0.5">
                            {isChecked ? (
                              <CheckSquare className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-450" />
                            ) : (
                              <Square className="w-4.5 h-4.5 text-zinc-300 dark:text-zinc-650" />
                            )}
                          </div>
                          <div>
                            <div className="text-xs font-bold leading-tight font-mono tracking-tight">
                              {perm.name}
                            </div>
                            <div className="text-[10px] text-zinc-450 dark:text-zinc-550 mt-1">
                              {perm.description}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        )}
      </div>

      {/* Create New Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateRole}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-xl animate-in scale-in duration-200"
          >
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                নতুন পারমিশন টেমপ্লেট তৈরি
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                নতুন পদবী বা টেমপ্লেট রোল যোগ করুন।
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-450 dark:text-zinc-550 uppercase tracking-wider">
                  টেমপ্লেট রোল নাম (উদাঃ AUDITOR)
                </label>
                <input
                  type="text"
                  required
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white rounded-xl text-xs uppercase focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
                  placeholder="OPERATOR"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-450 dark:text-zinc-550 uppercase tracking-wider">
                  বিবরণ (Description)
                </label>
                <textarea
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 min-h-[60px]"
                  placeholder="এই টেমপ্লেটের কাজ ও অ্যাক্সেস লেভেলের বিবরণ লিখুন।"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-350 border border-zinc-200 dark:border-zinc-800 rounded-xl"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md"
              >
                তৈরি করুন
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
