"use client";

import type { MiniNode, Node } from "./types";

export interface FileItem {
  name: string;
  path: string;
  type: "dir" | "file";
}

export interface EditorNode extends Node {
  children: MiniNode[];
  breadcrumb: MiniNode[];
}

export interface AuthResponse {
  token: string;
  user: { id: string; email: string; role: string };
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const detail =
      (body as { detail?: string } | null)?.detail ?? `HTTP ${res.status}`;
    throw new Error(detail);
  }
  return (await res.json()) as T;
}

export async function login(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const res = await fetch("/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handle<AuthResponse>(res);
}

export async function refreshToken(token: string): Promise<AuthResponse> {
  const res = await fetch("/api/auth", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handle<AuthResponse>(res);
}

export async function getNodes(token: string): Promise<Node[]> {
  const res = await fetch("/api/nodes", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handle<Node[]>(res);
}

export async function getNode(token: string, id: string): Promise<Node> {
  const res = await fetch(`/api/nodes/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handle<Node>(res);
}

export async function getNodeEditor(
  token: string,
  id: string,
): Promise<EditorNode> {
  const res = await fetch(`/api/nodes/${id}?scope=editor`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handle<EditorNode>(res);
}

export async function createNode(
  token: string,
  input: { type: string; data: Record<string, unknown> },
): Promise<Node> {
  const res = await fetch("/api/nodes", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
  return handle<Node>(res);
}

export async function updateNode(
  token: string,
  id: string,
  patch: { type?: string; data?: Record<string, unknown> },
): Promise<Node> {
  const res = await fetch(`/api/nodes/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(patch),
  });
  return handle<Node>(res);
}

export async function deleteNode(token: string, id: string): Promise<void> {
  const res = await fetch(`/api/nodes/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const detail =
      (body as { detail?: string } | null)?.detail ?? `HTTP ${res.status}`;
    throw new Error(detail);
  }
}

export async function listMedia(
  token: string,
  relPath = "",
): Promise<FileItem[]> {
  const path = relPath
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/");
  const res = await fetch(`/api/fm${path ? `/${path}` : ""}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handle<FileItem[]>(res);
}

export async function readMediaText(
  token: string,
  relPath: string,
): Promise<string> {
  const path = relPath
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/");
  const res = await fetch(`/api/fm/${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const detail =
      (body as { detail?: string } | null)?.detail ?? `HTTP ${res.status}`;
    throw new Error(detail);
  }
  const text = await res.text();
  if (res.headers.get("content-type")?.includes("application/json")) {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      throw new Error("Path is a directory.");
    }
  }
  return text;
}

export async function writeMediaFile(
  token: string,
  relPath: string,
  content: string,
): Promise<void> {
  const path = relPath
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/");
  const res = await fetch(`/api/fm/${path}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "text/plain",
    },
    body: content,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const detail =
      (body as { detail?: string } | null)?.detail ?? `HTTP ${res.status}`;
    throw new Error(detail);
  }
}

export async function uploadMediaFile(
  token: string,
  relPath: string,
  file: Blob,
): Promise<void> {
  const path = relPath
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/");
  const res = await fetch(`/api/fm/${path}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const detail =
      (body as { detail?: string } | null)?.detail ?? `HTTP ${res.status}`;
    throw new Error(detail);
  }
}

export async function createMediaDirectory(
  token: string,
  relPath: string,
): Promise<void> {
  const path = relPath
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/");
  const res = await fetch(`/api/fm/${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const detail =
      (body as { detail?: string } | null)?.detail ?? `HTTP ${res.status}`;
    throw new Error(detail);
  }
}

export async function deleteMediaPath(
  token: string,
  relPath: string,
): Promise<void> {
  const path = relPath
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/");
  const res = await fetch(`/api/fm/${path}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const detail =
      (body as { detail?: string } | null)?.detail ?? `HTTP ${res.status}`;
    throw new Error(detail);
  }
}

export function nodeTitle(node: Node): string {
  const root = (node.data as { "0"?: { title?: string } } | null)?.["0"];
  return root?.title ?? node.type;
}

export function nodeParent(node: Node): string | null {
  const root = (node.data as { "0"?: { parent?: string } } | null)?.["0"];
  return root?.parent ?? null;
}
