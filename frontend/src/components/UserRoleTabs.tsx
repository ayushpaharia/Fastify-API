"use client";

import { useState, useCallback } from "react";
import type { User } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const TABS = ["All", "Admin", "Developer", "Viewer"] as const;
type Tab = (typeof TABS)[number];

const STATUS_FILTERS = ["All", "Active", "Inactive"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const roleColors: Record<string, string> = {
  admin: "bg-primary/10 text-primary",
  developer: "bg-secondary-container text-secondary-fixed",
  viewer: "bg-surface-container-highest text-slate-400",
};

const ROLES = ["admin", "developer", "viewer"] as const;
const AUTH_LEVELS: Record<string, string> = {
  admin: "Full System Write",
  developer: "Read/Write API",
  viewer: "Read-only Analytics",
};

// User ID 1 = self (Ayush Paharia)
const SELF_USER_ID = 1;

export default function UserRoleTabs({
  initialUsers,
  initialTotal,
}: {
  initialUsers: User[];
  initialTotal: number;
}) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [total, setTotal] = useState(initialTotal);
  const [tab, setTab] = useState<Tab>("All");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ name: "", role: "", status: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [statusOpen, setStatusOpen] = useState(false);
  const limit = 10;

  const fetchUsers = useCallback(async (role: Tab, status: StatusFilter, p: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(limit) });
      if (role !== "All") params.set("role", role.toLowerCase());
      if (status !== "All") params.set("status", status.toLowerCase());
      const res = await fetch(`${API_BASE}/api/users?${params}`);
      const data = await res.json();
      setUsers(data.data ?? []);
      setTotal(data.pagination?.total ?? 0);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleTab = (t: Tab) => {
    setTab(t);
    setPage(1);
    fetchUsers(t, statusFilter, 1);
  };

  const handleStatusFilter = (s: StatusFilter) => {
    setStatusFilter(s);
    setStatusOpen(false);
    setPage(1);
    fetchUsers(tab, s, 1);
  };

  const handlePage = (p: number) => {
    setPage(p);
    fetchUsers(tab, statusFilter, p);
  };

  const openEdit = (user: User) => {
    setEditUser(user);
    setEditForm({ name: user.name, role: user.role, status: user.status });
    setError("");
  };

  const saveEdit = async () => {
    if (!editUser) return;
    setSaving(true);
    setError("");
    try {
      const body: Record<string, string> = {};
      if (editForm.name !== editUser.name) body.name = editForm.name;
      if (editForm.role !== editUser.role) {
        body.role = editForm.role;
        body.authLevel = AUTH_LEVELS[editForm.role] || editUser.authLevel;
      }
      if (editForm.status !== editUser.status) body.status = editForm.status;

      if (Object.keys(body).length === 0) {
        setEditUser(null);
        return;
      }

      const res = await fetch(`${API_BASE}/api/users/${editUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Failed to update user");
        return;
      }

      setEditUser(null);
      fetchUsers(tab, statusFilter, page);
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user: User) => {
    if (user.id === SELF_USER_ID) return;
    if (!confirm(`Delete ${user.name}? This cannot be undone.`)) return;

    try {
      const res = await fetch(`${API_BASE}/api/users/${user.id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to delete user");
        return;
      }
      fetchUsers(tab, statusFilter, page);
    } catch {
      alert("Network error");
    }
  };

  const toggleStatus = async (user: User) => {
    if (user.id === SELF_USER_ID) return;
    const newStatus = user.status === "active" ? "inactive" : "active";
    try {
      const res = await fetch(`${API_BASE}/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) fetchUsers(tab, statusFilter, page);
    } catch { /* ignore */ }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const isSelf = (user: User) => user.id === SELF_USER_ID;

  return (
    <>
      <div className="bg-surface-container-low rounded-xl overflow-hidden">
        {/* Tab header */}
        <div className="p-6 border-b border-outline-variant/10 flex items-center justify-between">
          <div className="flex gap-4">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => handleTab(t)}
                className={`pb-1 px-1 font-bold text-sm transition-colors ${
                  tab === t
                    ? "text-primary border-b-2 border-primary"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {t === "All" ? "All Users" : `${t}s`}
              </button>
            ))}
          </div>
          {/* Status Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setStatusOpen(!statusOpen)}
              className="flex items-center gap-2 bg-surface-container-high px-3 py-1.5 rounded-lg border border-outline-variant/5 hover:bg-surface-container-highest transition-colors"
            >
              <span className="material-symbols-outlined text-sm text-slate-400">filter_list</span>
              <span className="text-xs text-slate-300 font-medium">
                {statusFilter === "All" ? "Filter by Status" : statusFilter}
              </span>
              <span className="material-symbols-outlined text-xs text-slate-500">expand_more</span>
            </button>
            {statusOpen && (
              <div className="absolute right-0 top-full mt-1 bg-surface-container-high border border-outline-variant/10 rounded-lg shadow-xl z-10 overflow-hidden min-w-[140px]">
                {STATUS_FILTERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusFilter(s)}
                    className={`w-full text-left px-4 py-2.5 text-xs font-medium transition-colors ${
                      statusFilter === s ? "bg-primary/10 text-primary" : "text-slate-300 hover:bg-surface-container-highest"
                    }`}
                  >
                    {s === "All" ? "All Statuses" : s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.15em] text-slate-500 font-bold border-b border-outline-variant/5">
                <th className="px-8 py-5">Member</th>
                <th className="px-6 py-5">Role</th>
                <th className="px-6 py-5">Authorization Level</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5">Last Activity</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 text-sm">Loading...</td>
                </tr>
              )}
              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 text-sm">No users found.</td>
                </tr>
              )}
              {!loading && users.map((user) => (
                <tr
                  key={user.id}
                  className={`group hover:bg-surface-container-highest/40 transition-colors ${user.status === "inactive" ? "opacity-75" : ""}`}
                >
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-lg object-cover ring-1 ring-outline-variant/20" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-slate-500 font-bold">
                          {user.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-bold text-on-surface flex items-center gap-2">
                          {user.name}
                          {isSelf(user) && (
                            <span className="text-[9px] font-extrabold bg-primary/10 text-primary px-1.5 py-0.5 rounded">YOU</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 font-mono">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 text-[10px] font-extrabold rounded-full tracking-wide ${roleColors[user.role] || "bg-surface-container-highest text-slate-400"}`}>
                      {user.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-1.5">
                      <span className={`material-symbols-outlined text-sm ${user.role === "admin" ? "text-tertiary" : "text-slate-400"}`}>
                        {user.role === "admin" ? "verified_user" : user.role === "developer" ? "code" : "visibility"}
                      </span>
                      <span className="text-xs text-on-surface-variant font-medium">{user.authLevel}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <button
                      onClick={() => !isSelf(user) && toggleStatus(user)}
                      className={`flex items-center gap-2 ${isSelf(user) ? "cursor-default" : "cursor-pointer hover:opacity-80"}`}
                      title={isSelf(user) ? "Cannot change your own status" : `Click to ${user.status === "active" ? "deactivate" : "activate"}`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${user.status === "active" ? "bg-tertiary" : "bg-slate-600"}`} />
                      <span className={`text-xs font-semibold ${user.status === "active" ? "text-on-surface" : "text-slate-500"}`}>
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </span>
                    </button>
                  </td>
                  <td className="px-6 py-5 text-xs text-slate-500">{user.lastActivity}</td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(user)}
                        className="p-2 text-slate-400 hover:text-primary transition-colors hover:bg-primary/10 rounded-lg"
                        title="Edit user"
                      >
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                      {isSelf(user) ? (
                        <button
                          className="p-2 text-slate-600 cursor-not-allowed rounded-lg"
                          title="Cannot delete your own account"
                          disabled
                        >
                          <span className="material-symbols-outlined">block</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDelete(user)}
                          className="p-2 text-slate-400 hover:text-error transition-colors hover:bg-error/10 rounded-lg"
                          title="Delete user"
                        >
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-6 border-t border-outline-variant/10 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            Showing <span className="text-on-surface">{total > 0 ? (page - 1) * limit + 1 : 0}–{Math.min(page * limit, total)}</span> of{" "}
            <span className="text-on-surface">{total}</span> members
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handlePage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center border border-outline-variant/20 text-slate-500 hover:bg-surface-container-high disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => handlePage(p)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                  p === page
                    ? "bg-primary text-on-primary"
                    : "border border-outline-variant/20 text-slate-400 hover:bg-surface-container-high"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => handlePage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="w-8 h-8 rounded-lg flex items-center justify-center border border-outline-variant/20 text-slate-500 hover:bg-surface-container-high disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setEditUser(null)}>
          <div className="bg-surface-container-low rounded-2xl p-8 w-full max-w-md shadow-2xl border border-outline-variant/10" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-on-surface mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">edit</span>
              Edit User
              {isSelf(editUser) && (
                <span className="text-[9px] font-extrabold bg-primary/10 text-primary px-1.5 py-0.5 rounded">YOU</span>
              )}
            </h3>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-error/10 border border-error/20 text-error text-xs font-medium">
                {error}
              </div>
            )}

            <div className="space-y-5">
              {/* Name */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Name</label>
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-surface-container-high border border-outline-variant/10 rounded-lg px-4 py-2.5 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>

              {/* Role */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full bg-surface-container-high border border-outline-variant/10 rounded-lg px-4 py-2.5 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary/30"
                >
                  {ROLES.map((r) => {
                    const disabled = isSelf(editUser) && ROLES.indexOf(r) < ROLES.indexOf(editUser.role as typeof r);
                    return (
                      <option key={r} value={r} disabled={disabled}>
                        {r.charAt(0).toUpperCase() + r.slice(1)}{disabled ? " (cannot downgrade)" : ""}
                      </option>
                    );
                  })}
                </select>
                {isSelf(editUser) && (
                  <p className="text-[10px] text-slate-500 mt-1">You cannot reduce your own role.</p>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  disabled={isSelf(editUser)}
                  className="w-full bg-surface-container-high border border-outline-variant/10 rounded-lg px-4 py-2.5 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                {isSelf(editUser) && (
                  <p className="text-[10px] text-slate-500 mt-1">You cannot deactivate your own account.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => setEditUser(null)}
                className="px-5 py-2.5 rounded-lg border border-outline/20 text-sm font-semibold text-slate-300 hover:bg-surface-container-high transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={saving}
                className="px-5 py-2.5 rounded-lg bg-primary text-on-primary text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
