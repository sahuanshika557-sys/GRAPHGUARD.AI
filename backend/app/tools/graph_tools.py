import logging
from typing import Dict, List, Any, Optional
from app.graph.engine import graph_engine
from app.services.audit_service import audit_service

logger = logging.getLogger("graphguard.tools")

def get_transaction(tx_id: str) -> Dict[str, Any]:
    """Retrieve full transaction details including amount, channel, timestamp, and status."""
    tx = graph_engine.get_transaction(tx_id)
    if not tx:
        return {"error": f"Transaction {tx_id} not found in graph database."}
    return tx

def get_account(account_id: str) -> Dict[str, Any]:
    """Retrieve account details including balance, currency, type, and status."""
    node = graph_engine.get_node(account_id)
    if not node or node.get("label") != "Account":
        return {"error": f"Account {account_id} not found in graph database."}
    return node

def get_customer(customer_id: str) -> Dict[str, Any]:
    """Retrieve customer profile including KYC status, phone, email, and risk rating."""
    node = graph_engine.get_node(customer_id)
    if not node or node.get("label") != "Customer":
        return {"error": f"Customer {customer_id} not found in graph database."}
    return node

def find_connected_accounts(tx_id: str) -> List[Dict[str, Any]]:
    """Traverse graph to find other accounts linked to this transaction via shared hardware or network."""
    return graph_engine.get_connected_accounts_multi_hop(tx_id)

def find_shared_devices(device_id: str) -> List[Dict[str, Any]]:
    """Find other accounts or sessions that have previously shared or logged into this device."""
    return graph_engine.get_shared_devices(device_id)

def find_related_ips(tx_id: str) -> Optional[Dict[str, Any]]:
    """Find the IP address node associated with this transaction."""
    return graph_engine.get_transaction_ip(tx_id)

def find_location(ip_id: str) -> Optional[Dict[str, Any]]:
    """Find the physical geo-location and geopolitical risk tier associated with an IP address."""
    return graph_engine.get_ip_location(ip_id)

def find_previous_incidents(tx_id: str) -> List[Dict[str, Any]]:
    """
    Multi-hop search: traverse connected accounts, devices, and syndicate links up to 4 hops
    to uncover prior fraud incidents, chargebacks, or law enforcement actions.
    """
    return graph_engine.find_all_incidents_connected_to_transaction(tx_id, max_depth=4)

def find_related_transactions(tx_id: str) -> List[Dict[str, Any]]:
    """Find other transactions executed by the originating account."""
    acc = graph_engine.get_transaction_account(tx_id)
    if not acc:
        return []
    txs = graph_engine.find_all_transactions()
    related = []
    for t in txs:
        if t["id"] != tx_id:
            t_acc = graph_engine.get_transaction_account(t["id"])
            if t_acc and t_acc["id"] == acc["id"]:
                related.append(t)
    return related

