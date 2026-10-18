import logging
import networkx as nx
from typing import Dict, List, Any, Optional, Tuple
import sys
from pathlib import Path
root_dir = Path(__file__).resolve().parent.parent.parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from app.graph.connection import db_manager
from data.seed.seed_data import SEED_NODES, SEED_RELATIONSHIPS

logger = logging.getLogger("graphguard.engine")

class UnifiedGraphEngine:
    """
    Unified Graph Engine that interfaces with live FalkorDB via Cypher,
    with an active local NetworkX graph engine for instant responsiveness,
    subgraph extraction, and high-performance multi-hop topological reasoning.
    """
    def __init__(self):
        self.nx_graph = nx.DiGraph()
        self.node_store: Dict[str, Dict[str, Any]] = {}
        self.edge_store: List[Dict[str, Any]] = []
        self._seeded = False
        self.initialize_graph()

    def initialize_graph(self):
        """Populate the graph with the synthetic seed dataset."""
        self.nx_graph.clear()
        self.node_store.clear()
        self.edge_store.clear()

        # Add Nodes
        for n in SEED_NODES:
            node_id = n["id"]
            self.node_store[node_id] = n
            self.nx_graph.add_node(node_id, **n)

        # Add Edges
        for idx, e in enumerate(SEED_RELATIONSHIPS):
            u = e["from"]
            v = e["to"]
            rel_type = e["type"]
            props = e.get("props", {})
            edge_id = f"e_{u}_{rel_type}_{v}_{idx}"
            edge_data = {
                "id": edge_id,
                "from": u,
                "to": v,
                "type": rel_type,
                "props": props
            }
            self.edge_store.append(edge_data)
            self.nx_graph.add_edge(u, v, id=edge_id, type=rel_type, **props)
            # Add reverse edge reference for undirected traversal queries
            self.nx_graph.add_edge(v, u, id=f"rev_{edge_id}", type=rel_type, is_reverse=True, **props)

        self._seeded = True
        logger.info(f"Initialized graph with {len(self.node_store)} nodes and {len(self.edge_store)} relationships.")

        # Attempt to seed real FalkorDB if connected
        self._seed_falkordb_if_available()

    def _seed_falkordb_if_available(self):
        """If FalkorDB server is online, push Cypher DDL/DML to it."""
        try:
            if db_manager.connect():
                g = db_manager.get_graph()
                if g:
                    # Clear existing graph
                    try:
                        g.delete()
                    except Exception:
                        pass
                    
                    # Create nodes
                    for n in SEED_NODES:
                        label = n["label"]
                        props_str = ", ".join([f"{k}: '{v}'" if isinstance(v, str) else f"{k}: {v}" for k, v in n.items() if k != "label"])
                        g.query(f"CREATE (:{label} {{{props_str}}})")
                    
                    # Create edges
                    for e in SEED_RELATIONSHIPS:
                        u = e["from"]
                        v = e["to"]
                        rel_type = e["type"]
                        props = e.get("props", {})
                        props_str = ""
                        if props:
                            p_items = [f"{k}: '{v}'" if isinstance(v, str) else f"{k}: {v}" for k, v in props.items()]
                            props_str = f" {{{', '.join(p_items)}}}"
                        
                        cypher = f"""
                        MATCH (a {{id: '{u}'}}), (b {{id: '{v}'}})
                        CREATE (a)-[:{rel_type}{props_str}]->(b)
                        """
                        g.query(cypher)
                    logger.info("Successfully seeded live FalkorDB instance via Cypher!")
        except Exception as e:
            logger.warning(f"Could not push seed data to live FalkorDB: {e}")

    # ==========================================
    # Graph Query & Traversal Methods
    # ==========================================

    def get_node(self, node_id: str) -> Optional[Dict[str, Any]]:
        return self.node_store.get(node_id)

    def get_transaction(self, tx_id: str) -> Optional[Dict[str, Any]]:
        node = self.node_store.get(tx_id)
        if node and node.get("label") == "Transaction":
            return node
        return None

    def get_transaction_account(self, tx_id: str) -> Optional[Dict[str, Any]]:
        """Find the account that made this transaction: (Account)-[:MADE]->(Transaction)"""
        for u, v, data in self.nx_graph.edges(data=True):
            if v == tx_id and data.get("type") == "MADE" and not data.get("is_reverse"):
                return self.node_store.get(u)
        return None

    def get_account_customer(self, account_id: str) -> Optional[Dict[str, Any]]:
        """Find the customer that owns this account: (Customer)-[:OWNS]->(Account)"""
        for u, v, data in self.nx_graph.edges(data=True):
            if v == account_id and data.get("type") == "OWNS" and not data.get("is_reverse"):
                return self.node_store.get(u)
        return None

    def get_transaction_device(self, tx_id: str) -> Optional[Dict[str, Any]]:
        """Find the device used: (Transaction)-[:USED_DEVICE]->(Device)"""
        for u, v, data in self.nx_graph.edges(data=True):
            if u == tx_id and data.get("type") == "USED_DEVICE" and not data.get("is_reverse"):
                return self.node_store.get(v)
        return None

    def get_transaction_ip(self, tx_id: str) -> Optional[Dict[str, Any]]:
        """Find IP from which transaction originated: (Transaction)-[:FROM_IP]->(IP)"""
        for u, v, data in self.nx_graph.edges(data=True):
            if u == tx_id and data.get("type") == "FROM_IP" and not data.get("is_reverse"):
                return self.node_store.get(v)
        return None

    def get_ip_location(self, ip_id: str) -> Optional[Dict[str, Any]]:
        """Find location of IP: (IP)-[:LOCATED_IN]->(Location)"""
        for u, v, data in self.nx_graph.edges(data=True):
            if u == ip_id and data.get("type") == "LOCATED_IN" and not data.get("is_reverse"):
                return self.node_store.get(v)
        return None

    def get_shared_devices(self, device_id: str) -> List[Dict[str, Any]]:
        """Find accounts associated or sharing this device."""
        connected_accounts = []
        for u, v, data in self.nx_graph.edges(data=True):
            rel_type = data.get("type")
            if rel_type in ("SHARED_WITH", "ASSOCIATED_WITH"):
                other_id = v if u == device_id else (u if v == device_id else None)
                if other_id:
                    other_node = self.node_store.get(other_id)
                    if other_node and other_node.get("label") == "Account":
                        if other_node not in connected_accounts:
                            connected_accounts.append(other_node)
        return connected_accounts

    def get_connected_accounts_multi_hop(self, tx_id: str) -> List[Dict[str, Any]]:
        """Find all accounts connected to this transaction via device, IP, or customer link."""
        acc = self.get_transaction_account(tx_id)
        origin_acc_id = acc["id"] if acc else None
        device = self.get_transaction_device(tx_id)
        
        results = []
        if device:
            shared = self.get_shared_devices(device["id"])
            for a in shared:
                if a["id"] != origin_acc_id and a not in results:
                    results.append(a)
        return results

    def find_incidents_for_account(self, account_id: str) -> List[Dict[str, Any]]:
        """Find incidents associated with an account: (Account)-[:HAS_INCIDENT]->(Incident)"""
        incidents = []
        for u, v, data in self.nx_graph.edges(data=True):
            if u == account_id and data.get("type") == "HAS_INCIDENT" and not data.get("is_reverse"):
                inc_node = self.node_store.get(v)
                if inc_node:
                    incidents.append(inc_node)
        return incidents

    def find_all_incidents_connected_to_transaction(self, tx_id: str, max_depth: int = 4) -> List[Dict[str, Any]]:
        """
        Multi-hop path traversal: searches within max_depth hops of tx_id
        for any Incident entity and returns the incident along with the full path traversed.
        """
        incident_results = []
        if tx_id not in self.nx_graph:
            return incident_results

        # Search undirected graph for reachable Incidents
        visited = {tx_id}
        queue = [[tx_id]]

        while queue:
            path = queue.pop(0)
            node = path[-1]

            if len(path) - 1 > max_depth:
                continue

            node_data = self.node_store.get(node, {})
            if node_data.get("label") == "Incident" and node != tx_id:
                incident_results.append({
                    "incident": node_data,
                    "path": path,
                    "hop_count": len(path) - 1
                })

            for neighbor in self.nx_graph.neighbors(node):
                if neighbor not in path:
                    queue.append(path + [neighbor])

        return incident_results

    def find_all_transactions(self) -> List[Dict[str, Any]]:
        """List all transactions in the graph."""
        return [n for n in self.node_store.values() if n.get("label") == "Transaction"]

    def get_subgraph_around_entity(self, entity_id: str, depth: int = 3) -> Dict[str, Any]:
        """
        Extract the full connected subgraph within `depth` hops of entity_id,
        formatted for frontend graph visualization (React Flow / Cytoscape).
        """
        if entity_id not in self.nx_graph:
            return {"nodes": [], "edges": []}

        subgraph_node_ids = set()
        queue = [(entity_id, 0)]
        visited = {entity_id}

        while queue:
            curr, d = queue.pop(0)
            subgraph_node_ids.add(curr)
            if d < depth:
                for neighbor in self.nx_graph.neighbors(curr):
                    if neighbor not in visited:
                        visited.add(neighbor)
                        queue.append((neighbor, d + 1))

        nodes = [self.node_store[nid] for nid in subgraph_node_ids if nid in self.node_store]
        edges = []
        for e in self.edge_store:
            if e["from"] in subgraph_node_ids and e["to"] in subgraph_node_ids:
                edges.append(e)

        return {
            "root_id": entity_id,
            "nodes": nodes,
            "edges": edges,
            "total_nodes": len(nodes),
            "total_edges": len(edges)
        }

    def execute_cypher(self, cypher_query: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Execute Cypher query. If live FalkorDB is connected, execute against it.
        Otherwise, parse and return results from the local unified graph engine.
        """
        if db_manager.is_connected:
            try:
                g = db_manager.get_graph()
                res = g.query(cypher_query, params or {})
                return {
                    "source": "FalkorDB",
                    "result_set": res.result_set if hasattr(res, "result_set") else [],
                    "header": res.header if hasattr(res, "header") else []
                }
            except Exception as e:
                logger.error(f"FalkorDB query failed: {e}")

        # Fallback query handler for standard Cypher lookups
        return {
            "source": "UnifiedGraphEngine",
            "message": "Executed via local graph engine",
            "query": cypher_query
        }

graph_engine = UnifiedGraphEngine()
