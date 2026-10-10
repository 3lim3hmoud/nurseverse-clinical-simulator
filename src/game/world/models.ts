import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * Hospital ward GLB kit (public/models). Every model is authored with its front facing -Z,
 * its origin on the floor (wall-mounted items: on the wall, protruding toward -Z).
 *
 * Models are preloaded once, so scene building stays synchronous. Every caller must handle
 * `cloneModel()` returning null (model missing / failed to load) by falling back to primitives.
 */

interface Spec {
  file: string;
  /** Node names that stay separate meshes (animated, highlighted or looked up by a rig). */
  keep?: string[];
}

const SPECS = {
  crashCart: { file: 'Crash_Cart_Trolley.glb' },
  defibrillator: { file: 'Defibrillator.glb' },
  bedsideCabinet: { file: 'Bedside_Cabinet.glb' },
  overbedTable: { file: 'Overbed_Table.glb' },
  medicationCart: { file: 'Medication_Cart.glb' },
  privacyCurtain: { file: 'Privacy_Curtain.glb' },
  bedHeadUnit: { file: 'Bed_Head_Unit.glb' },
  sanitizer: { file: 'Hand_Sanitizer_Dispenser.glb' },
  sharps: { file: 'Sharps_Container.glb' },
  waterJug: { file: 'Water_Jug.glb' },
  tissueBox: { file: 'Tissue_Box.glb' },
  drinkingCup: { file: 'Drinking_Cup.glb' },
  pillBottle: { file: 'Pill_Bottle.glb' },
  syringe: { file: 'Syringe.glb' },
  patientMonitor: { file: 'Patient_Monitor.glb', keep: ['Screen', 'Bezel', 'AlarmLight', 'AlarmLight.001', 'Port.001'] },
  ivStand: { file: 'IV_Stand_Pump.glb', keep: ['Pump', 'PumpScreen', 'PumpLED', 'IVBag0', 'DripChamber', 'IVPort0'] },
  oxygenCylinder: { file: 'Oxygen_Cylinder.glb', keep: ['Body.005', 'GaugeNeedle'] },
  oxygenFlowmeter: { file: 'Oxygen_Flowmeter.glb', keep: ['BackPlate', 'Float', 'Tube', 'Nipple'] },
} satisfies Record<string, Spec>;

export type ModelName = keyof typeof SPECS;

/** GLTFLoader strips characters like "." from node names ("AlarmLight.001" -> "AlarmLight001"); use Blender's names everywhere else. */
const clean = (name: string) => THREE.PropertyBinding.sanitizeNodeName(name);

const templates = new Map<ModelName, THREE.Group>();
let preloading: Promise<void> | null = null;

/** PBR needs an environment map to look right; the rest of the game uses cheap Lambert, so convert. */
function toLambert(src: THREE.Material, cache: Map<THREE.Material, THREE.Material>): THREE.Material {
  const hit = cache.get(src);
  if (hit) return hit;
  const s = src as THREE.MeshStandardMaterial;
  const emissiveStrength = s.emissive && (s.emissive.r + s.emissive.g + s.emissive.b > 0.01) && s.emissiveIntensity > 0;
  let out: THREE.Material;
  if (emissiveStrength && s.emissiveMap) {
    // Self-lit screens: show the texture unlit
    out = new THREE.MeshBasicMaterial({ map: s.emissiveMap, side: s.side });
  } else {
    out = new THREE.MeshLambertMaterial({
      name: s.name,
      color: s.color,
      map: s.map,
      emissive: s.emissive,
      emissiveIntensity: s.emissiveIntensity,
      opacity: s.opacity,
      transparent: s.transparent,
      depthWrite: !s.transparent,
      side: s.side,
    });
  }
  out.name = s.name;
  out.userData.shared = true;
  if ((out as THREE.MeshBasicMaterial).map) (out as THREE.MeshBasicMaterial).map!.userData.shared = true;
  cache.set(src, out);
  return out;
}

