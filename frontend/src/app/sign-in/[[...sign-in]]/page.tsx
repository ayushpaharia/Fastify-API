"use client";

import { SignIn } from "@clerk/nextjs";
import { useEffect, useRef } from "react";

// Animated constellation grid background
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
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.5,
        pulse: Math.random() * Math.PI * 2,
      });
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);

      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 160) {
            const alpha = (1 - dist / 160) * 0.12;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(176, 198, 255, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      const t = Date.now() * 0.001;
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;

        const glow = 0.3 + Math.sin(t + n.pulse) * 0.2;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(176, 198, 255, ${glow * 0.15})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(176, 198, 255, ${glow})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    }

    draw();

    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0" />;
}

// Floating code snippets that drift across the background
const codeSnippets = [
  'GET /v1/auth/session',
  'Authorization: Bearer ••••',
  '{"status": "operational"}',
  'X-RateLimit-Remaining: 28',
  'POST /api/endpoints',
  'Content-Type: application/json',
  '200 OK • 12ms',
  'SELECT * FROM metrics',
];

export default function SignInPage() {
  return (
    // Full-screen overlay that covers the dashboard shell
    <div className="fixed inset-0 z-[100] overflow-hidden" style={{ background: "#050d1f" }}>
      {/* Deep gradient base */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 20% 80%, rgba(0, 84, 194, 0.12) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 80% 20%, rgba(0, 228, 117, 0.06) 0%, transparent 50%),
            radial-gradient(ellipse 100% 80% at 50% 50%, rgba(11, 19, 38, 1) 0%, rgba(5, 13, 31, 1) 100%)
          `,
        }}
      />

      {/* Constellation animation */}
      <ConstellationBg />

      {/* Floating code snippets */}
      <div className="absolute inset-0 z-[1] overflow-hidden pointer-events-none">
        {codeSnippets.map((snippet, i) => (
          <div
            key={i}
            className="absolute font-mono text-[10px] tracking-wider whitespace-nowrap"
            style={{
              color: `rgba(176, 198, 255, ${0.06 + (i % 3) * 0.03})`,
              top: `${10 + (i * 11) % 80}%`,
              left: `${-20 + (i * 7) % 40}%`,
              animation: `drift ${25 + i * 4}s linear infinite`,
              animationDelay: `${i * -3}s`,
            }}
          >
            {snippet}
          </div>
        ))}
      </div>

      {/* Scan line effect */}
      <div
        className="absolute inset-0 z-[2] pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(176,198,255,0.5) 2px, rgba(176,198,255,0.5) 3px)`,
        }}
      />

      {/* Main content */}
      <div className="relative z-10 flex min-h-screen">
        {/* Left: Brand story */}
        <div className="hidden lg:flex flex-col justify-between w-[480px] p-12 shrink-0">
          <div>
            <div className="flex items-center gap-3 mb-16">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(0, 84, 194, 0.4)" }}>
                <span className="material-symbols-outlined text-[#b0c6ff]" style={{ fontVariationSettings: "'FILL' 1" }}>api</span>
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-[#b0c6ff]" style={{ fontFamily: "var(--font-headline)" }}>Fastify-API</h1>
                <p className="text-[9px] uppercase tracking-[0.3em] text-slate-600 font-bold">Technical Curator</p>
              </div>
            </div>

            <h2
              className="text-[2.8rem] font-extrabold leading-[1.1] tracking-tight mb-6"
              style={{ fontFamily: "var(--font-headline)", color: "#dae2fd" }}
            >
              Your APIs,
              <br />
              <span className="text-[#b0c6ff]">curated</span> to
              <br />
              perfection.
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed max-w-[320px]">
              Monitor, document, and orchestrate your entire API infrastructure from a single editorial workspace.
            </p>
          </div>

          {/* Live stats ticker */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00e475] shadow-[0_0_8px_rgba(0,228,117,0.6)] animate-pulse" />
              <span className="text-[10px] font-mono text-[#00e475] uppercase tracking-widest">All systems operational</span>
            </div>
            <div className="flex gap-8">
              {[
                { label: "Uptime", value: "99.99%" },
                { label: "Latency", value: "42ms" },
                { label: "Endpoints", value: "24" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-slate-600 mb-1">{stat.label}</p>
                  <p className="text-sm font-mono font-bold text-slate-400">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Auth card */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="relative w-full max-w-[420px]">
            {/* Ambient glow behind card */}
            <div
              className="absolute -inset-20 rounded-full opacity-30 blur-3xl pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(176,198,255,0.15) 0%, transparent 70%)" }}
            />

            {/* Glass card frame */}
            <div
              className="relative rounded-2xl overflow-hidden"
              style={{
                background: "rgba(19, 27, 46, 0.6)",
                backdropFilter: "blur(24px)",
                border: "1px solid rgba(69, 70, 82, 0.2)",
                boxShadow: `
                  0 0 0 1px rgba(176, 198, 255, 0.03),
                  0 24px 48px rgba(0, 0, 0, 0.4),
                  0 0 120px rgba(176, 198, 255, 0.04)
                `,
              }}
            >
              {/* Top accent line */}
              <div
                className="h-px w-full"
                style={{
                  background: "linear-gradient(90deg, transparent 10%, rgba(176,198,255,0.3) 50%, transparent 90%)",
                }}
              />

              {/* Header */}
              <div className="px-10 pt-10 pb-6">
                <div className="lg:hidden flex items-center gap-3 mb-8">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(0, 84, 194, 0.4)" }}>
                    <span className="material-symbols-outlined text-[#b0c6ff] text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>api</span>
                  </div>
                  <span className="text-sm font-bold tracking-tight text-[#b0c6ff]" style={{ fontFamily: "var(--font-headline)" }}>Fastify-API</span>
                </div>

                <h3
                  className="text-xl font-bold tracking-tight mb-1"
                  style={{ fontFamily: "var(--font-headline)", color: "#dae2fd" }}
                >
                  Welcome back
                </h3>
                <p className="text-sm text-slate-500">
                  Sign in to access your curator dashboard
                </p>
              </div>

              {/* Clerk SignIn component — styled via globals.css */}
              <div className="px-10 pb-10">
                <SignIn />
              </div>
            </div>

            {/* Security badge */}
            <div className="flex items-center justify-center gap-2 mt-6 opacity-40">
              <span className="material-symbols-outlined text-xs text-slate-500">lock</span>
              <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">256-bit TLS encrypted</span>
            </div>
          </div>
        </div>
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes drift {
          from { transform: translateX(0); }
          to { transform: translateX(120vw); }
        }
      `}</style>
    </div>
  );
}
