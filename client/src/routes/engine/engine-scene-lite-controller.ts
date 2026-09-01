import {
  addToScene,
  attachControl,
  createArcRotateCamera,
  createEngine,
  createGround,
  createHavokWorld,
  createHemisphericLight,
  createPhysicsAggregate,
  createSceneContext,
  createStandardMaterial,
  disposeEngine,
  disposePhysics,
  disposeScene,
  getPhysicsBodyLinearVelocity,
  onBeforeRender,
  registerScene,
  startEngine,
  stopEngine,
  type ArcRotateCamera,
  type EngineContext,
  type Mesh,
  type PhysicsBody,
  type PhysicsWorld,
  type SceneContext,
  type StandardMaterialProps,
} from "@babylonjs/lite";
import HavokPhysics from "@babylonjs/havok";
import HavokWasmUrl from "@babylonjs/havok/lib/esm/HavokPhysics.wasm?url";

import { physicsShapeTypes, spawnObjectLite } from "./scene-objects-lite";

export type Vec3Like = { x: number; y: number; z: number };

export interface MeshSnapshot {
  name: string;
  kind: keyof typeof physicsShapeTypes;
  mass: number;
  position: Vec3Like;
  rotation: Vec3Like;
  scaling: Vec3Like;
  diffuse: [number, number, number] | null;
  velocity: Vec3Like | null;
}

export interface EngineSceneSnapshot {
  ready: boolean;
  fps: number;
  meshCount: number;
  bodyCount: number;
  gravity: Vec3Like;
  camera: {
    alpha: number;
    beta: number;
    radius: number;
    target: Vec3Like;
    eye: Vec3Like;
  } | null;
  meshes: MeshSnapshot[];
}

type SpawnedEntry = {
  mesh: Mesh;
  body: PhysicsBody;
  kind: keyof typeof physicsShapeTypes;
  mass: number;
};

export class EngineSceneController {
  private engine: EngineContext | null = null;
  private scene: SceneContext | null = null;
  private world: PhysicsWorld | null = null;
  private bodies: PhysicsBody[] = [];
  private entries: SpawnedEntry[] = [];
  private detachControl: (() => void) | null = null;
  private cancelled = false;
  private gravity: Vec3Like = { x: 0, y: -9.81, z: 0 };
  private fps = 0;
  private frameCount = 0;
  private fpsWindowStart = 0;

  async init(canvas: HTMLCanvasElement): Promise<void> {
    this.cancelled = false;

    if (!(navigator as Navigator & { gpu?: unknown }).gpu) {
      throw new Error(
        "WebGPU is not available in this browser. The Lite engine requires WebGPU.",
      );
    }

    const engine = await createEngine(canvas);
    if (this.cancelled) {
      disposeEngine(engine);
      return;
    }
    this.engine = engine;

    const scene = createSceneContext(engine);
    this.scene = scene;
    scene.clearColor = { r: 0.07, g: 0.08, b: 0.1, a: 1 };

    const wasmResponse = await fetch(HavokWasmUrl);
    const wasmBinary = await wasmResponse.arrayBuffer();
    const havok = await HavokPhysics({ wasmBinary });
    if (this.cancelled) return;

    const world = createHavokWorld(scene, havok, this.gravity);
    this.world = world;

    const camera = createArcRotateCamera(-Math.PI / 3, Math.PI / 3.2, 24, {
      x: 0,
      y: 0,
      z: 0,
    });
    camera.lowerRadiusLimit = 5;
    camera.upperRadiusLimit = 50;
    addToScene(scene, camera);
    scene.camera = camera;
    this.detachControl = attachControl(camera, canvas, scene);

    onBeforeRender(scene, (deltaMs) => {
      camera.alpha += 0.2 * (deltaMs / 1000);
      this.sampleFps();
    });

    const light = createHemisphericLight([0.6, 1, -0.4], 0.9);
    addToScene(scene, light);

    const groundMat = createStandardMaterial();
    groundMat.diffuseColor = [0.2, 0.24, 0.28];
    groundMat.specularColor = [0.1, 0.1, 0.1];
    const ground = createGround(engine, { width: 60, height: 40 });
    ground.name = "ground";
    ground.material = groundMat;
    ground.position.set(0, -1, 0);
    addToScene(scene, ground);
    const groundAggregate = createPhysicsAggregate(
      world,
      ground,
      physicsShapeTypes.BOX,
      { mass: 0 },
    );
    this.entries.push({
      mesh: ground,
      body: groundAggregate.body,
      kind: "BOX",
      mass: 0,
    });
    this.bodies.push(groundAggregate.body);

    const groupOrigins = Array.from({ length: 26 }, () => ({
      x: Math.random() * 16,
      y: Math.random() * 16,
      z: Math.random() * 16,
    }));
    for (let i = 0; i < groupOrigins.length; i++) {
      const { mesh, body, kind, mass } = spawnObjectLite(
        engine,
        scene,
        world,
        i,
        groupOrigins[i],
      );
      this.bodies.push(body);
      this.entries.push({ mesh, body, kind, mass });
    }

    await registerScene(scene);
    if (this.cancelled) return;
    await startEngine(engine);
  }

