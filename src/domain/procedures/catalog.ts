import { RAW_PROCEDURES, type RawGroup, type RawProcedure } from './rawData';
import type { EquipGroup, EquipItem, ProcedureDef, ProcedureId, ProcStep, StepKind } from './types';

const BUNDLES: ProcedureId[] = ['vap', 'cauti', 'clabsi'];

/**
 * The bundles in the source are daily care elements, with no equipment list. This list is the app's own addition
 * (typical supplies for each element): it needs a clinician's review.
 */
const BUNDLE_EQUIPMENT: Record<string, RawGroup[]> = {
  vap: [
    {
      en: 'Oral & Airway Care',
      ar: 'العناية بالفم والمجرى الهوائي',
      items: [
        { en: 'Chlorhexidine 0.12% Oral Rinse', ar: 'غسول الفم كلورهيكسيدين 0.12%', use: 'للعناية بالفم والحد من البكتيريا الفموية' },
        { en: 'Oral Care Swabs', ar: 'مسحات العناية بالفم', use: 'لتنظيف الفم والأسنان واللسان' },
        { en: 'Suction Catheter', ar: 'قسطرة الشفط', use: 'للشفط عند الحاجة فقط' },
        { en: 'Cuff Pressure Manometer', ar: 'مقياس ضغط البالونة', use: 'لقياس ضغط بالونة الأنبوب (20-30 سم ماء)' },
      ],
    },
    {
      en: 'Assessment',
      ar: 'التقييم',
      items: [
        { en: 'Sedation Scale Chart (RASS)', ar: 'جدول مقياس التخدير', use: 'لتقييم مستوى التخدير' },
        { en: 'Stethoscope', ar: 'سماعة طبية', use: 'لتقييم أصوات التنفس' },
        { en: 'Pulse Oximeter', ar: 'جهاز قياس الأكسجين', use: 'لمراقبة تشبع الأكسجين' },
      ],
    },
    {
      en: 'Prophylaxis',
      ar: 'الوقاية الدوائية',
      items: [
        { en: 'DVT Prophylaxis (heparin / enoxaparin)', ar: 'وقاية الجلطات الوريدية', use: 'لمنع الجلطات الوريدية العميقة' },
        { en: 'Peptic Ulcer Prophylaxis (PPI / H2 blocker)', ar: 'وقاية قرحة المعدة', use: 'لمنع قرحة الإجهاد' },
      ],
    },
  ],
  cauti: [
    {
      en: 'Catheter & Drainage',
      ar: 'القسطرة والتصريف',
      items: [
        { en: 'Sterile Urinary Catheter Kit', ar: 'عدة قسطرة بولية معقمة', use: 'للإدخال بتقنية معقمة' },
        { en: 'Closed Urine Drainage Bag', ar: 'كيس تصريف بول مغلق', use: 'للحفاظ على نظام التصريف مغلقاً' },
        { en: 'Catheter Securement Device', ar: 'مثبّت القسطرة', use: 'لتثبيت القسطرة ومنع حركتها' },
        { en: 'Sterile Gloves', ar: 'قفازات معقمة', use: 'للحفاظ على التعقيم' },
      ],
    },
    {
      en: 'Hygiene & Emptying',
      ar: 'النظافة والتفريغ',
      items: [
        { en: 'Perineal Hygiene Supplies', ar: 'مستلزمات النظافة الشخصية', use: 'للعناية بمنطقة العجان' },
        { en: 'Alcohol Swabs', ar: 'مسحات كحولية', use: 'لتطهير فتحة التفريغ' },
        { en: 'Graduated Container', ar: 'وعاء مدرّج', use: 'لتفريغ الكيس وقياس البول' },
      ],
    },
    { en: 'Documentation', ar: 'التوثيق', items: [{ en: 'Documentation Forms', ar: 'نماذج التوثيق', use: 'لتوثيق دواعي بقاء القسطرة' }] },
  ],
  clabsi: [
    {
      en: 'Barrier Precautions',
      ar: 'احتياطات الحاجز المعقم',
      items: [
        { en: 'Sterile Gown', ar: 'ثوب معقم', use: 'للحاجز المعقم الكامل' },
        { en: 'Sterile Gloves', ar: 'قفازات معقمة', use: 'للحاجز المعقم الكامل' },
        { en: 'Mask and Cap', ar: 'كمامة وغطاء رأس', use: 'للحاجز المعقم الكامل' },
        { en: 'Large Sterile Drape', ar: 'ستارة معقمة كبيرة', use: 'لتغطية المريض أثناء الإجراء' },
      ],
    },
    {
      en: 'Antisepsis',
      ar: 'التطهير',
      items: [
        { en: 'Chlorhexidine Applicator', ar: 'مطهّر كلورهيكسيدين', use: 'لتطهير الجلد' },
        { en: 'Alcohol Pads (hub scrub)', ar: 'مسحات كحولية لفرك الوصلة', use: 'لفرك الوصلة 15 ثانية قبل الاستخدام' },
      ],
    },
    {
      en: 'Dressing & Lines',
      ar: 'الضمادة والخطوط',
      items: [
        { en: 'Sterile Transparent Dressing', ar: 'ضمادة شفافة معقمة', use: 'لتغطية موضع الخط' },
        { en: 'Sterile Gauze', ar: 'شاش معقم', use: 'لتغطية موضع الخط عند الحاجة' },
        { en: 'Needleless Connectors', ar: 'وصلات بدون إبرة', use: 'للتبديل حسب البروتوكول' },
        { en: 'IV Tubing', ar: 'أنابيب وريدية', use: 'للتبديل حسب البروتوكول' },
      ],
    },
  ],
};

