---
description: Erzwinge die Router-zuerst-Struktur in api/features/*.controller.ts-Dateien
globs: ["api/features/*.controller.ts"]
alwaysApply: true
---

# Struktur von Controller-Dateien

Reihenfolge in `api/features/*.controller.ts`:

1. **Imports**
2. **Router** — `const router = new Router()` mit `.prefix(...)` und Routen-Kette
3. **Handler-Funktionen**
4. **`export default router`**

```ts
import { Router, RouterContext } from "@oak/oak";
import { someService } from "../services/example.service.ts";

export default Router()
  .prefix("/api/example")
  .get("/", listItems)
  .post("/", createItem);

export const listItems = async (ctx: RouterContext<"/">) => { ... };
export const createItem = async (ctx: RouterContext<"/">) => { ... };
```

Router zuerst macht die Routen-Oberfläche sichtbar, ohne an der Implementierung vorbeiscrollen zu müssen.
