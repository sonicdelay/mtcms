import { lazy, Suspense } from "react";

const EngineScene = lazy(() => import("./engine-scene-lite"));

export default function EnginePage() {
  return (
    <div className="relative flex h-screen flex-col overflow-hidden">
      <div className="h-full w-full">
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center text-zinc-400 dark:text-zinc-500">
              Loading 3D engine…<br />
              <span className="loader"></span>
            </div>
          }
        >
          <EngineScene />
        </Suspense>
      </div>
    </div>
  );
}
