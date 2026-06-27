from __future__ import annotations

import asyncio
import json

from helix.db import factory_reset, get_db


def test_run_ideation_step_delegates_to_crucible_planner(monkeypatch, helix_db):
    from helix import evolution
    import helix.crucible_planner as crucible_planner_mod

    calls: list[int] = []

    def _stub_crucible_planner_cycle(*, limit: int = 3):
        calls.append(limit)
        return {"planned": 1, "assigned": 1}

    monkeypatch.setattr(
        crucible_planner_mod,
        "run_crucible_planner_cycle",
        _stub_crucible_planner_cycle,
    )

    result = evolution.run_ideation_step()

    assert result == {"planned": 1, "assigned": 1}
    assert calls == [3]


def test_run_coding_step_delegates_to_crucible_planner(monkeypatch, helix_db):
    from helix import evolution
    import helix.crucible_planner as crucible_planner_mod

    calls: list[int] = []

    def _stub_crucible_planner_cycle(*, limit: int = 3):
        calls.append(limit)
        return {"planned": 2, "assigned": 2}

    monkeypatch.setattr(
        crucible_planner_mod,
        "run_crucible_planner_cycle",
        _stub_crucible_planner_cycle,
    )

    result = evolution.run_coding_step()

    assert result == {"planned": 2, "assigned": 2}
    assert calls == [3]


def test_factory_reset_queues_strategy_developer_bootstrap_prompt(helix_db):
    result = factory_reset([])

    assert result["status"] == "ok"

    with get_db() as conn:
        row = conn.execute(
            "SELECT payload FROM tasks WHERE type = 'brain_invoke' ORDER BY id DESC LIMIT 1"
        ).fetchone()

    assert row is not None
    payload = json.loads(row["payload"])
    message = str(payload["message"]).lower()
    assert "strategy-developer swarm" in message
    assert "generate first-class hypotheses" in message
    assert "spawn initial strategy candidates immediately" in message
    assert "defer quant-researcher" in message
    assert "quant-researcher: generate new strategy container hypotheses" not in message


def test_bot_bootstrap_queues_strategy_developer_startup_prompt(monkeypatch, helix_db):
    from helix.bot import HelixBot

    monkeypatch.setattr("helix.workspace.init_workspace", lambda: None)
    monkeypatch.setattr("helix.scheduler.get_jobs", lambda: [{"id": "existing-job"}])
    monkeypatch.setattr("helix.scheduler.reconcile_helix_jobs", lambda: {"removed": 0, "added": 0})
    monkeypatch.setattr("helix.scheduler.ensure_monitoring_jobs", lambda: 0)
    monkeypatch.setattr("helix.scheduler.seed_helix_jobs", lambda: None)
    monkeypatch.setattr("helix.db.log_activity", lambda *args, **kwargs: None)
    monkeypatch.setattr("helix.agents.manager.create_agent", lambda **kwargs: None)
    monkeypatch.setattr("helix.agents.manager.update_agent", lambda *args, **kwargs: None)
    monkeypatch.setattr("helix.agents.manager.delete_agent", lambda *args, **kwargs: None)

    bot = HelixBot(agent_id=None)
    monkeypatch.setattr(bot, "get_channel", lambda channel_id: None)

    asyncio.run(bot._bootstrap())

    with get_db() as conn:
        row = conn.execute(
            "SELECT payload FROM tasks WHERE type = 'brain_invoke' ORDER BY id DESC LIMIT 1"
        ).fetchone()

    assert row is not None
    payload = json.loads(row["payload"])
    message = str(payload["message"]).lower()
    assert "strategy-developer swarm" in message
    assert "generate first-class hypotheses" in message
    assert "spawn initial strategy candidates immediately" in message
    assert "defer quant-researcher" in message
    assert "quant-researcher: generate new strategy container hypotheses" not in message
