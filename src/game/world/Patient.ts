import * as THREE from 'three';
import type { PatientAppearance, Vitals } from '../../domain/patient/types';
import type { OxygenDevice } from '../../domain/physiology/oxygen';
import { box, canvasTexture, cyl, lambert, sphere } from './helpers';

const HIP_Y = 0.77; // pivot height: mattress surface
const css = (hex: number) => `#${hex.toString(16).padStart(6, '0')}`;

export interface PatientRig {
  group: THREE.Group; // positioned at the bed origin (same local coordinates as the bed)
  maskAnchor: THREE.Object3D; // where the oxygen tubing leaves the mask/cannula
  ivAnchor: THREE.Object3D; // IV catheter on the left hand
  probeAnchor: THREE.Object3D; // SpO2 finger probe (right hand)
  cuffAnchor: THREE.Object3D; // BP cuff (right upper arm)
  electrodes: THREE.Object3D[]; // ECG electrodes on the chest
  setHeadAngle(angle: number): void;
  setLegAngle(angle: number): void;
  setOxygenVisual(device: OxygenDevice | null): void;
  /** Skin colour, lips and cheeks react to the vitals (pale in shock, bluish when hypoxic, flushed with fever). */
  setCondition(v: Vitals): void;
  /** Inflate and deflate the BP cuff once. */
  pulseCuff(seconds: number): void;
  update(dt: number, respiratoryRate: number): void;
}

