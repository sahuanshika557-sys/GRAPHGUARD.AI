"""
Synthetic Deterministic Seed Data for GraphGuard AI.
Guaranteed to contain realistic financial crime entities,
benign baseline patterns, and the multi-hop suspicious path for TX-104.
"""

from typing import List, Dict, Any

SEED_NODES: List[Dict[str, Any]] = [
    # Customers
    {
        "label": "Customer",
        "id": "C101",
        "name": "Marcus Vance",
        "risk_rating": "LOW",
        "email": "marcus.v@primecorp.ca",
        "phone": "+1-416-555-0199",
        "created_at": "2021-04-12",
        "status": "VERIFIED_PRIMARY"
    },
    {
        "label": "Customer",
        "id": "C102",
        "name": "Aiden Brooks",
        "risk_rating": "LOW",
        "email": "aiden.b@aeronav.org",
        "phone": "+1-647-555-0144",
        "created_at": "2022-09-01",
        "status": "VERIFIED"
    },
    {
        "label": "Customer",
        "id": "C103",
        "name": "Sophia Lin",
        "risk_rating": "LOW",
        "email": "sophia.lin@biocare.io",
        "phone": "+1-514-555-0182",
        "created_at": "2023-01-15",
        "status": "VERIFIED"
    },
    {
        "label": "Customer",
        "id": "C104",
        "name": "Elena Rostova",
        "risk_rating": "HIGH",
        "email": "elena.r.shadow@proton.me",
        "phone": "+7-495-555-9011",
        "created_at": "2024-02-10",
        "status": "SANCTIONED_WATCHLIST"
    },

    # Accounts
    {
        "label": "Account",
        "id": "A501",
        "type": "PREMIER_CHECKING",
        "balance": 142500.0,
        "currency": "USD",
        "status": "ACTIVE",
        "branch": "Toronto Downtown Financial Core",
        "created_at": "2021-04-15"
    },
    {
        "label": "Account",
        "id": "A502",
        "type": "BUSINESS_PAYROLL",
        "balance": 389000.0,
        "currency": "USD",
        "status": "ACTIVE",
        "branch": "New York Wall St Branch",
        "created_at": "2022-09-10"
    },
    {
        "label": "Account",
        "id": "A102",
        "type": "SAVINGS_GROWTH",
        "balance": 45000.0,
        "currency": "USD",
        "status": "ACTIVE",
        "branch": "Montreal Old Port",
        "created_at": "2023-01-20"
    },
    {
        "label": "Account",
        "id": "A887",
        "type": "OFFSHORE_COMMERCIAL",
        "balance": 3200.0,
        "currency": "USD",
        "status": "FROZEN_COMPROMISED",
        "branch": "Cyprus International Clearing",
        "created_at": "2024-02-15"
    },
    {
        "label": "Account",
        "id": "A304",
        "type": "INTERNET_CHECKING",
        "balance": 12800.0,
        "currency": "USD",
        "status": "ACTIVE",
        "branch": "Digital Online Division",
        "created_at": "2023-05-18"
    },

    # Devices
    {
        "label": "Device",
        "id": "D12",
        "type": "iPhone 15 Pro",
        "os": "iOS 17.5",
        "browser": "Mobile Safari",
        "fingerprint": "fp_apple_89df2a",
        "is_rooted": False,
        "trust_score": 98
    },
    {
        "label": "Device",
        "id": "D55",
        "type": "MacBook Pro 16",
        "os": "macOS 14.2",
        "browser": "Chrome Canary / Headless",
        "fingerprint": "fp_mac_77ba01",
        "is_rooted": True,
        "trust_score": 12
    },
    {
        "label": "Device",
        "id": "D99",
        "type": "ThinkPad X1 Carbon",
        "os": "Windows 11 Pro",
        "browser": "Firefox 128",
        "fingerprint": "fp_win_44ac92",
        "is_rooted": False,
        "trust_score": 95
    },
    {
        "label": "Device",
        "id": "D44",
        "type": "Samsung Galaxy S24",
        "os": "Android 14",
        "browser": "Chrome Mobile",
        "fingerprint": "fp_droid_11bc33",
        "is_rooted": False,
        "trust_score": 88
    },

    # IPs
    {
        "label": "IP",
        "id": "IP-198-51-100-24",
        "ip_address": "198.51.100.24",
        "isp": "DarkTransit Global Transit",
        "is_vpn": True,
        "is_tor": True,
        "asn": "AS44512",
        "reputation": "MALICIOUS_TOR_EXIT"
    },
    {
        "label": "IP",
        "id": "IP-203-0-113-5",
        "ip_address": "203.0.113.5",
        "isp": "Bell Canada Residential",
        "is_vpn": False,
        "is_tor": False,
        "asn": "AS577",
        "reputation": "CLEAN_RESIDENTIAL"
    },
    {
        "label": "IP",
        "id": "IP-192-0-2-88",
        "ip_address": "192.0.2.88",
        "isp": "Verizon Fios Residential",
        "is_vpn": False,
        "is_tor": False,
        "asn": "AS812",
        "reputation": "CLEAN_RESIDENTIAL"
    },
    {
        "label": "IP",
        "id": "IP-198-18-0-12",
        "ip_address": "198.18.0.12",
        "isp": "NordSecure VPN Gateway",
        "is_vpn": True,
        "is_tor": False,
        "asn": "AS39351",
        "reputation": "COMMERCIAL_VPN"
    },

    # Locations
    {
        "label": "Location",
        "id": "LOC-TOR",
        "city": "Toronto",
        "country": "Canada",
        "latitude": 43.6532,
        "longitude": -79.3832,
        "risk_tier": 1,
        "tier_name": "LOW"
    },
    {
        "label": "Location",
        "id": "LOC-NYC",
        "city": "New York",
        "country": "United States",
        "latitude": 40.7128,
        "longitude": -74.0060,
        "risk_tier": 1,
        "tier_name": "LOW"
    },
    {
        "label": "Location",
        "id": "LOC-BERLIN",
        "city": "Berlin",
        "country": "Germany",
        "latitude": 52.5200,
        "longitude": 13.4050,
        "risk_tier": 2,
        "tier_name": "MEDIUM"
    },
    {
        "label": "Location",
        "id": "LOC-MOSCOW",
        "city": "Moscow",
        "country": "Russia",
        "latitude": 55.7558,
        "longitude": 37.6173,
        "risk_tier": 3,
        "tier_name": "HIGH_RISK_JURISDICTION"
    },

    # Incidents
    {
        "label": "Incident",
        "id": "F22",
        "type": "SYNDICATE_WIRE_FRAUD",
        "severity": "CRITICAL",
        "status": "CONFIRMED_FRAUD",
        "reported_date": "2024-11-04",
        "description": "Account Takeover syndicate orchestrated wire drain using compromised device D55 to unauthorized offshore accounts.",
        "loss_amount": 140000.0,
        "resolution": "Account frozen, law enforcement sub-poena issued"
    },
    {
        "label": "Incident",
        "id": "F09",
        "type": "CREDENTIAL_STUFFING",
        "severity": "MEDIUM",
        "status": "RESOLVED",
        "reported_date": "2024-06-12",
        "description": "Abnormal burst of login failures followed by unauthorized password reset attempt.",
        "loss_amount": 0.0,
        "resolution": "2FA enforced and cleared"
    },

    # Transactions
    {
        "label": "Transaction",
        "id": "TX-101",
        "amount": 120.00,
        "currency": "USD",
        "timestamp": "2026-10-15T10:14:00Z",
        "channel": "POS",
        "merchant": "Whole Foods Market",
        "status": "COMPLETED",
        "risk_baseline": "LOW"
    },
    {
        "label": "Transaction",
        "id": "TX-102",
        "amount": 2450.00,
        "currency": "USD",
        "timestamp": "2026-10-15T14:30:00Z",
        "channel": "ACH_CREDIT",
        "merchant": "Direct Deposit Corporate Payroll",
        "status": "COMPLETED",
        "risk_baseline": "LOW"
    },
    {
        "label": "Transaction",
        "id": "TX-103",
        "amount": 1850.00,
        "currency": "USD",
        "timestamp": "2026-10-16T09:12:00Z",
        "channel": "WEB",
        "merchant": "B&H Photo Video Electronics",
        "status": "COMPLETED",
        "risk_baseline": "LOW"
    },
    {
        "label": "Transaction",
        "id": "TX-104",
        "amount": 85000.00,
        "currency": "USD",
        "timestamp": "2026-10-17T02:45:00Z",
        "channel": "WIRE_TRANSFER",
        "merchant": "Swift Wire Escrow Express Corp",
        "status": "PENDING_VERIFICATION",
        "risk_baseline": "HIGH",
        "anomaly_flag": "RAPID_HIGH_VALUE_WIRE_OFF_HOURS"
    },
    {
        "label": "Transaction",
        "id": "TX-105",
        "amount": 9200.00,
        "currency": "USD",
        "timestamp": "2026-10-16T22:15:00Z",
        "channel": "FAST_WIRE",
        "merchant": "FinTech Vault Clearing",
        "status": "FLAGGED_FOR_REVIEW",
        "risk_baseline": "MEDIUM",
        "anomaly_flag": "NEW_PAYEE_OVER_LIMIT"
    }
]

