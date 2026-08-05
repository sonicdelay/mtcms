import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { problemResponse } from "@/lib/http";
import {
  getBreadcrumb,
  getChildren,
  getNodeById,
  getParent,
  NotFoundError,
  removeNode,
  updateNode,
} from "@/lib/nodes.service";

type RouteParams = Promise<{ id: string }>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseId(id: string): string | NextResponse {
  if (!UUID_RE.test(id)) {
    return problemResponse(400, "Bad Request", "id must be a valid UUID.");
  }
  return id;
}

export async function GET(
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

  const scope = new URL(request.url).searchParams.get("scope") ?? "";

  try {
    let result: unknown;
    switch (scope) {
      case "parent":
        result = await getParent(parsed);
        break;
      case "children":
        result = await getChildren(parsed);
        break;
      case "breadcrumb":
        result = await getBreadcrumb(parsed);
        break;
      case "editor": {
        const [node, children, breadcrumb] = await Promise.all([
          getNodeById(parsed),
          getChildren(parsed),
          getBreadcrumb(parsed),
        ]);
        result = { ...node, children, breadcrumb };
        break;
      }
      default:
        result = await getNodeById(parsed);
        break;
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return problemResponse(404, "Not Found", error.message);
    }
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
    const row = await updateNode(parsed, {
      type: type as string | undefined,
      sync: sync as Record<string, unknown> | undefined,
      data: data as Record<string, unknown> | undefined,
    });
    return NextResponse.json(row);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return problemResponse(404, "Not Found", error.message);
    }
    return problemResponse(
      500,
      "Internal Server Error",
      (error as Error).message,
    );
  }
}

export async function DELETE(
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

  try {
    await removeNode(parsed);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return problemResponse(404, "Not Found", error.message);
    }
    return problemResponse(
      500,
      "Internal Server Error",
      (error as Error).message,
    );
  }
}
