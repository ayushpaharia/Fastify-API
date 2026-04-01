"use client";

import { useAuth, SignInButton, UserButton } from "@clerk/nextjs";

export default function TopNav() {
  const { isSignedIn } = useAuth();

  return (
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
          <a className="text-slate-400 font-medium hover:text-white transition-colors font-headline font-semibold text-sm" href="#">Health</a>
          <a className="text-primary border-b-2 border-primary pb-1 font-headline font-semibold text-sm" href="#">Metrics</a>
          <a className="text-slate-400 font-medium hover:text-white transition-colors font-headline font-semibold text-sm" href="#">Analytics</a>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <button className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <button className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
          <span className="material-symbols-outlined">settings_input_component</span>
        </button>

        {isSignedIn ? (
          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-8 h-8 rounded-lg",
              },
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
  );
}
