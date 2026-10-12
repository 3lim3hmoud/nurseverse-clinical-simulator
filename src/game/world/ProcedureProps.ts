import * as THREE from 'three';
import type { ProcedureSession, SceneItem } from '../../domain/procedures/ProcedureSession';
import { rectAround, ROOM, type Rect } from '../layout';
import { blobShadow, box, canvasTexture, cyl } from './helpers';

export interface PropItem {
  id: string;
  root: THREE.Object3D;
  /** "English · العربية": shown when aiming at it */
  label: string;
  setHighlight(on: boolean): void;
  /** Take it off the table (it went into the tray). */
  remove(): void;
}

export interface SupplyArea {
  group: THREE.Group;
  items: PropItem[];
  colliders: Rect[];
  bedControl: THREE.Object3D;
  setBedControlHighlight(on: boolean): void;
}

const PALETTE = [0x3b82a0, 0xd9822b, 0x4f9d69, 0x8e6bbf, 0xc44d58, 0x2a9d8f, 0xb08d57, 0x5c7aea];
const SPACING = 0.46; // between items on a table (a label is 0.44 m wide)
const GAP = 0.85; // free floor between two tables: room to walk through
const TABLE_DEPTH = 0.8;
const TABLE_TOP = 0.78;

/** Label card with the English name above the Arabic one. */
function labelTexture(en: string, ar: string, accent: string): THREE.CanvasTexture {
  const W = 512;
  const H = 150;
  return canvasTexture(W, H, (g) => {
    g.fillStyle = 'rgba(255,255,255,0.94)';
    g.beginPath();
    g.roundRect(4, 4, W - 8, H - 8, 22);
    g.fill();
    g.fillStyle = accent;
    g.fillRect(4, 4, 14, H - 8);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    const fit = (text: string, size: number, weight: string, y: number, color: string, rtl = false) => {
      let s = size;
      g.font = `${weight} ${s}px system-ui, "Segoe UI", Tahoma, sans-serif`;
      while (g.measureText(text).width > W - 56 && s > 14) {
        s -= 2;
        g.font = `${weight} ${s}px system-ui, "Segoe UI", Tahoma, sans-serif`;
      }
      g.direction = rtl ? 'rtl' : 'ltr';
      g.fillStyle = color;
      g.fillText(text, W / 2 + 6, y);
    };
    fit(en, 40, '700', 50, '#0d3b3f');
    fit(ar, 36, '600', 106, accent, true);
  });
}

function sprite(en: string, ar: string, accent: string, width: number): THREE.Sprite {
  const mat = new THREE.SpriteMaterial({ map: labelTexture(en, ar, accent), transparent: true, depthWrite: false });
  const s = new THREE.Sprite(mat);
  s.scale.set(width, width * (150 / 512), 1);
  s.userData.ignoreRay = true;
  return s;
}

/** A simple stand-in shape for an item: big devices, flat supplies, tubes and bottles look different. */
function itemMesh(item: SceneItem, color: number): THREE.Group {
  const g = new THREE.Group();
  const name = item.en.toLowerCase();
  const own = (m: THREE.Mesh) => {
    m.material = (m.material as THREE.MeshLambertMaterial).clone();
    (m.material as THREE.Material).userData.shared = false;
    return m;
  };
  if (item.device) {
    g.add(own(box(0.3, 0.2, 0.2, 0x4a5a64, 0, 0.1, 0)));
    g.add(own(box(0.16, 0.09, 0.012, 0x7fd8ee, 0, 0.12, 0.106)));
    g.add(own(box(0.3, 0.025, 0.2, color, 0, 0.21, 0)));
  } else if (/glove|gown|drape|dressing|gauze|wipe|swab|pad|form|chart|tape|tie|mask|cap|kit|applicator|connector|supplies|holder/.test(name)) {
    g.add(own(box(0.2, 0.045, 0.15, color, 0, 0.0225, 0)));
    g.add(own(box(0.14, 0.012, 0.1, 0xffffff, 0, 0.051, 0)));
  } else if (/syringe|catheter|tube|stylet|needle|cannula|scissors|shears|brush|laryngoscope|blade|probe|lead|tubing|airway|bougie|ett|opa|npa|t-tube/.test(name)) {
    const body = own(cyl(0.016, 0.016, 0.24, color, 0, 0.02, 0, 1, 8));
    body.rotation.z = Math.PI / 2;
    g.add(body);
    g.add(own(sphere(0.022, 0xe9eef0, 0.12, 0.02, 0)));
  } else if (/saline|water|solution|rinse|chlorhexidine|antiseptic|lubricant|peroxide|flush|bottle|bag|oximeter|stethoscope/.test(name)) {
    g.add(own(cyl(0.05, 0.05, 0.15, color, 0, 0.075, 0, 0.92, 14)));
    g.add(own(cyl(0.028, 0.028, 0.03, 0xeef2f3, 0, 0.165, 0, 1, 12)));
  } else {
    g.add(own(box(0.15, 0.15, 0.15, color, 0, 0.075, 0)));
  }
  return g;
}
const sphere = (r: number, color: number, x: number, y: number, z: number) => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), new THREE.MeshLambertMaterial({ color }));
  m.position.set(x, y, z);
  return m;
};

interface Slot {
  /** table centre */
  x: number;
  z: number;
  /** the table runs along z (right-hand row) or along x (front row) */
  alongZ: boolean;
  length: number;
}

/**
 * Supply tables for one run: one table per equipment group of the course sheet, with a sign. They are spread over the
 * right and front of the room, with a free aisle in front of every table, so the nurse can walk between them.
 */
