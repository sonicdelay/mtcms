import express from "express";
import { authRequired } from "../lib/auth.ts";
import { problem } from "../lib/http.ts";
import {
  addNode,
  getAllNodes,
  getBreadcrumb,
  getChildren,
  getNodeById,
  getParent,
  NotFoundError,
  removeNode,
  updateNode,
} from "../lib/nodes.service.ts";

export const nodesRouter = express.Router();

nodesRouter.use(express.json());
nodesRouter.use(authRequired);

const MAX_LIMIT = 50;
const MAX_OFFSET = 1000;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseRange(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
): number | null {
  if (value === undefined || value === null) {
    return fallback;
  }
  if (typeof value !== "string") {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    return null;
  }
  return parsed;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

nodesRouter.get("/", async (req, res) => {
  const type = typeof req.query.type === "string" ? req.query.type : undefined;
  const limit = parseRange(req.query.limit, MAX_LIMIT, 1, MAX_LIMIT);
  const offset = parseRange(req.query.offset, 0, 0, MAX_OFFSET);

  if (limit === null) {
    problem(
      res,
      400,
      "Bad Request",
      "limit must be an integer between 1 and 50.",
    );
    return;
  }
  if (offset === null) {
    problem(
      res,
      400,
      "Bad Request",
      "offset must be an integer between 0 and 1000.",
    );
    return;
  }

  try {
    const rows = await getAllNodes({ type, limit, offset });
    res.json(rows);
  } catch (error) {
    problem(res, 500, "Internal Server Error", (error as Error).message);
  }
});

nodesRouter.post("/", async (req, res) => {
  const body = req.body as Record<string, unknown> | undefined;

  if (!isRecord(body)) {
    problem(res, 400, "Bad Request", "Request body must be a JSON object.");
    return;
  }

  const { type, sync, data } = body;

  if (typeof type !== "string" || !type.trim()) {
    problem(res, 400, "Bad Request", "type must be a non-empty string.");
    return;
  }

  if (!isRecord(data)) {
    problem(res, 400, "Bad Request", "data must be a JSON object.");
    return;
  }

  const syncValue = sync === undefined ? {} : sync;
  if (!isRecord(syncValue)) {
    problem(res, 400, "Bad Request", "sync must be a JSON object.");
    return;
  }

  try {
    const row = await addNode({
      type,
      sync: syncValue,
      data,
    });
    res.status(201).json(row);
  } catch (error) {
    problem(res, 500, "Internal Server Error", (error as Error).message);
  }
});

nodesRouter.get("/:id", async (req, res) => {
  const id = req.params.id;
  if (!UUID_RE.test(id)) {
    problem(res, 400, "Bad Request", "id must be a valid UUID.");
    return;
  }

  const scope = typeof req.query.scope === "string" ? req.query.scope : "";

  try {
    let result: unknown;
    switch (scope) {
      case "parent":
        result = await getParent(id);
        break;
      case "children":
        result = await getChildren(id);
        break;
      case "breadcrumb":
        result = await getBreadcrumb(id);
        break;
      case "editor": {
        const [node, children, breadcrumb] = await Promise.all([
          getNodeById(id),
          getChildren(id),
          getBreadcrumb(id),
        ]);
        result = { ...node, children, breadcrumb };
        break;
      }
      default:
        result = await getNodeById(id);
        break;
    }

    res.json(result);
  } catch (error) {
    if (error instanceof NotFoundError) {
      problem(res, 404, "Not Found", error.message);
      return;
    }
    problem(res, 500, "Internal Server Error", (error as Error).message);
  }
});

nodesRouter.put("/:id", async (req, res) => {
  const id = req.params.id;
  if (!UUID_RE.test(id)) {
    problem(res, 400, "Bad Request", "id must be a valid UUID.");
    return;
  }

  const body = req.body as Record<string, unknown> | undefined;
  if (!isRecord(body)) {
    problem(res, 400, "Bad Request", "Request body must be a JSON object.");
    return;
  }

  const { type, sync, data } = body;

  if (type !== undefined && (typeof type !== "string" || !type.trim())) {
    problem(res, 400, "Bad Request", "type must be a non-empty string.");
    return;
  }
  if (sync !== undefined && !isRecord(sync)) {
    problem(res, 400, "Bad Request", "sync must be a JSON object.");
    return;
  }
  if (data !== undefined && !isRecord(data)) {
    problem(res, 400, "Bad Request", "data must be a JSON object.");
    return;
  }
  if (type === undefined && sync === undefined && data === undefined) {
    problem(
      res,
      400,
      "Bad Request",
      "At least one of type, sync, or data must be provided.",
    );
    return;
  }

  try {
    const row = await updateNode(id, {
      type: type as string | undefined,
      sync: sync as Record<string, unknown> | undefined,
      data: data as Record<string, unknown> | undefined,
    });
    res.json(row);
  } catch (error) {
    if (error instanceof NotFoundError) {
      problem(res, 404, "Not Found", error.message);
      return;
    }
    problem(res, 500, "Internal Server Error", (error as Error).message);
  }
});

nodesRouter.delete("/:id", async (req, res) => {
  const id = req.params.id;
  if (!UUID_RE.test(id)) {
    problem(res, 400, "Bad Request", "id must be a valid UUID.");
    return;
  }

  try {
    await removeNode(id);
    res.status(204).end();
  } catch (error) {
    if (error instanceof NotFoundError) {
      problem(res, 404, "Not Found", error.message);
      return;
    }
    problem(res, 500, "Internal Server Error", (error as Error).message);
  }
});
