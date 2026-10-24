"""Build an 11-year-old athletic low-poly girl with the MPFB add-on.

Outputs into  <repo>/client/public/assets/:
  proxy741_g11_athletic.blend          (packed textures, A-pose baked as rest)
  proxy741_g11_athletic.glb            (game export for Babylon.js loadGltf)
  proxy741_g11_athletic_preview.png    (front render)

Prerequisites
  Blender 5.2 LTS with the MPFB extension installed (either as
  bl_ext.blender_org.mpfb or bl_ext.user_default.mpfb), and MPFB user data
  containing:
    - skin  saltycowdawg_genuine_caucasian_female_with_genitals.mhmat
    - proxy proxy741.proxy
  (MPFB user data root is set in Edit > Preferences > Add-ons > MPFB.)

Run headless:
  blender -b -P scripts/blender/build_mpfb_girl.py -- [--nopose]

  --nopose  keep the MPFB rest pose instead of straightening the arms into
            a true A-pose (arms horizontal, elbows straight) and baking it.
"""

import bpy
import math
import os
import sys
import traceback

from mathutils import Matrix, Vector


def mpfb_services():
    """Return MPFB's ``services`` package for either extension repository name."""
    import importlib

    errors = []
    for package in ("bl_ext.blender_org.mpfb", "bl_ext.user_default.mpfb"):
        try:
            return importlib.import_module(package + ".services")
        except ImportError as exc:
            errors.append("%s (%s)" % (package, exc))
    raise ImportError("MPFB add-on not found; tried: " + ", ".join(errors))


# <repo>/client/public/assets, resolved from this file so the script is portable.
OUT_DIR = os.path.abspath(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "client", "public", "assets")
)
BASE = "proxy741_g11_athletic"
BLEND_PATH = os.path.join(OUT_DIR, BASE + ".blend")
GLB_PATH = os.path.join(OUT_DIR, BASE + ".glb")
PNG_PATH = os.path.join(OUT_DIR, BASE + "_preview.png")

ARGS = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
FIX_POSE = "--nopose" not in ARGS

SKIN = "saltycowdawg_genuine_caucasian_female_with_genitals.mhmat"
PROXY = "proxy741.proxy"

# 11 yo girl, athletic, caucasian.  Macro scale: 0.1875 = child, 0.5 = young adult.
PHENOTYPE = {
    "gender": 1.0,
    "age": 0.33,
    "muscle": 0.8,
    "weight": 0.45,
    "proportions": 0.5,
    "height": 0.38,
    "cupsize": 0.1,
    "firmness": 0.9,
    "race": {"asian": 0.0, "caucasian": 1.0, "african": 0.0},
}


def log(*args):
    print("[BUILD]", *args)
    sys.stdout.flush()


# --------------------------------------------------------------------------- scene


def clean_scene():
    for ob in list(bpy.data.objects):
        bpy.data.objects.remove(ob, do_unlink=True)
    purge()


def purge():
    for _ in range(4):
        changed = False
        for coll in (
            bpy.data.meshes,
            bpy.data.armatures,
            bpy.data.materials,
            bpy.data.images,
            bpy.data.node_groups,
            bpy.data.actions,
        ):
            for block in list(coll):
                if block.users == 0 and not getattr(block, "use_fake_user", False):
                    coll.remove(block)
                    changed = True
        if not changed:
            break


# --------------------------------------------------------------------------- helpers


def obj_type(ob):
    ObjectService = mpfb_services().ObjectService

    try:
        return ObjectService.get_object_type(ob)
    except Exception:
        return None


def objects_of_type(kind):
    return [ob for ob in bpy.data.objects if obj_type(ob) == kind]


def verts(ob):
    return len(ob.data.vertices) if ob.type == "MESH" else 0


def iter_images(node_tree, seen):
    for node in node_tree.nodes:
        if node.type == "TEX_IMAGE" and node.image:
            path = bpy.path.abspath(node.image.filepath)
            yield node.image, path
        if node.type == "GROUP" and node.node_tree and node.node_tree.name not in seen:
            seen.add(node.node_tree.name)
            for item in iter_images(node.node_tree, seen):
                yield item


