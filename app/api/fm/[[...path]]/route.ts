import { NextResponse } from "next/server";
import path from "node:path";
import { requireAuth } from "@/lib/auth";
import { problemResponse } from "@/lib/http";
import {
  createMediaDirectory,
  getFolderContent,
  MediaError,
  readMediaFile,
  removeMediaPath,
  resolveMediaPath,
  statMediaPath,
  writeMediaFile,
} from "@/lib/fm.service";

type RouteParams = Promise<{ path?: string[] }>;

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

function isAuthDenied(
  value: ReturnType<typeof requireAuth> extends Promise<infer T> ? T : never,
): value is NextResponse {
  return typeof value !== "object" || !("email" in value);
}

export async function GET(
  request: Request,
  { params }: { params: RouteParams },
) {
  const user = await requireAuth(request);
  if (isAuthDenied(user)) {
    return user;
  }

  const { path: segments = [] } = await params;
  const relPath = segments.join("/");

  try {
    const stat = await statMediaPath(relPath);

    if (stat.isDirectory()) {
      const content = await getFolderContent(relPath);
      return NextResponse.json(content);
    }

    const data = await readMediaFile(relPath);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": contentTypeFor(resolveMediaPath(relPath)),
        "Content-Length": String(stat.size),
      },
    });
  } catch (error) {
    if (error instanceof MediaError) {
      return problemResponse(400, "Bad Request", error.message);
    }
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT" || code === "ENOTDIR") {
      return problemResponse(404, "Not Found", "Path not found.");
    }
    return problemResponse(
      500,
      "Internal Server Error",
      (error as Error).message,
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: RouteParams },
) {
  const user = await requireAuth(request);
  if (isAuthDenied(user)) {
    return user;
  }

  const { path: segments = [] } = await params;
  const relPath = segments.join("/");

  if (!relPath) {
    return problemResponse(400, "Bad Request", "path must not be empty.");
  }

  try {
    await createMediaDirectory(relPath);
    return new NextResponse(null, { status: 201 });
  } catch (error) {
    if (error instanceof MediaError) {
      return problemResponse(400, "Bad Request", error.message);
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
  if (isAuthDenied(user)) {
    return user;
  }

  const { path: segments = [] } = await params;
  const relPath = segments.join("/");

  if (!relPath) {
    return problemResponse(400, "Bad Request", "path must not be empty.");
  }

  const content = await request.text();

  try {
    await writeMediaFile(relPath, content);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof MediaError) {
      return problemResponse(400, "Bad Request", error.message);
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
  if (isAuthDenied(user)) {
    return user;
  }

  const { path: segments = [] } = await params;
  const relPath = segments.join("/");

  if (!relPath) {
    return problemResponse(400, "Bad Request", "path must not be empty.");
  }

  try {
    await removeMediaPath(relPath);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof MediaError) {
      return problemResponse(400, "Bad Request", error.message);
    }
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT" || code === "ENOTDIR") {
      return problemResponse(404, "Not Found", "Path not found.");
    }
    if (code === "ENOTEMPTY" || code === "EEXIST") {
      return problemResponse(400, "Bad Request", "Directory is not empty.");
    }
    return problemResponse(
      500,
      "Internal Server Error",
      (error as Error).message,
    );
  }
}
