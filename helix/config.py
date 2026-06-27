"""Configuration paths and loading for Helix."""

import json
import os
import shutil
from pathlib import Path


# Core paths
def _resolve_helix_home() -> Path:
    """Resolve the canonical Helix home path."""
    env_home = os.environ.get("HELIX_HOME")
    if env_home:
        return Path(env_home).expanduser()
    return Path.home() / ".helix"


HELIX_HOME = _resolve_helix_home()
HELIX_DB = HELIX_HOME / "helix.db"
HELIX_LAB_DB = HELIX_HOME / "helix_lab.db"
AUTH_FILE = HELIX_HOME / "auth.json"
CONFIG_FILE = HELIX_HOME / "config.json"
WORKSPACE_DIR = HELIX_HOME / "workspace"
CHROMA_DIR = HELIX_HOME / "chromadb"

# Optional secondary workspace root. Callers fall back to this when the primary
# WORKSPACE_DIR is missing files. Kept as an alias so existing lookup loops keep
# working; both resolve to the same directory in a default install.
LEGACY_WORKSPACE_DIR = WORKSPACE_DIR

# OpenClaw paths (kept for workspace/auth import compatibility)
OPENCLAW_HOME = Path.home() / ".openclaw"
OPENCLAW_AUTH = OPENCLAW_HOME / "agents" / "main" / "agent" / "auth-profiles.json"
OPENCLAW_WORKSPACE = OPENCLAW_HOME / "workspace"


def ensure_dirs():
    """Create all required directories."""
    HELIX_HOME.mkdir(parents=True, exist_ok=True)
    WORKSPACE_DIR.mkdir(parents=True, exist_ok=True)
    (WORKSPACE_DIR / "memory").mkdir(exist_ok=True)
    (WORKSPACE_DIR / "agents").mkdir(exist_ok=True)


def load_config() -> dict:
    """Load config.json, returning empty dict if missing."""
    if CONFIG_FILE.exists():
        return json.loads(CONFIG_FILE.read_text())
    return {}


def save_config(cfg: dict):
    """Atomically write config.json."""
    ensure_dirs()
    tmp = CONFIG_FILE.with_suffix(".tmp")
    tmp.write_text(json.dumps(cfg, indent=2) + "\n")
    tmp.replace(CONFIG_FILE)


def _parse_bool(value) -> bool:
    """Parse truthy/falsy values for config toggles."""
    if isinstance(value, bool):
        return value
    if value is None:
        return False
    if isinstance(value, str):
        return value.strip().lower() in {"1", "true", "yes", "on", "y"}
    if isinstance(value, int):
        return bool(value)
    return False


def is_beta_build() -> bool:
    """True when the app is running inside the packaged (Tauri) beta build.

    The Rust launcher injects HELIX_ENV=beta when it spawns python. Dev runs
    (`python -m helix.api` from a checkout) leave this unset. Used to
    hard-lock paper trading so a beta tester cannot accidentally — or be
    tricked by prompt injection — flip to live execution.
    """
    return os.environ.get("HELIX_ENV", "").strip().lower() == "beta"


def get_execution_mode() -> str:
    """Get execution mode: 'paper' or 'live'.

    Paper mode records trades in SQLite only.
    Live mode also sends orders to HyperLiquid via the execution-trader agent.

    In beta builds this function ALWAYS returns 'paper' regardless of config
    or env, to keep testers off live trading no matter what got written to
    settings. The lock is here (at the read site) as well as at the write
    site so a stale 'live' value in config.json can never take effect.
    """
    if is_beta_build():
        return "paper"
    mode = os.environ.get("HELIX_EXECUTION_MODE")
    if mode and mode in ("paper", "live"):
        return mode
    cfg = load_config()
    return cfg.get("execution_mode", "paper")


def set_execution_mode(mode: str):
    """Set execution mode. Only 'paper' is a supported value.

    Live/mainnet trading is NOT a supported feature of this open-source build:
    this refuses anything but 'paper' unconditionally, so the ops endpoint
    (/api/ops/execution-mode) and any agent tool that tries to flip the switch
    get a loud error instead of silently going live. Helix ships with paper
    trading + Hyperliquid testnet only.

    A user who deliberately forces 'live' out-of-band (HELIX_EXECUTION_MODE env
    or hand-editing config.json) is accepting their own risk — that's why the
    read path (get_execution_mode) still honours such an override and the
    fail-closed Rule 0c margin guard in exchange/risk.py still applies to it.
    """
    if mode != "paper":
        raise ValueError(
            f"Unsupported execution mode: {mode!r}. This build supports paper "
            f"trading and Hyperliquid testnet only; live/mainnet trading is not "
            f"a supported feature."
        )
    cfg = load_config()
    cfg["execution_mode"] = mode
    save_config(cfg)


