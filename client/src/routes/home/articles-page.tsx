import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import MarkdownIt from "markdown-it";
import "../../markdown.scss";

interface ArticleItem {
  name: string;
  path: string;
  type: "dir" | "file";
  title?: string;
}

type DirState = { kind: "dir"; items: ArticleItem[] };
type FileState = { kind: "file"; content: string };
type ErrorState = { kind: "error" };
type ArticlesState = DirState | FileState | ErrorState | { kind: "loading" };

const md = new MarkdownIt({
  html: true,
  linkify: true,
});

const defaultRender = md.renderer.rules.link_open ??
  ((tokens, idx, options, _env, self) =>
    self.renderToken(tokens, idx, options));

md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  const href = token.attrGet("href") ?? "";

  if (/^[a-zA-Z0-9][^:/]*\.md(?:#.*)?$/.test(href)) {
    const base = env.articlePath?.replace(/\.md$/, "") ?? "";
    const dir = base.includes("/") ? base.slice(0, base.lastIndexOf("/")) : "";
    const name = href.replace(/\.md$/, "");
    token.attrSet("href", `/home/articles/${dir ? `${dir}/` : ""}${name}`);
  }

  return defaultRender(tokens, idx, options, env, self);
};

function buildBreadcrumb(segments: string[]) {
  const crumbs: { label: string; href: string }[] = [
    { label: "Artikel", href: "/home/articles" },
  ];
  let acc = "";
  for (const segment of segments) {
    acc = acc ? `${acc}/${segment}` : segment;
    crumbs.push({ label: segment, href: `/home/articles/${acc}` });
  }
  return crumbs;
}

function displayName(item: ArticleItem) {
  if (item.type === "file") {
    return item.title ?? item.name.replace(/\.md$/, "");
  }
  return item.name;
}

function Breadcrumb({
  crumbs,
}: {
  crumbs: { label: string; href: string }[];
}) {
  return (
    <nav className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
      {crumbs.map((crumb, index) => (
        <span key={crumb.href}>
          {index > 0 && <span className="mx-2">/</span>}
          {index < crumbs.length - 1
            ? (
              <Link to={crumb.href} className="hover:underline">
                {crumb.label}
              </Link>
            )
            : <span>{crumb.label}</span>}
        </span>
      ))}
    </nav>
  );
}

export default function ArticlesPage() {
  const params = useParams();
  const splat = params["*"] ?? "";
  const segments = splat.split("/").filter(Boolean);

  const [state, setState] = useState<ArticlesState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    const pathSegments = splat.split("/").filter(Boolean);
    const path = pathSegments.length
      ? `/${pathSegments.map(encodeURIComponent).join("/")}`
      : "";
    setState({ kind: "loading" });

    fetch(`/api/articles${path}`)
      .then((res) => {
        if (!res.ok) {
          if (!cancelled) setState({ kind: "error" });
          return;
        }
        const contentType = res.headers.get("content-type") ?? "";
        if (contentType.includes("application/json")) {
          return res.json().then((items: ArticleItem[]) => {
            if (!cancelled) setState({ kind: "dir", items });
          });
        }
        return res.text().then((content) => {
          if (!cancelled) setState({ kind: "file", content });
        });
      })
      .catch(() => {
        if (!cancelled) setState({ kind: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [splat]);

  const crumbs = buildBreadcrumb(segments);

  if (state.kind === "loading") {
    return (
      <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-16">
        <p className="text-zinc-500 dark:text-zinc-400">Loading…</p>
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-16">
        <Breadcrumb crumbs={crumbs} />
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Not Found
        </h1>
      </div>
    );
  }

  if (state.kind === "file") {
    const html = md.render(state.content, {
      articlePath: `${segments.join("/")}.md`,
    });
    return (
      <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-16">
        <Breadcrumb crumbs={crumbs} />
        <div
          className="markdown-content"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-16">
      <Breadcrumb crumbs={crumbs} />
      <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        {segments[segments.length - 1] ?? "Artikel"}
      </h1>
      <ul className="mt-8 flex flex-col gap-3">
        {state.items.map((item) => {
          const isFile = item.type === "file";
          return (
            <li key={item.path}>
              <Link
                to={`/home/articles/${item.path.replace(/\.md$/, "")}`}
                className="text-base font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                {isFile ? "📄 " : "📁 "}
                {displayName(item)}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
