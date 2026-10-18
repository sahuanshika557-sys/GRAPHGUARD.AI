import React, { useState } from "react";
import {
  Search,
  Sparkles,
  ArrowRightLeft,
  DollarSign,
  Building,
  Clock,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Send,
  CheckCircle2,
  FileDown,
  FileText
} from "lucide-react";

export default function InvestigationHeader({
  selectedTx,
  transactions = [],
  queryInput,
  setQueryInput,
  onSearch,
  onSelectTx,
  isInvestigating,
  riskScore,
  riskLevel,
  onExportPdf,
  onExportJson
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const rawTx = selectedTx?.transaction || selectedTx;
  const rawAcc = selectedTx?.account || rawTx?.account;
  const txData = rawTx && rawTx.id ? {
    id: rawTx.id,
    amount: rawTx.amount !== undefined ? rawTx.amount : (rawTx.id === "TX-104" ? 85000.0 : 0.0),
    currency: rawTx.currency || "USD",
    channel: rawTx.channel || "WIRE_TRANSFER",
    merchant: rawTx.merchant || "Direct Beneficiary Escrow",
    timestamp: rawTx.timestamp || "2026-10-17T02:45:00Z",
    status: rawTx.status || "PENDING_VERIFICATION",
    anomaly_flag: rawTx.anomaly_flag || "",
    account: rawAcc
  } : {
    id: "TX-104",
    amount: 85000.0,
    currency: "USD",
    channel: "WIRE_TRANSFER",
    merchant: "Swift Wire Escrow Express Corp",
    timestamp: "2026-10-17T02:45:00Z",
    status: "PENDING_VERIFICATION",
    anomaly_flag: "RAPID_HIGH_VALUE_WIRE_OFF_HOURS",
    account: { id: "A501", type: "CHECKING" }
  };

  const isHigh = riskLevel === "HIGH" || (riskScore && riskScore >= 75);
  const isMed = riskLevel === "MEDIUM";

  const handleQuickSelect = (txId) => {
    const q = `Investigate ${txId}`;
    setQueryInput(q);
    onSelectTx(txId);
  };

  return (
    <div className="space-y-3">
      {/* Search & Investigation Bar */}
      <div className="glass-panel p-3 rounded-xl border border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSearch(queryInput);
          }}
          className="flex flex-col sm:flex-row items-center gap-2.5"
        >
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-3 text-cyan-400" />
            <input
              type="text"
              placeholder="Search transaction ID, account, device... (e.g., 'Investigate TX-104')"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-900/90 border border-slate-700/80 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          {/* Quick Transaction Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {["TX-104", "TX-101", "TX-102", "TX-103", "TX-105"].map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => handleQuickSelect(id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition cursor-pointer border ${
                  txData.id === id
                    ? "bg-cyan-950 text-cyan-300 border-cyan-700 shadow-sm"
                    : "bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                {id}
              </button>
            ))}

            <button
              type="submit"
              disabled={isInvestigating}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs transition shadow-md hover:shadow-cyan-900/30 disabled:opacity-50 cursor-pointer shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isInvestigating ? "Analyzing..." : "Investigate"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Large Transaction Summary Card */}
      <div className="p-4 rounded-xl card-command border border-slate-800/90 shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Left: Transaction ID & Core Details */}
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-slate-900/90 border border-slate-700 flex items-center justify-center text-cyan-400 shrink-0">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                  Target Transaction
                </span>
                <span className="text-sm font-mono font-bold text-slate-100 bg-slate-800/90 px-2 py-0.5 rounded border border-slate-700">
                  {txData.id}
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {txData.channel || "WIRE_TRANSFER"}
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black font-mono text-slate-100 tracking-tight">
                  ${Number(txData.amount || 0).toLocaleString()}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {txData.currency || "USD"}
                </span>
                <span className="text-slate-500 mx-1">•</span>
                <span className="text-xs text-slate-300 font-medium truncate max-w-xs flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {txData.merchant || "Direct Beneficiary Escrow"}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Risk Badge & Status Attributes */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-start md:justify-end">
            {/* Timestamp */}
            {txData.timestamp && (
              <div className="text-left md:text-right">
                <div className="text-[10px] font-mono uppercase text-slate-400 flex items-center md:justify-end gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  Initiated At
                </div>
                <div className="text-xs font-mono text-slate-200">
                  {txData.timestamp.replace("T", " ").substring(0, 19)} UTC
                </div>
              </div>
            )}

            {/* Investigation Status Pill */}
            <div className="text-left md:text-right">
              <div className="text-[10px] font-mono uppercase text-slate-400">
                Workflow Status
              </div>
              <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-slate-800 text-cyan-300 border border-slate-700">
                {txData.status || "PENDING_VERIFICATION"}
              </span>
            </div>

            {/* Prominent Risk Level Badge */}
            <div
              className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 ${
                isHigh
                  ? "bg-red-950/80 border-red-700/80 text-red-200"
                  : isMed
                  ? "bg-amber-950/80 border-amber-700/80 text-amber-200"
                  : "bg-emerald-950/80 border-emerald-700/80 text-emerald-200"
              }`}
            >
              {isHigh ? (
                <ShieldAlert className="w-4 h-4 text-red-400" />
              ) : isMed ? (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              )}
              <div>
                <div className="text-[9px] font-mono uppercase font-bold tracking-wider opacity-80 leading-none">
                  Risk Level
                </div>
                <div className="text-xs font-mono font-bold leading-tight">
                  {riskLevel || (txData.id === "TX-104" ? "HIGH" : "LOW")}
                </div>
              </div>
            </div>

            {/* Export SAR Preparation Dossier Actions */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
              <button
                type="button"
                onClick={() => onExportPdf && onExportPdf(txData.id)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-cyan-300 border border-slate-700 text-xs font-mono font-medium transition cursor-pointer shadow-sm"
                title="Export Investigation Report / SAR Preparation (PDF)"
              >
                <FileDown className="w-3.5 h-3.5 text-cyan-400" />
                <span>SAR Report</span>
              </button>
              <button
                type="button"
                onClick={() => onExportJson && onExportJson(txData.id)}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs font-mono transition cursor-pointer"
                title="Export Investigation Docket (JSON)"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>JSON</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
