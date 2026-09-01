# mtCMS

Content-management web app: React client (`client/`) + Express 5 API running on
**Deno** (`server/`). `ai/PROJECT.md` (loaded via `opencode.jsonc`) has the fuller
architecture reference; this file is the compact quickstart and repo gotchas.

## Commands

Server (from `server/`; Deno — never `npm`/`node` here):

- `deno task dev` — watch mode; `deno task start` — prod run.
- `deno task check` — type-checks **only** `main.ts` and `main_test.ts`, not the
  whole tree.
- `deno task test` — integration suite. Requires `../.env` with `DATABASE_URL`
  and a reachable PostgreSQL/Neon DB (tests seed and clean the `nodes` table).
- `deno task lint` / `deno task fmt`.

Client (from `client/`):

- `npm run dev` — Vite on port 4210, proxies `/api` to the server.
- `npm run build` — `vite build` + `scripts/sync-dist.mjs` (copies
  `client/dist` → `server/dist` so the server serves the app).
- `npm run lint`; `npm run typecheck` (`tsc -b`).

Ports: server default **8421** (`PORT` overrides, `server/main.ts`); Vite dev
**4210**. Verify any README/plan claiming 4000 — it's stale. Set `API_TARGET`
only if you change the proxy target; the Vite proxy is hardcoded to 8421 by
default.

## Server architecture gotchas

- **All imports use explicit `.ts`/`.tsx` extensions** (Deno + client TS).
- Route files `server/src/routes/*.ts` embed their **absolute** `${prefix}/`
  path in every route and are mounted **at the root** in `server/src/app.ts` via
  the barrel `routes/index.ts` (`export const routers: Router[]`). Because they
  mount at root, **`router.use()` middleware must be scoped to `${prefix}`**
  (e.g. `router.use(`${prefix}`, authRequired)`); an unscoped `router.use(...)`
  applies to *every* request app-wide.
- Follow the structure of `server/src/routes/api.ts` (handlers as `const` fns,
  then `prefix`, then the chained router). See `.claude/rules/controller-structure.md`.
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