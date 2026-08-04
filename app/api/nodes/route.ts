import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { problemResponse } from "@/lib/http";

const MAX_LIMIT = 50;
const MAX_OFFSET = 1000;

export async function GET(request: Request) {
  const user = await requireAuth(request);
  if (typeof user !== "object" || !("email" in user)) {
    return user;
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const limitParam = searchParams.get("limit");
  const offsetParam = searchParams.get("offset");

  let limit = MAX_LIMIT;
  let offset = 0;

  if (limitParam !== null) {
    limit = Number(limitParam);
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
      return problemResponse(
        400,
        "Bad Request",
        `limit must be an integer between 1 and ${MAX_LIMIT}.`,
      );
    }
  }

  if (offsetParam !== null) {
    offset = Number(offsetParam);
    if (!Number.isInteger(offset) || offset < 0 || offset > MAX_OFFSET) {
      return problemResponse(
        400,
        "Bad Request",
        `offset must be an integer between 0 and ${MAX_OFFSET}.`,
      );
    }
  }

  const conditions: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (type) {
    conditions.push(`type = $${idx++}`);
    values.push(type);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const query = `SELECT id, type, update, sync, data FROM nodes ${where} ORDER BY update DESC LIMIT $${idx++} OFFSET $${idx++}`;
  values.push(limit, offset);

  try {
    const { rows } = await pool.query(query, values);
    return NextResponse.json(rows);
  } catch (error) {
    return problemResponse(
      500,
      "Internal Server Error",
      (error as Error).message,
    );
  }
}

export async function POST(request: Request) {
  const user = await requireAuth(request);
  if (typeof user !== "object" || !("email" in user)) {
    return user;
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

  if (typeof type !== "string" || !type.trim()) {
    return problemResponse(400, "Bad Request", "type must be a non-empty string.");
  }

  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return problemResponse(400, "Bad Request", "data must be a JSON object.");
  }

  const syncValue = sync === undefined ? {} : sync;
  if (typeof syncValue !== "object" || syncValue === null || Array.isArray(syncValue)) {
    return problemResponse(400, "Bad Request", "sync must be a JSON object.");
  }

  try {
    const {
      rows: [row],
    } = await pool.query(
      `INSERT INTO nodes (type, sync, data) VALUES ($1, $2, $3) RETURNING id, type, update, sync, data`,
      [type, syncValue, data],
    );
    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    return problemResponse(
      500,
      "Internal Server Error",
      (error as Error).message,
    );
  }
}
