import { randomBytes } from "node:crypto";
import path from "node:path";
import { Request, Response, Router } from "express";

const renderSwagger = (_req: Request, res: Response) => {
  const cdn = "https://cdn.jsdelivr.net";
  const nonce = randomBytes(16).toString("base64");
  const CSP = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' ${cdn}`,
    `style-src 'self' 'unsafe-inline' ${cdn}`,
    "img-src 'self' data:",
    `connect-src 'self' ${cdn}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  const html = `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>mtCMS API Documentation</title>
        <link
          rel="stylesheet"
          href="${cdn}/npm/swagger-ui-dist@5.20.2/swagger-ui.min.css"
        />
        <link
          rel="stylesheet"
          href="${cdn}/npm/swagger-themes@1.4.3/themes/dark.min.css"
        />
      </head>
      <body>
        <div id="swagger-ui"></div>
          <script src="${cdn}/npm/swagger-ui-dist@5.20.2/swagger-ui-bundle.min.js"></script>
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

const getOpenApi = (_req: Request, res: Response) => {
  const yamlPath = path.resolve(process.cwd(), "public", "api", "openapi.yaml");
  res.type("application/yaml").sendFile(yamlPath);
};

const getWsDemo = (_req: Request, res: Response) => {
  const htmlPath = path.resolve(process.cwd(), "public", "api", "ws-demo.html");
  const CSP = [
    "default-src 'self'",
    "script-src 'unsafe-inline'",
    "style-src 'unsafe-inline'",
    "connect-src 'self' ws: wss:",
    "img-src 'self' data:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
  res
    .set("Content-Type", "text/html; charset=utf-8")
    .set("Content-Security-Policy", CSP)
    .set("X-Content-Type-Options", "nosniff")
    .set("Referrer-Policy", "no-referrer")
    .set("X-Frame-Options", "DENY")
    .sendFile(htmlPath);
};

const prefix = "/api";
export const apiRouter: Router = Router();

apiRouter
  .get(`${prefix}/`, renderSwagger)
  .get(`${prefix}/openapi.yaml`, getOpenApi)
  .get(`${prefix}/ws-demo`, getWsDemo);
