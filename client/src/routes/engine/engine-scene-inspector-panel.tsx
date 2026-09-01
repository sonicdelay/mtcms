import { useState } from "react";

import type {
  EngineSceneSnapshot,
  MeshSnapshot,
} from "./engine-scene-lite-controller";

function rgb(diffuse: [number, number, number] | null): string {
  return diffuse
    ? `rgb(${Math.round(diffuse[0] * 255)}, ${Math.round(diffuse[1] * 255)}, ${Math.round(diffuse[2] * 255)})`
    : "transparent";
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className="font-mono text-zinc-800 dark:text-zinc-100">{value}</span>
    </div>
  );
}

function MeshDetail({ mesh }: { mesh: MeshSnapshot }) {
  const vec = (v: { x: number; y: number; z: number }) =>
    `${v.x.toFixed(2)}, ${v.y.toFixed(2)}, ${v.z.toFixed(2)}`;
  return (
    <div className="space-y-1.5 border-t border-zinc-200 p-3 dark:border-zinc-700">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs font-semibold text-zinc-800 dark:text-zinc-100">
          {mesh.name}
        </span>
        <span
          className="flex h-4 w-4 shrink-0 rounded-sm border border-zinc-300 dark:border-zinc-600"
          style={{ backgroundColor: rgb(mesh.diffuse) }}
          title="diffuse color"
        />
      </div>
      <Row label="kind" value={mesh.kind} />
      <Row label="mass" value={String(mesh.mass)} />
      <Row label="position" value={vec(mesh.position)} />
      <Row label="rotation" value={`${mesh.rotation.x.toFixed(2)}, ${mesh.rotation.y.toFixed(2)}, ${mesh.rotation.z.toFixed(2)}`} />
      <Row label="scaling" value={vec(mesh.scaling)} />
      {mesh.velocity && <Row label="velocity" value={vec(mesh.velocity)} />}
    </div>
  );
}

export function EngineSceneInspectorPanel({
  snapshot,
  onClose,
}: {
  snapshot: EngineSceneSnapshot | null;
  onClose: () => void;
}) {
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const selected = snapshot?.meshes.find((m) => m.name === selectedName) ?? null;

  return (
    <div className="absolute left-3 top-3 bottom-3 z-20 flex w-72 flex-col overflow-hidden rounded-md border border-zinc-300 bg-white/95 shadow-lg backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/95">
      <div className="flex items-center justify-between gap-2 border-b border-zinc-200 px-3 py-2 dark:border-zinc-700">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            Lite Inspector
          </span>
          <span className="rounded bg-zinc-200 px-1.5 py-0.5 font-mono text-[10px] text-zinc-600 dark:bg-zinc-700 dark:text-zinc-200">
            {snapshot ? `${snapshot.fps.toFixed(0)} fps` : "—"}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          aria-label="Close inspector"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {!snapshot ? (
        <div className="p-3 text-xs text-zinc-500 dark:text-zinc-400">
          Waiting for engine…
        </div>
      ) : !snapshot.ready ? (
        <div className="p-3 text-xs text-zinc-500 dark:text-zinc-400">
          Initializing engine…
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="space-y-1.5 border-b border-zinc-200 px-3 py-2 dark:border-zinc-700">
            <Row label="meshes" value={String(snapshot.meshCount)} />
            <Row label="physics bodies" value={String(snapshot.bodyCount)} />
            <Row
              label="gravity"
              value={`${snapshot.gravity.x.toFixed(2)}, ${snapshot.gravity.y.toFixed(2)}, ${snapshot.gravity.z.toFixed(2)}`}
            />
            {snapshot.camera && (
              <>
                <Row label="alpha" value={`${snapshot.camera.alpha.toFixed(2)} rad`} />
                <Row label="beta" value={`${snapshot.camera.beta.toFixed(2)} rad`} />
                <Row label="radius" value={`${snapshot.camera.radius.toFixed(2)}`} />
                <Row
                  label="target"
                  value={`${snapshot.camera.target.x.toFixed(1)}, ${snapshot.camera.target.y.toFixed(1)}, ${snapshot.camera.target.z.toFixed(1)}`}
                />
              </>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="p-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Scene objects
            </div>
            {snapshot.meshes.map((mesh) => (
              <button
                key={mesh.name}
                type="button"
                onClick={() => setSelectedName(mesh.name)}
                className={`flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-xs transition-colors ${
                  selectedName === mesh.name
                    ? "bg-zinc-100 dark:bg-zinc-800"
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                }`}
              >
                <span className="truncate text-zinc-800 dark:text-zinc-100">
                  {mesh.name}
                </span>
                <span className="flex shrink-0 items-center gap-1.5">
                  <span className="font-mono text-[10px] text-zinc-400">
                    {mesh.kind} {mesh.mass > 0 ? `· ${mesh.mass} kg` : "(static)"}
                  </span>
                  <span
                    className="h-3 w-3 rounded-sm border border-zinc-300 dark:border-zinc-600"
                    style={{ backgroundColor: rgb(mesh.diffuse) }}
                  />
                </span>
              </button>
            ))}
          </div>

          {selected && <MeshDetail mesh={selected} />}
        </div>
      )}
    </div>
  );
}