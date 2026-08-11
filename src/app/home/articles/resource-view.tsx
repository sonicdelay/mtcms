"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import MarkdownIt from "markdown-it";

type FileItem = {
  path: string;
  name: string;
  type: "dir" | "file";
};

type ArticleDirectoryResource = {
  kind: "directory";
  path: string[];
  items: FileItem[];
};

type ArticleMarkdownResource = {
  kind: "markdown";
  path: string[];
  title: string;
  html: string;
};

type ArticleFileResource = {
  kind: "file";
  path: string[];
  title: string;
  raw: string;
};

type ArticleJsonResource = {
  kind: "json";
  path: string[];
  data: unknown;
};

type ArticleResource =
  | ArticleDirectoryResource
  | ArticleMarkdownResource
  | ArticleFileResource
  | ArticleJsonResource;

const ARTICLES_PREFIX = "articles";

const toArticleHref = (itemPath: string) => {
  const relativePath = itemPath === ARTICLES_PREFIX
    ? ""
    : itemPath.startsWith(`${ARTICLES_PREFIX}/`)
      ? itemPath.slice(ARTICLES_PREFIX.length + 1)
      : itemPath;

  return relativePath ? `/home/articles/${relativePath}` : "/home/articles";
};

const stripFrontmatter = (content: string) =>
  content.replace(/^---[\s\S]*?---\s*/, "");

