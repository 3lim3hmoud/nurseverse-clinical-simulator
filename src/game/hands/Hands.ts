import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export type Vec3 = [number, number, number];

/** Where one hand is (in the nurse's view space: x right, y up, -z forward, metres) and how its fingers are bent. */
export interface HandPose {
  pos: Vec3;
  /** Euler angles, applied roll (z) first, then pitch (x), then yaw (y). Neutral: fingers point away, palm faces down. */
  rot: Vec3;
  /** 0 = straight, 1 = fully curled: thumb, index, middle, ring, little finger */
  curl: [number, number, number, number, number];
  /** 0 = fingers together, 1 = fanned out */
  spread: number;
}

export interface HandsPose {
  r: HandPose;
  l: HandPose;
  /** soap lather on the hands, 0..1 */
  foam: number;
  /** a paper towel in the right hand */
  towel: boolean;
}

const SKIN = 0xd9a47a;
const GLOVE = 0x62b8ea;
const SLEEVE = 0x1b8f93;

interface FingerSpec {
  x: number;
  z: number;
  len: [number, number, number];
  r: number;
  /** how far each joint can bend at curl = 1 */
  max: [number, number, number];
  spreadAngle: number;
}

// Right hand, palm down, fingers toward -z, thumb on the -x side. The left hand is built mirrored.
const FINGERS: FingerSpec[] = [
  { x: -0.042, z: -0.03, len: [0.034, 0.03, 0.024], r: 0.0108, max: [0.5, 0.8, 0.7], spreadAngle: 0 },
  { x: -0.031, z: -0.093, len: [0.04, 0.024, 0.02], r: 0.0093, max: [1.35, 1.7, 1.2], spreadAngle: 0.22 },
  { x: -0.011, z: -0.096, len: [0.044, 0.027, 0.021], r: 0.0096, max: [1.35, 1.7, 1.2], spreadAngle: 0.05 },
  { x: 0.009, z: -0.093, len: [0.04, 0.025, 0.02], r: 0.0089, max: [1.35, 1.7, 1.2], spreadAngle: -0.1 },
  { x: 0.027, z: -0.087, len: [0.032, 0.019, 0.017], r: 0.0079, max: [1.35, 1.7, 1.2], spreadAngle: -0.25 },
];

/** soap lather blobs: x, y (palm side < 0, back side > 0), z, radius */
const FOAM_SPOTS: [number, number, number, number][] = [
  [-0.02, -0.014, -0.04, 0.02], [0.02, -0.014, -0.05, 0.02], [0, -0.014, -0.075, 0.018], [-0.03, -0.012, -0.09, 0.012], [0.03, -0.012, -0.085, 0.012],
  [-0.02, 0.014, -0.04, 0.02], [0.02, 0.014, -0.05, 0.02], [0, 0.014, -0.075, 0.018], [-0.03, 0.013, -0.1, 0.012], [0.01, 0.013, -0.11, 0.012], [0.03, 0.013, -0.09, 0.012],
  [-0.03, 0.01, -0.13, 0.009], [-0.011, 0.01, -0.14, 0.009], [0.009, 0.01, -0.135, 0.009], [0.027, 0.01, -0.12, 0.008],
];

interface Finger {
  base: THREE.Group;
  joints: THREE.Group[];
  spec: FingerSpec;
}

class HandRig {
  readonly root = new THREE.Group();
  private fingers: Finger[] = [];
  private foam: { mesh: THREE.Mesh; size: number }[] = [];
  readonly towel: THREE.Mesh;
  readonly cuff: THREE.Mesh;

