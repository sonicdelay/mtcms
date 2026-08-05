import { promises as fs } from "node:fs";
import path from "node:path";
import type { Article } from "./types";

const articlesDir = path.join(process.cwd(), "media", "articles", "work");

function extractTitle(content: string, fallback: string): string {
  const line = content.split("\n").find((l) => l.startsWith("# "));
  if (!line) {
    return fallback;
  }
  return line.replace(/^#\s+/, "").replace(/\s*\[\^\]\(.*\)\s*$/, "").trim();
}

/**
 * Returns the list of articles derived from the `media/articles/work` folder.
 */
export async function getArticles(): Promise<Article[]> {
  let files: string[];
  try {
    files = await fs.readdir(articlesDir);
  } catch {
    return [];
  }

  const articles = await Promise.all(
    files
      .filter((file) => file.endsWith(".md"))
      .map(async (file) => {
        const slug = file.replace(/\.md$/, "");
        const content = await fs.readFile(path.join(articlesDir, file), "utf-8");
        return { slug, title: extractTitle(content, slug) };
      }),
  );

  return articles.sort((a, b) => a.title.localeCompare(b.title));
}

/**
 * Reads a single article's markdown, or null when it does not exist.
 */
export async function getArticleContent(slug: string): Promise<string | null> {
  const safeSlug = slug.replace(/[^a-zA-Z0-9_-]/g, "");
  if (safeSlug !== slug) {
    return null;
  }

  try {
    return await fs.readFile(path.join(articlesDir, `${slug}.md`), "utf-8");
  } catch {
    return null;
  }
}
