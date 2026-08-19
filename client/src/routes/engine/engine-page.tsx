import { lazy, Suspense } from "react";

const EngineScene = lazy(() => import("./engine-scene"));

export default function EnginePage() {
  return (
    <div className="relative flex h-screen flex-col overflow-hidden">
      <div className="h-full w-full">
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center text-zinc-400 dark:text-zinc-500">
              Loading 3D engine…
            </div>
          }
        >
          <EngineScene />
        </Suspense>
      </div>
      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 text-center text-white">
        <p className="text-2xl font-semibold tracking-wide drop-shadow-lg">
          Placeholder Overlay
        </p>
        <p className="text-sm text-white/70">
          Full-size HTML overlay above the 3D scene
        </p>
      </div>
    </div>
  );
}