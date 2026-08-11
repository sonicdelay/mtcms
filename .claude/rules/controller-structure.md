---
description: Enforce router-first structure in api/features/*.controller.ts files
globs: ["api/features/*.controller.ts"]
alwaysApply: true
---

# Controller File Structure

Order in `api/features/*.controller.ts`:

1. **Imports**
2. **Router** — `const router = new Router()` with `.prefix(...)` and route chain
3. **Handler functions**
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

Router first makes the route surface visible without scrolling past implementation.
