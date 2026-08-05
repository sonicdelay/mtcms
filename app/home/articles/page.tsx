import type { Metadata } from "next";
import Link from "next/link";
import { getArticles } from "@/lib/articles.service";

export const metadata: Metadata = {
  title: "Articles",
};

export default async function ArticlesPage() {
  const articles = await getArticles();

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-16">
      <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        Articles
      </h1>
      <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
        Browse all articles.
      </p>
      <ul className="mt-8 flex flex-col gap-3">
        {articles.map((article) => (
          <li key={article.slug}>
            <Link
              href={`/home/articles/${article.slug}`}
              className="text-base font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              {article.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
