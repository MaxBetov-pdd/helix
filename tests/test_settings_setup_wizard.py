"""Tests for the setup-wizard completion timestamp settings field."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.testclient import TestClient


def _client():
    # helix.api_core does not expose a FastAPI `app`; the settings routes live
    # on helix.routers.system, which helix.api includes into the real app.
    # Importing helix.api pulls in uvicorn + the full middleware stack (and
    # enforces startup side effects), so build a minimal app just for these
    # tests — mirrors the pattern in tests/test_api_domains_legacy.py.
    from helix.routers.system import router as system_router

    app = FastAPI()
    app.include_router(system_router)
    return TestClient(app)


def test_default_setup_wizard_completed_at_is_null(helix_db):
    client = _client()
    response = client.get("/api/settings")
    assert response.status_code == 200
    assert response.json().get("setup_wizard_completed_at") is None


def test_put_ui_section_sets_completed_at(helix_db):
    client = _client()
    payload = {"setup_wizard_completed_at": "2026-04-23T12:34:56Z"}
    response = client.put("/api/settings/ui", json=payload)
    assert response.status_code == 200

    current = client.get("/api/settings").json()
    assert current["setup_wizard_completed_at"] == "2026-04-23T12:34:56Z"


def test_put_ui_section_clears_completed_at_when_null(helix_db):
    client = _client()
    client.put("/api/settings/ui", json={"setup_wizard_completed_at": "2026-04-23T12:34:56Z"})
    response = client.put("/api/settings/ui", json={"setup_wizard_completed_at": None})
    assert response.status_code == 200

    assert client.get("/api/settings").json()["setup_wizard_completed_at"] is None


def test_put_ui_section_rejects_non_string(helix_db):
    client = _client()
    response = client.put("/api/settings/ui", json={"setup_wizard_completed_at": 12345})
    assert response.status_code == 400
    assert "setup_wizard_completed_at" in response.json().get("detail", "")
