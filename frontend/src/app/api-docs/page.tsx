import { api, type Endpoint } from "@/lib/api";

export default async function ApiDocsPage() {
  let endpoints: Endpoint[] = [];
  try {
    endpoints = await api<Endpoint[]>("/api/endpoints");
  } catch {
    // empty
  }

  const getEndpoint = endpoints.find((e) => e.path === "/v1/analytics/usage");
  const postEndpoint = endpoints.find((e) => e.path === "/endpoints/register");

  return (
    <>
      {/* Hero */}
      <section className="mb-12 relative">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-4xl font-extrabold tracking-tighter text-on-surface mb-2 font-headline">API Documentation</h2>
            <p className="text-secondary-fixed font-medium max-w-xl">
              Explore the technical blueprint of the <span className="font-mono text-primary">Fastify-API</span>. Manage endpoints, test payloads, and curate your data infrastructure.
            </p>
          </div>
          <div className="flex bg-surface-container-low p-1 rounded-full border border-outline-variant/10">
            <button className="px-6 py-1.5 rounded-full bg-surface-container-highest text-primary font-bold text-sm shadow-lg">List View</button>
            <button className="px-6 py-1.5 rounded-full text-slate-500 font-medium text-sm hover:text-slate-300">JSON View</button>
          </div>
        </div>
        <div className="bg-surface-container-low rounded-xl p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-surface-container-highest px-4 py-2 rounded-lg font-mono text-xs text-slate-400">BASE URL</div>
            <code className="font-mono text-primary text-lg">https://api.fastify-curator.tech/v1</code>
          </div>
          <button className="flex items-center gap-2 text-slate-400 hover:text-primary transition-colors font-mono text-xs font-bold uppercase tracking-widest">
            <span className="material-symbols-outlined text-sm">content_copy</span>
            Copy Base URL
          </button>
        </div>
      </section>

      {/* Documentation Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* GET endpoint card */}
        <div className="col-span-12 md:col-span-8 bg-surface-container-low rounded-xl p-1 overflow-hidden">
          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <span className="bg-tertiary-container text-tertiary-fixed px-3 py-1 rounded-md text-xs font-bold font-mono uppercase tracking-widest shadow-[0_0_12px_rgba(0,228,117,0.2)]">GET</span>
                <h3 className="text-xl font-bold font-mono text-on-surface">/analytics/usage</h3>
              </div>
              <button className="text-slate-500 hover:text-white transition-colors">
                <span className="material-symbols-outlined">more_vert</span>
              </button>
            </div>
            <p className="text-on-surface-variant text-sm mb-8 leading-relaxed">
              {getEndpoint?.description || "Retrieves the aggregated usage metrics for the specified API key. Includes throughput, error rates, and latency distributions over a given timeframe."}
            </p>
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h4 className="text-[10px] uppercase tracking-widest text-secondary-fixed mb-4 font-bold">Parameters</h4>
                <div className="space-y-3">
                  {[{ name: "timeframe", type: "string (query)" }, { name: "limit", type: "integer (query)" }].map((p) => (
                    <div key={p.name} className="flex justify-between items-center bg-surface-container-high/40 p-3 rounded-lg border-l-2 border-primary/30">
                      <span className="font-mono text-xs text-on-surface">{p.name}</span>
                      <span className="text-[10px] text-slate-500 italic">{p.type}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-[10px] uppercase tracking-widest text-secondary-fixed mb-4 font-bold">Response Code</h4>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-tertiary animate-pulse shadow-[0_0_8px_#00e475]" />
                  <span className="font-mono text-xs text-tertiary">200 OK</span>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-6 font-mono text-xs overflow-x-auto">
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-500">Example Response Body</span>
              <button className="text-primary hover:underline">Copy JSON</button>
            </div>
            <pre className="text-[#c9e7f7]">{`{
  `}<span className="text-tertiary-fixed-dim">{`"status"`}</span>{`: `}<span className="text-secondary-fixed">{`"success"`}</span>{`,
  `}<span className="text-tertiary-fixed-dim">{`"data"`}</span>{`: {
    `}<span className="text-tertiary-fixed-dim">{`"requests"`}</span>{`: `}<span className="text-primary">12405</span>{`,
    `}<span className="text-tertiary-fixed-dim">{`"latency_ms"`}</span>{`: `}<span className="text-primary">18.2</span>{`,
    `}<span className="text-tertiary-fixed-dim">{`"uptime"`}</span>{`: `}<span className="text-primary">99.99</span>{`
  }
}`}</pre>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="col-span-12 md:col-span-4 space-y-6">
          <div className="bg-linear-to-br from-surface-container-high to-surface-container-low p-6 rounded-xl border border-outline-variant/10 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 blur-3xl rounded-full group-hover:bg-primary/20 transition-all" />
            <h4 className="text-primary font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">verified_user</span>
              Authentication
            </h4>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              All requests must include your API Key in the <code className="font-mono text-xs text-on-surface">X-API-Key</code> header.
            </p>
            <button className="text-xs font-bold text-on-surface bg-surface-container-highest px-4 py-2 rounded-lg hover:bg-surface-bright transition-all">
              Manage Keys
            </button>
          </div>
          <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/5">
            <h4 className="text-secondary-fixed font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">speed</span>
              Rate Limits
            </h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Standard Tier</span>
                <span className="font-mono text-on-surface">5,000 req/hr</span>
              </div>
              <div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
                <div className="bg-primary w-2/3 h-full" />
              </div>
              <p className="text-[10px] text-slate-500 italic text-right">3,340 requests remaining</p>
            </div>
          </div>
        </div>

        {/* POST endpoint card */}
        <div className="col-span-12 md:col-span-8 bg-surface-container-low rounded-xl p-1 overflow-hidden">
          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <span className="bg-primary-container text-on-primary-container px-3 py-1 rounded-md text-xs font-bold font-mono uppercase tracking-widest shadow-[0_0_12px_rgba(0,84,194,0.3)]">POST</span>
                <h3 className="text-xl font-bold font-mono text-on-surface">/endpoints/register</h3>
              </div>
              <button className="text-slate-500 hover:text-white transition-colors">
                <span className="material-symbols-outlined">more_vert</span>
              </button>
            </div>
            <p className="text-on-surface-variant text-sm mb-8 leading-relaxed">
              {postEndpoint?.description || "Register a new downstream microservice to the Curator proxy."}
            </p>
            <div className="grid grid-cols-2 gap-8 mb-2">
              <div>
                <h4 className="text-[10px] uppercase tracking-widest text-secondary-fixed mb-4 font-bold">Request Body</h4>
                <div className="space-y-3">
                  <div className="bg-surface-container-high/40 p-3 rounded-lg flex flex-col gap-1">
                    <div className="flex justify-between">
                      <span className="font-mono text-xs text-on-surface">service_name</span>
                      <span className="text-[10px] text-error">required</span>
                    </div>
                    <span className="text-[10px] text-slate-500">The unique identifier for the service.</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-[10px] uppercase tracking-widest text-secondary-fixed mb-4 font-bold">Headers</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-surface-container-high/40 p-3 rounded-lg">
                    <span className="font-mono text-xs text-on-surface">Content-Type</span>
                    <span className="text-[10px] text-slate-500">application/json</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-6 font-mono text-xs overflow-x-auto">
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-500">Example Payload</span>
              <button className="text-primary hover:underline">Copy JSON</button>
            </div>
            <pre className="text-[#c9e7f7]">{`{
  `}<span className="text-tertiary-fixed-dim">{`"service_name"`}</span>{`: `}<span className="text-secondary-fixed">{`"auth-worker-01"`}</span>{`,
  `}<span className="text-tertiary-fixed-dim">{`"retry_policy"`}</span>{`: {
    `}<span className="text-tertiary-fixed-dim">{`"attempts"`}</span>{`: `}<span className="text-primary">3</span>{`,
    `}<span className="text-tertiary-fixed-dim">{`"backoff"`}</span>{`: `}<span className="text-secondary-fixed">{`"exponential"`}</span>{`
  }
}`}</pre>
          </div>
        </div>

        {/* Documentation Updates */}
        <div className="col-span-12 md:col-span-4 bg-surface-container-low rounded-xl p-6 border border-outline-variant/5">
          <h4 className="text-on-surface font-bold mb-6 font-headline text-lg">Documentation Updates</h4>
          <div className="space-y-6">
            {[
              { color: "bg-primary", title: "V1.4 Schema Refactor", time: "Updated 2h ago", desc: "Added strict typing for latency metrics response." },
              { color: "bg-tertiary", title: "New Endpoint: /health/db", time: "Yesterday", desc: "Exposed internal database connection pool status." },
              { color: "bg-slate-700", title: "Deprecated: /legacy/auth", time: "3 days ago", desc: "Marked for removal in V2.0 rollout." },
            ].map((item) => (
              <div key={item.title} className="flex gap-4">
                <div className={`w-1 h-10 ${item.color} rounded-full`} />
                <div>
                  <p className="text-sm font-semibold text-on-surface">{item.title}</p>
                  <p className="text-xs text-slate-500 mb-1">{item.time}</p>
                  <p className="text-xs text-slate-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-8 py-2 text-xs font-bold text-slate-400 border border-outline-variant/20 rounded-lg hover:border-primary/50 hover:text-primary transition-all">
            View Changelog
          </button>
        </div>
      </div>

      {/* Quick Search */}
      <div className="fixed bottom-8 right-8 bg-surface-container-highest/80 backdrop-blur-md px-4 py-2 rounded-full border border-outline-variant/20 flex items-center gap-3 shadow-2xl">
        <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Quick Search</span>
        <div className="flex gap-1">
          <kbd className="bg-surface px-1.5 py-0.5 rounded border border-outline-variant/30 text-[10px] text-primary font-mono">&#x2318;</kbd>
          <kbd className="bg-surface px-1.5 py-0.5 rounded border border-outline-variant/30 text-[10px] text-primary font-mono">K</kbd>
        </div>
      </div>
    </>
  );
}
