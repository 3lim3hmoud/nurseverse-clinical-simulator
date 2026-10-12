import { describe, expect, it } from 'vitest';
import { allItems, getProcedure, PROCEDURES, stepKind } from './catalog';
import { blockMessage, coachAnswer } from './coach';
import { ProcedureSession, type Context } from './ProcedureSession';

const AT_BED: Context = { nearBed: true, nearSanitizer: false, headAngleRad: (30 * Math.PI) / 180 };
const AT_SANITIZER: Context = { nearBed: false, nearSanitizer: true, headAngleRad: 0 };
let clock = 0;
const newSession = (id: string, mode: 'practice' | 'exam' = 'practice', seed = 1) => {
  clock = 0;
  return new ProcedureSession(getProcedure(id), mode, () => clock, seed);
};
const fillTray = (s: ProcedureSession) => s.required.forEach((i) => s.pick(i.id));
const ctxFor = (kind: string): Context => (kind === 'hygiene' ? AT_SANITIZER : AT_BED);

/** Do every step in order, in the right place. */
function completeAll(s: ProcedureSession) {
  fillTray(s);
  for (const step of s.def.steps) {
    const r = s.perform(`s${step.index}`, ctxFor(step.kind));
    if (!r.ok) throw new Error(`step ${step.n} blocked: ${r.reason}`);
  }
}

describe('catalog (from the course sheets)', () => {
  it('has the nine procedures with the expected number of steps', () => {
    expect(PROCEDURES.map((p) => [p.id, p.steps.length])).toEqual([
      ['mv', 13], ['trach', 10], ['acls', 18], ['tpn', 10], ['art', 10], ['pa', 13], ['vap', 9], ['cauti', 9], ['clabsi', 12],
    ]);
  });
  it('every step has English, Arabic, a "what am I doing" and a rationale in both languages', () => {
    for (const p of PROCEDURES) for (const s of p.steps) for (const f of [s.en, s.ar, s.doing, s.whyEn, s.whyAr]) expect(f.length, `${p.id} step ${s.n}`).toBeGreaterThan(3);
  });
  it('item ids are unique and every procedure has equipment', () => {
    for (const p of PROCEDURES) {
      const ids = allItems(p).map((i) => i.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids.length).toBeGreaterThan(0);
    }
  });
  it('only the bundles are unordered, and only they use app-made equipment', () => {
    expect(PROCEDURES.filter((p) => !p.ordered).map((p) => p.id)).toEqual(['vap', 'cauti', 'clabsi']);
    expect(PROCEDURES.filter((p) => p.equipmentFromApp).map((p) => p.id)).toEqual(['vap', 'cauti', 'clabsi']);
  });
  it('recognises the kind of the steps that need a place or a thing', () => {
    expect(stepKind('Perform Hand Hygiene & Wear PPE (gloves, mask, goggles)')).toBe('hygiene');
    expect(stepKind('Gather Equipment (suction catheter)')).toBe('gather');
    expect(stepKind("Explain Procedure to Patient, Position Patient (semi-Fowler's 30–45°)")).toBe('position');
    expect(stepKind('Assess Patient (vital signs)')).toBe('bedside');
    expect(getProcedure('mv').steps.map((s) => s.kind).slice(0, 4)).toEqual(['hygiene', 'gather', 'position', 'bedside']);
  });
});

describe('ordering', () => {
  it('only the next step can be done in an ordered procedure', () => {
    const s = newSession('mv');
    fillTray(s);
    const r = s.perform('s3', AT_BED); // step 4 before 1
    expect(r).toMatchObject({ ok: false, reason: 'order', expected: 0 });
    expect(s.doneCount).toBe(0);
    expect(s.errors).toHaveLength(1);
  });
  it('a bundle can be done in any order', () => {
    const s = newSession('vap');
    fillTray(s);
    expect(s.perform('s5', AT_BED).ok).toBe(true);
    expect(s.perform('s0', AT_BED).ok).toBe(true);
    expect(s.errors).toHaveLength(0);
  });
  it('a step cannot be done twice', () => {
    const s = newSession('vap');
    fillTray(s);
    s.perform('s0', AT_BED);
    expect(s.perform('s0', AT_BED)).toMatchObject({ ok: false, reason: 'done' });
  });
});

