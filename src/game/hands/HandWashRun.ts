import * as THREE from 'three';
import type { Hands, HandsPose } from './Hands';
import { IDLE_POSE } from './Hands';
import { WASH_STEPS, WASH_TOTAL_SEC, washAt, type WashAnchors } from './handWashClips';

export interface WashProgress {
  index: number;
  total: number;
  en: string;
  ar: string;
  tipEn: string;
  tipAr: string;
  /** 0..1 through the whole wash */
  overall: number;
}

export interface WashEnv {
  hands: Hands;
  camera: THREE.PerspectiveCamera;
  /** player walks/turns: the run only asks, the simulator moves */
  driveTo(x: number, z: number, k: number): void;
  lookAt(x: number, y: number, z: number, k: number): void;
  distanceTo(x: number, z: number): number;
  setScripted(on: boolean): void;
  setWater(on: boolean): void;
  /** world positions */
  stand: THREE.Vector3;
  basin: THREE.Vector3;
  anchorsWorld: { tap: THREE.Vector3; soap: THREE.Vector3; towel: THREE.Vector3 };
}

const APPROACH_SEC = 1.2;
const LEAVE_SEC = 0.7;

/**
 * Walks the nurse to the sink, raises her hands and plays the WHO hand-washing technique, step by step.
 * `update` is called every frame; it ends by calling `onDone` (or never, if cancelled).
 */
export class HandWashRun {
  speed = 1;
  private t = 0;
  private phase: 'approach' | 'wash' | 'leave' | 'over' = 'approach';
  private washT = 0;
  private lastIndex = -1;
  private lastReport = 0;
  private anchors: WashAnchors | null = null;

  constructor(
    private env: WashEnv,
    private onProgress: (p: WashProgress) => void,
    private onDone: () => void,
  ) {
    env.setScripted(true);
    env.hands.show(true);
    env.hands.setGloves(false);
    this.report(0, true);
  }

  get active(): boolean {
    return this.phase !== 'over';
  }

  /** Stop right now (the player pressed Esc): hands go down, the tap is closed, no credit. */
  cancel(): void {
    if (this.phase === 'over') return;
    this.phase = 'over';
    this.env.setWater(false);
    this.env.hands.show(false);
    this.env.setScripted(false);
  }

  /** Jump into the middle of a step (tests and the debug view). */
  seek(index: number, u: number): void {
    let sec = 0;
    for (let i = 0; i < index; i++) sec += WASH_STEPS[i].sec;
    this.phase = 'wash';
    this.washT = sec + u * WASH_STEPS[index].sec;
    this.t = APPROACH_SEC;
    this.env.hands.setPose(this.poseAt(this.washT));
    this.env.hands.snap();
  }

  update(dt: number): void {
    if (this.phase === 'over') return;
    const e = this.env;
    const k = 1 - Math.exp(-6 * dt);
    this.t += dt;

    // always: stand at the sink and look at the basin
    e.driveTo(e.stand.x, e.stand.z, k);
    e.lookAt(e.basin.x, e.basin.y, e.basin.z, k);

    if (this.phase === 'approach') {
      e.hands.setPose(this.poseAt(0));
      if (this.t >= APPROACH_SEC && e.distanceTo(e.stand.x, e.stand.z) < 0.05) this.phase = 'wash';
      return;
    }

    if (this.phase === 'wash') {
      this.washT += dt * this.speed;
      const { index, u, done } = washAt(this.washT);
      const step = WASH_STEPS[index];
      e.setWater(step.water(u));
      e.hands.setPose(this.poseAt(this.washT));
      if (index !== this.lastIndex || this.t - this.lastReport > 0.15) this.report(this.washT);
      if (done) {
        this.phase = 'leave';
        this.t = 0;
        e.setWater(false);
      }
      return;
    }

    // leave: hands go down, then hand control back
    e.hands.show(false);
    if (this.t >= LEAVE_SEC) {
      this.phase = 'over';
      e.setScripted(false);
      this.onDone();
    }
  }

  private poseAt(t: number): HandsPose {
    const { index, u } = washAt(t);
    return WASH_STEPS[index].pose(u, this.getAnchors());
  }

  private getAnchors(): WashAnchors {
    // projected every call: the camera is still settling during the approach
    const e = this.env;
    this.env.camera.updateMatrixWorld();
    const proj = (p: THREE.Vector3, d: number) => e.hands.viewPoint(p, e.camera, d);
    this.anchors = { tap: proj(e.anchorsWorld.tap, 0.42), soap: proj(e.anchorsWorld.soap, 0.42), towel: proj(e.anchorsWorld.towel, 0.42) };
    return this.anchors;
  }

  private report(washT: number, force = false): void {
    const { index } = washAt(washT);
    const s = WASH_STEPS[index];
    this.lastIndex = index;
    this.lastReport = this.t;
    if (!force && this.phase === 'over') return;
    this.onProgress({ index, total: WASH_STEPS.length, en: s.en, ar: s.ar, tipEn: s.tipEn, tipAr: s.tipAr, overall: Math.min(1, washT / WASH_TOTAL_SEC) });
  }
}

export { IDLE_POSE };
