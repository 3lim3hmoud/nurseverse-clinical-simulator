import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { buildHeld, type HeldKind, type HeldSet } from './heldObjects';

export type { HeldKind };

export type Vec3 = [number, number, number];

/** Where one hand is (in the nurse's view space: x right, y up, -z forward, metres) and how its fingers are bent. */
export interface HandPose {
  pos: Vec3;
  /** Euler angles, applied roll (z) first, then pitch (x), then yaw (y). Neutral: fingers point away, palm faces down. */
  rot: Vec3;
  curl: [number, number, number, number, number];
  /** 0 = fingers together, 1 = fanned out */
  spread: number;
  /** extra lean around the line of sight, so the forearms can make a natural V instead of two parallel poles */
  tilt?: number;
  /** extra lean of the whole hand toward (+) or away from (-) the nurse, about the view's x axis */
  lean?: number;
}

export interface HandsPose {
  r: HandPose;
  l: HandPose;
  /** soap lather on the hands, 0..1 */
  foam: number;
  /** a paper towel in the right hand (same as held: 'towel') */
  towel?: boolean;
  /** something held in a hand, and which hand (default right) */
  held?: HeldKind | null;
  heldIn?: 'r' | 'l';
  /** squeeze of a held bag, 0..1 */
  squeeze?: number;
  /** how wet the skin looks, 0..1 */
  wet?: number;
}

const SKIN = 0xd6a07c;
const GLOVE = 0x58b4e6;
const SLEEVE = 0x1b8f93;
const NAIL = 0xe9c0b0;

interface FingerSpec {
  x: number;
  y: number;
  z: number;
  len: [number, number, number];
  r: number;
  max: [number, number, number];
  spreadAngle: number;
}

// Right hand, palm down, fingers toward -z, thumb on the -x side. The left hand is built mirrored.
const FINGERS: FingerSpec[] = [
  { x: -0.04, y: -0.006, z: -0.022, len: [0.04, 0.032, 0.026], r: 0.0125, max: [0.35, 0.9, 0.9], spreadAngle: 0 },
  { x: -0.0295, y: 0, z: -0.092, len: [0.042, 0.025, 0.021], r: 0.0102, max: [1.4, 1.75, 1.2], spreadAngle: 0.2 },
  { x: -0.0095, y: 0, z: -0.096, len: [0.046, 0.029, 0.022], r: 0.0106, max: [1.4, 1.75, 1.2], spreadAngle: 0.04 },
  { x: 0.0105, y: 0, z: -0.092, len: [0.042, 0.027, 0.021], r: 0.0099, max: [1.4, 1.75, 1.2], spreadAngle: -0.1 },
  { x: 0.0285, y: 0, z: -0.085, len: [0.034, 0.02, 0.018], r: 0.0088, max: [1.4, 1.75, 1.2], spreadAngle: -0.24 },
];

/** A tube along -z that is round at both ends and slightly narrower at the far end: one bone of a finger. */
function bone(len: number, r0: number, r1: number): THREE.BufferGeometry {
  const cap = 6;
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= cap; i++) {
    const a = -Math.PI / 2 + (i / cap) * (Math.PI / 2);
    pts.push(new THREE.Vector2(Math.cos(a) * r0, Math.sin(a) * r0));
  }
  for (let i = 0; i <= cap; i++) {
    const a = (i / cap) * (Math.PI / 2);
    pts.push(new THREE.Vector2(Math.cos(a) * r1, len + Math.sin(a) * r1));
  }
  const g = new THREE.LatheGeometry(pts, 14);
  g.rotateX(-Math.PI / 2); // +y -> -z
  g.scale(1, 0.88, 1); // fingers are a little flatter than they are wide
  return g;
}

const ellipsoid = (rx: number, ry: number, rz: number, mat: THREE.Material, x: number, y: number, z: number, rotY = 0): THREE.Mesh => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat);
  m.scale.set(rx, ry, rz);
  m.position.set(x, y, z);
  m.rotation.y = rotY;
  return m;
};

interface Finger {
  base: THREE.Group;
  joints: THREE.Group[];
  spec: FingerSpec;
}

/** a tiny deterministic random generator, so both hands always get the same bubbles */
const rng = (seed: number) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