def pack_textures():
    """Embed all textures in the .blend so it is self-contained."""
    try:
        bpy.ops.file.pack_all()
        log("packed textures into the .blend")
    except Exception as exc:
        log("pack_all failed:", repr(exc))
    for image in bpy.data.images:
        if image.source == "FILE" and image.filepath:
            log(
                "image:",
                image.name,
                "packed:",
                bool(image.packed_file),
                "bytes:",
                image.packed_file.size if image.packed_file else 0,
            )


def analyze_render():
    """Objective check that the render shows a lit, skin-textured body."""
    import numpy as np

    img = bpy.data.images.load(PNG_PATH)
    w, h = img.size
    buf = np.empty(w * h * 4, dtype=np.float32)
    img.pixels.foreach_get(buf)
    px = buf.reshape(h, w, 4)[:, :, :3]

    bg = px[0, 0].copy()
    log("background rgb: %.3f %.3f %.3f" % tuple(bg))
    diff = np.abs(px - bg).max(axis=2)
    mask = diff > 0.04
    count = int(mask.sum())
    log("render:", w, "x", h, "subject pixels:", count, "(%.1f%%)" % (100.0 * count / (w * h)))
    if count == 0:
        return

    ys, xs = np.nonzero(mask)
    log(
        "subject bbox px: x",
        int(xs.min()),
        "-",
        int(xs.max()),
        " y",
        int(ys.min()),
        "-",
        int(ys.max()),
    )
    mean = px[mask].mean(axis=0)
    log("subject mean rgb: %.3f %.3f %.3f" % tuple(mean))
    r, g, b = px[:, :, 0], px[:, :, 1], px[:, :, 2]
    skin = mask & (r > 0.15) & (r > g + 0.01) & (g > b - 0.05)
    log("skin-toned: %.1f%% of subject" % (100.0 * float(skin.sum()) / count))
    log(
        "subject touches frame edge:",
        bool(xs.min() <= 0 or xs.max() >= w - 1 or ys.min() <= 0 or ys.max() >= h - 1),
    )

    # exact per-row silhouette width (pixel rows are bottom-up)
    present = mask.any(axis=1)
    first = np.argmax(mask, axis=1)
    last = w - 1 - np.argmax(mask[:, ::-1], axis=1)
    widths = np.where(present, last - first, 0)
    widest_row = int(np.argmax(widths))
    z_frac = (widest_row - ys.min()) / float(ys.max() - ys.min())
    log(
        "widest row %d (%.2f of height from feet): %d px" % (widest_row, z_frac, int(widths[widest_row]))
    )
    for frac in (0.95, 0.85, 0.75, 0.5, 0.25, 0.05):
        row = int(round(ys.min() + frac * (ys.max() - ys.min())))
        log("  height %.0f%%: width %d px" % (frac * 100, int(widths[row])))


def bone_world_dir(arm, name):
    pb = arm.pose.bones[name]
    head = arm.matrix_world @ pb.head
    tail = arm.matrix_world @ pb.tail
    return (tail - head).normalized()


def angle_from_horizontal(arm, name):
    d = bone_world_dir(arm, name)
    horiz = Vector((d.x, 0.0, d.z)).normalized() if Vector((d.x, 0.0, d.z)).length else d
    return math.degrees(d.angle(horiz))


def aim_bone(arm, name, target_world):
    """Rotate a pose bone about its head so its Y axis points along target_world."""
    pb = arm.pose.bones[name]
    m = pb.matrix.copy()
    loc, rot, scale = m.decompose()
    rot3 = rot.to_matrix()
    cur = (rot3 @ Vector((0.0, 1.0, 0.0))).normalized()

    local = arm.matrix_world.inverted().to_3x3() @ Vector(target_world)
    target = local.normalized()

    axis = cur.cross(target)
    if axis.length < 1e-8:
        return 0.0
    axis.normalize()
    ang = cur.angle(target)
    r = Matrix.Rotation(ang, 3, axis)

    new3 = r @ rot3 @ Matrix.Diagonal(scale)
    pb.matrix = Matrix.Translation(loc) @ new3.to_4x4()
    bpy.context.view_layer.update()
    return math.degrees(ang)


