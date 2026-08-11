import path from "node:path";
import { headers } from "next/headers";
import { getArticleTitle, renderMarkdown, stripFrontmatter } from "@/lib/markdown-content";

export type FileItem = {
  path: string;
  name: string;
  type: "dir" | "file";
};

export type ArticleDirectoryResource = {
  kind: "directory";
  path: string[];
  items: FileItem[];
};

export type ArticleMarkdownResource = {
  kind: "markdown";
  path: string[];
  title: string;
  html: string;
};

export type ArticleFileResource = {
  kind: "file";
  path: string[];
  title: string;
  raw: string;
};

export type ArticleJsonResource = {
  kind: "json";
  path: string[];
  data: unknown;
};

export type ArticleResource =
  | ArticleDirectoryResource
  | ArticleMarkdownResource
  | ArticleFileResource
  | ArticleJsonResource;

const articlesPrefix = "articles";

const isFileItem = (value: unknown): value is FileItem => {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;

  return typeof record.path === "string" &&
    typeof record.name === "string" &&
    (record.type === "dir" || record.type === "file");
};

const getOrigin = async () => {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";

  if (!host) {
    throw new Error("Missing host header for internal API request");
  }

  return `${protocol}://${host}`;
};

const toApiPath = (pathSegments: string[]) => {
  return [articlesPrefix, ...pathSegments].join("/");
};

const getFallbackTitle = (pathSegments: string[]) => {
  return pathSegments.at(-1)?.replace(/\.[^.]+$/, "") || "Articles";
};

export const toArticleHref = (itemPath: string) => {
  const relativePath = itemPath === articlesPrefix
    ? ""
    : itemPath.startsWith(`${articlesPrefix}/`)
      ? itemPath.slice(articlesPrefix.length + 1)
      : itemPath;

  return relativePath ? `/home/articles/${relativePath}` : "/home/articles";
};

export const fetchArticleResource = async (
  pathSegments: string[],
): Promise<ArticleResource | null> => {
  const origin = await getOrigin();
  const fetchFromFm = async (segments: string[]) => {
    const apiPath = toApiPath(segments);
    return fetch(`${origin}/api/fm/${apiPath}`, {
      cache: "no-store",
    });
  };

  let resolvedPath = pathSegments;
  let response = await fetchFromFm(resolvedPath);

  if (response.status === 404 && pathSegments.length > 0) {
    const last = pathSegments.at(-1) ?? "";
    const hasExtension = /\.[^./\\]+$/.test(last);

    if (!hasExtension) {
      resolvedPath = [...pathSegments.slice(0, -1), `${last}.md`];
      response = await fetchFromFm(resolvedPath);
    }
  }

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Failed to load article resource (${response.status})`);
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const data: unknown = await response.json();

    if (Array.isArray(data) && data.every(isFileItem)) {
      return {
        kind: "directory",
        path: resolvedPath,
        items: data,
      };
    }

    return {
      kind: "json",
      path: resolvedPath,
      data,
    };
  }

  const raw = await response.text();
  const fallbackTitle = getFallbackTitle(resolvedPath);
  const fileName = resolvedPath.at(-1) ?? "";

  if (fileName.endsWith(".md")) {
    const content = stripFrontmatter(raw);
    return {
      kind: "markdown",
      path: resolvedPath,
      title: getArticleTitle(content, fallbackTitle),
      html: renderMarkdown(content),
    };
  }

  return {
    kind: "file",
    path: resolvedPath,
    title: path.basename(fileName || fallbackTitle),
    raw,
  };
};
