import * as THREE from 'three';
import { sliceByZ } from './geometryUtils';
import { blobShadow, box, cyl } from './helpers';
import { cloneModel, findMesh } from './models';

export interface BedRig {
  group: THREE.Group;
  /** Raise the back section (radians, 0 = flat). The pivot sits at the hip, on the mattress surface. */
  setHeadAngle(angle: number): void;
  /** Raise the leg section (radians, 0 = flat). */
  setLegAngle(angle: number): void;
}

// The hinge sits at the patient's hip (GLB coordinates: head at +z, mattress top at y = 0.68)
const HINGE_Y = 0.68;
const HINGE_Z = -0.08;
const BEND = 0.08; // the mattress bends over this distance on each side of the hinge
const BENDING = ['Mattress', 'Deck', 'FittedSheet', 'PipingSide', 'PipingSide.001', 'PipingEnd', 'PipingEnd.001'];

/** Hospital bed. Origin = floor level, centered. Head toward -z. */
export function createBed(): BedRig {
  return createFromModel() ?? createProcedural();
}

/**
 * GLB bed. The mattress is one piece, so it is cut along the bend zone and skinned to two bones hinged at the hip:
 * the back section (head side) and the leg section. The pillow rides with the back section.
 */
function createFromModel(): BedRig | null {
  const model = cloneModel('bed');
  if (!model || !findMesh(model, 'Mattress')) return null;

  const g = new THREE.Group();
  g.add(blobShadow(1.5, 2.5, 0, 0));

  for (const seam of ['SectionSeam', 'SectionSeam.001']) findMesh(model, seam)?.removeFromParent();

  const boneBack = new THREE.Bone();
  const boneFoot = new THREE.Bone();
  boneBack.position.set(0, HINGE_Y, HINGE_Z);
  boneFoot.position.set(0, HINGE_Y, HINGE_Z);
  model.add(boneBack, boneFoot);
  model.updateMatrixWorld(true);

  const planes = Array.from({ length: 9 }, (_, i) => HINGE_Z - BEND + i * (BEND / 4));
  const skinned: THREE.SkinnedMesh[] = [];
  for (const name of BENDING) {
    const mesh = findMesh(model, name);
    if (!mesh) continue;
    const geo = sliceByZ(mesh.geometry.clone().applyMatrix4(mesh.matrixWorld), planes);
    const count = geo.getAttribute('position').count;
    const index = new Uint16Array(count * 4);
    const weight = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      const t = Math.min(1, Math.max(0, (geo.getAttribute('position').getZ(i) - (HINGE_Z - BEND)) / (2 * BEND)));
      const back = t * t * (3 - 2 * t); // smooth 0 -> 1 across the bend zone
      index.set([0, 1, 0, 0], i * 4);
      weight.set([back, 1 - back, 0, 0], i * 4);
    }
    geo.setAttribute('skinIndex', new THREE.BufferAttribute(index, 4));
    geo.setAttribute('skinWeight', new THREE.BufferAttribute(weight, 4));
    const sm = new THREE.SkinnedMesh(geo, mesh.material as THREE.Material);
    sm.name = name;
    sm.frustumCulled = false;
    mesh.removeFromParent();
    skinned.push(sm);
  }
  for (const name of ['Pillow', 'PillowSeam']) {
    const piece = findMesh(model, name);
    if (piece) boneBack.attach(piece);
  }

  model.add(...skinned);
  model.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton([boneBack, boneFoot]);
  skinned.forEach((sm) => sm.bind(skeleton));

  model.rotation.y = Math.PI; // the GLB bed has its head at +z, the room has it at -z
  g.add(model);

  return {
    group: g,
    setHeadAngle(angle) {
      boneBack.rotation.x = -angle;
    },
    setLegAngle(angle) {
      boneFoot.rotation.x = angle;
    },
  };
}

function createProcedural(): BedRig {
  const g = new THREE.Group();
  const METAL = 0xaab6bb;

  g.add(blobShadow(1.5, 2.5, 0, 0));
  g.add(box(0.9, 0.1, 2.0, METAL, 0, 0.55, 0)); // frame

  // Mattress sections hinged at the hip (top surface of the mattress)
  const back = new THREE.Group();
  back.position.set(0, 0.77, 0);
  back.add(box(0.84, 0.14, 0.975, 0x3f8fa0, 0, -0.1, -0.4875));
  back.add(box(0.86, 0.03, 0.95, 0xffffff, 0, -0.015, -0.475));
  g.add(back);

  const foot = new THREE.Group();
  foot.position.set(0, 0.77, 0);
  foot.add(box(0.84, 0.14, 0.975, 0x3f8fa0, 0, -0.1, 0.4875));
  foot.add(box(0.86, 0.03, 0.95, 0xffffff, 0, -0.015, 0.475));
  g.add(foot);

  // Head and foot boards
  g.add(box(0.94, 0.55, 0.06, METAL, 0, 0.82, -1.03));
  g.add(box(0.94, 0.32, 0.05, METAL, 0, 0.7, 1.03));

  // Column posts, wheels
  for (const x of [-0.36, 0.36]) {
    for (const z of [-0.85, 0.85]) {
      g.add(box(0.06, 0.28, 0.06, 0x7d8a90, x, 0.36, z));
      const wheel = cyl(0.05, 0.05, 0.04, 0x37474f, x, 0.09, z);
      wheel.rotation.z = Math.PI / 2;
      g.add(wheel);
    }
  }

  // Side rails (thin top bar + posts so the patient stays visible)
  for (const x of [-0.47, 0.47]) {
    g.add(box(0.03, 0.03, 1.1, 0xe3e9eb, x, 0.95, -0.4));
    g.add(box(0.03, 0.2, 0.03, 0xe3e9eb, x, 0.85, -0.93));
    g.add(box(0.03, 0.2, 0.03, 0xe3e9eb, x, 0.85, 0.13));
  }

  return {
    group: g,
    setHeadAngle(angle) {
      back.rotation.x = angle;
    },
    setLegAngle(angle) {
      foot.rotation.x = -angle;
    },
  };
}
