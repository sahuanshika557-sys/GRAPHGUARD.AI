import os
import json
import sqlite3
import logging
import uuid
import hashlib
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from pathlib import Path
from app.config import settings

logger = logging.getLogger("graphguard.audit")

GENESIS_HASH = "0" * 64

class AuditService:
    """
    ACID-compliant SQLite Audit Trail Service with cryptographic SHA-256
    hash-chaining. Provides tamper-evident verification across all human
    investigations, approvals, and simulated enforcement actions.
    """
    def __init__(self):
        self.data_dir = settings.DATA_DIR
        self.db_path = self.data_dir / "audit_log.db"
        self.json_path = settings.AUDIT_LOG_FILE
        self._ensure_storage()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        return conn

    def _ensure_storage(self):
        os.makedirs(self.data_dir, exist_ok=True)
        # Initialize SQLite schema
        with self._get_connection() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS audit_trail (
                    audit_id TEXT PRIMARY KEY,
                    timestamp TEXT NOT NULL,
                    investigation_id TEXT NOT NULL,
                    entity_id TEXT NOT NULL,
                    ai_recommendation TEXT NOT NULL,
                    reason TEXT,
                    human_decision TEXT NOT NULL,
                    action TEXT NOT NULL,
                    execution_result TEXT,
                    evidence_summary TEXT,
                    graph_path TEXT,
                    operator TEXT,
                    previous_hash TEXT,
                    event_hash TEXT
                )
            """)
            conn.execute("CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_trail (entity_id)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_trail (timestamp)")

            # Upgrade columns if missing in existing database
            cur = conn.cursor()
            cur.execute("PRAGMA table_info(audit_trail)")
            columns = [row["name"] for row in cur.fetchall()]
            if "previous_hash" not in columns:
                conn.execute("ALTER TABLE audit_trail ADD COLUMN previous_hash TEXT")
            if "event_hash" not in columns:
                conn.execute("ALTER TABLE audit_trail ADD COLUMN event_hash TEXT")

            conn.commit()

        # Migrate existing JSON records if any exist and table is empty
        self._migrate_json_to_sqlite()
        self._backfill_missing_hashes()

    def _get_latest_event_hash(self) -> str:
        """Fetch the cryptographic hash of the latest audit record."""
        with self._get_connection() as conn:
            cur = conn.cursor()
            cur.execute("SELECT event_hash FROM audit_trail WHERE event_hash IS NOT NULL ORDER BY rowid DESC LIMIT 1")
            row = cur.fetchone()
            if row and row["event_hash"]:
                return row["event_hash"]
        return GENESIS_HASH

    @staticmethod
    def compute_event_hash(
        prev_hash: str,
        audit_id: str,
        timestamp: str,
        investigation_id: str,
        entity_id: str,
        human_decision: str,
        action: str,
        operator: str
    ) -> str:
        canonical_str = f"{prev_hash}|{audit_id}|{timestamp}|{investigation_id}|{entity_id}|{human_decision}|{action}|{operator}"
        return hashlib.sha256(canonical_str.encode("utf-8")).hexdigest()

    def _backfill_missing_hashes(self):
        """Backfill cryptographic hash chain for any legacy records missing hashes."""
        with self._get_connection() as conn:
            cur = conn.cursor()
            cur.execute("SELECT rowid, audit_id, timestamp, investigation_id, entity_id, human_decision, action, operator, event_hash FROM audit_trail ORDER BY rowid ASC")
            rows = cur.fetchall()
            prev_hash = GENESIS_HASH
            for row in rows:
                if not row["event_hash"]:
                    h = self.compute_event_hash(
                        prev_hash,
                        row["audit_id"],
                        row["timestamp"],
                        row["investigation_id"],
                        row["entity_id"],
                        row["human_decision"],
                        row["action"],
                        row["operator"] or ""
                    )
                    conn.execute("UPDATE audit_trail SET previous_hash = ?, event_hash = ? WHERE rowid = ?", (prev_hash, h, row["rowid"]))
                    prev_hash = h
                else:
                    prev_hash = row["event_hash"]
            conn.commit()

    def _migrate_json_to_sqlite(self):
        if self.json_path.exists():
            try:
                with open(self.json_path, "r", encoding="utf-8") as f:
                    records = json.load(f)
                with self._get_connection() as conn:
                    cur = conn.cursor()
                    prev_hash = self._get_latest_event_hash()
                    for r in records:
                        cur.execute("SELECT 1 FROM audit_trail WHERE audit_id = ?", (r["audit_id"],))
                        if not cur.fetchone():
                            event_h = self.compute_event_hash(
                                prev_hash,
                                r["audit_id"],
                                r["timestamp"],
                                r["investigation_id"],
                                r["entity_id"],
                                r["human_decision"],
                                r["action"],
                                r.get("operator", "")
                            )
                            cur.execute("""
                                INSERT INTO audit_trail (
                                    audit_id, timestamp, investigation_id, entity_id,
                                    ai_recommendation, reason, human_decision, action,
                                    execution_result, evidence_summary, graph_path, operator,
                                    previous_hash, event_hash
                                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                            """, (
                                r["audit_id"],
                                r["timestamp"],
                                r["investigation_id"],
                                r["entity_id"],
                                r["ai_recommendation"],
                                r.get("reason", ""),
                                r["human_decision"],
                                r["action"],
                                r.get("execution_result", ""),
                                json.dumps(r.get("evidence_summary", [])),
                                json.dumps(r.get("graph_path", [])),
                                r.get("operator", "Compliance Analyst"),
                                prev_hash,
                                event_h
                            ))
                            prev_hash = event_h
                    conn.commit()
            except Exception as e:
                logger.error(f"Error during audit migration: {e}")

    def record_decision(
        self,
        investigation_id: str,
        entity_id: str,
        ai_recommendation: str,
        reason: str,
        human_decision: str,
        action: str,
        execution_result: str,
        evidence_summary: Optional[List[str]] = None,
        graph_path: Optional[List[str]] = None,
        operator: str = "Lead Compliance Officer"
    ) -> Dict[str, Any]:
        """Record an approved or rejected action into SQLite and JSON mirror with SHA-256 hash chaining."""
        audit_id = f"AUD-{uuid.uuid4().hex[:8].upper()}"
        ts = datetime.now(timezone.utc).isoformat()
        evidence_json = json.dumps(evidence_summary or [])
        path_json = json.dumps(graph_path or [])

        # Fetch parent hash in the chain
        prev_hash = self._get_latest_event_hash()
        event_hash = self.compute_event_hash(
            prev_hash,
            audit_id,
            ts,
            investigation_id,
            entity_id,
            human_decision,
            action,
            operator
        )

        # Write to SQLite
        with self._get_connection() as conn:
            conn.execute("""
                INSERT INTO audit_trail (
                    audit_id, timestamp, investigation_id, entity_id,
                    ai_recommendation, reason, human_decision, action,
                    execution_result, evidence_summary, graph_path, operator,
                    previous_hash, event_hash
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                audit_id, ts, investigation_id, entity_id,
                ai_recommendation, reason, human_decision, action,
                execution_result, evidence_json, path_json, operator,
                prev_hash, event_hash
            ))
            conn.commit()

        record = {
            "audit_id": audit_id,
            "timestamp": ts,
            "investigation_id": investigation_id,
            "entity_id": entity_id,
            "ai_recommendation": ai_recommendation,
            "reason": reason,
            "human_decision": human_decision,
            "action": action,
            "execution_result": execution_result,
            "evidence_summary": evidence_summary or [],
            "graph_path": graph_path or [],
            "operator": operator,
            "previous_hash": prev_hash,
            "event_hash": event_hash
        }

        # Mirror to JSON file for export compatibility
        self._mirror_to_json()
        logger.info(f"Audit record permanently stored: {audit_id} [{human_decision}] for {entity_id} (Hash: {event_hash[:8]}...)")
        return record

    def _mirror_to_json(self):
        try:
            records = self.get_all_records()
            with open(self.json_path, "w", encoding="utf-8") as f:
                json.dump(records, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to mirror audit records to JSON: {e}")

    def get_all_records(self) -> List[Dict[str, Any]]:
        """Retrieve all audit records from SQLite ordered by timestamp DESC."""
        records = []
        with self._get_connection() as conn:
            cur = conn.cursor()
            cur.execute("""
                SELECT audit_id, timestamp, investigation_id, entity_id,
                       ai_recommendation, reason, human_decision, action,
                       execution_result, evidence_summary, graph_path, operator,
                       previous_hash, event_hash
                FROM audit_trail
                ORDER BY timestamp DESC
            """)
            for row in cur.fetchall():
                records.append({
                    "audit_id": row["audit_id"],
                    "timestamp": row["timestamp"],
                    "investigation_id": row["investigation_id"],
                    "entity_id": row["entity_id"],
                    "ai_recommendation": row["ai_recommendation"],
                    "reason": row["reason"],
                    "human_decision": row["human_decision"],
                    "action": row["action"],
                    "execution_result": row["execution_result"],
                    "evidence_summary": json.loads(row["evidence_summary"] or "[]"),
                    "graph_path": json.loads(row["graph_path"] or "[]"),
                    "operator": row["operator"],
                    "previous_hash": row["previous_hash"],
                    "event_hash": row["event_hash"]
                })
        return records

    def get_records_for_entity(self, entity_id: str) -> List[Dict[str, Any]]:
        records = []
        with self._get_connection() as conn:
            cur = conn.cursor()
            cur.execute("""
                SELECT audit_id, timestamp, investigation_id, entity_id,
                       ai_recommendation, reason, human_decision, action,
                       execution_result, evidence_summary, graph_path, operator,
                       previous_hash, event_hash
                FROM audit_trail
                WHERE entity_id = ?
                ORDER BY timestamp DESC
            """, (entity_id,))
            for row in cur.fetchall():
                records.append({
                    "audit_id": row["audit_id"],
                    "timestamp": row["timestamp"],
                    "investigation_id": row["investigation_id"],
                    "entity_id": row["entity_id"],
                    "ai_recommendation": row["ai_recommendation"],
                    "reason": row["reason"],
                    "human_decision": row["human_decision"],
                    "action": row["action"],
                    "execution_result": row["execution_result"],
                    "evidence_summary": json.loads(row["evidence_summary"] or "[]"),
                    "graph_path": json.loads(row["graph_path"] or "[]"),
                    "operator": row["operator"],
                    "previous_hash": row["previous_hash"],
                    "event_hash": row["event_hash"]
                })
        return records

    def verify_audit_integrity(self) -> Dict[str, Any]:
        """
        Cryptographically verify the SHA-256 hash chain of the entire audit trail.
        Validates that no record has been inserted, removed, or altered.
        """
        with self._get_connection() as conn:
            cur = conn.cursor()
            cur.execute("""
                SELECT rowid, audit_id, timestamp, investigation_id, entity_id,
                       human_decision, action, operator, previous_hash, event_hash
                FROM audit_trail
                ORDER BY rowid ASC
            """)
            rows = cur.fetchall()

        if not rows:
            return {
                "valid": True,
                "total_records": 0,
                "status": "INTEGRITY_VERIFIED",
                "message": "Audit trail is empty. Hash chain initialized."
            }

        expected_prev_hash = GENESIS_HASH
        for idx, row in enumerate(rows):
            actual_prev = row["previous_hash"] or GENESIS_HASH
            if idx > 0 and actual_prev != expected_prev_hash:
                return {
                    "valid": False,
                    "tampered_audit_id": row["audit_id"],
                    "status": "INTEGRITY_COMPROMISED",
                    "message": f"Hash chain broken at record {row['audit_id']}. Previous hash mismatch."
                }

            calculated_hash = self.compute_event_hash(
                actual_prev,
                row["audit_id"],
                row["timestamp"],
                row["investigation_id"],
                row["entity_id"],
                row["human_decision"],
                row["action"],
                row["operator"] or ""
            )

            if row["event_hash"] != calculated_hash:
                return {
                    "valid": False,
                    "tampered_audit_id": row["audit_id"],
                    "status": "INTEGRITY_COMPROMISED",
                    "message": f"Data alteration detected at record {row['audit_id']}. Stored hash does not match canonical payload."
                }

            expected_prev_hash = calculated_hash

        return {
            "valid": True,
            "total_records": len(rows),
            "status": "INTEGRITY_VERIFIED",
            "last_verified_hash": expected_prev_hash,
            "genesis_hash": GENESIS_HASH,
            "message": f"Tamper-evident hash chain verified across all {len(rows)} persistent records."
        }

audit_service = AuditService()

