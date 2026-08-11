import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchArticleResource, toArticleHref } from "@/lib/articles-fm";

export const dynamic = "force-dynamic";

const FolderIcon = () => (
  <svg
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="h-4 w-4"
  >
    <path d="M3.75 6.75A2.25 2.25 0 0 1 6 4.5h3.19a2.25 2.25 0 0 1 1.59.66l1.1 1.09c.14.14.33.22.53.22H18A2.25 2.25 0 0 1 20.25 8.7v7.8A2.25 2.25 0 0 1 18 18.75H6a2.25 2.25 0 0 1-2.25-2.25v-9.75Z" />
  </svg>
);

const FileIcon = () => (
  <svg
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="h-4 w-4"
  >
    <path d="M6.75 3.75A2.25 2.25 0 0 0 4.5 6v12A2.25 2.25 0 0 0 6.75 20.25h10.5A2.25 2.25 0 0 0 19.5 18V9.621a2.25 2.25 0 0 0-.659-1.591l-3.37-3.371A2.25 2.25 0 0 0 13.879 4.5H6.75Z" />
  </svg>
);

const ArticlesPage = async () => {
  const resource = await fetchArticleResource([]);

  if (!resource) {
    notFound();
  }

  if (resource.kind !== "directory") {
    notFound();
  }

  const items = resource.items.filter((item) => item.name !== "." && item.name !== "..");

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-16">
      <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        Articles
      </h1>
      <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
        Browse files and folders in media/articles.
      </p>
      <ul className="mt-8 flex flex-col gap-3">
        {items.map((item) => (
          <li key={`${item.type}:${item.path}`}>
            <Link
              href={toArticleHref(item.path)}
              className="inline-flex items-center gap-2 text-base font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              {item.type === "dir" ? <FolderIcon /> : <FileIcon />}
              <span>{item.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ArticlesPage;
