import React, { useState } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Search,
  Download,
  Calendar,
  User,
  Activity,
  Lock,
  Loader2,
  Key
} from "lucide-react";
import { fetchAuditVerification } from "../../services/api";

export default function AuditTrailView({ records = [], onRefresh }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDecision, setFilterDecision] = useState("ALL");
  const [isVerifying, setIsVerifying] = useState(false);
  const [integrityReport, setIntegrityReport] = useState(null);

  const filtered = records.filter((r) => {
    const matchesSearch =
      r.entity_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.investigation_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.audit_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.event_hash?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDecision =
      filterDecision === "ALL" || r.human_decision === filterDecision;

    return matchesSearch && matchesDecision;
  });

  const handleVerifyIntegrity = async () => {
    setIsVerifying(true);
    try {
      const rep = await fetchAuditVerification();
      setIntegrityReport(rep);
    } catch (err) {
      setIntegrityReport({ valid: false, message: err.message || "Failed to verify integrity" });
    } finally {
      setIsVerifying(false);
    }
  };

  const exportJSON = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(records, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `graphguard_audit_trail_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col gap-4">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h3 className="font-semibold text-sm text-slate-100 tracking-wide">
              Tamper-Evident Persistent Audit Trail ({records.length} Records)
            </h3>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Cryptographically chained with SHA-256 hashes in SQLite. All actions recorded through the simulated enforcement layer.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Verify Integrity Button */}
          <button
            onClick={handleVerifyIntegrity}
            disabled={isVerifying}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800 text-xs font-mono font-medium transition cursor-pointer disabled:opacity-50"
            title="Verify SHA-256 hash chain integrity across all records"
          >
            {isVerifying ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span>Verify Audit Integrity</span>
          </button>

          {/* Search Input */}
          <div className="relative flex-1 sm:w-44">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search records or hash..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Decision Filter */}
          <select
            value={filterDecision}
            onChange={(e) => setFilterDecision(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Decisions</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>

          {/* Export Button */}
          <button
            onClick={exportJSON}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
            title="Export Audit Trail (JSON)"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Integrity Verification Result Banner */}
      {integrityReport && (
        <div
          className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs font-mono transition ${
            integrityReport.valid
              ? "bg-emerald-950/60 border-emerald-700 text-emerald-200"
              : "bg-red-950/60 border-red-700 text-red-200"
          }`}
        >
          {integrityReport.valid ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <div className="font-bold">
              {integrityReport.valid
                ? `Cryptographic Integrity Verified: SHA-256 Chain Intact (${integrityReport.total_records} Records)`
                : "Integrity Warning: Chain Alteration Detected"}
            </div>
            <div className="text-[11px] opacity-80 mt-0.5">
              {integrityReport.message}
            </div>
            {integrityReport.last_verified_hash && (
              <div className="text-[10px] text-emerald-300 mt-1 opacity-70 truncate max-w-xl">
                Head Hash: {integrityReport.last_verified_hash}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Audit Log Table */}
      <div className="overflow-x-auto max-h-[380px]">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No audit records match the current criteria. Run an investigation and authorize an action to record an event.
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] font-mono uppercase text-slate-400">
                <th className="py-2 px-3">Audit ID</th>
                <th className="py-2 px-3">Timestamp</th>
                <th className="py-2 px-3">Target Entity</th>
                <th className="py-2 px-3">Action</th>
                <th className="py-2 px-3">Human Decision</th>
                <th className="py-2 px-3">Operator</th>
                <th className="py-2 px-3">Execution Outcome</th>
                <th className="py-2 px-3">SHA-256 Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((record) => (
                <tr
                  key={record.audit_id}
                  className="hover:bg-slate-900/40 transition"
                >
                  <td className="py-2.5 px-3 font-mono text-cyan-300 font-semibold">
                    {record.audit_id}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">
                    {record.timestamp ? record.timestamp.replace("T", " ").substring(0, 19) : ""}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-200">
                    {record.entity_id}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                      {record.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                        record.human_decision === "APPROVED"
                          ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800"
                          : "bg-red-950/80 text-red-300 border border-red-800"
                      }`}
                    >
                      {record.human_decision === "APPROVED" ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <XCircle className="w-3 h-3 text-red-400" />
                      )}
                      {record.human_decision}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300 text-[11px]">
                    {record.operator || "Compliance Analyst"}
                  </td>
                  <td className="py-2.5 px-3 text-slate-300 text-[11px] max-w-xs truncate" title={record.execution_result}>
                    {record.execution_result}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[10px] text-slate-500">
                    <span
                      title={`SHA-256 Event Hash: ${record.event_hash || 'Legacy'}\nPrevious Hash: ${record.previous_hash || 'Genesis'}`}
                      className="cursor-help text-cyan-400/80 hover:text-cyan-300"
                    >
                      {record.event_hash ? record.event_hash.substring(0, 10) + "..." : "Genesis"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
