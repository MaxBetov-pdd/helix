from datetime import datetime, timezone

from helix.agents.manager import create_agent, update_agent
from helix.db import get_agents, get_db, init_db


def test_create_agent_defaults_to_visible(helix_db):
    create_agent(agent_id="alpha", name="Alpha", role="Visible by default")

    agents = {item["id"]: item for item in get_agents()}
    assert agents["alpha"]["visibility"] == "visible"


def test_update_agent_normalizes_visibility(helix_db):
    create_agent(agent_id="beta", name="Beta", role="Can be hidden")

    update_agent("beta", visibility="INTERNAL")

    agents = {item["id"]: item for item in get_agents()}
    assert agents["beta"]["visibility"] == "internal"


def test_migration_defaults_null_visibility_to_visible(helix_db):
    now = datetime.now(timezone.utc).isoformat()
    with get_db() as conn:
        conn.execute(
            "INSERT INTO agents (id, name, role, visibility, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
            ("legacy-worker", "Legacy Worker", "Some role", None, now, now),
        )

    init_db()

    agents = {item["id"]: item for item in get_agents()}
    assert agents["legacy-worker"]["visibility"] == "visible"


def test_migration_keeps_full_stack_engineer_visible(helix_db):
    now = datetime.now(timezone.utc).isoformat()
    with get_db() as conn:
        conn.execute(
            "INSERT INTO agents (id, name, role, visibility, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
            ("full-stack-engineer", "Full-Stack Engineer", "Visible engineer", "visible", now, now),
        )

    init_db()

    agents = {item["id"]: item for item in get_agents()}
    assert agents["full-stack-engineer"]["visibility"] == "visible"
