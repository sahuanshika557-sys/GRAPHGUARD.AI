import sys
import os
from pathlib import Path

root_path = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(root_path))
sys.path.insert(0, str(root_path / "backend"))

from app.graph.engine import graph_engine
from app.graph.connection import db_manager

def main():
    print("=" * 60)
    print("GraphGuard AI — Graph Database Seeder")
    print("=" * 60)
    
    health = db_manager.check_health()
    print(f"FalkorDB Status: {'CONNECTED' if health['connected'] else 'OFFLINE (Local fallback active)'}")
    print(f"Host: {health['host']}:{health['port']}, Graph: {health['graph_name']}")
    
    print("\nSeeding entities and relationships...")
    graph_engine.initialize_graph()
    
    print(f"\n[OK] Seeding complete!")
    print(f"Total Nodes: {len(graph_engine.node_store)}")
    print(f"Total Relationships: {len(graph_engine.edge_store)}")
    print("Transactions seeded: TX-101, TX-102, TX-103, TX-104 (High-Risk Syndicate), TX-105")
    print("=" * 60)

if __name__ == "__main__":
    main()
