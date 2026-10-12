import * as THREE from 'three';
import type { PatientProfile } from '../../domain/patient/types';
import type { OxygenSetup } from '../../domain/physiology/oxygen';
import { BED_POS, IV_POS, MONITOR_POS, OXYGEN_POS, ROOM, rectAround, type Rect } from '../layout';
import { createBed, type BedRig } from './Bed';
import { Cable } from './Cable';
import { buildEmergencyRoom } from './EmergencyRoom';
import { createIVStand, type IvRig } from './IVStand';
import { createMedicationCart, type MedCartRig } from './MedicationCart';
import { createOxygenDevice, type OxygenRig } from './OxygenDevice';
import { createPatient, type PatientRig } from './Patient';
import { makeHighlightable } from './models';
import { createPatientMonitor, type PatientMonitor } from './PatientMonitor';
import { createPrivacyCurtains, type CurtainRig } from './PrivacyCurtains';

export interface ClinicalScene {
  scene: THREE.Scene;
  colliders: Rect[];
  bounds: Rect;
  bed: BedRig;
  patient: PatientRig;
  monitor: PatientMonitor;
  oxygen: OxygenRig;
  iv: IvRig;
  curtains: CurtainRig;
  medCart: MedCartRig;
  sanitizer: { root: THREE.Object3D; setHighlight(on: boolean): void } | null;
  setLegAngle(angle: number): void;
  setHeadAngle(angle: number): void;
  setOxygenVisual(setup: OxygenSetup | null): void;
}

const world = (o: THREE.Object3D) => o.getWorldPosition(new THREE.Vector3());
const sagged = (a: THREE.Vector3, b: THREE.Vector3, sag: number) => {
  const mid = a.clone().lerp(b, 0.5);
  mid.y -= sag;
  return [a, mid, b];
};

/** Assembles the whole room. Add new equipment here. */
export function buildClinicalScene(profile: PatientProfile, options: { glucometer?: boolean } = {}): ClinicalScene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xdfe8ea);

  // Lights: no shadows and only two lights, to stay cheap on integrated GPUs
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb8c4c8, 2.3));
  const sun = new THREE.DirectionalLight(0xffffff, 1.1);
  sun.position.set(1.5, 6, 2.5);
  scene.add(sun);

  const room = buildEmergencyRoom(profile, options);
  scene.add(room.group);
  const colliders = [...room.colliders];

  const bed = createBed();
  bed.group.position.copy(BED_POS);
  scene.add(bed.group);
  colliders.push(rectAround(BED_POS.x, BED_POS.z + 0.05, 0.55, 1.1));

  const patient = createPatient(profile.appearance);
  patient.group.position.copy(BED_POS);
  scene.add(patient.group);

  const monitor = createPatientMonitor();
  monitor.display.setTitle(profile.bedLabel);
  monitor.group.position.copy(MONITOR_POS);
  monitor.group.rotation.y = -0.5;
  scene.add(monitor.group);
  colliders.push(rectAround(MONITOR_POS.x, MONITOR_POS.z, 0.28, 0.28));

  const curtains = createPrivacyCurtains(ROOM.height);
  scene.add(curtains.group);
  colliders.push(...curtains.colliders); // same objects: the rig switches them on and off

  const iv = createIVStand();
  iv.group.position.copy(IV_POS);
  scene.add(iv.group);
  colliders.push(rectAround(IV_POS.x, IV_POS.z, 0.3, 0.3));

  // Medication cart in the back right corner of the bed area, drawers facing the bed
  const medCart = createMedicationCart();
  medCart.group.position.set(3.6, 0, -2.3);
  medCart.group.rotation.y = -Math.PI / 2;
  scene.add(medCart.group);
  colliders.push({ minX: 3.3, maxX: 3.9, minZ: -2.65, maxZ: -1.95 });

  const oxygen = createOxygenDevice();
  oxygen.group.position.copy(OXYGEN_POS);
  scene.add(oxygen.group);
  colliders.push(rectAround(OXYGEN_POS.x, OXYGEN_POS.z, 0.15, 0.15));
  scene.updateMatrixWorld(true);

  // Lines that follow the patient when the bed back is raised
  const rel = (o: THREE.Vector3, x: number, y: number, z: number) => new THREE.Vector3(o.x + x, y, o.z + z);
  const cables: Cable[] = [];
  const addCable = (points: () => THREE.Vector3[], radius: number, color: number) => {
    const c = new Cable(points, radius, color);
    scene.add(c.mesh);
    cables.push(c);
    return c;
  };

  addCable(
    () => {
      const from = world(iv.bagPort);
      const to = world(patient.ivAnchor);
      const at = (k: number, y: number, dz: number) => new THREE.Vector3(from.x + (to.x - from.x) * k, y, from.z + (to.z - from.z) * k + dz);
      return [from, at(0, 1.5, 0.06), at(0.25, 1.2, 0.12), at(0.6, 1.0, 0.08), at(0.85, 0.93, 0.02), to];
    },
    0.005,
    0xeaf6fb,
  );

  const oxygenTube = addCable(() => {
    const m = world(patient.maskAnchor);
    const reg = world(oxygen.outlet);
    return [
      m,
      new THREE.Vector3(m.x - 0.12, m.y - 0.07, m.z - 0.03),
      new THREE.Vector3(m.x + (reg.x - m.x) * 0.45, 0.5 * (m.y + 0.9), (m.z + reg.z) / 2),
      new THREE.Vector3(m.x + (reg.x - m.x) * 0.85, 0.7, reg.z),
      reg,
    ];
  }, 0.007, 0xb7e4cf);
  oxygenTube.mesh.visible = false;

  const leadColors = [0xe0e0e0, 0x303030, 0xc0392b];
  patient.electrodes.forEach((e, i) => addCable(() => sagged(world(e), world(monitor.cableSocket), 0.15), 0.0035, leadColors[i]));
  addCable(() => sagged(world(patient.probeAnchor), world(monitor.cableSocket), 0.2), 0.004, 0x37474f);
  addCable(() => sagged(world(patient.cuffAnchor), world(monitor.cableSocket), 0.25), 0.006, 0x90a4ae);

  return {
    scene,
    colliders,
    bounds: room.bounds,
    bed,
    patient,
    monitor,
    oxygen,
    iv,
    curtains,
    medCart,
    sanitizer: room.sanitizer ? { root: room.sanitizer, setHighlight: makeHighlightable(room.sanitizer) } : null,
    setLegAngle(angle) {
      bed.setLegAngle(angle);
      patient.setLegAngle(angle);
    },
    setHeadAngle(angle) {
      bed.setHeadAngle(angle);
      patient.setHeadAngle(angle);
      scene.updateMatrixWorld(true);
      cables.forEach((c) => c.update());
    },
    setOxygenVisual(setup) {
      patient.setOxygenVisual(setup?.device ?? null);
      oxygen.setFlow(setup?.flowLpm ?? 0);
      oxygenTube.mesh.visible = setup !== null;
    },
  };
}
