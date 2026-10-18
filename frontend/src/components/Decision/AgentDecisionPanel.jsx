import React, { useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowRight,
  Sparkles,
  Loader2,
  FileCheck2,
  Fingerprint
} from "lucide-react";

export default function AgentDecisionPanel({
  investigation,
  onApprove,
  onReject,
  actionStatus
}) {
  const [operatorNotes, setOperatorNotes] = useState("");
  const [approverName, setApproverName] = useState("Lead AML Officer");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!investigation) {
    return (
      <div className="glass-panel rounded-2xl p-6 flex flex-col items-center justify-center text-center h-full min-h-[380px] border border-slate-800">
        <Sparkles className="w-10 h-10 text-cyan-400/40 mb-3" />
        <h3 className="font-semibold text-slate-200 text-sm">
          Awaiting Autonomous Investigation
        </h3>
        <p className="text-xs text-slate-500 max-w-xs mt-1">
          When an investigation is initiated, the multi-hop reasoning path, risk score, and action recommendation will appear here.
        </p>
      </div>
    );
  }

  const {
    transaction_id,
    risk_level,
    risk_score,
    confidence,
    key_findings = [],
    graph_path = [],
    recommended_action,
    reasoning_explanation,
    requires_approval,
    investigation_id
  } = investigation;

  const isHighRisk = risk_level === "HIGH" || risk_score >= 75;
  const isMedRisk = risk_level === "MEDIUM";

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await onApprove({
        investigationId: investigation_id,
        transactionId: transaction_id,
        action: recommended_action,
        approver: approverName,
        notes: operatorNotes || "Evidence chain confirmed by AML Risk Officer."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    setIsSubmitting(true);
    try {
      await onReject({
        investigationId: investigation_id,
        transactionId: transaction_id,
        action: recommended_action,
        rejector: approverName,
        reason: operatorNotes || "Manually evaluated and dismissed by operator."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col gap-4">
      {/* Top Banner: Risk Gauge & Action Header */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            {isHighRisk ? (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/80 border border-red-700 text-red-300 font-mono text-xs font-bold tracking-wider animate-pulse">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                HIGH RISK DETECTED
              </span>
            ) : isMedRisk ? (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-700 text-amber-300 font-mono text-xs font-bold tracking-wider">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                MEDIUM RISK
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700 text-emerald-300 font-mono text-xs font-bold tracking-wider">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                LOW RISK (CLEAN)
              </span>
            )}
            <span className="text-xs text-slate-400 font-mono">
              Entity: <strong className="text-slate-100">{transaction_id}</strong>
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-100 mt-1">
            Recommendation:{" "}
            <span
              className={
                isHighRisk
                  ? "text-rose-400"
                  : isMedRisk
                  ? "text-amber-400"
                  : "text-emerald-400"
              }
            >
              {recommended_action.replace(/_/g, " ")}
            </span>
          </h2>
        </div>

        {/* Score & Confidence Metric Badge */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
              Risk Score
            </div>
            <div
              className={`text-2xl font-black font-mono leading-none ${
                isHighRisk
                  ? "text-red-400"
                  : isMedRisk
                  ? "text-amber-400"
                  : "text-emerald-400"
              }`}
            >
              {risk_score}
              <span className="text-xs text-slate-500 font-normal">/100</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              Confidence: {Math.round(confidence * 100)}%
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Hop Topological Reasoning Path */}
      {graph_path && graph_path.length > 0 && (
        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
          <div className="text-[10px] font-mono uppercase text-slate-400 mb-2 flex items-center gap-1.5">
            <Fingerprint className="w-3.5 h-3.5 text-cyan-400" />
            Discovered Multi-Hop Topological Path ({graph_path.length} hops)
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {graph_path.map((nodeId, idx) => (
              <React.Fragment key={nodeId}>
                <span
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold border ${
                    idx === graph_path.length - 1 && isHighRisk
                      ? "bg-red-950/80 text-red-300 border-red-700 shadow-[0_0_10px_rgba(239,68,68,0.4)]"
                      : idx === 0
                      ? "bg-rose-950/60 text-rose-300 border-rose-800"
                      : "bg-slate-800/80 text-slate-200 border-slate-700"
                  }`}
                >
                  {nodeId}
                </span>
                {idx < graph_path.length - 1 && (
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Key Findings Bulleted Evidence */}
      <div>
        <div className="text-xs font-mono uppercase text-slate-400 mb-1.5 tracking-wider font-semibold">
          Graph Evidence Findings ({key_findings.length})
        </div>
        <ul className="space-y-1.5">
          {key_findings.map((f, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-xs text-slate-300 bg-slate-900/40 p-2 rounded-lg border border-slate-800/60"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 mt-1.5" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Executive Reasoning Narrative */}
      <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-300 leading-relaxed max-h-48 overflow-y-auto">
        <div className="font-semibold text-slate-200 mb-1 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          Agent Explainability Report
        </div>
        <div className="whitespace-pre-line text-slate-300">
          {reasoning_explanation}
        </div>
      </div>

      {/* Human-in-the-Loop Approval Action Card */}
      <div className="p-4 rounded-xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700/80 shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-mono font-bold uppercase text-slate-200 tracking-wider">
              Human-in-the-Loop Authorization
            </h4>
          </div>
          {actionStatus ? (
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                actionStatus.decision === "APPROVED"
                  ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                  : "bg-red-950 text-red-300 border border-red-800"
              }`}
            >
              {actionStatus.decision}: {actionStatus.status}
            </span>
          ) : (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 animate-pulse">
              Pending Human Approval
            </span>
          )}
        </div>

        {actionStatus ? (
          <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700 text-xs">
            <div className="font-semibold text-emerald-400 mb-1 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" />
              Action Executed & Audit Event Logged
            </div>
            <p className="text-slate-300 text-xs">{actionStatus.message}</p>
            <div className="mt-2 text-[10px] font-mono text-slate-400">
              Audit ID: <span className="text-cyan-300">{actionStatus.audit_id}</span> | Time: {actionStatus.timestamp}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Compliance Officer Name"
                value={approverName}
                onChange={(e) => setApproverName(e.target.value)}
                className="w-1/3 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <input
                type="text"
                placeholder="Audit justification / notes (optional)"
                value={operatorNotes}
                onChange={(e) => setOperatorNotes(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleApprove}
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs tracking-wider transition shadow-lg hover:shadow-emerald-900/40 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                <span>APPROVE & EXECUTE {recommended_action.replace(/_/g, " ")}</span>
              </button>

              <button
                onClick={handleReject}
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 font-semibold text-xs tracking-wider transition disabled:opacity-50 cursor-pointer"
              >
                <XCircle className="w-4 h-4 text-rose-400" />
                <span>REJECT</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
