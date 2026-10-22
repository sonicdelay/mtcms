---
name: babylon-engine
description: Build and wire 3D content into this repo's Babylon.js engine view (client/src/routes/engine/) — adding meshes, materials, particle effects, and flow-graph interactions, including bringing in assets authored in the Babylon graph editors over MCP. Use when the task touches the engine scene, the physics world, the scene inspector, or any @babylonjs/lite render code and havok physic engine.
---

# Babylon engine view

The 3D view lives in `client/src/routes/engine/` and runs on
**`@babylonjs/lite`** — a functional API, not the classic Babylon class API.
`ai/rules/babylon-engine.md` holds the hard constraints. This skill is the
procedure for changing the scene.

## What I do

Wire new 3D content into the scene correctly the first time: pick the right
creation path, register the object so the inspector and the per-frame loop can
see it, attach physics, and tear it down.

## When to use me

Any change under `client/src/routes/engine/`, or any task that adds a mesh,
material, particle effect, light, camera, or interaction to the 3D view.

Do **not** use me for Blender work — that is the `blender` MCP server.

## The loop

1. **Read first.** `engine-scene-lite-controller.ts` and
   `scene-objects-lite.ts` are the whole picture. Follow their shape; do not
   introduce a second way to own a mesh.
2. **Create.** Use the `create*` helpers from `@babylonjs/lite`.
3. **Add.** `addToScene(scene, node)`. This is not optional and it fails
   silently — the object exists but never renders.
4. **Register.** Push to the controller's `entries` (and `bodies` if it has
   physics). An unregistered mesh is invisible to `getSnapshot()` and to
   `respawnEscaped()`.
5. **Attach physics** if it should collide. `createPhysicsAggregate(world, mesh,
shape, { mass })` for primitives; mass `0` is static. `CONVEX_HULL` needs the
   explicit shape path.
6. **Check the render loop.** New per-frame work goes in `onBeforeRender`.
   Nothing inside it may allocate.

## Bring in an asset from the graph editors

The `nme` (materials), `npe` (particles), and `flow-graph` (visual scripting)
MCP servers author graphs and export JSON. `lite` can load that JSON directly —
`options.json` bypasses the snippet server, so the graph never needs uploading:

| Graph      | Load with                                                                |
| ---------- | ------------------------------------------------------------------------ |
| Material   | `parseNodeMaterialFromSnippet(engine, "", { json })`                     |
| Particles  | `parseNodeParticleSetFromSnippet(engine, scene, "", { json })`           |
| Flow graph | `parseFlowGraphEditorJson(json)` then `addFlowGraphEditorJson(scene, …)` |

Both parse functions are **async** and follow the `cancelled`-check pattern in
`init`. A parse that resolves after unmount must dispose what it built.

The other four graph types the MCP package ships — geometry, GUI, render graph,
smart filters — have **no loader in `@babylonjs/lite`**. Do not claim to wire
them in; export them only if the output has a consumer elsewhere.

## Modeled assets

`loadGltf(engine, source)` and `loadBabylon(engine, url, options)` return an
`AssetContainer`. Reuse the `ObjectFactory` shape in `scene-objects-lite.ts`
rather than loading per frame, and prefer `loadBabylon`'s `maxMeshes` limit when
the file is not authored in this repo.

## Before you call it done

- Every created node got its `addToScene` and its `entries` push.
- Physics bodies are in `bodies` so `disposePhysics` reaches them.
- New async work checks `cancelled` after each `await`.
- New per-frame code allocates nothing.
- `client/npm run typecheck` passes.
