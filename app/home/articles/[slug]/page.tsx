import fs from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import MarkdownIt from "markdown-it";

const articlesDir = path.join(process.cwd(), "..", "media", "articles", "work");

const md = new MarkdownIt();

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const filePath = path.join(articlesDir, `${slug}.md`);

  if (!fs.existsSync(filePath)) return { title: "Article Not Found" };

  const content = fs.readFileSync(filePath, "utf-8");
  const firstLine = content.split("\n").find((l) => l.startsWith("# "));
  const title = firstLine
    ? firstLine.replace(/^#\s+/, "").replace(/\s*\[\^\]\(.*\)\s*$/, "").trim()
    : slug;

  return { title };
}

export default async function ArticlePage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  const filePath = path.join(articlesDir, `${slug}.md`);

  if (!fs.existsSync(filePath)) notFound();

  const raw = fs.readFileSync(filePath, "utf-8");
  const html = md.render(raw);

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-16">
      <div
        className="markdown-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