# --------------------------------------------------------------------------- build


def build():
    HumanService = mpfb_services().HumanService

    human_info = HumanService._create_default_human_info_dict()
    human_info["name"] = BASE
    human_info["phenotype"] = dict(PHENOTYPE)
    human_info["rig"] = "mixamo"
    human_info["proxy"] = PROXY
    human_info["skin_mhmat"] = SKIN
    human_info["skin_material_type"] = "ENHANCED_SSS"
    human_info["clothes"] = []
    for part in ("eyes", "eyebrows", "eyelashes", "tongue", "teeth", "hair"):
        human_info[part] = ""
    human_info["material_instances"] = "ENHANCED"

    settings = HumanService.get_default_deserialization_settings()
    settings["load_clothes"] = False
    settings["subdiv_levels"] = 0
    settings["material_instances"] = "NEVER"

    log("building human ...")
    basemesh = HumanService.deserialize_from_dict(human_info, settings)
    log("basemesh:", basemesh.name, verts(basemesh), "verts")
    return basemesh


def tune_material(mat):
    """Opaque, backface-culled skin material (avoids glTF alphaMode BLEND)."""
    for attr, value in (
        ("blend_method", "OPAQUE"),
        ("shadow_method", "OPAQUE"),
        ("surface_render_method", "DITHERED"),
    ):
        if hasattr(mat, attr):
            try:
                setattr(mat, attr, value)
            except Exception as exc:
                log("could not set", attr, repr(exc))
    mat.use_backface_culling = True
    mat.show_transparent_back = False
    log(
        "material tuned: blend_method=%s surface_render_method=%s backface_culling=%s"
        % (
            getattr(mat, "blend_method", "n/a"),
            getattr(mat, "surface_render_method", "n/a"),
            mat.use_backface_culling,
        )
    )


def normalize_weights(mesh):
    """Make every vertex's bone weights sum to 1.0 (clean glTF skin data)."""
    bpy.ops.object.select_all(action="DESELECT")
    mesh.select_set(True)
    bpy.context.view_layer.objects.active = mesh
    if bpy.context.object.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")
    bpy.ops.object.vertex_group_normalize_all(group_select_mode="ALL", lock_active=False)
    sums = [sum(g.weight for g in v.groups) for v in mesh.data.vertices]
    log(
        "normalized weights: min %.3f max %.3f, unweighted %d"
        % (min(sums), max(sums), sum(1 for v in mesh.data.vertices if not v.groups))
    )


def fix_pose(arm):
    """Straighten both arms horizontally to the sides (A-pose)."""
    report = []
    for side, sign in (("Left", 1.0), ("Right", -1.0)):
        target = (sign, 0.0, 0.0)
        for bone in ("Arm", "ForeArm", "Hand"):
            name = "mixamorig:%s%s" % (side, bone)
            if name not in arm.pose.bones:
                report.append("%s: MISSING" % name)
                continue
            before = angle_from_horizontal(arm, name)
            turned = aim_bone(arm, name, target)
            after = angle_from_horizontal(arm, name)
            report.append("%s: %.1fdeg -> %.1fdeg (rotated %.1f)" % (name, before, after, turned))
    return report


