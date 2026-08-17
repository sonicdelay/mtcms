import type { Metadata } from "next";
import EngineScene from "./engine-scene";

export const metadata: Metadata = {
  title: "3D Engine | MTCMS",
  description: "Interactive 3D scene powered by Babylon.js.",
};

export default function EnginePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex h-14 max-w-full items-center justify-between px-6">
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            SonicDelay 3D Engine
          </h1>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            Babylon.js
          </span>
        </div>
      </header>
      <main className="flex flex-1 flex-col">
        <EngineScene />
      </main>
    </div>
  );
}
