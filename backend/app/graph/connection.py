import logging
from typing import Optional, Dict, Any, Tuple
from app.config import settings

logger = logging.getLogger("graphguard.graph")

class FalkorDBManager:
    """
    Manages connection to FalkorDB instance with health monitoring
    and dual-mode graph execution (live FalkorDB instance or local graph engine).
    """
    def __init__(self):
        self.host = settings.FALKORDB_HOST
        self.port = settings.FALKORDB_PORT
        self.username = settings.FALKORDB_USERNAME
        self.password = settings.FALKORDB_PASSWORD
        self.graph_name = settings.FALKORDB_GRAPH_NAME
        self.ssl = settings.FALKORDB_SSL
        self._client = None
        self._graph = None
        self._is_connected = False
        self._last_error = None

    def connect(self) -> bool:
        """Attempt connection to real FalkorDB server or FalkorDB Cloud instance."""
        try:
            from falkordb import FalkorDB
            
            target_host = self.host
            conn_kwargs = {
                "host": target_host,
                "port": self.port,
                "socket_timeout": 5.0,
                "socket_connect_timeout": 5.0
            }
            if self.password:
                conn_kwargs["password"] = self.password
            if self.username:
                conn_kwargs["username"] = self.username
            if self.ssl:
                conn_kwargs["ssl"] = True

            self._client = FalkorDB(**conn_kwargs)
            
            # Select graph
            self._graph = self._client.select_graph(self.graph_name)
            
            # Test query
            res = self._graph.query("RETURN 1 AS ping")
            if res and hasattr(res, "result_set") and len(res.result_set) > 0:
                self._is_connected = True
                self._last_error = None
                logger.info(f"Connected to FalkorDB at {target_host}:{self.port}, graph: '{self.graph_name}'")
                return True
        except Exception as e:
            self._is_connected = False
            self._last_error = str(e)
            logger.warning(f"FalkorDB connection to {self.host}:{self.port} not available: {e}")
            return False
        return False

    @property
    def is_connected(self) -> bool:
        return self._is_connected

    @property
    def last_error(self) -> Optional[str]:
        return self._last_error

    def get_graph(self):
        if not self._is_connected:
            self.connect()
        return self._graph

    def check_health(self) -> Dict[str, Any]:
        """Perform a live health probe on the FalkorDB connection."""
        connected = self.connect()
        is_cloud = self.host not in ("localhost", "127.0.0.1")
        
        if connected:
            active_db = "FalkorDB Cloud (Live)" if is_cloud else "FalkorDB Docker / Local (Live)"
            mode = "FalkorDB Native Redis-Graph Engine"
            diag = None
        else:
            active_db = "Embedded Graph Engine (Local Fallback Active)"
            mode = "Embedded NetworkX Cypher-Compatible Graph Engine"
            diag = (
                "Remote host is an internal AWS PrivateLink / VPC Route 53 private hosted zone endpoint. "
                "Internet access requires enabling Public Endpoint / adding local IP to Cloud ACL."
                if is_cloud else "Local FalkorDB container is not running on port 6379."
            )

        return {
            "connected": connected,
            "host": self.host,
            "port": self.port,
            "graph_name": self.graph_name,
            "error": self._last_error if not connected else None,
            "mode": mode,
            "active_database": active_db,
            "cloud_configured": is_cloud,
            "cloud_diagnostic": diag
        }

db_manager = FalkorDBManager()
