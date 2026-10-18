import os
from pathlib import Path

backup_dir = Path(r"C:\Users\payal\AppData\Roaming\Antigravity IDE\Backups")
backup_file = None
if backup_dir.exists():
    for f in backup_dir.glob("**/file/*"):
        if f.is_file():
            backup_file = f
            break

print("Checking backup file:", backup_file)

env_path = Path(".env")
active_path = env_path

# If backup file exists and has newer mtime or larger content, inspect it
content = ""
if backup_file and backup_file.exists():
    b_text = backup_file.read_text(encoding="utf-8", errors="ignore")
    # VS Code / Antigravity IDE backup files prepend metadata in first line, then file content
    content = b_text
    print("Found IDE unsaved editor buffer!")
else:
    content = env_path.read_text(encoding="utf-8", errors="ignore")

found_keys = {}
for line in content.splitlines():
    line = line.strip()
    if line and not line.startswith("#") and "=" in line:
        parts = line.split("=", 1)
        k = parts[0].strip()
        v = parts[1].strip().strip("'\"")
        found_keys[k] = bool(v)

keys_to_check = [
    "GROQ_API_KEY",
    "OPENAI_API_KEY",
    "GEMINI_API_KEY",
    "FALKORDB_HOST",
    "FALKORDB_PORT",
    "FALKORDB_USERNAME",
    "FALKORDB_PASSWORD",
    "FALKORDB_GRAPH_NAME",
    "LLM_PROVIDER",
    "MCP_API_KEY",
    "BACKEND_HOST",
    "BACKEND_PORT",
    "VITE_API_URL"
]

print("=" * 50)
print("CREDENTIALS STATUS (SAFE CHECK - NO SECRETS PRINTED)")
print("=" * 50)
for k in keys_to_check:
    status = "CONFIGURED" if found_keys.get(k) else "NOT CONFIGURED / MISSING"
    print(f"{k:<22}: {status}")
print("=" * 50)
