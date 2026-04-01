"use client";

import { SignUp } from "@clerk/nextjs";
import { useEffect, useRef } from "react";

function ConstellationBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let animId: number;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const nodes: { x: number; y: number; vx: number; vy: number; r: number; pulse: number }[] = [];
    for (let i = 0; i < 80; i++) {
      nodes.push({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.5, pulse: Math.random() * Math.PI * 2,
      });
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 160) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(176, 198, 255, ${(1 - dist / 160) * 0.12})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      const t = Date.now() * 0.001;
      for (const n of nodes) {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
        const glow = 0.3 + Math.sin(t + n.pulse) * 0.2;
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(176, 198, 255, ${glow * 0.15})`; ctx.fill();
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(176, 198, 255, ${glow})`; ctx.fill();
      }
      animId = requestAnimationFrame(draw);
    }
    draw();
    const onResize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", onResize); };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0" />;
}

export default function SignUpPage() {
  return (
    <div className="fixed inset-0 z-[100] overflow-hidden" style={{ background: "#050d1f" }}>
      <div className="absolute inset-0" style={{
        background: `
          radial-gradient(ellipse 80% 60% at 20% 80%, rgba(0, 84, 194, 0.12) 0%, transparent 60%),
          radial-gradient(ellipse 60% 50% at 80% 20%, rgba(0, 228, 117, 0.06) 0%, transparent 50%),
          radial-gradient(ellipse 100% 80% at 50% 50%, rgba(11, 19, 38, 1) 0%, rgba(5, 13, 31, 1) 100%)
        `,
      }} />
      <ConstellationBg />
      <div className="absolute inset-0 z-[2] pointer-events-none opacity-[0.015]" style={{
        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(176,198,255,0.5) 2px, rgba(176,198,255,0.5) 3px)`,
      }} />

      <div className="relative z-10 flex items-center justify-center min-h-screen p-8">
        <div className="relative w-full max-w-[420px]">
          <div className="absolute -inset-20 rounded-full opacity-30 blur-3xl pointer-events-none" style={{ background: "radial-gradient(circle, rgba(176,198,255,0.15) 0%, transparent 70%)" }} />
          <div className="relative rounded-2xl overflow-hidden" style={{
            background: "rgba(19, 27, 46, 0.6)", backdropFilter: "blur(24px)",
            border: "1px solid rgba(69, 70, 82, 0.2)",
            boxShadow: "0 0 0 1px rgba(176, 198, 255, 0.03), 0 24px 48px rgba(0, 0, 0, 0.4), 0 0 120px rgba(176, 198, 255, 0.04)",
          }}>
            <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent 10%, rgba(176,198,255,0.3) 50%, transparent 90%)" }} />
            <div className="px-10 pt-10 pb-6">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(0, 84, 194, 0.4)" }}>
                  <span className="material-symbols-outlined text-[#b0c6ff] text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>api</span>
                </div>
                <span className="text-sm font-bold tracking-tight text-[#b0c6ff]" style={{ fontFamily: "var(--font-headline)" }}>Fastify-API</span>
              </div>
              <h3 className="text-xl font-bold tracking-tight mb-1" style={{ fontFamily: "var(--font-headline)", color: "#dae2fd" }}>Create your account</h3>
              <p className="text-sm text-slate-500">Join the Technical Curator platform</p>
            </div>
            <div className="px-10 pb-10 [&_.cl-rootBox]:w-full [&_.cl-card]:bg-transparent [&_.cl-card]:shadow-none [&_.cl-card]:p-0 [&_.cl-headerTitle]:hidden [&_.cl-headerSubtitle]:hidden [&_.cl-header]:hidden [&_.cl-internal-b1g9po]:hidden [&_.cl-footer]:pb-0">
              <SignUp appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "bg-transparent shadow-none p-0 gap-4",
                  headerTitle: "hidden", headerSubtitle: "hidden",
                  socialButtonsBlockButton: "bg-[rgba(34,42,61,0.6)] border border-[rgba(69,70,82,0.3)] hover:bg-[rgba(45,52,73,0.8)] transition-all",
                  formFieldInput: "bg-[rgba(34,42,61,0.6)] border-[rgba(69,70,82,0.3)] focus:border-[#b0c6ff] focus:ring-1 focus:ring-[rgba(176,198,255,0.2)]",
                  formButtonPrimary: "bg-gradient-to-r from-[#0054c2] to-[#0060dd] hover:from-[#0060dd] hover:to-[#0070f0] shadow-lg shadow-[rgba(0,84,194,0.3)] font-bold",
                  dividerLine: "bg-[rgba(69,70,82,0.3)]", dividerText: "text-slate-600",
                  footerActionText: "text-slate-500", footerActionLink: "text-[#b0c6ff] hover:text-[#d9e2ff]",
                  formFieldLabel: "text-slate-400",
                },
              }} />
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 mt-6 opacity-40">
            <span className="material-symbols-outlined text-xs text-slate-500">lock</span>
            <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">256-bit TLS encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
}
