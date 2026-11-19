import { Request, Response } from "express";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultBaseFolder = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "logs",
  "filemanager"
);

const baseFolder = process.env.FILE_MANAGER_BASE_FOLDER
  ? path.resolve(process.env.FILE_MANAGER_BASE_FOLDER)
  : defaultBaseFolder;

const getPathParam = (req: Request): string | null => {
  const rawId = req.params.id as unknown;
  const byId = Array.isArray(rawId)
    ? asNonEmptyString(rawId.join("/"))
    : asNonEmptyString(rawId);
  if (byId) {
    return byId;
  }

  const rawWildcard = (req.params as Record<string, unknown>)["0"];
  const byWildcard = Array.isArray(rawWildcard)
    ? asNonEmptyString(rawWildcard.join("/"))
    : asNonEmptyString(rawWildcard);
  return byWildcard;
};

const resolveWithinBaseFolder = (relativePath: string): string | null => {
  const normalized = relativePath.replace(/\\/g, "/").replace(/^\/+/, "");
  const resolved = path.resolve(baseFolder, normalized);
  return resolved.startsWith(baseFolder) ? resolved : null;
};

const toEntryInfo = async (
  targetPath: string
): Promise<{
  id: string;
  name: string;
  kind: "file" | "directory";
  size: number;
  updatedAt: string;
}> => {
  const stats = await fs.stat(targetPath);
  return {
    id: path.relative(baseFolder, targetPath).replace(/\\/g, "/"),
    name: path.basename(targetPath),
    kind: stats.isDirectory() ? "directory" : "file",
    size: stats.size,
    updatedAt: stats.mtime.toISOString()
  };
};

const asNonEmptyString = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

export const getFileManagerInfoController = (
  _req: Request,
  res: Response
): void => {
  res.json({
    feature: "filemanager",
    storage: "node:fs",
    baseFolder,
    endpoints: [
      "GET /api/fm/files",
      "GET /api/fm/files/:id",
      "POST /api/fm/files",
      "PUT /api/fm/files/:id",
      "DELETE /api/fm/files/:id"
    ]
  });
};

export const listFilesController = async (
  _req: Request,
  res: Response
): Promise<void> => {
  await fs.mkdir(baseFolder, { recursive: true });
  const entries = await fs.readdir(baseFolder, { withFileTypes: true });
  const items = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(baseFolder, entry.name);
      return await toEntryInfo(fullPath);
    })
  );

  res.json({ baseFolder, items });
};

export const getFileByIdController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const id = getPathParam(req);
  if (!id) {
    res.status(400).json({ error: "id is required" });
    return;
  }

  const targetPath = resolveWithinBaseFolder(id);
  if (!targetPath) {
    res.status(400).json({ error: "invalid id path" });
    return;
  }

  try {
    const stats = await fs.stat(targetPath);
    if (stats.isDirectory()) {
      const entries = await fs.readdir(targetPath, { withFileTypes: true });
      const items = await Promise.all(
        entries.map(async (entry) => {
          const fullPath = path.join(targetPath, entry.name);
          return await toEntryInfo(fullPath);
        })
      );

      res.json({
        id: id.replace(/\\/g, "/"),
        kind: "directory",
        items
      });
      return;
    }

    const content = await fs.readFile(targetPath, "utf8");
    const item = await toEntryInfo(targetPath);
    res.json({ item: { ...item, content } });
  } catch {
    res.status(404).json({ error: "file not found" });
  }
};

export const createFileController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const body = req.body as { id?: unknown; name?: unknown; content?: unknown };
  const id = asNonEmptyString(body.id) ?? asNonEmptyString(body.name);
  const content = typeof body.content === "string" ? body.content : null;

  if (!id || content === null) {
    res.status(400).json({ error: "id/name and content are required" });
    return;
  }

  const targetPath = resolveWithinBaseFolder(id);
  if (!targetPath) {
    res.status(400).json({ error: "invalid id path" });
    return;
  }

  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, content, "utf8");
  const item = await toEntryInfo(targetPath);

  res.status(201).json({ item });
};

export const updateFileController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const id = getPathParam(req);
  if (!id) {
    res.status(400).json({ error: "id is required" });
    return;
  }

  const targetPath = resolveWithinBaseFolder(id);
  if (!targetPath) {
    res.status(400).json({ error: "invalid id path" });
    return;
  }

  const body = req.body as { content?: unknown };
  if (typeof body.content !== "string") {
    res.status(400).json({ error: "content must be a string" });
    return;
  }

  try {
    await fs.access(targetPath);
  } catch {
    res.status(404).json({ error: "file not found" });
    return;
  }

  await fs.writeFile(targetPath, body.content, "utf8");
  const item = await toEntryInfo(targetPath);

  res.json({ item });
};

export const deleteFileController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const id = getPathParam(req);
  if (!id) {
    res.status(400).json({ error: "id is required" });
    return;
  }

  const targetPath = resolveWithinBaseFolder(id);
  if (!targetPath) {
    res.status(400).json({ error: "invalid id path" });
    return;
  }

  try {
    await fs.rm(targetPath, { recursive: true, force: false });
  } catch {
    res.status(404).json({ error: "file not found" });
    return;
  }

  res.status(204).send();
};
