# Helix

**Helix — это бесплатное, open-source, self-hosted рабочее пространство для автономных исследований и операционных процессов в криптотрейдинге.** Он объединяет команду AI-агентов с движком бэктестинга, «gauntlet» для проверки устойчивости, paper trading и интерфейсом оператора, чтобы вы могли локально проектировать, тестировать и запускать торговые стратегии под своим контролем.

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](LICENSE)

> ⚠️ **По умолчанию — paper + testnet. Не является финансовой рекомендацией.**
> Helix поставляется в **режиме paper-trading** с **Hyperliquid testnet** в качестве поддерживаемого варианта по умолчанию. Движок live/mainnet присутствует в коде, но он **не поддерживается, отключён по умолчанию и требует явного включения**.

## Что делает Helix

- **Автономные исследовательские агенты** — команда из strategy-developer / quant-researcher / risk / execution агентов, которая генерирует гипотезы, строит стратегии и прогоняет их через валидацию.
- **Движок бэктестинга** — пошаговое исполнение по барам с векторизованной генерацией сигналов.
- **The Gauntlet** — набор проверок устойчивости (walk-forward analysis, Monte-Carlo, parameter-jitter, cost-stress), который определяет, можно ли продвигать стратегию дальше.
- **Paper trading** на Hyperliquid testnet с реальными risk controls: stop-loss, kill-switch по просадке, сверка исполнений и мониторинг дистанции до ликвидации.
- **Панель оператора** (SvelteKit) плюс встроенный **MCP**-сервер, поэтому систему можно запускать и через Claude, Codex и другие MCP-клиенты.
- **Ваши собственные ключи** — ключ LLM-провайдера и ключи биржи (testnet) остаются **локально**; ничего не отправляется на серверы Helix. Никаких аккаунтов и регистрации не требуется.

## Стек

- **Backend:** Python 3.11+, FastAPI, uvicorn
- **Frontend:** SvelteKit 2, Svelte 5, Tailwind CSS, Vite
- **База данных:** SQLite в `HELIX_HOME` (по умолчанию `~/.helix`)
- **Память:** ChromaDB
- **Бэктестинг:** встроенный движок по барам с векторизованной генерацией сигналов
- **Слой обмена:** адаптеры CCXT в `helix/exchange/`
- **URL по умолчанию:** frontend `http://127.0.0.1:5173` · backend `http://127.0.0.1:8003` · health `http://127.0.0.1:8003/api/health`

## Быстрый старт

Требования: **Python 3.11+**, **Node.js** и **git**.

```bash
git clone https://github.com/MaxBetov-pdd/helix.git
cd helix
```

### Windows (рекомендуется)

PowerShell-скрипт создаёт `.venv`, устанавливает зависимости backend и frontend, инициал��зирует базу данных и запускает всё:

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

Затем откройте **http://127.0.0.1:5173**.

### Подключите свои ключи

Helix использует **ваш** LLM-провайдер и **вашу** биржу — всё настраивается локально и никогда не отправляется на серверы Helix. Есть два способа подключить LLM-провайдера:

