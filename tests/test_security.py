import pytest
import sys
from pathlib import Path

root_path = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_path))
sys.path.insert(0, str(root_path / "backend"))

from fastapi.testclient import TestClient
from app.main import app
from app.config import settings
from app.auth.auth import create_access_token
from app.services.user_service import user_service

client = TestClient(app)

def test_1_login_success():
    """1. Test valid login returns 200, JWT access token, and user profile."""
    resp = client.post("/api/auth/login", json={
        "email": settings.ADMIN_EMAIL,
        "password": settings.ADMIN_PASSWORD
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == settings.ADMIN_EMAIL.lower()
    assert data["user"]["role"] == "ADMIN"

def test_2_invalid_password():
    """2. Test invalid password returns 401 with generic error message."""
    resp = client.post("/api/auth/login", json={
        "email": settings.ADMIN_EMAIL,
        "password": "WrongPassword123!"
    })
    assert resp.status_code == 401
    data = resp.json()
    assert data["detail"] == "Invalid email or password."

def test_3_protected_endpoint_without_auth_returns_401():
    """3. Test accessing protected endpoints without authentication returns 401."""
    unauthed_client = TestClient(app)

    # Test GET /api/auth/me
    resp1 = unauthed_client.get("/api/auth/me")
    assert resp1.status_code == 401

    # Test POST /api/investigate
    resp2 = unauthed_client.post("/api/investigate", json={"query": "Investigate TX-104"})
    assert resp2.status_code == 401

    # Test POST /api/action/approve
    resp3 = unauthed_client.post("/api/action/approve", json={
        "investigation_id": "INV-001",
        "transaction_id": "TX-104",
        "action": "FLAG_TRANSACTION"
    })
    assert resp3.status_code == 401

def test_4_analyst_can_investigate():
    """4. Test ANALYST role has permission to execute investigations."""
    analyst_user = user_service.get_user_by_email(settings.ANALYST_EMAIL)
    token = create_access_token(analyst_user)
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.post("/api/investigate", json={"query": "Investigate TX-104"}, headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["transaction_id"] == "TX-104"
    assert data["risk_level"] == "HIGH"

def test_5_analyst_cannot_approve_action_returns_403():
    """5. Test ANALYST role CANNOT approve actions and gets HTTP 403 Forbidden."""
    analyst_user = user_service.get_user_by_email(settings.ANALYST_EMAIL)
    token = create_access_token(analyst_user)
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.post("/api/action/approve", json={
        "investigation_id": "INV-TEST-001",
        "transaction_id": "TX-104",
        "action": "FLAG_TRANSACTION",
        "approver": "Analyst Trying To Approve"
    }, headers=headers)
    assert resp.status_code == 403
    assert "Forbidden" in resp.json()["detail"]

def test_6_reviewer_can_approve():
    """6. Test REVIEWER role has authorized permission to approve actions."""
    reviewer_user = user_service.get_user_by_email(settings.REVIEWER_EMAIL)
    token = create_access_token(reviewer_user)
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.post("/api/action/approve", json={
        "investigation_id": "INV-REV-001",
        "transaction_id": "TX-104",
        "action": "FLAG_TRANSACTION",
        "approver": "Executive Reviewer Elena"
    }, headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["decision"] == "APPROVED"
    assert data["status"] == "EXECUTED"

def test_7_viewer_cannot_approve_returns_403():
    """7. Test VIEWER role cannot approve actions and gets HTTP 403 Forbidden."""
    viewer_user = user_service.get_user_by_email(settings.VIEWER_EMAIL)
    token = create_access_token(viewer_user)
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.post("/api/action/approve", json={
        "investigation_id": "INV-VIEW-001",
        "transaction_id": "TX-104",
        "action": "FLAG_TRANSACTION"
    }, headers=headers)
    assert resp.status_code == 403
    assert "Forbidden" in resp.json()["detail"]

def test_8_admin_access():
    """8. Test ADMIN has full access to user management and system settings."""
    admin_user = user_service.get_user_by_email(settings.ADMIN_EMAIL)
    token = create_access_token(admin_user)
    headers = {"Authorization": f"Bearer {token}"}

    # Admin lists users
    resp = client.get("/api/auth/users", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "users" in data
    assert len(data["users"]) >= 4

    # Non-admin cannot list users
    analyst_token = create_access_token(user_service.get_user_by_email(settings.ANALYST_EMAIL))
    resp_unauth = client.get("/api/auth/users", headers={"Authorization": f"Bearer {analyst_token}"})
    assert resp_unauth.status_code == 403

def test_9_logout():
    """9. Test logout endpoint clears session and returns success."""
    admin_user = user_service.get_user_by_email(settings.ADMIN_EMAIL)
    token = create_access_token(admin_user)
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.post("/api/auth/logout", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["message"] == "Logged out successfully"

def test_10_audit_event_created_after_login():
    """10. Verify LOGIN_SUCCESS audit event is logged in SQLite."""
    events = user_service.get_security_events(limit=20)
    event_types = [e["event_type"] for e in events]
    assert "LOGIN_SUCCESS" in event_types

def test_11_failed_login_audit_event():
    """11. Verify LOGIN_FAILED audit event is recorded with failure details."""
    client.post("/api/auth/login", json={
        "email": "intruder@malicious.com",
        "password": "BadPassword123"
    })
    events = user_service.get_security_events(limit=10)
    failed_events = [e for e in events if e["event_type"] == "LOGIN_FAILED" and e["user_email"] == "intruder@malicious.com"]
    assert len(failed_events) > 0
    assert failed_events[0]["status"] == "FAILED"

def test_12_unauthorized_access_audit_event():
    """12. Verify ACCESS_DENIED security event is logged when unauthorized role attempts action."""
    events = user_service.get_security_events(limit=20)
    denied_events = [e for e in events if e["event_type"] == "ACCESS_DENIED"]
    assert len(denied_events) > 0
    assert denied_events[0]["status"] == "FAILED"

def test_13_action_rejection_recorded_in_audit():
    """13. Verify action rejection by Reviewer returns 200 and logs REJECTED audit record."""
    reviewer_user = user_service.get_user_by_email(settings.REVIEWER_EMAIL)
    token = create_access_token(reviewer_user)
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.post("/api/action/reject", json={
        "investigation_id": "INV-REJ-001",
        "transaction_id": "TX-104",
        "action": "FLAG_TRANSACTION",
        "rejector": "Senior Reviewer Elena",
        "reason": "False positive check completed by bank security desk."
    }, headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["decision"] == "REJECTED"
    assert data["status"] == "CANCELLED"
    assert data["audit_id"] is not None

def test_14_audit_integrity_hash_chain():
    """14. Verify cryptographic SHA-256 tamper-evident hash chain verification endpoint."""
    admin_user = user_service.get_user_by_email(settings.ADMIN_EMAIL)
    token = create_access_token(admin_user)
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.get("/api/audit/verify", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["valid"] is True
    assert data["status"] == "INTEGRITY_VERIFIED"
    assert data["total_records"] > 0
    assert data["last_verified_hash"] is not None

def test_15_sar_report_generation():
    """15. Verify Investigation Report / SAR Preparation endpoint returns comprehensive docket."""
    analyst_user = user_service.get_user_by_email(settings.ANALYST_EMAIL)
    token = create_access_token(analyst_user)
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.get("/api/investigation/TX-104/report", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["transaction"]["id"] == "TX-104"
    assert data["transaction"]["amount"] == 85000.0
    assert data["risk_assessment"]["risk_score"] >= 80
    assert len(data["risk_assessment"]["risk_factors"]) > 0
    assert len(data["connected_accounts"]) > 0

def test_16_sar_report_pdf_generation():
    """16. Verify PDF generation for SAR preparation dossier."""
    analyst_user = user_service.get_user_by_email(settings.ANALYST_EMAIL)
    token = create_access_token(analyst_user)
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.get("/api/investigation/TX-104/report/pdf", headers=headers)
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "application/pdf"
    assert resp.content.startswith(b"%PDF")

def test_17_admin_password_reset():
    """17. Verify Admin can reset a user password and the user can subsequently log in."""
    admin_user = user_service.get_user_by_email(settings.ADMIN_EMAIL)
    admin_token = create_access_token(admin_user)
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    viewer_user = user_service.get_user_by_email(settings.VIEWER_EMAIL)
    new_pw = "NewSecureViewerPassword2026!"
    resp = client.put(f"/api/auth/users/{viewer_user['id']}/password", json={"new_password": new_pw}, headers=admin_headers)
    assert resp.status_code == 200

    # Verify viewer can authenticate with new password
    login_resp = client.post("/api/auth/login", json={
        "email": settings.VIEWER_EMAIL,
        "password": new_pw
    })
    assert login_resp.status_code == 200
    assert "access_token" in login_resp.json()

