"""All market-data streams must share one root (no HELIX_HOME split-brain).

Previously OHLCV honored HELIX_HOME but funding/OI/derivatives/macro hardcoded a
repo-relative dir, so packaged installs orphaned every enrichment stream and
strategies trained on funding=0/oi=0 with no error.
"""
from __future__ import annotations


def test_enrichment_streams_share_ohlcv_root():
    from helix import data as data_mod
    from helix import data_manager as dm

    # funding/OI/derivatives/macro live directly under the OHLCV lake's root.
    assert dm._BASE_DIR == data_mod.DATA_DIR.parent
    assert dm.FUNDING_DIR.parent == data_mod.DATA_DIR.parent
    assert dm.OI_DIR.parent == data_mod.DATA_DIR.parent
    assert dm.MACRO_DIR.parent == data_mod.DATA_DIR.parent
    assert dm.assert_data_root_consistent() is True


def test_data_root_is_parent_of_ohlcv_for_explicit_override(monkeypatch, tmp_path):
    ohlcv = tmp_path / "ohlcv"
    monkeypatch.setenv("HELIX_DATA_DIR", str(ohlcv))
    from helix import data as data_mod

    assert data_mod._resolve_data_dir() == ohlcv
    assert data_mod.data_root() == tmp_path  # streams sit alongside ohlcv


def test_data_root_matches_ohlcv_parent_under_helix_home(monkeypatch, tmp_path):
    monkeypatch.delenv("HELIX_DATA_DIR", raising=False)
    monkeypatch.setenv("HELIX_HOME", str(tmp_path))
    from helix import data as data_mod

    # Whatever the HELIX_HOME branch resolves to, enrichment streams share that
    # root with the OHLCV lake — that invariant is what fixes the split-brain.
    assert data_mod.data_root() == data_mod._resolve_data_dir().parent
    assert data_mod.data_root().name == "data"
