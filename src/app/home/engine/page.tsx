import Link from "next/link";

export default function EnginePage() {
  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-16">
      <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        3D Engine
      </h1>
      <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
        Interactive 3D viewer.
      </p>
      <div className="mt-8">
        <Link
          href="/engine"
          className="inline-flex items-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Open engine page
        </Link>
        This can take some seconds to initialize the engine, so please be patient. You can also open the dedicated engine route at{" /engine"} to see the engine without the home page.
      </div>
    </div>
  );
}
