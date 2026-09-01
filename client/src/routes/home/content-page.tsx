import { useEffect, useState } from "react";
import { useParams } from "react-router";
import MarkdownIt from "markdown-it";
import "../../markdown.scss";

const md = new MarkdownIt({ html: true });

type ContentState =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "ready"; html: string };

export default function ContentPage() {
  const { id } = useParams();
  const [state, setState] = useState<ContentState>({ kind: "loading" });

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setState({ kind: "loading" });

    fetch(`/content/${encodeURIComponent(id)}.md`)
      .then(async (res) => {
        if (!res.ok) {
          if (!cancelled) setState({ kind: "error" });
          return;
        }
        const raw = await res.text();
        const content = raw.replace(/^---[\s\S]*?---\s*/, "");
        if (!cancelled) {
          setState({ kind: "ready", html: md.render(content) });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ kind: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

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
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Not Found
        </h1>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-16">
      <div
        className="markdown-content"
        dangerouslySetInnerHTML={{ __html: state.html }}
      />
    </div>
  );
}
