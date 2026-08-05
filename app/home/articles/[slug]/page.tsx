import { notFound } from "next/navigation";
import type { Metadata } from "next";
import MarkdownIt from "markdown-it";
import { getArticleContent } from "@/lib/articles.service";

const md = new MarkdownIt();

type Params = Promise<{ slug: string }>;

function extractTitle(content: string, fallback: string): string {
  const line = content.split("\n").find((l) => l.startsWith("# "));
  if (!line) {
    return fallback;
  }
  return line.replace(/^#\s+/, "").replace(/\s*\[\^\]\(.*\)\s*$/, "").trim();
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const content = await getArticleContent(slug);

  if (!content) {
    return { title: "Article Not Found" };
  }

  return { title: extractTitle(content, slug) };
}

export default async function ArticlePage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  const content = await getArticleContent(slug);

  if (!content) {
    notFound();
  }

  const html = md.render(content);

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-16">
      <div
        className="markdown-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
