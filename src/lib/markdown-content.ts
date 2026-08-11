import fs from "node:fs";
import path from "node:path";
import MarkdownIt from "markdown-it";

const markdown = new MarkdownIt({ html: true });
const articleSuffixPattern = /\s*\[\^\]\(.*\)\s*$/;
const frontmatterPattern = /^---[\s\S]*?---\s*/;

export const contentRoot = path.join(process.cwd(), "public", "articles");
export const workArticlesRoot = path.join(
  process.cwd(),
  "..",
  "media",
  "articles",
  "work",
);

const readText = (filePath: string) => fs.readFileSync(filePath, "utf-8");

export const hasFile = (filePath: string) => fs.existsSync(filePath);

export const stripFrontmatter = (content: string) =>
  content.replace(frontmatterPattern, "");

export const renderMarkdown = (content: string) => markdown.render(content);

export const getMarkdownHtml = (filePath: string) =>
  renderMarkdown(stripFrontmatter(readText(filePath)));

export const getArticleTitle = (content: string, fallback: string) => {
  const firstHeading = content.split("\n").find((line) => line.startsWith("# "));

  return firstHeading
    ? firstHeading.replace(/^#\s+/, "").replace(articleSuffixPattern, "").trim()
    : fallback;
};

export const listArticleFiles = () => {
  if (!hasFile(workArticlesRoot)) return [];

  return fs.readdirSync(workArticlesRoot).filter((file) => file.endsWith(".md"));
};

export const readArticle = (slug: string) => {
  const filePath = path.join(workArticlesRoot, `${slug}.md`);
  if (!hasFile(filePath)) return null;

  const raw = readText(filePath);

  return {
    filePath,
    raw,
    title: getArticleTitle(raw, slug),
    html: renderMarkdown(raw),
  };
};