/** Merge all meshes that share a material into one (hundreds of tiny meshes -> a handful of draw calls). */
function mergeStatic(root: THREE.Group, keep: Set<string>): void {
  root.updateMatrixWorld(true);
  const inverseRoot = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const byMaterial = new Map<THREE.Material, THREE.BufferGeometry[]>();
  const kept: THREE.Mesh[] = [];
  const all: THREE.Mesh[] = [];
  root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) all.push(o as THREE.Mesh);
  });

  for (const mesh of all) {
    if (keep.has(mesh.name)) {
      kept.push(mesh);
      continue;
    }
    const geo = mesh.geometry.clone();
    geo.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverseRoot, mesh.matrixWorld));
    const list = byMaterial.get(mesh.material as THREE.Material) ?? [];
    list.push(geo);
    byMaterial.set(mesh.material as THREE.Material, list);
  }

  // Detach everything, then re-attach kept meshes (world transform preserved) and the merged ones
  const children = [...root.children];
  const keptWorld = kept.map((m) => m.matrixWorld.clone());
  children.forEach((c) => root.remove(c));
  kept.forEach((m, i) => {
    m.removeFromParent();
    m.matrix.multiplyMatrices(inverseRoot, keptWorld[i]);
    m.matrix.decompose(m.position, m.quaternion, m.scale);
    root.add(m);
  });

  for (const [material, geos] of byMaterial) {
    const withUv = geos.every((g) => g.getAttribute('uv'));
    const indexed = geos.every((g) => g.index);
    const prepared = geos.map((g) => {
      for (const name of Object.keys(g.attributes)) if (name !== 'position' && name !== 'normal' && !(name === 'uv' && withUv)) g.deleteAttribute(name);
      return indexed ? g : g.index ? g.toNonIndexed() : g;
    });
    const merged = mergeGeometries(prepared, false);
    if (!merged) continue;
    merged.userData.shared = true;
    const mesh = new THREE.Mesh(merged, material);
    mesh.name = `merged_${material.name}`;
    root.add(mesh);
  }
}

async function loadOne(name: ModelName, loader: GLTFLoader): Promise<void> {
  const spec: Spec = SPECS[name];
  const gltf = await loader.loadAsync(`${import.meta.env.BASE_URL}models/${spec.file}`);
  const root = gltf.scene as unknown as THREE.Group;
  const cache = new Map<THREE.Material, THREE.Material>();
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.material = Array.isArray(mesh.material) ? mesh.material.map((m) => toLambert(m, cache)) : toLambert(mesh.material, cache);
    mesh.geometry.userData.shared = true;
    mesh.matrixAutoUpdate = true;
  });
  mergeStatic(root, new Set((spec.keep ?? []).map(clean)));
  templates.set(name, root);
}

/** Load every model once. Never rejects: a model that fails to load simply stays unavailable. */
export function preloadModels(): Promise<void> {
  if (preloading) return preloading;
  const loader = new GLTFLoader();
  preloading = Promise.all(
    (Object.keys(SPECS) as ModelName[]).map((name) =>
      loadOne(name, loader).catch((e) => console.warn(`[models] ${name} failed to load, using fallback`, e)),
    ),
  ).then(() => undefined);
  return preloading;
}

export const hasModel = (name: ModelName): boolean => templates.has(name);

/** Find a kept mesh by its Blender name. */
export const findMesh = (root: THREE.Object3D, name: string): THREE.Mesh | undefined => root.getObjectByName(clean(name)) as THREE.Mesh | undefined;

/** A fresh copy (geometry and materials are shared; clone a material before changing it). */
export function cloneModel(name: ModelName): THREE.Group | null {
  const t = templates.get(name);
  return t ? (t.clone(true) as THREE.Group) : null;
}

/** Give one named mesh its own material so it can glow / change colour without affecting other copies. */
export function ownMaterial<T extends THREE.Material = THREE.MeshLambertMaterial>(root: THREE.Object3D, meshName: string): T | null {
  const mesh = root.getObjectByName(clean(meshName)) as THREE.Mesh | undefined;
  if (!mesh || !mesh.isMesh) return null;
  const mat = (mesh.material as THREE.Material).clone() as T;
  mat.userData.shared = false;
  mesh.material = mat;
  return mat;
}

/** Give every mesh under `root` its own material and return a function that makes the whole object glow (target highlight). */
export function makeHighlightable(root: THREE.Object3D): (on: boolean) => void {
  const mats: THREE.MeshLambertMaterial[] = [];
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh || !(mesh.material as THREE.MeshLambertMaterial).emissive) return;
    const mat = (mesh.material as THREE.MeshLambertMaterial).clone();
    mat.userData.shared = false;
    mesh.material = mat;
    mats.push(mat);
  });
  return (on) => mats.forEach((m) => m.emissive.setHex(on ? 0x1b8f93 : 0x000000));
}

/** Local-space (relative to `root`) bounding box of a named mesh. */
export function localBox(root: THREE.Object3D, meshName: string): THREE.Box3 | null {
  const mesh = root.getObjectByName(clean(meshName)) as THREE.Mesh | undefined;
  if (!mesh) return null;
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(mesh);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  return box.applyMatrix4(inv);
}
