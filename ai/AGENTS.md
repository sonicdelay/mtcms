# mtCMS

Content-management web app: React client (`client/`) + Express 5 API running on
**Node.js** (`server/`). `ai/PROJECT.md` has the fuller architecture reference
and `ai/rules/*.md` the code conventions; this file is the compact quickstart
and repo gotchas.

> OpenCode auto-loads files named `AGENTS.md`: the project root at startup, then
> any `AGENTS.md` between a file you read and the workspace. This file loads when
> `ai/` is first read; `ai/PROJECT.md` and `ai/rules/*` are read on demand.

## Commands

Server (from `server/`; Node.js — runs `.ts` directly via type-stripping):

- `npm run dev` — watch mode; `npm start` — prod run.
- `npm run check` — type-checks the server with `tsc --noEmit`.

Client (from `client/`):

- `npm run dev` — Vite on port 4210, proxies `/api` to the server.
- `npm run build` — `vite build` + `scripts/sync-dist.mjs` (copies
  `client/dist` → `server/dist` so the server serves the app).
- `npm run typecheck` — `tsc --noEmit`.
- `npm run lint` / `npm run fmt` — from the **repo root**; linting uses
  ESLint + typescript-eslint, formatting uses Prettier.
- `npm run verify` — from the **repo root**; runs `fmt:check`, `lint`, `check`,
  the server unit tests (`node:test`, `test:server`), the client build, then the
  Playwright tests (the all-in-one gate). Playwright tests run against the
  **built** client served by the server, so the build step is what keeps them
  honest — `npm test` alone runs against whatever `server/dist` currently holds.

Ports: server default **8421** (`SERVER_PORT` overrides, `server/main.ts`); Vite dev
**4210**. Verify any README/plan claiming 4000 — it's stale. Set `API_TARGET`
only if you change the proxy target; the Vite proxy is hardcoded to 8421 by
default.

## Server architecture gotchas

- **All imports use explicit `.ts`/`.tsx` extensions** (Node + client TS).
- Route files `server/src/routes/*.ts` embed their **absolute** `${prefix}/`
  path in every route and are mounted **at the root** in `server/src/app.ts` via
  the barrel `routes/index.ts` (`export const routers: Router[]`). Because they
  mount at root, **`router.use()` middleware must be scoped to `${prefix}`**
  (e.g. `router.use(`${prefix}`, authRequired)`); an unscoped `router.use(...)`
  applies to _every_ request app-wide.
- Follow the structure of `server/src/routes/api.ts` (handlers as `const` fns,
  then `prefix`, then the chained router). See `ai/rules/controller-structure.md`.
- Don't add a global `express.json()` — body parsing is router-scoped. `fm`
  needs `express.raw` so uploads are never consumed by a JSON parser.
- Public: Swagger at `/api/` + `/api/openapi.yaml`. Protected (JWT required):
  `/api/nodes`, `/api/fm`. Auth: `POST /api/auth` (email+password) →
  `Authorization: Bearer <HS256 JWT>`.
- Users are `nodes` rows with `type = 'user'`; credentials live at
  `data -> "0" -> values -> en` (email, bcrypt password, role).
- Content roots: `server/media/` (fm API), `server/media/articles/` (markdown
  articles), `client/public/content/` (static pages served at `/content/*`).
- `client/dist/`, `server/dist/`, `media/`, `node_modules/` are gitignored.
