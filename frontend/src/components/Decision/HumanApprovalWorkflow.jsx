import React, { useState } from "react";
import {
  FileCheck2,
  CheckCircle,
  XCircle,
  AlertOctagon,
  Loader2,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  ClipboardList,
  Send,
  Lock
} from "lucide-react";

export default function HumanApprovalWorkflow({
  investigation,
  onApprove,
  onReject,
  onRequestApproval,
  actionStatus,
  currentUser
}) {
  const [operatorNotes, setOperatorNotes] = useState("");
  const [approverName, setApproverName] = useState(
    currentUser?.name || "Anshika Sahu (Lead AML Officer)"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  const role = currentUser?.role || "VIEWER";
  const canApprove = role === "ADMIN" || role === "REVIEWER";
  const isAnalyst = role === "ANALYST";
  const isViewer = role === "VIEWER";

  if (!investigation) {
    return (
      <div className="glass-panel p-4 rounded-xl border border-slate-800 text-center py-6">
        <FileCheck2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <h4 className="text-xs font-mono font-semibold text-slate-300">
          Awaiting Case Authorization
        </h4>
        <p className="text-[11px] text-slate-500 mt-1">
          Initiate an investigation to generate a recommended action and activate human approval.
        </p>
      </div>
    );
  }

  const {
    transaction_id,
    recommended_action = "FREEZE_ACCOUNT_AND_HOLD_TRANSACTION",
    risk_level = "HIGH",
    risk_score = 98,
    investigation_id,
    requires_approval = true
  } = investigation;

  // Workflow Stage Calculation: 5-Stage Human-in-the-Loop Gate
  // 1: AI Recommendation -> 2: Human Review Required -> 3: Approved / Rejected -> 4: Action Executed -> 5: Audit Recorded
  let currentStep = 2;
  if (actionStatus) {
    currentStep = 5;
  }

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await onApprove({
        investigationId: investigation_id,
        transactionId: transaction_id,
        action: recommended_action,
        approver: approverName,
        notes: operatorNotes || "Evidence chain confirmed by AML Risk Officer. Executing automated hold."
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
        reason: operatorNotes || "Transaction verified as authorized by customer. Dismissing hold."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestApproval = async () => {
    setIsSubmitting(true);
    try {
      if (onRequestApproval) {
        await onRequestApproval({
          investigationId: investigation_id,
          transactionId: transaction_id,
          action: recommended_action,
          approver: currentUser?.name || "Analyst",
          notes: operatorNotes || "Analyst completed topological analysis; escalation to reviewer."
        });
      }
      setRequestSent(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <FileCheck2 className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-mono uppercase font-bold tracking-wider text-slate-100">
            Human-in-the-Loop Security Gate
          </h3>
        </div>
        <span
          className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
            actionStatus
              ? actionStatus.decision === "APPROVED"
                ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                : "bg-red-950 text-red-300 border border-red-800"
              : requestSent
              ? "bg-purple-950 text-purple-300 border border-purple-800"
              : "bg-amber-950 text-amber-300 border border-amber-800 animate-pulse"
          }`}
        >
          {actionStatus
            ? `${actionStatus.decision} — Recorded`
            : requestSent
            ? "Escalated to Reviewer"
            : "Human Review Required"}
        </span>
      </div>

      {/* 5-Stage Human-in-the-Loop Stepper */}
      <div className="grid grid-cols-5 gap-1.5 py-1">
        {[
          { step: 1, label: "AI Recommendation" },
          { step: 2, label: requestSent ? "Review Requested" : "Review Required" },
          { step: 3, label: actionStatus?.decision ? actionStatus.decision : "Approved / Rejected" },
          { step: 4, label: "Simulated Action" },
          { step: 5, label: "Audit Recorded" }
        ].map((s) => {
          const isDone = currentStep >= s.step;
          return (
            <div
              key={s.step}
              className={`p-1.5 rounded-lg border text-center transition ${
                isDone
                  ? "bg-slate-900 border-cyan-800/80 text-cyan-300"
                  : "bg-slate-950/60 border-slate-800 text-slate-500"
              }`}
            >
              <div className="text-[9px] font-mono font-bold">
                0{s.step}
              </div>
              <div className="text-[10px] font-medium truncate mt-0.5" title={s.label}>
                {s.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recommended Action Card Details */}
      <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold">
            Recommended Action
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold">
            Simulated Enforcement Action
          </span>
        </div>

        <div className="text-sm font-mono font-black text-rose-400">
          {recommended_action.replace(/_/g, " ")}
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] border-t border-slate-800/80">
          <div>
            <span className="text-slate-500 font-mono">Target: </span>
            <span className="text-slate-200 font-mono font-semibold">{transaction_id}</span>
          </div>
          <div>
            <span className="text-slate-500 font-mono">Assessed Risk: </span>
            <span className="text-rose-400 font-mono font-semibold">{risk_level} ({risk_score}/100)</span>
          </div>
        </div>
      </div>

      {/* Execution Outcome */}
      {actionStatus ? (
        <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/60 text-xs space-y-1.5">
          <div className="font-semibold text-emerald-400 flex items-center gap-1.5 text-xs">
            <CheckCircle className="w-4 h-4" />
            Approved action executed through the simulated enforcement layer and recorded in the audit trail.
          </div>
          <p className="text-slate-300">{actionStatus.message}</p>
          <div className="text-[10px] font-mono text-slate-400 pt-1 flex items-center justify-between border-t border-emerald-900/50">
            <span>Audit Ref: <strong className="text-cyan-300">{actionStatus.audit_id}</strong></span>
            <span>Recorded: {actionStatus.timestamp?.replace("T", " ").substring(0, 19)}</span>
          </div>
        </div>
      ) : (
        /* Role-Aware Controls */
        <div className="space-y-3 pt-1">
          {/* Notes Input */}
          <div>
            <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
              Compliance Justification Notes
            </label>
            <input
              type="text"
              placeholder="Verification notes or syndicate confirmation..."
              value={operatorNotes}
              onChange={(e) => setOperatorNotes(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Condition A: Reviewer or Admin (Can Approve/Reject) */}
          {canApprove && (
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleApprove}
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs transition shadow-lg hover:shadow-emerald-900/30 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                <span>Approve Action</span>
              </button>

              <button
                onClick={handleReject}
                disabled={isSubmitting}
                className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-rose-300 border border-slate-700 font-semibold text-xs transition disabled:opacity-50 cursor-pointer"
              >
                <XCircle className="w-4 h-4 text-rose-400" />
                <span>Reject</span>
              </button>
            </div>
          )}

          {/* Condition B: Analyst (Cannot Approve -> Can Request Approval) */}
          {isAnalyst && (
            <div className="space-y-2 pt-1">
              <div className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-800/50 text-[11px] text-cyan-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Analyst Role: Final approval execution requires Reviewer or Admin authorization.</span>
              </div>
              <button
                onClick={handleRequestApproval}
                disabled={isSubmitting || requestSent}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs transition shadow-md hover:shadow-cyan-900/30 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>{requestSent ? "Approval Escalation Submitted" : "Request Reviewer Approval"}</span>
              </button>
            </div>
          )}

          {/* Condition C: Viewer (Read-Only) */}
          {isViewer && (
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>Read-Only Compliance Observer: Action authorization is disabled for your role.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
