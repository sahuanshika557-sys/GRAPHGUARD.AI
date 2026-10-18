import json
import logging
import asyncio
from fastapi import APIRouter, HTTPException, Query, Depends, status, Response
from fastapi.responses import StreamingResponse
from typing import List, Dict, Any, Optional

from app.config import settings
from app.graph.connection import db_manager
from app.graph.engine import graph_engine
from app.agents.investigator import investigator_agent
from app.services.audit_service import audit_service
from app.services.user_service import user_service
from app.services.report_service import build_investigation_report_data, generate_pdf_report
from app.auth.auth import (
    get_current_user,
    require_admin,
    require_approver,
    require_analyst,
    require_viewer
)
from app.tools.graph_tools import flag_transaction
from app.models.schemas import (
    HealthResponse,
    InvestigationRequest,
    InvestigationResult,
    GraphSubgraphResponse,
    ActionApprovalRequest,
    ActionRejectRequest,
    ActionExecutionResponse,
    AuditRecord
)

logger = logging.getLogger("graphguard.api")

router = APIRouter(prefix="/api")

@router.get("/health", response_model=HealthResponse)
def get_health():
    """Health check verifying FalkorDB connection status and graph statistics (Public for monitoring)."""
    health_data = db_manager.check_health()
    groq_configured = bool(settings.GROQ_API_KEY and len(settings.GROQ_API_KEY) > 5)
    groq_status = "CONFIGURED" if groq_configured else "NOT_CONFIGURED"

    return HealthResponse(
        status="ONLINE",
        falkordb_connected=health_data["connected"],
        falkordb_mode=health_data["mode"],
        active_database=health_data["active_database"],
        cloud_configured=health_data["cloud_configured"],
        cloud_diagnostic=health_data.get("cloud_diagnostic"),
        falkordb_error=health_data.get("error"),
        groq_status=groq_status,
        node_count=len(graph_engine.node_store),
        edge_count=len(graph_engine.edge_store),
        environment="development"
    )

@router.get("/transactions")
def list_transactions(current_user: Dict[str, Any] = Depends(require_viewer)):
    """List available transactions for quick selection (Protected: all authenticated roles)."""
    txs = graph_engine.find_all_transactions()
    return {"transactions": txs}

@router.get("/transaction/{tx_id}")
def get_transaction_details(
    tx_id: str,
    current_user: Dict[str, Any] = Depends(require_viewer)
):
    """Get single transaction by ID (Protected)."""
    tx = graph_engine.get_transaction(tx_id.upper())
    if not tx:
        raise HTTPException(status_code=404, detail=f"Transaction {tx_id} not found")
    acc = graph_engine.get_transaction_account(tx_id.upper())
    device = graph_engine.get_transaction_device(tx_id.upper())
    ip = graph_engine.get_transaction_ip(tx_id.upper())
    loc = graph_engine.get_ip_location(ip["id"]) if ip else None
    return {
        "transaction": tx,
        "account": acc,
        "device": device,
        "ip": ip,
        "location": loc
    }

@router.get("/graph/{entity_id}", response_model=GraphSubgraphResponse)
def get_subgraph(
    entity_id: str,
    depth: int = Query(3, ge=1, le=5),
    current_user: Dict[str, Any] = Depends(require_viewer)
):
    """Retrieve connected graph neighborhood for React Flow visualization (Protected)."""
    subgraph = graph_engine.get_subgraph_around_entity(entity_id.upper(), depth=depth)
    return GraphSubgraphResponse(**subgraph)

@router.post("/investigate", response_model=InvestigationResult)
async def run_investigation(
    req: InvestigationRequest,
    current_user: Dict[str, Any] = Depends(require_analyst)
):
    """
    Run full agentic multi-hop investigation synchronously.
    Protected: ADMIN, ANALYST, REVIEWER. (VIEWER cannot execute investigation).
    """
    # Record INVESTIGATION_STARTED security audit event
    user_service.record_security_event(
        event_type="INVESTIGATION_STARTED",
        user_email=current_user["email"],
        user_role=current_user["role"],
        transaction_id=req.transaction_id,
        status="SUCCESS",
        details=f"Investigation query: '{req.query}'"
    )

    last_result = None
    async for event in investigator_agent.run_investigation_stream(req.query, req.transaction_id):
        if event.get("event") == "COMPLETE":
            last_result = event.get("result")
        elif event.get("event") == "ERROR":
            raise HTTPException(status_code=400, detail=event.get("step", {}).get("message", "Investigation failed"))
    
    if not last_result:
        raise HTTPException(status_code=500, detail="Investigation pipeline failed to yield a final decision")
    
    # Record INVESTIGATION_COMPLETED and RECOMMENDATION_CREATED
    user_service.record_security_event(
        event_type="INVESTIGATION_COMPLETED",
        user_email=current_user["email"],
        user_role=current_user["role"],
        transaction_id=last_result.get("transaction_id"),
        status="SUCCESS",
        details=f"Risk Score: {last_result.get('risk_score')}/100 ({last_result.get('risk_level')})"
    )
    user_service.record_security_event(
        event_type="RECOMMENDATION_CREATED",
        user_email=current_user["email"],
        user_role=current_user["role"],
        transaction_id=last_result.get("transaction_id"),
        status="SUCCESS",
        details=f"Recommended action: {last_result.get('recommended_action')}"
    )

    return InvestigationResult(**last_result)