const BUBBLES = 96;

class HandRig {
  readonly root = new THREE.Group();
  private fingers: Finger[] = [];
  private bubbles: THREE.InstancedMesh;
  private bubbleData: { p: THREE.Vector3; size: number; at: number }[] = [];
  private lastFoam = -1;
  private heldSet: HeldSet;
  readonly cuff: THREE.Mesh;

  constructor(private side: 1 | -1, handMat: THREE.Material, armMat: THREE.Material, sleeveMat: THREE.Material, foamMat: THREE.Material, glove: THREE.Material, nailMat: THREE.Material) {
    const s = side;
    const root = this.root;

    // palm, the pads at the base of the thumb and little finger, the back of the hand and the wrist
    root.add(new THREE.Mesh(new RoundedBoxGeometry(0.086, 0.026, 0.094, 3, 0.011), handMat).translateZ(-0.047));
    root.add(ellipsoid(0.027, 0.019, 0.045, handMat, s * -0.03, -0.01, -0.036, s * 0.3));
    root.add(ellipsoid(0.018, 0.014, 0.038, handMat, s * 0.031, -0.008, -0.05));
    root.add(ellipsoid(0.04, 0.013, 0.05, handMat, 0, 0.009, -0.052));
    root.add(ellipsoid(0.03, 0.021, 0.026, handMat, 0, 0, 0.004));

    for (const [i, spec] of FINGERS.entries()) {
      const base = new THREE.Group();
      base.rotation.order = 'YXZ';
      base.position.set(s * spec.x, spec.y, spec.z);
      const joints: THREE.Group[] = [];
      let parent: THREE.Object3D = base;
      for (let j = 0; j < 3; j++) {
        const joint = new THREE.Group();
        if (j > 0) joint.position.z = -spec.len[j - 1];
        parent.add(joint);
        const r0 = spec.r * (1 - j * 0.07);
        const r1 = spec.r * (1 - (j + 1) * 0.07 - 0.03);
        joint.add(new THREE.Mesh(bone(spec.len[j], r0, r1), handMat));
        if (j === 2) {
          // fingernail on the back of the last bone
          const nail = ellipsoid(r1 * 0.78, r1 * 0.2, spec.len[j] * 0.36, nailMat, 0, r1 * 0.82, -spec.len[j] * 0.7);
          joint.add(nail);
        }
        joints.push(joint);
        parent = joint;
      }
      if (i > 0) {
        // knuckle: bridges the palm and the first bone, so there is no gap when the finger bends
        const knuckle = new THREE.Mesh(new THREE.SphereGeometry(spec.r * 1.05, 12, 8), handMat);
        base.add(knuckle);
      }
      root.add(base);
      this.fingers.push({ base, joints, spec });
    }

    // forearm, scrub sleeve and glove cuff run toward the camera (they leave the screen at the bottom)
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.034, 0.44, 18), armMat);
    arm.rotation.x = Math.PI / 2;
    arm.position.z = 0.22;
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.054, 0.14, 20), sleeveMat);
    sleeve.rotation.x = Math.PI / 2;
    sleeve.position.z = 0.4;
    this.cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.037, 0.11, 18), glove);
    this.cuff.rotation.x = Math.PI / 2;
    this.cuff.position.z = 0.045;
    this.cuff.visible = false;
    root.add(arm, sleeve, this.cuff);

    // soap bubbles: small, many, spread over the palm, the back of the hand and the fingers
    const rand = rng(side === 1 ? 7 : 13);
    for (let i = 0; i < BUBBLES; i++) {
      const where = i % 3; // 0 palm, 1 back, 2 fingers
      let p: THREE.Vector3;
      if (where === 0) p = new THREE.Vector3((rand() - 0.5) * 0.07, -0.016, -0.01 - rand() * 0.085);
      else if (where === 1) p = new THREE.Vector3((rand() - 0.5) * 0.07, 0.02, -0.01 - rand() * 0.085);
      else {
        const f = FINGERS[1 + Math.floor(rand() * 4)];
        p = new THREE.Vector3(s * f.x, f.r * 0.9, f.z - rand() * (f.len[0] + f.len[1]));
      }
      this.bubbleData.push({ p, size: 0.0024 + rand() * 0.0052, at: rand() });
    }
    this.bubbles = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), foamMat, BUBBLES);
    this.bubbles.frustumCulled = false;
    root.add(this.bubbles);
    this.setFoam(0);

    this.heldSet = buildHeld();
    for (const obj of Object.values(this.heldSet.objects)) root.add(obj);
    root.scale.setScalar(1.12);
  }

  /** Bend the fingers (curl 0..1 each) and fan them out. */
  setFingers(curl: readonly number[], spread: number): void {
    const s = this.side;
    this.fingers.forEach((f, i) => {
      const c = curl[i];
      if (i === 0) {
        // the thumb swings across the palm as it curls
        f.base.rotation.set(-0.25 * c, s * (0.62 - c * 1.2 + spread * 0.2), 0);
      } else {
        f.base.rotation.set(0, s * f.spec.spreadAngle * spread, 0);
      }
      f.joints.forEach((j, k) => {
        j.rotation.x = -c * f.spec.max[k];
      });
    });
  }

  /** Show one held object (or none); the bag can be squeezed. */
  setHeld(kind: HeldKind | null, squeeze = 0): void {
    for (const [k, obj] of Object.entries(this.heldSet.objects)) obj.visible = k === kind;
    if (kind === 'bag') this.heldSet.squeezeBag(squeeze);
  }

  setFoam(level: number): void {
    if (Math.abs(level - this.lastFoam) < 0.012) return;
    this.lastFoam = level;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    this.bubbleData.forEach((b, i) => {
      const on = level > b.at * 0.85 + 0.02;
      const size = on ? b.size * (0.7 + level * 0.7) : 0;
      m.compose(b.p, q, new THREE.Vector3(size, size, size));
      this.bubbles.setMatrixAt(i, m);
    });
    this.bubbles.instanceMatrix.needsUpdate = true;
  }
}

