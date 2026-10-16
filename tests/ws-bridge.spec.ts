import { test, expect, type Page } from "@playwright/test";

const USER = { id: "u1", email: "a@b.c", role: "admin" };
const TOKEN = [
  Buffer.from(JSON.stringify({ alg: "none" })).toString("base64"),
  Buffer.from(JSON.stringify({ user: USER })).toString("base64"),
  "signature"
].join(".");

interface FakeSocket {
  url: string;
  sent: string[];
  readyState: number;
  __open: () => void;
  __message: (data: unknown) => void;
}

declare global {
  interface Window {
    __sockets: FakeSocket[];
    __actions: unknown[];
  }
}

const installSocketStub = async (page: Page) => {
  await page.addInitScript(() => {
    window.__sockets = [];
    window.__actions = [];

    class FakeWebSocket {
      static readonly CONNECTING = 0;
      static readonly OPEN = 1;
      static readonly CLOSING = 2;
      static readonly CLOSED = 3;

      url: string;
      sent: string[] = [];
      readyState = 0;
      onopen: (() => void) | null = null;
      onmessage: ((event: { data: string }) => void) | null = null;
      onclose: (() => void) | null = null;
      onerror: (() => void) | null = null;

      constructor(url: string) {
        this.url = url;
        window.__sockets.push(this as unknown as FakeSocket);
      }

      __open() {
        this.readyState = 1;
        this.onopen?.();
      }

      __message(data: unknown) {
        this.onmessage?.({ data: JSON.stringify(data) });
      }

      send(data: string) {
        this.sent.push(data);
      }

      close() {
        this.readyState = 3;
      }
    }

    window.WebSocket = FakeWebSocket as unknown as typeof WebSocket;
  });
};

const openWithToken = async (page: Page) => {
  await page.goto("/");
  await page.evaluate(
    ({ token, user }) => {
      localStorage.setItem(
        "app-store-storage",
        JSON.stringify({ state: { token, user }, version: 0 })
      );
    },
    { token: TOKEN, user: USER }
  );
  await page.reload();
  await expect.poll(() => page.evaluate(() => window.__sockets.length)).toBe(1);
};

test.beforeEach(async ({ page }) => {
  await installSocketStub(page);
});

test("connects to the websocket when a token is stored", async ({ page }) => {
  await openWithToken(page);

  const url = await page.evaluate(() => window.__sockets[0].url);
  expect(url).toContain("/api/ws");
  expect(url).toContain(encodeURIComponent(TOKEN));
});

test("dispatches inbound messages into the action channel", async ({
  page
}) => {
  await openWithToken(page);

  await page.evaluate(() => {
    (
      globalThis as unknown as { sd: { onAction: (l: unknown) => void } }
    ).sd.onAction((action: unknown) => window.__actions.push(action));
    window.__sockets[0].__open();
    window.__sockets[0].__message({ type: "connected", id: "abc" });
  });

  expect(await page.evaluate(() => window.__actions)).toEqual([
    { type: "connected", id: "abc" }
  ]);
});

test("forwards send:websocket actions to the backend", async ({ page }) => {
  await openWithToken(page);

  const action = {
    type: "send:websocket",
    broadcast: true,
    data: { text: "hi" }
  };

  await page.evaluate((payload) => {
    window.__sockets[0].__open();
    (
      globalThis as unknown as { sd: { dispatchAction: (a: unknown) => void } }
    ).sd.dispatchAction(payload);
  }, action);

  expect(await page.evaluate(() => window.__sockets[0].sent)).toEqual([
    JSON.stringify(action)
  ]);
});

test("stays dormant without a token", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(300);

  expect(await page.evaluate(() => window.__sockets.length)).toBe(0);
});
