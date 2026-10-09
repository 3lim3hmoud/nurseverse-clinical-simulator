import * as THREE from 'three';
import { blobShadow, box, cyl } from './helpers';

export interface BedRig {
  group: THREE.Group;
  /** Raise the back section (radians, 0 = flat). The pivot sits at the hip, on the mattress surface. */
  setHeadAngle(angle: number): void;
  /** Raise the leg section (radians, 0 = flat). */
  setLegAngle(angle: number): void;
}

/** Hospital bed. Origin = floor level, centered. Head toward -z, mattress top at y = 0.77. */
export function createBed(): BedRig {
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
