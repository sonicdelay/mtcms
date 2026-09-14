import type { Server } from "node:http";
import { Buffer } from "node:buffer";
import { type RawData, WebSocket, WebSocketServer } from "ws";
import { type AuthUser, verifyToken } from "./auth.ts";
import { dispatchAction, type WsClient } from "./actions.ts";
import "./actions/llm-chat.ts";

const WS_PATH = "/api/ws";
const PING_INTERVAL_MS = 5 * 60 * 1000;
const PONG_TIMEOUT_MS = 10 * 1000;

const decoder = new TextDecoder();

export class WsManager {
  private wss: WebSocketServer | null = null;
  private clients = new Map<WebSocket, WsClient>();
  private idIndex = new Map<string, WsClient>();
  private groupRegistry = new Map<string, Set<WsClient>>();
  private alive = new WeakMap<WebSocket, boolean>();
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private closeTimer: ReturnType<typeof setTimeout> | null = null;

  attachServer(httpServer: Server): void {
    const wss = new WebSocketServer({ noServer: true });
    this.wss = wss;

    httpServer.on("upgrade", (req, socket, head) => {
      const url = new URL(req.url ?? "/", "http://localhost");
      if (url.pathname !== WS_PATH) {
        socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
        socket.destroy();
        return;
      }

      const token = url.searchParams.get("token");
      if (!token) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }

      void verifyToken(token).then(
        (user) => {
          if (!user) {
            socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
            socket.destroy();
            return;
          }
          wss.handleUpgrade(req, socket, head, (ws) => {
            this.handleConnection(ws, user);
          });
        },
        () => {
          socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
          socket.destroy();
        },
      );
    });

    this.pingTimer = setInterval(() => this.checkAlive(), PING_INTERVAL_MS);

    httpServer.on("close", () => {
      if (this.pingTimer !== null) {
        clearInterval(this.pingTimer);
        this.pingTimer = null;
      }
      if (this.closeTimer !== null) {
        clearTimeout(this.closeTimer);
        this.closeTimer = null;
      }
      wss.close();
    });
  }

  private handleConnection(ws: WebSocket, user: AuthUser): void {
    const id = crypto.randomUUID();
    const client: WsClient = { id, user, groups: new Set(), ws };

    this.alive.set(ws, true);
    ws.on("pong", () => {
      this.alive.set(ws, true);
    });

    this.clients.set(ws, client);
    this.idIndex.set(id, client);

    this.sendTo(ws, { action: "connected", data: { id } });

    ws.on("message", (data: RawData) => {
      let message: string;
      if (typeof data === "string") {
        message = data;
      } else if (Array.isArray(data)) {
        message = Buffer.concat(data as Buffer[]).toString();
      } else {
        message = decoder.decode(data as Buffer);
      }
      dispatchAction(client, message, this);
    });

    ws.on("close", () => this.handleClose(ws));
    ws.on("error", () => this.handleClose(ws));
  }

  private handleClose(ws: WebSocket): void {
    const client = this.clients.get(ws);
    if (!client) {
      return;
    }

    for (const group of client.groups) {
      this.groupRegistry.get(group)?.delete(client);
    }
    this.idIndex.delete(client.id);
    this.clients.delete(ws);
  }

  private checkAlive(): void {
    for (const ws of this.clients.keys()) {
      this.alive.set(ws, false);
      ws.ping();
    }

    if (this.closeTimer !== null) {
      clearTimeout(this.closeTimer);
    }
    this.closeTimer = setTimeout(() => {
      for (const ws of this.clients.keys()) {
        if (!this.alive.get(ws)) {
          ws.terminate();
          this.handleClose(ws);
        }
      }
    }, PONG_TIMEOUT_MS);
  }

  joinGroup(ws: WebSocket, groupName: string): void {
    const client = this.clients.get(ws);
    if (!client) {
      return;
    }
    client.groups.add(groupName);
    let members = this.groupRegistry.get(groupName);
    if (!members) {
      members = new Set();
      this.groupRegistry.set(groupName, members);
    }
    members.add(client);
  }

  leaveGroup(ws: WebSocket, groupName: string): void {
    const client = this.clients.get(ws);
    if (!client) {
      return;
    }
    client.groups.delete(groupName);
    this.groupRegistry.get(groupName)?.delete(client);
  }

  getClientById(id: string): WsClient | undefined {
    return this.idIndex.get(id);
  }

  sendTo(ws: WebSocket, payload: unknown): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  }

  sendToGroup(group: string, payload: unknown, exclude?: WsClient): void {
    const members = this.groupRegistry.get(group);
    if (!members) {
      return;
    }
    for (const member of members) {
      if (member !== exclude) {
        this.sendTo(member.ws, payload);
      }
    }
  }

  broadcast(payload: unknown, exclude?: WsClient): void {
    for (const client of this.clients.values()) {
      if (client !== exclude) {
        this.sendTo(client.ws, payload);
      }
    }
  }
}

export const wsManager = new WsManager();