const getArticleTitle = (content: string, fallback: string) => {
  const firstHeading = content.split("\n").find((line) => line.startsWith("# "));

  return firstHeading
    ? firstHeading.replace(/^#\s+/, "").replace(/\s*\[\^\]\(.*\)\s*$/, "").trim()
    : fallback;
};

const isFileItem = (value: unknown): value is FileItem => {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;

  return typeof record.path === "string" &&
    typeof record.name === "string" &&
    (record.type === "dir" || record.type === "file");
};

const fetchArticleResource = async (
  pathSegments: string[],
  markdown: MarkdownIt,
): Promise<ArticleResource | null> => {
  const fetchFromFm = async (segments: string[]) => {
    const apiPath = [ARTICLES_PREFIX, ...segments].join("/");
    return fetch(`/api/fm/${apiPath}`, { cache: "no-store" });
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
  const fileName = resolvedPath.at(-1) ?? "";
  const fallbackTitle = fileName.replace(/\.[^.]+$/, "") || "Articles";

  if (fileName.endsWith(".md")) {
    const content = stripFrontmatter(raw);
    return {
      kind: "markdown",
      path: resolvedPath,
      title: getArticleTitle(content, fallbackTitle),
      html: markdown.render(content),
    };
  }

  return {
    kind: "file",
    path: resolvedPath,
    title: fileName || "Articles",
    raw,
  };
};

const BackIcon = () => (
  <svg
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    className="h-4 w-4"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
  </svg>
);

const FolderIcon = () => (
  <svg
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="h-4 w-4"
  >
    <path d="M3.75 6.75A2.25 2.25 0 0 1 6 4.5h3.19a2.25 2.25 0 0 1 1.59.66l1.1 1.09c.14.14.33.22.53.22H18A2.25 2.25 0 0 1 20.25 8.7v7.8A2.25 2.25 0 0 1 18 18.75H6a2.25 2.25 0 0 1-2.25-2.25v-9.75Z" />
  </svg>
);

const FileIcon = () => (
  <svg
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="h-4 w-4"
  >
    <path d="M6.75 3.75A2.25 2.25 0 0 0 4.5 6v12A2.25 2.25 0 0 0 6.75 20.25h10.5A2.25 2.25 0 0 0 19.5 18V9.621a2.25 2.25 0 0 0-.659-1.591l-3.37-3.371A2.25 2.25 0 0 0 13.879 4.5H6.75Z" />
  </svg>
);

const getSectionTitle = (pathSegments: string[]) => {
  return pathSegments.at(-1) || "Articles";
};

const getParentHref = (pathSegments: string[]) => {
  if (pathSegments.length === 0) {
    return null;
  }

  const parentPath = pathSegments.slice(0, -1).join("/");

  return toArticleHref(parentPath ? `articles/${parentPath}` : "articles");
};

export const ArticleResourceView = ({
  pathSegments = [],
}: {
  pathSegments?: string[];
}) => {
  const markdown = useMemo(() => new MarkdownIt({ html: true }), []);
  const pathKey = useMemo(() => pathSegments.join("/"), [pathSegments]);
  const stablePathSegments = useMemo(() => pathKey.split("/").filter(Boolean), [pathKey]);
  const [resource, setResource] = useState<ArticleResource | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "not-found" | "error">("loading");

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setStatus("loading");
      try {
        const result = await fetchArticleResource(stablePathSegments, markdown);
        if (cancelled) return;

        if (!result) {
          setStatus("not-found");
          setResource(null);
          return;
        }

        setResource(result);
        setStatus("ready");
      } catch {
        if (cancelled) return;
        setStatus("error");
        setResource(null);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [markdown, stablePathSegments]);

  if (status === "loading") {
    return (
      <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-16 text-zinc-600 dark:text-zinc-300">
        Loading articles...
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-16 text-zinc-600 dark:text-zinc-300">
        Failed to load content.
      </div>
    );
  }

  if (status === "not-found" || !resource) {
    return (
      <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-16 text-zinc-600 dark:text-zinc-300">
        Article or folder not found.
      </div>
    );
  }

  if (resource.kind === "directory") {
    const parentHref = getParentHref(resource.path);
    const items = resource.items.filter((item) => {
      if (item.name === ".") return false;
      if (item.name !== "..") return true;
      return item.path.startsWith("articles/");
    });

    return (
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-16">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {getSectionTitle(resource.path)}
        </h1>
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
          Browse files and folders in media/articles.
        </p>
        {parentHref ? (
          <div className="mt-6">
            <Link
              href={parentHref}
              className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
            >
              <BackIcon />
              <span>to parent folder</span>
            </Link>
          </div>
        ) : null}
        <ul className="mt-8 flex flex-col gap-3">
          {items.map((item) => (
            <li key={`${item.type}:${item.path}`}>
              <Link
                href={toArticleHref(item.path)}
                className="inline-flex items-center gap-2 text-base font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                {item.type === "dir" ? <FolderIcon /> : <FileIcon />}
                <span>{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (resource.kind === "markdown") {
    const parentHref = getParentHref(resource.path);

    return (
      <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-16">
        {parentHref ? (
          <div className="mb-6">
            <Link
              href={parentHref}
              className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
            >
              <BackIcon />
              <span>to parent folder</span>
            </Link>
          </div>
        ) : null}
        <div
          className="markdown-content"
          dangerouslySetInnerHTML={{ __html: resource.html }}
        />
      </div>
    );
  }

  if (resource.kind === "file") {
    const parentHref = getParentHref(resource.path);

    return (
      <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-16">
        {parentHref ? (
          <div className="mb-6">
            <Link
              href={parentHref}
              className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
            >
              <BackIcon />
              <span>back</span>
            </Link>
          </div>
        ) : null}
        <h1 className="mb-6 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {resource.title}
        </h1>
        <pre className="overflow-x-auto rounded-lg bg-zinc-100 p-4 text-sm text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
          {resource.raw}
        </pre>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-16">
      {getParentHref(resource.path) ? (
        <div className="mb-6">
          <Link
            href={getParentHref(resource.path)!}
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
          >
            <BackIcon />
            <span>to parent folder</span>
          </Link>
        </div>
      ) : null}
      <h1 className="mb-6 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        {getSectionTitle(resource.path)}
      </h1>
      <pre className="overflow-x-auto rounded-lg bg-zinc-100 p-4 text-sm text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
        {JSON.stringify(resource.data, null, 2)}
      </pre>
    </div>
  );
};
