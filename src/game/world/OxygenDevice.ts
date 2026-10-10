import * as THREE from 'three';
import { blobShadow, box, canvasTexture, cyl, sphere } from './helpers';
import { cloneModel, findMesh, localBox, ownMaterial } from './models';

export interface OxygenRig {
  group: THREE.Group;
  outlet: THREE.Object3D; // where the tubing connects
  setFlow(lpm: number): void;
  setHighlight(on: boolean): void;
}

/** Oxygen cylinder with regulator and flowmeter. Origin = floor, gauge faces +z. */
export function createOxygenDevice(): OxygenRig {
  return createFromModels() ?? createProcedural();
}

const BODY_RADIUS = 0.085;
const FLOWMETER_Y = 0.28; // flowmeter origin height on the cylinder (sits below the pressure gauge)

/** GLB cylinder with the wall flowmeter clipped to its front. The float rides up the tube with the flow. */
function createFromModels(): OxygenRig | null {
  const cylinder = cloneModel('oxygenCylinder');
  const meter = cloneModel('oxygenFlowmeter');
  const floatMesh = meter ? findMesh(meter, 'Float') : undefined;
  if (!cylinder || !meter || !floatMesh) return null;

  const g = new THREE.Group();
  g.add(blobShadow(0.6, 0.6, 0, 0));

  const device = new THREE.Group();
  device.add(cylinder);
  meter.position.set(0, FLOWMETER_Y, -BODY_RADIUS);
  device.add(meter);

  const tube = localBox(meter, 'Tube');
  const fl = localBox(meter, 'Float');
  const baseY = floatMesh.position.y;
  const centerY = fl ? (fl.min.y + fl.max.y) / 2 : 0.17;
  const half = fl ? (fl.max.y - fl.min.y) / 2 : 0.01;
  const lowY = (tube ? tube.min.y : 0.03) + half + 0.004;
  const highY = (tube ? tube.max.y : 0.27) - half - 0.004;

  const outlet = new THREE.Object3D();
  const nip = localBox(meter, 'Nipple');
  const nipCenter = nip ? nip.getCenter(new THREE.Vector3()) : new THREE.Vector3(0.03, 0.05, -0.062);
  outlet.position.copy(nipCenter).add(meter.position);
  device.add(outlet);

  const bodyMat = ownMaterial(cylinder, 'Body.005');
  const plateMat = ownMaterial(meter, 'BackPlate');

  device.rotation.y = Math.PI; // models face -z, the gauge must face +z
  g.add(device);

  // Invisible, larger hit area so the device is easy to target
  const hit = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.3, 0.45), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.y = 0.65;
  g.add(hit);

  return {
    group: g,
    outlet,
    setFlow(lpm) {
      const t = Math.min(Math.max(lpm, 0), 15) / 15;
      floatMesh.position.y = baseY + (lowY + (highY - lowY) * t - centerY);
    },
    setHighlight(on) {
      const hex = on ? 0x1b8f93 : 0x000000;
      bodyMat?.emissive.setHex(hex);
      plateMat?.emissive.setHex(hex);
    },
  };
}

function createProcedural(): OxygenRig {
  const g = new THREE.Group();
  g.add(blobShadow(0.6, 0.6, 0, 0));

  g.add(cyl(0.11, 0.11, 0.03, 0x37474f, 0, 0.015, 0));
  const body = cyl(0.09, 0.09, 0.85, 0x2e9e5b, 0, 0.455, 0, 1, 18);
  g.add(body);
  const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.09, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2), body.material);
  shoulder.position.set(0, 0.88, 0);
  g.add(shoulder);
  g.add(cyl(0.03, 0.03, 0.08, 0xaab6bb, 0, 0.99, 0, 1, 10));

  const labelTex = canvasTexture(128, 64, (c) => {
    c.fillStyle = '#ffffff';
    c.fillRect(0, 0, 128, 64);
    c.fillStyle = '#1b5e3b';
    c.font = 'bold 40px "Segoe UI", Arial, sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('O₂', 64, 34);
  });
  const label = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.06), new THREE.MeshBasicMaterial({ map: labelTex }));
  label.position.set(0, 0.62, 0.0915);
  g.add(label);

  // Regulator block has its own material so it can glow when targeted
  const regMat = new THREE.MeshLambertMaterial({ color: 0xb0bec5 });
  const reg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), regMat);
  reg.position.set(0, 1.08, 0);
  g.add(reg);
  const gauge = cyl(0.04, 0.04, 0.025, 0xffffff, 0, 1.1, 0.06);
  gauge.rotation.x = Math.PI / 2;
  g.add(gauge);
  g.add(box(0.004, 0.03, 0.006, 0xd64545, 0.008, 1.108, 0.075));
  g.add(cyl(0.014, 0.014, 0.18, 0xeaf6fb, 0.07, 1.17, 0, 0.5, 8)); // flowmeter tube
  const ball = sphere(0.009, 0xffd23f, 0.07, 1.09, 0, 8);
  g.add(ball);
  g.add(cyl(0.01, 0.01, 0.04, 0xb0bec5, 0.07, 1.06, 0, 1, 8));

  const outlet = new THREE.Object3D();
  outlet.position.set(0.07, 1.06, 0);
  g.add(outlet);

  // Invisible, larger hit area so the device is easy to target
  const hit = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.3, 0.45), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.y = 0.65;
  g.add(hit);

  return {
    group: g,
    outlet,
    setFlow(lpm) {
      ball.position.y = 1.09 + (Math.min(lpm, 15) / 15) * 0.15;
    },
    setHighlight(on) {
      regMat.emissive.setHex(on ? 0x1b8f93 : 0x000000);
      (body.material as THREE.MeshLambertMaterial).emissive.setHex(0x000000);
    },
  };
}