/** the top edge of a surgical mask, across the bottom of the view */
function makeWornMask(): THREE.Object3D {
  const shape = new THREE.Shape();
  shape.moveTo(-0.3, -0.2);
  shape.lineTo(-0.3, -0.058);
  shape.quadraticCurveTo(-0.14, -0.083, 0, -0.07);
  shape.quadraticCurveTo(0.14, -0.083, 0.3, -0.058);
  shape.lineTo(0.3, -0.2);
  const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape, 12), new THREE.MeshBasicMaterial({ color: 0xb4dcee, side: THREE.DoubleSide }));
  mesh.position.z = -0.14;
  const edge = new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(new THREE.Vector3(-0.3, -0.058, 0), new THREE.Vector3(0, -0.095, 0), new THREE.Vector3(0.3, -0.058, 0)), 12, 0.0025, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  edge.position.z = -0.1395;
  const g = new THREE.Group();
  g.add(mesh, edge);
  return g;
}

/** the rim of safety goggles around the edge of the view */
function makeWornGoggles(): THREE.Object3D {
  const g = new THREE.Group();
  const m = new THREE.MeshBasicMaterial({ color: 0x24323a });
  const z = -0.12;
  const hh = 0.084; // half height of the view at this depth
  const hw = 0.124; // for an aspect of 1.5; the group is stretched to the real aspect
  for (const [w, h, x, y] of [[0.5, 0.016, 0, hh - 0.004], [0.014, 0.2, -hw, 0], [0.014, 0.2, hw, 0]] as const) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.004), m);
    bar.position.set(x, y, z);
    g.add(bar);
  }
  const lens = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.25), new THREE.MeshBasicMaterial({ color: 0xcfe9f5, transparent: true, opacity: 0.09, depthWrite: false }));
  lens.position.z = -0.119;
  g.add(lens);
  return g;
}

const IDLE_R: HandPose = { pos: [0.16, -0.52, -0.3], rot: [0.5, 0, 0], curl: [0.3, 0.35, 0.35, 0.35, 0.35], spread: 0 };

export const mirrorHand = (h: HandPose): HandPose => ({ pos: [-h.pos[0], h.pos[1], h.pos[2]], rot: [h.rot[0], -h.rot[1], -h.rot[2]], curl: h.curl, spread: h.spread, tilt: -(h.tilt ?? 0), lean: h.lean ?? 0 });
export const IDLE_POSE: HandsPose = { r: IDLE_R, l: mirrorHand(IDLE_R), foam: 0, held: null, wet: 0 };

