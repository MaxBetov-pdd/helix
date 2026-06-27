"""Minimal fake MCP server used by tests/test_mcp_client.py.

Speaks JSON-RPC 2.0 line-delimited on stdin/stdout. Implements just
enough of MCP 2024-11-05 to validate the client:
- ``initialize`` returns serverInfo + protocolVersion
- ``notifications/initialized`` accepted (no response)
- ``tools/list`` returns two hardcoded tools
- ``tools/call`` echoes inputs back as text
- Any other method returns a JSON-RPC error.

Echo-only by design — keep the rig dumb so test failures point at the
client, not the server. Also writes a debug line to stderr on each
request so a hung test can be inspected with proc.stderr.read().
"""

from __future__ import annotations

import json
import sys


PROTOCOL_VERSION = "2024-11-05"


TOOLS = [
    {
        "name": "echo",
        "description": "Echo back the provided text.",
        "inputSchema": {
            "type": "object",
            "properties": {"text": {"type": "string"}},
            "required": ["text"],
        },
    },
    {
        "name": "uppercase",
        "description": "Uppercase the provided text.",
        "inputSchema": {
            "type": "object",
            "properties": {"text": {"type": "string"}},
            "required": ["text"],
        },
    },
]


def write_msg(msg: dict) -> None:
    sys.stdout.write(json.dumps(msg) + "\n")
    sys.stdout.flush()


def err(rid, code, message):
    write_msg({"jsonrpc": "2.0", "id": rid, "error": {"code": code, "message": message}})


def main() -> int:
    initialized = False
    for raw in sys.stdin:
        line = raw.strip()
        if not line:
            continue
        try:
            req = json.loads(line)
        except json.JSONDecodeError:
            sys.stderr.write(f"FAKE_MCP: bad json: {line}\n")
            sys.stderr.flush()
            continue

        method = req.get("method")
        rid = req.get("id")
        sys.stderr.write(f"FAKE_MCP: got method={method} id={rid}\n")
        sys.stderr.flush()

        if method == "initialize":
            write_msg({
                "jsonrpc": "2.0",
                "id": rid,
                "result": {
                    "protocolVersion": PROTOCOL_VERSION,
                    "capabilities": {"tools": {}},
                    "serverInfo": {"name": "fake-stdio", "version": "0.0.1"},
                },
            })
        elif method == "notifications/initialized":
            initialized = True
        elif method == "tools/list":
            if not initialized:
                err(rid, -32002, "not initialized")
                continue
            write_msg({"jsonrpc": "2.0", "id": rid, "result": {"tools": TOOLS}})
        elif method == "tools/call":
            params = req.get("params") or {}
            name = params.get("name")
            args = params.get("arguments") or {}
            text = str(args.get("text", ""))
            if name == "echo":
                out = text
            elif name == "uppercase":
                out = text.upper()
            else:
                err(rid, -32601, f"unknown tool: {name}")
                continue
            write_msg({
                "jsonrpc": "2.0",
                "id": rid,
                "result": {
                    "content": [{"type": "text", "text": out}],
                    "isError": False,
                },
            })
        elif method is None:
            err(rid, -32600, "missing method")
        else:
            err(rid, -32601, f"unknown method: {method}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
