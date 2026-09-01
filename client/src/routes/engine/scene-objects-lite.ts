import {
  addToScene,
  createBox,
  createCapsule,
  createCylinder,
  createDisc,
  createPhysicsAggregate,
  createPhysicsBody,
  createPhysicsShape,
  createPolyhedron,
  createSphere,
  createStandardMaterial,
  createTorus,
  createTorusKnot,
  setPhysicsBodyMass,
  setPhysicsBodyShape,
  setPhysicsShapeMaterial,
  type EngineContext,
  type Mesh,
  type PhysicsBody,
  type PhysicsShapeType,
  type PhysicsWorld,
  type SceneContext,
  type StandardMaterialProps,
  type Vec3,
} from "@babylonjs/lite";

export const physicsShapeTypes = {
  SPHERE: 0,
  CAPSULE: 1,
  CYLINDER: 2,
  BOX: 3,
  CONVEX_HULL: 4,
} as const;

export type SpawnResult = { mesh: Mesh; body: PhysicsBody; kind: ShapeName; mass: number };

type ShapeName = keyof typeof physicsShapeTypes;

type FactoryResult = { mesh: Mesh; type: ShapeName; mass: number };

type ObjectFactory = (engine: EngineContext, name: string) => FactoryResult;

function createMaterial(diffuse: [number, number, number]): StandardMaterialProps {
  const mat = createStandardMaterial();
  mat.diffuseColor = diffuse;
  return mat;
}

function attachPhysics(
  mesh: Mesh,
  scene: SceneContext,
  world: PhysicsWorld,
  type: ShapeName,
  mass: number,
): PhysicsBody {
  addToScene(scene, mesh);
  if (type === "CONVEX_HULL") {
    const shape = createPhysicsShape(world, {
      type: physicsShapeTypes.CONVEX_HULL as PhysicsShapeType,
      mesh,
    });
    const body = createPhysicsBody(world, mesh, 2, false);
    setPhysicsBodyShape(world, body, shape);
    setPhysicsShapeMaterial(world, shape, 0.2, 0.2);
    setPhysicsBodyMass(world, body, mass);
    return body;
  }
  const aggregate = createPhysicsAggregate(
    world,
    mesh,
    physicsShapeTypes[type] as PhysicsShapeType,
    { mass },
  );
  return aggregate.body;
}

const boxFactory: ObjectFactory = (engine, name) => {
  const box = createBox(engine, 1.4);
  box.name = name;
  box.material = createMaterial([0.95, 0.55, 0.2]);
  return { mesh: box, type: "BOX", mass: 2 };
};

const sphereFactory: ObjectFactory = (engine, name) => {
  const sphere = createSphere(engine, { diameter: 1.6, segments: 32 });
  sphere.name = name;
  sphere.material = createMaterial([0.15, 0.6, 0.95]);
  return { mesh: sphere, type: "SPHERE", mass: 1 };
};

const cylinderFactory: ObjectFactory = (engine, name) => {
  const cylinder = createCylinder(engine, {
    height: 2.2,
    diameterTop: 1.1,
    diameterBottom: 1.1,
    tessellation: 32,
  });
  cylinder.name = name;
  cylinder.material = createMaterial([0.4, 0.85, 0.4]);
  return { mesh: cylinder, type: "CYLINDER", mass: 3 };
};

const capsuleFactory: ObjectFactory = (engine, name) => {
  const capsule = createCapsule(engine, { radius: 0.55, height: 1.8, tessellation: 24 });
  capsule.rotation.z = Math.PI / 2;
  capsule.name = name;
  capsule.material = createMaterial([0.85, 0.35, 0.75]);
  return { mesh: capsule, type: "CAPSULE", mass: 2 };
};

const torusFactory: ObjectFactory = (engine, name) => {
  const torus = createTorus(engine, { diameter: 1.4, thickness: 0.45, tessellation: 24 });
  torus.name = name;
  torus.material = createMaterial([0.95, 0.9, 0.25]);
  return { mesh: torus, type: "CONVEX_HULL", mass: 2.5 };
};

const coneFactory: ObjectFactory = (engine, name) => {
  const cone = createCylinder(engine, {
    height: 1.6,
    diameterTop: 0,
    diameterBottom: 1.2,
    tessellation: 24,
  });
  cone.name = name;
  cone.material = createMaterial([0.85, 0.55, 0.15]);
  return { mesh: cone, type: "CONVEX_HULL", mass: 1.5 };
};

