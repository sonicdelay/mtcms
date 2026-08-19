import pool from "./db.ts";
import type { MiniNode, Node } from "./types.ts";

export class NotFoundError extends Error {
  constructor(message = "Not Found") {
    super(message);
    this.name = "NotFoundError";
  }
}

export interface ListNodesOptions {
  type?: string;
  limit?: number;
  offset?: number;
}

export async function getAllNodes(
  options: ListNodesOptions = {},
): Promise<Node[]> {
  const { type, limit = 50, offset = 0 } = options;

  const conditions: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (type) {
    conditions.push(`type = $${idx++}`);
    values.push(type);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const query =
    `SELECT id, type, update, sync, data FROM nodes ${where} ORDER BY update DESC LIMIT $${idx++} OFFSET $${idx++}`;
  values.push(limit, offset);

  const { rows } = await pool.query<Node>(query, values);
  return rows;
}

export async function getNodeById(id: string): Promise<Node> {
  const {
    rows: [row],
  } = await pool.query<Node>(
    "SELECT id, type, update, sync, data FROM nodes WHERE id = $1",
    [id],
  );

  if (!row) {
    throw new NotFoundError("Node not found");
  }

  return row;
}

export async function addNode(input: {
  type: string;
  sync?: Record<string, unknown>;
  data: Record<string, unknown>;
}): Promise<Node> {
  const {
    rows: [row],
  } = await pool.query<Node>(
    `INSERT INTO nodes (type, sync, data) VALUES ($1, $2, $3) RETURNING id, type, update, sync, data`,
    [input.type, input.sync ?? {}, input.data],
  );

  return row;
}

export async function updateNode(
  id: string,
  patch: {
    type?: string;
    sync?: Record<string, unknown>;
    data?: Record<string, unknown>;
  },
): Promise<Node> {
  const {
    rows: [row],
  } = await pool.query<Node>(
    `UPDATE nodes SET type = COALESCE($1, type), sync = COALESCE($2, sync), data = COALESCE($3, data) WHERE id = $4 RETURNING id, type, update, sync, data`,
    [patch.type ?? null, patch.sync ?? null, patch.data ?? null, id],
  );

  if (!row) {
    throw new NotFoundError("Node not found");
  }

  return row;
}

export async function removeNode(id: string): Promise<void> {
  const { rowCount } = await pool.query(`DELETE FROM nodes WHERE id = $1`, [
    id,
  ]);

  if (!rowCount) {
    throw new NotFoundError("Node not found");
  }
}

export async function getChildren(id: string): Promise<MiniNode[]> {
  const { rows } = await pool.query(
    `SELECT id, data->'0'->>'title' AS title
     FROM nodes
     WHERE data @> $1
     ORDER BY data->'0'->>'position'`,
    [{ "0": { parent: id } }],
  );

  return rows as MiniNode[];
}

export async function getParent(id: string): Promise<Node> {
  const {
    rows: [child],
  } = await pool.query<{ parent: string | null }>(
    `SELECT data->'0'->>'parent' AS parent FROM nodes WHERE id = $1 LIMIT 1`,
    [id],
  );

  if (!child?.parent) {
    throw new NotFoundError("Parent not found");
  }

  return getNodeById(child.parent);
}

export async function getBreadcrumb(id: string): Promise<MiniNode[]> {
  const { rows } = await pool.query(
    `WITH RECURSIVE breadcrumb AS (
       SELECT id, data->'0'->>'title' AS title, (data->'0'->>'parent')::UUID AS parent_id
       FROM nodes
       WHERE id = $1
       UNION ALL
       SELECT nodes.id, nodes.data->'0'->>'title' AS title, (nodes.data->'0'->>'parent')::UUID AS parent_id
       FROM breadcrumb
       JOIN nodes ON breadcrumb.parent_id = nodes.id
     )
     SELECT id, title FROM breadcrumb LIMIT 20`,
    [id],
  );

  return rows as MiniNode[];
}

export async function getNodesByType(type: string): Promise<Node[]> {
  const { rows } = await pool.query<Node>(
    "SELECT * FROM nodes WHERE type = LOWER($1)",
    [type],
  );
  return rows;
}

export async function getUserByEmail(email: string): Promise<Node | null> {
  const {
    rows: [row],
  } = await pool.query<Node>(
    `SELECT * FROM nodes WHERE type = 'user' AND data->'0'->'values'->'en'->>'email' = $1`,
    [email],
  );

  return row ?? null;
}
