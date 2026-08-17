import fs from "node:fs";
import path from "node:path";
import MarkdownIt from "markdown-it";
import { notFound } from "next/navigation";

const md = new MarkdownIt({ html: true });

export default async function ContentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const filePath = path.join(process.cwd(), "public", "articles", `${id}.md`);
  console.log("filePath", filePath);
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
