import { assertEquals } from "@std/assert";
import { join } from "@std/path";
import { handler } from "./main.ts";

const DIST_DIR = import.meta.dirname
  ? join(import.meta.dirname, "dist")
  : "./dist";

function assertHtml(res: Response): void {
  assertEquals(res.headers.get("content-type")?.startsWith("text/html"), true);
}

Deno.test("serves built index.html on /", async () => {
  const res = await handler(new Request("http://localhost/"));
  assertHtml(res);
  const body = await res.text();
  assertEquals(body.includes('id="root"'), true);
});

Deno.test("serves hashed js asset from /assets", async () => {
  const entries = [...Deno.readDirSync(join(DIST_DIR, "assets"))];
  const js = entries.find((e) => e.name.endsWith(".js"))?.name;
  if (!js) throw new Error("no js asset in dist/assets");

  const res = await handler(new Request(`http://localhost/assets/${js}`));
  assertEquals(
    res.headers.get("content-type")?.startsWith("text/javascript"),
    true,
  );
  await res.arrayBuffer();
});

Deno.test("returns index.html for unknown (SPA) routes", async () => {
  const res = await handler(new Request("http://localhost/some/spa/route"));
  assertHtml(res);
});

Deno.test("returns json on /api", async () => {
  const res = await handler(new Request("http://localhost/api"));
  const data = await res.json();
  assertEquals(data.message, "Hello, world!");
  assertEquals(typeof data.time, "string");
});

Deno.test("returns 404 json on unknown /api", async () => {
  const res = await handler(new Request("http://localhost/api/nope"));
  assertEquals(res.status, 404);
});

Deno.test("blocks path traversal", async () => {
  const res = await handler(new Request("http://localhost/..%2Fpackage.json"));
  assertEquals(res.status, 403);
});