/** Where bedside work needs the full tray (see ProcedureDef.gateIndex) for procedures with no "gather" step. */
const GATE_WITHOUT_GATHER: Partial<Record<ProcedureId, number | null>> = { trach: 1, art: 2, pa: 1, acls: null, vap: null, cauti: null, clabsi: null };

const DEVICE = /ventilator|suction apparatus|suction device|oxygen supply|oxygen source|medical air|flowmeter|monitor|humidifier|defibrillator|infusion pump|transducer|crash cart|capnography|pacemaker|hemodynamic|pressure bag/i;

export function stepKind(en: string): StepKind {
  if (/^gather\b/i.test(en) || /gather equipment/i.test(en)) return 'gather';
  if (/semi-fowler|elevate head of bed/i.test(en)) return 'position';
  if (/hand hygiene|wash hands/i.test(en)) return 'hygiene';
  return 'bedside';
}

function build(raw: RawProcedure): ProcedureDef {
  const id = raw.id as ProcedureId;
  const steps: ProcStep[] = raw.steps.map((s, index) => ({ ...s, index, kind: stepKind(s.en) }));
  const fromApp = raw.groups.length === 0;
  const rawGroups = fromApp ? BUNDLE_EQUIPMENT[id] ?? [] : raw.groups;
  const groups: EquipGroup[] = rawGroups.map((g, gi) => ({
    en: g.en,
    ar: g.ar,
    items: g.items.map((it, ii): EquipItem => ({ ...it, id: `${id}-${gi}-${ii}`, group: gi, device: DEVICE.test(it.en) })),
  }));
  const gather = steps.find((s) => s.kind === 'gather');
  return {
    id,
    titleEn: raw.titleEn,
    titleAr: raw.titleAr,
    ordered: !BUNDLES.includes(id),
    steps,
    groups,
    equipmentFromApp: fromApp,
    gateIndex: gather ? gather.index : GATE_WITHOUT_GATHER[id] ?? null,
  };
}

export const PROCEDURES: ProcedureDef[] = RAW_PROCEDURES.map(build);

export const getProcedure = (id: string): ProcedureDef => {
  const p = PROCEDURES.find((x) => x.id === id);
  if (!p) throw new Error(`unknown procedure ${id}`);
  return p;
};

export const allItems = (def: ProcedureDef): EquipItem[] => def.groups.flatMap((g) => g.items);

/**
 * Equipment that is already in the room at the bedside (wall oxygen and suction, the monitor, the ventilator,
 * the crash cart, the pump). It is not carried: the nurse only has to be at the bedside to use it.
 */
const FIXTURE = /mechanical ventilator|oxygen (supply|source|flowmeter)|medical air|pulse oximeter|cardiac monitor|ecg monitor|hemodynamic monitor|blood pressure monitor|infusion pump|crash cart|suction apparatus|suction device/i;
export const isBedsideFixture = (item: { en: string }): boolean => FIXTURE.test(item.en);

/** Procedures where the patient is on a ventilator (the ventilator stands at the head of the bed). */
export const VENTILATED: ProcedureId[] = ['mv', 'vap'];