export function buildSupplyArea(session: ProcedureSession): SupplyArea {
  const group = new THREE.Group();
  const colliders: Rect[] = [];
  const items: PropItem[] = [];

  const byGroup = new Map<number, SceneItem[]>();
  for (const it of session.items) byGroup.set(it.group, [...(byGroup.get(it.group) ?? []), it]);

  // ---- place the tables: first along the right-hand side, then along the front wall ----
  const ROW_X = 5.0;
  const ROW_END = ROOM.maxZ - 1.2;
  const FRONT_Z = ROOM.maxZ - 0.75;
  let zCursor = -0.6;
  let xCursor = ROW_X - 0.7;
  let front = false;
  const slots = new Map<number, Slot>();
  for (const [g, list] of [...byGroup.entries()].sort((a, b) => a[0] - b[0])) {
    const length = Math.max(1.3, Math.ceil(list.length / 2) * SPACING + 0.3);
    if (!front && zCursor + length > ROW_END) front = true;
    if (!front) {
      slots.set(g, { x: ROW_X, z: zCursor + length / 2, alongZ: true, length });
      zCursor += length + GAP;
    } else {
      slots.set(g, { x: xCursor - length / 2, z: FRONT_Z, alongZ: false, length });
      xCursor -= length + GAP;
    }
  }

  const accentOf = (g: number) => `#${PALETTE[g % PALETTE.length].toString(16).padStart(6, '0')}`;

  for (const [g, list] of byGroup) {
    const slot = slots.get(g)!;
    const def = session.def.groups[g];
    const table = new THREE.Group();
    table.position.set(slot.x, 0, slot.z);
    const dx = slot.alongZ ? TABLE_DEPTH : slot.length;
    const dz = slot.alongZ ? slot.length : TABLE_DEPTH;
    table.add(box(dx, 0.04, dz, 0xe9eef0, 0, TABLE_TOP - 0.02, 0));
    table.add(box(dx + 0.02, 0.012, dz + 0.02, PALETTE[g % PALETTE.length], 0, TABLE_TOP - 0.046, 0));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) table.add(box(0.05, TABLE_TOP - 0.05, 0.05, 0x90a4ae, (sx * (dx - 0.1)) / 2, (TABLE_TOP - 0.05) / 2, (sz * (dz - 0.1)) / 2));
    group.add(table, blobShadow(dx + 0.4, dz + 0.4, slot.x, slot.z));
    colliders.push(rectAround(slot.x, slot.z, dx / 2 + 0.05, dz / 2 + 0.05));

    const sign = sprite(def?.en ?? 'Other supplies', def?.ar ?? 'مستلزمات أخرى', accentOf(g), 1.2);
    sign.position.set(slot.x, 1.55, slot.z);
    group.add(sign);

    list.forEach((item, k) => {
      const col = Math.floor(k / 2);
      const row = k % 2;
      const u = -slot.length / 2 + 0.3 + col * SPACING;
      const v = row === 0 ? -0.17 : 0.17;
      const root = new THREE.Group();
      root.name = `item:${item.id}`;
      root.position.set(slot.x + (slot.alongZ ? v : u), TABLE_TOP, slot.z + (slot.alongZ ? u : v));
      root.rotation.y = slot.alongZ ? Math.PI / 2 : 0;
      const shape = itemMesh(item, PALETTE[g % PALETTE.length]);
      root.add(shape);
      // a slightly larger invisible box makes small things easy to aim at
      const hit = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.3, 0.3), new THREE.MeshBasicMaterial({ visible: false }));
      hit.position.y = 0.14;
      root.add(hit);
      const card = sprite(item.en, item.ar, accentOf(g), 0.44);
      card.position.set(0, 0.34 + (row === 0 ? 0 : 0.17), 0);
      // sprites face the camera, so keep them out of the item's own rotation
      card.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), 0);
      root.add(card);
      group.add(root);

      const mats: THREE.MeshLambertMaterial[] = [];
      shape.traverse((o) => {
        const m = (o as THREE.Mesh).material as THREE.MeshLambertMaterial | undefined;
        if (m && (o as THREE.Mesh).isMesh) mats.push(m);
      });
      items.push({
        id: item.id,
        root,
        label: `${item.en} · ${item.ar}`,
        setHighlight: (on) => mats.forEach((m) => m.emissive.setHex(on ? 0x1b8f93 : 0x000000)),
        remove: () => root.removeFromParent(),
      });
    });
  }

  // ---- bed control: a pendant on a post beside the bed, at a height that is easy to aim at ----
  const control = new THREE.Group();
  control.name = 'bed-control';
  control.position.set(0.85, 0, -1.15);
  control.add(cyl(0.018, 0.018, 1.0, 0x90a4ae, 0, 0.5, 0, 1, 8));
  control.add(cyl(0.12, 0.12, 0.025, 0x90a4ae, 0, 0.0125, 0, 1, 16));
  control.add(box(0.13, 0.08, 0.2, 0x2f3b42, 0, 1.04, 0));
  const button = box(0.09, 0.02, 0.09, 0x37b36f, 0, 1.09, 0);
  const buttonMat = (button.material as THREE.MeshLambertMaterial).clone();
  buttonMat.userData.shared = false;
  button.material = buttonMat;
  control.add(button);
  const controlHit = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.5), new THREE.MeshBasicMaterial({ visible: false }));
  controlHit.position.y = 1.05;
  control.add(controlHit);
  group.add(control, blobShadow(0.4, 0.4, 0.85, -1.15));
  colliders.push(rectAround(0.85, -1.15, 0.14, 0.14));

  return {
    group,
    items,
    colliders,
    bedControl: control,
    setBedControlHighlight: (on) => buttonMat.emissive.setHex(on ? 0x2dd4bf : 0x000000),
  };
}
