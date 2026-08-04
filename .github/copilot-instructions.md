<!-- AUTO-GENERATED — edit ai/shared.md and ai/copilot.md instead -->

# AI Agent — Shared Context

You are a helpful TypeScript developer working on this project.

## Overview

Full-stack CMS: React 19 + Vite frontend (`app/`), Deno + Oak backend (`api/`), PostgreSQL (`@neon/serverless`).

- **Frontend**: port 4210, Vite dev proxy `/api` → `localhost:8421`
- **Backend**: port 8421, entry `api/main.ts`

## Tech Stack

- **Runner**: both `npm run dev` (tsx) and `deno task dev` (Deno) — code must be dual-compatible
- **Deps**: `package.json` single source of truth; `deno.json` has tasks/lint/fmt only (no `imports`)
- **JSR packages**: `@oak/oak`, `@tajpouria/cors`, `@neon/serverless` resolved via `npm:@jsr/...` aliases
- **`.npmrc`**: `@jsr:registry=https://npm.jsr.io`

## Structure

```
api/
├── main.ts                         # Oak app + raw http.createServer + WebSocket upgrade
├── client.ts                       # WebSocket client example
├── helpers/database.ts             # DB helper (pg pool or @neon/serverless)
├── middlewares/                     # CORS, logger, response-time, validation
├── models/                         # TS interfaces (keep in sync with app/models/)
├── modules/
│   ├── api/                        # OpenAPI docs endpoint
│   ├── auth/                       # JWT login + token refresh
│   ├── fm/                         # File management (read/write/delete media/s)
│   ├── node/                       # Node CRUD, tree queries, types/*.json
│   ├── page/                       # Static page serving
│   └── websocket/                  # WebSocket /ws + /wss
└── util/routeStaticFilesFrom.ts    # Custom static file serving (no Oak send())

app/
├── main.tsx                        # React entry, i18n init, router mount
├── app.tsx                         # Root: IxApplicationContext, modal, theme
├── routes.ts                       # React Router v7 browser router
├── actionhandler.ts                # Global action dispatch
├── i18n.ts                         # i18next (en/de)
├── index.scss
├── assets/
├── components/                     # Stateless shared components
│   ├── article-card.tsx
│   ├── dynamic-form.tsx
│   ├── login.tsx
│   ├── markdown.tsx
│   ├── model-edit.tsx
│   ├── root-error-boundary.tsx
│   ├── theme-switcher.tsx
│   ├── modal/
│   └── ui/                         # `<sd-...>` web component wrappers
├── hooks/
│   ├── use-auth-guard.ts
│   └── use-fetch.ts
├── models/                         # TS interfaces (keep in sync with api/models/)
├── modules/
│   ├── app/                        # Login page + auth store
│   ├── home/                       # Articles/landing
│   ├── admin/                      # Admin tree editor
│   └── engine/                     # Babylon.js 3D scene
├── services/
│   ├── node.ts                     # Node API calls
│   ├── file.ts                     # File management API calls
│   └── common.js
├── styles/
│   ├── _reset.scss
│   └── _variables.scss
└── data/                           # Static data (contacts, etc.)
```

## Module Convention (Backend)

Each `modules/<name>/` follows:
- `<name>.routes.ts` — Oak Router with `.prefix("/api/<name>")`, exported as default
- `<name>.controller.ts` — request/response, lazy-init any async resources
- `<name>.service.ts` — DB queries/business logic

Register routers in `main.ts` via `router.use(newRouter.routes())`.

## Module Convention (Frontend)

- **Stateless** (`app/components/`) — props/events only, no store access
- **Stateful** (`app/modules/<name>/`) — may access stores and services

## Database

- `@neon/serverless` client in `helpers/database.ts`
- Always use parameterized queries (`$1`, `$2`, ...)
- Single `nodes` table; tree parent stored at `data->'0'->>'parent'`
- JSON schemas in `modules/node/types/<typename>.json` (field defs, allowed children)

## Pages & Routing (Frontend)

| Path | Component |
|------|-----------|
| `/login` | LoginPage |
| `/` | HomeLayout → redirect to `/articles/home` |
| `/articles/:id` | ArticlesPage |
| `/admin` | AdminLayout → TasksPage |
| `/admin/edit/:id?` | EditPage |
| `/admin/call` | CallPage |
| `/admin/files` | FilesPage |
| `/admin/tools/:id?` | ToolsPage |
| `/engine` | EngineLayout (Babylon.js) |

New admin pages must also be added to `navigationItems` in `admin.layout.tsx`.

## State Management

- `modules/app/app.store.ts` — auth token + user, persisted to localStorage
- `modules/admin/admin.store.ts` — tree model, selected node, form model, language, lineage
- Add new admin state to existing `admin.store.ts`; do not create new stores

## UI Components

- Wrap UI in custom `<sd-...>` web components (defined in `app/components/ui/`)
- Use Siemens iX (`@siemens/ix-react`) only inside those wrappers
- In pages, consume `<sd-...>` components, not iX directly
- Icons from `@siemens/ix-icons/icons`
- Only page components act as `smart components` and are allowed to use store, navigation
- Presentational/dumb React components always use `app/models/component-props.interface.ts` exclusively and send data to parent via props/callbacks

## Path Aliases (Frontend)

- `@/` → `app/modules/demo/`
- `@components/` → `app/components/`
- Models now live in `app/models/` (not `@shared/`)

## Commands

| Action | npm | deno |
|--------|-----|------|
| Dev (both) | `npm run dev` | `deno task dev` |
| Dev: client | `npm run dev:client` | `deno task dev:client` |
| Dev: server | `npm run dev:server` | `deno task dev:server` |
| Build | `npm run build` | `deno task build` |
| Serve | `npm run serve` | `deno task serve` |
| Lint | `npm run lint` | `deno task lint` |
| Format | — | `deno task fmt` |
| Type check | `npm run check` | `deno task check` |


---

# Copilot-Specific Instructions

Copilot reads this via `.github/copilot-instructions.md` (symlinked/copied from here).

## Behavior

- Prefer `<sd-...>` web component wrappers over direct iX usage — see shared.md
- Do not add comments explaining what code does; only add comments for non-obvious WHY
- Do not create new Zustand stores; extend `admin.store.ts` for new admin state
- Use parameterized queries only (`$1`, `$2`, ...) — never string interpolation in SQL
