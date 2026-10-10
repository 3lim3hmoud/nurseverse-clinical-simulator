import * as THREE from 'three';
import { blobShadow, box, cyl, lambert, sphere } from './helpers';
import { cloneModel, findMesh, localBox, ownMaterial } from './models';

export interface IvRig {
  group: THREE.Group;
  bagPort: THREE.Object3D; // where the infusion line leaves the bag
  setLevel(fraction: number): void; // fluid left in the bag, 0..1
  setRunning(on: boolean): void;
  setHighlight(on: boolean): void;
  update(dt: number): void;
}

/** IV pole with bag, drip chamber and infusion pump. Origin = floor, pump faces +z. */
export function createIVStand(): IvRig {
  return createFromModel() ?? createProcedural();
}

function createFromModel(): IvRig | null {
  const model = cloneModel('ivStand');
  const bag = model ? findMesh(model, 'IVBag0') : undefined;
  if (!model || !bag) return null;

  const g = new THREE.Group();
  g.add(blobShadow(0.9, 0.9, 0, 0));

  // The bag hangs from its top, so it shrinks downwards: scale a pivot placed at the top edge
  const bagBox = localBox(model, 'IVBag0')!;
  const pivot = new THREE.Group();
  pivot.position.set((bagBox.min.x + bagBox.max.x) / 2, bagBox.max.y, (bagBox.min.z + bagBox.max.z) / 2);
  model.add(pivot);
  pivot.attach(bag);

  const bagPort = new THREE.Object3D();
  const portBox = localBox(model, 'IVPort0');
  bagPort.position.copy(portBox ? new THREE.Vector3((portBox.min.x + portBox.max.x) / 2, portBox.min.y, (portBox.min.z + portBox.max.z) / 2) : new THREE.Vector3(-0.14, 1.66, 0));
  model.add(bagPort);

  const chamber = localBox(model, 'DripChamber');
  const dropX = chamber ? (chamber.min.x + chamber.max.x) / 2 : 0;
  const dropZ = chamber ? (chamber.min.z + chamber.max.z) / 2 : -0.03;
  const dropTop = chamber ? chamber.max.y - 0.02 : 1.61;
  const dropSpan = chamber ? Math.max(0.03, chamber.max.y - chamber.min.y - 0.05) : 0.05;
  const drop = sphere(0.004, 0x66c8e8, dropX, dropTop, dropZ, 6);
  drop.visible = false;
  model.add(drop);

  const pumpMat = ownMaterial(model, 'Pump');
  const screenMat = ownMaterial<THREE.MeshBasicMaterial>(model, 'PumpScreen');
  const ledMat = ownMaterial(model, 'PumpLED');
  const ledOff = ledMat ? { color: ledMat.color.clone(), emissive: ledMat.emissive.clone() } : null;
  screenMat?.color.setHex(0x6b777d);

  model.rotation.y = Math.PI; // models face -z, the pump must face +z
  g.add(model);

  // Invisible, larger hit area so the pole is easy to target
  const hit = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2.0, 0.6), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.y = 1.0;
  g.add(hit);

  let time = 0;
  let running = false;
  return {
    group: g,
    bagPort,
    setLevel(fraction) {
      pivot.scale.y = Math.max(0.02, Math.min(1, fraction));
    },
    setRunning(on) {
      running = on;
      drop.visible = on;
      screenMat?.color.setHex(on ? 0xffffff : 0x6b777d);
      if (ledMat && ledOff) {
        ledMat.color.copy(on ? new THREE.Color(0x2bd67b) : ledOff.color);
        ledMat.emissive.copy(on ? new THREE.Color(0x14a85a) : ledOff.emissive);
      }
    },
    setHighlight(on) {
      pumpMat?.emissive.setHex(on ? 0x1b8f93 : 0x000000);
    },
    update(dt) {
      if (!running) return;
      time += dt;
      drop.position.y = dropTop - ((time * 2.5) % 1) * dropSpan;
    },
  };
}

