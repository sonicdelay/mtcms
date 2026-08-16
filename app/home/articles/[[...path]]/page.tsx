import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import MarkdownIt from "markdown-it";
import path from "node:path";
import {
  extractTitle,
  getArticleContent,
  listArticleDir,
  resolveArticlePath,
} from "@/lib/articles.service";

type Params = Promise<{ path?: string[] }>;

const md = new MarkdownIt({
  html: false,
  linkify: true,
});

const defaultRender =
  md.renderer.rules.link_open ??
  ((tokens, idx, options, _env, self) =>
    self.renderToken(tokens, idx, options));

md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  const href = token.attrGet("href") ?? "";

  if (/^[a-zA-Z0-9][^:/]*\.md(?:\#.*)?$/.test(href)) {
    const base = env.articlePath?.replace(/\.md$/, "") ?? "";
    const dir = path.dirname(base) === "." ? "" : path.dirname(base);
    const name = href.replace(/\.md$/, "");
    token.attrSet("href", `/home/articles/${dir ? `${dir}/` : ""}${name}`);
  }

  return defaultRender(tokens, idx, options, env, self);
};

function buildBreadcrumb(
  segments: string[],
): { label: string; href: string }[] {
  const crumbs: { label: string; href: string }[] = [
    { label: "Articles", href: "/home/articles" },
  ];
  let acc = "";
  for (const segment of segments) {
    acc = acc ? `${acc}/${segment}` : segment;
    crumbs.push({ label: segment, href: `/home/articles/${acc}` });
  }
  return crumbs;
}

function displayName(item: { name: string; type: string }, title?: string) {
  if (item.type === "file") {
    return title ?? item.name.replace(/\.md$/, "");
  }
  return item.name;
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { path: segments = [] } = await params;
  const resolved = await resolveArticlePath(segments);
  if (!resolved) {
    return { title: "Not Found" };
  }

  if (resolved.type === "file") {
    const content = await getArticleContent(resolved.relPath);
    return {
      title: extractTitle(content ?? "", path.basename(resolved.relPath)),
    };
  }

  const name = segments[segments.length - 1];
  return { title: name ? name : "Articles" };
}

export default async function ArticlesBrowser({ params }: { params: Params }) {
  const { path: segments = [] } = await params;
  const resolved = await resolveArticlePath(segments);

  if (!resolved) {
    notFound();
  }

  const crumbs = buildBreadcrumb(segments);

  if (resolved.type === "file") {
    const content = await getArticleContent(resolved.relPath);
    if (!content) {
      notFound();
    }

    const html = md.render(content, { articlePath: resolved.relPath });

    return (
      <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-16">
        <nav className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
          {crumbs.map((crumb, index) => (
            <span key={crumb.href}>
              {index > 0 && <span className="mx-2">/</span>}
              {index < crumbs.length - 1 ? (
                <Link href={crumb.href} className="hover:underline">
                  {crumb.label}
                </Link>
              ) : (
                <span>{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
        <div
          className="markdown-content"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    );
  }

  const items = await listArticleDir(resolved.relPath);
  const titles = new Map<string, string>();

  await Promise.all(
    items
      .filter((item) => item.type === "file")
      .map(async (item) => {
        const content = await getArticleContent(item.path);
        titles.set(
          item.name,
          extractTitle(content ?? "", item.name.replace(/\.md$/, "")),
        );
      }),
  );

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-16">
      <nav className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
        {crumbs.map((crumb, index) => (
          <span key={crumb.href}>
            {index > 0 && <span className="mx-2">/</span>}
            {index < crumbs.length - 1 ? (
              <Link href={crumb.href} className="hover:underline">
                {crumb.label}
              </Link>
            ) : (
              <span>{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>
      <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        {segments[segments.length - 1] ?? "Articles"}
      </h1>
      <ul className="mt-8 flex flex-col gap-3">
        {items.map((item) => {
          const isFile = item.type === "file";
          const label = displayName(item, titles.get(item.name));
          return (
            <li key={item.path}>
              <Link
                href={`/home/articles/${item.path.replace(/\.md$/, "")}`}
                className="text-base font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                {isFile ? "📄 " : "📁 "}
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
