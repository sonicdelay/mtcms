# Agents.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # run with hot reload via tsx watch (primary development mode)
npm run build    # compile TypeScript to dist/
npm start        # run compiled output from dist/main.js
```

No test runner is configured — `npm test` exits with an error.

Create the log directory before first run:
```bash
mkdir logs
```

## Environment

Requires a `.env` file with:
```
TELEGRAM_BOT_TOKEN=... # optional, if missing feature is deaktivated
WEB_PORT=3000        # optional, defaults to 3000
CORS_ORIGIN=*        # optional, comma-separated allowed origins
JWT_SECRET=...       # used by auth module
POSTGRES_URL=...     # optional, fallback DATABASE_URL
DATABASE_URL=...     # optional, fallback for Postgres repositories
```

LM Studio must be running at `http://192.168.2.175:1234/v1` or `http://127.0.0.1:1234/v1` with the model `gemma-4-e4b-uncensored-hauhaucs-aggressive` loaded.

## Architecture

**Spectre** is a TypeScript AI agent that bridges three interfaces to a local LLM (via LM Studio, OpenAI-compatible API):

```
Telegram bot ─┐
Web UI        ─┼─► src/llm.ts (sendToLLM) ─► LM Studio (LLM + tool loop)
REST API      ─┘
```

### Entry point

`src/main.ts` boots all three surfaces in parallel: Telegram polling bot, Express web server, and the shared `sendToLLM` function.

### LLM layer (`src/llm.ts`)

`sendToLLM` implements a single-turn tool-use loop:
1. Sends user message + persona as system prompt to the LLM with tools exposed.
2. If the model requests tool calls, executes each via the plugin registry, appends results, then sends a second completion request.
3. Falls back across `serverUrls` (remote LAN first, then localhost).

### Tool plugin system (`src/tools/`)

Each tool is a `ToolPlugin` object with three fields:
- `name` — matches the function name in the OpenAI tool definition
- `definition` — the `ChatCompletionTool` schema passed to the model
- `run(rawArguments: string)` — receives JSON string, returns `Record<string, unknown>`

Register new tools by adding them to the `plugins` array in `src/tools/index.ts`. Both existing tools use Playwright (headless Chromium): `google_search` scrapes Google results, `open_browser` opens a URL in a visible browser window.

### Web + API surface

`src/web.ts` builds the Express app and starts a single HTTP server used for:
- REST endpoints (mounted from `src/modules/index.ts`)
- static frontend from `public/`
- WebSocket endpoint (delegated to `src/websocket.ts`)

Current route modules are registered via `moduleRoutes` in `src/modules/index.ts`:
- `auth`
- `chat`
- `filemanager`
- `nodes`

### Middleware layout (`src/middlewares/`)

Middleware setup is split into:
- `core.middleware.ts` — CORS, JSON/body limits, static serving, Express hardening (`x-powered-by`)
- `error.middleware.ts` — 404 not found + centralized error handler
- `index.ts` — barrel exports

### WebSocket surface (`src/websocket.ts`)

WebSocket server runs on the same port as Express (`ws://localhost:<WEB_PORT>/ws`) using `ws`.

Current behavior:
1. Send `{"type":"connected"}` on connect.
2. Accept JSON payload `{ message, userName? }`.
3. Call `sendToLLM` and return `{"type":"reply","reply":...}`.
4. Return structured errors as `{"type":"error","error":...}`.

### Action bus (`src/action-bus.ts`)

The app exposes a process-local action bus based on `EventEmitter`:
- `ActionBus` extends `EventEmitter`; emit/on directly (e.g. `actions.emit(action, ...args)`).
- `actions` singleton is attached to Express via `app.set('actions', actions)` in `src/web.ts`.

### Persona (`src/persona.ts`)

System prompt defining the assistant as "Lexi" — a German-speaking assistant with specific Gen-Z slang vocabulary. Modify this file to change the agent's personality.

### Logging (`src/logger.ts`)

Appends timestamped messages to `logs/ollama.log`. The `logs/` directory must exist before running.

## Data + Auth Notes

- Auth feature uses `jose` for JWT access/refresh token flows.
- Node/file-related persistence uses repository-style DB access with `pg`.
- Node persistence intentionally does not store tree helper fields like `children`/breadcrumbs.