interface HandState {
  pos: THREE.Vector3;
  quat: THREE.Quaternion;
  curl: number[];
  spread: number;
}

const xAxis = new THREE.Vector3(1, 0, 0);
const zAxis = new THREE.Vector3(0, 0, 1);
const toQuat = (h: HandPose) => {
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(h.rot[0], h.rot[1], h.rot[2], 'YXZ'));
  if (h.tilt) q.premultiply(new THREE.Quaternion().setFromAxisAngle(zAxis, h.tilt));
  if (h.lean) q.premultiply(new THREE.Quaternion().setFromAxisAngle(xAxis, h.lean));
  return q;
};

/**
 * The nurse's own hands, drawn over the room in a second pass (so they never clip into walls). Give it a target pose
 * every frame and it moves there smoothly, finger by finger.
 */
export class Hands {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(70, 1, 0.02, 4);
  /** true while anything of the hands can be on screen */
  visible = false;

  private right: HandRig;
  private left: HandRig;
  private skinR = new THREE.MeshStandardMaterial({ color: SKIN, roughness: 0.62, metalness: 0 });
  private skinL = new THREE.MeshStandardMaterial({ color: SKIN, roughness: 0.62, metalness: 0 });
  private glovesOn = { r: false, l: false };
  private worn = new THREE.Group();
  private maskWorn: THREE.Object3D;
  private gogglesWorn: THREE.Object3D;
  private state: { r: HandState; l: HandState };
  private target: HandsPose = IDLE_POSE;
  private foam = 0;
  private wet = 0;
  private wanted = false;

