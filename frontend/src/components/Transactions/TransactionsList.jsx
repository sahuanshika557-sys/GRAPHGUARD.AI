import React from "react";
import {
  ArrowRightLeft,
  Building,
  Clock,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Search
} from "lucide-react";

export default function TransactionsList({
  transactions = [],
  onSelectTx,
  activeTxId
}) {
  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-cyan-400" />
            Financial Transactions Catalog
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Select any transaction entity to inspect graph connections and initiate autonomous agent investigation.
          </p>
        </div>
        <div className="text-xs font-mono text-slate-400">
          Total: <strong className="text-slate-100">{transactions.length}</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {transactions.map((tx) => {
          const isSelected = tx.id === activeTxId;
          const isHigh = tx.risk_baseline === "HIGH" || tx.id === "TX-104";
          const isMed = tx.risk_baseline === "MEDIUM" || tx.id === "TX-105";

          return (
            <div
              key={tx.id}
              onClick={() => onSelectTx(tx.id)}
              className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? "bg-slate-900 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                  : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-bold text-sm text-slate-100">
                    {tx.id}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      isHigh
                        ? "bg-red-950 text-red-300 border border-red-800"
                        : isMed
                        ? "bg-amber-950 text-amber-300 border border-amber-800"
                        : "bg-emerald-950 text-emerald-300 border border-emerald-800"
                    }`}
                  >
                    {isHigh ? "HIGH RISK" : isMed ? "REVIEW" : "CLEAN"}
                  </span>
                </div>

                <div className="flex items-baseline gap-1.5 mb-1.5">
                  <span className="text-xl font-black font-mono text-slate-100">
                    ${Number(tx.amount || 0).toLocaleString()}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {tx.currency || "USD"}
                  </span>
                </div>

                <div className="text-xs text-slate-300 flex items-center gap-1.5 mb-2 truncate">
                  <Building className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">{tx.merchant}</span>
                </div>

                <div className="text-[11px] font-mono text-slate-400">
                  Channel: <span className="text-slate-200">{tx.channel}</span>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-500">
                  {tx.timestamp ? tx.timestamp.substring(0, 10) : "2026-10-17"}
                </span>
                <button
                  type="button"
                  className="flex items-center gap-1 text-xs font-mono text-cyan-400 hover:text-cyan-300"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Investigate</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
