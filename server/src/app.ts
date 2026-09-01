import { existsSync } from "node:fs";
import path from "node:path";
import express from "express";
import { routers } from "./routes/index.ts";
import { problem } from "./lib/http.ts";

const distDir = path.resolve(process.cwd(), "dist");

export function createApp() {
  const app = express();
  app.disable("x-powered-by");

  for (const router of routers) {
    app.use(router);
  }

  if (existsSync(distDir)) {
    app.use(express.static(distDir));
  }

  app.get("/*splat", (req, res) => {
    if (req.path.startsWith("/api")) {
      problem(res, 404, "Not Found", "Unknown API route.");
      return;
    }
    if (existsSync(distDir)) {
      res.sendFile(path.join(distDir, "index.html"));
      return;
    }
    problem(
      res,
      503,
      "Service Unavailable",
      "Client build not found. Run `npm run build` in client/ first.",
    );
  });

  app.use(
    (
      err: Error & { type?: string; status?: number },
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      if (err?.type === "entity.parse.failed") {
        problem(res, 400, "Bad Request", "Request body must be valid JSON.");
        return;
      }
      if (err?.type === "entity.too.large") {
        problem(res, 413, "Payload Too Large", "Request body too large.");
        return;
      }
      console.error(err);
      problem(res, 500, "Internal Server Error", err.message);
    },
  );

  return app;
}