const diamondFactory: ObjectFactory = (engine, name) => {
  const diamond = createPolyhedron(engine, { type: 3, size: 0.9 });
  diamond.name = name;
  diamond.material = createMaterial([0.2, 0.75, 0.8]);
  return { mesh: diamond, type: "CONVEX_HULL", mass: 1 };
};

const torusKnotFactory: ObjectFactory = (engine, name) => {
  const torusKnot = createTorusKnot(engine, {
    radius: 0.7,
    tube: 0.25,
    radialSegments: 32,
    tubularSegments: 64,
  });
  torusKnot.name = name;
  torusKnot.material = createMaterial([0.95, 0.25, 0.35]);
  return { mesh: torusKnot, type: "CONVEX_HULL", mass: 2 };
};

const icoSphereFactory: ObjectFactory = (engine, name) => {
  const icoSphere = createPolyhedron(engine, { type: 3, size: 1.6, flat: false });
  icoSphere.name = name;
  icoSphere.material = createMaterial([0.6, 0.4, 0.95]);
  return { mesh: icoSphere, type: "CONVEX_HULL", mass: 1.5 };
};

const discFactory: ObjectFactory = (engine, name) => {
  const disc = createDisc(engine, { radius: 0.7, tessellation: 32 });
  disc.rotation.x = Math.PI / 2;
  disc.name = name;
  disc.material = createMaterial([0.9, 0.65, 0.15]);
  return { mesh: disc, type: "CYLINDER", mass: 1.2 };
};

const tetrahedronFactory: ObjectFactory = (engine, name) => {
  const tetrahedron = createPolyhedron(engine, { type: 0, size: 0.9 });
  tetrahedron.name = name;
  tetrahedron.material = createMaterial([0.55, 0.85, 0.3]);
  return { mesh: tetrahedron, type: "CONVEX_HULL", mass: 1 };
};

const dodecahedronFactory: ObjectFactory = (engine, name) => {
  const dodecahedron = createPolyhedron(engine, { type: 2, size: 0.75 });
  dodecahedron.name = name;
  dodecahedron.material = createMaterial([0.3, 0.7, 0.9]);
  return { mesh: dodecahedron, type: "CONVEX_HULL", mass: 1.8 };
};

const pyramidFactory: ObjectFactory = (engine, name) => {
  const pyramid = createPolyhedron(engine, { type: 8, size: 0.9 });
  pyramid.name = name;
  pyramid.material = createMaterial([0.95, 0.75, 0.3]);
  return { mesh: pyramid, type: "CONVEX_HULL", mass: 1.4 };
};

const icoBallFactory: ObjectFactory = (engine, name) => {
  const icoBall = createPolyhedron(engine, { type: 3, size: 0.7 });
  icoBall.name = name;
  icoBall.material = createMaterial([0.85, 0.4, 0.6]);
  return { mesh: icoBall, type: "CONVEX_HULL", mass: 0.9 };
};

const tileFactory: ObjectFactory = (engine, name) => {
  const tile = createBox(engine, { width: 1.4, height: 0.35, depth: 1.4 });
  tile.name = name;
  tile.material = createMaterial([0.7, 0.72, 0.78]);
  return { mesh: tile, type: "BOX", mass: 0.5 };
};

const objectFactories: ObjectFactory[] = [
  boxFactory,
  sphereFactory,
  cylinderFactory,
  capsuleFactory,
  torusFactory,
  coneFactory,
  diamondFactory,
  torusKnotFactory,
  icoSphereFactory,
  discFactory,
  tetrahedronFactory,
  dodecahedronFactory,
  pyramidFactory,
  icoBallFactory,
  tileFactory,
];

export function spawnObjectLite(
  engine: EngineContext,
  scene: SceneContext,
  world: PhysicsWorld,
  index: number,
  position: Vec3,
): SpawnResult {
  const { mesh, type, mass } = objectFactories[index % objectFactories.length](
    engine,
    `object${index}`,
  );
  mesh.position.set(position.x, position.y, position.z);
  const body = attachPhysics(mesh, scene, world, type, mass);
  return { mesh, body, kind: type, mass };
}