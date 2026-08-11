import path from "node:path";
import { notFound } from "next/navigation";
import { contentRoot, getMarkdownHtml, hasFile } from "@/lib/markdown-content";

type Params = Promise<{ slug: string }>;

const ContentPage = async ({
  params,
}: {
  params: Params;
}) => {
  const { slug } = await params;
  const fileName = slug.endsWith(".md") ? slug : `${slug}.md`;
  const filePath = path.join(contentRoot, fileName);

  if (!hasFile(filePath)) {
    notFound();
  }

  const html = getMarkdownHtml(filePath);

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-16">
      <div
        className="markdown-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
};

export default ContentPage;
