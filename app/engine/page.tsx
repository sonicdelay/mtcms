import type { Metadata } from "next";
import EngineSceneClient from "./engine-scene-client";

export const metadata: Metadata = {
  title: "3D Engine | MTCMS",
  description: "Interactive 3D scene powered by Babylon.js.",
};

export default function EnginePage() {
  return (
    <div className="relative flex h-screen flex-col overflow-hidden">
      <div className="h-full w-full">
        <EngineSceneClient />
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
