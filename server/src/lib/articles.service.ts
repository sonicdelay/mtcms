import { promises as fs } from "node:fs";
import path from "node:path";
import type { FileItem } from "./types.ts";

export const ARTICLES_ROOT = path.join(process.cwd(), "media", "articles");

export class ArticlesError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ArticlesError";
  }
}

export interface ArticleItem extends FileItem {
  title?: string;
}

/**
 * Resolves a relative articles path against the articles root, guarding
 * against path traversal outside of it.
 */
export function resolveArticlesPath(relPath = ""): string {
  const absolute = path.resolve(ARTICLES_ROOT, relPath);
  if (
    absolute !== ARTICLES_ROOT &&
    !absolute.startsWith(ARTICLES_ROOT + path.sep)
  ) {
    throw new ArticlesError("Path escapes the articles root.");
  }
  return absolute;
}

export function isValidSegment(segment: string): boolean {
  return segment !== "" && /^[a-zA-Z0-9_-]+$/.test(segment);
}

function stripMarkdown(title: string): string {
  return title
    .replace(/\*\*/g, "")
    .replace(/^#+\s*/, "")
    .replace(/\s*\[\^\]\(.*\)\s*$/, "")
    .replace(/\s*\[\^\]\S*\s*$/, "")
    .trim();
}

export function extractTitle(content: string, fallback: string): string {
  const headings = content.split("\n").filter((l) => /^#{1,6}\s+/.test(l));
  if (headings.length === 0) {
    return fallback;
  }

  const h1 = headings.find((l) => /^#\s+/.test(l));
  if (h1) {
    return stripMarkdown(h1);
  }

  const preferred = headings.find((l) =>
    /Kapitel|Anhang|Schluss|ÜBER DEN AUTOR|Willkommen/i.test(l)
  );
  return stripMarkdown(preferred ?? headings[0]);
}

/**
 * Lists the directories and markdown files inside the given relative folder.
 */
export async function listArticleDir(relPath = ""): Promise<FileItem[]> {
  const absolute = resolveArticlesPath(relPath);
  let entries;
  try {
    entries = await fs.readdir(absolute, { withFileTypes: true });
  } catch {
    return [];
  }

  const items: FileItem[] = entries
    .filter(
      (entry) =>
        entry.isDirectory() || (entry.isFile() && entry.name.endsWith(".md")),
    )
    .map((entry) => {
      const dir = relPath.replace(/^\/+/, "");
      return {
        name: entry.name,
        path: dir ? `${dir}/${entry.name}` : entry.name,
        type: entry.isDirectory() ? "dir" : "file",
      };
    });

  const dirs = items.filter((item) => item.type === "dir");
  const files = items.filter((item) => item.type === "file");

  return [...dirs, ...files];
}

/**
 * Lists a folder and enriches markdown files with their extracted titles.
 */
export async function listArticleDirWithTitles(
  relPath = "",
): Promise<ArticleItem[]> {
  const items = await listArticleDir(relPath);
  return Promise.all(
    items.map(async (item) => {
      if (item.type === "file") {
        const content = await getArticleContent(item.path);
        return {
          ...item,
          title: extractTitle(
            content ?? "",
            item.name.replace(/\.md$/, ""),
          ),
        };
      }
      return item;
    }),
  );
}

/**
 * Reads a single article's markdown, or null when it does not exist.
 */
export async function getArticleContent(
  relPath: string,
): Promise<string | null> {
  const absolute = resolveArticlesPath(relPath);
  try {
    return await fs.readFile(absolute, "utf-8");
  } catch {
    return null;
  }
}

/**
 * Returns the article title for a given relative markdown path.
 */
export async function getArticleTitle(relPath: string): Promise<string> {
  const content = await getArticleContent(relPath);
  return extractTitle(
    content ?? "",
    path.basename(relPath).replace(/\.md$/, ""),
  );
}

/**
 * Resolves a directory or file path. Returns a discriminated result so the
 * caller can decide whether to render a listing or markdown content.
 */
export async function resolveArticlePath(
  segments: string[],
): Promise<{ type: "dir" | "file"; relPath: string } | null> {
  if (segments.some((segment) => !isValidSegment(segment))) {
    return null;
  }

  const relPath = segments.join("/");

  try {
    const stat = await fs.stat(resolveArticlesPath(relPath));
    if (stat.isDirectory()) {
      return { type: "dir", relPath };
    }
  } catch {
    // fall through to file check
  }

  const filePath = `${relPath}.md`;
  try {
    await fs.stat(resolveArticlesPath(filePath));
    return { type: "file", relPath: filePath };
  } catch {
    return null;
  }
}
