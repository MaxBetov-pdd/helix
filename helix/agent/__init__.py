# SPDX-FileCopyrightText: 2026 Judder <MaxBetov-pdd@helix.app>
# SPDX-License-Identifier: AGPL-3.0-or-later

"""Helix agent harness — drive the running Helix backend over its HTTP API.

This is the transport-neutral way for ANY AI harness (Claude Code, Codex, a
Tauri sidecar, CI, a plain script) to use Helix without the MCP server. The
MCP server (`helix.mcp_server`) is itself just a thin stdio wrapper over the
same `:8003` REST API this client targets; everything the MCP can do, this can
do, with zero third-party dependencies (stdlib `urllib` only).

Quick start:
    from helix.agent import HelixAgentClient
    fc = HelixAgentClient()              # defaults to http://127.0.0.1:8003
    print(fc.health())
    res = fc.run_backtest("S02545", "BTC/USDT-1h")
    print(HelixAgentClient.metrics(res))

Or from a shell (great for Claude Code / Codex):
    python -m helix.agent health
    python -m helix.agent backtest --strategy S02545 --dataset BTC/USDT-1h --compact
"""

from .client import HelixAgentClient, HelixAPIError, QUICK_SCREEN_THRESHOLDS

__all__ = ["HelixAgentClient", "HelixAPIError", "QUICK_SCREEN_THRESHOLDS"]
