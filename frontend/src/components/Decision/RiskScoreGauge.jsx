import React from "react";
import { ShieldAlert, ShieldCheck, AlertTriangle, Activity, ChevronRight, Layers } from "lucide-react";

export default function RiskScoreGauge({
  score = 0,
  level = "LOW",
  explanation = "",
  confidence = 0.94,
  factors = []
}) {
  const numericScore = typeof score === "number" ? score : 0;
  const isHigh = level === "HIGH" || numericScore >= 75;
  const isMed = level === "MEDIUM" || (numericScore >= 35 && numericScore < 75);

  // Circular gauge calculations (circumference for radius = 42: 2 * PI * 42 = 263.89)
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (numericScore / 100) * circumference;

  const colorClass = isHigh
    ? "#ef4444"
    : isMed
    ? "#f59e0b"
    : "#10b981";

  const defaultExplanation = isHigh
    ? "High topological risk evaluated from multi-hop syndicate links, shared hardware, and network signals."
    : isMed
    ? "Medium topological risk with secondary network or payee anomalies."
    : "Clean baseline transaction matching customer's habitual pattern and residential ISP.";

  return (
    <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
            Topological Risk Assessment
          </span>
        </div>
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider ${
            isHigh
              ? "bg-red-950 text-red-300 border border-red-800"
              : isMed
              ? "bg-amber-950 text-amber-300 border border-amber-800"
              : "bg-emerald-950 text-emerald-300 border border-emerald-800"
          }`}
        >
          {level}
        </span>
      </div>

      {/* Circular Gauge Center */}
      <div className="flex items-center justify-center gap-6 my-2">
        <div className="relative w-28 h-28 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="9"
              fill="transparent"
            />
            {/* Value progress circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke={colorClass}
              strokeWidth="9"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Inner Score Text */}
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span
              className="text-2xl font-black font-mono leading-none tracking-tight"
              style={{ color: colorClass }}
            >
              {numericScore}
            </span>
            <span className="text-[10px] font-mono text-slate-500 uppercase mt-0.5">
              / 100
            </span>
          </div>
        </div>

        {/* Breakdown Summary */}
        <div className="space-y-1.5 text-left">
          <div>
            <div className="text-[10px] font-mono uppercase text-slate-400">
              Model Confidence
            </div>
            <div className="text-sm font-mono font-bold text-slate-200">
              {Math.round(confidence * 100)}% Verified
            </div>
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase text-slate-400">
              Risk Engine
            </div>
            <div className="text-xs font-mono text-cyan-400">
              FalkorDB Graph Multi-Hop
            </div>
          </div>
        </div>
      </div>

      {/* Backend Factor-Level Scoring Breakdown */}
      {factors && factors.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
          <div className="text-[10px] font-mono uppercase text-slate-400 font-semibold flex items-center justify-between">
            <span>Factor Contribution Breakdown</span>
            <span className="text-slate-500 font-mono">Weight (pts)</span>
          </div>
          <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
            {factors.map((f, i) => (
              <div
                key={i}
                className="p-1.5 rounded bg-slate-900/70 border border-slate-800/80 flex items-start justify-between gap-2 text-[11px]"
              >
                <div className="truncate">
                  <div className="font-semibold text-slate-200 truncate font-mono">
                    {f.factor}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate" title={f.evidence}>
                    {f.evidence}
                  </div>
                </div>
                <span className="font-mono font-bold text-rose-400 shrink-0">
                  +{f.contribution}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Explanation Quote */}
      <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 leading-relaxed font-sans">
        {explanation || defaultExplanation}
      </div>
    </div>
  );
}
