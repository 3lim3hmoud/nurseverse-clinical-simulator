import { describe, expect, it } from 'vitest';
import { BEDSIDE, bedsideScriptFor } from './bedsideClips';
import { DOFF_STEPS, DON_STEPS } from './ppeClips';
import { WASH_STEPS } from './handWashClips';
import { stepAt, totalSec, wornAt, type Anchors, type ScriptStep } from './handsScript';
import type { HandPose } from './Hands';
import { RAW_PROCEDURES } from '../../domain/procedures/rawData';

const anchors: Anchors = {
  mouth: [0, 0, -0.46], chest: [0, -0.15, -0.46], wrist: [0.12, -0.12, -0.46], vent: [-0.2, 0.05, -0.46],
  tap: [0, 0.05, -0.46], soap: [-0.15, 0.1, -0.46], towel: [0.15, 0, -0.46], bin: [0.2, -0.2, -0.46], basin: [0, -0.05, -0.46],
};
const finite = (h: HandPose) => [...h.pos, ...h.rot, ...h.curl, h.spread].every((n) => Number.isFinite(n));

const all: [string, ScriptStep[]][] = [
  ['don', DON_STEPS], ['doff', DOFF_STEPS],
  ...Object.entries(BEDSIDE).map(([k, f]) => [k, f()] as [string, ScriptStep[]]),
];

describe('hand scripts', () => {
  it.each(all)('%s: every step has bilingual text and valid poses all the way through', (_name, steps) => {
    for (const s of steps) {
      for (const text of [s.en, s.ar, s.tipEn, s.tipAr]) expect(text.length).toBeGreaterThan(5);
      expect(s.sec).toBeGreaterThan(1);
      for (const u of [0, 0.1, 0.25, 0.5, 0.75, 0.99, 1]) {
        const p = s.pose(u, anchors);
        expect(finite(p.r)).toBe(true);
        expect(finite(p.l)).toBe(true);
      }
    }
  });

  it('every step of MV Care that needs hands has a movement (or is handled elsewhere)', () => {
    const steps = RAW_PROCEDURES.find((p) => p.id === 'mv')!.steps;
    const handled = (en: string) => /hand hygiene|gather equipment/i.test(en) || bedsideScriptFor(en) !== null;
    for (const s of steps) expect(handled(s.en), s.en).toBe(true);
  });

  it('PPE goes on in the right order and comes off in the right order', () => {
    const start = { glovesR: false, glovesL: false, mask: false, goggles: false };
    expect(DON_STEPS.map((s) => s.id)).toEqual(['mask', 'goggles', 'glove-right', 'glove-left']);
    const end = wornAt(DON_STEPS, totalSec(DON_STEPS) + 1, start);
    expect(end).toEqual({ glovesR: true, glovesL: true, mask: true, goggles: true });
    expect(wornAt(DON_STEPS, 0.1, start).mask).toBe(false);
    expect(DOFF_STEPS.map((s) => s.id)).toEqual(['doff-gloves', 'doff-goggles', 'doff-mask']);
    const off = wornAt(DOFF_STEPS, totalSec(DOFF_STEPS) + 1, end);
    expect(off).toEqual({ glovesR: false, glovesL: false, mask: false, goggles: false });
  });

  it('the whole put-on-and-wash script is long enough to be taken seriously but not endless', () => {
    expect(totalSec([...WASH_STEPS, ...DON_STEPS])).toBeLessThan(90);
    expect(stepAt([...WASH_STEPS, ...DON_STEPS], 1000).done).toBe(true);
  });
});
