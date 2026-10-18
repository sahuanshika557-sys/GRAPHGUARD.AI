import os
import socket
import ssl
from dotenv import load_dotenv

load_dotenv()

host = os.getenv("FALKORDB_HOST", "")
port = int(os.getenv("FALKORDB_PORT", "63238"))
username = os.getenv("FALKORDB_USERNAME", "")
password = os.getenv("FALKORDB_PASSWORD", "")
graph_name = os.getenv("FALKORDB_GRAPH_NAME", "graphguard")

print("=" * 60)
print("FALKORDB CLOUD RE-DIAGNOSTIC")
print("=" * 60)

# 1. Compare configured host & port
print(f"Configured Host: {host}")
print(f"Configured Port: {port}")
print(f"Target Graph:    {graph_name}")
print(f"Username set:    {'[REDACTED (PRESENT)]' if username else '[NOT SET]'}")
print(f"Password set:    {'[REDACTED (PRESENT)]' if password else '[NOT SET]'}")
print("-" * 60)

# 2. DNS Resolution
ip = None
print("STEP 1: DNS Resolution...")
try:
    ip = socket.gethostbyname(host)
    print(f"  [SUCCESS] DNS resolved: {host} -> {ip}")
except Exception as e:
    print(f"  [FAILED - DNS ERROR]: {e}")

print("-" * 60)

# 3. TCP Connectivity
tcp_ok = False
if ip:
    print(f"STEP 2: TCP Connectivity to {ip}:{port}...")
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(6.0)
    try:
        s.connect((ip, port))
        print(f"  [SUCCESS] TCP port {port} is open and reachable!")
        tcp_ok = True
        s.close()
    except Exception as e:
        print(f"  [FAILED - TCP TIMEOUT/REFUSED]: {e}")
else:
    print("STEP 2: Skipped (DNS failed)")

print("-" * 60)

# 4. FalkorDB Authenticated Connection & TLS testing
if tcp_ok:
    from falkordb import FalkorDB
    
    # Try both TLS=False and TLS=True
    for use_ssl in [False, True]:
        print(f"STEP 3: Testing FalkorDB connection (ssl={use_ssl})...")
        try:
            db = FalkorDB(
                host=host,
                port=port,
                username=username,
                password=password,
                ssl=use_ssl,
                socket_timeout=8.0,
                socket_connect_timeout=8.0
            )
            g = db.select_graph(graph_name)
            res = g.query("RETURN 1 AS ping")
            print(f"  [SUCCESS] Authenticated query 'RETURN 1 AS ping' succeeded with ssl={use_ssl}!")
            print(f"  Result set: {res.result_set}")
            break
        except Exception as e:
            err_msg = str(e)
            if "WRONGPASS" in err_msg or "AUTH" in err_msg or "Authentication" in err_msg:
                print(f"  [FAILED - AUTHENTICATION ERROR] with ssl={use_ssl}: {err_msg}")
            elif "SSLError" in err_msg or "certificate" in err_msg.lower():
                print(f"  [FAILED - TLS ERROR] with ssl={use_ssl}: {err_msg}")
            else:
                print(f"  [FAILED - QUERY/DRIVER ERROR] with ssl={use_ssl}: {err_msg}")
else:
    print("STEP 3: Skipped FalkorDB query test due to network connectivity failure.")

print("=" * 60)
