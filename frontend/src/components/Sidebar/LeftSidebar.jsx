import React from "react";
import {
  LayoutDashboard,
  SearchCode,
  ArrowRightLeft,
  Share2,
  ShieldAlert,
  ClipboardList,
  Database,
  Server,
  Radio,
  CheckCircle2,
  HardDrive,
  Users
} from "lucide-react";

export default function LeftSidebar({
  activeSection,
  onSelectSection,
  health,
  auditCount = 0,
  currentUser
}) {
  const isCloudConnected = health?.falkordb_connected;
  const role = currentUser?.role || "VIEWER";
  const isAdmin = role === "ADMIN";

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "investigations", label: "Investigations", icon: SearchCode, badge: "ACTIVE" },
    { id: "transactions", label: "Transactions", icon: ArrowRightLeft },
    { id: "fraud_network", label: "Fraud Network", icon: Share2 },
    { id: "risk_analysis", label: "Risk Analysis", icon: ShieldAlert },
  ];

  // Role-Aware Navigation: Audit Trail for ADMIN and REVIEWER (and VIEWER audit review)
  if (role === "ADMIN" || role === "REVIEWER" || role === "VIEWER") {
    navItems.push({ id: "audit_trail", label: "Audit Trail", icon: ClipboardList });
  }

  // ADMIN: User Accounts management
  if (isAdmin) {
    navItems.push({ id: "user_management", label: "User Accounts", icon: Users, badge: "ADMIN" });
  }

  return (
    <aside className="w-56 bg-slate-950/70 border-r border-slate-800/80 flex flex-col justify-between p-3 shrink-0 h-[calc(100vh-53px)] sticky top-[53px]">
      {/* Navigation Links */}
      <div className="space-y-1">
        <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold flex items-center justify-between">
          <span>Command Menu</span>
          <span className="text-[9px] text-slate-600 font-mono">{role}</span>
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectSection(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                isActive
                  ? "bg-slate-800/90 text-cyan-400 font-semibold border border-cyan-800/50 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? "text-cyan-400" : "text-slate-500"
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                    item.badge === "ADMIN"
                      ? "bg-purple-950 text-purple-300 border-purple-800"
                      : "bg-cyan-950 text-cyan-300 border-cyan-800"
                  }`}
                >
                  {item.badge}
                </span>
              )}
              {item.id === "audit_trail" && auditCount > 0 && (
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  {auditCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom System Status Box */}
      <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2.5">
        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
          <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
          System Health
        </div>

        {/* FalkorDB Status */}
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Database className="w-3 h-3 text-slate-500" />
            FalkorDB
          </span>
          <span
            className={`font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded ${
              isCloudConnected
                ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                : "bg-amber-950 text-amber-300 border border-amber-800"
            }`}
          >
            {isCloudConnected ? "Cloud Live" : "Local Mode"}
          </span>
        </div>

        {/* API Status */}
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Server className="w-3 h-3 text-slate-500" />
            API Core
          </span>
          <span className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
            200 OK
          </span>
        </div>

        {/* Graph Entities */}
        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/80">
          <span className="text-slate-500">Connected Graph</span>
          <span className="font-mono text-slate-300 text-[10px]">
            {health?.node_count || 28} nodes • {health?.edge_count || 35} rels
          </span>
        </div>
      </div>
    </aside>
  );
}
