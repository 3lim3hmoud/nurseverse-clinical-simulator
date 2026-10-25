import { describe, expect, it } from 'vitest';
import { allItems, getProcedure, PROCEDURES, stepKind } from './catalog';
import { blockMessage, coachAnswer } from './coach';
import { currentObjective, type TableInfo } from './guide';
import { HYGIENE_STATION, BED_CONTROL, whereAmI } from './layoutPoints';
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
  it('has MV Care (13 steps) for now; the others are parked for later', () => {
    expect(PROCEDURES.map((p) => [p.id, p.steps.length])).toEqual([['mv', 13]]);
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
  it('MV Care is an ordered procedure with the equipment from the course sheet', () => {
    expect(PROCEDURES.every((p) => p.ordered && !p.equipmentFromApp)).toBe(true);
  });
  it('recognises the kind of the steps that need a place or a thing', () => {
    expect(stepKind('Perform Hand Hygiene & Wear PPE (gloves, mask, goggles)')).toBe('hygiene');
    expect(stepKind('Gather Equipment (suction catheter)')).toBe('gather');
    expect(stepKind("Explain Procedure to Patient, Position Patient (semi-Fowler's 30–45°)")).toBe('position');
    expect(stepKind('Assess Patient (vital signs)')).toBe('bedside');
    expect(getProcedure('mv').steps.map((s) => s.kind).slice(0, 4)).toEqual(['hygiene', 'gather', 'position', 'bedside']);
  });
});

describe('bedside fixtures', () => {
  it('wall oxygen, the ventilator, the monitor and suction are at the bedside, not on the tables', () => {
    const s = newSession('mv');
    const names = s.fixtures().map((i) => i.en);
    expect(names).toEqual(expect.arrayContaining(['Mechanical Ventilator', 'Oxygen Flowmeter', 'Suction Apparatus']));
    expect(s.tableItems().every((i) => !names.includes(i.en))).toBe(true);
    expect(s.required.length + s.fixtures().length).toBe(23);
  });
  it('a fixture cannot be picked up, and is not missing', () => {
    const s = newSession('mv');
    const vent = s.fixtures().find((i) => i.en === 'Mechanical Ventilator')!;
    expect(s.pick(vent.id).ok).toBe(false);
    expect(s.missing().some((i) => i.id === vent.id)).toBe(false);
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
  it('a step cannot be done twice', () => {
    const s = newSession('mv');
    fillTray(s);
    s.perform('s0', AT_SANITIZER);
    expect(s.perform('s0', AT_SANITIZER)).toMatchObject({ ok: false, reason: 'done' });
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
    expect(blocked.ok === false && blocked.missing!.length).toBe(17); // 23 items, 6 are already at the bedside
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
    const s = newSession('mv');
    fillTray(s);
    s.perform('s0', AT_SANITIZER);
    s.perform('s1', AT_BED);
    s.perform('s2', AT_BED);
    expect(s.perform('s3', { ...AT_BED, nearBed: false })).toMatchObject({ ok: false, reason: 'bed' });
  });
  it('bedside work is blocked until the tray is full', () => {
    const s = newSession('mv');
    s.perform('s0', AT_SANITIZER);
    expect(s.perform('s1', AT_BED)).toMatchObject({ ok: false, reason: 'equipment' });
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
    expect(s.limitSec).toBe(13 * 50 + 120 + 240);
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

describe('guide (where to go and what to do)', () => {
  const tablesOf = (s: ProcedureSession): TableInfo[] =>
    s.def.groups.map((g, i) => ({ x: 4, z: i * 2, number: i + 1, group: i, en: g.en, ar: g.ar, itemIds: g.items.map((x) => x.id) }));
  const guide = (s: ProcedureSession, player = { x: 0, z: 9 }, headDeg = 0) => currentObjective({ session: s, player, tables: tablesOf(s), headDeg });

  it('starts with washing hands at the station', () => {
    const s = newSession('mv');
    const far = guide(s, { x: 0, z: 9 });
    expect(far).toMatchObject({ kind: 'sanitizer', arrived: false, target: HYGIENE_STATION });
    expect(far.en).toContain('hand-hygiene station');
    expect(guide(s, { x: HYGIENE_STATION.x, z: HYGIENE_STATION.z + 1 })).toMatchObject({ kind: 'sanitizer', arrived: true });
  });
  it('then sends the nurse to the nearest table that still has what is missing', () => {
    const s = newSession('mv');
    s.perform('s0', AT_SANITIZER);
    const g = guide(s);
    expect(g.kind).toBe('tables');
    expect(g.en).toMatch(/table \d/i);
    // collect everything from the first table: the guide moves on to a table that still has items
    const first = tablesOf(s)[0];
    first.itemIds.forEach((id) => s.pick(id));
    expect(guide(s, { x: first.x, z: first.z }).en).not.toContain(`table ${first.number} (`);
  });
  it('says what to do once the equipment is complete, then goes to the bed control for the position step', () => {
    const s = newSession('mv');
    s.perform('s0', AT_SANITIZER);
    fillTray(s);
    expect(guide(s).en).toContain('you have everything');
    s.perform('s1', AT_BED);
    const g = guide(s, { x: 3, z: 3 }, 0);
    expect(g).toMatchObject({ kind: 'bed-control', target: BED_CONTROL, arrived: false });
    expect(guide(s, { x: 1.4, z: -1.1 }, 0).en).toContain('now 0°');
    expect(guide(s, { x: 3, z: 3 }, 30).kind).toBe('bedside');
  });
  it('never sends the nurse somewhere the rules refuse: the objective matches what check() allows', () => {
    const s = newSession('mv');
    for (const step of s.def.steps) {
      fillTray(s);
      const g = guide(s, step.kind === 'hygiene' ? HYGIENE_STATION : { x: 1.1, z: -1.4 }, 30);
      expect(g.step?.index, `step ${step.n}`).toBe(step.index);
      expect(s.perform(`s${step.index}`, ctxFor(step.kind)).ok).toBe(true);
    }
    expect(guide(s).kind).toBe('finish');
  });
  it('knows when the nurse is near the bed or a sanitizer', () => {
    expect(whereAmI({ x: 1.1, z: -1.4 }).nearBed).toBe(true);
    expect(whereAmI({ x: 4, z: 3 }).nearBed).toBe(false);
    expect(whereAmI({ x: HYGIENE_STATION.x, z: HYGIENE_STATION.z + 1.5 }).nearSanitizer).toBe(true);
    expect(whereAmI({ x: 0, z: 8 }).nearSanitizer).toBe(false);
  });
});
