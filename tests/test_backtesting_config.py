"""Backtesting client configuration resolution tests."""

from __future__ import annotations


def _clear_backtesting_env(monkeypatch):
    for key in (
        "HELIX_BACKTEST_API",
        "HELIX_BACKTEST_API_URL",
        "HELIX_BACKTESTING_API_URL",
        "HELIX_BACKTEST_BASE_URL",
        "HELIX_BACKTEST_BASE",
        "HELIX_BACKTEST_REMOTE_API",
        "HELIX_BACKTEST_RESULTS_REMOTE_API",
        "HELIX_CLIENT_BASE",
        "HELIX_PORT",
    ):
        monkeypatch.delenv(key, raising=False)


def test_backtesting_default_uses_local_8003(monkeypatch):
    import helix.backtesting as bt

    _clear_backtesting_env(monkeypatch)
    resolved = bt._resolve_backtesting_api_base_url()
    assert resolved == "http://127.0.0.1:8003/api"


def test_backtesting_uses_client_base_when_set(monkeypatch):
    import helix.backtesting as bt

    _clear_backtesting_env(monkeypatch)
    monkeypatch.setenv("HELIX_CLIENT_BASE", "http://127.0.0.1:8123")
    resolved = bt._resolve_backtesting_api_base_url()
    assert resolved == "http://127.0.0.1:8123/api"


def test_backtesting_env_has_precedence_over_client_base(monkeypatch):
    import helix.backtesting as bt

    _clear_backtesting_env(monkeypatch)
    monkeypatch.setenv("HELIX_CLIENT_BASE", "http://127.0.0.1:8123")
    monkeypatch.setenv("HELIX_BACKTEST_API", "http://127.0.0.1:9001")
    resolved = bt._resolve_backtesting_api_base_url()
    assert resolved == "http://127.0.0.1:9001/api"


def test_get_client_rebinds_on_base_url_change(monkeypatch):
    import helix.backtesting as bt

    _clear_backtesting_env(monkeypatch)
    monkeypatch.setenv("HELIX_BACKTEST_API", "http://127.0.0.1:8003")
    bt._client = None
    client_one = bt.get_client()
    assert client_one.base_url == "http://127.0.0.1:8003/api"

    monkeypatch.setenv("HELIX_BACKTEST_API", "http://127.0.0.1:8011")
    client_two = bt.get_client()
    assert client_two.base_url == "http://127.0.0.1:8011/api"
    assert client_two is not client_one

    # Cleanup explicit handles created in this test.
    try:
        client_one.close()
    except Exception:
        pass
    try:
        client_two.close()
    except Exception:
        pass
    bt._client = None
