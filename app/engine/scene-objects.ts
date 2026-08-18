import {
  Color3,
  Mesh,
  MeshBuilder,
  PhysicsAggregate,
  PhysicsShapeType,
  Scene,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core";

type ObjectFactory = (scene: Scene, name: string) => Mesh;

const boxFactory: ObjectFactory = (scene, name) => {
  const box = MeshBuilder.CreateBox(name, { size: 1.4 }, scene);
  const mat = new StandardMaterial(`${name}Mat`, scene);
  mat.diffuseColor = new Color3(0.95, 0.55, 0.2);
  box.material = mat;
  new PhysicsAggregate(box, PhysicsShapeType.BOX, { mass: 2 }, scene);
  return box;
};

const sphereFactory: ObjectFactory = (scene, name) => {
  const sphere = MeshBuilder.CreateSphere(
    name,
    { diameter: 1.6, segments: 32 },
    scene,
  );
  const mat = new StandardMaterial(`${name}Mat`, scene);
  mat.diffuseColor = new Color3(0.15, 0.6, 0.95);
  sphere.material = mat;
  new PhysicsAggregate(sphere, PhysicsShapeType.SPHERE, { mass: 1 }, scene);
  return sphere;
};

const cylinderFactory: ObjectFactory = (scene, name) => {
  const cylinder = MeshBuilder.CreateCylinder(
    name,
    {
      height: 2.2,
      diameterTop: 1.1,
      diameterBottom: 1.1,
      tessellation: 32,
    },
    scene,
  );
  const mat = new StandardMaterial(`${name}Mat`, scene);
  mat.diffuseColor = new Color3(0.4, 0.85, 0.4);
  cylinder.material = mat;
  new PhysicsAggregate(cylinder, PhysicsShapeType.CYLINDER, { mass: 3 }, scene);
  return cylinder;
};

const capsuleFactory: ObjectFactory = (scene, name) => {
  const capsule = MeshBuilder.CreateCapsule(
    name,
    { radius: 0.55, height: 1.8, tessellation: 24 },
    scene,
  );
  capsule.rotation.z = Math.PI / 2;
  const mat = new StandardMaterial(`${name}Mat`, scene);
  mat.diffuseColor = new Color3(0.85, 0.35, 0.75);
  capsule.material = mat;
  new PhysicsAggregate(capsule, PhysicsShapeType.CAPSULE, { mass: 2 }, scene);
  return capsule;
};

const torusFactory: ObjectFactory = (scene, name) => {
  const torus = MeshBuilder.CreateTorus(
    name,
    { diameter: 1.4, thickness: 0.45, tessellation: 24 },
    scene,
  );
  const mat = new StandardMaterial(`${name}Mat`, scene);
  mat.diffuseColor = new Color3(0.95, 0.9, 0.25);
  torus.material = mat;
  new PhysicsAggregate(
    torus,
    PhysicsShapeType.CONVEX_HULL,
    { mass: 2.5 },
    scene,
  );
  return torus;
};

const coneFactory: ObjectFactory = (scene, name) => {
  const cone = MeshBuilder.CreateCylinder(
    name,
    { height: 1.6, diameterTop: 0, diameterBottom: 1.2, tessellation: 24 },
    scene,
  );
  const mat = new StandardMaterial(`${name}Mat`, scene);
  mat.diffuseColor = new Color3(0.85, 0.55, 0.15);
  cone.material = mat;
  new PhysicsAggregate(
    cone,
    PhysicsShapeType.CONVEX_HULL,
    { mass: 1.5 },
    scene,
  );
  return cone;
};

const diamondFactory: ObjectFactory = (scene, name) => {
  const diamond = MeshBuilder.CreatePolyhedron(
    name,
    { type: 3, size: 0.9 },
    scene,
  );
  const mat = new StandardMaterial(`${name}Mat`, scene);
  mat.diffuseColor = new Color3(0.2, 0.75, 0.8);
  diamond.material = mat;
  new PhysicsAggregate(
    diamond,
    PhysicsShapeType.CONVEX_HULL,
    { mass: 1 },
    scene,
  );
  return diamond;
};

const torusKnotFactory: ObjectFactory = (scene, name) => {
  const torusKnot = MeshBuilder.CreateTorusKnot(
    name,
    { radius: 0.7, tube: 0.25, radialSegments: 32, tubularSegments: 64 },
    scene,
  );
  const mat = new StandardMaterial(`${name}Mat`, scene);
  mat.diffuseColor = new Color3(0.95, 0.25, 0.35);
  torusKnot.material = mat;
  new PhysicsAggregate(
    torusKnot,
    PhysicsShapeType.CONVEX_HULL,
    { mass: 2 },
    scene,
  );
  return torusKnot;
};

const icoSphereFactory: ObjectFactory = (scene, name) => {
  const icoSphere = MeshBuilder.CreateIcoSphere(
    name,
    { radius: 0.8, subdivisions: 2 },
    scene,
  );
  const mat = new StandardMaterial(`${name}Mat`, scene);
  mat.diffuseColor = new Color3(0.6, 0.4, 0.95);
  icoSphere.material = mat;
  new PhysicsAggregate(
    icoSphere,
    PhysicsShapeType.CONVEX_HULL,
    { mass: 1.5 },
    scene,
  );
  return icoSphere;
};

const discFactory: ObjectFactory = (scene, name) => {
  const disc = MeshBuilder.CreateDisc(
    name,
    { radius: 0.7, tessellation: 32 },
    scene,
  );
  disc.rotation.x = Math.PI / 2;
  const mat = new StandardMaterial(`${name}Mat`, scene);
  mat.diffuseColor = new Color3(0.9, 0.65, 0.15);
  disc.material = mat;
  new PhysicsAggregate(disc, PhysicsShapeType.CYLINDER, { mass: 1.2 }, scene);
  return disc;
};

const tetrahedronFactory: ObjectFactory = (scene, name) => {
  const tetrahedron = MeshBuilder.CreatePolyhedron(
    name,
    { type: 0, size: 0.9 },
    scene,
  );
  const mat = new StandardMaterial(`${name}Mat`, scene);
  mat.diffuseColor = new Color3(0.55, 0.85, 0.3);
  tetrahedron.material = mat;
  new PhysicsAggregate(
    tetrahedron,
    PhysicsShapeType.CONVEX_HULL,
    { mass: 1 },
    scene,
  );
  return tetrahedron;
};

const dodecahedronFactory: ObjectFactory = (scene, name) => {
  const dodecahedron = MeshBuilder.CreatePolyhedron(
    name,
    { type: 2, size: 0.75 },
    scene,
  );
  const mat = new StandardMaterial(`${name}Mat`, scene);
  mat.diffuseColor = new Color3(0.3, 0.7, 0.9);
  dodecahedron.material = mat;
  new PhysicsAggregate(
    dodecahedron,
    PhysicsShapeType.CONVEX_HULL,
    { mass: 1.8 },
    scene,
  );
  return dodecahedron;
};

const pyramidFactory: ObjectFactory = (scene, name) => {
  const pyramid = MeshBuilder.CreatePolyhedron(
    name,
    { type: 8, size: 0.9 },
    scene,
  );
  const mat = new StandardMaterial(`${name}Mat`, scene);
  mat.diffuseColor = new Color3(0.95, 0.75, 0.3);
  pyramid.material = mat;
  new PhysicsAggregate(
    pyramid,
    PhysicsShapeType.CONVEX_HULL,
    { mass: 1.4 },
    scene,
  );
  return pyramid;
};

const icoBallFactory: ObjectFactory = (scene, name) => {
  const icoBall = MeshBuilder.CreatePolyhedron(
    name,
    { type: 3, size: 0.7 },
    scene,
  );
  const mat = new StandardMaterial(`${name}Mat`, scene);
  mat.diffuseColor = new Color3(0.85, 0.4, 0.6);
  icoBall.material = mat;
  new PhysicsAggregate(
    icoBall,
    PhysicsShapeType.CONVEX_HULL,
    { mass: 0.9 },
    scene,
  );
  return icoBall;
};

const tileFactory: ObjectFactory = (scene, name) => {
  const tile = MeshBuilder.CreateBox(
    name,
    { width: 1.4, height: 0.35, depth: 1.4 },
    scene,
  );
  const mat = new StandardMaterial(`${name}Mat`, scene);
  mat.diffuseColor = new Color3(0.7, 0.72, 0.78);
  tile.material = mat;
  new PhysicsAggregate(tile, PhysicsShapeType.BOX, { mass: 0.5 }, scene);
  return tile;
};

export const objectFactories: ObjectFactory[] = [
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

export function spawnObject(scene: Scene, index: number, position: Vector3) {
  const factory = objectFactories[index % objectFactories.length];
  const mesh = factory(scene, `object${index}`);
  mesh.position = position;
  return mesh;
}

export function spawnObjects(scene: Scene, count: number): Mesh[] {
  const meshes: Mesh[] = [];
  for (let i = 0; i < count; i++) {
    const mesh = spawnObject(
      scene,
      i,
      new Vector3(
        Math.random() * 30 - 15,
        4 + Math.random() * 12,
        Math.random() * 30 - 15,
      ),
    );
    meshes.push(mesh);
  }
  return meshes;
}
