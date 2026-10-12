import * as THREE from 'three';
import type { Rect } from '../layout';
import { box } from './helpers';
import { cloneModel } from './models';

export interface CurtainRig {
  group: THREE.Group;
  /** Collision rectangles; they only block the player while the curtains are (being) closed. */
  colliders: Rect[];
  /** Roots the player can aim at (all of them toggle the curtains). */
  pickRoots: THREE.Object3D[];
  readonly closed: boolean;
  setClosed(closed: boolean): void;
  setHighlight(on: boolean): void;
  update(dt: number, playerX: number, playerZ: number): void;
}

interface PanelDef {
  /** Where the panel is anchored (the end that stays put when it bunches up). */
  x: number;
  z: number;
  rotY: number;
  length: number;
  rect: Rect;
}

const BACK = -3; // bed headwall
const LEFT = -2.7;
const RIGHT = 2.7;
const FOOT = 0.7;
const THICK = 0.1;

const PANELS: PanelDef[] = [
  { x: LEFT, z: BACK, rotY: -Math.PI / 2, length: FOOT - BACK, rect: { minX: LEFT - THICK, maxX: LEFT + THICK, minZ: BACK, maxZ: FOOT } },
  { x: RIGHT, z: BACK, rotY: -Math.PI / 2, length: FOOT - BACK, rect: { minX: RIGHT - THICK, maxX: RIGHT + THICK, minZ: BACK, maxZ: FOOT } },
  { x: LEFT, z: FOOT, rotY: 0, length: RIGHT - LEFT, rect: { minX: LEFT, maxX: RIGHT, minZ: FOOT - THICK, maxZ: FOOT + THICK } },
];

const MODEL_WIDTH = 3.1; // privacy curtain GLB, along its local x
const BUNCHED = 0.1; // fraction of the full length when open
const SECONDS = 1.0; // time to open or close
const OFF: Rect = { minX: 1e9, maxX: -1e9, minZ: 1e9, maxZ: -1e9 }; // matches nothing

const ease = (t: number) => t * t * (3 - 2 * t);

/** Curtains on a ceiling track around the bed. Starts open (bunched against the walls). */
export function createPrivacyCurtains(ceiling: number): CurtainRig {
  const group = new THREE.Group();
  const colliders: Rect[] = PANELS.map(() => ({ ...OFF })); // open at the start
  const pickRoots: THREE.Object3D[] = [];
  const pivots: THREE.Group[] = [];
  const materials: THREE.MeshLambertMaterial[] = [];

  // GLB curtain runs from y = 0.3 to the rail at 2.09; stretch it up to the ceiling track
  const stretchY = (ceiling - 0.28) / 2.09;

  for (const def of PANELS) {
    const root = new THREE.Group();
    root.position.set(def.x, 0, def.z);
    root.rotation.y = def.rotY;

    const pivot = new THREE.Group();
    const holder = new THREE.Group();
    holder.position.x = def.length / 2;

    const model = cloneModel('privacyCurtain');
    if (model) {
      holder.scale.set(def.length / MODEL_WIDTH, stretchY, 1);
      holder.add(model);
    } else {
      // Fallback: pleated boxes
      const pleats = Math.round(def.length / 0.28);
      for (let i = 0; i < pleats; i++) {
        holder.add(box(def.length / pleats, ceiling - 0.6, 0.05, i % 2 ? 0x4f9ba0 : 0x5aa9ae, -def.length / 2 + (i + 0.5) * (def.length / pleats), (ceiling - 0.6) / 2 + 0.4, i % 2 ? 0.03 : -0.03));
      }
      holder.add(box(def.length, 0.05, 0.05, 0xaab6bb, 0, ceiling - 0.25, 0));
    }

    // Each rig owns its fabric materials so the highlight never touches other scenes
    holder.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mat = (mesh.material as THREE.MeshLambertMaterial).clone();
      mat.userData.shared = false;
      mesh.material = mat;
      materials.push(mat);
    });

    pivot.add(holder);
    root.add(pivot);

    // Fixed hit area at the anchored end so the bunched-up curtain is easy to target
    const hit = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.4, 0.6), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.set(0.4, 1.3, 0);
    root.add(hit);

    group.add(root);
    pickRoots.push(root);
    pivots.push(pivot);
  }

  let target = 0; // 0 = open, 1 = closed
  let amount = 0;
  let wasBlocking = false;

  const apply = () => {
    const k = BUNCHED + (1 - BUNCHED) * ease(amount);
    pivots.forEach((p) => p.scale.set(k, 1, 1));
  };
  apply();

  const insideAny = (x: number, z: number) =>
    PANELS.some((p) => x > p.rect.minX - 0.45 && x < p.rect.maxX + 0.45 && z > p.rect.minZ - 0.45 && z < p.rect.maxZ + 0.45);

  return {
    group,
    colliders,
    pickRoots,
    get closed() {
      return target === 1;
    },
    setClosed(closed) {
      target = closed ? 1 : 0;
    },
    setHighlight(on) {
      const hex = on ? 0x1b8f93 : 0x000000;
      materials.forEach((m) => m.emissive.setHex(hex));
    },
    update(dt, playerX, playerZ) {
      const step = dt / SECONDS;
      const diff = target - amount;
      if (Math.abs(diff) > 1e-4) {
        amount += Math.sign(diff) * Math.min(step, Math.abs(diff));
        apply();
      }
      // Block the player only while closed, and never while they are standing where the curtain would be
      const shouldBlock = target === 1 && amount > 0.6 && !insideAny(playerX, playerZ);
      if (shouldBlock !== wasBlocking) {
        wasBlocking = shouldBlock;
        PANELS.forEach((p, i) => Object.assign(colliders[i], shouldBlock ? p.rect : OFF));
      }
    },
  };
}
