import type { WebSocket } from "ws";
import type { AuthUser } from "./auth.ts";

export interface WsClient {
  id: string;
  user: AuthUser;
  groups: Set<string>;
  ws: WebSocket;
}

export interface WsManager {
  getClientById(id: string): WsClient | undefined;
  joinGroup(ws: WebSocket, groupName: string): void;
  leaveGroup(ws: WebSocket, groupName: string): void;
  sendTo(ws: WebSocket, payload: unknown): void;
  sendToGroup(group: string, payload: unknown, exclude?: WsClient): void;
  broadcast(payload: unknown, exclude?: WsClient): void;
}

export type ActionHandler = (
  client: WsClient,
  payload: Record<string, unknown>,
  wsManager: WsManager,
) => Promise<void> | void;

const actionRegistry = new Map<string, ActionHandler>();

export function registerAction(
  name: string,
  handler: ActionHandler,
): void {
  actionRegistry.set(name, handler);
}

export function dispatchAction(
  client: WsClient,
  rawMessage: string,
  wsManager: WsManager,
): void {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(rawMessage);
  } catch {
    client.ws.send(
      JSON.stringify({ action: "error", data: { message: "Invalid JSON." } }),
    );
    return;
  }

  const { action } = parsed;
  if (typeof action !== "string") {
    client.ws.send(
      JSON.stringify({
        action: "error",
        data: { message: "Missing 'action' field." },
      }),
    );
    return;
  }

  const handler = actionRegistry.get(action);
  if (!handler) {
    client.ws.send(
      JSON.stringify({
        action: "error",
        data: { message: `Unknown action: ${action}` },
      }),
    );
    return;
  }

  const data = (parsed.data ?? {}) as Record<string, unknown>;

  const sendError = (err: unknown) => {
    console.error(`[actions] handler "${action}" error:`, err);
    client.ws.send(
      JSON.stringify({
        action: "error",
        data: {
          message: err instanceof Error
            ? err.message
            : "Internal action error.",
        },
      }),
    );
  };

  try {
    const result = handler(client, data, wsManager);
    if (result instanceof Promise) {
      result.catch(sendError);
    }
  } catch (err) {
    console.error(`[actions] handler "${action}" error:`, err);
    client.ws.send(
      JSON.stringify({
        action: "error",
        data: {
          message: (err as Error)?.message ?? "Internal action error.",
        },
      }),
    );
  }
}

function sendWebsocket(
  client: WsClient,
  payload: Record<string, unknown>,
  wsManager: WsManager,
): void {
  const { to, group, broadcast, data } = payload;

  const targetCount = [to, group, broadcast].filter(Boolean).length;
  if (targetCount === 0) {
    client.ws.send(
      JSON.stringify({
        action: "error",
        data: { message: "Specify exactly one of to, group, or broadcast." },
      }),
    );
    return;
  }
  if (targetCount > 1) {
    client.ws.send(
      JSON.stringify({
        action: "error",
        data: { message: "Specify exactly one of to, group, or broadcast." },
      }),
    );
    return;
  }

  const message = {
    action: "message",
    from: { id: client.id, email: client.user.email, role: client.user.role },
    data: data ?? null,
  };

  if (typeof to === "string") {
    const target = wsManager.getClientById(to);
    if (!target) {
      client.ws.send(
        JSON.stringify({
          action: "error",
          data: { message: `Client not found: ${to}` },
        }),
      );
      return;
    }
    wsManager.sendTo(target.ws, message);
  } else if (typeof group === "string") {
    if (!client.groups.has(group)) {
      client.ws.send(
        JSON.stringify({
          action: "error",
          data: { message: `Not a member of group: ${group}` },
        }),
      );
      return;
    }
    wsManager.sendToGroup(group, message, client);
  } else if (broadcast) {
    wsManager.broadcast(message, client);
  }
}

function joinGroup(
  client: WsClient,
  payload: Record<string, unknown>,
  wsManager: WsManager,
): void {
  const { group } = payload;
  if (typeof group !== "string" || !group.trim()) {
    client.ws.send(
      JSON.stringify({
        action: "error",
        data: { message: "joinGroup requires a 'group' name." },
      }),
    );
    return;
  }
  wsManager.joinGroup(client.ws, group.trim());
  client.ws.send(
    JSON.stringify({
      action: "joined",
      data: { group: group.trim() },
    }),
  );
}

function leaveGroup(
  client: WsClient,
  payload: Record<string, unknown>,
  wsManager: WsManager,
): void {
  const { group } = payload;
  if (typeof group !== "string" || !group.trim()) {
    client.ws.send(
      JSON.stringify({
        action: "error",
        data: { message: "leaveGroup requires a 'group' name." },
      }),
    );
    return;
  }
  wsManager.leaveGroup(client.ws, group.trim());
  client.ws.send(
    JSON.stringify({
      action: "left",
      data: { group: group.trim() },
    }),
  );
}

registerAction("sendWebsocket", sendWebsocket);
registerAction("joinGroup", joinGroup);
registerAction("leaveGroup", leaveGroup);
