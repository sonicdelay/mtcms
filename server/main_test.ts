import { strict as assert } from "node:assert";
import bcrypt from "bcryptjs";
import pool from "./src/lib/db.ts";
import { addNode, removeNode } from "./src/lib/nodes.service.ts";

const TEST_EMAIL = "test-user@example.com";
const TEST_PASSWORD = "test-secret";

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

async function seedUser() {
  await removeNodeByEmail(TEST_EMAIL);
  return addNode({
    type: "user",
    data: {
      "0": {
        values: {
          en: {
            email: TEST_EMAIL,
            password: bcrypt.hashSync(TEST_PASSWORD, 12),
            role: "Admin",
          },
        },
      },
    },
  });
}

async function removeNodeByEmail(email: string) {
  const { rows } = await pool.query(
    `SELECT id FROM nodes WHERE type = 'user' AND data->'0'->'values'->'en'->>'email' = $1`,
    [email],
  );
  for (const row of rows) {
    await removeNode(row.id);
  }
}

Deno.test("login succeeds with a database user", async () => {
  process.env.JWT_SECRET = "test-secret";
  const user = await seedUser();

  const { server, base } = await startApp();
  try {
    const res = await fetch(`${base}/api/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.token, "response must include a token");
    assert.equal(body.user.email, TEST_EMAIL);
    assert.equal(body.user.id, user.id);
  } finally {
    server.close();
    await removeNode(user.id);
  }
});

Deno.test("login fails with invalid credentials", async () => {
  process.env.JWT_SECRET = "test-secret";
  const user = await seedUser();

  const { server, base } = await startApp();
  try {
    const res = await fetch(`${base}/api/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: "wrong-password",
      }),
    });
    assert.equal(res.status, 401);
  } finally {
    server.close();
    await removeNode(user.id);
  }
});

Deno.test("refresh succeeds with a valid token", async () => {
  process.env.JWT_SECRET = "test-secret";
  const user = await seedUser();

  const { server, base } = await startApp();
  try {
    const loginRes = await fetch(`${base}/api/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
    });
    const { token } = await loginRes.json();

    const refreshRes = await fetch(`${base}/api/auth`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(refreshRes.status, 200);
  } finally {
    server.close();
    await removeNode(user.id);
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