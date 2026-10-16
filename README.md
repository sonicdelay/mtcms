# mtCMS

A content-management web app split into a React client and an Express API server.

- `client/` — Vite + React 19 + React Router 7 + Tailwind CSS 4 with the
  in-repo `Sd*` component library. Includes the home site, the admin UI, and a
  BabylonJS 3D engine view that is lazy-loaded (loaded only when navigating to
  `/engine`).
- `server/` — Express 5 running on Node.js, backed by PostgreSQL (Neon or
  `pg`). Serves the `/api/*` routes, Swagger documentation, and the built client
  from `dist/`.

## Prerequisites

- Node.js 24+ and npm (client and server)

## Environment

Copy `.env.example` to `.env` (at the repo root) and fill in:

- `DATABASE_URL` / `DBPROVIDER` — PostgreSQL connection (Neon or `pg`); user
  accounts authenticate against `user` nodes in the database
- `JWT_SECRET` — HS256 secret for signing tokens
- `SERVER_PORT` — server port (default `8421`)

The client's dev server proxies `/api` to the server; set `API_TARGET` in
`client/.env` (default `http://localhost:4210`) if needed.

## Commands

Server (run from `server/`):

```bash
npm run dev          # watch mode
npm start            # run
npm run check        # type-check
```

Client (run from `client/`):

```bash
npm install
npm run dev          # Vite dev server on http://localhost:4210
npm run build        # vite build + copy dist into server/dist
npm run typecheck    # tsc --noEmit
```

Formatting uses Prettier and linting uses ESLint + typescript-eslint: run
`npm run fmt` / `npm run lint` from the repo root. `npm run verify` runs every
check — format, lint, type-check, a client build, and the Playwright tests — in
one command. `npm test` runs Playwright directly; it needs a current
`server/dist` (run `npm run build` first, since the tests drive the built app).

## Production

Build the client, then start the server — it serves the client from
`server/dist`:

```bash
cd client && npm run build
cd ../server && npm start
```

The server serves the SPA with a catch-all route that falls back to
`dist/index.html`; unknown `/api/*` paths return a JSON `404`.

## Docker

The multi-stage `Dockerfile` at the repo root builds the client, copies the
bundle into `server/dist`, and runs the server — one container serves both the
SPA and `/api/*`:

```bash
cp .env.example .env   # fill in DATABASE_URL, JWT_SECRET, ...
docker compose up --build
```

The app is then on `http://localhost:<SERVER_PORT>` (from `.env`, default
`8421`). Uploaded files (file manager / articles) live in the `media` named
volume; your PostgreSQL (Neon or `pg`) stays external, configured via
`DATABASE_URL` in `.env`.

## API

- `POST /api/auth` — login (`{ email, password }`)
- `GET /api/auth` — refresh the token
- `/api/nodes` — CRUD for CMS nodes (JWT required)
- `/api/fm/:path*` — file manager over `server/media/` (JWT required)
- `/api/articles/:path*` — article listing / markdown from `server/media/articles/`
- `/content/:id.md` — public markdown pages served statically from `client/public/content/`
- `/api` — Swagger UI, `/api/openapi.yaml` — OpenAPI spec
