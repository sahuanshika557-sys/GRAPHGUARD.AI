from pydantic import BaseModel, Field, ConfigDict
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

class HealthResponse(BaseModel):
    status: str
    falkordb_connected: bool
    falkordb_mode: str
    active_database: str = "Embedded Graph Engine (Local Fallback)"
    cloud_configured: bool = False
    cloud_diagnostic: Optional[str] = None
    falkordb_error: Optional[str] = None
    groq_status: str = "CONFIGURED"
    node_count: int
    edge_count: int
    environment: str

class GraphNode(BaseModel):
    id: str
    label: str
    name: Optional[str] = None
    properties: Dict[str, Any] = Field(default_factory=dict)

class GraphEdge(BaseModel):
    id: str
    from_: str = Field(alias="from")
    to: str
    type: str
    props: Dict[str, Any] = Field(default_factory=dict)
    model_config = ConfigDict(populate_by_name=True)

class GraphSubgraphResponse(BaseModel):
    root_id: str
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]
    total_nodes: int
    total_edges: int

class InvestigationRequest(BaseModel):
    query: str = Field(..., description="Investigation prompt or question, e.g. 'Investigate TX-104'")
    transaction_id: Optional[str] = None

class InvestigationStep(BaseModel):
    step_id: str
    step_name: str
    status: str = "COMPLETED"
    message: str
    entity_id: Optional[str] = None
    evidence: Optional[Dict[str, Any]] = None
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class InvestigationResult(BaseModel):
    investigation_id: str
    transaction_id: str
    risk_level: str  # LOW, MEDIUM, HIGH, CRITICAL
    risk_score: int  # 0 to 100
    confidence: float
    key_findings: List[str]
    evidence: Dict[str, Any]
    risk_factors: Optional[List[Dict[str, Any]]] = None
    graph_path: List[str]
    reasoning_explanation: str
    recommended_action: str  # FLAG_TRANSACTION, CREATE_INVESTIGATION, GENERATE_ALERT, MARK_FOR_REVIEW, NO_ACTION
    requires_approval: bool
    steps: List[InvestigationStep]
    subgraph: Optional[Dict[str, Any]] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ActionApprovalRequest(BaseModel):
    investigation_id: str = Field(default="", alias="investigationId")
    transaction_id: str = Field(default="", alias="transactionId")
    action: str
    approver: str = "Lead AML Risk Officer"
    notes: Optional[str] = None
    model_config = ConfigDict(populate_by_name=True)

class ActionRejectRequest(BaseModel):
    investigation_id: str = Field(default="", alias="investigationId")
    transaction_id: str = Field(default="", alias="transactionId")
    action: str
    rejector: str = "Lead AML Risk Officer"
    reason: Optional[str] = "False positive dismissed after human evaluation"
    model_config = ConfigDict(populate_by_name=True)

class ActionExecutionResponse(BaseModel):
    audit_id: str
    investigation_id: str
    transaction_id: str
    action: str
    decision: str  # APPROVED / REJECTED
    status: str    # EXECUTED / CANCELLED
    message: str
    timestamp: str

class AuditRecord(BaseModel):
    audit_id: str
    timestamp: str
    investigation_id: str
    entity_id: str
    ai_recommendation: str
    reason: Optional[str] = None
    human_decision: str
    action: str
    execution_result: Optional[str] = None
    evidence_summary: List[str] = Field(default_factory=list)
    graph_path: List[str] = Field(default_factory=list)
    operator: str = "Security Analyst"
    previous_hash: Optional[str] = None
    event_hash: Optional[str] = None
