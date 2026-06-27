# Helix

**Helix is a free, open-source, self-hosted autonomous crypto-trading research & operations workspace.** It pairs a team of AI agents with a backtesting engine, a robustness "gauntlet," paper trading, and an operator dashboard — so idea generation, validation, and monitoring all live in one repo you run on your own machine.

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](LICENSE)

> ⚠️ **Paper + testnet by default. Not financial advice.**
> Helix ships in **paper-trading mode** with **Hyperliquid testnet** as the supported default. A live/mainnet execution engine exists in the code but is **unsupported, disabled by default, and reachable only via deliberate opt-in** — enabling real-money trading is entirely at your own risk. Trading crypto carries a substantial risk of total loss; backtest and paper results do not predict live performance, and the software's own metrics can be wrong. Use entirely at your own risk. See [`DISCLAIMER.md`](DISCLAIMER.md).

## What it does

- **Autonomous research agents** — a strategy-developer / quant-researcher / risk / execution agent team that generates hypotheses, builds strategies, and runs them through validation.
- **Backtesting engine** — bar-by-bar execution with vectorized signal generation.
- **The Gauntlet** — a robustness battery (walk-forward analysis, Monte-Carlo, parameter-jitter, cost-stress) that gates strategy promotion.
- **Paper trading** on Hyperliquid testnet, with real risk controls: stop-losses, a drawdown kill-switch, fill reconciliation, and liquidation-distance monitoring.
- **Operator dashboard** (SvelteKit) plus an in-process **MCP** server, so you can also drive it from Claude, Codex, and other MCP clients.
- **Bring your own keys** — your LLM provider key and your exchange (testnet) keys stay **local**; nothing is sent to any Helix server. There is no account and no sign-up.

## Stack

- **Backend:** Python 3.11+, FastAPI, uvicorn
- **Frontend:** SvelteKit 2, Svelte 5, Tailwind CSS, Vite
- **Database:** SQLite under `HELIX_HOME` (defaults to `~/.helix`)
- **Memory:** ChromaDB
- **Backtesting:** built-in bar-by-bar engine with vectorized signal generation
- **Exchange layer:** CCXT adapters under `helix/exchange/`
- **Default local URLs:** frontend `http://127.0.0.1:5173` · backend `http://127.0.0.1:8003` · health `http://127.0.0.1:8003/api/health`

## Quick Start

Requirements: **Python 3.11+**, **Node.js**, and **git**.

```bash
git clone https://github.com/MaxBetov-pdd/helix.git
cd helix
```

### Windows (recommended)

The PowerShell launcher creates `.venv`, installs backend + frontend dependencies, initializes the database, and starts everything:

```powershell
$env:START_BOT = '0'
$env:START_DAEMON = '0'
powershell -ExecutionPolicy Bypass -File .\start_all.ps1
```

### macOS / Linux

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -e .
cd frontend && npm install && cd ..
cp .env.example .env
START_BOT=0 START_DAEMON=0 bash start_all.sh
```

Then open **http://127.0.0.1:5173**.

### Bring your own keys

Helix uses **your** LLM provider and **your** exchange — configured locally and never sent to any Helix server. Two ways to connect an LLM provider:

- **API key (recommended):** add it in the dashboard under **Settings → Agents**, or export the provider's env var before starting (e.g. `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`).
- **OAuth sign-in:** `python -m helix auth login openai` connects your ChatGPT/provider account via OAuth. `python -m helix auth status` shows what's configured.

Add your Hyperliquid **testnet** credentials in the dashboard under `/settings`. No Helix account is required, and credentials never leave your machine.

## Documentation

- In-repo: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) · [`docs/FIRST_RUN_CHECKLIST.md`](docs/FIRST_RUN_CHECKLIST.md) · [`docs/USER_MANUAL.md`](docs/USER_MANUAL.md)

## Common commands

```bash
# Run the full stack
powershell -ExecutionPolicy Bypass -File .\start_all.ps1     # Windows
bash start_all.sh                                            # macOS / Linux

# Backend only
python -m uvicorn --app-dir . helix.api:app --host 127.0.0.1 --port 8003 --reload

# Frontend only
cd frontend && npm run dev

# CLI
python -m helix --help

