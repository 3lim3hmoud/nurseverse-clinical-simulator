import { describe, expect, it } from 'vitest';
import { WASH_STEPS, WASH_TOTAL_SEC, washAt, type WashAnchors } from './handWashClips';
import type { HandPose } from './Hands';

const anchors: WashAnchors = { tap: [0, 0.05, -0.42], soap: [-0.15, 0.12, -0.42], towel: [0.15, 0.0, -0.42] };
const finite = (h: HandPose) => [...h.pos, ...h.rot, ...h.curl, h.spread].every((n) => Number.isFinite(n));

describe('WHO hand-washing technique', () => {
  it('has the eleven movements and takes 40-60 seconds', () => {
    expect(WASH_STEPS.map((s) => s.id)).toEqual(['wet', 'soap', 'palms', 'dorsum', 'interlaced', 'fingerbacks', 'thumbs', 'fingertips', 'wrists', 'rinse', 'dry']);
    expect(WASH_TOTAL_SEC).toBeGreaterThanOrEqual(40);
    expect(WASH_TOTAL_SEC).toBeLessThanOrEqual(60);
  });

  it('every step has bilingual text and a valid pose all the way through', () => {
    for (const s of WASH_STEPS) {
      expect(s.en.length).toBeGreaterThan(5);
      expect(s.ar.length).toBeGreaterThan(5);
      expect(s.tipEn.length).toBeGreaterThan(5);
      expect(s.tipAr.length).toBeGreaterThan(5);
      for (const u of [0, 0.1, 0.25, 0.5, 0.75, 0.99, 1]) {
        const p = s.pose(u, anchors);
        expect(finite(p.r)).toBe(true);
        expect(finite(p.l)).toBe(true);
        expect(p.foam).toBeGreaterThanOrEqual(0);
        expect(p.foam).toBeLessThanOrEqual(1);
        for (const c of [...p.r.curl, ...p.l.curl]) expect(c).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('runs the water only to wet and rinse (and until the towel closes the tap)', () => {
    const water = (id: string, u: number) => WASH_STEPS.find((s) => s.id === id)!.water?.(u);
    expect(water('wet', 0.5)).toBe(true);
    expect(water('rinse', 0.5)).toBe(true);
    for (const id of ['soap', 'palms', 'dorsum', 'interlaced', 'fingerbacks', 'thumbs', 'fingertips', 'wrists']) expect(water(id, 0.5)).toBe(false);
    expect(water('dry', 0.3)).toBe(true);
    expect(water('dry', 0.95)).toBe(false);
  });

  it('soap comes before lather, and the lather is gone after the rinse', () => {
    const foamAt = (id: string, u: number) => WASH_STEPS.find((s) => s.id === id)!.pose(u, anchors).foam;
    expect(foamAt('wet', 0.5)).toBe(0);
    expect(foamAt('palms', 0.5)).toBeGreaterThan(0.3);
    expect(foamAt('rinse', 0.99)).toBeLessThan(0.1);
    expect(foamAt('dry', 0.5)).toBe(0);
  });

  it('washAt walks through the steps in order', () => {
    expect(washAt(0)).toMatchObject({ index: 0, u: 0, done: false });
    expect(washAt(WASH_STEPS[0].sec + 0.01).index).toBe(1);
    expect(washAt(WASH_TOTAL_SEC - 0.01).index).toBe(WASH_STEPS.length - 1);
    expect(washAt(WASH_TOTAL_SEC + 5).done).toBe(true);
  });
});