@router.get("/investigate/stream")
async def stream_investigation(
    query: str = Query("Investigate TX-104"),
    tx_id: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(require_analyst)
):
    """
    Server-Sent Events (SSE) endpoint providing live real-time investigation progress.
    Protected: ADMIN, ANALYST, REVIEWER.
    """
    user_service.record_security_event(
        event_type="INVESTIGATION_STARTED",
        user_email=current_user["email"],
        user_role=current_user["role"],
        transaction_id=tx_id,
        status="SUCCESS",
        details=f"SSE stream started: '{query}'"
    )

    async def event_generator():
        try:
            async for data in investigator_agent.run_investigation_stream(query, tx_id):
                yield f"data: {json.dumps(data)}\n\n"
        except Exception as e:
            logger.error(f"SSE stream error: {e}")
            err_data = {"event": "ERROR", "message": str(e)}
            yield f"data: {json.dumps(err_data)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@router.post("/action/request-approval")
def request_action_approval(
    req: ActionApprovalRequest,
    current_user: Dict[str, Any] = Depends(require_analyst)
):
    """
    Analyst submits a request for human approval of a high-impact action.
    Protected: ADMIN, ANALYST, REVIEWER.
    """
    user_service.record_security_event(
        event_type="ACTION_APPROVAL_REQUESTED",
        user_email=current_user["email"],
        user_role=current_user["role"],
        transaction_id=req.transaction_id,
        status="PENDING",
        details=f"Action '{req.action}' submitted for Reviewer/Admin approval by {current_user['name']}"
    )
    return {
        "status": "APPROVAL_REQUESTED",
        "message": f"Action '{req.action}' submitted for Reviewer approval.",
        "transaction_id": req.transaction_id,
        "investigation_id": req.investigation_id
    }

@router.post("/action/approve", response_model=ActionExecutionResponse)
def approve_action(
    req: ActionApprovalRequest,
    current_user: Dict[str, Any] = Depends(require_approver)
):
    """
    Human-in-the-Loop checkpoint: Authorized operator approves recommended action.
    Strictly Protected: REVIEWER and ADMIN only.
    ANALYST and VIEWER are rejected with HTTP 403 Forbidden.
    """
    approver_name = req.approver or current_user.get("name") or current_user.get("email")

    execution_result = ""
    if req.action == "FLAG_TRANSACTION":
        res = flag_transaction(req.transaction_id, f"Approved by {approver_name}. Notes: {req.notes or 'None'}")
        execution_result = res["detail"]
    elif req.action == "CREATE_INVESTIGATION":
        execution_result = f"Investigation Case CASE-{req.transaction_id} opened and assigned to Senior AML Analyst."
    elif req.action == "MARK_FOR_REVIEW":
        execution_result = f"Transaction {req.transaction_id} flagged for Tier 2 manual compliance review."
    else:
        execution_result = f"Action {req.action} executed successfully."

    # Record in persistent audit log
    record = audit_service.record_decision(
        investigation_id=req.investigation_id,
        entity_id=req.transaction_id,
        ai_recommendation=req.action,
        reason=req.notes or f"Human operator ({approver_name}) verified evidence path and approved action.",
        human_decision="APPROVED",
        action=req.action,
        execution_result=execution_result,
        operator=approver_name
    )

    # Record security audit event
    user_service.record_security_event(
        event_type="ACTION_APPROVED",
        user_email=current_user["email"],
        user_role=current_user["role"],
        transaction_id=req.transaction_id,
        status="APPROVED",
        details=f"Action {req.action} approved. Audit ID: {record['audit_id']}"
    )
    user_service.record_security_event(
        event_type="ACTION_EXECUTED",
        user_email=current_user["email"],
        user_role=current_user["role"],
        transaction_id=req.transaction_id,
        status="EXECUTED",
        details=execution_result
    )

    return ActionExecutionResponse(
        audit_id=record["audit_id"],
        investigation_id=req.investigation_id,
        transaction_id=req.transaction_id,
        action=req.action,
        decision="APPROVED",
        status="EXECUTED",
        message=f"Action '{req.action}' approved and successfully executed by {approver_name}. Audit ID: {record['audit_id']}",
        timestamp=record["timestamp"]
    )