  constructor() {
    this.scene.add(new THREE.HemisphereLight(0xfff3e8, 0x7d8c94, 1.5));
    const key = new THREE.DirectionalLight(0xffffff, 2.1);
    key.position.set(-0.5, 1, 0.7);
    const fill = new THREE.DirectionalLight(0xcfe3ff, 0.7);
    fill.position.set(0.8, -0.2, 0.5);
    this.scene.add(key, fill);

    const arm = new THREE.MeshStandardMaterial({ color: SKIN, roughness: 0.64 });
    const sleeve = new THREE.MeshLambertMaterial({ color: SLEEVE });
    const foam = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.12, emissive: 0x3a3f44 });
    const glove = new THREE.MeshStandardMaterial({ color: GLOVE, roughness: 0.35 });
    const nail = new THREE.MeshStandardMaterial({ color: NAIL, roughness: 0.3 });
    this.skinArm = arm;
    this.glove = glove;
    this.right = new HandRig(1, this.skinR, arm, sleeve, foam, glove, nail);
    this.left = new HandRig(-1, this.skinL, arm, sleeve, foam, glove, nail);
    this.scene.add(this.right.root, this.left.root);
    this.maskWorn = makeWornMask();
    this.gogglesWorn = makeWornGoggles();
    this.worn.add(this.maskWorn, this.gogglesWorn);
    this.maskWorn.visible = false;
    this.gogglesWorn.visible = false;
    this.scene.add(this.worn);
    const init = (h: HandPose): HandState => ({ pos: new THREE.Vector3(...h.pos), quat: toQuat(h), curl: [...h.curl], spread: h.spread });
    this.state = { r: init(IDLE_POSE.r), l: init(IDLE_POSE.l) };
    this.place();
  }

  private skinArm: THREE.MeshStandardMaterial;
  private glove: THREE.MeshStandardMaterial;

  /** Hands in the gloves (blue nitrile) or bare, each hand on its own. */
  setGloves(on: boolean | { r: boolean; l: boolean }): void {
    const g = typeof on === 'boolean' ? { r: on, l: on } : on;
    this.glovesOn = g;
    for (const [mat, rig, v] of [[this.skinR, this.right, g.r], [this.skinL, this.left, g.l]] as const) {
      mat.color.setHex(v ? GLOVE : SKIN);
      rig.cuff.visible = v;
    }
  }

  get gloved(): { r: boolean; l: boolean } {
    return this.glovesOn;
  }

  get maskOn(): boolean {
    return this.maskWorn.visible;
  }

  get gogglesOn(): boolean {
    return this.gogglesWorn.visible;
  }

  /** The mask and goggles the nurse is wearing show at the edge of the view. */
  setWorn(mask: boolean, goggles: boolean): void {
    this.maskWorn.visible = mask;
    this.gogglesWorn.visible = goggles;
  }

  setAspect(aspect: number): void {
    this.gogglesWorn.scale.x = aspect / 1.5;
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  /** Raise the hands into view (on) or lower them out of it (off). */
  show(on: boolean): void {
    this.wanted = on;
    if (on) this.visible = true;
    else this.target = IDLE_POSE;
  }

  setPose(p: HandsPose): void {
    this.target = p;
  }

  private gesture: { fn: (u: number) => HandsPose; sec: number; t: number } | null = null;

  /** A short free-standing movement (reaching for something on a table): plays once, then the hands go down. */
  playGesture(sec: number, fn: (u: number) => HandsPose): void {
    this.gesture = { fn, sec, t: 0 };
    this.show(true);
    this.setPose(fn(0));
  }

  /** Jump straight to the target (no smoothing). */
  snap(): void {
    this.step(1);
  }

  update(dt: number): void {
    if (!this.visible) return;
    if (this.gesture) {
      const g = this.gesture;
      g.t += dt;
      if (g.t >= g.sec) {
        this.gesture = null;
        this.show(false);
      } else {
        this.setPose(g.fn(g.t / g.sec));
      }
    }
    this.step(1 - Math.exp(-14 * dt));
    if (!this.wanted && this.state.r.pos.y < -0.45 && this.state.l.pos.y < -0.45) this.visible = false;
  }

  /** Where a world position appears in the hands' view space, `depth` metres in front of the eye (so a hand can reach for it). */
  viewPoint(world: THREE.Vector3, camera: THREE.PerspectiveCamera, depth: number): Vec3 {
    const v = world.clone().project(camera);
    const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const x = THREE.MathUtils.clamp(v.x * t * camera.aspect * depth, -0.34, 0.34);
    const y = THREE.MathUtils.clamp(v.y * t * depth, -0.24, 0.24);
    return [x, y, -depth];
  }

  dispose(): void {
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
    });
    const mats = new Set<THREE.Material>();
    this.scene.traverse((o) => {
      const mat = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((x) => mats.add(x));
      else if (mat) mats.add(mat);
    });
    mats.forEach((m) => m.dispose());
  }

  private step(k: number): void {
    const t = this.target;
    for (const [key, hand] of [['r', t.r], ['l', t.l]] as const) {
      const s = this.state[key];
      s.pos.lerp(new THREE.Vector3(...hand.pos), k);
      s.quat.slerp(toQuat(hand), k);
      for (let i = 0; i < 5; i++) s.curl[i] += (hand.curl[i] - s.curl[i]) * k;
      s.spread += (hand.spread - s.spread) * k;
    }
    this.foam += (t.foam - this.foam) * Math.min(1, k * 0.5);
    this.wet += ((t.wet ?? 0) - this.wet) * Math.min(1, k * 0.4);
    // wet skin is shinier (gloves are always a little shiny)
    const rough = THREE.MathUtils.lerp(0.62, 0.3, this.wet);
    this.skinR.roughness = this.glovesOn.r ? 0.35 : rough;
    this.skinL.roughness = this.glovesOn.l ? 0.35 : rough;
    this.skinArm.roughness = rough;
    const held = t.held ?? (t.towel ? 'towel' : null);
    const inRight = (t.heldIn ?? 'r') === 'r';
    this.right.setHeld(inRight ? held : null, t.squeeze ?? 0);
    this.left.setHeld(inRight ? null : held, t.squeeze ?? 0);
    this.place();
  }

  private place(): void {
    for (const [rig, s] of [[this.right, this.state.r], [this.left, this.state.l]] as const) {
      rig.root.position.copy(s.pos);
      rig.root.quaternion.copy(s.quat);
      rig.setFingers(s.curl, s.spread);
      rig.setFoam(this.foam);
    }
  }
}
