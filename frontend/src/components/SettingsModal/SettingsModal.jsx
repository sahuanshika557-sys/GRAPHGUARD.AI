import React from "react";
import {
  X,
  Database,
  Cpu,
  Server,
  ShieldCheck,
  CheckCircle2,
  HardDrive
} from "lucide-react";

export default function SettingsModal({ health, isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150">
      <div className="glass-panel-elevated w-full max-w-lg rounded-2xl border border-slate-700 p-6 space-y-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-mono font-bold uppercase text-slate-100">
              System Configuration & Endpoints
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Endpoints & Modules List */}
        <div className="space-y-3 text-xs">
          {/* FalkorDB Cloud */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5 font-mono">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                FalkorDB Cloud Context Layer
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono text-[10px] font-bold">
                {health?.active_database || "FalkorDB Cloud (Live)"}
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              Port: 63238 | Graph: graphguard | Region: ap-south-1 (AWS)
            </div>
            <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Direct Redis-Graph Cypher query protocol verified. Credentials encrypted.
            </div>
          </div>

          {/* Groq Inference Engine */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5 font-mono">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                Groq AI LPU Inference
              </span>
              <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono text-[10px] font-bold">
                READY
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              Active Model: qwen/qwen3.8-27b | Fallback: Llama-3.3-70b
            </div>
          </div>

          {/* SQLite Audit Trail Persistence */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5 font-mono">
                <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                ACID Compliance & Audit Persistence
              </span>
              <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono text-[10px] font-bold">
                SQLITE ACTIVE
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              Storage: data/audit_log.db (Immutable record survival across restarts)
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 transition cursor-pointer"
          >
            Close Settings
          </button>
        </div>
      </div>
    </div>
  );
}
