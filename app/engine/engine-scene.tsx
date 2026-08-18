"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArcRotateCamera,
  AutoRotationBehavior,
  Color3,
  Color4,
  Engine,
  HavokPlugin,
  HemisphericLight,
  MeshBuilder,
  PhysicsAggregate,
  PhysicsShapeType,
  Scene,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core";
import HavokPhysics from "@babylonjs/havok";

import { spawnObjects } from "./scene-objects";

export default function EngineScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<Scene | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let engine: Engine | null = null;

    const init = async () => {
      const eng = new Engine(canvas, true, {
        preserveDrawingBuffer: true,
        stencil: true,
      });
      engine = eng;
      const scn = new Scene(eng);
      sceneRef.current = scn;
      scn.clearColor = new Color4(0.07, 0.08, 0.1, 1);

      const havok = await HavokPhysics();
      scn.enablePhysics(new Vector3(0, -9.81, 0), new HavokPlugin(true, havok));

      const camera = new ArcRotateCamera(
        "camera",
        -Math.PI / 3,
        Math.PI / 3.2,
        24,
        Vector3.Zero(),
        scn,
      );
      camera.attachControl(canvas, true);
      camera.lowerRadiusLimit = 5;
      camera.upperRadiusLimit = 50;

      const autoRotation = new AutoRotationBehavior();
      autoRotation.idleRotationSpeed = 0.2;
      camera.addBehavior(autoRotation);

      const light = new HemisphericLight(
        "light",
        new Vector3(0.6, 1, -0.4),
        scn,
      );
      light.intensity = 0.9;

      const groundMat = new StandardMaterial("groundMat", scn);
      groundMat.diffuseColor = new Color3(0.2, 0.24, 0.28);
      groundMat.specularColor = new Color3(0.1, 0.1, 0.1);
      const ground = MeshBuilder.CreateGround(
        "ground",
        { width: 60, height: 40 },
        scn,
      );
      ground.material = groundMat;
      ground.position.y = -1;
      new PhysicsAggregate(ground, PhysicsShapeType.BOX, { mass: 0 }, scn);

      const groupOrigins = Array.from(
        { length: 260 },
        () =>
          new Vector3(
            Math.random() * 16,
            Math.random() * 16,
            Math.random() * 16,
          ),
      );
      groupOrigins.forEach((origin, i) => spawnObjects(scn, origin, i));

      eng.runRenderLoop(() => scn.render());
    };

    void init();

    const handleResize = () => engine?.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      engine?.stopRenderLoop();
      sceneRef.current?.dispose();
      sceneRef.current = null;
      engine?.dispose();
    };
  }, []);

  useEffect(() => {
    const scn = sceneRef.current;
    if (!scn) return;
    if (inspectorOpen) {
      void import("@babylonjs/inspector").then(() => scn.debugLayer.show());
    } else {
      scn.debugLayer.hide();
    }
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
    </div>
  );
}
