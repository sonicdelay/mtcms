import { NextResponse } from "next/server";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { mkdir, readdir, readFile, rm, stat, unlink, writeFile } from "node:fs/promises";

type RouteParams = Promise<{ path?: string[] }>;

type FileItem = {
  path: string;
  name: string;
  type: "dir" | "file";
};

const MEDIA_ROOT = resolve(process.env.MEDIA_PATH ?? "./media/");

const normalizePath = (inputPath: string): string => {
  return inputPath.replaceAll("\\", "/").replace(/^\/+/, "");
};

const toRelativePath = (absolutePath: string): string => {
  return normalizePath(relative(MEDIA_ROOT, absolutePath));
};

const resolveSafePath = (requestedPath: string): string | null => {
  if (isAbsolute(requestedPath)) return null;

  const absolutePath = resolve(MEDIA_ROOT, requestedPath);
  const rel = relative(MEDIA_ROOT, absolutePath);

  if (rel.startsWith("..") || isAbsolute(rel)) return null;
  return absolutePath;
};

const getRequestedPath = async (params: RouteParams): Promise<string> => {
  const { path } = await params;
  return normalizePath(path?.join("/") ?? "");
};

const listFolder = async (folderPath: string): Promise<FileItem[]> => {
  const items: FileItem[] = [
    {
      path: toRelativePath(folderPath),
      name: ".",
      type: "dir",
    },
  ];

  const parent = resolve(folderPath, "..");
  const parentRel = relative(MEDIA_ROOT, parent);
  if (!parentRel.startsWith("..") && !isAbsolute(parentRel)) {
    items.push({
      path: normalizePath(parentRel),
      name: "..",
      type: "dir",
    });
  }

  const entries = await readdir(folderPath, { withFileTypes: true });
  entries.sort((a, b) => a.name.localeCompare(b.name));

  for (const entry of entries) {
    items.push({
      name: entry.name,
      path: toRelativePath(resolve(folderPath, entry.name)),
      type: entry.isDirectory() ? "dir" : "file",
    });
  }

  return items;
};

const badPathResponse = () =>
  NextResponse.json(
    { errors: ["Bad Request: Absolute paths are not allowed"] },
    { status: 400 },
  );

const notFoundResponse = () =>
  NextResponse.json({ errors: ["Not Found"] }, { status: 404 });

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: RouteParams },
) {
  const requestedPath = await getRequestedPath(params);
  const absolutePath = resolveSafePath(requestedPath);

  if (!absolutePath) return badPathResponse();

  try {
    const fileStat = await stat(absolutePath);

    if (fileStat.isDirectory()) {
      const content = await listFolder(absolutePath);
      return NextResponse.json(content);
    }

    if (absolutePath.endsWith(".es6")) {
      try {
        const moduleUrl = `${pathToFileURL(absolutePath).href}?t=${Date.now()}`;
        const loadedModule = await import(moduleUrl);

        if (typeof loadedModule.default === "function") {
          const result = await loadedModule.default({ request, path: requestedPath });
          return result instanceof Response
            ? result
            : NextResponse.json(result);
        }

        return NextResponse.json(loadedModule);
      } catch (err) {
        return NextResponse.json(
          {
            error: "Failed to execute code.",
            details: err instanceof Error ? err.message : String(err),
          },
          { status: 500 },
        );
      }
    }

    const fileContent = await readFile(absolutePath);
    return new NextResponse(fileContent, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${absolutePath.split(/[\\/]/).pop() ?? "file"}"`,
        "Content-Length": String(fileStat.size),
      },
    });
  } catch {
    return notFoundResponse();
  }
}

export async function POST(
  request: Request,
  { params }: { params: RouteParams },
) {
  const requestedPath = await getRequestedPath(params);
  const absolutePath = resolveSafePath(requestedPath);

  if (!absolutePath) return badPathResponse();

  try {
    await stat(absolutePath);
    return NextResponse.json({ error: "File already exists" }, { status: 500 });
  } catch {
    // Continue when target does not exist.
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");

  if (contentLength === 0) {
    await mkdir(absolutePath, { recursive: false }).catch(() => null);
    return NextResponse.json({ ok: true, type: "dir", path: requestedPath }, { status: 201 });
  }

  const bytes = Buffer.from(await request.arrayBuffer());
  await mkdir(dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, bytes, { flag: "wx" });

  return NextResponse.json({ ok: true, type: "file", path: requestedPath }, { status: 201 });
}

export async function PUT(
  request: Request,
  { params }: { params: RouteParams },
) {
  const requestedPath = await getRequestedPath(params);
  const absolutePath = resolveSafePath(requestedPath);

  if (!absolutePath) return badPathResponse();

  const bytes = Buffer.from(await request.arrayBuffer());
  if (bytes.length === 0) {
    return NextResponse.json({ error: "Empty body" }, { status: 400 });
  }

  await mkdir(dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, bytes);

  return NextResponse.json({ ok: true, path: requestedPath });
}

export async function DELETE(
  _request: Request,
  { params }: { params: RouteParams },
) {
  const requestedPath = await getRequestedPath(params);
  const absolutePath = resolveSafePath(requestedPath);

  if (!absolutePath) return badPathResponse();

  try {
    const fileStat = await stat(absolutePath);

    if (fileStat.isDirectory()) {
      await rm(absolutePath, { recursive: true, force: false });
    } else {
      await unlink(absolutePath);
    }

    return new NextResponse(null, { status: 204 });
  } catch {
    return notFoundResponse();
  }
}
