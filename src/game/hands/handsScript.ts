import type { HandsPose, Vec3 } from './Hands';

/** Named view-space points (see Hands.viewPoint) the hands reach for: the tap, the patient's mouth and so on. */
export type Anchors = Record<string, Vec3>;

/** Something that changes at a moment in a step: a glove goes on, the mask goes on... */
export interface ScriptFx {
  /** 0..1 through the step */
  at: number;
  gloveR?: boolean;
  gloveL?: boolean;
  mask?: boolean;
  goggles?: boolean;
}

export interface ScriptStep {
  id: string;
  en: string;
  ar: string;
  /** how to do it / why it matters, shown under the title */
  tipEn: string;
  tipAr: string;
  /** seconds at normal speed */
  sec: number;
  /** is the tap running (u = 0..1 through the step) */
  water?: (u: number) => boolean;
  fx?: ScriptFx[];
  /** which anchor the nurse looks at during this step (default: the one the script was started with) */
  look?: string;
  /** lather on the hands at the start and the end of the step (documentation only; the pose sets the real value) */
  foam?: [number, number];
  /** the pose of both hands, as a pure function of the progress through the step */
  pose(u: number, a: Anchors): HandsPose;
}

export const totalSec = (steps: readonly ScriptStep[]): number => steps.reduce((n, s) => n + s.sec, 0);

/** Which step and how far through it, for a time (seconds at normal speed) since the first step began. */
export function stepAt(steps: readonly ScriptStep[], t: number): { index: number; u: number; done: boolean } {
  let left = Math.max(0, t);
  for (const [i, s] of steps.entries()) {
    if (left < s.sec) return { index: i, u: left / s.sec, done: false };
    left -= s.sec;
  }
  return { index: steps.length - 1, u: 1, done: true };
}

export interface WornState {
  glovesR: boolean;
  glovesL: boolean;
  mask: boolean;
  goggles: boolean;
}

/** What the nurse is wearing at a moment of the script, given what she wore at the start. */
export function wornAt(steps: readonly ScriptStep[], t: number, start: WornState): WornState {
  const w = { ...start };
  let left = Math.max(0, t);
  for (const s of steps) {
    const u = Math.min(1, left / s.sec);
    for (const fx of s.fx ?? []) {
      if (u < fx.at) continue;
      if (fx.gloveR !== undefined) w.glovesR = fx.gloveR;
      if (fx.gloveL !== undefined) w.glovesL = fx.gloveL;
      if (fx.mask !== undefined) w.mask = fx.mask;
      if (fx.goggles !== undefined) w.goggles = fx.goggles;
    }
    if (left < s.sec) break;
    left -= s.sec;
  }
  return w;
}
