import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.graph.connection import db_manager
from app.graph.engine import graph_engine
from app.services.user_service import user_service
from app.routes.api import router as api_router
from app.routes.auth_routes import router as auth_router

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("graphguard")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing GraphGuard AI Backend...")
    # Attempt connection to FalkorDB
    connected = db_manager.connect()
    if connected:
        logger.info(f"FalkorDB connection confirmed at {settings.FALKORDB_HOST}:{settings.FALKORDB_PORT}")
    else:
        logger.info(f"FalkorDB offline or not yet started; active fallback engine ready.")
    
    # Initialize graph seed
    graph_engine.initialize_graph()
    
    # User service already bootstrapped default users
    logger.info("User security & RBAC subsystems initialized.")
    yield
    logger.info("GraphGuard AI Backend shutting down.")

app = FastAPI(
    title="GraphGuard AI — Connected-Risk Agentic Platform",
    description="Track 01 — Agents That Act on Connected Data. Powered by FalkorDB.",
    version="2.4.0",
    lifespan=lifespan
)

# Parse allowed origins from FRONTEND_URL setting
allowed_origins = [o.strip() for o in settings.FRONTEND_URL.split(",") if o.strip()]
if "http://127.0.0.1:5173" not in allowed_origins:
    allowed_origins.append("http://127.0.0.1:5173")
if "http://localhost:5173" not in allowed_origins:
    allowed_origins.append("http://localhost:5173")

# Enable CORS for React Vite frontend with restricted origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Register routes
app.include_router(auth_router)
app.include_router(api_router)

@app.get("/")
def root():
    return {
        "project": "GraphGuard AI",
        "tagline": "Don't Just Detect the Anomaly. Follow the Connections.",
        "version": "2.4.0",
        "documentation": "/docs",
        "status": "ONLINE"
    }