def patch_glb():
    """Force opaque, single-sided materials in the exported GLB."""
    import json
    import struct

    with open(GLB_PATH, "rb") as handle:
        data = handle.read()
    _magic, _version, total = struct.unpack("<4sII", data[:12])
    off = 12
    chunks = []
    while off < total:
        clen, ctype = struct.unpack("<II", data[off : off + 8])
        chunks.append((ctype, data[off + 8 : off + 8 + clen]))
        off += 8 + clen

    rebuilt = []
    for ctype, payload in chunks:
        if ctype == 0x4E4F534A:  # JSON
            js = json.loads(payload.decode("utf-8"))
            for mat in js.get("materials", []):
                mat["alphaMode"] = "OPAQUE"
                mat["doubleSided"] = False
            payload = json.dumps(js, separators=(",", ":")).encode("utf-8")
            payload += b" " * ((4 - len(payload) % 4) % 4)
        rebuilt.append((ctype, payload))

    body = b"".join(struct.pack("<II", len(p), t) + p for t, p in rebuilt)
    with open(GLB_PATH, "wb") as handle:
        handle.write(struct.pack("<4sII", b"glTF", 2, 12 + len(body)) + body)
    log("patched GLB materials to opaque/single-sided")


def save_and_export(arm, mesh):
    bpy.ops.wm.save_as_mainfile(filepath=BLEND_PATH)
    log("saved", BLEND_PATH, os.path.getsize(BLEND_PATH), "bytes")

    bpy.ops.object.select_all(action="DESELECT")
    mesh.select_set(True)
    arm.select_set(True)
    bpy.context.view_layer.objects.active = arm
    try:
        bpy.ops.export_scene.gltf(
            filepath=GLB_PATH,
            export_format="GLB",
            use_selection=True,
            export_animations=False,
            export_apply=False,
        )
    except TypeError:
        bpy.ops.export_scene.gltf(filepath=GLB_PATH, export_format="GLB", use_selection=True)
    log("exported", GLB_PATH, os.path.getsize(GLB_PATH), "bytes")
    patch_glb()
    log("final glb", os.path.getsize(GLB_PATH), "bytes")


def add_render_kit(low, high):
    scene = bpy.context.scene
    for engine in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE", "BLENDER_WORKBENCH"):
        try:
            scene.render.engine = engine
            break
        except Exception:
            continue
    log("render engine:", scene.render.engine)

    res_x, res_y = 800, 1000
    scene.render.resolution_x = res_x
    scene.render.resolution_y = res_y
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = PNG_PATH

    world = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs[0].default_value = (0.05, 0.05, 0.06, 1.0)
        bg.inputs[1].default_value = 1.0

    lens, sensor = 50.0, 36.0
    span_x = high.x - low.x
    span_z = high.z - low.z
    dist = max(
        span_z * 1.18 * lens / sensor,
        span_x * 1.12 * lens * res_y / (res_x * sensor),
    )
    cam_z = (low.z + high.z) / 2.0
    log("camera distance %.2f m, lens %.0fmm, aim z %.2f" % (dist, lens, cam_z))

    cam_data = bpy.data.cameras.new("PreviewCam")
    cam_data.lens = lens
    cam_data.sensor_width = sensor
    cam = bpy.data.objects.new("PreviewCam", cam_data)
    scene.collection.objects.link(cam)
    cam.location = (0.0, -dist, cam_z)
    cam.rotation_euler = (math.radians(90), 0.0, 0.0)
    scene.camera = cam

    key = bpy.data.lights.new("Key", type="AREA")
    key.energy = 400
    key.size = 3.0
    key_ob = bpy.data.objects.new("Key", key)
    key_ob.location = (-2.0, -2.5, high.z + 1.0)
    key_ob.rotation_euler = (math.radians(55), 0.0, math.radians(-35))
    scene.collection.objects.link(key_ob)

    fill = bpy.data.lights.new("Fill", type="AREA")
    fill.energy = 150
    fill.size = 3.0
    fill_ob = bpy.data.objects.new("Fill", fill)
    fill_ob.location = (2.5, -2.0, high.z * 0.8)
    fill_ob.rotation_euler = (math.radians(75), 0.0, math.radians(50))
    scene.collection.objects.link(fill_ob)


def mesh_bounds(mesh):
    bpy.context.view_layer.update()
    low = Vector((1e9, 1e9, 1e9))
    high = Vector((-1e9, -1e9, -1e9))
    for corner in mesh.bound_box:
        w = mesh.matrix_world @ Vector(corner)
        low = Vector((min(low[i], w[i]) for i in range(3)))
        high = Vector((max(high[i], w[i]) for i in range(3)))
    return low, high


