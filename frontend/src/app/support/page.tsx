export default function SupportPage() {
  const docs = [
    { icon: "description", title: "API Reference", desc: "Full endpoint documentation with examples", href: "/api-docs" },
    { icon: "terminal", title: "Log Ingestion", desc: "Push external logs via POST /api/ingest", href: "/settings" },
    { icon: "webhook", title: "Webhooks", desc: "Configure event notifications", href: "/settings" },
    { icon: "shield", title: "Authentication", desc: "Clerk JWT + Neon Authorize RLS setup", href: "/settings" },
  ];

  const faq = [
    { q: "How do I get my API key?", a: "Go to Settings > API Keys. You'll find both production and development keys there. Use the Reveal button to view them." },
    { q: "How do rate limits work?", a: "Global read limit is 30 req/min, writes are 10 req/min. After 5 violations in a window, you'll get a 403 ban. Authenticated users are tracked by user ID, anonymous by IP." },
    { q: "How do I push logs from my service?", a: "POST to /api/ingest with { source, level, message, metadata }. Supports single entries or batches up to 100. Levels: debug, info, warn, error, fatal." },
    { q: "How do webhook notifications work?", a: "Create a webhook in Settings pointing to your URL. Subscribe to events like log.error, log.slow, health.degraded. We send a signed POST with HMAC-SHA256 signature." },
    { q: "What authentication does this use?", a: "Clerk for user auth (JWT), with Neon Authorize enforcing Row-Level Security policies directly in Postgres. Anonymous users get read-only access." },
  ];

  return (
    <>
      <section className="mb-10">
        <nav className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase mb-4">
          <span>System</span>
          <span className="material-symbols-outlined text-[10px]">chevron_right</span>
          <span className="text-secondary-fixed">Support</span>
        </nav>
        <h2 className="text-4xl font-extrabold font-headline text-on-surface tracking-tight mb-2">Support</h2>
        <p className="text-on-surface-variant max-w-xl text-lg font-light leading-relaxed">
          Documentation, guides, and answers to common questions.
        </p>
      </section>

      <div className="grid grid-cols-12 gap-6">
        {/* Quick Links */}
        <div className="col-span-12 md:col-span-8">
          <div className="grid grid-cols-2 gap-4 mb-8">
            {docs.map((doc) => (
              <a key={doc.title} href={doc.href} className="bg-surface-container-low rounded-xl p-6 hover:bg-surface-container-high transition-all group border border-outline-variant/5">
                <span className="material-symbols-outlined text-primary text-2xl mb-3 block group-hover:scale-110 transition-transform">{doc.icon}</span>
                <h3 className="text-sm font-bold text-on-surface mb-1">{doc.title}</h3>
                <p className="text-xs text-slate-500">{doc.desc}</p>
              </a>
            ))}
          </div>

          {/* FAQ */}
          <div className="bg-surface-container-low rounded-xl p-6">
            <h3 className="text-lg font-bold font-headline text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary-fixed">help</span>
              Frequently Asked Questions
            </h3>
            <div className="space-y-6">
              {faq.map((item, i) => (
                <div key={i} className="border-b border-outline-variant/10 pb-6 last:border-0">
                  <h4 className="text-sm font-bold text-on-surface mb-2">{item.q}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-12 md:col-span-4 space-y-6">
          <div className="bg-linear-to-br from-surface-container-high to-surface-container-low rounded-xl p-6 border border-outline-variant/10">
            <h3 className="text-primary font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined">code</span>
              Tech Stack
            </h3>
            <div className="space-y-3">
              {[
                { name: "Fastify 5", desc: "HTTP server" },
                { name: "Next.js 16", desc: "Frontend (App Router)" },
                { name: "Drizzle ORM", desc: "Type-safe SQL" },
                { name: "Neon Postgres", desc: "Serverless DB + Authorize" },
                { name: "Clerk", desc: "Authentication" },
                { name: "Tailwind v4", desc: "Styling" },
              ].map((tech) => (
                <div key={tech.name} className="flex justify-between items-center text-xs">
                  <span className="text-on-surface font-medium">{tech.name}</span>
                  <span className="text-slate-500">{tech.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface-container-low rounded-xl p-6">
            <h3 className="text-sm font-bold font-headline text-slate-400 uppercase tracking-widest mb-4">Contact</h3>
            <div className="space-y-3">
              <a href="https://github.com/ayushpaharia/Fastify-API" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-slate-400 hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-lg">code</span>
                GitHub Repository
              </a>
              <a href="https://github.com/ayushpaharia/Fastify-API/issues" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-slate-400 hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-lg">bug_report</span>
                Report an Issue
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
