import fs from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";
import MarkdownIt from "markdown-it";

const md = new MarkdownIt();

export default function AboutPage() {
  const filePath = path.join(process.cwd(), "public", "articles", "contact.md");

  if (!fs.existsSync(filePath)) {
    notFound();
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  const content = raw.replace(/^---[\s\S]*?---\s*/, "");
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