@router.post("/action/reject", response_model=ActionExecutionResponse)
def reject_action(
    req: ActionRejectRequest,
    current_user: Dict[str, Any] = Depends(require_approver)
):
    """
    Human-in-the-Loop checkpoint: Operator rejects recommended action.
    Strictly Protected: REVIEWER and ADMIN only.
    ANALYST and VIEWER are rejected with HTTP 403 Forbidden.
    """
    rejector_name = req.rejector or current_user.get("name") or current_user.get("email")
    execution_result = f"Action cancelled. Rejection justification: {req.reason or 'Dismissed after manual review'}"

    # Record in persistent audit log
    record = audit_service.record_decision(
        investigation_id=req.investigation_id,
        entity_id=req.transaction_id,
        ai_recommendation=req.action,
        reason=req.reason or "Dismissed by human operator",
        human_decision="REJECTED",
        action=req.action,
        execution_result=execution_result,
        operator=rejector_name
    )

    # Record security audit event
    user_service.record_security_event(
        event_type="ACTION_REJECTED",
        user_email=current_user["email"],
        user_role=current_user["role"],
        transaction_id=req.transaction_id,
        status="REJECTED",
        details=f"Action {req.action} rejected by {rejector_name}. Reason: {req.reason}"
    )

    return ActionExecutionResponse(
        audit_id=record["audit_id"],
        investigation_id=req.investigation_id,
        transaction_id=req.transaction_id,
        action=req.action,
        decision="REJECTED",
        status="CANCELLED",
        message=f"Action '{req.action}' rejected by {rejector_name}. Rejection recorded in audit trail.",
        timestamp=record["timestamp"]
    )

@router.get("/audit", response_model=List[AuditRecord])
def get_audit_trail(current_user: Dict[str, Any] = Depends(require_viewer)):
    """Retrieve full persistent audit log (Protected)."""
    return audit_service.get_all_records()

@router.get("/audit/verify")
def verify_audit_trail(current_user: Dict[str, Any] = Depends(require_viewer)):
    """Cryptographically verify the SHA-256 tamper-evident hash chain across all audit records (Protected)."""
    return audit_service.verify_audit_integrity()

@router.get("/audit/security")
def get_security_audit_trail(
    limit: int = Query(100, ge=1, le=500),
    current_user: Dict[str, Any] = Depends(require_approver)
):
    """Retrieve security audit events (Protected: ADMIN and REVIEWER only)."""
    return {"events": user_service.get_security_events(limit=limit)}

@router.get("/investigation/{tx_id}/report")
def get_investigation_report(
    tx_id: str,
    current_user: Dict[str, Any] = Depends(require_viewer)
):
    """Retrieve full structured JSON dossier for SAR preparation (Protected)."""
    return build_investigation_report_data(tx_id)

@router.get("/investigation/{tx_id}/report/pdf")
def export_investigation_pdf(
    tx_id: str,
    current_user: Dict[str, Any] = Depends(require_viewer)
):
    """Export formatted Investigation Report / SAR Preparation PDF (Protected)."""
    report_data = build_investigation_report_data(tx_id)
    pdf_bytes = generate_pdf_report(report_data)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="GraphGuard_SAR_Report_{tx_id.upper()}.pdf"'
        }
    )

@router.post("/graph/seed")
def reseed_graph(current_user: Dict[str, Any] = Depends(require_admin)):
    """Re-seed graph from scratch (Protected: ADMIN only)."""
    graph_engine.initialize_graph()
    user_service.record_security_event(
        event_type="DATABASE_RESEEDED",
        user_email=current_user["email"],
        user_role=current_user["role"],
        status="SUCCESS",
        details="Admin triggered graph database reseed"
    )
    return {
        "status": "SUCCESS",
        "message": f"Graph re-seeded with {len(graph_engine.node_store)} nodes and {len(graph_engine.edge_store)} relationships."
    }
