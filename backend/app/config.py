import os
from pathlib import Path
from pydantic_settings import BaseSettings
from typing import Optional, List

# Base directory
BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    # FalkorDB Cloud Settings
    FALKORDB_HOST: str = "localhost"
    FALKORDB_PORT: int = 6379
    FALKORDB_USERNAME: Optional[str] = None
    FALKORDB_PASSWORD: Optional[str] = None
    FALKORDB_GRAPH_NAME: str = "graphguard"
    FALKORDB_SSL: bool = False
    
    # Backend Server
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000
    ENVIRONMENT: str = "development"
    
    # LLM Settings
    LLM_PROVIDER: str = "groq"
    GROQ_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    LLM_MODEL: str = "qwen/qwen3.8-27b"
    
    # Data & Audit Paths
    DATA_DIR: Path = BASE_DIR / "data"
    AUDIT_LOG_FILE: Path = BASE_DIR / "data" / "audit_log.json"

    # Security & Authentication Configuration
    AUTH_SECRET: str = "graphguard-secure-auth-jwt-token-secret-key-2026-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 hours
    FRONTEND_URL: str = "http://127.0.0.1:5173,http://localhost:5173"

    # Bootstrap Initial Users Credentials (environment controlled)
    ADMIN_EMAIL: str = "admin@graphguard.ai"
    ADMIN_PASSWORD: str = "Admin@GraphGuard2026!"
    
    ANALYST_EMAIL: str = "analyst@graphguard.ai"
    ANALYST_PASSWORD: str = "Analyst@GraphGuard2026!"
    
    REVIEWER_EMAIL: str = "reviewer@graphguard.ai"
    REVIEWER_PASSWORD: str = "Reviewer@GraphGuard2026!"
    
    VIEWER_EMAIL: str = "viewer@graphguard.ai"
    VIEWER_PASSWORD: str = "Viewer@GraphGuard2026!"

    model_config = {
        "env_file": str(BASE_DIR / ".env"),
        "env_file_encoding": "utf-8",
        "extra": "ignore"
    }

settings = Settings()
