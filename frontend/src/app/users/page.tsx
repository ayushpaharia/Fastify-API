import { api, type User, type Metric, type Paginated } from "@/lib/api";

export default async function UsersPage() {
  let users: User[] = [];
  let userMetrics: Metric[] = [];
  let total = 0;

  try {
    const res = await api<Paginated<User>>("/api/users");
    users = res.data;
    total = res.pagination.total;
    const allMetrics = await api<Metric[]>("/api/metrics?category=users");
    userMetrics = allMetrics;
  } catch {
    // empty
  }

  const roleColors: Record<string, string> = {
    admin: "bg-primary/10 text-primary",
    developer: "bg-secondary-container text-secondary-fixed",
    viewer: "bg-surface-container-highest text-slate-400",
  };

  const roleDefs = [
    {
      num: "01",
      title: "Administrator",
      desc: "Unrestricted access to all API endpoints, billing configuration, and user permission overrides.",
      icon: "admin_panel_settings",
      color: "border-primary/20",
      iconBg: "bg-primary/10 text-primary",
      perms: [
        { label: "Manage API Keys", allowed: true },
        { label: "Billing & Subscriptions", allowed: true },
        { label: "Global Audit Logs", allowed: true },
      ],
    },
    {
      num: "02",
      title: "Developer",
      desc: "Designed for technical implementation. Can create endpoints and view detailed logs.",
      icon: "terminal",
      color: "border-secondary-fixed/20",
      iconBg: "bg-secondary-container/30 text-secondary-fixed",
      perms: [
        { label: "CRUD on Endpoints", allowed: true },
        { label: "Access Secret Keys", allowed: true },
        { label: "No Billing Access", allowed: false },
      ],
    },
    {
      num: "03",
      title: "Viewer",
      desc: "Read-only access for stakeholders to monitor API performance and documentation.",
      icon: "monitoring",
      color: "border-slate-500/20",
      iconBg: "bg-surface-container-high text-slate-400",
      perms: [
        { label: "View Analytics", allowed: true },
        { label: "No Endpoint Changes", allowed: false },
        { label: "No Security Changes", allowed: false },
      ],
    },
  ];

  return (
    <>
      {/* Header */}
      <section className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <nav className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase mb-4">
            <span>Admin</span>
            <span className="material-symbols-outlined text-[10px]">chevron_right</span>
            <span className="text-secondary-fixed">User Management</span>
          </nav>
          <h2 className="text-4xl font-extrabold font-headline text-on-surface tracking-tight mb-2">Access Control</h2>
          <p className="text-on-surface-variant max-w-xl text-lg font-light leading-relaxed">
            Manage your team&apos;s administrative capabilities and API interaction tiers through curated role-based access.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-6 py-3 bg-surface-container-high text-on-surface border border-outline/10 rounded-xl hover:bg-surface-container-highest transition-all flex items-center gap-2 font-semibold text-sm">
            <span className="material-symbols-outlined">file_download</span>
            Export Log
          </button>
          <button className="px-6 py-3 bg-linear-to-br from-primary to-primary-container text-on-primary rounded-xl font-extrabold flex items-center gap-2 shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform text-sm">
            <span className="material-symbols-outlined">person_add</span>
            Invite Member
          </button>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {userMetrics.map((m, i) => {
          const icons = ["group", "radio_button_checked", "api", "security"];
          const borders = ["", "border-l-2 border-primary/30", "", "border-l-2 border-error/30"];
          const changeColors = ["text-tertiary", "", "", "text-error"];
          return (
            <div key={m.name} className={`bg-surface-container-low p-6 rounded-xl relative overflow-hidden group ${borders[i]}`}>
              <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-1">{m.name}</p>
              <div className="flex items-center gap-3">
                <h3 className="text-3xl font-extrabold text-on-surface font-headline">{m.value}</h3>
                {i === 1 && <div className="w-2 h-2 rounded-full bg-tertiary animate-pulse shadow-[0_0_8px_rgba(0,228,117,0.6)]" />}
              </div>
              <div className={`mt-4 flex items-center gap-2 text-xs font-bold ${changeColors[i] || "text-slate-500"}`}>
                {i === 0 && <span className="material-symbols-outlined text-sm">trending_up</span>}
                {i === 3 && <span className="material-symbols-outlined text-sm">security</span>}
                <span>{m.change}</span>
              </div>
            </div>
          );
        })}
      </section>

      {/* User Table */}
      <div className="bg-surface-container-low rounded-xl overflow-hidden">
        <div className="p-6 border-b border-outline-variant/10 flex items-center justify-between">
          <div className="flex gap-4">
            <button className="text-primary border-b-2 border-primary pb-1 px-1 font-bold text-sm">All Users</button>
            <button className="text-slate-400 hover:text-white transition-colors pb-1 px-1 font-medium text-sm">Admins</button>
            <button className="text-slate-400 hover:text-white transition-colors pb-1 px-1 font-medium text-sm">Developers</button>
          </div>
          <div className="flex items-center gap-2 bg-surface-container-high px-3 py-1.5 rounded-lg border border-outline-variant/5">
            <span className="material-symbols-outlined text-sm text-slate-400">filter_list</span>
            <span className="text-xs text-slate-300 font-medium">Filter by Status</span>
          </div>
        </div>
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
              {users.map((user) => (
                <tr key={user.id} className={`group hover:bg-surface-container-highest/40 transition-colors ${user.status === "inactive" ? "opacity-75" : ""}`}>
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
                      <button className="p-2 text-slate-400 hover:text-primary transition-colors hover:bg-primary/10 rounded-lg">
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                      <button className="p-2 text-slate-400 hover:text-error transition-colors hover:bg-error/10 rounded-lg">
                        <span className="material-symbols-outlined">block</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-6 border-t border-outline-variant/10 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            Showing <span className="text-on-surface">1-{users.length}</span> of <span className="text-on-surface">{total}</span> members
          </span>
          <div className="flex gap-2">
            <button className="w-8 h-8 rounded-lg flex items-center justify-center border border-outline-variant/20 text-slate-500 hover:bg-surface-container-high">
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <button className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary text-on-primary font-bold text-xs">1</button>
            <button className="w-8 h-8 rounded-lg flex items-center justify-center border border-outline-variant/20 text-slate-400 font-medium text-xs hover:bg-surface-container-high">2</button>
            <button className="w-8 h-8 rounded-lg flex items-center justify-center border border-outline-variant/20 text-slate-500 hover:bg-surface-container-high">
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Role Definitions */}
      <section className="mt-12">
        <h3 className="text-xl font-bold font-headline text-on-surface mb-6 flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">shield_person</span>
          Role Definitions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roleDefs.map((role) => (
            <div key={role.num} className={`bg-surface-container-low p-6 rounded-xl border-t ${role.color}`}>
              <div className="flex justify-between items-start mb-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${role.iconBg}`}>
                  <span className="material-symbols-outlined">{role.icon}</span>
                </div>
                <span className="text-[10px] font-bold text-slate-500 font-mono">{role.num}</span>
              </div>
              <h4 className="text-lg font-bold text-on-surface mb-2">{role.title}</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed mb-6">{role.desc}</p>
              <ul className="space-y-3 mb-6">
                {role.perms.map((perm) => (
                  <li key={perm.label} className="flex items-center gap-2 text-xs text-slate-400">
                    <span className={`material-symbols-outlined text-sm ${perm.allowed ? "text-tertiary" : "text-slate-600"}`}>
                      {perm.allowed ? "check_circle" : "cancel"}
                    </span>
                    {perm.label}
                  </li>
                ))}
              </ul>
              <button className="w-full py-2.5 rounded-lg border border-outline/20 text-xs font-bold text-slate-300 hover:bg-surface-container-high transition-colors">
                Modify Permissions
              </button>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
