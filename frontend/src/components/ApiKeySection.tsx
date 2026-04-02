"use client";

import { useState } from "react";

function randomKey(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 10)}`;
}

interface ApiKey {
  label: string;
  prefix: string;
  initial: string;
}

const KEYS: ApiKey[] = [
  { label: "Production Key", prefix: "fapi_prod", initial: "fapi_prod_••••••••••••••••" },
  { label: "Development Key", prefix: "fapi_dev", initial: "fapi_dev_••••••••••••••••" },
];

export default function ApiKeySection() {
  const [keys, setKeys] = useState(KEYS.map((k) => ({ ...k, value: k.initial, revealed: false })));
  const [copied, setCopied] = useState<number | null>(null);

  const reveal = (i: number) => {
    setKeys((prev) =>
      prev.map((k, idx) =>
        idx === i
          ? { ...k, revealed: !k.revealed, value: !k.revealed ? randomKey(k.prefix) : k.initial }
          : k
      )
    );
  };

  const rotate = (i: number) => {
    const newKey = randomKey(keys[i].prefix);
    setKeys((prev) =>
      prev.map((k, idx) =>
        idx === i ? { ...k, value: newKey, revealed: true } : k
      )
    );
  };

  const copy = async (i: number) => {
    if (!keys[i].revealed) return;
    await navigator.clipboard.writeText(keys[i].value);
    setCopied(i);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="bg-surface-container-low rounded-xl p-6">
      <h3 className="text-lg font-bold font-headline text-on-surface mb-6 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">key</span>
        API Keys
      </h3>
      <div className="space-y-4">
        {keys.map((key, i) => (
          <div key={key.label} className="flex items-center justify-between p-4 bg-surface-container-high/40 rounded-lg">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-on-surface">{key.label}</p>
              <div className="flex items-center gap-2 mt-1">
                <p className={`font-mono text-xs truncate max-w-[260px] ${key.revealed ? "text-primary" : "text-slate-500"}`}>
                  {key.value}
                </p>
                {key.revealed && (
                  <button onClick={() => copy(i)} className="text-slate-400 hover:text-primary transition-colors flex-shrink-0">
                    <span className="material-symbols-outlined text-sm">
                      {copied === i ? "check" : "content_copy"}
                    </span>
                  </button>
                )}
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0 ml-4">
              <button
                onClick={() => reveal(i)}
                className={`px-3 py-1.5 text-xs font-bold border rounded-lg transition-colors ${
                  key.revealed
                    ? "text-primary border-primary/30 bg-primary/10"
                    : "text-slate-400 border-outline-variant/20 hover:bg-surface-container-highest"
                }`}
              >
                {key.revealed ? "Hide" : "Reveal"}
              </button>
              <button
                onClick={() => rotate(i)}
                className="px-3 py-1.5 text-xs font-bold text-primary border border-primary/20 rounded-lg hover:bg-primary/10 transition-colors"
              >
                Rotate
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
