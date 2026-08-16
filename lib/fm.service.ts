import { promises as fs } from "node:fs";
import path from "node:path";
import type { FileItem } from "./types";

export const MEDIA_ROOT = path.join(process.cwd(), "media");

export class MediaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MediaError";
  }
}

/**
 * Resolves a relative media path against the media root, guarding against
 * path traversal outside of it.
 */
export function resolveMediaPath(relPath = ""): string {
  const absolute = path.resolve(MEDIA_ROOT, relPath);
  if (absolute !== MEDIA_ROOT && !absolute.startsWith(MEDIA_ROOT + path.sep)) {
    throw new MediaError("Path escapes the media root.");
  }
  return absolute;
}

export function toFileItem(
  relPath: string,
  name: string,
  type: "dir" | "file",
): FileItem {
  const dir = relPath.replace(/^\/+/, "");
  return {
    name,
    path: dir ? `${dir}/${name}` : name,
    type,
  };
}

export async function getFolderContent(relPath = ""): Promise<FileItem[]> {
  const absolute = resolveMediaPath(relPath);
  const entries = await fs.readdir(absolute, { withFileTypes: true });

  return entries.map((entry) =>
    toFileItem(relPath, entry.name, entry.isDirectory() ? "dir" : "file"),
  );
}

export async function statMediaPath(relPath = "") {
  return fs.stat(resolveMediaPath(relPath));
}

export async function readMediaFile(relPath: string): Promise<Buffer> {
  return fs.readFile(resolveMediaPath(relPath));
}

export async function readMediaText(relPath: string): Promise<string> {
  return fs.readFile(resolveMediaPath(relPath), "utf-8");
}

export async function writeMediaFile(
  relPath: string,
  content: string | Buffer,
) {
  const absolute = resolveMediaPath(relPath);
  await fs.mkdir(path.dirname(absolute), { recursive: true });
  await fs.writeFile(absolute, content);
}

export async function createMediaDirectory(relPath: string) {
  await fs.mkdir(resolveMediaPath(relPath), { recursive: true });
}

export async function removeMediaPath(relPath: string) {
  const absolute = resolveMediaPath(relPath);
  const stat = await fs.stat(absolute);

  if (stat.isDirectory()) {
    await fs.rmdir(absolute);
  } else {
    await fs.unlink(absolute);
  }
}