  constructor(private side: 1 | -1, handMat: THREE.Material, armMat: THREE.Material, sleeveMat: THREE.Material, foamMat: THREE.Material, glove: THREE.Material) {
    const s = side;
    const palm = new THREE.Mesh(new RoundedBoxGeometry(0.082, 0.022, 0.092, 2, 0.008), handMat);
    palm.position.set(0, 0, -0.047);
    this.root.add(palm);
    this.root.scale.setScalar(1.1);

    for (const [i, spec] of FINGERS.entries()) {
      const base = new THREE.Group();
      base.rotation.order = 'YXZ';
      base.position.set(s * spec.x, i === 0 ? -0.004 : 0, spec.z);
      const joints: THREE.Group[] = [];
      let parent: THREE.Object3D = base;
      for (let j = 0; j < 3; j++) {
        const joint = new THREE.Group();
        if (j > 0) joint.position.z = -spec.len[j - 1];
        parent.add(joint);
        const seg = new THREE.Mesh(new THREE.CapsuleGeometry(spec.r * (1 - j * 0.07), spec.len[j], 3, 8), handMat);
        seg.rotation.x = Math.PI / 2;
        seg.position.z = -spec.len[j] / 2;
        joint.add(seg);
        joints.push(joint);
        parent = joint;
      }
      this.root.add(base);
      this.fingers.push({ base, joints, spec });
    }

    // forearm, scrub sleeve and glove cuff run toward the camera (they leave the screen at the bottom)
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.032, 0.42, 14), armMat);
    arm.rotation.x = Math.PI / 2;
    arm.position.z = 0.21;
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.05, 0.14, 16), sleeveMat);
    sleeve.rotation.x = Math.PI / 2;
    sleeve.position.z = 0.38;
    this.cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.036, 0.11, 14), glove);
    this.cuff.rotation.x = Math.PI / 2;
    this.cuff.position.z = 0.04;
    this.cuff.visible = false;
    this.root.add(arm, sleeve, this.cuff);

    for (const [x, y, z, r] of FOAM_SPOTS) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), foamMat);
      m.position.set(s * x, y, z);
      m.visible = false;
      this.root.add(m);
      this.foam.push({ mesh: m, size: r });
    }

    this.towel = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.003, 0.2), new THREE.MeshLambertMaterial({ color: 0xf6f4ee }));
    this.towel.position.set(0, -0.019, -0.075);
    this.towel.visible = false;
    this.root.add(this.towel);
  }

  /** Bend the fingers (curl 0..1 each) and fan them out. */
  setFingers(curl: readonly number[], spread: number): void {
    const s = this.side;
    this.fingers.forEach((f, i) => {
      const c = curl[i];
      if (i === 0) {
        f.base.rotation.set(-0.3 * c, s * (0.55 - c * 1.2 + spread * 0.25), 0);
      } else {
        f.base.rotation.set(0, s * f.spec.spreadAngle * spread, 0);
      }
      f.joints.forEach((j, k) => {
        j.rotation.x = -c * f.spec.max[k];
      });
    });
  }

  setFoam(level: number): void {
    this.foam.forEach((f, i) => {
      const v = THREE.MathUtils.clamp(level * 1.25 - (i % 5) * 0.06, 0, 1);
      f.mesh.visible = v > 0.03;
      f.mesh.scale.setScalar(f.size * (0.4 + v * 0.5));
    });
  }
}

const IDLE_R: HandPose = { pos: [0.16, -0.52, -0.3], rot: [0.5, 0, 0], curl: [0.3, 0.35, 0.35, 0.35, 0.35], spread: 0 };

export const mirrorHand = (h: HandPose): HandPose => ({ pos: [-h.pos[0], h.pos[1], h.pos[2]], rot: [h.rot[0], -h.rot[1], -h.rot[2]], curl: h.curl, spread: h.spread });
export const IDLE_POSE: HandsPose = { r: IDLE_R, l: mirrorHand(IDLE_R), foam: 0, towel: false };

interface HandState {
  pos: THREE.Vector3;
  quat: THREE.Quaternion;
  curl: number[];
  spread: number;
}

const toQuat = (rot: Vec3) => new THREE.Quaternion().setFromEuler(new THREE.Euler(rot[0], rot[1], rot[2], 'YXZ'));

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
  private handMat = new THREE.MeshLambertMaterial({ color: SKIN });
  private glove = new THREE.MeshLambertMaterial({ color: GLOVE });
  private state: { r: HandState; l: HandState };
  private target: HandsPose = IDLE_POSE;
  private foam = 0;
  private wanted = false;

  constructor() {
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x8a9aa2, 2.4));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(0.3, 1, 0.6);
    this.scene.add(sun);

    const arm = new THREE.MeshLambertMaterial({ color: SKIN });
    const sleeve = new THREE.MeshLambertMaterial({ color: SLEEVE });
    const foam = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x555555 });
    this.right = new HandRig(1, this.handMat, arm, sleeve, foam, this.glove);
    this.left = new HandRig(-1, this.handMat, arm, sleeve, foam, this.glove);
    this.scene.add(this.right.root, this.left.root);
    const init = (h: HandPose): HandState => ({ pos: new THREE.Vector3(...h.pos), quat: toQuat(h.rot), curl: [...h.curl], spread: h.spread });
    this.state = { r: init(IDLE_POSE.r), l: init(IDLE_POSE.l) };
    this.place();
  }

  /** Hands in the gloves (blue nitrile) or bare. */
  setGloves(on: boolean): void {
    this.handMat.color.setHex(on ? GLOVE : SKIN);
    this.right.cuff.visible = on;
    this.left.cuff.visible = on;
  }

  setAspect(aspect: number): void {
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

  /** Jump straight to the target (no smoothing). */
  snap(): void {
    this.step(1);
  }

  update(dt: number): void {
    if (!this.visible) return;
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
      const mat = m.material as THREE.Material | undefined;
      if (mat) mat.dispose();
    });
  }

  private step(k: number): void {
    const t = this.target;
    for (const [key, hand] of [['r', t.r], ['l', t.l]] as const) {
      const s = this.state[key];
      s.pos.lerp(new THREE.Vector3(...hand.pos), k);
      s.quat.slerp(toQuat(hand.rot), k);
      for (let i = 0; i < 5; i++) s.curl[i] += (hand.curl[i] - s.curl[i]) * k;
      s.spread += (hand.spread - s.spread) * k;
    }
    this.foam += (t.foam - this.foam) * Math.min(1, k * 0.5);
    this.right.towel.visible = t.towel;
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
