import type { Request, Response, Router } from "express";
import express from "express";
import path from "node:path";
import { authRequired } from "../lib/auth.ts";
import {
  createMediaDirectory,
  getFolderContent,
  MediaError,
  readMediaFile,
  removeMediaPath,
  resolveMediaPath,
  statMediaPath,
  writeMediaFile,
} from "../lib/fm.service.ts";
import { problem } from "../lib/http.ts";

function contentTypeFor(filePath: string): string {
  switch (path.extname(filePath).toLowerCase()) {
    case ".md":
    case ".markdown":
      return "text/markdown; charset=utf-8";
    case ".html":
      return "text/html; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    case ".txt":
    case ".es6":
    case ".svg":
      return "text/plain; charset=utf-8";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    default:
      return "application/octet-stream";
  }
}

function relPathOf(req: Request): string {
  const splat = (req.params as Record<string, unknown>).splat;
  if (Array.isArray(splat)) {
    return splat.join("/");
  }
  return (splat as string | undefined) ?? "";
}

const getFM = async (req: Request, res: Response) => {
  const relPath = relPathOf(req);

  try {
    const stat = await statMediaPath(relPath);

    if (stat.isDirectory()) {
      res.json(await getFolderContent(relPath));
      return;
    }

    const data = await readMediaFile(relPath);
    res
      .set("Content-Type", contentTypeFor(resolveMediaPath(relPath)))
      .set("Content-Length", String(stat.size))
      .send(Buffer.from(data));
  } catch (error) {
    if (error instanceof MediaError) {
      problem(res, 400, "Bad Request", error.message);
      return;
    }
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT" || code === "ENOTDIR") {
      problem(res, 404, "Not Found", "Path not found.");
      return;
    }
    problem(res, 500, "Internal Server Error", (error as Error).message);
  }
};

const postFM = async (req: Request, res: Response) => {
  const relPath = relPathOf(req);
  if (!relPath) {
    problem(res, 400, "Bad Request", "path must not be empty.");
    return;
  }

  try {
    await createMediaDirectory(relPath);
    res.status(201).end();
  } catch (error) {
    if (error instanceof MediaError) {
      problem(res, 400, "Bad Request", error.message);
      return;
    }
    problem(res, 500, "Internal Server Error", (error as Error).message);
  }
};

const putFM = async (req: Request, res: Response) => {
  const relPath = relPathOf(req);
  if (!relPath) {
    problem(res, 400, "Bad Request", "path must not be empty.");
    return;
  }

  const body = req.body as Uint8Array | undefined;
  if (!body) {
    problem(res, 400, "Bad Request", "Request body must not be empty.");
    return;
  }

  try {
    await writeMediaFile(relPath, body);
    res.status(204).end();
  } catch (error) {
    if (error instanceof MediaError) {
      problem(res, 400, "Bad Request", error.message);
      return;
    }
    problem(res, 500, "Internal Server Error", (error as Error).message);
  }
};

const deleteFM = async (req: Request, res: Response) => {
  const relPath = relPathOf(req);
  if (!relPath) {
    problem(res, 400, "Bad Request", "path must not be empty.");
    return;
  }

  try {
    await removeMediaPath(relPath);
    res.status(204).end();
  } catch (error) {
    if (error instanceof MediaError) {
      problem(res, 400, "Bad Request", error.message);
      return;
    }
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT" || code === "ENOTDIR") {
      problem(res, 404, "Not Found", "Path not found.");
      return;
    }
    if (code === "ENOTEMPTY" || code === "EEXIST") {
      problem(res, 400, "Bad Request", "Directory is not empty.");
      return;
    }
    problem(res, 500, "Internal Server Error", (error as Error).message);
  }
};

const prefix = "/api/fm";
export const fmRouter: Router = express.Router();
fmRouter.use(`${prefix}`, authRequired);
fmRouter.use(`${prefix}`, express.raw({ type: () => true, limit: "200mb" }));
fmRouter
  .get(`${prefix}/`, getFM)
  .get(`${prefix}/*splat`, getFM)
  .post(`${prefix}/`, postFM)
  .post(`${prefix}/*splat`, postFM)
  .put(`${prefix}/`, putFM)
  .put(`${prefix}/*splat`, putFM)
  .delete(`${prefix}/`, deleteFM)
  .delete(`${prefix}/*splat`, deleteFM);
