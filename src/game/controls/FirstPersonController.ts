import * as THREE from 'three';
import { PLAYER_START, type Rect } from '../layout';

const EYE_HEIGHT = 1.65;
const RADIUS = 0.28;
const WALK_SPEED = 2.6; // the room is big: a brisk walk
const SPRINT_MULT = 1.7;
const TOUCH_RUN_AT = 0.9; // pushing the joystick almost to the edge runs
const MOUSE_SENS = 0.0022;
const TOUCH_SENS = 0.0055;

export interface ControllerEvents {
  onLockChange(locked: boolean): void;
}

/**
 * First-person camera: WASD + mouse look (desktop, pointer lock) or virtual joystick + drag look (touch).
 * `locked` means "the simulation is receiving input" in both modes.
 */
export class FirstPersonController {
  locked = false;
  private yaw = 0;
  private pitch = 0;
  private keys = new Set<string>();
  private touchMove = { x: 0, y: 0 };
  private velocity = new THREE.Vector3();
  private bobTime = 0;
  private pos = new THREE.Vector3(PLAYER_START.x, EYE_HEIGHT, PLAYER_START.z);

  constructor(
    private camera: THREE.PerspectiveCamera,
    private dom: HTMLElement,
    private colliders: Rect[],
    private bounds: Rect,
    private events: ControllerEvents,
  ) {
    camera.rotation.order = 'YXZ';
    camera.position.copy(this.pos);
    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('pointerlockchange', this.onLockChange);
  }

  /** Desktop: capture the mouse. */
  lock(): void {
    try {
      const result = this.dom.requestPointerLock() as unknown as Promise<void> | undefined;
      result?.catch?.(() => undefined);
    } catch {
      /* browser refused (e.g. right after Esc) - the overlay stays visible so the user can click again */
    }
  }

  /** Give the mouse back (used while a panel is open). Touch: just stops the joystick. */
  releaseCursor(): void {
    this.setTouchMove(0, 0);
    if (document.pointerLockElement === this.dom) document.exitPointerLock();
  }

  /** Touch: no pointer lock, just switch input on/off. */
  setActive(active: boolean): void {
    if (this.locked === active) return;
    this.locked = active;
    if (!active) this.resetInput();
    this.events.onLockChange(active);
  }

  /** Joystick vector, each axis -1..1 (y > 0 = forward). */
  setTouchMove(x: number, y: number): void {
    this.touchMove.x = x;
    this.touchMove.y = y;
  }

  /** Drag-look in screen pixels. */
  addLook(dx: number, dy: number): void {
    if (!this.locked) return;
    this.yaw -= dx * TOUCH_SENS;
    this.pitch = Math.max(-1.45, Math.min(1.45, this.pitch - dy * TOUCH_SENS));
  }

  dispose(): void {
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('pointerlockchange', this.onLockChange);
    if (document.pointerLockElement === this.dom) document.exitPointerLock();
  }

  /** Turn the view toward a point (k = 0..1 of the way, per call). Used to face the patient while a step is performed. */
  lookToward(x: number, y: number, z: number, k: number): void {
    const dx = x - this.pos.x;
    const dz = z - this.pos.z;
    const yawT = Math.atan2(-dx, -dz);
    const d = Math.atan2(Math.sin(yawT - this.yaw), Math.cos(yawT - this.yaw));
    this.yaw += d * k;
    this.pitch += (Math.atan2(y - EYE_HEIGHT, Math.hypot(dx, dz)) - this.pitch) * k;
  }

  update(dt: number): void {
    const kbForward = (this.keys.has('KeyW') || this.keys.has('ArrowUp') ? 1 : 0) - (this.keys.has('KeyS') || this.keys.has('ArrowDown') ? 1 : 0);
    const kbStrafe = (this.keys.has('KeyD') || this.keys.has('ArrowRight') ? 1 : 0) - (this.keys.has('KeyA') || this.keys.has('ArrowLeft') ? 1 : 0);
    const forward = Math.max(-1, Math.min(1, kbForward + this.touchMove.y));
    const strafe = Math.max(-1, Math.min(1, kbStrafe + this.touchMove.x));

    const running = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') || Math.hypot(this.touchMove.x, this.touchMove.y) > TOUCH_RUN_AT;
    const speed = WALK_SPEED * (running ? SPRINT_MULT : 1);
    const sin = Math.sin(this.yaw);
    const cos = Math.cos(this.yaw);
    const len = Math.max(1, Math.hypot(forward, strafe)); // keeps partial joystick speed, normalizes diagonals
    const wishX = ((-sin * forward + cos * strafe) / len) * speed;
    const wishZ = ((-cos * forward - sin * strafe) / len) * speed;

    const k = 1 - Math.exp(-12 * dt); // smooth acceleration
    this.velocity.x += (wishX - this.velocity.x) * k;
    this.velocity.z += (wishZ - this.velocity.z) * k;

    this.move(this.velocity.x * dt, this.velocity.z * dt);

    const moving = Math.hypot(this.velocity.x, this.velocity.z);
    this.bobTime += dt * moving * 4.2;
    this.camera.position.set(this.pos.x, EYE_HEIGHT + Math.sin(this.bobTime) * 0.012 * Math.min(1, moving), this.pos.z);
    this.camera.rotation.set(this.pitch, this.yaw, 0);
  }

  private resetInput(): void {
    this.keys.clear();
    this.touchMove.x = 0;
    this.touchMove.y = 0;
    this.velocity.set(0, 0, 0);
  }

  private move(dx: number, dz: number): void {
    const b = this.bounds;
    const nx = Math.min(b.maxX - RADIUS, Math.max(b.minX + RADIUS, this.pos.x + dx));
    if (!this.hits(nx, this.pos.z)) this.pos.x = nx;
    const nz = Math.min(b.maxZ - RADIUS, Math.max(b.minZ + RADIUS, this.pos.z + dz));
    if (!this.hits(this.pos.x, nz)) this.pos.z = nz;
  }

  private hits(x: number, z: number): boolean {
    return this.colliders.some((r) => x > r.minX - RADIUS && x < r.maxX + RADIUS && z > r.minZ - RADIUS && z < r.maxZ + RADIUS);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (!this.locked) return;
    this.keys.add(e.code);
    if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
  };

  private onMouseMove = (e: MouseEvent) => {
    if (!this.locked || document.pointerLockElement !== this.dom) return;
    const mx = Math.max(-200, Math.min(200, e.movementX));
    const my = Math.max(-200, Math.min(200, e.movementY));
    this.yaw -= mx * MOUSE_SENS;
    this.pitch = Math.max(-1.45, Math.min(1.45, this.pitch - my * MOUSE_SENS));
  };

  private onLockChange = () => {
    const wasLocked = this.locked;
    this.locked = document.pointerLockElement === this.dom;
    if (!this.locked) this.resetInput();
    if (wasLocked !== this.locked) this.events.onLockChange(this.locked);
  };
}
