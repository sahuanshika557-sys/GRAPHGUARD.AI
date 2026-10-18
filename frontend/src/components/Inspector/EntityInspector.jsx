import React from "react";
import {
  X,
  Share2,
  AlertOctagon,
  ShieldAlert,
  ShieldCheck,
  CreditCard,
  Laptop,
  Flame,
  Globe,
  MapPin,
  User,
  ArrowRightLeft,
  Link
} from "lucide-react";

export default function EntityInspector({ entity, subgraph, onClose }) {
  if (!entity) return null;

  const isIncident = entity.label === "Incident";
  const isSuspicious =
    isIncident ||
    entity.status?.includes("FROZEN") ||
    entity.status?.includes("COMPROMISED") ||
    entity.is_rooted ||
    entity.is_tor ||
    entity.proxy_detected;

  // Dynamically find connected edges and neighbor nodes in active subgraph
  const connectedNeighbors = [];
  if (subgraph && subgraph.edges) {
    subgraph.edges.forEach((edge) => {
      if (edge.from === entity.id) {
        connectedNeighbors.push({
          rel: edge.type,
          targetId: edge.to,
          direction: "OUTGOING"
        });
      } else if (edge.to === entity.id) {
        connectedNeighbors.push({
          rel: edge.type,
          targetId: edge.from,
          direction: "INCOMING"
        });
      }
    });
  }

  return (
    <div className="glass-panel-elevated rounded-xl p-4 w-84 text-xs border border-slate-700/80 shadow-2xl backdrop-blur-2xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
              isSuspicious
                ? "bg-red-950 text-red-300 border border-red-800"
                : "bg-cyan-950 text-cyan-300 border border-cyan-800"
            }`}
          >
            {entity.label || "Entity"}
          </span>
          <span className="font-mono font-black text-slate-100 text-sm">
            {entity.id}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Suspicious Warning Indicator */}
      {isSuspicious && (
        <div className="mt-3 p-2.5 rounded-lg bg-red-950/70 border border-red-800/80 flex items-start gap-2">
          <AlertOctagon className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="text-[11px] text-red-200 leading-tight">
            High-Risk Entity Flagged in Graph Traversal. Linked to AML risk indicators.
          </div>
        </div>
      )}

      {/* Dynamic Properties Table */}
      <div className="mt-3 space-y-1.5 max-h-52 overflow-y-auto pr-1">
        <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider font-semibold">
          Properties
        </div>
        {Object.entries(entity).map(([key, value]) => {
          if (["id", "label", "isReasoningPath"].includes(key)) return null;
          return (
            <div
              key={key}
              className="flex items-center justify-between py-1 px-2 rounded bg-slate-900/60 border border-slate-800/80"
            >
              <span className="text-slate-400 font-mono text-[11px] truncate max-w-[100px]">
                {key}
              </span>
              <span className="text-slate-200 font-medium text-[11px] truncate max-w-[150px] text-right">
                {typeof value === "boolean"
                  ? value ? "TRUE" : "FALSE"
                  : typeof value === "number" && (key.includes("amount") || key.includes("balance"))
                  ? `$${value.toLocaleString()}`
                  : String(value)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Connected Entities in Subgraph */}
      {connectedNeighbors.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-slate-800">
          <div className="text-[10px] font-mono uppercase text-slate-400 mb-1.5 flex items-center gap-1 font-semibold">
            <Link className="w-3 h-3 text-cyan-400" />
            Connected Entities ({connectedNeighbors.length})
          </div>
          <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
            {connectedNeighbors.map((conn, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-1 px-2 rounded bg-slate-900/50 border border-slate-800 text-[10px] font-mono"
              >
                <span className="text-cyan-300 font-semibold">{conn.targetId}</span>
                <span className="text-slate-400">
                  {conn.direction === "OUTGOING" ? "→" : "←"} {conn.rel}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
