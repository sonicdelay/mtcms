# Babylon.js engine view rules

Scope: `client/src/routes/engine/`. The 3D view uses **`@babylonjs/lite`**, a
functional API, not the classic Babylon class API. Code pasted from Babylon
docs or examples almost always assumes the class API and will not compile here.

## The API is functional

There is no `new Engine(...)`, `new Scene(...)`, `mesh.dispose()`, or
`scene.onBeforeRenderObservable`. Use the exported functions:

| Need              | Here                                                         |
| ----------------- | ------------------------------------------------------------ |
| Engine            | `await createEngine(canvas)`                                 |
| Scene             | `createSceneContext(engine)`                                 |
| Start / stop loop | `await startEngine(engine)` / `stopEngine(engine)`           |
| Per-frame work    | `onBeforeRender(scene, (deltaMs) => …)`                      |
| Put an object in  | `addToScene(scene, node)`                                    |
| Register scene    | `await registerScene(scene)`                                 |
| Teardown          | `disposePhysics`, `disposeScene`, `disposeEngine`            |
| Material          | `createStandardMaterial()` returning `StandardMaterialProps` |

`createArcRotateCamera`, `createGround`, `createBox`, `createSphere` and the
other `create*` helpers **do not add themselves to the scene**. Every created
camera, light, and mesh needs its own `addToScene(scene, node)`; forgetting it
produces an object that exists but never renders, with no error.

`createEngine` requires **WebGPU**. The controller throws when `navigator.gpu`
is absent, so feature-detect before assuming the view can start.

## Physics

Havok is loaded from WASM and must be awaited before any body exists:

```ts
const wasm = await (await fetch(HavokWasmUrl)).arrayBuffer();
const havok = await HavokPhysics({ wasmBinary: wasm });
const world = createHavokWorld(scene, havok, gravity);
```

`HavokWasmUrl` is imported with Vite's `?url` suffix. Do not rewrite that import
to a bare package path — it resolves to a file the bundler has to emit.

Attach with `createPhysicsAggregate(world, mesh, shape, { mass })`. Mass `0` is
static (the ground). `CONVEX_HULL` is not supported by the aggregate helper and
needs the explicit shape path in `scene-objects-lite.ts`:
`createPhysicsShape` → `createPhysicsBody` → `setPhysicsBodyShape`.

## Lifecycle

`EngineSceneController` owns everything: engine, scene, physics world, spawned
entries, camera control handle. Follow its shape for new state:

- `async init(canvas)` builds; every `await` is followed by a `cancelled` check
  because React can unmount mid-load. A late check disposes what was built.
- `dispose()` tears down in order: physics → detach control → scene → engine.
  Keep that order; disposing the engine first leaves the world and the control
  handle pointing at dead objects.
- Instances are disposed from the React effect cleanup, never from render.

## Per-frame work

Everything inside `onBeforeRender` runs every frame. It must not allocate
objects, build arrays, read the DOM, log, or look meshes up by name. Resolve
once in `init` and close over the result.

`respawnEscaped()` currently walks every entry each frame. Adding more spawned
objects multiplies that cost directly — prefer a dirty flag or an event over a
wider scan.

## Types

`MeshSnapshot` and `EngineSceneSnapshot` live beside the controller in
`engine-scene-lite-controller.ts`, and the inspector consumes that shape. New
engine snapshot types follow that pattern so the inspector panel and the
controller stay in one place; general feature types still belong in
`client/src/models/*` per `code-guideline.md`.

## Inspecting a running scene

`getSnapshot()` is the read model for the inspector panel. Add new observable
values there rather than reaching into the controller from a component.
