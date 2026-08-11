import path from "node:path";
import { contentRoot, getMarkdownHtml } from "@/lib/markdown-content";

const AboutPage = () => {
  const filePath = path.join(contentRoot, "about.md");
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

export default AboutPage;
