from helix.db import get_db


def test_hypothesis_verdict_columns_exist(helix_db):
    with get_db() as conn:
        cols = {row["name"] for row in conn.execute("PRAGMA table_info(hypotheses)")}
    assert {"verdict_memo", "verdict_memo_at", "verdict_memo_by", "last_dispatched_at"} <= cols


def test_hypothesis_verdict_memos_table_exists(helix_db):
    with get_db() as conn:
        cols = {row["name"] for row in conn.execute("PRAGMA table_info(hypothesis_verdict_memos)")}
    assert cols == {"id", "hypothesis_id", "payload", "written_at", "written_by"}


def test_hypothesis_verdict_memos_index_exists(helix_db):
    with get_db() as conn:
        rows = conn.execute(
            "SELECT name FROM sqlite_master WHERE type='index' AND name='idx_hypothesis_verdict_memos_hypothesis'"
        ).fetchall()
    assert len(rows) == 1