function gownTexture(color: number): THREE.CanvasTexture {
  const tex = canvasTexture(64, 64, (g) => {
    g.fillStyle = css(color);
    g.fillRect(0, 0, 64, 64);
    g.fillStyle = 'rgba(255,255,255,0.55)';
    for (let y = 0; y < 64; y += 16) for (let x = 0; x < 64; x += 16) {
      const ox = (y / 16) % 2 ? 8 : 0;
      g.fillRect(x + ox, y + 6, 4, 4);
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  return tex;
}

/** Height of the face surface at (x, z), so features sit on the skin instead of floating. */
function faceY(x: number, z: number): number {
  const ell = (cy: number, cz: number, rx: number, ry: number, rz: number) => {
    const k = 1 - (x / rx) ** 2 - ((z - cz) / rz) ** 2;
    return k > 0 ? cy + ry * Math.sqrt(k) : -Infinity;
  };
  return Math.max(ell(0.98, -0.8, 0.0966, 0.105, 0.1155), ell(0.945, -0.72, 0.075, 0.06, 0.075));
}

/** Low-poly adult patient lying on their back (head at -z). Upper body and legs pivot at the hip. */
export function createPatient(look: PatientAppearance): PatientRig {
  const group = new THREE.Group();

  const baseSkin = new THREE.Color(look.skin);
  const paleSkin = new THREE.Color(0xd2c4b8);
  const blueTint = new THREE.Color(0x9aa3b8);
  const skinMat = new THREE.MeshLambertMaterial({ color: look.skin });
  const lipMat = new THREE.MeshLambertMaterial({ color: 0xb05a4f });
  const cheekMat = new THREE.MeshLambertMaterial({ color: 0xe8847a, transparent: true, opacity: 0, depthWrite: false });
  const gownMat = new THREE.MeshLambertMaterial({ map: gownTexture(look.gown) });
  const lipBase = new THREE.Color(0xb05a4f);
  const lipBlue = new THREE.Color(0x6b5b8f);

  const mesh = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    return m;
  };
  const capsuleZ = (radius: number, length: number, mat: THREE.Material, x: number, y: number, z: number) => {
    const m = mesh(new THREE.CapsuleGeometry(radius, length, 4, 10), mat, x, y, z);
    m.rotation.x = Math.PI / 2; // lie along the z axis
    return m;
  };

  // Everything above the hips lives in `upper`; the legs live in `lower`.
  const upper = new THREE.Group();
  upper.position.set(0, HIP_Y, 0);
  group.add(upper);
  const lower = new THREE.Group();
  lower.position.set(0, HIP_Y, 0);
  group.add(lower);
  const up = <T extends THREE.Object3D>(o: T): T => {
    o.position.y -= HIP_Y;
    upper.add(o);
    return o;
  };
  const down = <T extends THREE.Object3D>(o: T): T => {
    o.position.y -= HIP_Y;
    lower.add(o);
    return o;
  };
  const anchor = (x: number, y: number, z: number) => {
    const o = new THREE.Object3D();
    o.position.set(x, y, z);
    return up(o);
  };

  // ---- pillow, head ----
  up(box(0.5, 0.12, 0.35, 0xf6f8f9, 0, 0.83, -0.78));
  const skull = mesh(new THREE.SphereGeometry(0.105, 20, 16), skinMat, 0, 0.98, -0.8);
  skull.scale.set(0.92, 1, 1.1);
  up(skull);
  const jaw = mesh(new THREE.SphereGeometry(0.075, 16, 12), skinMat, 0, 0.945, -0.72);
  jaw.scale.set(1, 0.8, 1);
  up(jaw);
  up(capsuleZ(0.045, 0.06, skinMat, 0, 0.86, -0.66)); // neck

  // hair
  const hair = lambert(look.hairColor);
  const cap = mesh(new THREE.SphereGeometry(0.113, 18, 14), hair, 0, 0.968, -0.842);
  cap.scale.set(0.95, 1, 1);
  up(cap);
  if (look.hair === 'long') {
    up(box(0.26, 0.03, 0.22, look.hairColor, 0, 0.905, -0.9));
    for (const side of [-1, 1]) up(capsuleZ(0.03, 0.2, hair, side * 0.125, 0.9, -0.62));
  }
  if (look.beard) {
    const stubble = mesh(new THREE.SphereGeometry(0.078, 16, 12), lambert(look.hairColor, { opacity: 0.4 }), 0, 0.945, -0.72);
    stubble.scale.set(1, 0.82, 1);
    up(stubble);
    up(box(0.05, 0.004, 0.012, look.hairColor, 0, faceY(0, -0.735) + 0.003, -0.735)); // moustache
  }

  // ears, cheeks
  for (const side of [-1, 1]) {
    const ear = mesh(new THREE.SphereGeometry(0.022, 8, 8), skinMat, side * 0.1, 0.975, -0.8);
    ear.scale.set(0.6, 1.2, 1);
    up(ear);
    const cheek = mesh(new THREE.SphereGeometry(0.03, 10, 8), cheekMat, side * 0.055, faceY(side * 0.055, -0.76) - 0.006, -0.76);
    cheek.scale.set(1, 0.4, 1);
    up(cheek);
  }

  // eyes (white + iris), eyelids, eyebrows
  const eyeZ = -0.83;
  const lids: THREE.Mesh[] = [];
  for (const side of [-1, 1]) {
    const x = side * 0.04;
    const y = faceY(x, eyeZ);
    const white = mesh(new THREE.SphereGeometry(0.014, 10, 8), lambert(0xf6f6f2), x, y + 0.001, eyeZ);
    white.scale.set(1, 0.5, 1.1);
    up(white);
    const iris = mesh(new THREE.SphereGeometry(0.0085, 8, 6), lambert(0x4a3224), x, y + 0.005, eyeZ);
    iris.scale.set(1, 0.3, 1);
    up(iris);
    const lid = mesh(new THREE.SphereGeometry(0.0165, 10, 8), skinMat, x, y + 0.004, eyeZ);
    lid.scale.set(1.05, 0.5, 0.05);
    up(lid);
    lids.push(lid);
    const brow = box(0.032, 0.004, 0.007, look.hairColor, x, faceY(x, -0.865) + 0.003, -0.865);
    brow.rotation.y = side * 0.12;
    up(brow);
  }

  // nose, lips
  up(box(0.012, 0.014, 0.036, look.skin, 0, faceY(0, -0.775) + 0.004, -0.775));
  const tip = mesh(new THREE.SphereGeometry(0.013, 8, 8), skinMat, 0, faceY(0, -0.748) + 0.006, -0.748);
  up(tip);
  for (const side of [-1, 1]) up(mesh(new THREE.SphereGeometry(0.008, 6, 6), skinMat, side * 0.012, faceY(side * 0.012, -0.745) + 0.003, -0.745));
  const upperLip = mesh(new THREE.SphereGeometry(0.012, 8, 6), lipMat, 0, faceY(0, -0.722) + 0.001, -0.722);
  upperLip.scale.set(2.2, 0.45, 0.6);
  up(upperLip);
  const lowerLip = mesh(new THREE.SphereGeometry(0.012, 8, 6), lipMat, 0, faceY(0, -0.703) + 0.001, -0.703);
  lowerLip.scale.set(2, 0.45, 0.65);
  up(lowerLip);

  // ---- chest (animated), shoulders ----
  const chest = new THREE.Group();
  upper.add(chest);
  const torso = capsuleZ(0.16, 0.4, gownMat, 0, 0.115, -0.33);
  torso.scale.set(1.2, 1, 0.75);
  chest.add(torso);
  for (const side of [-1, 1]) {
    const shoulder = mesh(new THREE.SphereGeometry(0.07, 12, 10), gownMat, side * 0.18, 0.115 + 0.01, -0.58);
    shoulder.scale.set(1, 0.85, 1);
    chest.add(shoulder);
  }

  // ECG electrodes
  const electrodes: THREE.Object3D[] = [];
  for (const [x, y, z] of [[-0.12, 0.985, -0.5], [0.12, 0.985, -0.5], [0, 1.0, -0.2]] as const) {
    electrodes.push(up(cyl(0.014, 0.014, 0.006, 0xffffff, x, y, z, 1, 10)));
  }

  // ---- arms and hands ----
  for (const side of [-1, 1]) {
    const x = side * 0.26;
    up(capsuleZ(0.047, 0.22, gownMat, x, 0.83, -0.42)); // sleeve
    up(capsuleZ(0.04, 0.2, skinMat, x, 0.82, -0.2)); // forearm
    const palm = mesh(new THREE.SphereGeometry(0.035, 10, 8), skinMat, x, 0.815, -0.055);
    palm.scale.set(1, 0.5, 1.2);
    up(palm);
    for (const off of [-0.018, -0.006, 0.006, 0.018]) up(capsuleZ(0.008, 0.03, skinMat, x + off, 0.81, -0.005));
    up(capsuleZ(0.009, 0.025, skinMat, x - side * 0.03, 0.81, -0.04)); // thumb
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.044, 0.006, 6, 14), lambert(0xffffff));
    band.position.set(x, 0.82, -0.12);
    up(band);
  }
  const cuff = up(cyl(0.056, 0.056, 0.1, 0x2c3e50, 0.26, 0.83, -0.42, 1, 12));
  cuff.rotation.x = Math.PI / 2;
  up(box(0.03, 0.02, 0.05, 0x263238, 0.26, 0.865, 0.0)); // SpO2 probe
  up(box(0.016, 0.004, 0.016, 0xff3b3b, 0.26, 0.877, 0.0));
  up(box(0.05, 0.012, 0.06, 0xffffff, -0.26, 0.862, -0.07)); // IV dressing

  const maskAnchor = anchor(0, 1.06, -0.66);
  const ivAnchor = anchor(-0.26, 0.87, -0.04);
  const probeAnchor = anchor(0.26, 0.88, 0.0);
  const cuffAnchor = anchor(0.26, 0.89, -0.42);

  // ---- pelvis (fixed) and legs under the blanket (raised with the foot section) ----
  group.add(mesh(new THREE.BoxGeometry(0.4, 0.12, 0.3), gownMat, 0, 0.83, 0.1));
  down(box(0.86, 0.1, 0.78, 0xf2f5f6, 0, 0.82, 0.61));
  down(box(0.86, 0.11, 0.06, 0x4aa3a6, 0, 0.83, 0.25));
  for (const x of [-0.11, 0.11]) {
    down(capsuleZ(0.085, 0.5, lambert(0xf2f5f6), x, 0.855, 0.64));
    const feet = mesh(new THREE.SphereGeometry(0.075, 10, 8), lambert(0xf2f5f6), x, 0.83, 0.93);
    feet.scale.set(1, 0.7, 1.2);
    down(feet);
  }

  // ---- oxygen delivery devices (shown depending on what the student chose) ----
  const cannula = new THREE.Group();
  cannula.visible = false;
  const cannulaRing = new THREE.Mesh(new THREE.TorusGeometry(0.109, 0.004, 6, 24), lambert(0xbfe8d4));
  cannulaRing.position.set(0, 0.98 - HIP_Y, -0.775);
  cannula.add(cannulaRing);
  for (const side of [-1, 1]) cannula.add(cyl(0.004, 0.004, 0.022, 0xd8f3e6, side * 0.012, faceY(0, -0.752) + 0.01 - HIP_Y, -0.752, 1, 6));
  upper.add(cannula);

  const mask = new THREE.Group();
  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), lambert(0xa5e6c9, { opacity: 0.55 }));
  shell.scale.set(1, 0.85, 1.25);
  shell.position.set(0, 1.045 - HIP_Y, -0.745);
  const strap = new THREE.Mesh(new THREE.TorusGeometry(0.112, 0.005, 6, 24), lambert(0xffffff));
  strap.position.set(0, 0.98 - HIP_Y, -0.77);
  const bag = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), lambert(0xf0f7f5, { opacity: 0.78 }));
  bag.position.set(0, 1.0 - HIP_Y, -0.6);
  mask.add(shell, strap, bag);
  mask.visible = false;
  upper.add(mask);

  // ---- animation state ----
  let phase = 0;
  let blinkIn = 3;
  let blinking = 0;
  let cuffT = -1;
  let cuffLen = 6;
  const baseClosure = 1 - look.alertness;
  let lastCond = '';

  const setLids = (closure: number) => {
    for (const lid of lids) {
      lid.visible = closure > 0.12;
      lid.scale.z = 0.05 + closure * 1.05;
      lid.position.z = eyeZ - (1 - closure) * 0.012;
    }
  };
  setLids(baseClosure);

  return {
    group,
    maskAnchor,
    ivAnchor,
    probeAnchor,
    cuffAnchor,
    electrodes,
    setHeadAngle(angle) {
      upper.rotation.x = angle;
    },
    setLegAngle(angle) {
      lower.rotation.x = -angle;
    },
    setOxygenVisual(device) {
      cannula.visible = device === 'nasal-cannula';
      mask.visible = device === 'simple-mask' || device === 'non-rebreather';
      bag.visible = device === 'non-rebreather';
    },
    setCondition(v) {
      const pallor = Math.min(1, Math.max(0, (112 - v.systolic) / 35));
      const cyanosis = Math.min(1, Math.max(0, (94 - v.spo2) / 10));
      const flush = Math.min(1, Math.max(0, (v.temperatureC - 37.6) / 1.4));
      const key = `${pallor.toFixed(2)}|${cyanosis.toFixed(2)}|${flush.toFixed(2)}`;
      if (key === lastCond) return;
      lastCond = key;
      skinMat.color.copy(baseSkin).lerp(paleSkin, pallor * 0.7).lerp(blueTint, cyanosis * 0.3);
      lipMat.color.copy(lipBase).lerp(lipBlue, Math.max(cyanosis, pallor * 0.4));
      cheekMat.opacity = flush * 0.55 * (1 - pallor);
    },
    pulseCuff(seconds) {
      cuffLen = seconds;
      cuffT = 0;
    },
    update(dt, respiratoryRate) {
      phase += dt * (respiratoryRate / 60) * Math.PI * 2;
      const s = Math.sin(phase);
      chest.scale.set(1 + 0.02 * s, 1 + 0.12 * s, 1);
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

      if (dt > 0 && baseClosure < 0.9) {
        blinkIn -= dt;
        if (blinkIn <= 0) {
          blinking = 0.16;
          blinkIn = 2.5 + Math.random() * 4;
        }
        if (blinking > 0) {
          blinking -= dt;
          const closure = baseClosure + (1 - baseClosure) * Math.sin(Math.max(0, blinking / 0.16) * Math.PI);
          setLids(Math.min(1, closure));
        } else setLids(baseClosure);
      }
    },
  };
}
