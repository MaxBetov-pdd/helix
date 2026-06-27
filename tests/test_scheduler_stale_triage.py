"""Tests for the helix-stale-triage scheduler job registration."""
from __future__ import annotations


def test_stale_triage_job_registered():
    """helix-stale-triage must be registered with kind='stale_triage'."""
    from helix.db import init_db
    from helix.scheduler import seed_helix_jobs, get_jobs

    init_db()
    seed_helix_jobs()

    jobs = {j["id"]: j for j in get_jobs()}
    assert "helix-stale-triage" in jobs
    payload = jobs["helix-stale-triage"].get("payload") or {}
    if isinstance(payload, str):
        import json
        payload = json.loads(payload)
    assert payload.get("kind") == "stale_triage"
    assert int(payload.get("days", 0)) >= 1
