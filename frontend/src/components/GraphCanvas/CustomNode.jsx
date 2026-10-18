import React, { memo } from "react";
import { Handle, Position } from "reactflow";
import {
  ArrowRightLeft,
  CreditCard,
  User,
  Laptop,
  Globe,
  MapPin,
  AlertTriangle,
  Flame,
  ShieldAlert,
  Smartphone
} from "lucide-react";

const NODE_THEME = {
  Transaction: {
    icon: ArrowRightLeft,
    bg: "rgba(30, 41, 59, 0.85)",
    border: "#f43f5e",
    accent: "text-rose-400",
    badgeBg: "bg-rose-950/80 text-rose-300 border-rose-800"
  },
  Account: {
    icon: CreditCard,
    bg: "rgba(15, 23, 42, 0.85)",
    border: "#38bdf8",
    accent: "text-sky-400",
    badgeBg: "bg-sky-950/80 text-sky-300 border-sky-800"
  },
  Device: {
    icon: Laptop,
    bg: "rgba(23, 23, 37, 0.85)",
    border: "#fbbf24",
    accent: "text-amber-400",
    badgeBg: "bg-amber-950/80 text-amber-300 border-amber-800"
  },
  Incident: {
    icon: Flame,
    bg: "rgba(30, 15, 15, 0.9)",
    border: "#ef4444",
    accent: "text-red-400",
    badgeBg: "bg-red-950 text-red-200 border-red-700"
  },
  Customer: {
    icon: User,
    bg: "rgba(20, 20, 35, 0.85)",
    border: "#a855f7",
    accent: "text-purple-400",
    badgeBg: "bg-purple-950/80 text-purple-300 border-purple-800"
  },
  IP: {
    icon: Globe,
    bg: "rgba(15, 25, 35, 0.85)",
    border: "#2dd4bf",
    accent: "text-teal-400",
    badgeBg: "bg-teal-950/80 text-teal-300 border-teal-800"
  },
  Location: {
    icon: MapPin,
    bg: "rgba(15, 30, 25, 0.85)",
    border: "#34d399",
    accent: "text-emerald-400",
    badgeBg: "bg-emerald-950/80 text-emerald-300 border-emerald-800"
  }
};

const CustomNode = ({ data, selected }) => {
  const label = data.label || "Entity";
  const theme = NODE_THEME[label] || NODE_THEME.Account;
  const Icon = theme.icon;
  const isPath = Boolean(data.isReasoningPath);

  return (
    <div
      className={`relative px-3 py-2.5 rounded-xl transition-all duration-200 min-w-[150px] max-w-[210px] select-none cursor-pointer ${
        isPath
          ? "border-2 border-red-500 shadow-[0_0_18px_rgba(239,68,68,0.55)]"
          : selected
          ? "border-2 border-cyan-400 shadow-[0_0_14px_rgba(56,189,248,0.4)]"
          : "border border-slate-700/80 hover:border-slate-500 shadow-md"
      }`}
      style={{
        backgroundColor: theme.bg,
        backdropFilter: "blur(14px)"
      }}
    >
      {/* Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-2.5 h-2.5 bg-slate-400 border border-slate-900"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2.5 h-2.5 bg-slate-400 border border-slate-900"
      />

      {/* Top Header: Entity Label + Path Indicator */}
      <div className="flex items-center justify-between gap-1 mb-1.5">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <div className="p-1 rounded bg-slate-900/90 border border-slate-800">
            <Icon className={`w-3.5 h-3.5 ${theme.accent}`} />
          </div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold truncate">
            {label}
          </span>
        </div>

        {isPath && (
          <span className="flex items-center gap-1 px-1.5 py-0.2 rounded bg-red-950 text-red-300 border border-red-800 text-[8px] font-mono font-bold tracking-tight">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
            SYNDICATE
          </span>
        )}
      </div>

      {/* Node ID */}
      <div className="font-mono font-bold text-xs text-slate-100 truncate tracking-wide">
        {data.id}
      </div>

      {/* Dynamic Key Information */}
      <div className="text-[11px] text-slate-300 truncate mt-1">
        {data.amount !== undefined && (
          <div className="font-mono font-bold text-rose-300 text-xs">
            ${Number(data.amount).toLocaleString()}
          </div>
        )}
        {data.loss_amount !== undefined && (
          <div className="font-mono font-bold text-red-400 text-xs">
            Loss: ${Number(data.loss_amount).toLocaleString()}
          </div>
        )}
        {data.name && <div className="text-slate-300 truncate">{data.name}</div>}
        {data.type && !data.name && data.amount === undefined && (
          <div className="text-slate-400 text-[10px] truncate">{data.type}</div>
        )}
        {data.ip_address && (
          <div className="font-mono text-cyan-300 text-[10px]">{data.ip_address}</div>
        )}
        {data.city && (
          <div className="text-emerald-300 text-[10px]">{data.city}, {data.country}</div>
        )}
      </div>

      {/* Flag / Status Badge */}
      {(data.status || data.is_rooted !== undefined || data.incident_type) && (
        <div className="mt-1.5 pt-1 border-t border-slate-800/80 flex items-center justify-between text-[9px] font-mono">
          {data.status && (
            <span
              className={`px-1.5 py-0.2 rounded ${
                data.status.includes("FROZEN") || data.status.includes("COMPROMISED")
                  ? "bg-red-950 text-red-300 border border-red-800"
                  : data.status.includes("ACTIVE")
                  ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                  : "bg-slate-800 text-slate-300 border border-slate-700"
              }`}
            >
              {data.status}
            </span>
          )}
          {data.is_rooted && (
            <span className="px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold">
              ROOTED
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default memo(CustomNode);
