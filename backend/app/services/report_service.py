import io
import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional

from fpdf import FPDF

from app.graph.engine import graph_engine
from app.tools.graph_tools import calculate_risk
from app.services.audit_service import audit_service

logger = logging.getLogger("graphguard.report")

class PDFReport(FPDF):
    def header(self):
        self.set_fill_color(10, 15, 26)
        self.rect(0, 0, 210, 24, "F")
        self.set_font("Helvetica", "B", 14)
        self.set_text_color(56, 189, 248) # Cyan
        self.set_xy(10, 6)
        self.cell(0, 7, "GRAPHGUARD AI", ln=1)
        self.set_font("Helvetica", "B", 8)
        self.set_text_color(148, 163, 184) # Slate
        self.set_xy(10, 13)
        self.cell(0, 5, "INVESTIGATION REPORT / SAR PREPARATION (CONFIDENTIAL AML INTELLIGENCE DOCKET)", ln=1)
        self.ln(8)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 7)
        self.set_text_color(100, 116, 139)
        self.cell(0, 5, "CONFIDENTIAL // FOR INTERNAL COMPLIANCE & SAR PREPARATION WORKFLOWS ONLY", align="C", ln=1)
        self.cell(0, 4, f"Page {self.page_no()}", align="C")

def build_investigation_report_data(tx_id: str) -> Dict[str, Any]:
    tx = graph_engine.get_transaction(tx_id.upper())
    if not tx:
        tx = {"id": tx_id, "amount": 0.0, "channel": "UNKNOWN", "status": "NOT_FOUND"}

    acc = graph_engine.get_transaction_account(tx_id.upper())
    cust = graph_engine.get_account_customer(acc["id"]) if acc else None
    dev = graph_engine.get_transaction_device(tx_id.upper())
    ip = graph_engine.get_transaction_ip(tx_id.upper())
    loc = graph_engine.get_ip_location(ip["id"]) if ip else None
    connected_accs = graph_engine.get_connected_accounts_multi_hop(tx_id.upper())
    incidents = graph_engine.find_all_incidents_connected_to_transaction(tx_id.upper(), max_depth=4)

    evidence = {
        "transaction": tx,
        "account": acc,
        "customer": cust,
        "device": dev,
        "ip": ip,
        "location": loc,
        "connected_accounts": connected_accs,
        "incidents": incidents
    }

    risk_eval = calculate_risk(evidence)
    audit_records = audit_service.get_records_for_entity(tx_id.upper())
    latest_decision = audit_records[0] if audit_records else None

    report = {
        "report_id": f"REP-{tx_id.upper()}-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M')}",
        "title": "Investigation Report / SAR Preparation",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "disclaimer": "This document is prepared to support fraud, AML, and SAR preparation investigation workflows. It does not represent an officially submitted regulatory SAR until transmitted via statutory reporting portals.",
        "transaction": tx,
        "account": acc,
        "customer": cust,
        "device": dev,
        "network": {
            "ip": ip,
            "location": loc
        },
        "connected_accounts": connected_accs,
        "incidents": incidents,
        "risk_assessment": {
            "risk_score": risk_eval["risk_score"],
            "risk_level": risk_eval["risk_level"],
            "confidence": risk_eval["confidence"],
            "risk_factors": risk_eval.get("risk_factors", [])
        },
        "findings": risk_eval.get("findings", []),
        "latest_audit_decision": latest_decision,
        "audit_history_count": len(audit_records)
    }
    return report

