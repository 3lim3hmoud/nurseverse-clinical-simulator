export type ProcedureId = 'mv' | 'trach' | 'acls' | 'tpn' | 'art' | 'pa' | 'vap' | 'cauti' | 'clabsi';

/**
 * What the nurse has to do for a step in the 3D room:
 *  - gather: all the required equipment must be in the tray
 *  - hygiene: be at the hand sanitizer
 *  - position: set the bed head to semi-Fowler's (30-45 degrees)
 *  - bedside: be next to the patient (and have the equipment)
 */
export type StepKind = 'gather' | 'hygiene' | 'position' | 'bedside';

export interface ProcStep {
  /** 0-based position in the procedure */
  index: number;
  n: number;
  en: string;
  ar: string;
  doing: string;
  whyEn: string;
  whyAr: string;
  kind: StepKind;
}

export interface EquipItem {
  id: string;
  en: string;
  ar: string;
  use: string;
  /** index of its group */
  group: number;
  /** a big device (ventilator, pump, monitor...) rather than a hand-held supply */
  device: boolean;
}

export interface EquipGroup {
  en: string;
  ar: string;
  items: EquipItem[];
}

export interface ProcedureDef {
  id: ProcedureId;
  titleEn: string;
  titleAr: string;
  /** false for the bundles: a set of care elements that can be done in any order */
  ordered: boolean;
  steps: ProcStep[];
  groups: EquipGroup[];
  /** true when the equipment list was added by the app (the source document has none) */
  equipmentFromApp: boolean;
  /** From this step on, the full tray is needed to do bedside work (null = never gated) */
  gateIndex: number | null;
}

export type Mode = 'practice' | 'exam';