def render_preview():
    bpy.ops.render.render(write_still=True)
    log("rendered", PNG_PATH, os.path.getsize(PNG_PATH), "bytes")


# --------------------------------------------------------------------------- main


def main():
    RigService = mpfb_services().RigService

    clean_scene()
    basemesh = build()

    armatures = objects_of_type("Skeleton")
    proxies = objects_of_type("Proxymeshes")
    log("armatures:", [ob.name for ob in armatures])
    log("proxies:", [(ob.name, verts(ob)) for ob in proxies])

    if not armatures:
        raise RuntimeError("no armature was created")
    if not proxies:
        raise RuntimeError("no proxy was created")

    arm = armatures[0]
    mesh = proxies[0]

    log("armature:", arm.name, "bones:", len(arm.data.bones))
    log("proxy:", mesh.name, verts(mesh), "verts,", len(mesh.data.polygons), "faces")
    log("proxy uv layers:", [uv.name for uv in mesh.data.uv_layers])
    log("proxy modifiers:", [(m.name, m.type) for m in mesh.modifiers])
    log("proxy vertex groups:", len(mesh.vertex_groups))
    log("unweighted verts:", sum(1 for v in mesh.data.vertices if not v.groups))
    log("proxy materials:", [m.name if m else None for m in mesh.data.materials])

    for mat in mesh.data.materials:
        if not mat:
            continue
        log("material:", repr(mat.name), "use_nodes:", mat.use_nodes)
        if not mat.use_nodes:
            continue
        types = sorted({n.type for n in mat.node_tree.nodes})
        log("material node types:", types)
        for image, path in iter_images(mat.node_tree, set()):
            log("texture:", image.name, "->", path, "exists:", os.path.exists(path))

    if FIX_POSE:
        normalize_weights(mesh)
        for line in fix_pose(arm):
            log("pose", line)

        # Bake the A-pose into the rest pose so the bind pose is the A-pose.
        bpy.context.view_layer.objects.active = arm
        RigService.apply_pose_as_rest_pose(arm)
        log("baked pose as rest pose")

    for side in ("Left", "Right"):
        for bone in ("Arm", "ForeArm"):
            name = "mixamorig:%s%s" % (side, bone)
            if name in arm.pose.bones:
                d = bone_world_dir(arm, name)
                log(
                    "final %s dir (%.3f, %.3f, %.3f) off-horizontal %.2f deg"
                    % (name, d.x, d.y, d.z, angle_from_horizontal(arm, name))
                )

    # Drop the 19k-vert MPFB basemesh: the deliverable is the 741-vert proxy.
    if basemesh and basemesh.name in bpy.data.objects:
        bpy.data.objects.remove(basemesh, do_unlink=True)
        log("removed basemesh, objects now:", [ob.name for ob in bpy.data.objects])

    mesh.name = "proxy741"
    mesh.data.name = "proxy741"
    arm.name = "Armature"
    arm.data.name = "Armature"
    for mat in mesh.data.materials:
        if mat:
            mat.name = "Skin_saltycowdawg_genuine_caucasian_female_with_genitals"
            tune_material(mat)

    pack_textures()
    purge()

    low, high = mesh_bounds(mesh)
    log(
        "bbox low",
        tuple(round(v, 3) for v in low),
        "high",
        tuple(round(v, 3) for v in high),
    )
    log("height %.3f m" % (high.z - low.z))
    add_render_kit(low, high)

    save_and_export(arm, mesh)
    render_preview()
    analyze_render()

    log("objects:", [(ob.name, ob.type, verts(ob)) for ob in bpy.data.objects])
    log("BUILD_OK")


try:
    main()
except Exception:
    traceback.print_exc()
    sys.stdout.flush()
    print("[BUILD] BUILD_FAILED")
    sys.stdout.flush()
