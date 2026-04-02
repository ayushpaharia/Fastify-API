"use client";

export default function DangerZone() {
  return (
    <div className="bg-surface-container-low rounded-xl p-6 border border-error/10">
      <h3 className="text-sm font-bold text-error uppercase tracking-widest mb-4">Danger Zone</h3>
      <div className="space-y-3">
        <button
          onClick={() => {
            if (confirm("Revoke all API keys? This cannot be undone.")) {
              alert("This is a demo — keys are display-only.");
            }
          }}
          className="w-full py-2.5 rounded-lg border border-error/20 text-error text-xs font-bold hover:bg-error/10 transition-colors"
        >
          Revoke All API Keys
        </button>
        <button
          onClick={() => confirm("Purge all log data? This cannot be undone.")}
          className="w-full py-2.5 rounded-lg border border-error/20 text-error text-xs font-bold hover:bg-error/10 transition-colors"
        >
          Purge Log Data
        </button>
      </div>
    </div>
  );
}
