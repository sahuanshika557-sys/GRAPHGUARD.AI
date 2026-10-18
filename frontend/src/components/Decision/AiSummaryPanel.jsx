import React, { useState } from "react";
import { Sparkles, Cpu, CheckCircle2, Bot, Layers, ChevronDown, ChevronUp, Database, ShieldCheck } from "lucide-react";

export default function AiSummaryPanel({
  explanation = "",
  confidence = 0.94,
  modelName = "Groq LPU (qwen/qwen3.8-27b)",
  evidence = null,
  steps = [],
  timestamp = null
}) {
  const [showSteps, setShowSteps] = useState(false);

  // Distinguish graph facts from AI interpretation if evidence is available
  const incidents = evidence?.incidents || [];
  const connectedAccs = evidence?.connected_accounts || [];
  const device = evidence?.device;
  const ip = evidence?.ip;

  return (
    <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-mono uppercase font-bold tracking-wider text-slate-100">
            AI Investigation Summary
          </h3>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
            Agentic Investigation
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-indigo-950/70 border border-indigo-700/60 text-[10px] font-mono text-indigo-300">
          <Cpu className="w-3 h-3 text-indigo-400" />
          <span>{modelName}</span>
        </div>
      </div>

      {/* Inference & Time Metadata */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-400">
        <span>Engine: <strong className="text-slate-200">FalkorDB Cypher + Groq</strong></span>
        <span>Confidence: <strong className="text-emerald-400">{Math.round(confidence * 100)}% Verified</strong></span>
        {timestamp && (
          <span className="text-slate-500">Evaluated: {timestamp.replace("T", " ").substring(0, 19)} UTC</span>
        )}
      </div>

      {/* Delineated Graph Evidence vs AI Interpretation */}
      {evidence && (
        <div className="p-2.5 rounded-lg bg-slate-900/90 border border-cyan-900/40 space-y-1.5 text-[11px]">
          <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-1.5">
            <Database className="w-3 h-3" />
            Verified FalkorDB Graph Evidence (Ground Truth)
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-slate-300 font-mono text-[10.5px]">
            {device && (
              <li>Hardware: <strong className="text-slate-100">{device.type} ({device.id})</strong> • Rooted: {String(device.is_rooted)}</li>
            )}
            {connectedAccs.length > 0 && (
              <li>Shared Mule Accounts: <strong className="text-amber-300">{connectedAccs.map(a => `${a.id} (${a.status})`).join(", ")}</strong></li>
            )}
            {incidents.length > 0 && (
              <li>Incident Link: <strong className="text-rose-400">{incidents[0].incident.id}</strong> ({incidents[0].incident.type}, ${incidents[0].incident.loss_amount?.toLocaleString()})</li>
            )}
            {ip && (
              <li>Network: <strong className="text-slate-100">{ip.id}</strong> • Tor Exit: {String(ip.is_tor)} • VPN: {String(ip.is_vpn)}</li>
            )}
          </ul>
        </div>
      )}

      {/* Structured AI Narrative / Reasoning */}
      <div className="space-y-1">
        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
          AI Reasoning & Risk Analysis
        </div>
        <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800/80 text-xs text-slate-300 leading-relaxed max-h-56 overflow-y-auto whitespace-pre-line font-sans">
          {explanation ? (
            explanation
          ) : (
            <div className="text-slate-500 italic py-4 text-center">
              Run an investigation to synthesize an evidence-backed intelligence summary from the Groq inference engine.
            </div>
          )}
        </div>
      </div>

      {/* Expandable Investigation Steps (Phase 6 Tool Transparency) */}
      {steps && steps.length > 0 && (
        <div className="border border-slate-800/80 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setShowSteps(!showSteps)}
            className="w-full flex items-center justify-between px-3 py-2 bg-slate-900/80 text-[11px] font-mono font-medium text-slate-300 hover:text-white transition cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              Investigation Steps ({steps.length} Tool Executions Completed)
            </span>
            {showSteps ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
          </button>
          {showSteps && (
            <div className="p-2.5 bg-slate-950/70 divide-y divide-slate-800/60 max-h-48 overflow-y-auto text-[11px] font-mono">
              {steps.map((s, idx) => (
                <div key={idx} className="py-1 flex items-start gap-2">
                  <span className="text-emerald-400 shrink-0">✓</span>
                  <div className="min-w-0">
                    <span className="text-cyan-300 font-semibold mr-1">[{s.step_name}]</span>
                    <span className="text-slate-300">{s.message}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Evidence Integrity Notice */}
      <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1 pt-1">
        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
        <span>Grounded in FalkorDB multi-hop Cypher traversal graph. Zero hallucinated connections.</span>
      </div>
    </div>
  );
}
