from typing import Dict, List, Any

# Node Labels
LABEL_CUSTOMER = "Customer"
LABEL_ACCOUNT = "Account"
LABEL_TRANSACTION = "Transaction"
LABEL_DEVICE = "Device"
LABEL_IP = "IP"
LABEL_LOCATION = "Location"
LABEL_INCIDENT = "Incident"

# Relationship Types
REL_OWNS = "OWNS"
REL_MADE = "MADE"
REL_USED_DEVICE = "USED_DEVICE"
REL_FROM_IP = "FROM_IP"
REL_LOCATED_IN = "LOCATED_IN"
REL_ASSOCIATED_WITH = "ASSOCIATED_WITH"
REL_ASSOCIATED_WITH_IP = "ASSOCIATED_WITH_IP"
REL_HAS_INCIDENT = "HAS_INCIDENT"
REL_RELATED_TO = "RELATED_TO"
REL_SHARED_WITH = "SHARED_WITH"

NODE_TYPES_METADATA: Dict[str, Dict[str, Any]] = {
    LABEL_TRANSACTION: {
        "color": "#ec4899",      # Vibrant Pink / Rose
        "borderColor": "#f43f5e",
        "icon": "ArrowRightLeft",
        "primary_key": "id",
        "display_attr": "amount"
    },
    LABEL_ACCOUNT: {
        "color": "#3b82f6",      # Cyan / Royal Blue
        "borderColor": "#60a5fa",
        "icon": "CreditCard",
        "primary_key": "id",
        "display_attr": "type"
    },
    LABEL_CUSTOMER: {
        "color": "#8b5cf6",      # Purple
        "borderColor": "#a78bfa",
        "icon": "User",
        "primary_key": "id",
        "display_attr": "name"
    },
    LABEL_DEVICE: {
        "color": "#eab308",      # Gold / Amber
        "borderColor": "#fde047",
        "icon": "Laptop",
        "primary_key": "id",
        "display_attr": "type"
    },
    LABEL_IP: {
        "color": "#06b6d4",      # Cyan
        "borderColor": "#22d3ee",
        "icon": "Globe",
        "primary_key": "id",
        "display_attr": "ip_address"
    },
    LABEL_LOCATION: {
        "color": "#10b981",      # Emerald Green
        "borderColor": "#34d399",
        "icon": "MapPin",
        "primary_key": "id",
        "display_attr": "city"
    },
    LABEL_INCIDENT: {
        "color": "#ef4444",      # High Alert Red
        "borderColor": "#f87171",
        "icon": "AlertTriangle",
        "primary_key": "id",
        "display_attr": "severity"
    }
}