SEED_RELATIONSHIPS: List[Dict[str, Any]] = [
    # Customer OWNS Account
    {"from": "C101", "to": "A501", "type": "OWNS", "props": {"since": "2021-04-12", "is_primary": True}},
    {"from": "C102", "to": "A502", "type": "OWNS", "props": {"since": "2022-09-01", "is_primary": True}},
    {"from": "C103", "to": "A102", "type": "OWNS", "props": {"since": "2023-01-15", "is_primary": True}},
    {"from": "C103", "to": "A304", "type": "OWNS", "props": {"since": "2023-05-18", "is_primary": False}},
    {"from": "C104", "to": "A887", "type": "OWNS", "props": {"since": "2024-02-10", "is_primary": True}},

    # Account MADE Transaction
    {"from": "A501", "to": "TX-101", "type": "MADE", "props": {"authorized": True}},
    {"from": "A502", "to": "TX-102", "type": "MADE", "props": {"authorized": True}},
    {"from": "A102", "to": "TX-103", "type": "MADE", "props": {"authorized": True}},
    {"from": "A501", "to": "TX-104", "type": "MADE", "props": {"authorized": False, "method": "REMOTE_INITIATED"}},
    {"from": "A304", "to": "TX-105", "type": "MADE", "props": {"authorized": True, "method": "ONLINE_PORTAL"}},

    # Transaction USED_DEVICE Device
    {"from": "TX-101", "to": "D12", "type": "USED_DEVICE", "props": {"client_version": "v4.2"}},
    {"from": "TX-102", "to": "D99", "type": "USED_DEVICE", "props": {"client_version": "v5.0"}},
    {"from": "TX-103", "to": "D99", "type": "USED_DEVICE", "props": {"client_version": "v5.0"}},
    {"from": "TX-104", "to": "D55", "type": "USED_DEVICE", "props": {"client_version": "v1.0-headless", "tampered": True}},
    {"from": "TX-105", "to": "D44", "type": "USED_DEVICE", "props": {"client_version": "v4.8"}},

    # Transaction FROM_IP IP
    {"from": "TX-101", "to": "IP-203-0-113-5", "type": "FROM_IP", "props": {"port": 54122}},
    {"from": "TX-102", "to": "IP-192-0-2-88", "type": "FROM_IP", "props": {"port": 49153}},
    {"from": "TX-103", "to": "IP-192-0-2-88", "type": "FROM_IP", "props": {"port": 51204}},
    {"from": "TX-104", "to": "IP-198-51-100-24", "type": "FROM_IP", "props": {"port": 9051, "proxy_detected": True}},
    {"from": "TX-105", "to": "IP-198-18-0-12", "type": "FROM_IP", "props": {"port": 1194, "vpn_tunnel": True}},

    # IP LOCATED_IN Location
    {"from": "IP-203-0-113-5", "to": "LOC-TOR", "type": "LOCATED_IN", "props": {"confidence": 0.99}},
    {"from": "IP-192-0-2-88", "to": "LOC-NYC", "type": "LOCATED_IN", "props": {"confidence": 0.98}},
    {"from": "IP-198-18-0-12", "to": "LOC-BERLIN", "type": "LOCATED_IN", "props": {"confidence": 0.92}},
    {"from": "IP-198-51-100-24", "to": "LOC-MOSCOW", "type": "LOCATED_IN", "props": {"confidence": 0.95, "sanctioned": True}},

    # Account ASSOCIATED_WITH Device (Habitual / Profile associations)
    {"from": "A501", "to": "D12", "type": "ASSOCIATED_WITH", "props": {"first_seen": "2021-04-15", "is_primary": True}},
    {"from": "A502", "to": "D99", "type": "ASSOCIATED_WITH", "props": {"first_seen": "2022-09-10", "is_primary": True}},
    {"from": "A102", "to": "D99", "type": "ASSOCIATED_WITH", "props": {"first_seen": "2023-01-20", "is_primary": True}},
    {"from": "A304", "to": "D44", "type": "ASSOCIATED_WITH", "props": {"first_seen": "2023-05-18", "is_primary": True}},

    # Account ASSOCIATED_WITH_IP IP
    {"from": "A501", "to": "IP-203-0-113-5", "type": "ASSOCIATED_WITH_IP", "props": {"frequency": "DAILY"}},
    {"from": "A502", "to": "IP-192-0-2-88", "type": "ASSOCIATED_WITH_IP", "props": {"frequency": "DAILY"}},

    # Account HAS_INCIDENT Incident
    {"from": "A887", "to": "F22", "type": "HAS_INCIDENT", "props": {"verified_by": "FinCEN_Liaison", "date": "2024-11-04"}},
    {"from": "A304", "to": "F09", "type": "HAS_INCIDENT", "props": {"verified_by": "SecOps", "date": "2024-06-12"}},

    # Device SHARED_WITH Account (The critical cross-account syndicate link)
    {"from": "D55", "to": "A887", "type": "SHARED_WITH", "props": {"session_count": 47, "last_active": "2024-11-03", "anomaly": "MULE_HARDWARE_REUSE"}},

    # Account ASSOCIATED_WITH Device (D55 also associated with A501 recently during attack)
    {"from": "A501", "to": "D55", "type": "ASSOCIATED_WITH", "props": {"first_seen": "2026-10-17", "is_primary": False, "anomaly": "NEW_UNRECOGNIZED_DEVICE"}},

    # Customer RELATED_TO Customer (Syndicate watchlist link)
    {"from": "C101", "to": "C104", "type": "RELATED_TO", "props": {"relationship": "SHARED_COMPROMISED_CREDENTIAL_CLUSTER", "confidence": 0.84}}
]