def get_execution_fast_path() -> bool:
    """Whether scanner should attempt direct exchange execution first.

    Default is enabled in the local config and can be overridden by
    HELIX_EXECUTION_FAST_PATH env var.
    """
    env_val = os.environ.get("HELIX_EXECUTION_FAST_PATH")
    if env_val is not None:
        return _parse_bool(env_val)

    cfg = load_config()
    return _parse_bool(cfg.get("execution_fast_path", True))


def set_execution_fast_path(enabled: bool):
    """Persist the execution fast-path toggle."""
    cfg = load_config()
    cfg["execution_fast_path"] = bool(enabled)
    save_config(cfg)


def _parse_float(value, default: float) -> float:
    """Parse float-like values with fallback."""
    if isinstance(value, (int, float)):
        return float(value)
    if value is None:
        return float(default)
    try:
        cleaned = str(value).strip()
        if not cleaned:
            return float(default)
        return float(cleaned)
    except Exception:
        return float(default)


def _clamp(value: float, lower: float, upper: float) -> float:
    return max(lower, min(upper, value))


def _settings_blob_value(key: str):
    """Read `key` from the unified settings KV blob (``helix:settings``), or None.

    This is the store the Settings UI *and* the paper service write to. The regime
    getters consult it (after any env override) so a change made through either
    path reaches the live gate without a separate config.json mirror. Falls back
    to None on any failure so callers can use their config.json default.
    """
    try:
        from helix.db import kv_get
        blob = kv_get("helix:settings", {})
        if isinstance(blob, dict) and key in blob:
            return blob.get(key)
    except Exception:
        pass
    return None


def get_strict_regime_gating() -> bool:
    """Whether incompatible/low-confidence regimes should block execution."""
    env_val = os.environ.get("HELIX_STRICT_REGIME_GATING")
    if env_val is not None:
        return _parse_bool(env_val)

    blob_val = _settings_blob_value("strict_regime_gating")
    if blob_val is not None:
        return _parse_bool(blob_val)

    cfg = load_config()
    return _parse_bool(cfg.get("strict_regime_gating", True))


def set_strict_regime_gating(enabled: bool):
    """Persist strict regime gating toggle."""
    cfg = load_config()
    cfg["strict_regime_gating"] = bool(enabled)
    save_config(cfg)


def get_backup_ai_provider() -> str:
    """Backup AI provider to fall back to when the primary provider's credentials
    are unusable. ``'none'`` (default) disables fallback. Wired setting: env override,
    then the Settings KV blob, then config.json. Always lower-cased."""
    env_val = os.environ.get("HELIX_BACKUP_AI_PROVIDER")
    if env_val is not None:
        return str(env_val).strip().lower()

    blob_val = _settings_blob_value("backup_ai_provider")
    if blob_val is not None:
        return str(blob_val).strip().lower()

    cfg = load_config()
    return str(cfg.get("backup_ai_provider", "none")).strip().lower()


def get_backup_ai_model() -> str:
    """Model id for the backup AI provider. Empty = use the provider's default."""
    env_val = os.environ.get("HELIX_BACKUP_AI_MODEL")
    if env_val is not None:
        return str(env_val).strip()

    blob_val = _settings_blob_value("backup_ai_model")
    if blob_val is not None:
        return str(blob_val).strip()

    cfg = load_config()
    return str(cfg.get("backup_ai_model", "")).strip()


def get_regime_min_confidence() -> float:
    """Minimum confidence required when strict regime gating is enabled."""
    env_val = os.environ.get("HELIX_REGIME_MIN_CONFIDENCE")
    if env_val is not None:
        return _clamp(_parse_float(env_val, 0.3), 0.0, 1.0)

    blob_val = _settings_blob_value("regime_min_confidence")
    if blob_val is not None:
        return _clamp(_parse_float(blob_val, 0.3), 0.0, 1.0)

    cfg = load_config()
    return _clamp(_parse_float(cfg.get("regime_min_confidence", 0.3), 0.3), 0.0, 1.0)


def set_regime_min_confidence(value: float):
    """Persist the minimum regime confidence threshold (0.0-1.0)."""
    cfg = load_config()
    cfg["regime_min_confidence"] = _clamp(_parse_float(value, 0.3), 0.0, 1.0)
    save_config(cfg)


def get_allow_unknown_regime_strategies() -> bool:
    """Whether unknown strategy types bypass strict regime compatibility checks."""
    env_val = os.environ.get("HELIX_ALLOW_UNKNOWN_REGIME_STRATEGIES")
    if env_val is not None:
        return _parse_bool(env_val)

    blob_val = _settings_blob_value("allow_unknown_regime_strategies")
    if blob_val is not None:
        return _parse_bool(blob_val)

    cfg = load_config()
    return _parse_bool(cfg.get("allow_unknown_regime_strategies", False))


