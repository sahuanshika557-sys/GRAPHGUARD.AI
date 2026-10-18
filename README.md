# GraphGuard AI 🛡️

> **"Don't Just Detect the Anomaly. Follow the Connections."**

**GRAPH Hacks 2026** — *Track 01: Agents That Act on Connected Data*

[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.12%20%7C%203.13-3776AB?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.121-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![FalkorDB](https://img.shields.io/badge/FalkorDB-Cypher%20Graph%20Layer-FF4438?logo=redis&logoColor=white)](https://falkordb.com)
[![Groq](https://img.shields.io/badge/Groq%20AI-Llama%20%7C%20Qwen-F55036?logo=speedtest&logoColor=white)](https://groq.com)
[![React](https://img.shields.io/badge/React%2019-Vite-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![React Flow](https://img.shields.io/badge/React%20Flow-Interactive%20Graph-FF0072?logo=diagram&logoColor=white)](https://reactflow.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4.0-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

---

## 1. Executive Summary

Traditional fraud and AML (Anti-Money Laundering) detection platforms evaluate transactions in isolation using tabular heuristics or rigid machine-learning thresholds. Sophisticated fraud syndicates exploit this blind spot through **Account Takeover (ATO)**, **synthetic identities**, **mule hardware reuse**, and **multi-hop money laundering paths**.

**GraphGuard AI** is an autonomous, graph-first AI investigation console. Instead of treating an anomalous transaction as a standalone data point, GraphGuard AI queries **FalkorDB** as a high-speed, connected-data context layer. The agent executes multi-hop Cypher traversals, calculates topological risk from real graph evidence, explains its reasoning with an integrated LLM (Groq / OpenAI / Gemini), and requires **Human-in-the-Loop** verification before executing actions into an immutable audit trail.

---

## 2. Target Architecture

```
                      ┌──────────────────────────────────────┐
                      │    React 19 + Vite + Tailwind CSS    │
                      │    Interactive React Flow Canvas     │
                      └──────────────────┬───────────────────┘
                                         │  (SSE Streaming & REST)
                                         ▼
                      ┌──────────────────────────────────────┐
                      │       FastAPI Backend Server         │
                      │      (Python 3.11 - 3.13)            │
                      └──────────────────┬───────────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
   ┌───────────────────────────┐                   ┌───────────────────────────┐
   │    GraphGuard AI Agent    │                   │   FalkorDB Graph Engine   │
   │  - Multi-Hop Reasoner     │                   │  - Low-Latency Cypher     │
   │  - Groq / OpenAI LLM      │ ◄─ Cypher Query ─►│  - Topological Indexing   │
   │  - Tool-Calling Registry  │                   │  - 7 Entity Types         │
   └─────────────┬─────────────┘                   └───────────────────────────┘
                 │
                 ▼
   ┌───────────────────────────┐
   │ Human-in-the-Loop Check   │
   │  - Approve / Reject Gate  │
   │  - Automated Audit Trail  │
   └───────────────────────────┘
```

---

## 3. Graph Data Model

GraphGuard AI models financial networks using 7 entity labels and 10 relationship types:

### Entities (Nodes)
1. **`Customer`**: Identity, KYC status, risk rating, email, phone.
2. **`Account`**: Checking, savings, or offshore accounts; balance, status (ACTIVE, FROZEN, COMPROMISED).
3. **`Transaction`**: Amount, timestamp, merchant, transfer channel (WIRE, ACH, POS), status.
4. **`Device`**: Hardware fingerprint, OS, browser, jailbreak/root status, trust score.
5. **`IP`**: IP address, ISP, VPN status, Tor exit node detection, ASN.
6. **`Location`**: City, country, coordinates, AML geopolitical risk tier (Tier 1 to 3).
7. **`Incident`**: Historical fraud cases, chargebacks, SAR filings, loss amounts.

### Relationships (Edges)
- `(:Customer)-[:OWNS]->(:Account)`
- `(:Account)-[:MADE]->(:Transaction)`
- `(:Transaction)-[:USED_DEVICE]->(:Device)`
- `(:Transaction)-[:FROM_IP]->(:IP)`
- `(:IP)-[:LOCATED_IN]->(:Location)`
- `(:Account)-[:ASSOCIATED_WITH]->(:Device)`
- `(:Account)-[:ASSOCIATED_WITH_IP]->(:IP)`
- `(:Account)-[:HAS_INCIDENT]->(:Incident)`
- `(:Customer)-[:RELATED_TO]->(:Customer)`
- `(:Device)-[:SHARED_WITH]->(:Account)`

---

## 4. The Primary Demo: Investigating `TX-104`

`TX-104` is a deterministic synthetic demo transaction of **$85,000.00** via `WIRE_TRANSFER` at 02:45 AM.

### Autonomous Graph Discovery
1. **Transaction Identified**: `TX-104` belongs to Account `A501` (Customer `C101` — Marcus Vance).
2. **Device Analysis**: `TX-104` was submitted from Device `D55` (MacBook Pro 16 running Headless Chrome, `is_rooted=True`).
3. **Shared Mule Hardware**: Device `D55` is shared with Account `A887` (Elena Rostova, status `FROZEN_COMPROMISED`).
4. **Prior Incident Link**: Account `A887` is directly linked via `HAS_INCIDENT` to Incident `F22` (*"Account Takeover wire fraud syndicate cash-out, $140,000 loss"*).
5. **Network Obfuscation**: Originated from `IP-198-51-100-24` (Tor exit node, commercial VPN) in `LOC-MOSCOW` (Tier 3 High Risk).

### Discovered Multi-Hop Topological Path:
```
TX-104 ──> Account A501 ──> Device D55 ──> Account A887 ──> Incident F22
```

### Risk Calculation & Action:
- **Risk Score**: `98/100` (HIGH RISK)
- **Confidence**: `94%`
- **Recommendation**: `FLAG_TRANSACTION`
- **Human Gate**: Execution is paused until an authorized AML Compliance Officer approves the action.
- **Audit Persistence**: Generates a permanent record with Audit ID, timestamp, operator signature, and execution outcome.

---

## 5. Agent Tools Registry

The agent operates on a comprehensive graph tool library:

| Tool Name | Cypher / Graph Operation | Purpose |
| :--- | :--- | :--- |
| `get_transaction` | `MATCH (t:Transaction {id: $id}) RETURN t` | Lookup transaction details |
| `get_account` | `MATCH (a:Account {id: $id}) RETURN a` | Resolve account balance & status |
| `get_customer` | `MATCH (c:Customer)-[:OWNS]->(a:Account)` | Retrieve KYC identity profile |
| `find_connected_accounts` | `MATCH (t)-[:USED_DEVICE]->(d)-[:SHARED_WITH]-(a)` | Detect mule account clusters |
| `find_shared_devices` | `MATCH (d:Device {id: $id})-[:SHARED_WITH]-(a)` | Check hardware cross-pollination |
| `find_related_ips` | `MATCH (t)-[:FROM_IP]->(ip:IP)` | Retrieve network endpoint telemetry |
| `find_location` | `MATCH (ip)-[:LOCATED_IN]->(loc:Location)` | Evaluate geopolitical sanction risk |
| `find_previous_incidents` | `MATCH path = (t)-[*1..4]-(inc:Incident)` | 1-to-4 hop historical incident search |
| `find_related_transactions`| `MATCH (t)<-[:MADE]-(a)-[:MADE]->(t2)` | Check account transaction history |
| `calculate_risk` | Topological Graph Feature Extractor | Computes dynamic risk score (0-100) |
| `recommend_action` | Action Decision Tree | Determines compliance triage action |
| `flag_transaction` | Transaction State Machine | Intercepts & freezes transaction |
| `create_investigation` | SAR Case Manager | Generates formal investigation docket |
| `get_audit_history` | Audit Service | Fetches immutable audit trail entries |

---

## 6. Quick Start & Setup

### Prerequisites
- Python 3.11, 3.12, or 3.13
- Node.js 18+ and npm
- (Optional) Docker & Docker Compose for local FalkorDB container

### 1. Clone & Configure Environment
```bash
git clone https://github.com/your-org/graphguard-ai.git
cd "graphguard-ai"

# Copy environment template
cp .env.example .env
```

Edit `.env` with your preferred credentials:
```ini
# FalkorDB Connection (Cloud or Local Docker)
FALKORDB_HOST=localhost
FALKORDB_PORT=6379
FALKORDB_USERNAME=
FALKORDB_PASSWORD=
FALKORDB_GRAPH_NAME=graphguard

# Server
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000

# LLM Provider (groq, openai, gemini, or builtin)
LLM_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key_here
LLM_MODEL=qwen/qwen3.8-27b
```

### 2. Start FalkorDB via Docker Compose (Optional)
```bash
docker compose up -d falkordb
```
> *Note: If running without Docker or when FalkorDB is offline, GraphGuard AI's active local graph engine automatically runs all Cypher queries and multi-hop traversals.*

### 3. Seed the Graph Database
```bash
python data/seed/run_seed.py
```

### 4. Run Backend Server
```bash
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API docs available at: `http://127.0.0.1:8000/docs`

### 5. Run Frontend Application
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 7. Automated Testing Suite

GraphGuard AI includes an automated integration test suite covering graph traversals, agent tools, API endpoints, approval gates, and audit trails:

```bash
python -m pytest tests/test_backend.py -v
```

### Test Coverage:
- `test_health_endpoint`: Validates health status and graph topology size.
- `test_list_transactions`: Confirms synthetic transactions are seeded.
- `test_get_transaction_tx104`: Validates property schema and account mapping.
- `test_graph_multi_hop_traversal_tx104`: Asserts 4-hop discovery of Incident `F22`.
- `test_risk_calculation_tx104`: Verifies dynamic risk score $\ge 75$ (HIGH).
- `test_investigate_api_tx104`: Tests synchronous API investigation pipeline.
- `test_investigate_api_normal_tx101`: Validates straight-through low-risk clearance.
- `test_human_approval_and_audit_trail`: Verifies approval gate, execution, and persistent logging.

---

## 8. Secrets & Security Protection

- **Zero Secret Leakage**: No API keys, passwords, or cloud credentials are bundled into the frontend JavaScript build.
- **Server-Side Proxy**: All LLM and FalkorDB operations execute exclusively within the Python backend.
- **Human-in-the-Loop Safeguard**: Autonomous agents are restricted from modifying financial transaction states without explicit human cryptographic / signature confirmation.

---

## 9. License

Developed for **GRAPH Hacks 2026**. Licensed under the Apache 2.0 License.
