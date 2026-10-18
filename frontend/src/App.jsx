import React, { useState, useEffect } from "react";
import TopNavbar from "./components/Navigation/TopNavbar";
import LeftSidebar from "./components/Sidebar/LeftSidebar";
import InvestigationHeader from "./components/Investigation/InvestigationHeader";
import GraphCanvas from "./components/GraphCanvas/GraphCanvas";
import EntityInspector from "./components/Inspector/EntityInspector";
import RiskScoreGauge from "./components/Decision/RiskScoreGauge";
import KeyFindings from "./components/Investigation/KeyFindings";
import AiSummaryPanel from "./components/Decision/AiSummaryPanel";
import HumanApprovalWorkflow from "./components/Decision/HumanApprovalWorkflow";
import InvestigationTimeline from "./components/Timeline/InvestigationTimeline";
import AuditTrailView from "./components/Audit/AuditTrailView";
import TransactionsList from "./components/Transactions/TransactionsList";
import SettingsModal from "./components/SettingsModal/SettingsModal";
import UserManagementModal from "./components/Admin/UserManagementModal";
import LoginPage from "./components/Auth/LoginPage";
import {
  fetchHealth,
  fetchTransactions,
  fetchTransaction,
  fetchSubgraph,
  streamInvestigation,
  approveAction,
  rejectAction,
  requestActionApproval,
  fetchAuditTrail,
  reseedGraph,
  fetchCurrentUser,
  logoutUser,
  downloadInvestigationReportPdf,
  fetchInvestigationReport
} from "./services/api";
import { AlertCircle, RotateCcw, Share2, ShieldAlert, Loader2 } from "lucide-react";

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Navigation & System Health State
  const [activeSection, setActiveSection] = useState("investigations");
  const [health, setHealth] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [auditRecords, setAuditRecords] = useState([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUserMgmtOpen, setIsUserMgmtOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Active Transaction & Investigation State
  const [selectedTxId, setSelectedTxId] = useState("TX-104");
  const [selectedTxData, setSelectedTxData] = useState(null);
  const [queryInput, setQueryInput] = useState("Investigate TX-104");
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [investigationResult, setInvestigationResult] = useState(null);
  const [streamSteps, setStreamSteps] = useState([]);
  const [actionStatus, setActionStatus] = useState(null);

  // Graph Canvas & Inspector State
  const [subgraph, setSubgraph] = useState({ nodes: [], edges: [] });
  const [reasoningPath, setReasoningPath] = useState([]);
  const [selectedEntity, setSelectedEntity] = useState(null);

  // Initial Authentication Check
  useEffect(() => {
    checkAuthSession();
  }, []);

  const checkAuthSession = async () => {
    setIsAuthChecking(true);
    try {
      const user = await fetchCurrentUser();
      if (user) {
        setCurrentUser(user);
        await initApplicationData();
      }
    } catch (err) {
      console.warn("No active session:", err);
    } finally {
      setIsAuthChecking(false);
    }
  };

  const handleLoginSuccess = async (user) => {
    setCurrentUser(user);
    setErrorMessage(null);
    await initApplicationData();
  };

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    setInvestigationResult(null);
    setStreamSteps([]);
    setActionStatus(null);
  };

  const initApplicationData = async () => {
    await Promise.allSettled([
      loadHealth(),
      loadTransactions(),
      loadAuditTrail(),
      loadTargetTransaction("TX-104"),
      loadInitialGraph("TX-104")
    ]);
  };

  const loadHealth = async () => {
    try {
      const data = await fetchHealth();
      setHealth(data);
    } catch (err) {
      console.error("Health check error:", err);
    }
  };

  const loadTransactions = async () => {
    try {
      const data = await fetchTransactions();
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error("Failed to load transactions", err);
    }
  };

  const loadTargetTransaction = async (txId) => {
    try {
      const tx = await fetchTransaction(txId);
      setSelectedTxData(tx);
    } catch (err) {
      console.warn("Could not fetch target transaction details", err);
    }
  };

  const loadAuditTrail = async () => {
    try {
      const records = await fetchAuditTrail();
      setAuditRecords(records || []);
    } catch (err) {
      console.error("Failed to load audit trail", err);
    }
  };

  const loadInitialGraph = async (rootId) => {
    try {
      const graphData = await fetchSubgraph(rootId, 3);
      setSubgraph(graphData);
    } catch (err) {
      console.error("Failed to load initial subgraph", err);
    }
  };

  const handleReseed = async () => {
    try {
      await reseedGraph();
      await loadHealth();
      await loadTransactions();
      await loadInitialGraph(selectedTxId || "TX-104");
      setErrorMessage(null);
    } catch (err) {
      setErrorMessage("Failed to reseed database: " + err.message);
    }
  };

  const handleSelectTransaction = (txId) => {
    setSelectedTxId(txId);
    setQueryInput(`Investigate ${txId}`);
    loadTargetTransaction(txId);
    loadInitialGraph(txId);
    handleStartInvestigation(`Investigate ${txId}`, txId);
  };

  // Autonomous Investigation Execution via SSE
  const handleStartInvestigation = (queryText, txIdOverride = null) => {
    const q = queryText || queryInput;
    if (!q.trim()) return;

    const targetTx = txIdOverride || (q.includes("TX-101") ? "TX-101" : "TX-104");
    setSelectedTxId(targetTx);
    loadTargetTransaction(targetTx);

    setIsInvestigating(true);
    setErrorMessage(null);
    setStreamSteps([]);
    setActionStatus(null);
    setSelectedEntity(null);

    // Switch to investigation view
    setActiveSection("investigations");

    streamInvestigation(
      q,
      targetTx,
      (data) => {
        if (data.step) {
          setStreamSteps((prev) => [...prev, data.step]);
        }
      },
      (err) => {
        setIsInvestigating(false);
        setErrorMessage("Investigation stream error: " + (err.message || "Failed"));
      },
      (finalResult) => {
        setIsInvestigating(false);
        setInvestigationResult(finalResult);
        if (finalResult.subgraph) {
          setSubgraph(finalResult.subgraph);
        }
        if (finalResult.graph_path) {
          setReasoningPath(finalResult.graph_path);
        }
      }
    );
  };

  const handleApproveAction = async (payload) => {
    try {
      const result = await approveAction(payload);
      setActionStatus(result);
      await loadAuditTrail();
    } catch (err) {
      setErrorMessage("Approval execution rejected: " + err.message);
    }
  };

  const handleRejectAction = async (payload) => {
    try {
      const result = await rejectAction(payload);
      setActionStatus(result);
      await loadAuditTrail();
    } catch (err) {
      setErrorMessage("Rejection failed: " + err.message);
    }
  };

  const handleRequestApproval = async (payload) => {
    try {
      await requestActionApproval(payload);
      setErrorMessage(null);
    } catch (err) {
      setErrorMessage("Approval request failed: " + err.message);
    }
  };

  const handleExportPdf = async (txId) => {
    try {
      await downloadInvestigationReportPdf(txId || selectedTxId);
    } catch (err) {
      setErrorMessage("Failed to export PDF dossier: " + err.message);
    }
  };

  const handleExportJson = async (txId) => {
    try {
      const data = await fetchInvestigationReport(txId || selectedTxId);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `GraphGuard_Investigation_${(txId || selectedTxId).toUpperCase()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setErrorMessage("Failed to export JSON docket: " + err.message);
    }
  };

  // Derived Investigation Values from Real Backend
  const currentRiskScore = investigationResult?.risk_score ?? (selectedTxId === "TX-104" ? 98 : 5);
  const currentRiskLevel = investigationResult?.risk_level ?? (selectedTxId === "TX-104" ? "HIGH" : "LOW");

  // Authentication Loading Screen
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#070a10] flex items-center justify-center text-slate-400 font-mono text-xs">
        <Loader2 className="w-5 h-5 animate-spin text-cyan-400 mr-2" />
        <span>Validating security session...</span>
      </div>
    );
  }

  // Protected Route Gate: Unauthenticated users are shown Login Screen
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#080b11] text-slate-100">
      {/* 1. Top Enterprise Navigation */}
      <TopNavbar
        health={health}
        onReseed={handleReseed}
        onOpenSettings={() => setIsSettingsOpen(true)}
        activeTxId={selectedTxId}
        isInvestigating={isInvestigating}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenUserManagement={() => setIsUserMgmtOpen(true)}
      />

      {/* Main 3-Column Layout Container */}
      <div className="flex-1 flex w-full">
        {/* 2. Left Enterprise Command Sidebar */}
        <LeftSidebar
          activeSection={activeSection}
          onSelectSection={(sec) => {
            if (sec === "user_management") {
              setIsUserMgmtOpen(true);
            } else {
              setActiveSection(sec);
            }
          }}
          health={health}
          auditCount={auditRecords.length}
          currentUser={currentUser}
        />

        {/* Center & Right Investigation Workspace */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto space-y-4 max-w-[1600px] mx-auto w-full">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-xs flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-red-400 hover:text-red-200 font-mono text-[11px]"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Conditional Views based on Sidebar Navigation */}
          {activeSection === "transactions" ? (
            /* Transactions Catalog View */
            <TransactionsList
              transactions={transactions}
              onSelectTx={handleSelectTransaction}
              activeTxId={selectedTxId}
            />
          ) : activeSection === "audit_trail" ? (
            /* Immutable Audit Trail View */
            <AuditTrailView
              records={auditRecords}
              onRefresh={loadAuditTrail}
            />
          ) : activeSection === "fraud_network" ? (
            /* Full-Screen Fraud Network Explorer */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-cyan-400" />
                    Dedicated Fraud Network Graph Explorer
                  </h2>
                  <p className="text-xs text-slate-400">
                    Interactive multi-hop Cypher topology rendered from live FalkorDB Cloud graph.
                  </p>
                </div>
              </div>
              <div className="relative">
                <GraphCanvas
                  subgraph={subgraph}
                  reasoningPath={reasoningPath}
                  selectedNode={selectedEntity}
                  onSelectNode={(node) => setSelectedEntity(node)}
                />
                {selectedEntity && (
                  <div className="absolute top-4 right-4 z-20">
                    <EntityInspector
                      entity={selectedEntity}
                      subgraph={subgraph}
                      onClose={() => setSelectedEntity(null)}
                    />
                  </div>
                )}
              </div>
            </div>
          ) : activeSection === "risk_analysis" ? (
            /* Risk Analysis View */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <RiskScoreGauge
                score={currentRiskScore}
                level={currentRiskLevel}
                explanation={investigationResult?.reasoning_explanation}
                confidence={investigationResult?.confidence || 0.95}
                factors={investigationResult?.risk_factors || []}
              />
              <KeyFindings
                findings={investigationResult?.key_findings || []}
                isClean={selectedTxId === "TX-101"}
              />
              <div className="md:col-span-2">
                <AiSummaryPanel
                  explanation={investigationResult?.reasoning_explanation}
                  confidence={investigationResult?.confidence || 0.95}
                  evidence={investigationResult?.evidence}
                  steps={investigationResult?.steps || streamSteps}
                  timestamp={investigationResult?.created_at}
                />
              </div>
            </div>
          ) : (
            /* Core Default: Investigations & Dashboard Command Center */
            <div className="space-y-4">
              {/* 3. Investigation Header & Search */}
              <InvestigationHeader
                selectedTx={selectedTxData}
                transactions={transactions}
                queryInput={queryInput}
                setQueryInput={setQueryInput}
                onSearch={handleStartInvestigation}
                onSelectTx={handleSelectTransaction}
                isInvestigating={isInvestigating}
                riskScore={currentRiskScore}
                riskLevel={currentRiskLevel}
                onExportPdf={handleExportPdf}
                onExportJson={handleExportJson}
              />

              {/* Main 2-Column Split: Graph Canvas Left (7 cols), Intel & Approval Right (5 cols) */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                {/* Left 7 Columns: Fraud Network Graph & Floating Inspector */}
                <div className="xl:col-span-7 flex flex-col gap-4 relative">
                  <div className="relative">
                    <GraphCanvas
                      subgraph={subgraph}
                      reasoningPath={reasoningPath}
                      selectedNode={selectedEntity}
                      onSelectNode={(node) => setSelectedEntity(node)}
                    />

                    {/* Floating Node Inspector Drawer */}
                    {selectedEntity && (
                      <div className="absolute top-4 right-4 z-20">
                        <EntityInspector
                          entity={selectedEntity}
                          subgraph={subgraph}
                          onClose={() => setSelectedEntity(null)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Key Findings Section beneath Graph */}
                  <KeyFindings
                    findings={investigationResult?.key_findings || []}
                    isClean={selectedTxId === "TX-101"}
                  />
                </div>

                {/* Right 5 Columns: Risk Score, AI Explanation, Human Approval, Live Timeline */}
                <div className="xl:col-span-5 flex flex-col gap-4">
                  {/* 4. Risk Score Visualization */}
                  <RiskScoreGauge
                    score={currentRiskScore}
                    level={currentRiskLevel}
                    explanation={
                      selectedTxId === "TX-104"
                        ? "High-risk transaction based on network exposure and connected incident signals."
                        : "Low-risk transaction. Conforms to standard baseline account activity."
                    }
                    confidence={investigationResult?.confidence || 0.95}
                    factors={investigationResult?.risk_factors || []}
                  />

                  {/* 8. AI Investigation Summary */}
                  <AiSummaryPanel
                    explanation={investigationResult?.reasoning_explanation}
                    confidence={investigationResult?.confidence || 0.95}
                    evidence={investigationResult?.evidence}
                    steps={investigationResult?.steps || streamSteps}
                    timestamp={investigationResult?.created_at}
                  />

                  {/* 9 & 10. Recommended Action & Human Approval Workflow (Role-Aware) */}
                  <HumanApprovalWorkflow
                    investigation={investigationResult}
                    onApprove={handleApproveAction}
                    onReject={handleRejectAction}
                    onRequestApproval={handleRequestApproval}
                    actionStatus={actionStatus}
                    currentUser={currentUser}
                  />

                  {/* 11. Autonomous Live Streaming Timeline */}
                  <InvestigationTimeline
                    steps={streamSteps}
                    isStreaming={isInvestigating}
                  />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        health={health}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Admin User Management Modal */}
      <UserManagementModal
        isOpen={isUserMgmtOpen}
        onClose={() => setIsUserMgmtOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-2.5 px-6 text-center text-xs text-slate-500 font-mono">
        GraphGuard AI — GRAPH Hacks 2026 (Track 01: Agents That Act on Connected Data) | FalkorDB Cloud Context Layer | Role: {currentUser.role}
      </footer>
    </div>
  );
}
