# Plan: Optimize Route Setup

## Goal

Each route file owns its prefix and exports a `{ prefix, router }` bundle. `app.ts` mounts all routes in a single compact loop.

---

## Changes

### Each route file (`auth.ts`, `nodes.ts`, `fm.ts`, `articles.ts`, `api.ts`)

- Export a `prefix` string constant (e.g. `"/api/auth"`)
- Export the router as before
- No handler function changes needed — they're already separate

### `server/src/app.ts`

Replace the 5 individual `app.use(...)` lines with a single array + loop:

```ts
import { authPrefix, authRouter } from "./routes/auth.ts";
import { nodesPrefix, nodesRouter } from "./routes/nodes.ts";
import { fmPrefix, fmRouter } from "./routes/fm.ts";
import { articlesPrefix, articlesRouter } from "./routes/articles.ts";
import { apiPrefix, apiRouter } from "./routes/api.ts";

// inside createApp():
const routes = [
  [authPrefix, authRouter],
  [nodesPrefix, nodesRouter],
  [fmPrefix, fmRouter],
  [articlesPrefix, articlesRouter],
  [apiPrefix, apiRouter],
] as const;

for (const [prefix, router] of routes) {
  app.use(prefix, router);
}
```

## Verification

- `deno task check` (type check)
- `deno task test` (integration tests)
