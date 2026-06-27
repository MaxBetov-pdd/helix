"""Tests for the Helix MCP server.

These do not spawn a backend — they verify that the FastMCP server builds,
registers every expected tool, and that each tool has a non-empty
description (MCP clients display this to users, so a blank description is
a bug). For end-to-end smoke of the HTTP layer, see the README snippet —
that requires a live backend.
"""

from __future__ import annotations

import asyncio


from helix.mcp_server.server import build_server


EXPECTED_TOOL_NAMES = {
    "helix_get_context",
    "helix_list_sessions",
    "helix_get_session",
    "helix_list_strategies",
    "helix_get_recent_runs",
    "helix_get_result",
    "helix_get_gate_report",
    "helix_get_quant_skills",
    "helix_create_session",
    "helix_close_session",
    "helix_register_strategy_file",
    "helix_run_backtest",
    "helix_create_strategy",
    "helix_run_optimization",
    "helix_run_verdict",
    "helix_promote_strategy",
    "helix_get_paper_readiness",
    "helix_start_paper_session",
    "helix_run_gauntlet_candidate",
}


def _list_tool_names() -> list[str]:
    server = build_server()
    tools = asyncio.run(server.list_tools())
    return [t.name for t in tools]


def test_build_server_registers_expected_tools():
    names = set(_list_tool_names())
    assert names == EXPECTED_TOOL_NAMES, f"missing: {EXPECTED_TOOL_NAMES - names}; unexpected: {names - EXPECTED_TOOL_NAMES}"


def test_all_tools_have_descriptions():
    server = build_server()
    tools = asyncio.run(server.list_tools())
    for t in tools:
        assert t.description and t.description.strip(), f"tool {t.name} has no description"


def test_tools_namespaced_with_helix_prefix():
    for name in _list_tool_names():
        assert name.startswith("helix_"), f"tool {name} missing helix_ prefix — will collide with other MCP servers"


def test_register_strategy_file_schema_has_required_file_path():
    server = build_server()
    tools = asyncio.run(server.list_tools())
    reg = next(t for t in tools if t.name == "helix_register_strategy_file")
    schema = reg.inputSchema
    assert schema.get("type") == "object"
    props = schema.get("properties", {})
    assert "file_path" in props
    # session_id is optional
    assert "session_id" in props


def test_run_backtest_schema_exposes_session_id():
    server = build_server()
    tools = asyncio.run(server.list_tools())
    bt = next(t for t in tools if t.name == "helix_run_backtest")
    props = bt.inputSchema.get("properties", {})
    assert "strategy_id" in props
    assert "dataset_id" in props
    assert "session_id" in props
    assert "compact" in props


def test_lifecycle_tools_exposed():
    server = build_server()
    tools = asyncio.run(server.list_tools())
    by_name = {t.name: t for t in tools}
    for name in [
        "helix_run_verdict",
        "helix_promote_strategy",
        "helix_get_gate_report",
        "helix_start_paper_session",
        "helix_run_gauntlet_candidate",
    ]:
        assert name in by_name
