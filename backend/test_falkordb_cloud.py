import sys
from pathlib import Path

root_path = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_path))
sys.path.insert(0, str(root_path / "backend"))

from app.config import settings
from app.graph.connection import db_manager

print("=" * 60)
print("FALKORDB CLOUD CYPHER VERIFICATION")
print("=" * 60)

health = db_manager.check_health()
print(f"Health Status: {health['active_database']} (Connected: {health['connected']})")

g = db_manager.get_graph()

cypher_tx = "MATCH (t:Transaction {id: 'TX-104'}) RETURN t.id, t.amount, t.merchant, t.status"
res_tx = g.query(cypher_tx)
print("\n1. Transaction TX-104:")
for row in res_tx.result_set:
    print("  ", row)

cypher_path = (
    "MATCH (acc1:Account)-[:MADE]->(tx:Transaction {id: 'TX-104'})-[:USED_DEVICE]->(dev:Device)"
    "-[:SHARED_WITH]->(acc2:Account)-[:HAS_INCIDENT]->(inc:Incident) "
    "RETURN tx.id, acc1.id, dev.id, dev.type, acc2.id, inc.id, inc.loss_amount"
)
res_path = g.query(cypher_path)
print("\n2. Multi-hop Fraud Syndicate Path:")
for row in res_path.result_set:
    print("  ", row)

print("\n3. Graph Statistics in Cloud:")
nodes_res = g.query("MATCH (n) RETURN count(n)")
edges_res = g.query("MATCH ()-[r]->() RETURN count(r)")
print(f"  Nodes: {nodes_res.result_set[0][0]}")
print(f"  Edges: {edges_res.result_set[0][0]}")
print("=" * 60)
