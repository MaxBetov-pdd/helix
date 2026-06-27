"""Shared fixtures for Helix/Helix tests."""

import asyncio
import os
import tempfile
from unittest.mock import patch

# Enable feature-flagged modules for testing (must be set before helix.api import)
os.environ.setdefault("HELIX_ENABLE_REGIME_LAB", "1")

# COLLECTION-TIME isolation (audit M-5): the per-test fixture below patches
# HELIX_HOME only while a test runs, but pytest collection imports every test
# module first — and module-level imports (e.g. helix.ai's model-routing
# snapshot) open the DB at import time. Without this, collecting the suite on
# an operator machine connects to (and can create) the LIVE ~/.helix/helix.db
# while the app is trading. Point HELIX_HOME at a throwaway dir before any
# helix import; an explicit operator-provided HELIX_HOME is respected.
if not os.environ.get("HELIX_HOME"):
    os.environ["HELIX_HOME"] = tempfile.mkdtemp(prefix="helix_pytest_home_")

# Captured before any helix.api import: importing that module on Windows swaps
# the global asyncio policy to the Selector loop (for API socket stability),
# which cannot spawn subprocesses. Hold the process default so we can restore it
# after each test and keep the side effect from leaking into subprocess-based
# asyncio tests (e.g. the MCP client) that run later in the session.
_DEFAULT_EVENT_LOOP_POLICY = asyncio.get_event_loop_policy()

import pytest


@pytest.fixture(autouse=True)
def _restore_event_loop_policy():
    yield
    asyncio.set_event_loop_policy(_DEFAULT_EVENT_LOOP_POLICY)


@pytest.fixture(autouse=True)
def _preserve_native_duckdb_modules():
    """Re-seed duckdb's native ``sys.modules`` entries after each test.

    Several tests mock a module via ``patch.dict(sys.modules, {...})``. On exit
    ``patch.dict`` clears+restores the ENTIRE ``sys.modules`` to its enter-time
    snapshot — silently evicting any module imported *during* the context,
    including duckdb's native submodules (e.g. ``_duckdb._sqltypes``). ``_duckdb``
    is a single ``.pyd`` (not a package), so once those entries are evicted they
    cannot be re-imported ("'_duckdb' is not a package"), and every later test
    that touches duckdb fails with that error. This was a cross-file,
    order-dependent suite failure. We snapshot the duckdb-family entries before
    the test and restore any that got evicted afterwards.
    """
    import sys

    try:
        import duckdb  # noqa: F401 — registers the native submodules in sys.modules
    except Exception:
        yield
        return

    snapshot = {
        name: mod
        for name, mod in sys.modules.items()
        if name == "duckdb" or name.startswith("duckdb.") or name == "_duckdb" or name.startswith("_duckdb.")
    }
    yield
    for name, mod in snapshot.items():
        sys.modules.setdefault(name, mod)


@pytest.fixture(autouse=True)
def _isolate_helix_home(tmp_path):
    """Point HELIX_HOME to a temp dir so tests don't touch ~/.helix.

    Patches both config module AND db module references so get_db()
    connects to the temp DB, not the production one.
    """
    home = tmp_path / ".helix"
    home.mkdir()
    (home / "data").mkdir()
    (home / "workspace").mkdir()
    (home / "workspace" / "memory").mkdir()
    (home / "workspace" / "agents").mkdir()

    db_path = home / "helix.db"
    lab_db_path = home / "helix_lab.db"

    import helix.config as cfg
    import helix.db as db_mod

    orig_home = cfg.HELIX_HOME
    orig_cfg_db = cfg.HELIX_DB
    orig_lab_db = cfg.HELIX_LAB_DB
    orig_config = cfg.CONFIG_FILE
    orig_data = getattr(cfg, "DATA_DIR", None)
    orig_workspace = getattr(cfg, "WORKSPACE_DIR", None)
    orig_db_ref = db_mod.HELIX_DB

    with patch.dict(os.environ, {"HELIX_HOME": str(home)}):
        cfg.HELIX_HOME = home
        cfg.HELIX_DB = db_path
        cfg.HELIX_LAB_DB = lab_db_path
        cfg.CONFIG_FILE = home / "config.json"
        cfg.DATA_DIR = home / "data"
        cfg.WORKSPACE_DIR = home / "workspace"
        # Critical: patch the db module's own reference too
        db_mod.HELIX_DB = db_path

        yield home

        cfg.HELIX_HOME = orig_home
        cfg.HELIX_DB = orig_cfg_db
        cfg.HELIX_LAB_DB = orig_lab_db
        cfg.CONFIG_FILE = orig_config
        if orig_data is not None:
            cfg.DATA_DIR = orig_data
        if orig_workspace is not None:
            cfg.WORKSPACE_DIR = orig_workspace
        db_mod.HELIX_DB = orig_db_ref


@pytest.fixture
def helix_db(tmp_path):
    """Initialize the isolated Helix SQLite DB with schema."""
    import helix.config as cfg
    import helix.db as db_mod

    db_path = cfg.HELIX_DB
    # Ensure db module also points here (should already via _isolate_helix_home)
    db_mod.HELIX_DB = db_path

    from helix.db import init_db
    init_db()

    # Reset the once-per-process scheduler-bootstrap guard so each test's fresh DB
    # is re-seeded by get_scheduler()/_bootstrap_scheduler_jobs(); the module-level
    # flag otherwise persists across tests in the same process and skips seeding.
    try:
        import helix.api_core as _api_core
        _api_core._SCHEDULER_BOOTSTRAP_DONE = False
    except Exception:
        pass

    return db_path
