import * as THREE from 'three';
import type { PatientProfile } from '../../domain/patient/types';
import { ROOM, rectAround, type Rect } from '../layout';
import { blobShadow, box, canvasTexture, cyl, lambert } from './helpers';

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

  // Ceiling light panels
  for (const z of [-1.4, 0.9]) {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.04, 0.5), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    panel.position.set(0, H - 0.02, z);
    group.add(panel);
  }

  // Headwall gas outlets behind the bed
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

  // Privacy curtain (left of the bed)
  const curtainX = -2.0;
  group.add(box(0.05, 0.05, 2.6, 0xaab6bb, curtainX, 2.72, -1.7));
  for (let i = 0; i < 9; i++) {
    const z = -2.88 + i * 0.27;
    group.add(box(0.05, 2.3, 0.3, i % 2 ? 0x4f9ba0 : 0x5aa9ae, curtainX + (i % 2 ? 0.035 : -0.035), 1.45, z));
  }
  colliders.push({ minX: curtainX - 0.1, maxX: curtainX + 0.1, minZ: -3, maxZ: -0.45 });

  // Crash cart (right side, drawers face the bed)
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
  colliders.push(rectAround(2.3, -0.6, 0.3, 0.36));

  // Counter + wall cabinet (right wall)
  group.add(box(0.6, 0.9, 2.0, 0xf1f5f6, 2.68, 0.45, 1.2));
  group.add(box(0.64, 0.04, 2.04, 0xa9b7bb, 2.68, 0.92, 1.2));
  group.add(box(0.34, 0.7, 1.6, 0xe4ecee, 2.82, 1.75, 1.2));
  group.add(box(0.012, 0.64, 0.74, 0xcfdadd, 2.645, 1.75, 0.8));
  group.add(box(0.012, 0.64, 0.74, 0xcfdadd, 2.645, 1.75, 1.6));
  group.add(box(0.2, 0.22, 0.2, 0xc0392b, 2.6, 1.04, 0.5)); // sharps bin
  group.add(box(0.1, 0.2, 0.08, 0xffffff, 2.95, 1.25, -0.1)); // sanitizer dispenser
  group.add(blobShadow(1.0, 2.4, 2.7, 1.2));
  colliders.push({ minX: 2.35, maxX: 3, minZ: 0.15, maxZ: 2.25 });

  // Bedside cabinet
  group.add(box(0.45, 0.72, 0.45, 0xf1f5f6, 0.95, 0.36, -0.7));
  group.add(box(0.5, 0.03, 0.5, 0xa9b7bb, 0.95, 0.735, -0.7));
  group.add(box(0.012, 0.2, 0.36, 0xdde3e5, 0.72, 0.5, -0.7));
  group.add(blobShadow(0.8, 0.8, 0.95, -0.7));
  colliders.push(rectAround(0.95, -0.7, 0.26, 0.26));

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
  group.add(cyl(0.14, 0.12, 0.45, 0x607d8b, -2.6, 0.225, 2.1));

  return {
    group,
    colliders,
    bounds: { minX, maxX, minZ, maxZ },
  };
}
