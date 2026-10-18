import React from "react";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  ShieldCheck,
  Search,
  Share2,
  Server,
  UserCheck
} from "lucide-react";

const STEP_ICONS = {
  INVESTIGATION_STARTED: Search,
  TRANSACTION_IDENTIFIED: CheckCircle2,
  ACCOUNT_FOUND: UserCheck,
  GRAPH_TRAVERSAL_STARTED: Share2,
  SHARED_DEVICE_FOUND: AlertTriangle,
  RELATED_ACCOUNT_FOUND: Share2,
  INCIDENT_FOUND: Flame,
  NO_INCIDENTS_FOUND: ShieldCheck,
  RISK_CALCULATED: ShieldCheck,
  RECOMMENDATION_READY: CheckCircle2,
  APPROVAL_REQUIRED: Clock,
  ACTION_EXECUTED: CheckCircle2
};

export default function InvestigationTimeline({ steps = [], isStreaming = false }) {
  return (
    <div className="glass-panel rounded-2xl p-4 flex flex-col h-full border border-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <h3 className="font-semibold text-sm text-slate-100 tracking-wide">
            Autonomous Graph Timeline
          </h3>
        </div>
        {isStreaming && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800 text-[10px] font-mono text-cyan-300">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span>Traversing FalkorDB</span>
          </div>
        )}
      </div>

      {/* Steps List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[380px]">
        {steps.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-slate-500">
            <Search className="w-8 h-8 mb-2 opacity-40 text-slate-400" />
            <p className="text-xs">No active investigation running</p>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Select or ask GraphGuard to investigate a transaction
            </p>
          </div>
        ) : (
          steps.map((step, idx) => {
            const isLast = idx === steps.length - 1;
            const Icon = STEP_ICONS[step.step_name] || CheckCircle2;
            const isCritical =
              step.step_name === "INCIDENT_FOUND" ||
              step.step_name === "SHARED_DEVICE_FOUND" ||
              step.step_name === "APPROVAL_REQUIRED";

            return (
              <div
                key={step.step_id || idx}
                className={`relative flex items-start gap-3 p-2.5 rounded-xl border transition-all duration-200 ${
                  isLast && isStreaming
                    ? "bg-cyan-950/30 border-cyan-700/50"
                    : isCritical
                    ? "bg-red-950/20 border-red-900/40"
                    : "bg-slate-900/40 border-slate-800/60"
                }`}
              >
                {/* Step Icon */}
                <div
                  className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                    isCritical
                      ? "bg-red-900/40 text-red-400"
                      : isLast && isStreaming
                      ? "bg-cyan-900/40 text-cyan-400 animate-pulse"
                      : "bg-emerald-950/60 text-emerald-400"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span
                      className={`text-[10px] font-mono uppercase font-bold tracking-wider ${
                        isCritical ? "text-red-300" : "text-slate-300"
                      }`}
                    >
                      {step.step_name.replace(/_/g, " ")}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500">
                      {step.timestamp ? step.timestamp.substring(11, 19) : ""}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-snug break-words">
                    {step.message}
                  </p>

                  {/* Entity Tag if present */}
                  {step.entity_id && (
                    <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                      {step.entity_id}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
