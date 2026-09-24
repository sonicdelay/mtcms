import { extname, join, resolve } from "@std/path";
import { SEPARATOR } from "@std/path/constants";

const DIST_DIR = import.meta.dirname
  ? join(import.meta.dirname, "dist")
  : "./dist";
const INDEX_FILE = join(DIST_DIR, "index.html");

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".json": "application/json",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};

function contentType(filePath: string): string {
  return MIME[extname(filePath).toLowerCase()] ?? "application/octet-stream";
}

function isInside(root: string, candidate: string): boolean {
  return candidate === root || candidate.startsWith(root + SEPARATOR);
}

function decodePathname(pathname: string): string {
  try {
    return decodeURIComponent(pathname);
  } catch {
    return pathname;
  }
}

async function serveFile(req: Request, filePath: string): Promise<Response> {
  const data = await Deno.readFile(filePath);
  const isHtml = extname(filePath).toLowerCase() === ".html";
  return new Response(data, {
    headers: {
      "content-type": contentType(filePath),
      "cache-control": isHtml
        ? "no-cache"
        : "public, max-age=31536000, immutable",
    },
  });
}

export async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);

  if (url.pathname === "/api") {
    return Response.json({
      message: "Hello, world!",
      time: new Date().toISOString(),
    });
  }
  if (url.pathname.startsWith("/api/")) {
    return Response.json({ error: "Not Found" }, { status: 404 });
  }

  const root = resolve(DIST_DIR);
  let filePath = resolve(root, "." + decodePathname(url.pathname));

  if (!isInside(root, filePath)) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const info = await Deno.stat(filePath);
    if (info.isDirectory) {
      filePath = INDEX_FILE;
    }
  } catch {
    filePath = INDEX_FILE;
  }

  return serveFile(req, filePath);
}

if (import.meta.main) {
  Deno.serve(handler);
}
