import * as THREE from 'three';
import { box, cyl } from './helpers';

export interface HandWashSink {
  /** The whole unit, origin on the floor, the nurse stands on its +z side. */
  group: THREE.Group;
  /** Running water on or off. */
  setWater(on: boolean): void;
  update(dt: number): void;
  /** Where things are, in the unit's own space (add the unit's position for the room). */
  anchors: { standZ: number; basin: THREE.Vector3; tap: THREE.Vector3; soap: THREE.Vector3; towel: THREE.Vector3 };
}

/** A free-standing hand-wash station: a cabinet with a steel basin, a gooseneck tap, a soap pump, a paper-towel dispenser and a bin. */
export function buildHandWashSink(): HandWashSink {
  const g = new THREE.Group();
  g.name = 'hand-wash-sink';

  g.add(box(0.74, 0.78, 0.46, 0xe9eef0, 0, 0.42, 0)); // cabinet
  g.add(box(0.7, 0.06, 0.4, 0x607d8b, 0, 0.03, 0.01)); // kick plate
  g.add(box(0.82, 0.04, 0.52, 0xcfd8dc, 0, 0.83, 0)); // worktop
  g.add(box(0.5, 0.012, 0.32, 0xb0bec5, 0, 0.852, 0.02)); // basin
  g.add(box(0.44, 0.006, 0.26, 0x78909c, 0, 0.859, 0.02)); // basin floor (darker)
  g.add(cyl(0.022, 0.022, 0.012, 0x546e7a, 0, 0.861, 0.02, 1, 12)); // drain
  g.add(box(0.84, 0.5, 0.03, 0xdde6e8, 0, 1.1, -0.245)); // backsplash

  // gooseneck tap
  g.add(cyl(0.017, 0.02, 0.22, 0xb0bec5, 0, 0.96, -0.17, 1, 12));
  const arm = cyl(0.013, 0.013, 0.2, 0xb0bec5, 0, 1.065, -0.075, 1, 10);
  arm.rotation.x = Math.PI / 2;
  g.add(arm);
  g.add(cyl(0.02, 0.016, 0.03, 0x90a4ae, 0, 1.05, 0.015, 1, 10)); // spout tip
  g.add(box(0.012, 0.05, 0.03, 0x37474f, 0.045, 1.0, -0.17)); // lever

  // soap pump (left) and paper towels (right)
  g.add(box(0.075, 0.17, 0.065, 0xf5f7f8, -0.27, 1.12, -0.2));
  g.add(box(0.078, 0.04, 0.068, 0x2b8cc4, -0.27, 1.06, -0.2));
  g.add(cyl(0.008, 0.008, 0.05, 0x90a4ae, -0.27, 1.23, -0.2, 1, 8));
  g.add(box(0.05, 0.012, 0.03, 0x90a4ae, -0.27, 1.26, -0.18));
  g.add(box(0.26, 0.3, 0.1, 0xf5f7f8, 0.27, 1.15, -0.2));
  g.add(box(0.2, 0.02, 0.07, 0x78909c, 0.27, 0.99, -0.185));
  const sheet = box(0.16, 0.07, 0.004, 0xffffff, 0.27, 0.95, -0.17);
  g.add(sheet);
  g.add(cyl(0.14, 0.12, 0.42, 0x78909c, 0.62, 0.21, 0.02, 1, 16)); // bin
  g.add(cyl(0.145, 0.145, 0.025, 0x546e7a, 0.62, 0.43, 0.02, 1, 16));

  // water: a thin stream and a few drops that fall from the spout
  const waterMat = new THREE.MeshBasicMaterial({ color: 0x9fd8ff, transparent: true, opacity: 0.8, depthWrite: false });
  const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.007, 0.2, 8), waterMat);
  stream.position.set(0, 0.94, 0.02);
  stream.userData.ignoreRay = true;
  stream.visible = false;
  g.add(stream);
  const drops: THREE.Mesh[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new THREE.Mesh(new THREE.SphereGeometry(0.01, 6, 5), waterMat);
    d.userData.ignoreRay = true;
    d.visible = false;
    g.add(d);
    drops.push(d);
  }
  const splash = new THREE.Mesh(new THREE.CircleGeometry(0.05, 18), waterMat);
  splash.rotation.x = -Math.PI / 2;
  splash.position.set(0, 0.865, 0.02);
  splash.userData.ignoreRay = true;
  splash.visible = false;
  g.add(splash);

  let on = false;
  let time = 0;
  return {
    group: g,
    anchors: {
      standZ: 0.66,
      basin: new THREE.Vector3(0, 0.9, 0.02),
      tap: new THREE.Vector3(0, 1.04, 0.0),
      soap: new THREE.Vector3(-0.27, 1.2, -0.19),
      towel: new THREE.Vector3(0.27, 0.97, -0.17),
    },
    setWater(v) {
      on = v;
      stream.visible = v;
      splash.visible = v;
      drops.forEach((d) => (d.visible = v));
    },
    update(dt) {
      if (!on) return;
      time += dt;
      const wobble = 1 + 0.12 * Math.sin(time * 38);
      stream.scale.set(wobble, 1, wobble);
      splash.scale.setScalar(1 + 0.2 * Math.sin(time * 21));
      drops.forEach((d, i) => {
        const k = (time * 2.4 + i / drops.length) % 1;
        d.position.set(Math.sin(i * 2.1) * 0.012, 1.03 - k * 0.17, 0.02 + Math.cos(i * 1.7) * 0.01);
      });
    },
  };
}
