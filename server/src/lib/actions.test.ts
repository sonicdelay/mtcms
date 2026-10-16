import assert from "node:assert/strict";
import { test } from "node:test";
import type { WebSocket } from "ws";
import {
  dispatchAction,
  registerAction,
  type WsClient,
  type WsManager
} from "./actions.ts";
import type { AuthUser } from "./auth.ts";

const createClient = () => {
  const sent: string[] = [];
  const ws = {
    send: (raw: string) => {
      sent.push(raw);
    }
  } as unknown as WebSocket;
  const user: AuthUser = {
    id: "user-1",
    email: "test@example.com",
    role: "admin"
  };
  const client: WsClient = {
    id: "client-1",
    user,
    groups: new Set(),
    ws
  };
  return { client, sent };
};

const createManager = (overrides: Partial<WsManager> = {}): WsManager => ({
  getClientById: () => undefined,
  joinGroup: () => undefined,
  leaveGroup: () => undefined,
  sendTo: () => undefined,
  sendToGroup: () => undefined,
  broadcast: () => undefined,
  ...overrides
});

const parseAll = (sent: string[]) => sent.map((raw) => JSON.parse(raw));

test("a message without a type is rejected with a typed error", () => {
  const { client, sent } = createClient();

  dispatchAction(
    client,
    JSON.stringify({ action: "joinGroup" }),
    createManager()
  );

  const [message] = parseAll(sent);
  assert.equal(message.type, "error");
  assert.equal(message.message, "Missing 'type' field.");
});

test("invalid JSON is rejected with a typed error", () => {
  const { client, sent } = createClient();

  dispatchAction(client, "{not json", createManager());

  const [message] = parseAll(sent);
  assert.equal(message.type, "error");
  assert.equal(message.message, "Invalid JSON.");
});

test("an unregistered type reports the unknown action", () => {
  const { client, sent } = createClient();

  dispatchAction(
    client,
    JSON.stringify({ type: "nope:missing" }),
    createManager()
  );

  const [message] = parseAll(sent);
  assert.equal(message.type, "error");
  assert.equal(message.message, "Unknown action: nope:missing");
});

test("a registered handler receives the rest, without the type field", () => {
  let received: Record<string, unknown> | undefined;
  registerAction("test:echo", (_client, payload) => {
    received = payload;
  });
  const { client } = createClient();

  dispatchAction(
    client,
    JSON.stringify({ type: "test:echo", group: "lobby", data: { hi: 1 } }),
    createManager()
  );

  assert.deepEqual(received, { group: "lobby", data: { hi: 1 } });
});

test("send:websocket broadcasts a typed message envelope", () => {
  const broadcasts: unknown[] = [];
  const manager = createManager({
    broadcast: (payload) => {
      broadcasts.push(payload);
    }
  });
  const { client } = createClient();

  dispatchAction(
    client,
    JSON.stringify({
      type: "send:websocket",
      broadcast: true,
      data: { text: "hello" }
    }),
    manager
  );

  assert.deepEqual(broadcasts, [
    {
      type: "message",
      from: { id: "client-1", email: "test@example.com", role: "admin" },
      data: { text: "hello" }
    }
  ]);
});
