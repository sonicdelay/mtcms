"use client";

import { useEffect, useRef } from "react";
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

export default function EngineScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let engine: Engine | null = null;
    let scene: Scene | null = null;

    const init = async () => {
      const eng = new Engine(canvas, true, {
        preserveDrawingBuffer: true,
        stencil: true,
      });
      engine = eng;
      const scn = new Scene(eng);
      scene = scn;
      scn.clearColor = new Color4(0.07, 0.08, 0.1, 1);

      const havok = await HavokPhysics();
      scn.enablePhysics(new Vector3(0, -9.81, 0), new HavokPlugin(true, havok));

      const camera = new ArcRotateCamera(
        "camera",
        -Math.PI / 3,
        Math.PI / 3.2,
        12,
        Vector3.Zero(),
        scn,
      );
      camera.attachControl(canvas, true);
      camera.lowerRadiusLimit = 5;
      camera.upperRadiusLimit = 30;

      const autoRotation = new AutoRotationBehavior();
      autoRotation.idleRotationSpeed = 2;
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
        { width: 40, height: 40 },
        scn,
      );
      ground.material = groundMat;
      ground.position.y = -1;
      new PhysicsAggregate(ground, PhysicsShapeType.BOX, { mass: 0 }, scn);

      const box = MeshBuilder.CreateBox("box", { size: 1.4 }, scn);
      box.position = new Vector3(-2.5, 3, 0);
      const boxMat = new StandardMaterial("boxMat", scn);
      boxMat.diffuseColor = new Color3(0.95, 0.55, 0.2);
      box.material = boxMat;
      new PhysicsAggregate(box, PhysicsShapeType.BOX, { mass: 2 }, scn);

      const sphere = MeshBuilder.CreateSphere(
        "sphere",
        { diameter: 1.6, segments: 32 },
        scn,
      );
      sphere.position = new Vector3(0, 4, 0);
      const sphereMat = new StandardMaterial("sphereMat", scn);
      sphereMat.diffuseColor = new Color3(0.15, 0.6, 0.95);
      sphere.material = sphereMat;
      new PhysicsAggregate(sphere, PhysicsShapeType.SPHERE, { mass: 1 }, scn);

      const cylinder = MeshBuilder.CreateCylinder(
        "cylinder",
        {
          height: 2.2,
          diameterTop: 1.1,
          diameterBottom: 1.1,
          tessellation: 32,
        },
        scn,
      );
      cylinder.position = new Vector3(2.5, 5, 0);
      const cylinderMat = new StandardMaterial("cylinderMat", scn);
      cylinderMat.diffuseColor = new Color3(0.4, 0.85, 0.4);
      cylinder.material = cylinderMat;
      new PhysicsAggregate(
        cylinder,
        PhysicsShapeType.CYLINDER,
        { mass: 3 },
        scn,
      );

      const capsule = MeshBuilder.CreateCapsule(
        "capsule",
        { radius: 0.55, height: 1.8, tessellation: 24 },
        scn,
      );
      capsule.position = new Vector3(-4, 4, 1.5);
      capsule.rotation.z = Math.PI / 2;
      const capsuleMat = new StandardMaterial("capsuleMat", scn);
      capsuleMat.diffuseColor = new Color3(0.85, 0.35, 0.75);
      capsule.material = capsuleMat;
      new PhysicsAggregate(capsule, PhysicsShapeType.CAPSULE, { mass: 2 }, scn);

      const torus = MeshBuilder.CreateTorus(
        "torus",
        { diameter: 1.4, thickness: 0.45, tessellation: 24 },
        scn,
      );
      torus.position = new Vector3(4.5, 4.5, -1);
      const torusMat = new StandardMaterial("torusMat", scn);
      torusMat.diffuseColor = new Color3(0.95, 0.9, 0.25);
      torus.material = torusMat;
      new PhysicsAggregate(
        torus,
        PhysicsShapeType.CONVEX_HULL,
        { mass: 2.5 },
        scn,
      );

      const cone = MeshBuilder.CreateCylinder(
        "cone",
        { height: 1.6, diameterTop: 0, diameterBottom: 1.2, tessellation: 24 },
        scn,
      );
      cone.position = new Vector3(-4.5, 4, -1.5);
      const coneMat = new StandardMaterial("coneMat", scn);
      coneMat.diffuseColor = new Color3(0.85, 0.55, 0.15);
      cone.material = coneMat;
      new PhysicsAggregate(
        cone,
        PhysicsShapeType.CONVEX_HULL,
        { mass: 1.5 },
        scn,
      );

      const diamond = MeshBuilder.CreatePolyhedron(
        "diamond",
        { type: 3, size: 0.9 },
        scn,
      );
      diamond.position = new Vector3(0, 5.5, 2);
      const diamondMat = new StandardMaterial("diamondMat", scn);
      diamondMat.diffuseColor = new Color3(0.2, 0.75, 0.8);
      diamond.material = diamondMat;
      new PhysicsAggregate(
        diamond,
        PhysicsShapeType.CONVEX_HULL,
        { mass: 1 },
        scn,
      );

      const torusKnot = MeshBuilder.CreateTorusKnot(
        "torusKnot",
        { radius: 0.7, tube: 0.25, radialSegments: 32, tubularSegments: 64 },
        scn,
      );
      torusKnot.position = new Vector3(0, 5, -2.5);
      const torusKnotMat = new StandardMaterial("torusKnotMat", scn);
      torusKnotMat.diffuseColor = new Color3(0.95, 0.25, 0.35);
      torusKnot.material = torusKnotMat;
      new PhysicsAggregate(
        torusKnot,
        PhysicsShapeType.CONVEX_HULL,
        { mass: 2 },
        scn,
      );

      const icoSphere = MeshBuilder.CreateIcoSphere(
        "icoSphere",
        { radius: 0.8, subdivisions: 2 },
        scn,
      );
      icoSphere.position = new Vector3(-2.5, 5.5, 2.5);
      const icoSphereMat = new StandardMaterial("icoSphereMat", scn);
      icoSphereMat.diffuseColor = new Color3(0.6, 0.4, 0.95);
      icoSphere.material = icoSphereMat;
      new PhysicsAggregate(
        icoSphere,
        PhysicsShapeType.CONVEX_HULL,
        { mass: 1.5 },
        scn,
      );

      const disc = MeshBuilder.CreateDisc(
        "disc",
        { radius: 0.7, tessellation: 32 },
        scn,
      );
      disc.position = new Vector3(2.5, 5.5, -2);
      disc.rotation.x = Math.PI / 2;
      const discMat = new StandardMaterial("discMat", scn);
      discMat.diffuseColor = new Color3(0.9, 0.65, 0.15);
      disc.material = discMat;
      new PhysicsAggregate(disc, PhysicsShapeType.CYLINDER, { mass: 1.2 }, scn);

      const tetrahedron = MeshBuilder.CreatePolyhedron(
        "tetrahedron",
        { type: 0, size: 0.9 },
        scn,
      );
      tetrahedron.position = new Vector3(-4.5, 5.5, 0);
      const tetraMat = new StandardMaterial("tetraMat", scn);
      tetraMat.diffuseColor = new Color3(0.55, 0.85, 0.3);
      tetrahedron.material = tetraMat;
      new PhysicsAggregate(
        tetrahedron,
        PhysicsShapeType.CONVEX_HULL,
        { mass: 1 },
        scn,
      );

      const dodecahedron = MeshBuilder.CreatePolyhedron(
        "dodecahedron",
        { type: 2, size: 0.75 },
        scn,
      );
      dodecahedron.position = new Vector3(-2, 6, -3);
      const dodecaMat = new StandardMaterial("dodecaMat", scn);
      dodecaMat.diffuseColor = new Color3(0.3, 0.7, 0.9);
      dodecahedron.material = dodecaMat;
      new PhysicsAggregate(
        dodecahedron,
        PhysicsShapeType.CONVEX_HULL,
        { mass: 1.8 },
        scn,
      );

      const pyramid = MeshBuilder.CreatePolyhedron(
        "pyramid",
        { type: 8, size: 0.9 },
        scn,
      );
      pyramid.position = new Vector3(2, 6, -3);
      const pyramidMat = new StandardMaterial("pyramidMat", scn);
      pyramidMat.diffuseColor = new Color3(0.95, 0.75, 0.3);
      pyramid.material = pyramidMat;
      new PhysicsAggregate(
        pyramid,
        PhysicsShapeType.CONVEX_HULL,
        { mass: 1.4 },
        scn,
      );

      const icoBall = MeshBuilder.CreatePolyhedron(
        "icoBall",
        { type: 3, size: 0.7 },
        scn,
      );
      icoBall.position = new Vector3(0, 6.5, -1);
      const icoBallMat = new StandardMaterial("icoBallMat", scn);
      icoBallMat.diffuseColor = new Color3(0.85, 0.4, 0.6);
      icoBall.material = icoBallMat;
      new PhysicsAggregate(
        icoBall,
        PhysicsShapeType.CONVEX_HULL,
        { mass: 0.9 },
        scn,
      );

      const stackMat = new StandardMaterial("stackMat", scn);
      stackMat.diffuseColor = new Color3(0.7, 0.72, 0.78);
      for (let i = 0; i < 3; i++) {
        const tile = MeshBuilder.CreateBox(
          `tile${i}`,
          { width: 1.4, height: 0.35, depth: 1.4 },
          scn,
        );
        tile.position = new Vector3(4, 0.5 + i * 0.4, 2);
        tile.material = stackMat;
        new PhysicsAggregate(tile, PhysicsShapeType.BOX, { mass: 0.5 }, scn);
      }

      eng.runRenderLoop(() => scn.render());
    };

    void init();

    const handleResize = () => engine?.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      engine?.stopRenderLoop();
      scene?.dispose();
      engine?.dispose();
    };
  }, []);

  return (
    <div className="relative h-full w-full">
      <canvas
        ref={canvasRef}
        className="h-full w-full touch-none"
        style={{ display: "block" }}
      />
    </div>
  );
}
