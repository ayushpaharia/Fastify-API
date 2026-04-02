"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth, SignInButton, UserButton } from "@clerk/nextjs";
import NotificationsPanel from "./NotificationsPanel";

export default function TopNav() {
  const { isSignedIn } = useAuth();
  const pathname = usePathname();
  const [notifOpen, setNotifOpen] = useState(false);

  const tabs = [
    { label: "Health", href: "/health" },
    { label: "Metrics", href: "/dashboard" },
    { label: "Analytics", href: "/logs" },
  ];

  return (
    <>
      <header className="fixed top-0 right-0 w-[calc(100%-16rem)] h-16 z-40 bg-[#0b1326]/80 backdrop-blur-xl flex justify-between items-center px-8 shadow-[0px_32px_32px_rgba(176,198,255,0.06)]">
        <div className="flex items-center gap-8">
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
            <input
              className="bg-surface-container-highest border-none rounded-full pl-10 pr-4 py-1.5 text-sm w-64 focus:ring-1 focus:ring-primary/30 transition-all outline-none text-on-surface-variant placeholder:text-slate-500"
              placeholder="Search endpoints..."
              type="text"
            />
          </div>
          <nav className="flex gap-6">
            {tabs.map((tab) => {
              const isActive =
                tab.label === "Health"
                  ? pathname === "/health"
                  : tab.label === "Metrics"
                  ? pathname === "/dashboard"
                  : tab.label === "Analytics"
                  ? pathname === "/logs"
                  : false;
              return (
                <Link
                  key={tab.label}
                  href={tab.href}
                  className={`font-headline font-semibold text-sm transition-colors pb-1 ${
                    isActive
                      ? "text-primary border-b-2 border-primary"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setNotifOpen(true)}
            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <Link
            href="/settings"
            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">settings_input_component</span>
          </Link>

          {isSignedIn ? (
            <UserButton
              appearance={{
                elements: { avatarBox: "w-8 h-8 rounded-lg" },
              }}
            />
          ) : (
            <SignInButton mode="modal">
              <button className="px-4 py-1.5 bg-linear-to-br from-primary to-primary-container text-on-primary rounded-lg font-bold text-xs transition-transform active:scale-95">
                Sign In
              </button>
            </SignInButton>
          )}
        </div>
      </header>

      <NotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
    </>
  );
}