# Tests / checks
python -m pytest tests -q
python -m ruff check helix tests
cd frontend && npm test && npm run check
```

## Configuration & safety

Start from `.env.example` and set only what you need. Useful values:

- `HELIX_EXECUTION_MODE=paper` — the default and only **supported** mode. `live` exists but is unsupported; a real-money order additionally requires `HELIX_ALLOW_MAINNET=1` and mainnet credentials, and is entirely at your own risk.
- `START_BOT=0` / `START_DAEMON=0` — leave the Discord bot / autonomous trading daemon off unless you want them.
- `HELIX_BIND_HOST=127.0.0.1` — localhost only by default. Exposing the API (`0.0.0.0` / a LAN IP) requires setting `HELIX_API_KEY`, or the app refuses to start.
- `HELIX_API_KEY` / `HELIX_OPERATOR_KEY` — set these if the API will be reachable beyond localhost.
- `HELIX_ENABLE_SHELL_TOOL=0` — the agent's raw shell tool is off by default (prompt-injection risk); enable only at your own risk.
- `HELIX_ENCRYPTION_KEY` — for portable encrypted credentials.
- `HELIX_HOME` — to put runtime state outside the default `~/.helix`.

Never commit `.env`, `*.db`, auth tokens, or API keys (they're gitignored). The default configuration is paper + testnet and makes no real-money trades; enabling live/mainnet is unsupported and entirely at your own risk.

## Driving Helix programmatically (no MCP) — `helix.agent`

The Helix MCP server is only a thin **stdio wrapper** over the backend REST API
on `:8003` (the same API the frontend uses). When you can't use MCP — Codex, the
Tauri app, a sidecar, CI, or when MCP drops — use the **zero-dependency HTTP
harness** instead. It does everything MCP does.

**Shell (Claude Code / Codex):** every command prints JSON to stdout.
```bash
python -m helix.agent health
python -m helix.agent context --out .tmp/ctx.json     # datasets, template, param families (large)
python -m helix.agent list --status paper
python -m helix.agent gate-report S02545              # why a strategy is/isn't promotable
# write a strategy .py to helix/strategies/custom/, then one-shot the genuine pipeline:
python -m helix.agent enqueue --file /abs/path/strat.py --dataset BTC/USDT-1h
python -m helix.agent wait-paper --strategies S02545,S02604 --timeout 1800
```
Also installed as the `helix-agent` console script. Full command list + the gate
reality (quick_screen / cost_stress / deflated-Sharpe) are in `helix/agent/README.md`.

**Python (sidecars/embedding):**
```python
from helix.agent import HelixAgentClient
fc = HelixAgentClient()                       # http://127.0.0.1:8003, env-overridable
verdict = fc.enqueue_candidate("/abs/strat.py", "BTC/USDT-1h")   # register→backtest→screen→promote (force=false)
```

**In-app / Tauri / browser (TypeScript):** use `frontend/src/lib/api/agent.ts`
(`HelixAgent`), which reuses the app's `fetchApi` (auth + base discovery):
```ts
import HelixAgent from '$lib/api/agent';
const v = await HelixAgent.enqueueCandidate('/abs/strat.py', 'BTC/USDT-1h');
```

Rules: never pass `force=true` to skip a gate; set `compatible_regimes =
["trending","volatile","range_bound"]` on custom strategies; no `stop_loss_pct`
in `default_params`. Auth (only if `:8003` is exposed beyond localhost): set
`HELIX_API_KEY` / `HELIX_OPERATOR_KEY`.

## License

Copyright (C) 2026 MaxBetov-pdd

Helix is free software, licensed under the **GNU Affero General Public License, version 3 or (at your option) any later version**. It is distributed WITHOUT ANY WARRANTY. Because it's AGPL, if you run a modified version as a network service you must make the corresponding source available to its users (AGPL §13). Full text in [`LICENSE`](LICENSE).

## Disclaimer

This is experimental software provided **AS IS** for educational and research use, and is **not financial advice**. Paper trading + Hyperliquid testnet only; substantial risk of total loss. You are solely responsible for any orders placed and for safeguarding your own credentials. See [`DISCLAIMER.md`](DISCLAIMER.md) for the full terms.