def generate_pdf_report(report_data: Dict[str, Any]) -> bytes:
    pdf = PDFReport()
    pdf.set_auto_page_break(auto=True, margin=18)
    pdf.add_page()

    # Section 1: Executive Case Header
    pdf.set_fill_color(241, 245, 249)
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 7, f"CASE IDENTIFIER: {report_data['report_id']}", fill=True, ln=1)

    pdf.set_font("Helvetica", "", 8)
    pdf.cell(95, 5, f"Target Entity: {report_data['transaction'].get('id')}", ln=0)
    pdf.cell(95, 5, f"Date / Time Generated: {report_data['generated_at'][:19]} UTC", ln=1)
    pdf.cell(95, 5, f"Workflow Classification: Suspicious Activity Review (SAR Preparation)", ln=0)
    pdf.cell(95, 5, f"Risk Evaluation: {report_data['risk_assessment']['risk_level']} ({report_data['risk_assessment']['risk_score']}/100)", ln=1)
    pdf.ln(3)

    # Section 2: Target Transaction Telemetry
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_text_color(2, 132, 199)
    pdf.cell(0, 6, "1. TRANSACTION PROFILE & TELEMETRY", ln=1)
    pdf.set_font("Helvetica", "", 8)
    pdf.set_text_color(30, 41, 59)

    tx = report_data["transaction"]
    amount_str = f"${tx.get('amount', 0):,.2f} {tx.get('currency', 'USD')}"
    pdf.cell(60, 5, f"Amount: {amount_str}", border=1)
    pdf.cell(65, 5, f"Channel: {tx.get('channel', 'N/A')}", border=1)
    pdf.cell(65, 5, f"Status: {tx.get('status', 'PENDING')}", border=1, ln=1)
    pdf.cell(100, 5, f"Merchant / Payee: {tx.get('merchant', 'N/A')}", border=1)
    pdf.cell(90, 5, f"Initiated Timestamp: {tx.get('timestamp', 'N/A')}", border=1, ln=1)
    pdf.ln(3)

    # Section 3: Connected Graph Context & Discovered Evidence
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_text_color(2, 132, 199)
    pdf.cell(0, 6, "2. CONNECTED DATA & FALKORDB GRAPH EVIDENCE", ln=1)
    pdf.set_font("Helvetica", "", 8)
    pdf.set_text_color(30, 41, 59)

    acc = report_data.get("account") or {}
    cust = report_data.get("customer") or {}
    dev = report_data.get("device") or {}
    ip = report_data.get("network", {}).get("ip") or {}
    loc = report_data.get("network", {}).get("location") or {}

    pdf.cell(0, 5, f"Originating Account: {acc.get('id', 'N/A')} ({acc.get('type', 'N/A')}, Status: {acc.get('status', 'N/A')}) Owned by Customer: {cust.get('id', 'N/A')} ({cust.get('name', 'N/A')})", ln=1)
    pdf.cell(0, 5, f"Execution Device: {dev.get('id', 'N/A')} ({dev.get('type', 'N/A')}, Browser: {dev.get('browser', 'N/A')}, Rooted/Jailbroken: {dev.get('is_rooted', False)})", ln=1)
    pdf.cell(0, 5, f"Network Origin: {ip.get('id', 'N/A')} (ISP: {ip.get('isp', 'N/A')}, Tor Exit Node: {ip.get('is_tor', False)}, VPN: {ip.get('is_vpn', False)}) in {loc.get('city', 'Unknown')}, {loc.get('country', '')} (Risk Tier {loc.get('risk_tier', 1)})", ln=1)

    connected_accs = report_data.get("connected_accounts", [])
    if connected_accs:
        c_list = ", ".join([f"{a['id']} ({a.get('status')})" for a in connected_accs])
        pdf.cell(0, 5, f"Mule / Shared Hardware Accounts Detected: {c_list}", ln=1)

    incidents = report_data.get("incidents", [])
    if incidents:
        pdf.set_font("Helvetica", "B", 8)
        pdf.set_text_color(185, 28, 28) # Red
        for inc_item in incidents:
            inc = inc_item["incident"]
            p_str = " -> ".join(inc_item["path"])
            loss_str = f"${inc.get('loss_amount', 0):,.2f}" if "loss_amount" in inc else "N/A"
            pdf.cell(0, 5, f"CRITICAL: Connected to Prior Fraud Incident {inc['id']} ({inc.get('type')}, Loss: {loss_str}) via Path: {p_str}", ln=1)
        pdf.set_text_color(30, 41, 59)
    pdf.ln(3)

    # Section 4: Topological Risk Factor Breakdown
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_text_color(2, 132, 199)
    pdf.cell(0, 6, "3. EXPLAINABLE RISK SCORE BREAKDOWN", ln=1)
    pdf.set_font("Helvetica", "B", 8)
    pdf.cell(70, 5, "Risk Factor", border=1, fill=True)
    pdf.cell(25, 5, "Contribution", border=1, fill=True, align="C")
    pdf.cell(95, 5, "Graph Evidence", border=1, fill=True, ln=1)

    pdf.set_font("Helvetica", "", 7.5)
    factors = report_data.get("risk_assessment", {}).get("risk_factors", [])
    for f in factors:
        pdf.cell(70, 5, f.get("factor", ""), border=1)
        pdf.cell(25, 5, f"+{f.get('contribution', 0)} pts", border=1, align="C")
        pdf.cell(95, 5, f.get("evidence", "")[:60], border=1, ln=1)

    total_score = report_data["risk_assessment"]["risk_score"]
    pdf.set_font("Helvetica", "B", 8)
    pdf.cell(70, 5, "Total Dynamic Risk Score", border=1)
    pdf.cell(25, 5, f"{total_score} / 100", border=1, align="C")
    pdf.cell(95, 5, f"Classification: {report_data['risk_assessment']['risk_level']} (Confidence: {int(report_data['risk_assessment']['confidence']*100)}%)", border=1, ln=1)
    pdf.ln(3)

    # Section 5: Human-in-the-Loop Decision & Tamper-Evident Audit Record
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_text_color(2, 132, 199)
    pdf.cell(0, 6, "4. HUMAN-IN-THE-LOOP AUTHORIZATION & PERSISTENT AUDIT RECORD", ln=1)
    pdf.set_font("Helvetica", "", 8)
    pdf.set_text_color(30, 41, 59)

    audit = report_data.get("latest_audit_decision")
    if audit:
        pdf.cell(0, 5, f"Audit Record ID: {audit.get('audit_id')} | Decision: {audit.get('human_decision')} | Action: {audit.get('action')}", ln=1)
        pdf.cell(0, 5, f"Authorized Operator: {audit.get('operator')} | Timestamp: {audit.get('timestamp')}", ln=1)
        pdf.cell(0, 5, f"Enforcement Status: Simulated Enforcement Layer ({audit.get('execution_result')})", ln=1)
        if audit.get("event_hash"):
            pdf.set_font("Courier", "", 7)
            pdf.cell(0, 5, f"Cryptographic Event Hash (SHA-256): {audit.get('event_hash')}", ln=1)
            pdf.set_font("Helvetica", "", 8)
    else:
        pdf.cell(0, 5, "No formal action executed yet. Case is currently queued for Human Reviewer authorization.", ln=1)

    pdf.ln(4)
    # Section 6: Statutory Disclaimer
    pdf.set_font("Helvetica", "I", 7)
    pdf.set_text_color(100, 116, 139)
    pdf.multi_cell(0, 4, report_data["disclaimer"])

    # Return raw PDF bytes
    return bytes(pdf.output())
