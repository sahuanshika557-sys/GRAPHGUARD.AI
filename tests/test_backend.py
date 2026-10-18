import pytest
import sys
from pathlib import Path

# Ensure root & backend are in sys.path
root_path = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_path))
sys.path.insert(0, str(root_path / "backend"))

from fastapi.testclient import TestClient
from app.main import app
from app.graph.engine import graph_engine
from app.tools.graph_tools import (
    get_transaction,
    find_connected_accounts,
    find_previous_incidents,
    calculate_risk,
    recommend_action
)

from app.auth.auth import create_access_token
from app.services.user_service import user_service

client = TestClient(app)
admin_user = user_service.get_user_by_email("admin@graphguard.ai")
if admin_user:
    token = create_access_token(admin_user)
    client.headers["Authorization"] = f"Bearer {token}"

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ONLINE"
    assert data["node_count"] >= 20
    assert data["edge_count"] >= 30

def test_list_transactions():
    response = client.get("/api/transactions")
    assert response.status_code == 200
    txs = response.json()["transactions"]
    ids = [t["id"] for t in txs]
    assert "TX-104" in ids
    assert "TX-101" in ids

def test_get_transaction_tx104():
    response = client.get("/api/transaction/TX-104")
    assert response.status_code == 200
    data = response.json()
    assert data["transaction"]["id"] == "TX-104"
    assert data["transaction"]["amount"] == 85000.0
    assert data["account"]["id"] == "A501"
    assert data["device"]["id"] == "D55"

def test_graph_multi_hop_traversal_tx104():
    """Verify multi-hop path discovery from TX-104 to Incident F22."""
    incidents = find_previous_incidents("TX-104")
    assert len(incidents) > 0
    inc_ids = [inc["incident"]["id"] for inc in incidents]
    assert "F22" in inc_ids
    # Check traversed path
    path = incidents[0]["path"]
    assert "TX-104" in path
    assert "D55" in path
    assert "A887" in path
    assert "F22" in path

def test_risk_calculation_tx104():
    """Verify dynamic risk calculation for TX-104 correctly evaluates to HIGH."""
    tx_data = get_transaction("TX-104")
    acc = graph_engine.get_transaction_account("TX-104")
    dev = graph_engine.get_transaction_device("TX-104")
    ip = graph_engine.get_transaction_ip("TX-104")
    loc = graph_engine.get_ip_location(ip["id"]) if ip else None
    connected_accs = graph_engine.get_connected_accounts_multi_hop("TX-104")
    incidents = graph_engine.find_all_incidents_connected_to_transaction("TX-104", max_depth=4)

    evidence = {
        "transaction": tx_data,
        "account": acc,
        "device": dev,
        "ip": ip,
        "location": loc,
        "connected_accounts": connected_accs,
        "incidents": incidents
    }
    risk = calculate_risk(evidence)
    assert risk["risk_level"] == "HIGH"
    assert risk["risk_score"] >= 80
    rec = recommend_action(risk["risk_level"], risk["risk_score"])
    assert rec["recommended_action"] == "FLAG_TRANSACTION"

def test_investigate_api_tx104():
    response = client.post("/api/investigate", json={"query": "Investigate TX-104"})
    assert response.status_code == 200
    res = response.json()
    assert res["transaction_id"] == "TX-104"
    assert res["risk_level"] == "HIGH"
    assert res["recommended_action"] == "FLAG_TRANSACTION"
    assert res["requires_approval"] is True
    assert "F22" in res["graph_path"]
    assert len(res["steps"]) >= 5

def test_investigate_api_normal_tx101():
    response = client.post("/api/investigate", json={"query": "Investigate TX-101"})
    assert response.status_code == 200
    res = response.json()
    assert res["transaction_id"] == "TX-101"
    assert res["risk_level"] == "LOW"
    assert res["recommended_action"] == "NO_ACTION"

def test_human_approval_and_audit_trail():
    # 1. Investigate TX-104
    inv_res = client.post("/api/investigate", json={"query": "Investigate TX-104"}).json()
    inv_id = inv_res["investigation_id"]

    # 2. Approve action
    app_res = client.post("/api/action/approve", json={
        "investigation_id": inv_id,
        "transaction_id": "TX-104",
        "action": "FLAG_TRANSACTION",
        "approver": "Senior AML Lead Marcus Kane",
        "notes": "Confirmed multi-hop syndicate path to F22. Freezing immediately."
    })
    assert app_res.status_code == 200
    app_data = app_res.json()
    assert app_data["decision"] == "APPROVED"
    assert app_data["status"] == "EXECUTED"

    # 3. Check Audit Trail
    audit_res = client.get("/api/audit")
    assert audit_res.status_code == 200
    records = audit_res.json()
    assert len(records) > 0
    latest = records[0]
    assert latest["entity_id"] == "TX-104"
    assert latest["human_decision"] == "APPROVED"
    assert latest["action"] == "FLAG_TRANSACTION"

def test_audit_persistence_across_restart():
    """Verify that audit records persist in SQLite across service re-instantiation."""
    from app.services.audit_service import AuditService
    import uuid
    
    unique_tx = f"TX-TEST-{uuid.uuid4().hex[:6].upper()}"
    service1 = AuditService()
    record = service1.record_decision(
        investigation_id="INV-TEST-001",
        entity_id=unique_tx,
        ai_recommendation="FLAG_TRANSACTION",
        reason="Persistence verification test",
        human_decision="APPROVED",
        action="FLAG_TRANSACTION",
        execution_result="Success"
    )
    assert record["entity_id"] == unique_tx

    # Re-instantiate service (simulating backend reboot)
    service2 = AuditService()
    persisted = service2.get_records_for_entity(unique_tx)
    assert len(persisted) == 1
    assert persisted[0]["audit_id"] == record["audit_id"]
    assert persisted[0]["human_decision"] == "APPROVED"
