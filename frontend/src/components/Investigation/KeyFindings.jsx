import React from "react";
import {
  Share2,
  Laptop,
  AlertTriangle,
  Globe,
  FileCheck2,
  ShieldAlert,
  ShieldCheck
} from "lucide-react";

export default function KeyFindings({ findings = [], isClean = false }) {
  if (isClean && (!findings || findings.length === 0)) {
    return (
      <div className="glass-panel p-4 rounded-xl border border-slate-800">
        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-2 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          Key Findings
        </div>
        <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-xs text-emerald-300">
          No multi-hop risk signals or compromised syndicate entities detected. Transaction conforms to verified user profile.
        </div>
      </div>
    );
  }

  // Map backend finding strings to categorized findings cards
  const categorizedFindings = (findings || []).map((finding, idx) => {
    let title = "GRAPH EVIDENCE SIGNAL";
    let icon = Share2;
    let badgeColor = "bg-cyan-950 text-cyan-300 border-cyan-800";

    const text = String(finding);
    if (text.includes("incident") || text.includes("F22") || text.includes("loss")) {
      title = "LOSS EXPOSURE & PRIOR INCIDENT";
      icon = AlertTriangle;
      badgeColor = "bg-red-950 text-red-300 border-red-800";
    } else if (text.includes("device") || text.includes("D55") || text.includes("hardware") || text.includes("rooted")) {
      title = "DEVICE REUSE & MULE HARDWARE";
      icon = Laptop;
      badgeColor = "bg-amber-950 text-amber-300 border-amber-800";
    } else if (text.includes("compromised") || text.includes("A887") || text.includes("connected")) {
      title = "HIGH-RISK NETWORK CONNECTION";
      icon = Share2;
      badgeColor = "bg-rose-950 text-rose-300 border-rose-800";
    } else if (text.includes("IP") || text.includes("proxy") || text.includes("Moscow") || text.includes("jurisdiction")) {
      title = "NETWORK INFRASTRUCTURE ANOMALY";
      icon = Globe;
      badgeColor = "bg-purple-950 text-purple-300 border-purple-800";
    }

    return {
      id: idx,
      title,
      icon,
      badgeColor,
      text
    };
  });

  return (
    <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
            Key Investigation Findings ({categorizedFindings.length})
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-500">
          Topology Verified
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {categorizedFindings.length === 0 ? (
          <div className="col-span-2 p-3 text-center text-xs text-slate-500">
            Awaiting graph traversal findings...
          </div>
        ) : (
          categorizedFindings.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.id}
                className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[9px] font-mono uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border ${f.badgeColor}`}
                  >
                    {f.title}
                  </span>
                  <Icon className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <p className="text-xs text-slate-300 leading-snug">
                  {f.text}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
