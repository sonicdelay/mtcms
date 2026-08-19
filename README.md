# mtCMS

A content-management web app split into a React client and an Express API server.

- `client/` — Vite + React 19 + React Router 7 + Tailwind CSS 4. Includes the
  home site, the admin UI (Siemens iX), and a BabylonJS 3D engine view that is
  lazy-loaded (loaded only when navigating to `/engine`).
- `server/` — Express 5 running on Deno, backed by PostgreSQL (Neon or `pg`).
  Serves the `/api/*` routes, Swagger documentation, and the built client from
  `dist/`.

## Prerequisites

- Deno 2.x for the server
- Node.js + npm for the client

## Environment

Copy `.env.example` to `.env` (at the repo root) and fill in:

- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — bootstrap admin credentials
- `DATABASE_URL` / `DBPROVIDER` — PostgreSQL connection (Neon or `pg`)
- `JWT_SECRET` — HS256 secret for signing tokens
- `PORT` — server port (default `4000`)

The client's dev server proxies `/api` to the server; set `API_TARGET` in
`client/.env` (default `http://localhost:4000`) if needed.

## Commands

Server (run from `server/`):

```bash
deno task dev        # watch mode
deno task start      # run
deno task check      # type-check
deno task test       # integration tests
```

Client (run from `client/`):

```bash
npm install
npm run dev          # Vite dev server on http://localhost:4210
npm run build        # vite build + copy dist into server/dist
npm run lint         # eslint
npx tsc -b           # type-check
```

## Production

Build the client, then start the server — it serves the client from
`server/dist`:

```bash
cd client && npm run build
cd ../server && deno task start
```

The server serves the SPA with a catch-all route that falls back to
`dist/index.html`; unknown `/api/*` paths return a JSON `404`.

## API

- `POST /api/auth` — login (`{ email, password }`)
- `GET /api/auth` — refresh the token
- `/api/nodes` — CRUD for CMS nodes (JWT required)
- `/api/fm/:path*` — file manager over `server/media/` (JWT required)
- `/api/articles/:path*` — article listing / markdown from `server/media/articles/`
- `/content/:id.md` — public markdown pages served statically from `client/public/content/`
- `/api` — Swagger UI, `/api/openapi.yaml` — OpenAPI spec
