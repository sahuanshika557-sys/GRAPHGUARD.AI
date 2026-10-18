import React from "react";
import {
  ShieldAlert,
  Database,
  Server,
  Cpu,
  RotateCcw,
  Settings,
  User,
  LogOut,
  Users
} from "lucide-react";

export default function TopNavbar({
  health,
  onReseed,
  onOpenSettings,
  activeTxId,
  isInvestigating,
  currentUser,
  onLogout,
  onOpenUserManagement
}) {
  const isCloudConnected = health?.falkordb_connected;
  const role = currentUser?.role || "VIEWER";
  const email = currentUser?.email || "analyst@graphguard.ai";
  const name = currentUser?.name || "Investigator";

  const getRoleBadge = (r) => {
    switch (r) {
      case "ADMIN":
        return "bg-purple-950 text-purple-300 border-purple-800";
      case "REVIEWER":
        return "bg-emerald-950 text-emerald-300 border-emerald-800";
      case "ANALYST":
        return "bg-cyan-950 text-cyan-300 border-cyan-800";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  const getInitials = (n) => {
    if (!n) return "GG";
    const parts = n.split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return n.substring(0, 2).toUpperCase();
  };

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="w-full px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 p-0.5 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <div className="w-full h-full bg-[#080d18] rounded-[7px] flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black tracking-wide text-slate-100 font-mono">
                GRAPHGUARD<span className="text-cyan-400">.AI</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/90 text-slate-300 border border-slate-700">
                v2.4 Enterprise
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Fraud Investigation Intelligence Command Center
            </p>
          </div>
        </div>

        {/* Center/Right: Live System Indicators */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* Active Case Status */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-slate-900/90 border border-slate-800 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                isInvestigating
                  ? "bg-amber-400 animate-ping"
                  : "bg-emerald-400 animate-pulse"
              }`}
            />
            <span className="text-slate-400 font-mono text-[11px]">
              Status:
            </span>
            <span className="font-mono text-slate-200 text-[11px] font-semibold">
              {isInvestigating ? "Analyzing Network..." : `Active Case: ${activeTxId || "TX-104"}`}
            </span>
          </div>

          {/* FalkorDB Cloud Live Status */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono transition border ${
              isCloudConnected
                ? "bg-emerald-950/60 border-emerald-700/60 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                : "bg-amber-950/40 border-amber-800 text-amber-300"
            }`}
            title={health?.cloud_diagnostic || "FalkorDB Native Graph Engine"}
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold">FalkorDB Cloud</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold">
              {isCloudConnected ? "LIVE" : "OFFLINE"}
            </span>
          </div>

          {/* Backend Online Status */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/80 border border-slate-800 text-xs font-mono text-slate-300">
            <Server className="w-3.5 h-3.5 text-cyan-400" />
            <span>Backend</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[10px] text-emerald-400 font-semibold">ONLINE</span>
          </div>

          {/* Groq AI Ready Status */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/80 border border-slate-800 text-xs font-mono text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span>Groq AI</span>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            <span className="text-[10px] text-indigo-300 font-semibold">READY</span>
          </div>
        </div>

        {/* Right: User Profile, Role Badge, Logout */}
        <div className="flex items-center gap-2.5">
          {/* Admin User Management Button */}
          {role === "ADMIN" && (
            <button
              onClick={onOpenUserManagement}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-purple-950/70 hover:bg-purple-900/60 text-purple-300 border border-purple-800 text-xs font-mono transition cursor-pointer"
              title="Admin User Management"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Users</span>
            </button>
          )}

          {/* Reseed Button (Admin Only) */}
          {role === "ADMIN" && (
            <button
              onClick={onReseed}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 text-xs font-mono transition cursor-pointer"
              title="Reset and reseed graph database"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reseed</span>
            </button>
          )}

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/80 transition cursor-pointer"
            title="System Settings & Connection Info"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Current User Area */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white text-[10px] font-mono font-bold shadow-sm">
              {getInitials(name)}
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-200 truncate max-w-[130px]">
                  {email}
                </span>
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold border ${getRoleBadge(role)}`}
                >
                  {role}
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="p-1.5 rounded-md hover:bg-red-950/60 text-slate-400 hover:text-red-300 transition cursor-pointer border border-transparent hover:border-red-800 ml-1"
              title="Log out of GraphGuard AI"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