- **API key (рекомендуется):** добавьте его в панели **Settings → Agents**, либо экспортируйте переменную окружения провайдера перед запуском (например, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`).
- **OAuth sign-in:** `python -m helix auth login openai` подключает ваш ChatGPT/provider account через OAuth. `python -m helix auth status` показывает текущую конфигурацию.

Добавьте ваши Hyperliquid **testnet**-учётные данные в разделе **/settings**. Аккаунт Helix не требуется, и credentials никогда не покидают ваш компьютер.

## Документация

- В репозитории: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) · [`docs/FIRST_RUN_CHECKLIST.md`](docs/FIRST_RUN_CHECKLIST.md) · [`docs/USER_MANUAL.md`](docs/USER_MANUAL.md)

## Частые команды

```bash
# Запуск всего стека
powershell -ExecutionPolicy Bypass -File .\start_all.ps1     # Windows
bash start_all.sh                                            # macOS / Linux

# Только backend
python -m uvicorn --app-dir . helix.api:app --host 127.0.0.1 --port 8003 --reload

# Только frontend
cd frontend && npm run dev

# CLI
python -m helix --help

# Тесты / проверки
python -m pytest tests -q
python -m ruff check helix tests
cd frontend && npm test && npm run check
```

## Конфигурация и безопасность

Начните с `.env.example` и укажите только то, что вам нужно. Полезные значения:

- `HELIX_EXECUTION_MODE=paper` — режим по умолчанию и единственный **поддерживаемый**. `live` существует, но не поддерживается; для реальных ордеров дополнительно требуется `HELIX_ALLOW_MAINNET=1` и mainnet-учётные данные, ...
- `START_BOT=0` / `START_DAEMON=0` — оставьте Discord bot / autonomous trading daemon выключенными, если они вам не нужны.
- `HELIX_BIND_HOST=127.0.0.1` — только localhost по умолчанию. Если вы открываете API наружу (`0.0.0.0` / LAN IP), необходимо задать `HELIX_API_KEY`, иначе приложение откажется запускаться.
- `HELIX_API_KEY` / `HELIX_OPERATOR_KEY` — задайте их, если API будет доступен не только на localhost.
- `HELIX_ENABLE_SHELL_TOOL=0` — raw shell tool агента по умолчанию отключён (риск prompt injection); включайте только на свой страх и риск.
- `HELIX_ENCRYPTION_KEY` — для переносимых зашифрованных credentials.
- `HELIX_HOME` — чтобы хранить runtime state вне стандартного `~/.helix`.

Никогда не коммитьте `.env`, `*.db`, auth tokens или API keys (они уже в gitignore). Конфигурация по умолчанию — paper + testnet, она не совершает реальных сделок; включение live/mainnet не поддерживается и ...

## Программное управление Helix (без MCP) — `helix.agent`

Helix MCP server — это лишь тонкая **stdio-обёртка** над REST API backend'а
на `:8003` (тем же API, которое использует frontend). Когда MCP использовать нельзя — Codex, Tauri-приложение, sidecar, CI или при падении MCP — используйте **zero-dependency HTTP harness**. Он делает всё то же, что и MCP.

**Shell (Claude Code / Codex):** каждая команда выводит JSON в stdout.
```bash
python -m helix.agent health
python -m helix.agent context --out .tmp/ctx.json     # datasets, template, param families (large)
python -m helix.agent list --status paper
python -m helix.agent gate-report S02545              # почему стратегия может или не может быть продвинута
# write a strategy .py to helix/strategies/custom/, then one-shot the genuine pipeline:
python -m helix.agent enqueue --file /abs/path/strat.py --dataset BTC/USDT-1h
python -m helix.agent wait-paper --strategies S02545,S02604 --timeout 1800
```
Также установлен как console script `helix-agent`. Полный список команд + реальная логика gate (quick_screen / cost_stress / deflated-Sharpe) описаны в `helix/agent/README.md`.

**Python (sidecars/embedding):**
```python
from helix.agent import HelixAgentClient
fc = HelixAgentClient()                       # http://127.0.0.1:8003, env-overridable
verdict = fc.enqueue_candidate("/abs/strat.py", "BTC/USDT-1h")   # register→backtest→screen→promote (force=false)
```

**In-app / Tauri / browser (TypeScript):** используйте `frontend/src/lib/api/agent.ts`
(`HelixAgent`), который повторно использует `fetchApi` приложения (auth + base discovery):
```ts
import HelixAgent from '$lib/api/agent';
const v = await HelixAgent.enqueueCandidate('/abs/strat.py', 'BTC/USDT-1h');
```

Правила: никогда не передавайте `force=true`, чтобы обойти gate; задавайте `compatible_regimes =
["trending","volatile","range_bound"]` для пользовательских стратегий; не указывайте `stop_loss_pct`
в `default_params`. Auth (только если `:8003` открыт не только на localhost): задайте
`HELIX_API_KEY` / `HELIX_OPERATOR_KEY`.

## Лицензия

Copyright (C) 2026 MaxBetov-pdd

Helix — это свободное ПО, распространяемое под **GNU Affero General Public License, version 3 или (по вашему выбору) любой более поздней версии**. Оно распространяется БЕЗ КАКИХ-ЛИБО ГАРАНТИЙ. Поскольку это AGPL, если вы запускаете...

## Отказ от ответственности

Это экспериментальное ПО, предоставляемое **AS IS** для образовательных и исследовательских целей, и не является финансовой рекомендацией. Только paper trading + Hyperliquid testnet; существует существенный риск полной потери средств. Вы сами несёте ...
