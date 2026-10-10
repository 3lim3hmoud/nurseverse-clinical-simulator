import * as THREE from 'three';
import type { PatientProfile } from '../../domain/patient/types';
import { ROOM, rectAround, type Rect } from '../layout';
import { blobShadow, box, canvasTexture, cyl, lambert } from './helpers';
import { cloneModel, type ModelName } from './models';

export interface RoomBuild {
  group: THREE.Group;
  colliders: Rect[];
  bounds: Rect;
}

export function buildEmergencyRoom(profile: PatientProfile): RoomBuild {
  const group = new THREE.Group();
  const colliders: Rect[] = [];
  const { minX, maxX, minZ, maxZ, height: H } = ROOM;
  const W = maxX - minX;
  const D = maxZ - minZ;
  const cx = (minX + maxX) / 2;
  const cz = (minZ + maxZ) / 2;

  /** Place a GLB model (front faces -z; rotY turns it). Returns false when the model is unavailable so the caller can fall back. */
  const place = (name: ModelName, x: number, y: number, z: number, rotY = 0, scale?: [number, number, number]): boolean => {
    const m = cloneModel(name);
    if (!m) return false;
    m.position.set(x, y, z);
    m.rotation.y = rotY;
    if (scale) m.scale.set(...scale);
    group.add(m);
    return true;
  };
  const QUARTER = Math.PI / 2;

  // Floor with tiled vinyl look
  const floorTex = canvasTexture(128, 128, (g) => {
    g.fillStyle = '#d4dde0';
    g.fillRect(0, 0, 128, 128);
    g.strokeStyle = '#bcc8cc';
    g.lineWidth = 3;
    g.strokeRect(0, 0, 128, 128);
  });
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
  floorTex.repeat.set(W, D);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshLambertMaterial({ map: floorTex }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(cx, 0, cz);
  group.add(floor);

  // Ceiling
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(W, D), lambert(0xf4f7f8));
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(cx, H, cz);
  group.add(ceiling);

  // Walls (planes facing inward) + lower teal band
  const wallMat = lambert(0xe9f1f0);
  const addWall = (len: number, x: number, z: number, rotY: number) => {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(len, H), wallMat);
    wall.position.set(x, H / 2, z);
    wall.rotation.y = rotY;
    group.add(wall);
    const band = box(len, 0.95, 0.02, 0x7fb9b6);
    band.position.set(0, 0.475, 0.011);
    const rail = box(len, 0.05, 0.04, 0xf7fbfa);
    rail.position.set(0, 0.97, 0.02);
    wall.add(band, rail);
  };
  addWall(W, cx, minZ, 0);
  addWall(W, cx, maxZ, Math.PI);
  addWall(D, minX, cz, Math.PI / 2);
  addWall(D, maxX, cz, -Math.PI / 2);

  // Ceiling light panels (grid over the whole room)
  const panelMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  for (const x of [-3.6, 0, 3.6]) {
    for (const z of [-1.4, 1.4, 4.2]) {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.04, 0.5), panelMat);
      panel.position.set(x, H - 0.02, z);
      group.add(panel);
    }
  }

  // Headwall unit behind the bed (gas outlets, nurse call, sockets)
  if (!place('bedHeadUnit', 0, 1.45, minZ, Math.PI)) {
    const headwall = box(2.0, 0.32, 0.08, 0xdfe7ea, 0, 1.45, minZ + 0.04);
    group.add(headwall);
    const outlets: [number, number][] = [
      [-0.55, 0x2e9e5b],
      [-0.2, 0xe6b800],
      [0.15, 0x555e63],
      [0.5, 0x2e9e5b],
    ];
    for (const [x, color] of outlets) {
      const o = cyl(0.035, 0.035, 0.05, color, x, 1.45, minZ + 0.1);
      o.rotation.x = Math.PI / 2;
      group.add(o);
    }
  }

  // Wall sign
  const signTex = canvasTexture(512, 128, (g) => {
    g.fillStyle = '#0f6b6f';
    g.fillRect(0, 0, 512, 128);
    g.fillStyle = '#ffffff';
    g.font = 'bold 54px "Segoe UI", Arial, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(`Emergency ${profile.bedLabel}`, 256, 66);
  });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.375), new THREE.MeshBasicMaterial({ map: signTex }));
  sign.position.set(0, 2.3, minZ + 0.012);
  group.add(sign);

  // Crash cart (right side, drawers face the bed) with the defibrillator on top
  if (place('crashCart', 2.3, 0, -0.6, QUARTER)) {
    place('defibrillator', 2.3, 0.95, -0.6, QUARTER);
    group.add(blobShadow(0.9, 1.1, 2.3, -0.6));
  } else {
    const cart = new THREE.Group();
    cart.position.set(2.3, 0, -0.6);
    cart.add(box(0.5, 0.85, 0.62, 0xc0392b, 0, 0.45, 0));
    cart.add(box(0.54, 0.04, 0.66, 0xaab7bb, 0, 0.9, 0));
    for (let i = 0; i < 4; i++) {
      cart.add(box(0.012, 0.16, 0.54, 0xa93226, -0.256, 0.16 + i * 0.19, 0));
      cart.add(box(0.02, 0.025, 0.2, 0xdde3e5, -0.27, 0.2 + i * 0.19, 0));
    }
    cart.add(box(0.28, 0.16, 0.38, 0x37474f, 0.02, 1.0, 0));
    cart.add(box(0.005, 0.09, 0.2, 0x66ffcc, -0.121, 1.0, 0));
    group.add(cart, blobShadow(0.9, 1.0, 2.3, -0.6));
  }
  colliders.push(rectAround(2.3, -0.6, 0.3, 0.42));

  // Counter + wall cabinet (right wall)
  group.add(box(0.6, 0.9, 2.0, 0xf1f5f6, maxX - 0.32, 0.45, 1.2));
  group.add(box(0.64, 0.04, 2.04, 0xa9b7bb, maxX - 0.32, 0.92, 1.2));
  group.add(box(0.34, 0.7, 1.6, 0xe4ecee, maxX - 0.18, 1.75, 1.2));
  group.add(box(0.012, 0.64, 0.74, 0xcfdadd, maxX - 0.355, 1.75, 0.8));
  group.add(box(0.012, 0.64, 0.74, 0xcfdadd, maxX - 0.355, 1.75, 1.6));
  if (!place('sharps', maxX, 1.15, 0.22, QUARTER)) group.add(box(0.2, 0.22, 0.2, 0xc0392b, maxX - 0.4, 1.04, 0.5)); // sharps bin
  if (!place('sanitizer', maxX, 1.3, -0.15, QUARTER)) group.add(box(0.1, 0.2, 0.08, 0xffffff, maxX - 0.05, 1.25, -0.1)); // sanitizer dispenser
  group.add(blobShadow(1.0, 2.4, maxX - 0.3, 1.2));
  colliders.push({ minX: maxX - 0.65, maxX, minZ: 0.15, maxZ: 2.25 });

  // Bedside cabinet (drawer faces the bed) with a few things on top
  if (place('bedsideCabinet', 0.95, 0, -0.7, QUARTER)) {
    group.add(blobShadow(0.8, 0.8, 0.95, -0.7));
    place('waterJug', 1.04, 0.8, -0.82);
    place('drinkingCup', 0.9, 0.8, -0.84);
    place('tissueBox', 0.97, 0.8, -0.58, QUARTER);
  } else {
    group.add(box(0.45, 0.72, 0.45, 0xf1f5f6, 0.95, 0.36, -0.7));
    group.add(box(0.5, 0.03, 0.5, 0xa9b7bb, 0.95, 0.735, -0.7));
    group.add(box(0.012, 0.2, 0.36, 0xdde3e5, 0.72, 0.5, -0.7));
    group.add(blobShadow(0.8, 0.8, 0.95, -0.7));
  }
  colliders.push(rectAround(0.95, -0.7, 0.26, 0.26));

  // Overbed table beside the bed, its arm reaching over the mattress edge
  if (place('overbedTable', 1.35, 0, -1.35, QUARTER)) {
    place('pillBottle', 0.95, 1.015, -1.3);
    group.add(blobShadow(1.0, 0.6, 1.1, -1.35));
    colliders.push({ minX: 0.6, maxX: 1.5, minZ: -1.6, maxZ: -1.1 });
  }

  // Door (left wall) with window and handle
  const door = new THREE.Group();
  door.position.set(minX + 0.04, 0, 1.2);
  door.add(box(0.06, 2.1, 1.0, 0xd9e2e6, 0, 1.05, 0));
  door.add(box(0.08, 2.14, 0.06, 0x9eb0b7, 0, 1.07, -0.53));
  door.add(box(0.08, 2.14, 0.06, 0x9eb0b7, 0, 1.07, 0.53));
  door.add(box(0.08, 0.06, 1.12, 0x9eb0b7, 0, 2.13, 0));
  door.add(box(0.02, 0.5, 0.25, 0x7f9aa6, 0.035, 1.5, 0));
  door.add(box(0.05, 0.03, 0.14, 0xb6c3c8, 0.05, 1.0, 0.38));
  group.add(door);


  // Wall clock (back wall, right)
  const clockTex = canvasTexture(128, 128, (g) => {
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.arc(64, 64, 62, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = '#37474f';
    g.lineWidth = 4;
    g.stroke();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      g.beginPath();
      g.moveTo(64 + Math.sin(a) * 52, 64 - Math.cos(a) * 52);
      g.lineTo(64 + Math.sin(a) * 58, 64 - Math.cos(a) * 58);
      g.stroke();
    }
    g.lineCap = 'round';
    g.lineWidth = 5;
    g.beginPath();
    g.moveTo(64, 64);
    g.lineTo(64 + Math.sin(Math.PI * 0.33) * 30, 64 - Math.cos(Math.PI * 0.33) * 30);
    g.stroke();
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(64, 64);
    g.lineTo(64 + Math.sin(Math.PI * 1.67) * 44, 64 - Math.cos(Math.PI * 1.67) * 44);
    g.stroke();
  });
  const clock = new THREE.Mesh(new THREE.CircleGeometry(0.2, 28), new THREE.MeshBasicMaterial({ map: clockTex }));
  clock.position.set(2.0, 2.5, minZ + 0.012);
  group.add(clock);

  // Whiteboard with the patient's details
  const boardTex = canvasTexture(512, 320, (g) => {
    g.fillStyle = '#fbfdfd';
    g.fillRect(0, 0, 512, 320);
    g.strokeStyle = '#9fb3b8';
    g.lineWidth = 8;
    g.strokeRect(4, 4, 504, 312);
    g.fillStyle = '#0f6b6f';
    g.font = 'bold 40px "Segoe UI", Arial, sans-serif';
    g.fillText(profile.bedLabel, 28, 64);
    g.fillStyle = '#10282e';
    g.font = '28px "Segoe UI", Arial, sans-serif';
    profile.boardLines.forEach((line, i) => g.fillText(line, 28, 118 + i * 50));
  });
  const board = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.75), new THREE.MeshBasicMaterial({ map: boardTex }));
  board.position.set(2.0, 1.75, minZ + 0.012);
  group.add(board);

  // Hand-wash sink (left wall)
  group.add(box(0.5, 0.8, 0.6, 0xf1f5f6, minX + 0.28, 0.4, 0.05));
  group.add(box(0.54, 0.05, 0.64, 0xdfe7ea, minX + 0.28, 0.825, 0.05));
  group.add(box(0.36, 0.1, 0.44, 0xb7c6cb, minX + 0.28, 0.83, 0.05));
  group.add(cyl(0.012, 0.012, 0.24, 0xb0bec5, minX + 0.1, 0.97, 0.05, 1, 8));
  const spout = box(0.14, 0.02, 0.02, 0xb0bec5, minX + 0.17, 1.08, 0.05);
  group.add(spout);
  group.add(box(0.08, 0.2, 0.08, 0xffffff, minX + 0.06, 1.35, 0.05)); // soap dispenser
  group.add(blobShadow(0.9, 1.0, minX + 0.4, 0.05));
  colliders.push({ minX, maxX: minX + 0.55, minZ: -0.28, maxZ: 0.38 });

  // Waste bin near door
  group.add(cyl(0.14, 0.12, 0.45, 0x607d8b, minX + 0.4, 0.225, 2.1));

  // ---- Windows (daylight makes the bigger room feel open) ----
  const skyTex = canvasTexture(8, 64, (g) => {
    const grad = g.createLinearGradient(0, 0, 0, 64);
    grad.addColorStop(0, '#9fd0ee');
    grad.addColorStop(1, '#e8f5fb');
    g.fillStyle = grad;
    g.fillRect(0, 0, 8, 64);
  });
  const skyMat = new THREE.MeshBasicMaterial({ map: skyTex });
  const addWindow = (x: number, z: number, rotY: number, w = 1.7, h = 1.2) => {
    const win = new THREE.Group();
    win.position.set(x, 1.75, z);
    win.rotation.y = rotY;
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(w, h), skyMat);
    sky.position.z = 0.01;
    win.add(sky);
    const f = 0xf4f7f8;
    win.add(box(w + 0.12, 0.06, 0.06, f, 0, h / 2 + 0.03, 0.03));
    win.add(box(w + 0.12, 0.06, 0.06, f, 0, -h / 2 - 0.03, 0.03));
    win.add(box(0.06, h, 0.06, f, -w / 2 - 0.03, 0, 0.03));
    win.add(box(0.06, h, 0.06, f, w / 2 + 0.03, 0, 0.03));
    win.add(box(0.04, h, 0.04, f, 0, 0, 0.03));
    win.add(box(w, 0.04, 0.04, f, 0, 0, 0.03));
    group.add(win);
  };
  addWindow(maxX - 0.01, -0.9, -QUARTER);
  addWindow(maxX - 0.01, 3.1, -QUARTER);
  addWindow(minX + 0.01, 3.2, QUARTER);
  addWindow(-2.6, maxZ - 0.01, Math.PI);
  addWindow(2.6, maxZ - 0.01, Math.PI);

  // ---- Chairs: one beside the bed for visitors, two by the right wall with a small table ----
  const addChair = (x: number, z: number, rotY: number) => {
    const chair = new THREE.Group();
    chair.position.set(x, 0, z);
    chair.rotation.y = rotY; // the chair faces -z when rotY = 0
    chair.add(box(0.46, 0.06, 0.46, 0x4f9ba0, 0, 0.46, 0));
    chair.add(box(0.46, 0.5, 0.05, 0x4f9ba0, 0, 0.72, 0.21));
    for (const [lx, lz] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) chair.add(box(0.04, 0.44, 0.04, 0x607d8b, lx, 0.22, lz));
    group.add(chair, blobShadow(0.7, 0.7, x, z));
    colliders.push(rectAround(x, z, 0.26, 0.26));
  };
  addChair(-1.45, -0.55, -QUARTER); // faces the bed
  addChair(maxX - 0.7, 3.7, QUARTER);
  addChair(maxX - 0.7, 4.6, QUARTER);
  group.add(cyl(0.28, 0.28, 0.04, 0xe9eef0, maxX - 0.7, 0.6, 4.15, 1, 20), cyl(0.04, 0.04, 0.58, 0x90a4ae, maxX - 0.7, 0.3, 4.15, 1, 8), blobShadow(0.9, 0.9, maxX - 0.7, 4.15));
  colliders.push(rectAround(maxX - 0.7, 4.15, 0.3, 0.3));

  return {
    group,
    colliders,
    bounds: { minX, maxX, minZ, maxZ },
  };
}
