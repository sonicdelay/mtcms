---
description: Erzwinge die api.ts-Struktur in server/src/routes/*.ts-Dateien
globs: ["server/src/routes/*.ts"]
alwaysApply: true
---

# Struktur von Controller-Dateien

Reihenfolge in `server/src/routes/*.ts` (Vorbild: `server/src/routes/api.ts`):

1. **Imports** — third-party zuerst, dann relative:
   `import type { Request, Response, Router } from "express";`
   plus Default-Import `import express from "express";` und `../lib/...`-Imports
2. **Handler-Funktionen** — als Modul-Level-`const` mit `Request`/`Response`-Typen,
   benannt nach HTTP-Verb + Ressource (`getApi`, `postLogin`, `getNodes`, `putFM`)
3. **`const prefix = "/api/..."`**
4. **`export const xxxRouter: Router = express.Router();`**
5. **Router-Setup** — Middleware und Routen-Kette mit `${prefix}`-Pfaden

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

## Regeln

- Routen nutzen **absolute Pfade** mit `${prefix}` — nie relative Pfade wie `/`.
- Router werden in `app.ts` über die Barrel `index.ts` **an der Wurzel** gemountet
  (`for (const router of routers) app.use(router)`). Darum müssen auch
  `router.use(...)`-Middleware auf `${prefix}` **gescopte** werden; unscoppter
  `router.use(authRequired)` würde sonst alle Routen (inkl. `/api`) schützen.
- Handler sind modul-private `const`-Funktionen; nur `xxxRouter` wird exportiert.
- Die Barrel-Datei `server/src/routes/index.ts` sammelt alle Router in
  `export const routers: Router[] = [...]`.