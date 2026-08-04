import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { problemResponse } from "@/lib/http";

type RouteParams = Promise<{ id: string }>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseId(id: string): string | NextResponse {
  if (!UUID_RE.test(id)) {
    return problemResponse(400, "Bad Request", "id must be a valid UUID.");
  }
  return id;
}

export async function GET(
  _request: Request,
  { params }: { params: RouteParams },
) {
  const { id } = await params;
  const parsed = parseId(id);
  if (typeof parsed !== "string") {
    return parsed;
  }

  try {
    const {
      rows: [row],
    } = await pool.query(
      `SELECT id, type, update, sync, data FROM nodes WHERE id = $1`,
      [parsed],
    );

    if (!row) {
      return problemResponse(404, "Not Found", "Node not found.");
    }

    return NextResponse.json(row);
  } catch (error) {
    return problemResponse(
      500,
      "Internal Server Error",
      (error as Error).message,
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: RouteParams },
) {
  const user = await requireAuth(request);
  if (typeof user !== "object" || !("email" in user)) {
    return user;
  }

  const { id } = await params;
  const parsed = parseId(id);
  if (typeof parsed !== "string") {
    return parsed;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return problemResponse(400, "Bad Request", "Request body must be valid JSON.");
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return problemResponse(400, "Bad Request", "Request body must be a JSON object.");
  }

  const { type, sync, data } = body as Record<string, unknown>;

  if (type !== undefined && (typeof type !== "string" || !type.trim())) {
    return problemResponse(400, "Bad Request", "type must be a non-empty string.");
  }
  if (sync !== undefined && (typeof sync !== "object" || sync === null || Array.isArray(sync))) {
    return problemResponse(400, "Bad Request", "sync must be a JSON object.");
  }
  if (data !== undefined && (typeof data !== "object" || data === null || Array.isArray(data))) {
    return problemResponse(400, "Bad Request", "data must be a JSON object.");
  }
  if (type === undefined && sync === undefined && data === undefined) {
    return problemResponse(
      400,
      "Bad Request",
      "At least one of type, sync, or data must be provided.",
    );
  }

  try {
    const {
      rows: [row],
    } = await pool.query(
      `UPDATE nodes SET type = COALESCE($1, type), sync = COALESCE($2, sync), data = COALESCE($3, data) WHERE id = $4 RETURNING id, type, update, sync, data`,
      [type ?? null, sync ?? null, data ?? null, parsed],
    );

    if (!row) {
      return problemResponse(404, "Not Found", "Node not found.");
    }

    return NextResponse.json(row);
  } catch (error) {
    return problemResponse(
      500,
      "Internal Server Error",
      (error as Error).message,
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: RouteParams },
) {
  const user = await requireAuth(_request);
  if (typeof user !== "object" || !("email" in user)) {
    return user;
  }

  const { id } = await params;
  const parsed = parseId(id);
  if (typeof parsed !== "string") {
    return parsed;
  }

  try {
    const { rowCount } = await pool.query(`DELETE FROM nodes WHERE id = $1`, [
      parsed,
    ]);

    if (!rowCount) {
      return problemResponse(404, "Not Found", "Node not found.");
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return problemResponse(
      500,
      "Internal Server Error",
      (error as Error).message,
    );
  }
}
