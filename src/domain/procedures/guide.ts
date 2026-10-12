import { HYGIENE_STATION, BED_CENTER, BED_CONTROL, NEAR_BED, NEAR_SANITIZER, distanceToBed, type Point } from './layoutPoints';
import { POSITION_MAX, POSITION_MIN, type ProcedureSession } from './ProcedureSession';
import type { ProcStep } from './types';

/** A supply table, as far as the guide needs to know. x/z is where to stand in front of it. */
export interface TableInfo extends Point {
  /** shown on the sign: "3 · Circuit Components" */
  number: number;
  /** index of the equipment group on the table */
  group: number;
  en: string;
  ar: string;
  itemIds: string[];
}

export type ObjectiveKind = 'sanitizer' | 'tables' | 'bed-control' | 'bedside' | 'finish';

export interface Objective {
  kind: ObjectiveKind;
  /** where to go (null when there is nowhere to go) */
  target: Point | null;
  /** true when the nurse is already there: the text then says what to do */
  arrived: boolean;
  en: string;
  ar: string;
  step: ProcStep | null;
}

export interface GuideInput {
  session: ProcedureSession;
  player: Point;
  tables: TableInfo[];
  /** commanded bed head angle in degrees */
  headDeg: number;
}

const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.z - b.z);

/**
 * "What do I do now, and where?" for practice mode. It follows the same rules as ProcedureSession.check,
 * so the arrow never sends the nurse somewhere the rules would then refuse.
 */
export function currentObjective({ session, player, tables, headDeg }: GuideInput): Objective {
  const step = session.nextStep();
  if (!step) {
    return { kind: 'finish', target: null, arrived: true, step: null, en: 'All steps are done. Press Finish to see your result.', ar: 'تمت كل الخطوات. اضغط إنهاء لرؤية النتيجة.' };
  }
  const missing = session.missing();
  const gated = step.kind === 'gather' || (step.kind !== 'hygiene' && session.def.gateIndex !== null && step.index >= session.def.gateIndex);

  if (gated && missing.length > 0) {
    // the closest table that still has something we need
    const left = tables
      .map((t) => ({ t, n: t.itemIds.filter((id) => missing.some((m) => m.id === id)).length }))
      .filter((x) => x.n > 0)
      .sort((a, b) => dist(a.t, player) - dist(b.t, player))[0];
    if (left) {
      const near = dist(left.t, player) < 1.8;
      const total = missing.length;
      return {
        kind: 'tables',
        target: left.t,
        arrived: near,
        step,
        en: near
          ? `Table ${left.t.number} (${left.t.en}): aim at each item and press E. ${total} item${total === 1 ? '' : 's'} still missing.`
          : `Collect the equipment first: go to table ${left.t.number} (${left.t.en}). ${total} item${total === 1 ? '' : 's'} still missing.`,
        ar: near
          ? `الطاولة ${left.t.number} (${left.t.ar}): صوّب على كل أداة واضغط E. ما زال ينقصك ${total}.`
          : `اجمع الأدوات أولاً: اذهب إلى الطاولة ${left.t.number} (${left.t.ar}). ما زال ينقصك ${total}.`,
      };
    }
  }

  if (step.kind === 'hygiene') {
    const d = Math.min(dist(player, HYGIENE_STATION), 99);
    const near = d <= NEAR_SANITIZER;
    return {
      kind: 'sanitizer',
      target: HYGIENE_STATION,
      arrived: near,
      step,
      en: near ? 'Aim at the hand sanitizer and press E to clean your hands.' : 'Wash your hands: go to the hand-hygiene station (the stand with the blue sign).',
      ar: near ? 'صوّب على معقم اليدين واضغط E لتعقيم يديك.' : 'اغسل يديك: اذهب إلى محطة نظافة اليدين (العمود ذو اللافتة الزرقاء).',
    };
  }

  if (step.kind === 'position') {
    const rad = (headDeg * Math.PI) / 180;
    if (rad < POSITION_MIN || rad > POSITION_MAX) {
      const near = dist(player, BED_CONTROL) < 2.2;
      return {
        kind: 'bed-control',
        target: BED_CONTROL,
        arrived: near,
        step,
        en: near ? `Press E on the bed control until the bed head is 30–45° (now ${headDeg}°).` : 'Go to the bed control (the post beside the bed) to raise the head of the bed.',
        ar: near ? `اضغط E على مفتاح السرير حتى يصبح الرأس 30–45 درجة (الآن ${headDeg}°).` : 'اذهب إلى مفتاح السرير (العمود بجانب السرير) لرفع رأس السرير.',
      };
    }
  }

  if (step.kind === 'gather') {
    // nothing left to collect: confirming it is done from the list, wherever the nurse stands
    return {
      kind: 'bedside',
      target: null,
      arrived: true,
      step,
      en: `Step ${step.n}: you have everything. Open the Steps list (Q or the Steps button) and do it.`,
      ar: `الخطوة ${step.n}: معك كل الأدوات. افتح قائمة الخطوات (Q أو زر الخطوات) ونفّذها.`,
    };
  }

  // everything else is done at the bedside, from the steps list
  const near = distanceToBed(player) <= NEAR_BED;
  const n = step.n;
  return {
    kind: 'bedside',
    target: BED_CENTER,
    arrived: near,
    step,
    en: near ? `Step ${n}: open the Steps list (Q or the Steps button) and do it.` : `Step ${n}: go next to the patient's bed.`,
    ar: near ? `الخطوة ${n}: افتح قائمة الخطوات (Q أو زر الخطوات) ونفّذها.` : `الخطوة ${n}: اقترب من سرير المريض.`,
  };
}

export { NEAR_SANITIZER };
