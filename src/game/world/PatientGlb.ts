import * as THREE from 'three';
import type { PatientAppearance, Vitals } from '../../domain/patient/types';
import type { OxygenDevice } from '../../domain/physiology/oxygen';
import { cloneModel, cleanName, findMesh, localBox, mergeStaticMeshes } from './models';
import type { PatientRig } from './Patient';

// GLB coordinates: lying on the back with the head at +z; y = 0 is the mattress surface
const HINGE_Z = -0.08;
const BED_TOP_Y = 0.682;
const LOWER = ['Leg', 'Leg.001', 'FootUnderBlanket', 'FootUnderBlanket.001', 'Blanket', 'BlanketDrape', 'BlanketDrape.001', 'BlanketFold', 'BlanketStripe'].map(cleanName);
const FIXED = ['Pelvis'].map(cleanName);
const ANIMATED = ['Torso', 'Chest', 'BPCuff'].map(cleanName);

const lambertOf = (color: number, opacity = 1) => new THREE.MeshLambertMaterial({ color, transparent: opacity < 1, opacity, depthWrite: opacity >= 1 });

/** The GLB patient. Upper body and legs pivot at the hip; everything else mirrors the procedural patient's rig. */
export function createPatientFromModel(look: PatientAppearance): PatientRig | null {
  const model = cloneModel('patient');
  if (!model || !findMesh(model, 'Torso')) return null;
  model.updateMatrixWorld(true);

  // Anchor positions come from the model's own parts, measured before the body is split up
  const centre = (name: string, fallback: [number, number, number]) => {
    const box = localBox(model, name);
    return box ? box.getCenter(new THREE.Vector3()) : new THREE.Vector3(...fallback);
  };
  const hubAt = centre('CannulaHub', [0.275, 0.1, -0.01]);
  const probeAt = centre('PulseOximeter', [-0.275, 0.095, -0.035]);
  const cuffAt = centre('BPCuff', [-0.275, 0.075, 0.34]);
  const electrodeAt = ['Electrode', 'Electrode.001', 'Electrode.002'].map((n, i) => centre(n, [[-0.04, 0.215, 0.47], [0.04, 0.215, 0.47], [0, 0.215, 0.42]][i] as [number, number, number]));

  // ---- split into fixed / upper body / legs, each pivoting at the hip ----
  const root = new THREE.Group();
  const fixed = new THREE.Group();
  const upper = new THREE.Group();
  const lower = new THREE.Group();
  upper.position.set(0, 0, HINGE_Z);
  lower.position.set(0, 0, HINGE_Z);
  root.add(fixed, upper, lower);
  root.updateMatrixWorld(true);

  const meshes: THREE.Mesh[] = [];
  model.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh);
  });
  for (const m of meshes) (LOWER.includes(m.name) ? lower : FIXED.includes(m.name) ? fixed : upper).attach(m);
  const keep = new Set(ANIMATED);
  mergeStaticMeshes(fixed, new Set());
  mergeStaticMeshes(upper, keep);
  mergeStaticMeshes(lower, new Set());

  // Own copies of the materials, so this patient's colours never leak into other scenes
  const mats = new Map<string, THREE.MeshLambertMaterial>();
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const src = mesh.material as THREE.MeshLambertMaterial;
    let own = mats.get(src.name);
    if (!own) {
      own = src.clone();
      own.userData.shared = false;
      mats.set(src.name, own);
    }
    mesh.material = own;
  });

  const skinMat = mats.get('Skin');
  const lipMat = mats.get('Lips');
  const hairMat = mats.get('Hair');
  const gownMat = mats.get('Gown');
  skinMat?.color.setHex(look.skin);
  hairMat?.color.setHex(look.hairColor);
  if (gownMat) {
    gownMat.map = null;
    gownMat.color.setHex(look.gown);
    gownMat.needsUpdate = true;
  }
  const baseSkin = new THREE.Color(look.skin);
  const paleSkin = new THREE.Color(0xd2c4b8);
  const blueTint = new THREE.Color(0x9aa3b8);
  const flushTint = new THREE.Color(0xe08a78);
  const lipBase = lipMat ? lipMat.color.clone() : new THREE.Color(0xb05a4f);
  const lipBlue = new THREE.Color(0x6d5f86);

  // ---- extras the GLB does not have: long hair, beard ----
  const headRel = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z - HINGE_Z);
  if (look.hair === 'long') {
    for (const [x, w] of [[0, 0.2], [-0.095, 0.04], [0.095, 0.04]] as const) {
      const lock = new THREE.Mesh(new THREE.BoxGeometry(w, 0.025, 0.22), lambertOf(look.hairColor));
      lock.position.copy(headRel(x, 0.05, 0.8));
      upper.add(lock);
    }
  }
  if (look.beard) {
    const beard = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), lambertOf(look.hairColor));
    beard.scale.set(1.25, 0.55, 0.8);
    beard.position.copy(headRel(0, 0.115, 0.6));
    upper.add(beard);
  }

  // ---- animated parts ----
  const torso = findMesh(upper, 'Torso');
  const chest = findMesh(upper, 'Chest');
  const cuffMesh = findMesh(upper, 'BPCuff');
  const cuff = new THREE.Group();
  cuff.position.copy(cuffAt).sub(upper.position);
  upper.add(cuff);
  if (cuffMesh) {
    cuff.updateMatrixWorld(true);
    root.updateMatrixWorld(true);
    cuff.attach(cuffMesh);
  }

  const anchor = (at: THREE.Vector3) => {
    const a = new THREE.Object3D();
    a.position.copy(at).sub(upper.position);
    upper.add(a);
    return a;
  };
  const ivAnchor = anchor(hubAt);
  const probeAnchor = anchor(probeAt);
  const cuffAnchor = anchor(cuffAt);
  const maskAnchor = anchor(new THREE.Vector3(0, 0.27, 0.66));
  const electrodes = electrodeAt.map(anchor);

  // ---- oxygen delivery devices ----
  const cannula = new THREE.Group();
  cannula.visible = false;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.105, 0.004, 6, 24), lambertOf(0xbfe8d4));
  ring.position.copy(headRel(0, 0.16, 0.7));
  cannula.add(ring);
  for (const side of [-1, 1]) {
    const prong = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.022, 6), lambertOf(0xd8f3e6));
    prong.position.copy(headRel(side * 0.012, 0.255, 0.64));
    cannula.add(prong);
  }
  upper.add(cannula);

  const mask = new THREE.Group();
  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), lambertOf(0xa5e6c9, 0.55));
  shell.scale.set(1, 0.85, 1.25);
  shell.position.copy(headRel(0, 0.235, 0.65));
  const strap = new THREE.Mesh(new THREE.TorusGeometry(0.108, 0.005, 6, 24), lambertOf(0xffffff));
  strap.position.copy(headRel(0, 0.16, 0.7));
  const bag = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), lambertOf(0xf0f7f5, 0.78));
  bag.position.copy(headRel(0, 0.29, 0.55));
  mask.add(shell, strap, bag);
  mask.visible = false;
  upper.add(mask);

  // ---- finish: the model faces the other way round and sits on the mattress ----
  root.position.y = BED_TOP_Y;
  root.rotation.y = Math.PI;
  const group = new THREE.Group();
  group.add(root);

  let phase = 0;
  let cuffT = -1;
  let cuffLen = 6;
  let lastCond = '';

  return {
    group,
    maskAnchor,
    ivAnchor,
    probeAnchor,
    cuffAnchor,
    electrodes,
    setHeadAngle(angle) {
      upper.rotation.x = -angle;
    },
    setLegAngle(angle) {
      lower.rotation.x = angle;
    },
    setOxygenVisual(device: OxygenDevice | null) {
      cannula.visible = device === 'nasal-cannula';
      mask.visible = device === 'simple-mask' || device === 'non-rebreather';
      bag.visible = device === 'non-rebreather';
    },
    setCondition(v: Vitals) {
      const pallor = Math.min(1, Math.max(0, (112 - v.systolic) / 35));
      const cyanosis = Math.min(1, Math.max(0, (94 - v.spo2) / 10));
      const flush = Math.min(1, Math.max(0, (v.temperatureC - 37.6) / 1.4));
      const key = `${pallor.toFixed(2)}|${cyanosis.toFixed(2)}|${flush.toFixed(2)}`;
      if (key === lastCond) return;
      lastCond = key;
      skinMat?.color.copy(baseSkin).lerp(flushTint, flush * 0.3 * (1 - pallor)).lerp(paleSkin, pallor * 0.7).lerp(blueTint, cyanosis * 0.3);
      lipMat?.color.copy(lipBase).lerp(lipBlue, Math.max(cyanosis, pallor * 0.4));
    },
    pulseCuff(seconds) {
      cuffLen = seconds;
      cuffT = 0;
    },
    update(dt, respiratoryRate) {
      phase += dt * (respiratoryRate / 60) * Math.PI * 2;
      const s = Math.sin(phase);
      for (const part of [torso, chest]) part?.scale.set(1 + 0.02 * s, 1 + 0.07 * s, 1);
      if (bag.visible) bag.scale.set(1, 0.85 + 0.2 * s, 1.3);

      if (cuffT >= 0) {
        cuffT += dt;
        const p = Math.min(1, cuffT / cuffLen);
        const env = p < 0.4 ? p / 0.4 : p < 0.55 ? 1 : 1 - (p - 0.55) / 0.45;
        const k = 1 + 0.4 * Math.max(0, env);
        cuff.scale.set(k, 1, k);
        if (p >= 1) {
          cuffT = -1;
          cuff.scale.set(1, 1, 1);
        }
      }
    },
  };
}
