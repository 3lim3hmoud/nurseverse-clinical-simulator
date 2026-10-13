import { RAW_PROCEDURES, type RawProcedure } from './rawData';
import type { EquipGroup, EquipItem, ProcedureDef, ProcStep, StepKind } from './types';

/** Equipment names that are big devices (they stand on the floor or the wall rather than being carried). */
const DEVICE = /ventilator|suction apparatus|suction device|oxygen supply|oxygen source|medical air|flowmeter|monitor|humidifier/i;

export function stepKind(en: string): StepKind {
  if (/^gather\b/i.test(en) || /gather equipment/i.test(en)) return 'gather';
  if (/semi-fowler|elevate head of bed/i.test(en)) return 'position';
  if (/hand hygiene|wash hands/i.test(en)) return 'hygiene';
  return 'bedside';
}

function build(raw: RawProcedure): ProcedureDef {
  const id = raw.id as ProcedureDef['id'];
  const steps: ProcStep[] = raw.steps.map((s, index) => ({ ...s, index, kind: stepKind(s.en) }));
  const groups: EquipGroup[] = raw.groups.map((g, gi) => ({
    en: g.en,
    ar: g.ar,
    items: g.items.map((it, ii): EquipItem => ({ ...it, id: `${id}-${gi}-${ii}`, group: gi, device: DEVICE.test(it.en) })),
  }));
  const gather = steps.find((s) => s.kind === 'gather');
  return {
    id,
    titleEn: raw.titleEn,
    titleAr: raw.titleAr,
    ordered: true,
    steps,
    groups,
    equipmentFromApp: false,
    gateIndex: gather ? gather.index : null,
  };
}

/** The procedures in the app. For now only MV Care: the others are parked in docs/future-procedures.json. */
export const PROCEDURES: ProcedureDef[] = RAW_PROCEDURES.map(build);

export const getProcedure = (id: string): ProcedureDef => {
  const p = PROCEDURES.find((x) => x.id === id);
  if (!p) throw new Error(`unknown procedure ${id}`);
  return p;
};

export const allItems = (def: ProcedureDef): EquipItem[] => def.groups.flatMap((g) => g.items);

/**
 * Equipment that is already in the room at the bedside (wall oxygen and suction, the monitor, the ventilator).
 * It is not carried: the nurse only has to be at the bedside to use it.
 */
const FIXTURE = /mechanical ventilator|oxygen (supply|source|flowmeter)|medical air|pulse oximeter|cardiac monitor|ecg monitor|hemodynamic monitor|blood pressure monitor|infusion pump|crash cart|suction apparatus|suction device/i;
export const isBedsideFixture = (item: { en: string }): boolean => FIXTURE.test(item.en);

/** Procedures where the patient is on a ventilator (the ventilator stands at the head of the bed). */
export const VENTILATED: ProcedureDef['id'][] = ['mv'];