  private sampleFps(): void {
    const now = performance.now();
    if (this.fpsWindowStart === 0) this.fpsWindowStart = now;
    this.frameCount++;
    if (now - this.fpsWindowStart >= 500) {
      this.fps = (this.frameCount * 1000) / (now - this.fpsWindowStart);
      this.frameCount = 0;
      this.fpsWindowStart = now;
    }
  }

  getSnapshot(): EngineSceneSnapshot {
    const scene = this.scene;
    if (!scene) {
      return {
        ready: false,
        fps: this.fps,
        meshCount: 0,
        bodyCount: 0,
        gravity: { ...this.gravity },
        camera: null,
        meshes: [],
      };
    }
    const camera = scene.camera as ArcRotateCamera | null;
    const cameraInfo = camera
      ? {
        alpha: camera.alpha,
        beta: camera.beta,
        radius: camera.radius,
        target: { x: camera.target.x, y: camera.target.y, z: camera.target.z },
        eye: {
          x: camera.target.x + camera.radius * Math.sin(camera.alpha) * Math.cos(camera.beta),
          y: camera.target.y + camera.radius * Math.sin(camera.beta),
          z: camera.target.z + camera.radius * Math.cos(camera.alpha) * Math.cos(camera.beta),
        },
      }
      : null;
    const meshes = this.entries.map(({ mesh, body, kind, mass }) => {
      const velocity = this.world
        ? getPhysicsBodyLinearVelocity(this.world, body)
        : null;
      const diffuse = (mesh.material as StandardMaterialProps | null)?.diffuseColor ?? null;
      return {
        name: mesh.name ?? "unnamed",
        kind,
        mass,
        position: { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z },
        rotation: { x: mesh.rotation.x, y: mesh.rotation.y, z: mesh.rotation.z },
        scaling: { x: mesh.scaling.x, y: mesh.scaling.y, z: mesh.scaling.z },
        diffuse,
        velocity: velocity
          ? { x: velocity.x, y: velocity.y, z: velocity.z }
          : null,
      };
    });
    return {
      ready: true,
      fps: this.fps,
      meshCount: meshes.length,
      bodyCount: this.bodies.length,
      gravity: { ...this.gravity },
      camera: cameraInfo,
      meshes,
    };
  }

  dispose(): void {
    this.cancelled = true;
    if (this.world) {
      disposePhysics(this.world);
      this.world = null;
    }
    this.detachControl?.();
    this.detachControl = null;
    if (this.scene) {
      disposeScene(this.scene);
      this.scene = null;
    }
    if (this.engine) {
      stopEngine(this.engine);
      disposeEngine(this.engine);
      this.engine = null;
    }
    this.bodies = [];
    this.entries = [];
  }
}