function createProcedural(): IvRig {
  const g = new THREE.Group();
  const STEEL = 0xc5ced2;

  g.add(blobShadow(0.9, 0.9, 0, 0));

  // Five-leg base
  for (let i = 0; i < 5; i++) {
    const leg = new THREE.Group();
    leg.rotation.y = (i * Math.PI * 2) / 5;
    leg.add(box(0.3, 0.025, 0.04, STEEL, 0.15, 0.06, 0));
    leg.add(sphere(0.03, 0x37474f, 0.3, 0.03, 0, 8));
    g.add(leg);
  }
  g.add(cyl(0.05, 0.06, 0.06, STEEL, 0, 0.07, 0));
  g.add(cyl(0.012, 0.012, 1.9, STEEL, 0, 1.0, 0, 1, 8)); // pole
  g.add(box(0.5, 0.02, 0.02, STEEL, 0, 1.95, 0)); // hook bar
  g.add(sphere(0.02, STEEL, -0.22, 1.95, 0, 8));
  g.add(sphere(0.02, STEEL, 0.22, 1.95, 0, 8));

  // Fluid bag hanging from the centre hook
  g.add(box(0.13, 0.22, 0.03, 0xdff5ff, 0, 1.77, 0, 0.5));
  const fluidGeo = new THREE.BoxGeometry(0.115, 0.15, 0.026);
  fluidGeo.translate(0, 0.075, 0); // origin at the bottom so scaling shrinks it downwards
  const fluid = new THREE.Mesh(fluidGeo, lambert(0xbfe6f2, { opacity: 0.85 }));
  fluid.position.set(0, 1.655, 0);
  g.add(fluid);
  g.add(box(0.1, 0.05, 0.032, 0xffffff, 0, 1.82, 0));
  g.add(box(0.1, 0.012, 0.034, 0x2c7fb8, 0, 1.8, 0));
  g.add(cyl(0.01, 0.01, 0.04, 0xeaf6fb, 0, 1.64, 0, 1, 8));

  // Drip chamber + falling drop + roller clamp
  g.add(cyl(0.018, 0.018, 0.09, 0xeaf6fb, 0, 1.55, 0.02, 0.6, 8));
  const drop = sphere(0.004, 0x66c8e8, 0, 1.58, 0.02, 6);
  drop.visible = false;
  g.add(drop);
  g.add(box(0.03, 0.05, 0.03, 0x2c7fb8, 0.0, 1.38, 0.03));

  // Infusion pump (own materials so the screen and body can change)
  const pumpMat = new THREE.MeshLambertMaterial({ color: 0xf4f6f7 });
  const pump = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.17, 0.13), pumpMat);
  pump.position.set(0, 1.15, 0.05);
  g.add(pump);
  const screenMat = new THREE.MeshBasicMaterial({ color: 0x55636a });
  const screen = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.07, 0.005), screenMat);
  screen.position.set(0, 1.18, 0.117);
  g.add(screen);
  g.add(box(0.14, 0.02, 0.005, 0x37474f, 0, 1.1, 0.117));

  // Invisible, larger hit area so the pole is easy to target
  const hit = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2.0, 0.6), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.y = 1.0;
  g.add(hit);

  const bagPort = new THREE.Object3D();
  bagPort.position.set(0, 1.64, 0);
  g.add(bagPort);

  let time = 0;
  let running = false;
  return {
    group: g,
    bagPort,
    setLevel(fraction) {
      fluid.scale.y = Math.max(0.02, Math.min(1, fraction));
    },
    setRunning(on) {
      running = on;
      drop.visible = on;
      screenMat.color.setHex(on ? 0x1f8a5b : 0x55636a);
    },
    setHighlight(on) {
      pumpMat.emissive.setHex(on ? 0x1b8f93 : 0x000000);
    },
    update(dt) {
      if (!running) return;
      time += dt;
      drop.position.y = 1.585 - ((time * 2.5) % 1) * 0.07;
    },
  };
}
