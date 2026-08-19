import { strict as assert } from "node:assert";

async function startApp() {
  const { createApp } = await import("./src/app.ts");
  const app = createApp();
  const server = await new Promise<ReturnType<typeof app.listen>>((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const address = server.address();
  assert.ok(address && typeof address === "object", "server must bind a port");
  return { server, base: `http://localhost:${address.port}` };
}

Deno.test("login succeeds with admin credentials", async () => {
  process.env.ADMIN_EMAIL = "admin@example.com";
  process.env.ADMIN_PASSWORD = "secret";
  process.env.JWT_SECRET = "test-secret";

  const { server, base } = await startApp();
  try {
    const res = await fetch(`${base}/api/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@example.com",
        password: "secret",
      }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.token, "response must include a token");
    assert.equal(body.user.email, "admin@example.com");
  } finally {
    server.close();
  }
});

Deno.test("refresh succeeds with a valid token", async () => {
  process.env.ADMIN_EMAIL = "admin@example.com";
  process.env.ADMIN_PASSWORD = "secret";
  process.env.JWT_SECRET = "test-secret";

  const { server, base } = await startApp();
  try {
    const loginRes = await fetch(`${base}/api/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@example.com",
        password: "secret",
      }),
    });
    const { token } = await loginRes.json();

    const refreshRes = await fetch(`${base}/api/auth`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(refreshRes.status, 200);
  } finally {
    server.close();
  }
});

Deno.test("/api/fm requires authentication", async () => {
  const { server, base } = await startApp();
  try {
    const res = await fetch(`${base}/api/fm`);
    assert.equal(res.status, 401);
  } finally {
    server.close();
  }
});
