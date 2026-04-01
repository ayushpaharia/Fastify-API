"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", icon: "dashboard", label: "Dashboard" },
  { href: "/api-docs", icon: "description", label: "API Docs" },
  { href: "/users", icon: "group", label: "User Management" },
  { href: "/logs", icon: "terminal", label: "Logs" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="h-full w-64 fixed left-0 top-0 bg-[#0b1326] flex flex-col py-8 px-4 z-50">
      <div className="mb-10 px-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>api</span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-primary font-headline">Fastify-API</h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Technical Curator</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium tracking-tight ${
                isActive
                  ? "text-primary font-bold border-r-2 border-primary bg-surface-container-high/50"
                  : "text-slate-400 hover:text-slate-100 hover:bg-surface-container-high"
              }`}
            >
              <span
                className="material-symbols-outlined text-lg"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-1 pt-6 border-t border-outline-variant/10">
        <button className="w-full flex items-center justify-center gap-2 py-3 mb-6 bg-linear-to-br from-primary to-primary-container text-on-primary rounded-xl font-bold text-sm transition-transform active:scale-95 shadow-lg shadow-primary/10">
          <span className="material-symbols-outlined text-sm">add</span>
          New Endpoint
        </button>
        <Link href="/settings" className={`flex items-center gap-3 px-3 py-2 transition-colors text-sm font-medium ${pathname === "/settings" ? "text-primary" : "text-slate-400 hover:text-slate-100"}`}>
          <span className="material-symbols-outlined text-lg">settings</span>
          Settings
        </Link>
        <Link href="/support" className={`flex items-center gap-3 px-3 py-2 transition-colors text-sm font-medium ${pathname === "/support" ? "text-primary" : "text-slate-400 hover:text-slate-100"}`}>
          <span className="material-symbols-outlined text-lg">help</span>
          Support
        </Link>
      </div>
    </aside>
  );
}
