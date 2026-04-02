"use client";

import { useState, useCallback } from "react";
import type { User } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const TABS = ["All", "Admin", "Developer", "Viewer"] as const;
type Tab = (typeof TABS)[number];

const roleColors: Record<string, string> = {
  admin: "bg-primary/10 text-primary",
  developer: "bg-secondary-container text-secondary-fixed",
  viewer: "bg-surface-container-highest text-slate-400",
};

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
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const limit = 10;

  const fetchUsers = useCallback(async (role: Tab, p: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(limit) });
      if (role !== "All") params.set("role", role.toLowerCase());
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
    fetchUsers(t, 1);
  };

  const handlePage = (p: number) => {
    setPage(p);
    fetchUsers(tab, p);
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
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
        <div className="flex items-center gap-2 bg-surface-container-high px-3 py-1.5 rounded-lg border border-outline-variant/5">
          <span className="material-symbols-outlined text-sm text-slate-400">filter_list</span>
          <span className="text-xs text-slate-300 font-medium">Filter by Status</span>
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
                      <div className="text-sm font-bold text-on-surface">{user.name}</div>
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
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${user.status === "active" ? "bg-tertiary" : "bg-slate-600"}`} />
                    <span className={`text-xs font-semibold ${user.status === "active" ? "text-on-surface" : "text-slate-500"}`}>
                      {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-5 text-xs text-slate-500">{user.lastActivity}</td>
                <td className="px-8 py-5 text-right">
                  <div className="flex justify-end gap-2">
                    <button className="p-2 text-slate-400 hover:text-primary transition-colors hover:bg-primary/10 rounded-lg" title="Edit user">
                      <span className="material-symbols-outlined">edit</span>
                    </button>
                    <button className="p-2 text-slate-400 hover:text-error transition-colors hover:bg-error/10 rounded-lg" title="Block user">
                      <span className="material-symbols-outlined">block</span>
                    </button>
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
          Showing <span className="text-on-surface">{(page - 1) * limit + 1}–{Math.min(page * limit, total)}</span> of{" "}
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
  );
}
