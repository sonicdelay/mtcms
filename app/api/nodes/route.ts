import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { problemResponse } from "@/lib/http";
import { addNode, getAllNodes } from "@/lib/nodes.service";

const MAX_LIMIT = 50;
const MAX_OFFSET = 1000;

function parseRange(
  value: string | null,
  fallback: number,
  min: number,
  max: number,
  name: string,
): number | NextResponse {
  if (value === null) {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    return problemResponse(
      400,
      "Bad Request",
      `${name} must be an integer between ${min} and ${max}.`,
    );
  }
  return parsed;
}

export async function GET(request: Request) {
  const user = await requireAuth(request);
  if (typeof user !== "object" || !("email" in user)) {
    return user;
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const limit = parseRange(
    searchParams.get("limit"),
    MAX_LIMIT,
    1,
    MAX_LIMIT,
    "limit",
  );
  const offset = parseRange(
    searchParams.get("offset"),
    0,
    0,
    MAX_OFFSET,
    "offset",
  );

  if (limit instanceof NextResponse) return limit;
  if (offset instanceof NextResponse) return offset;

  try {
    const rows = await getAllNodes({
      type: type ?? undefined,
      limit,
      offset,
    });
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
    const row = await addNode({
      type,
      sync: syncValue as Record<string, unknown>,
      data: data as Record<string, unknown>,
    });
    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    return problemResponse(
      500,
      "Internal Server Error",
      (error as Error).message,
    );
  }
}
