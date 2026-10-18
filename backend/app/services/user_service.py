import os
import uuid
import sqlite3
import logging
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from pathlib import Path

import argon2
from argon2.exceptions import VerifyMismatchError, InvalidHashError

from app.config import settings

logger = logging.getLogger("graphguard.security")

# Initialize Argon2 Password Hasher (Argon2id default)
ph = argon2.PasswordHasher(
    time_cost=3,
    memory_cost=65536,
    parallelism=4,
    hash_len=32,
    type=argon2.Type.ID
)

def hash_password(password: str) -> str:
    """Hash password securely using Argon2id."""
    return ph.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against Argon2id hash."""
    try:
        return ph.verify(hashed_password, plain_password)
    except (VerifyMismatchError, InvalidHashError):
        return False
    except Exception as e:
        logger.error(f"Password verification error: {e}")
        return False

class UserService:
    """
    Manages user accounts, Argon2id credentials, roles,
    and security event logging in SQLite.
    """
    def __init__(self):
        self.db_path = settings.DATA_DIR / "audit_log.db"
        self._ensure_tables()
        self._bootstrap_default_users()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        return conn

    def _ensure_tables(self):
        os.makedirs(settings.DATA_DIR, exist_ok=True)
        with self._get_connection() as conn:
            # Users table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    email TEXT UNIQUE NOT NULL,
                    name TEXT NOT NULL,
                    password_hash TEXT NOT NULL,
                    role TEXT NOT NULL,
                    is_active INTEGER NOT NULL DEFAULT 1,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
            """)
            conn.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)")

            # Security audit events table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS security_audit_events (
                    event_id TEXT PRIMARY KEY,
                    event_type TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    user_email TEXT,
                    user_role TEXT,
                    transaction_id TEXT,
                    status TEXT NOT NULL,
                    details TEXT
                )
            """)
            conn.execute("CREATE INDEX IF NOT EXISTS idx_sec_timestamp ON security_audit_events (timestamp)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_sec_event_type ON security_audit_events (event_type)")
            conn.commit()

    def _bootstrap_default_users(self):
        """Bootstrap default role users with Argon2id hashed passwords if users table is empty."""
        with self._get_connection() as conn:
            cur = conn.cursor()
            cur.execute("SELECT count(*) as count FROM users")
            count = cur.fetchone()["count"]

            if count == 0:
                logger.info("Initializing default role accounts with Argon2id encryption...")
                now = datetime.now(timezone.utc).isoformat()
                
                default_users = [
                    {
                        "id": "USR-ADMIN-01",
                        "email": settings.ADMIN_EMAIL,
                        "name": "Anshika Sahu (Admin Lead)",
                        "password": settings.ADMIN_PASSWORD,
                        "role": "ADMIN"
                    },
                    {
                        "id": "USR-ANALYST-01",
                        "email": settings.ANALYST_EMAIL,
                        "name": "Marcus Vance (AML Analyst)",
                        "password": settings.ANALYST_PASSWORD,
                        "role": "ANALYST"
                    },
                    {
                        "id": "USR-REVIEWER-01",
                        "email": settings.REVIEWER_EMAIL,
                        "name": "Elena Rostova (Executive Reviewer)",
                        "password": settings.REVIEWER_PASSWORD,
                        "role": "REVIEWER"
                    },
                    {
                        "id": "USR-VIEWER-01",
                        "email": settings.VIEWER_EMAIL,
                        "name": "Audit Observer (Read-Only)",
                        "password": settings.VIEWER_PASSWORD,
                        "role": "VIEWER"
                    }
                ]

                for u in default_users:
                    pw_hash = hash_password(u["password"])
                    conn.execute("""
                        INSERT INTO users (id, email, name, password_hash, role, is_active, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, 1, ?, ?)
                    """, (u["id"], u["email"].lower(), u["name"], pw_hash, u["role"], now, now))
                
                conn.commit()
                logger.info(f"Successfully bootstrapped {len(default_users)} default role accounts.")

    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            cur = conn.cursor()
            cur.execute("SELECT * FROM users WHERE email = ?", (email.lower().strip(),))
            row = cur.fetchone()
            if row:
                return dict(row)
        return None

    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            cur = conn.cursor()
            cur.execute("SELECT * FROM users WHERE id = ?", (user_id,))
            row = cur.fetchone()
            if row:
                return dict(row)
        return None

    def list_users(self) -> List[Dict[str, Any]]:
        users = []
        with self._get_connection() as conn:
            cur = conn.cursor()
            cur.execute("SELECT id, email, name, role, is_active, created_at, updated_at FROM users ORDER BY role, email")
            for row in cur.fetchall():
                users.append(dict(row))
        return users

    def create_user(self, email: str, name: str, password: str, role: str) -> Dict[str, Any]:
        valid_roles = ["ADMIN", "ANALYST", "REVIEWER", "VIEWER"]
        if role.upper() not in valid_roles:
            raise ValueError(f"Invalid role '{role}'. Allowed roles: {valid_roles}")

        existing = self.get_user_by_email(email)
        if existing:
            raise ValueError("A user with this email address already exists.")

        user_id = f"USR-{uuid.uuid4().hex[:8].upper()}"
        now = datetime.now(timezone.utc).isoformat()
        pw_hash = hash_password(password)

        with self._get_connection() as conn:
            conn.execute("""
                INSERT INTO users (id, email, name, password_hash, role, is_active, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, 1, ?, ?)
            """, (user_id, email.lower().strip(), name, pw_hash, role.upper(), now, now))
            conn.commit()

        return {
            "id": user_id,
            "email": email.lower().strip(),
            "name": name,
            "role": role.upper(),
            "is_active": 1,
            "created_at": now
        }

    def update_user_role(self, user_id: str, new_role: str) -> bool:
        valid_roles = ["ADMIN", "ANALYST", "REVIEWER", "VIEWER"]
        if new_role.upper() not in valid_roles:
            raise ValueError(f"Invalid role. Must be one of: {valid_roles}")

        now = datetime.now(timezone.utc).isoformat()
        with self._get_connection() as conn:
            cur = conn.cursor()
            cur.execute("UPDATE users SET role = ?, updated_at = ? WHERE id = ?", (new_role.upper(), now, user_id))
            conn.commit()
            return cur.rowcount > 0

    def update_user_status(self, user_id: str, is_active: bool) -> bool:
        now = datetime.now(timezone.utc).isoformat()
        with self._get_connection() as conn:
            cur = conn.cursor()
            cur.execute("UPDATE users SET is_active = ?, updated_at = ? WHERE id = ?", (1 if is_active else 0, now, user_id))
            conn.commit()
            return cur.rowcount > 0

    def reset_user_password(self, user_id: str, new_password: str) -> bool:
        if len(new_password) < 6:
            raise ValueError("Password must be at least 6 characters long.")
        pw_hash = hash_password(new_password)
        now = datetime.now(timezone.utc).isoformat()
        with self._get_connection() as conn:
            cur = conn.cursor()
            cur.execute("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?", (pw_hash, now, user_id))
            conn.commit()
            return cur.rowcount > 0

    # ==========================================
    # Security Audit Events
    # ==========================================

    def record_security_event(
        self,
        event_type: str,
        user_email: Optional[str] = None,
        user_role: Optional[str] = None,
        transaction_id: Optional[str] = None,
        status: str = "SUCCESS",
        details: Optional[str] = None
    ) -> Dict[str, Any]:
        """Record security event (LOGIN_SUCCESS, LOGIN_FAILED, ACCESS_DENIED, etc.)"""
        event_id = f"SEC-{uuid.uuid4().hex[:8].upper()}"
        ts = datetime.now(timezone.utc).isoformat()

        with self._get_connection() as conn:
            conn.execute("""
                INSERT INTO security_audit_events (
                    event_id, event_type, timestamp, user_email, user_role,
                    transaction_id, status, details
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                event_id, event_type, ts, user_email, user_role,
                transaction_id, status, details
            ))
            conn.commit()

        logger.info(f"Security event recorded: {event_type} | User: {user_email} | Role: {user_role} | Status: {status}")
        return {
            "event_id": event_id,
            "event_type": event_type,
            "timestamp": ts,
            "user_email": user_email,
            "user_role": user_role,
            "transaction_id": transaction_id,
            "status": status,
            "details": details
        }

    def get_security_events(self, limit: int = 100) -> List[Dict[str, Any]]:
        events = []
        with self._get_connection() as conn:
            cur = conn.cursor()
            cur.execute("""
                SELECT * FROM security_audit_events
                ORDER BY timestamp DESC
                LIMIT ?
            """, (limit,))
            for row in cur.fetchall():
                events.append(dict(row))
        return events

user_service = UserService()