describe('places and things', () => {
  it('hand hygiene needs the sanitizer', () => {
    const s = newSession('mv');
    expect(s.perform('s0', AT_BED)).toMatchObject({ ok: false, reason: 'sanitizer' });
    expect(s.perform('s0', AT_SANITIZER).ok).toBe(true);
  });
  it('gathering needs the whole tray', () => {
    const s = newSession('mv');
    s.perform('s0', AT_SANITIZER);
    const blocked = s.perform('s1', AT_BED);
    expect(blocked).toMatchObject({ ok: false, reason: 'equipment' });
    expect(blocked.ok === false && blocked.missing!.length).toBe(23);
    fillTray(s);
    expect(s.perform('s1', AT_BED).ok).toBe(true);
  });
  it('positioning needs the bed head at semi-Fowler', () => {
    const s = newSession('mv');
    fillTray(s);
    s.perform('s0', AT_SANITIZER);
    s.perform('s1', AT_BED);
    expect(s.perform('s2', { ...AT_BED, headAngleRad: 0 })).toMatchObject({ ok: false, reason: 'position' });
    expect(s.perform('s2', { ...AT_BED, headAngleRad: 1.0 })).toMatchObject({ ok: false, reason: 'position' }); // 57 degrees is too high
    expect(s.perform('s2', { ...AT_BED, headAngleRad: 0.6 }).ok).toBe(true);
  });
  it('bedside steps need the patient close', () => {
    const s = newSession('art');
    fillTray(s);
    expect(s.perform('s0', { ...AT_BED, nearBed: false })).toMatchObject({ ok: false, reason: 'bed' });
  });
  it('bedside work is blocked until the tray is full where the procedure has no gather step', () => {
    const s = newSession('trach');
    s.perform('s0', AT_SANITIZER);
    expect(s.perform('s1', AT_BED)).toMatchObject({ ok: false, reason: 'equipment' });
  });
  it('ACLS does not wait for the equipment: compressions start at once', () => {
    const s = newSession('acls');
    expect(s.perform('s0', AT_BED).ok).toBe(true);
    expect(s.perform('s1', AT_BED).ok).toBe(true);
  });
});

describe('scoring', () => {
  it('a perfect run passes with 100%', () => {
    const s = newSession('mv');
    completeAll(s);
    expect(s.finished).toBe(true);
    expect(s.finish()).toMatchObject({ percent: 100, passed: true, orderErrors: 0, extras: 0 });
  });
  it('every procedure can be completed in order', () => {
    for (const p of PROCEDURES) {
      const s = newSession(p.id);
      completeAll(s);
      expect(s.finish().percent, p.id).toBe(100);
    }
  });
  it('wrong order costs points but not completion', () => {
    const s = newSession('mv');
    fillTray(s);
    s.perform('s5', AT_BED);
    s.perform('s7', AT_BED);
    for (const step of s.def.steps) s.perform(`s${step.index}`, ctxFor(step.kind));
    const r = s.finish();
    expect(r.orderErrors).toBe(2);
    expect(r.percent).toBeLessThan(100);
    expect(r.passed).toBe(r.percent >= 80);
  });
  it('an unfinished run never passes', () => {
    const s = newSession('mv');
    fillTray(s);
    s.perform('s0', AT_SANITIZER);
    expect(s.finish().passed).toBe(false);
  });
  it('time is measured and a timed-out exam is marked', () => {
    const s = newSession('mv', 'exam');
    clock = 90;
    expect(s.finish(true)).toMatchObject({ seconds: 90, timedOut: true });
  });
});

describe('exam', () => {
  it('adds distractor items and steps that are not part of the procedure', () => {
    const s = newSession('mv', 'exam', 7);
    expect(s.items.filter((i) => i.extra)).toHaveLength(6);
    expect(s.actions).toHaveLength(s.def.steps.length + 3);
    expect(s.actions.filter((a) => a.stepIndex === null)).toHaveLength(3);
    expect(s.limitSec).toBe(13 * 50 + 120);
  });
  it('picking a distractor item or step is an error', () => {
    const s = newSession('mv', 'exam', 7);
    s.pick(s.items.find((i) => i.extra)!.id);
    const fake = s.actions.find((a) => a.stepIndex === null)!;
    expect(s.perform(fake.key, AT_BED)).toMatchObject({ ok: false, reason: 'distractor' });
    const r = s.result();
    expect(r.extras).toBe(1);
    expect(r.distractorErrors).toBe(1);
  });
  it('is shuffled the same way for the same seed and differently for another', () => {
    const a = newSession('mv', 'exam', 3).actions.map((x) => x.key).join();
    expect(newSession('mv', 'exam', 3).actions.map((x) => x.key).join()).toBe(a);
    expect(newSession('mv', 'exam', 4).actions.map((x) => x.key).join()).not.toBe(a);
  });
  it('practice has no distractors and keeps the order', () => {
    const s = newSession('mv');
    expect(s.items.some((i) => i.extra)).toBe(false);
    expect(s.actions.map((a) => a.stepIndex)).toEqual(s.def.steps.map((x) => x.index));
  });
});

describe('coach', () => {
  const state = (s: ProcedureSession, lang: 'en' | 'ar' = 'en') => ({ session: s, lang });
  it('tells the next step and where to go', () => {
    const s = newSession('mv');
    expect(coachAnswer(state(s), 'what is next?')).toContain('Perform Hand Hygiene');
    expect(coachAnswer(state(s), 'what is next?')).toContain('sanitizer');
  });
  it('answers in Arabic', () => {
    const s = newSession('mv');
    expect(coachAnswer(state(s, 'ar'), 'ايه الخطوة الجاية')).toContain('غسل اليدين');
  });
  it('explains why, from the course sheet', () => {
    const s = newSession('mv');
    expect(coachAnswer(state(s), 'why')).toContain(getProcedure('mv').steps[0].whyEn);
  });
  it('lists the missing equipment by table', () => {
    const s = newSession('mv');
    expect(coachAnswer(state(s), 'what equipment is missing')).toContain('Main Devices');
    fillTray(s);
    expect(coachAnswer(state(s), 'what equipment is missing')).toContain('all the equipment');
  });
  it('explains an order mistake by naming the right step', () => {
    const s = newSession('mv');
    const r = s.perform('s4', AT_BED);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(blockMessage(state(s), r)).toContain('step is 1');
  });
});
