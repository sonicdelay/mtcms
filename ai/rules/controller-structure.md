# Controller file structure

Order inside `server/src/routes/*.ts` (model: `server/src/routes/api.ts`):

1. **Imports** — third-party first, then relative:
   `import type { Request, Response, Router } from "express";`
   plus the default import `import express from "express";` and `../lib/...`
   imports
2. **Handler functions** — module-level `const` with `Request`/`Response` types,
   named after HTTP verb + resource (`getApi`, `postLogin`, `getNodes`, `putFM`)
3. **`const prefix = "/api/..."`**
4. **`export const xxxRouter: Router = express.Router();`**
5. **Router setup** — middleware and route chain using `${prefix}` paths

```ts
import type { Request, Response, Router } from "express";
import express from "express";
import { someService } from "../lib/example.service.ts";

const listItems = async (_req: Request, res: Response) => {
  res.json(await someService.list());
};

const prefix = "/api/example";
export const exampleRouter: Router = express.Router();
exampleRouter.use(`${prefix}`, authRequired);
exampleRouter
  .get(`${prefix}/`, listItems)
  .post(`${prefix}/`, createItem);
```

## Rules

- Routes use **absolute paths** with `${prefix}` — never relative paths like `/`.
- Routers are mounted **at the root** in `app.ts` via the barrel `index.ts`
  (`for (const router of routers) app.use(router)`). Therefore `router.use(...)`
  middleware must be **scoped** to `${prefix}`; an unscoped
  `router.use(authRequired)` would protect every route (including `/api`).
- Handlers are module-private `const` functions; only `xxxRouter` is exported.
- The barrel file `server/src/routes/index.ts` collects all routers in
  `export const routers: Router[] = [...]`.
