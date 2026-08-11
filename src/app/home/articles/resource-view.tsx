import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchArticleResource, toArticleHref } from "@/lib/articles-fm";

const BackIcon = () => (
  <svg
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    className="h-4 w-4"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
  </svg>
);

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

const getSectionTitle = (pathSegments: string[]) => {
  return pathSegments.at(-1) || "Articles";
};

const getParentHref = (pathSegments: string[]) => {
  if (pathSegments.length === 0) {
    return null;
  }

  const parentPath = pathSegments.slice(0, -1).join("/");

  return toArticleHref(parentPath ? `articles/${parentPath}` : "articles");
};

export const ArticleResourceView = async ({
  pathSegments = [],
}: {
  pathSegments?: string[];
}) => {
  const resource = await fetchArticleResource(pathSegments);

  if (!resource) {
    notFound();
  }

  if (resource.kind === "directory") {
    const parentHref = getParentHref(resource.path);
    const items = resource.items.filter((item) => {
      if (item.name === ".") return false;
      if (item.name !== "..") return true;
      return item.path.startsWith("articles/");
    });

    return (
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-16">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {getSectionTitle(resource.path)}
        </h1>
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
          Browse files and folders in media/articles.
        </p>
        {parentHref ? (
          <div className="mt-6">
            <Link
              href={parentHref}
              className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
            >
              <BackIcon />
              <span>to parent folder</span>
            </Link>
          </div>
        ) : null}
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
  }

  if (resource.kind === "markdown") {
    const parentHref = getParentHref(resource.path);

    return (
      <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-16">
        {parentHref ? (
          <div className="mb-6">
            <Link
              href={parentHref}
              className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
            >
              <BackIcon />
              <span>to parent folder</span>
            </Link>
          </div>
        ) : null}
        <div
          className="markdown-content"
          dangerouslySetInnerHTML={{ __html: resource.html }}
        />
      </div>
    );
  }

  if (resource.kind === "file") {
    const parentHref = getParentHref(resource.path);

    return (
      <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-16">
        {parentHref ? (
          <div className="mb-6">
            <Link
              href={parentHref}
              className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
            >
              <BackIcon />
              <span>back</span>
            </Link>
          </div>
        ) : null}
        <h1 className="mb-6 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {resource.title}
        </h1>
        <pre className="overflow-x-auto rounded-lg bg-zinc-100 p-4 text-sm text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
          {resource.raw}
        </pre>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-16">
      {getParentHref(resource.path) ? (
        <div className="mb-6">
          <Link
            href={getParentHref(resource.path)!}
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
          >
            <BackIcon />
            <span>to parent folder</span>
          </Link>
        </div>
      ) : null}
      <h1 className="mb-6 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        {getSectionTitle(resource.path)}
      </h1>
      <pre className="overflow-x-auto rounded-lg bg-zinc-100 p-4 text-sm text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
        {JSON.stringify(resource.data, null, 2)}
      </pre>
    </div>
  );
};
