import * as THREE from 'three';
import type { Hands, HandsPose } from './Hands';
import { stepAt, totalSec, wornAt, type Anchors, type ScriptStep, type WornState } from './handsScript';

export interface RunProgress {
  index: number;
  total: number;
  en: string;
  ar: string;
  tipEn: string;
  tipAr: string;
  /** 0..1 through the whole script */
  overall: number;
}

export interface RunEnv {
  hands: Hands;
  camera: THREE.PerspectiveCamera;
  /** the run only asks, the simulator moves the player */
  driveTo(x: number, z: number, k: number): void;
  lookAt(x: number, y: number, z: number, k: number): void;
  distanceTo(x: number, z: number): number;
  setScripted(on: boolean): void;
  setWater(on: boolean): void;
  /** where the nurse stands, and what she looks at */
  stand: THREE.Vector3;
  /** the anchor the nurse looks at when a step does not say */
  lookDefault: string;
  /** world positions of the things the hands reach for (read every frame: they can move) */
  anchorsWorld: () => Record<string, THREE.Vector3>;
}

const APPROACH_SEC = 1.1;
const LEAVE_SEC = 0.7;
const DEPTH = 0.46;

/**
 * Walks the nurse to a spot, raises her hands and plays a script of hand movements step by step (hand washing, putting
 * PPE on, a bedside task). `update` is called every frame; it ends by calling `onDone` (never, if cancelled).
 */
export class HandsRun {
  speed = 1;
  private t = 0;
  private phase: 'approach' | 'play' | 'leave' | 'over' = 'approach';
  private scriptT = 0;
  private lastIndex = -1;
  private lastReport = 0;
  private start: WornState;

  constructor(
    private env: RunEnv,
    readonly steps: readonly ScriptStep[],
    private onProgress: (p: RunProgress) => void,
    private onDone: () => void,
  ) {
    const g = env.hands.gloved;
    this.start = { glovesR: g.r, glovesL: g.l, mask: env.hands.maskOn, goggles: env.hands.gogglesOn };
    env.setScripted(true);
    env.hands.show(true);
    this.report(0);
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
    for (let i = 0; i < index; i++) sec += this.steps[i].sec;
    this.phase = 'play';
    this.scriptT = sec + u * this.steps[index].sec;
    this.t = APPROACH_SEC;
    this.apply(this.scriptT);
    this.env.hands.snap();
  }

  update(dt: number): void {
    if (this.phase === 'over') return;
    const e = this.env;
    const k = 1 - Math.exp(-6 * dt);
    this.t += dt;

    // always: stand at the spot and look at the work
    e.driveTo(e.stand.x, e.stand.z, k);
    const world = e.anchorsWorld();
    const idx = this.phase === 'play' ? stepAt(this.steps, this.scriptT).index : 0;
    const look = world[this.steps[idx].look ?? e.lookDefault] ?? world[e.lookDefault];
    e.lookAt(look.x, look.y, look.z, k);

    if (this.phase === 'approach') {
      this.apply(0);
      if (this.t >= APPROACH_SEC && e.distanceTo(e.stand.x, e.stand.z) < 0.06) this.phase = 'play';
      return;
    }

    if (this.phase === 'play') {
      this.scriptT += dt * this.speed;
      const { index, u, done } = stepAt(this.steps, this.scriptT);
      e.setWater(this.steps[index].water?.(u) ?? false);
      this.apply(this.scriptT);
      if (index !== this.lastIndex || this.t - this.lastReport > 0.15) this.report(this.scriptT);
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

  private apply(t: number): void {
    const { index, u } = stepAt(this.steps, t);
    const pose: HandsPose = this.steps[index].pose(u, this.anchors());
    this.env.hands.setPose(pose);
    const w = wornAt(this.steps, t, this.start);
    this.env.hands.setGloves({ r: w.glovesR, l: w.glovesL });
    this.env.hands.setWorn(w.mask, w.goggles);
  }

  private anchors(): Anchors {
    // projected every frame: the camera is still settling during the approach
    const e = this.env;
    e.camera.updateMatrixWorld();
    const out: Anchors = {};
    for (const [name, p] of Object.entries(e.anchorsWorld())) out[name] = e.hands.viewPoint(p, e.camera, DEPTH);
    return out;
  }

  private report(t: number): void {
    const { index } = stepAt(this.steps, t);
    const s = this.steps[index];
    this.lastIndex = index;
    this.lastReport = this.t;
    this.onProgress({ index, total: this.steps.length, en: s.en, ar: s.ar, tipEn: s.tipEn, tipAr: s.tipAr, overall: Math.min(1, t / totalSec(this.steps)) });
  }
}
