#!/usr/bin/env node
/**
 * cors-proxy.mjs
 *
 * A tiny, dependency-free relay for index.html. iMGSRC.RU does not send CORS
 * headers, so a page opened from disk cannot read its HTML. This server:
 *
 *   - serves index.html at http://localhost:8787/
 *   - relays GET /proxy?url=<imgsrc.ru URL> and adds CORS headers
 *   - only proxies imgsrc.ru hosts (it is not an open proxy)
 *
 * Usage:
 *   node cors-proxy.mjs            # http://localhost:8787
 *   PORT=9000 node cors-proxy.mjs
 */

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PORT = Number.parseInt(process.env.PORT || "8787", 10);
const HOST = process.env.HOST || "127.0.0.1";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const INDEX_FILE = path.join(HERE, "index.html");
const USER_AGENT =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) " +
  "Chrome/126.0.0.0 Safari/537.36";
const ALLOWED_HOST = /(^|\.)imgsrc\.ru$/i;

function send(
  response,
  status,
  body,
  contentType = "text/plain; charset=utf-8"
) {
  response.writeHead(status, {
    "content-type": contentType,
    "access-control-allow-origin": "*",
    "cache-control": "no-store"
  });
  response.end(body);
}

const server = createServer(async (request, response) => {
  const url = new URL(
    request.url || "/",
    `http://${request.headers.host || "localhost"}`
  );

  response.setHeader("access-control-allow-origin", "*");
  response.setHeader("access-control-allow-methods", "GET, OPTIONS");
  response.setHeader("access-control-allow-headers", "content-type");

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  if (request.method !== "GET") {
    send(response, 405, "Method not allowed");
    return;
  }

  if (url.pathname === "/proxy") {
    if (url.searchParams.get("ping")) {
      send(
        response,
        200,
        JSON.stringify({ ok: true }),
        "application/json; charset=utf-8"
      );
      return;
    }

    const target = url.searchParams.get("url");
    if (!target) {
      send(response, 400, "Missing ?url= parameter");
      return;
    }

    let targetUrl;
    try {
      targetUrl = new URL(target);
    } catch {
      send(response, 400, "Invalid target URL");
      return;
    }

    if (
      !/^https?:$/.test(targetUrl.protocol) ||
      !ALLOWED_HOST.test(targetUrl.hostname)
    ) {
      send(response, 403, "Only imgsrc.ru URLs can be proxied");
      return;
    }

    try {
      const upstream = await fetch(targetUrl, {
        redirect: "follow",
        headers: {
          "user-agent": USER_AGENT,
          "accept-language": "en-US,en;q=0.9",
          // iMGSRC.RU puts adult albums behind a one-click “over 18” page
          // and remembers the answer in this cookie.
          cookie: "over18=yeah"
        },
        signal: AbortSignal.timeout(45_000)
      });

      const body = Buffer.from(await upstream.arrayBuffer());
      response.writeHead(upstream.status, {
        "content-type":
          upstream.headers.get("content-type") || "text/html; charset=utf-8",
        "access-control-allow-origin": "*",
        "cache-control": "no-store"
      });
      response.end(body);
    } catch (error) {
      send(response, 502, `Upstream error: ${error.message}`);
    }
    return;
  }

  if (url.pathname === "/" || url.pathname === "/index.html") {
    try {
      const html = await readFile(INDEX_FILE);
      send(response, 200, html, "text/html; charset=utf-8");
    } catch {
      send(response, 500, "index.html not found next to cors-proxy.mjs");
    }
    return;
  }

  send(response, 404, "Not found");
});

server.listen(PORT, HOST, () => {
  console.log(`iMGSRC album collector: http://localhost:${PORT}`);
  console.log(
    `Proxy endpoint:         http://localhost:${PORT}/proxy?url=<imgsrc.ru URL>`
  );
  console.log("Press Ctrl+C to stop.");
});
