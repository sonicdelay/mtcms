import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { test, expect, type BrowserContext, type Page } from "@playwright/test";

const APP_URL = "http://localhost:8421";

interface ClientAction {
  type: string;
  [key: string]: unknown;
}

// The server verifies an HS256 token signed with JWT_SECRET, so a test can mint
// one without touching the user database.
const loadJwtSecret = (): string | undefined => {
  try {
    for (const raw of readFileSync(".env", "utf8").split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq === -1) continue;
      if (line.slice(0, eq).trim() !== "JWT_SECRET") continue;
      return line
        .slice(eq + 1)
        .trim()
        .replace(/^["']|["']$/g, "");
    }
  } catch {
    // No .env: the tests below skip.
  }
  return undefined;
};

const JWT_SECRET = loadJwtSecret();

const base64url = (value: Buffer): string =>
  value
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const mintToken = (user: {
  id: string;
  email: string;
  role: string;
}): string => {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(
    Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" }))
  );
  const payload = base64url(
    Buffer.from(
      JSON.stringify({
        user,
        exp: now + 3600,
        iat: now,
        iss: "mtcms",
        aud: "mtcms"
      })
    )
  );
  const signature = base64url(
    createHmac("sha256", JWT_SECRET as string)
      .update(`${header}.${payload}`)
      .digest()
  );
  return `${header}.${payload}.${signature}`;
};

const receivedActions = (page: Page): Promise<ClientAction[]> =>
  page.evaluate(
    () =>
      (globalThis as unknown as { sd?: { actions?: ClientAction[] } }).sd
        ?.actions ?? []
  );

// Loads the app with a token already in the persisted store, so the websocket
// bridge connects to the real server on mount.
const openWithToken = async (
  context: BrowserContext,
  token: string
): Promise<Page> => {
  const page = await context.newPage();
  await page.goto(APP_URL);
  await page.evaluate((value) => {
    localStorage.setItem(
      "app-store-storage",
      JSON.stringify({ state: { token: value, user: null }, version: 0 })
    );
  }, token);
  await page.reload();
  return page;
};

const waitForAction = async (page: Page, type: string): Promise<void> => {
  await expect
    .poll(() =>
      page.evaluate((wanted) => {
        const sd = (
          globalThis as unknown as { sd?: { actions?: ClientAction[] } }
        ).sd;
        return sd?.actions?.some((action) => action.type === wanted) ?? false;
      }, type)
    )
    .toBe(true);
};

test.beforeEach(() => {
  test.skip(!JWT_SECRET, "JWT_SECRET is not configured in .env");
});

test("the bridge connects to the real server and dispatches the connected frame", async ({
  browser
}) => {
  const context = await browser.newContext();
  try {
    const token = mintToken({
      id: "e2e-a",
      email: "e2e-a@example.com",
      role: "User"
    });
    const page = await openWithToken(context, token);

    await waitForAction(page, "connected");

    const connected = (await receivedActions(page)).find(
      (action) => action.type === "connected"
    );
    expect(typeof connected?.id).toBe("string");
    expect((connected?.id as string).length).toBeGreaterThan(0);
  } finally {
    await context.close();
  }
});

test("a real broadcast from one client reaches another", async ({
  browser
}) => {
  const senderContext = await browser.newContext();
  const receiverContext = await browser.newContext();
  try {
    const sender = await openWithToken(
      senderContext,
      mintToken({ id: "e2e-sender", email: "sender@example.com", role: "User" })
    );
    const receiver = await openWithToken(
      receiverContext,
      mintToken({
        id: "e2e-receiver",
        email: "receiver@example.com",
        role: "User"
      })
    );

    await waitForAction(sender, "connected");
    await waitForAction(receiver, "connected");

    await sender.evaluate(() => {
      (
        globalThis as unknown as {
          sd: { dispatchAction: (action: unknown) => void };
        }
      ).sd.dispatchAction({
        type: "send:websocket",
        broadcast: true,
        data: { text: "hello over the wire" }
      });
    });

    await receiver.waitForFunction(() => {
      const sd = (
        globalThis as unknown as { sd?: { actions?: ClientAction[] } }
      ).sd;
      return (
        sd?.actions?.some(
          (action) =>
            action.type === "message" &&
            (action.data as { text?: string } | undefined)?.text ===
              "hello over the wire"
        ) ?? false
      );
    });

    const message = (await receivedActions(receiver)).find(
      (action) =>
        action.type === "message" &&
        (action.data as { text?: string } | undefined)?.text ===
          "hello over the wire"
    );
    expect((message?.from as { email?: string } | undefined)?.email).toBe(
      "sender@example.com"
    );
  } finally {
    await senderContext.close();
    await receiverContext.close();
  }
});
