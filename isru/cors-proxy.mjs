#!/usr/bin/env node
/**
 * cors-proxy.mjs
 *
 * A tiny, dependency-free relay for index.html. iMGSRC.RU does not send CORS
 * headers, so a page opened from disk cannot read its HTML. This server:
 *
 *   - serves index.html at http://localhost:8787/
 *   - serves its assets (styles.css, gallery.css, app.js, lightbox.js)
 *   - serves users.json (the default user list index.html loads at startup)
 *   - rebuilds one letter group of users.json on POST /users.json?letter=A
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
import { rebuildUsersGroup } from "./build-users-json.mjs";

const PORT = Number.parseInt(process.env.PORT || "8787", 10);
const HOST = process.env.HOST || "127.0.0.1";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const INDEX_FILE = path.join(HERE, "index.html");
const USERS_FILE = path.join(HERE, "users.json");
const STATIC_FILES = new Map(
  [
    ["/styles.css", "styles.css", "text/css; charset=utf-8"],
    ["/gallery.css", "gallery.css", "text/css; charset=utf-8"],
    ["/app.js", "app.js", "text/javascript; charset=utf-8"],
    ["/lightbox.js", "lightbox.js", "text/javascript; charset=utf-8"]
  ].map(([route, file, contentType]) => [
    route,
    { file: path.join(HERE, file), contentType }
  ])
);
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
  response.setHeader("access-control-allow-methods", "GET, POST, OPTIONS");
  response.setHeader("access-control-allow-headers", "content-type");

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  if (request.method === "POST" && url.pathname === "/users.json") {
    const letter = (url.searchParams.get("letter") || "A").toUpperCase();
    try {
      const payload = await rebuildUsersGroup(letter);
      send(
        response,
        200,
        JSON.stringify(payload),
        "application/json; charset=utf-8"
      );
    } catch (error) {
      if (error.code === "INVALID_GROUP") {
        send(response, 400, error.message);
        return;
      }
      console.error(`Failed to rebuild users for "${letter}":`, error);
      send(response, 502, "Could not rebuild that letter from imgsrc.ru");
    }
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

  const asset = STATIC_FILES.get(url.pathname);
  if (asset) {
    try {
      const body = await readFile(asset.file);
      send(response, 200, body, asset.contentType);
    } catch {
      send(response, 404, `${url.pathname} not found next to cors-proxy.mjs`);
    }
    return;
  }

  if (url.pathname === "/users.json") {
    try {
      const json = await readFile(USERS_FILE);
      send(response, 200, json, "application/json; charset=utf-8");
    } catch {
      send(response, 404, "users.json not found; run build-users-json.mjs");
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
