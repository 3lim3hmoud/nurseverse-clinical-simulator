import * as THREE from 'three';

/** Axis-aligned rectangle on the floor plane (x/z), used for simple collision. */
export interface Rect {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export const rectAround = (x: number, z: number, halfW: number, halfD: number): Rect => ({
  minX: x - halfW,
  maxX: x + halfW,
  minZ: z - halfD,
  maxZ: z + halfD,
});

export const ROOM = { minX: -3, maxX: 3, minZ: -3, maxZ: 2.5, height: 2.9 };

export const BED_POS = new THREE.Vector3(0, 0, -1.4);
export const MONITOR_POS = new THREE.Vector3(0.95, 0, -2.0);
export const IV_POS = new THREE.Vector3(-0.85, 0, -1.2);
export const OXYGEN_POS = new THREE.Vector3(-0.88, 0, -2.3);

export const PLAYER_START = new THREE.Vector3(0, 1.65, 1.8);
export const INTERACT_DISTANCE = 2.6;
