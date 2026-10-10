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

/** A spacious single-patient room. The back wall (minZ) is the bed headwall; everything else is arranged around it. */
export const ROOM = { minX: -5.5, maxX: 5.5, minZ: -3, maxZ: 5.5, height: 3.0 };

export const BED_POS = new THREE.Vector3(0, 0, -1.4);
export const MONITOR_POS = new THREE.Vector3(0.95, 0, -2.0);
export const IV_POS = new THREE.Vector3(-0.85, 0, -1.2);
export const OXYGEN_POS = new THREE.Vector3(-0.88, 0, -2.3);

export const PLAYER_START = new THREE.Vector3(0, 1.65, 3.0);
export const INTERACT_DISTANCE = 2.6;
