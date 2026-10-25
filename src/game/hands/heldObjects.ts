import * as THREE from 'three';

/** Things the nurse can hold in a hand. Each is built in the hand's own space: palm down, fingers toward -z. */
export type HeldKind = 'towel' | 'mask' | 'goggles' | 'glove' | 'catheter' | 'steth' | 'bag' | 'swab' | 'clip' | 'syringe' | 'box';

const mat = (color: number, o: Partial<THREE.MeshStandardMaterialParameters> = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.5, ...o });
const clear = (color: number, opacity: number) => mat(color, { transparent: true, opacity, roughness: 0.2 });

function add(g: THREE.Group, geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(geo, m);
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, rz);
  g.add(mesh);
  return mesh;
}

/** A tube along -z of the given length, starting at z0. */
const tube = (g: THREE.Group, r: number, len: number, m: THREE.Material, x: number, y: number, z0: number) =>
  add(g, new THREE.CylinderGeometry(r, r, len, 10), m, x, y, z0 - len / 2, Math.PI / 2);

export interface HeldSet {
  objects: Record<HeldKind, THREE.Group>;
  /** the bag squeezes (0 = relaxed, 1 = fully squeezed) */
  squeezeBag(v: number): void;
}

export function buildHeld(): HeldSet {
  const o = {} as Record<HeldKind, THREE.Group>;
  const make = (k: HeldKind) => {
    const g = new THREE.Group();
    g.visible = false;
    o[k] = g;
    return g;
  };

  // paper towel
  add(make('towel'), new THREE.BoxGeometry(0.17, 0.003, 0.2), new THREE.MeshLambertMaterial({ color: 0xf6f4ee }), 0, -0.021, -0.075);

  // surgical mask
  {
    const g = make('mask');
    add(g, new THREE.BoxGeometry(0.15, 0.004, 0.085), mat(0x9fd3e8), 0, -0.024, -0.07);
    add(g, new THREE.BoxGeometry(0.15, 0.0045, 0.01), mat(0xffffff), 0, -0.0245, -0.03);
    for (const x of [-0.085, 0.085]) add(g, new THREE.TorusGeometry(0.02, 0.0015, 6, 14), mat(0xffffff), x, -0.024, -0.07, Math.PI / 2);
  }

  // goggles
  {
    const g = make('goggles');
    const frame = mat(0x2a3942);
    for (const x of [-0.04, 0.04]) add(g, new THREE.TorusGeometry(0.03, 0.005, 8, 18), frame, x, -0.03, -0.07, Math.PI / 2);
    add(g, new THREE.BoxGeometry(0.03, 0.006, 0.006), frame, 0, -0.03, -0.07);
    add(g, new THREE.CylinderGeometry(0.0035, 0.0035, 0.1, 6), frame, -0.075, -0.03, -0.02, Math.PI / 2);
    add(g, new THREE.CylinderGeometry(0.0035, 0.0035, 0.1, 6), frame, 0.075, -0.03, -0.02, Math.PI / 2);
  }

  // a glove, held open by the cuff
  {
    const g = make('glove');
    const m = clear(0x69bff0, 0.9);
    add(g, new THREE.BoxGeometry(0.09, 0.014, 0.12), m, 0, -0.028, -0.085);
    for (let i = 0; i < 5; i++) add(g, new THREE.CapsuleGeometry(0.008, 0.045, 3, 6), m, -0.034 + i * 0.017, -0.028, -0.17 - (i === 0 || i === 4 ? 0 : 0.012), Math.PI / 2);
    add(g, new THREE.CylinderGeometry(0.047, 0.047, 0.03, 14), m, 0, -0.028, -0.01, Math.PI / 2);
  }

  // suction catheter: a long thin tube with a thumb port at the hub
  {
    const g = make('catheter');
    const m = clear(0xf4efc4, 0.95);
    tube(g, 0.0035, 0.34, m, 0, -0.018, -0.05);
    add(g, new THREE.CylinderGeometry(0.008, 0.006, 0.04, 10), mat(0x2b8cc4), 0, -0.018, -0.045, Math.PI / 2);
    add(g, new THREE.BoxGeometry(0.01, 0.006, 0.012), mat(0x2b8cc4), 0, -0.01, -0.04);
  }

  // stethoscope: the chest piece in the fingers, the tubing hanging behind
  {
    const g = make('steth');
    add(g, new THREE.CylinderGeometry(0.023, 0.023, 0.008, 18), mat(0xb7c4cc, { metalness: 0.7, roughness: 0.3 }), 0, -0.03, -0.1);
    add(g, new THREE.CylinderGeometry(0.012, 0.012, 0.01, 14), mat(0x35454e), 0, -0.025, -0.1);
    tube(g, 0.003, 0.14, mat(0x222a2e), 0, -0.02, 0.0).position.z += 0.05;
  }

  // Ambu bag with its mask
  let bagMesh: THREE.Mesh;
  {
    const g = make('bag');
    bagMesh = add(g, new THREE.SphereGeometry(0.05, 18, 12), clear(0xe8f4f8, 0.85), 0, -0.06, -0.06);
    bagMesh.scale.set(1, 0.85, 1.35);
    add(g, new THREE.CylinderGeometry(0.012, 0.012, 0.06, 10), mat(0x2b8cc4), 0, -0.05, -0.145, Math.PI / 2);
    add(g, new THREE.ConeGeometry(0.05, 0.06, 16, 1, true), clear(0x9fd3e8, 0.6), 0, -0.05, -0.21, -Math.PI / 2);
  }

  // oral swab: a stick with a pink sponge at the end
  {
    const g = make('swab');
    tube(g, 0.0035, 0.13, mat(0xf3f3ee), 0, -0.016, -0.05);
    add(g, new THREE.SphereGeometry(0.009, 8, 6), mat(0xf2a7b5), 0, -0.016, -0.185).scale.set(1, 1, 1.4);
  }

  // clipboard
  {
    const g = make('clip');
    add(g, new THREE.BoxGeometry(0.2, 0.01, 0.27), mat(0x8a5a2c), 0, -0.032, -0.1);
    add(g, new THREE.BoxGeometry(0.18, 0.003, 0.24), mat(0xffffff), 0, -0.0265, -0.1);
    add(g, new THREE.BoxGeometry(0.06, 0.012, 0.015), mat(0xb0b8bd, { metalness: 0.7 }), 0, -0.024, -0.215);
  }

  // syringe / cuff-pressure gauge
  {
    const g = make('syringe');
    tube(g, 0.009, 0.1, clear(0xf2f6f8, 0.9), 0, -0.02, -0.04);
    tube(g, 0.003, 0.05, mat(0xcfd8dc), 0, -0.02, 0.01);
    add(g, new THREE.CylinderGeometry(0.014, 0.014, 0.004, 14), mat(0x2b8cc4), 0, -0.02, 0.012, Math.PI / 2);
    add(g, new THREE.CylinderGeometry(0.02, 0.02, 0.012, 16), mat(0xffffff), 0, -0.035, -0.07);
  }

  // a small supply box (picked up from a table)
  add(make('box'), new THREE.BoxGeometry(0.08, 0.05, 0.1), mat(0x4f9d69), 0, -0.038, -0.07);

  return {
    objects: o,
    squeezeBag(v) {
      bagMesh.scale.set(1 + 0.15 * v, 0.85 - 0.3 * v, 1.35 - 0.45 * v);
    },
  };
}
