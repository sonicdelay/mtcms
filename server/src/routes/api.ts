import { randomBytes } from "node:crypto";
import path from "node:path";
import type { Request, Response, Router } from "express";
import express from "express";

const getApi = (_req: Request, res: Response) => {
  const nonce = randomBytes(16).toString("base64");
  const CSP = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://cdn.jsdelivr.net`,
    "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
    "img-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>API Documentation</title>
  <link
    rel="stylesheet"
    href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.20.2/swagger-ui.min.css"
  />
  <link
    rel="stylesheet"
    href="https://cdn.jsdelivr.net/npm/swagger-themes@1.4.3/themes/dark.min.css"
  />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.20.2/swagger-ui-bundle.min.js"></script>
  <script nonce="${nonce}">
    const url = "/api/openapi.yaml";
    SwaggerUIBundle({ url, dom_id: "#swagger-ui" });
  </script>
</body>
</html>`;

  res
    .set("Content-Type", "text/html; charset=utf-8")
    .set("Content-Security-Policy", CSP)
    .set("X-Content-Type-Options", "nosniff")
    .set("Referrer-Policy", "no-referrer")
    .set("X-Frame-Options", "DENY")
    .send(html);
};

const getOpenAPIYaml = (_req: Request, res: Response) => {
  const yamlPath = path.resolve(process.cwd(), "public", "api", "openapi.yaml");
  res.type("application/yaml").sendFile(yamlPath);
};

const prefix = "/api";
export const apiRouter: Router = express.Router();
export const apiController = { prefix, router: apiRouter };
apiRouter
  .get(`${prefix}/`, getApi)
  .get(`${prefix}/openapi.yaml`, getOpenAPIYaml);