def calculate_risk(evidence: Dict[str, Any]) -> Dict[str, Any]:
    """
    Dynamic graph-based topological risk calculator.
    Evaluates:
    - Shared device with compromised/frozen account
    - Directly reachable critical incident within <=3 hops
    - Anonymized network (Tor exit node / VPN tunnel)
    - High-risk jurisdiction location (Tier 3)
    - Rooted or headless browser
    - Baseline transaction conformance
    Returns exact factors and point contributions that sum to risk_score.
    """
    factors = []
    findings = []

    # 1. Incident proximity
    incidents = evidence.get("incidents", [])
    if incidents:
        closest_hop = min([inc.get("hop_count", 4) for inc in incidents])
        critical_count = sum(1 for inc in incidents if inc.get("incident", {}).get("severity") == "CRITICAL")
        inc_id = incidents[0]["incident"]["id"]
        inc_type = incidents[0]["incident"].get("type", "FRAUD")

        if closest_hop <= 3 and critical_count > 0:
            pts = 35
            desc = f"Connected to prior critical fraud incident {inc_id} ({inc_type}) within {closest_hop} graph hops."
            factors.append({"factor": "Linked Fraud Incident", "contribution": pts, "evidence": desc, "severity": "CRITICAL"})
            findings.append(f"CRITICAL: {desc}")
        elif closest_hop <= 3:
            pts = 25
            desc = f"Connected to prior incident {inc_id} within {closest_hop} graph hops."
            factors.append({"factor": "Linked Fraud Incident", "contribution": pts, "evidence": desc, "severity": "HIGH"})
            findings.append(f"WARNING: {desc}")
        else:
            pts = 15
            desc = f"Connected to prior incident {inc_id} within {closest_hop} graph hops."
            factors.append({"factor": "Historical Incident Proximity", "contribution": pts, "evidence": desc, "severity": "MEDIUM"})
            findings.append(f"NOTICE: {desc}")

    # 2. Shared hardware with frozen/mule accounts
    connected_accs = evidence.get("connected_accounts", [])
    frozen_accs = [a for a in connected_accs if "FROZEN" in a.get("status", "") or "COMPROMISED" in a.get("status", "")]
    if frozen_accs:
        pts = 30
        desc = f"Execution hardware shared with frozen/sanctioned account {frozen_accs[0]['id']} ({frozen_accs[0].get('status')})."
        factors.append({"factor": "Shared Mule Hardware", "contribution": pts, "evidence": desc, "severity": "CRITICAL"})
        findings.append(f"CRITICAL: {desc}")
    elif connected_accs:
        pts = 15
        desc = f"Hardware fingerprint observed across {len(connected_accs)} other active account(s)."
        factors.append({"factor": "Cross-Account Hardware Reuse", "contribution": pts, "evidence": desc, "severity": "MEDIUM"})
        findings.append(desc)

    # 3. Network and Location Anomaly
    ip = evidence.get("ip")
    if ip:
        if ip.get("is_tor"):
            pts = 15
            desc = f"Request originated from known Tor exit node ({ip.get('id', 'N/A')})."
            factors.append({"factor": "Network Obfuscation (Tor)", "contribution": pts, "evidence": desc, "severity": "HIGH"})
            findings.append(f"Network obfuscation: {desc}")
        elif ip.get("is_vpn"):
            pts = 10
            desc = f"Request routed through commercial VPN gateway ({ip.get('isp', 'N/A')})."
            factors.append({"factor": "Network Proxy (VPN)", "contribution": pts, "evidence": desc, "severity": "MEDIUM"})
            findings.append(f"Network proxy: {desc}")

    # 4. Device integrity
    device = evidence.get("device")
    if device:
        if device.get("is_rooted"):
            pts = 10
            desc = f"Untrusted hardware signature: Rooted/jailbroken device detected ({device.get('type')})."
            factors.append({"factor": "Device Integrity Violation", "contribution": pts, "evidence": desc, "severity": "HIGH"})
            findings.append(desc)
        elif "Headless" in device.get("browser", ""):
            pts = 8
            desc = "Automated session signature: Headless browser fingerprint detected."
            factors.append({"factor": "Automated Browser Session", "contribution": pts, "evidence": desc, "severity": "MEDIUM"})
            findings.append(desc)

    # 5. Geopolitical Location Risk
    location = evidence.get("location")
    if location:
        tier = location.get("risk_tier", 1)
        if tier >= 3:
            pts = 8
            desc = f"Originating IP located in {location.get('city')}, {location.get('country')} (Tier {tier} High Risk)."
            factors.append({"factor": "High-Risk Jurisdiction", "contribution": pts, "evidence": desc, "severity": "HIGH"})
            findings.append(desc)
        elif tier == 2:
            pts = 5
            desc = f"Originating IP located in {location.get('city')}, {location.get('country')} (Tier {tier} Moderate Risk)."
            factors.append({"factor": "Moderate-Risk Jurisdiction", "contribution": pts, "evidence": desc, "severity": "MEDIUM"})
            findings.append(desc)

    # If clean transaction (no adverse factors), add baseline conform factor
    if not factors:
        pts = 5
        desc = "Originating from habitual customer device and verified residential network."
        factors.append({"factor": "Baseline Profile Conformance", "contribution": pts, "evidence": desc, "severity": "LOW"})
        findings.append("Clean transaction path: Originating from habitual customer device and verified residential IP.")

    # Calculate exact total from factors
    risk_score = sum(f["contribution"] for f in factors)
    risk_score = min(max(risk_score, 5), 98)

    if risk_score >= 75:
        risk_level = "HIGH"
        confidence = 0.94
    elif risk_score >= 45:
        risk_level = "MEDIUM"
        confidence = 0.85
    else:
        risk_level = "LOW"
        confidence = 0.92

    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "confidence": confidence,
        "findings": findings,
        "risk_factors": factors
    }

def recommend_action(risk_level: str, risk_score: int) -> Dict[str, str]:
    """Recommend next investigation or compliance action based on evaluated risk."""
    if risk_level == "HIGH" or risk_score >= 75:
        return {
            "recommended_action": "FLAG_TRANSACTION",
            "reason": "High probability of coordinated account takeover and syndicate wire fraud. Immediate transaction suspension and account lock recommended."
        }
    elif risk_level == "MEDIUM" or risk_score >= 45:
        return {
            "recommended_action": "MARK_FOR_REVIEW",
            "reason": "Moderate risk indicators detected (unusual VPN or payee). Secondary step-up authentication required."
        }
    else:
        return {
            "recommended_action": "NO_ACTION",
            "reason": "Normal transaction topology matching established baseline behavior. Proceed with straight-through processing."
        }

def flag_transaction(tx_id: str, reason: str) -> Dict[str, Any]:
    """Simulated action tool: Set transaction status to FLAGGED_FROZEN and alert AML response team."""
    tx = graph_engine.get_transaction(tx_id)
    if tx:
        tx["status"] = "FLAGGED_FROZEN"
    return {
        "action": "FLAG_TRANSACTION",
        "entity_id": tx_id,
        "status": "SUCCESS",
        "detail": f"Transaction {tx_id} has been intercepted, frozen, and queued in the AML high-priority triage console.",
        "reason": reason
    }

def create_investigation(entity_id: str, summary: str) -> Dict[str, Any]:
    """Simulated action tool: Open an official SAR / AML case file."""
    case_id = f"CASE-{tx_id_to_num(entity_id)}"
    return {
        "action": "CREATE_INVESTIGATION",
        "case_id": case_id,
        "entity_id": entity_id,
        "status": "OPEN",
        "summary": summary
    }

def get_audit_history(entity_id: str) -> List[Dict[str, Any]]:
    """Retrieve full historical audit log entries for a given entity."""
    return audit_service.get_records_for_entity(entity_id)

def tx_id_to_num(val: str) -> str:
    import re
    digits = re.sub(r"\D", "", val)
    return digits if digits else "999"

# Export tools registry for tool calling schemas
TOOLS_REGISTRY = {
    "get_transaction": get_transaction,
    "get_account": get_account,
    "get_customer": get_customer,
    "find_connected_accounts": find_connected_accounts,
    "find_shared_devices": find_shared_devices,
    "find_related_ips": find_related_ips,
    "find_location": find_location,
    "find_previous_incidents": find_previous_incidents,
    "find_related_transactions": find_related_transactions,
    "calculate_risk": calculate_risk,
    "recommend_action": recommend_action,
    "flag_transaction": flag_transaction,
    "create_investigation": create_investigation,
    "get_audit_history": get_audit_history
}
