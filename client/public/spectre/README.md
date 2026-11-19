# Spectre

A TypeScript AI agent that bridges three interfaces to a local LLM (via LM Studio, OpenAI-compatible API).

```
Telegram bot ─┐
Web UI        ─┼─► src/llm.ts (sendToLLM) ─► LM Studio (LLM + tool loop)
REST API      ─┘
```

## Setup

```bash
npm install
mkdir logs
```

Create a `.env` file:

```
TELEGRAM_BOT_TOKEN=...
WEB_PORT=3000
```

LM Studio must be running at `http://192.168.2.175:1234/v1` or `http://127.0.0.1:1234/v1`.

## Commands

```bash
npm run dev      # run with hot reload via tsx watch
npm run build    # compile TypeScript to dist/
npm start        # run compiled output from dist/main.js
```

## Architecture

### Entry point (`src/main.ts`)

Boots all three surfaces in parallel: Telegram polling bot, Express web server, and the shared `sendToLLM` function.

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

Register new tools by adding them to the `plugins` array in `src/tools/index.ts`.

### Web surface (`src/web.ts`)

Express server serving `public/index.html` (a self-contained React 19 app loaded via ESM import maps — no build step). WebSocket endpoint at `/ws`.

### Action bus (`src/action-bus.ts`)

An `EventEmitter`-based action bus registered on the Express app via `app.set('actions', actions)`. Provides decoupled event communication across route handlers, middleware, and other parts of the application.

**Usage in route handlers:**

```ts
// emit an action
req.app.get('actions').emit('user:login', { id: 1, name: 'Alice' });

// listen for an action
req.app.get('actions').on('user:login', (user) => {
  console.log('User logged in:', user);
});
```

**Usage outside of request context (e.g. WebSocket handler, bot):**

```ts
import { actions } from './action-bus.ts';

actions.emit('chat:message', { text: 'hello' });
actions.on('chat:message', (msg) => { ... });
```

### Persona (`src/persona.ts`)

System prompt defining the assistant personality. Modify this file to change the agent's behavior.

### Logging (`src/logger.ts`)

Appends timestamped messages to `logs/ollama.log`. The `logs/` directory must exist before running.