def set_allow_unknown_regime_strategies(enabled: bool):
    """Persist unknown-strategy behavior under strict regime gating."""
    cfg = load_config()
    cfg["allow_unknown_regime_strategies"] = bool(enabled)
    save_config(cfg)


# ---------------------------------------------------------------------------
# Polygon.io API key
# ---------------------------------------------------------------------------

def get_polygon_api_key() -> str | None:
    """Read Polygon API key from env var or Settings API Keys store.

    Priority: POLYGON_API_KEY env var > KV store (Settings > API Keys).
    """
    env_key = os.environ.get("POLYGON_API_KEY", "").strip()
    if env_key:
        return env_key

    # Read from the Settings > API Keys KV store (same store the UI writes to)
    try:
        from helix.db import kv_get
        from helix.secret_storage import decrypt_secret
        store = kv_get("helix:settings:api-keys", {})
        if isinstance(store, dict):
            entry = store.get("polygon")
            if isinstance(entry, dict):
                value = str(entry.get("value") or "").strip()
                if value:
                    return decrypt_secret(value)
            elif isinstance(entry, str) and entry.strip():
                return decrypt_secret(entry)
    except Exception:
        pass

    # Fallback: auth.json file
    if AUTH_FILE.exists():
        try:
            auth = json.loads(AUTH_FILE.read_text())
            entry = auth.get("polygon") or auth.get("polygon_api_key")
            if isinstance(entry, dict):
                return str(entry.get("value") or entry.get("key") or "").strip() or None
            if isinstance(entry, str) and entry.strip():
                return entry.strip()
        except Exception:
            pass
    return None


def redact_api_key(key: str | None) -> str:
    """Redact an API key for safe logging — show only last 4 chars."""
    if not key:
        return "***"
    if len(key) <= 4:
        return "***"
    return f"***{key[-4:]}"


def ensure_state_dir_bootstrapped() -> None:
    """On first packaged run, seed $HELIX_HOME/.env from $HELIX_DEFAULT_ENV.

    No-op when the target .env already exists, when HELIX_HOME is unset, or when
    HELIX_DEFAULT_ENV is unset or points to a missing file. Dev runs are
    unaffected.
    """
    home_env = os.environ.get("HELIX_HOME")
    if not home_env:
        return
    default_env = os.environ.get("HELIX_DEFAULT_ENV")
    if not default_env:
        return
    source = Path(default_env)
    if not source.is_file():
        return
    home = Path(home_env)
    home.mkdir(parents=True, exist_ok=True)
    target = home / ".env"
    if target.exists():
        return
    shutil.copyfile(source, target)


def ensure_seed_data_bootstrapped() -> int:
    """On first packaged run, seed `$HELIX_HOME/data/ohlcv/` from bundled
    parquets so agents, backtests, and the dashboard have something to render
    immediately instead of an empty install.

    Copies every file under `$HELIX_DEFAULT_SEED_DATA/ohlcv/<SYMBOL>/*.parquet`
    into `$HELIX_HOME/data/ohlcv/<SYMBOL>/` unless the target already exists
    (so a returning user's accumulated data is never overwritten). Dev runs
    (where HELIX_HOME is unset) are a no-op — the repo-relative `data/ohlcv`
    is already populated.

    Returns the number of seed files actually copied. 0 means "nothing to do"
    (no env vars, source missing, or everything already present).
    """
    home_env = os.environ.get("HELIX_HOME")
    if not home_env:
        return 0
    seed_root = os.environ.get("HELIX_DEFAULT_SEED_DATA")
    if not seed_root:
        return 0
    source_root = Path(seed_root) / "ohlcv"
    if not source_root.is_dir():
        return 0

    target_root = Path(home_env) / "data" / "ohlcv"
    target_root.mkdir(parents=True, exist_ok=True)

    copied = 0
    for symbol_dir in sorted(source_root.iterdir()):
        if not symbol_dir.is_dir():
            continue
        dest_symbol = target_root / symbol_dir.name
        dest_symbol.mkdir(parents=True, exist_ok=True)
        for seed_file in sorted(symbol_dir.iterdir()):
            if not seed_file.is_file():
                continue
            dest_file = dest_symbol / seed_file.name
            if dest_file.exists():
                # Respect existing data: either the daemon already wrote fresher
                # bars or a previous install seeded this same file.
                continue
            try:
                shutil.copyfile(seed_file, dest_file)
                copied += 1
            except OSError:
                # Best-effort: one unreadable seed file shouldn't abort the rest.
                continue
    return copied
