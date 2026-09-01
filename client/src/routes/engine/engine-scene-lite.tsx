import { useEffect, useRef, useState } from "react";
import { decodeError } from "@babylonjs/lite";

import {
  EngineSceneController,
  type EngineSceneSnapshot,
} from "./engine-scene-lite-controller";
import { EngineSceneInspectorPanel } from "./engine-scene-inspector-panel";

export default function EngineSceneLite() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controllerRef = useRef<EngineSceneController | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [snapshot, setSnapshot] = useState<EngineSceneSnapshot | null>(null);
  const [webgpuError, setWebgpuError] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const controller = new EngineSceneController();
    controllerRef.current = controller;
    void controller.init(canvas).catch((error) => {
      setWebgpuError(decodeError(error));
    });

    return () => controller.dispose();
  }, []);

  useEffect(() => {
    if (!inspectorOpen) {
      setSnapshot(null);
      return;
    }
    const controller = controllerRef.current;
    if (!controller) return;
    const refresh = () => setSnapshot(controller.getSnapshot());
    refresh();
    const id = window.setInterval(refresh, 200);
    return () => window.clearInterval(id);
  }, [inspectorOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "F12") {
        event.preventDefault();
        setInspectorOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="relative h-full w-full">
      <canvas
        ref={canvasRef}
        className="h-full w-full touch-none"
        style={{ display: "block" }}
      />
      <button
        type="button"
        onClick={() => setInspectorOpen((open) => !open)}
        className="absolute right-3 top-3 z-10 rounded-md border border-zinc-300 bg-white/80 px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-sm backdrop-blur transition-colors hover:bg-white dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-200 dark:hover:bg-zinc-900"
      >
        {inspectorOpen ? "Hide Inspector" : "Inspector (F12)"}
      </button>
      {inspectorOpen && (
        <EngineSceneInspectorPanel
          snapshot={snapshot}
          onClose={() => setInspectorOpen(false)}
        />
      )}

      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 text-center text-white">
        <p className="text-2xl font-semibold tracking-wide drop-shadow-lg">
          Placeholder Overlay
        </p>
        <p className="text-sm text-white/70">
          Full-size HTML overlay above the 3D scene
        </p>
      </div>

      {webgpuError && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-950/90 p-8">
          <p className="max-w-md text-center text-sm text-zinc-200">
            {webgpuError}
          </p>
        </div>
      )}
    </div>
  );
}
