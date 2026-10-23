# Blender character generator

`build_mpfb_girl.py` builds the playable character used by the Babylon.js
engine view: an 11-year-old athletic low-poly girl, rigged with a Mixamo
skeleton and skinned to a single 2048×2048 diffuse texture.

Everything runs **headless**. Do not drive this through the Blender MCP
server — that path was tried and is unreliable for scripted builds.

## Prerequisites

| Requirement    | Version / value                                                        |
| -------------- | ---------------------------------------------------------------------- |
| Blender        | 5.2 LTS (`5.2.2` was used)                                             |
| MPFB add-on    | `2.0.18`, installed as the extension `bl_ext.user_default.mpfb`        |
| MPFB user data | root configured in _Edit → Preferences → Add-ons → MPFB_               |
| Skin asset     | `saltycowdawg_genuine_caucasian_female_with_genitals.mhmat` in `skins` |
| Proxy mesh     | `proxy741.proxy` in `proxymeshes`                                      |

MPFB resolves both assets through `AssetService.find_asset_absolute_path`,
so the add-on's own user-data root has to point at a folder that actually
contains them (here: `C:\Users\<you>\Downloads\MPFB`).

## Usage

```powershell
& "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" `
    -b -P scripts/blender/build_mpfb_girl.py
```

Arguments after `--` are passed to the script:

```powershell
blender -b -P scripts/blender/build_mpfb_girl.py -- --nopose
```

| Flag       | Effect                                                                                                  |
| ---------- | ------------------------------------------------------------------------------------------------------- |
| _(none)_   | Straighten the arms into a true A-pose and bake it as the rest pose.                                    |
| `--nopose` | Keep MPFB's default rest pose. Only useful for comparing poses — the shipped character uses the A-pose. |

Output is written next to the other client assets, resolved relative to this
file so the script works from any working directory:

```
client/public/assets/
  proxy741_g11_athletic.blend
  proxy741_g11_athletic.glb
  proxy741_g11_athletic_preview.png
```

The run prints `[BUILD] BUILD_OK` on success and `[BUILD] BUILD_FAILED` after
a traceback on failure. Blender exits `0` even when a `-P` script raises
unless you ask otherwise, so for CI add `--python-exit-code 1` and/or grep the
log for the marker instead of trusting the exit status.

## What the script does

1. **Clean scene** — removes every object, then purges orphaned meshes,
   armatures, materials, images, node groups and actions.
2. **Build the human** — `HumanService.deserialize_from_dict` with a
   hand-authored phenotype dict and the `mixamo` rig. The rig is created
   _before_ the proxy on purpose: the proxy inherits interpolated weights
   from the MPFB basemesh, so it must exist when the proxy is generated.
3. **Normalize weights** — `vertex_group_normalize_all` so every vertex's
   weights sum to exactly `1.0`. glTF skinning expects normalized weights;
   MPFB's proxy transfer does not guarantee them.
4. **Fix and bake the pose** — MPFB's rest pose has horizontal upper arms but
   roughly 45° bent elbows. `aim_bone` rotates `LeftArm/ForeArm/Hand` and the
   right-side mirrors about the bone head until each bone's local Y axis
   points along world ±X, then `RigService.apply_pose_as_rest_pose` bakes the
   result. The bind pose therefore _is_ the A-pose, which keeps Mixamo
   retargeting correct.
5. **Drop the basemesh** — the ~19k-vert MPFB basemesh is deleted; the
   deliverable is the 741-vert proxy. They are not two LODs, just the sculpt
   and its decimation.
6. **Tune the material** — opaque, backface-culled skin. Blender derives
   `blend_method` from the shader and refuses `OPAQUE` when subsurface is
   present, so `patch_glb` rewrites the exported JSON afterwards to force
   `alphaMode: OPAQUE` and `doubleSided: false`. Without that the GLB ships
   as `BLEND`/double-sided and the character renders with sorting artifacts
   and visible backfaces.
7. **Pack textures** — `bpy.ops.file.pack_all()` embeds the diffuse and SSS
   maps in the `.blend` so it is self-contained. The GLB embeds its own copy.
8. **Save, export, render** — saves the `.blend`, exports a selected-only GLB
   (no animations, no modifier apply), then renders an 800×1000 front view
   with a three-point-ish key/fill setup and prints an objective analysis of
   the result (`analyze_render`): subject coverage, bounding box, mean RGB,
   percentage of skin-toned pixels, frame-edge clipping, and per-height
   silhouette widths.

## Phenotype

MPFB's macro sliders are normalized so `0.1875` is a child and `0.5` a young
adult; `muscle` `0.5` is average and `1.0` is maximum.

| Slider     | Value         | Why                             |
| ---------- | ------------- | ------------------------------- |
| `gender`   | 1.0           | female                          |
| `age`      | 0.33          | child, ~11 years                |
| `muscle`   | 0.8           | athletic, not bodybuilder       |
| `weight`   | 0.45          | lean                            |
| `height`   | 0.38          | child stature                   |
| `cupsize`  | 0.1           | pre-pubescent                   |
| `firmness` | 0.9           | —                               |
| `race`     | caucasian 1.0 | matches the chosen skin texture |

Hair, eyes, teeth, tongue and clothes are all disabled (`""` / `[]`) because
the deliverable is a bare body for a 3D game view, not a portrait.

## Expected results

A correct run produces:

- `proxy741` mesh, **741 verts / 730 faces / 1460 tris**, `UVMap` present.
- **52 bones**, all named `mixamorig:*`, no leftover MPFB bones.
- Bounds roughly `(-0.742, -0.175, -0.001)` to `(0.741, 0.072, 1.462)` —
  **1.463 m tall**, ~1.48 m arm span.
- `LeftArm` direction `(1.000, 0.000, 0.000)`, `RightArm` `(-1.000, 0.000, 0.000)`
  — i.e. 0° off horizontal.
- One material, `Skin_saltycowdawg_genuine_caucasian_female_with_genitals`,
  with both textures packed.

Verifying an existing build without rebuilding:

```powershell
blender -b client/public/assets/proxy741_g11_athletic.blend -P check.py
```

where `check.py` prints vertex/face counts, bone names, per-vertex weight sums,
material image paths, and bounds. Do not open the `.glb` in Blender to verify
it — parse the JSON chunk instead, since Blender re-derives material flags on
import and hides export bugs.

## Gotchas

- Blender writes `proxy741_g11_athletic.blend1` on every save. It is not
  cleaned up automatically; delete it before committing.
- `--nopose` skips weight normalization too, because both live in the same
  branch. That is intentional (unposed output is debug-only), but surprising
  if you were expecting it to only skip the pose.
- The exporter signature differs across Blender versions; the script falls
  back to a bare call if `export_apply`/`export_animations` are rejected.
- `patch_glb` re-serializes the JSON chunk and re-pads it. It preserves chunk
  order and recomputes the total length, so the result stays valid glTF.
