import type { Lang } from '../../i18n';
import type { Check, ProcedureSession } from './ProcedureSession';
import type { EquipItem, ProcStep } from './types';

/**
 * The practice-mode coach. Everything it says comes from the course sheet (steps, "what am I doing", rationale,
 * equipment), so it cannot make up clinical content. Not used in exam mode.
 */
export interface CoachState {
  session: ProcedureSession;
  lang: Lang;
}

const pick = (lang: Lang, en: string, ar: string) => (lang === 'ar' ? ar : en);

const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[؟?!.,،;:()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const any = (text: string, words: string[]) => words.some((w) => text.includes(w));

const stepText = (s: ProcStep, lang: Lang) => (lang === 'ar' ? s.ar : s.en);
const itemText = (i: EquipItem, lang: Lang) => (lang === 'ar' ? i.ar : i.en);
const why = (s: ProcStep, lang: Lang) => (lang === 'ar' ? s.whyAr : s.whyEn);

/** "Main Devices: Mechanical Ventilator, ETT ..." for the items that are still missing. */
function missingByTable(state: CoachState): string {
  const { session, lang } = state;
  const groups = new Map<number, string[]>();
  for (const i of session.missing()) groups.set(i.group, [...(groups.get(i.group) ?? []), itemText(i, lang)]);
  return [...groups.entries()]
    .map(([g, names]) => `${lang === 'ar' ? session.def.groups[g].ar : session.def.groups[g].en}: ${names.join(lang === 'ar' ? '، ' : ', ')}`)
    .join('\n');
}

function whereToGo(step: ProcStep, state: CoachState): string {
  const { lang, session } = state;
  switch (step.kind) {
    case 'hygiene':
      return pick(lang, 'Go to the hand-hygiene station (the stand with the blue sign in front of the bed area), aim at the sanitizer and press E.', 'اذهب إلى محطة نظافة اليدين (العمود ذو اللافتة الزرقاء أمام منطقة السرير)، صوّب على المعقم واضغط E.');
    case 'gather':
      return pick(lang, `Collect everything from the supply tables first:\n${missingByTable(state)}`, `اجمع كل الأدوات من طاولات المستلزمات أولاً:\n${missingByTable(state)}`);
    case 'position':
      return pick(lang, 'Use the bed control (the post beside the bed): aim at it and press E until the head is at 30–45°, then do this step.', 'استخدم مفتاح السرير (العمود بجانب السرير): صوّب عليه واضغط E حتى يصبح الرأس 30–45 درجة ثم نفّذ الخطوة.');
    default:
      if (session.def.gateIndex !== null && step.index >= session.def.gateIndex && session.missing().length > 0) {
        return pick(lang, `You still need equipment:\n${missingByTable(state)}`, `ما زال ينقصك:\n${missingByTable(state)}`);
      }
      return pick(lang, 'Stand next to the patient, open the steps list and do it.', 'قف بجانب المريض وافتح قائمة الخطوات ونفّذها.');
  }
}

export function introMessage(state: CoachState): string {
  const { session, lang } = state;
  const title = lang === 'ar' ? session.def.titleAr : session.def.titleEn;
  return pick(
    lang,
    `I am your coach for ${title}. Start by washing your hands at the hand-hygiene station (blue sign). Ask me what is next, why, how, or what equipment you are missing.`,
    `أنا مدربك في ${title}. ابدأ بغسل يديك عند محطة نظافة اليدين (اللافتة الزرقاء). اسألني عن الخطوة التالية أو السبب أو الطريقة أو الأدوات الناقصة.`,
  );
}

export function stepDoneMessage(state: CoachState, step: ProcStep): string {
  const { lang } = state;
  return pick(lang, `Step ${step.n} done. Why: ${why(step, lang)}`, `تمت الخطوة ${step.n}. السبب: ${why(step, lang)}`);
}

/** Why an action did not happen, in words that point the way. */
export function blockMessage(state: CoachState, check: Extract<Check, { ok: false }>): string {
  const { session, lang } = state;
  switch (check.reason) {
    case 'order': {
      const next = check.expected !== undefined ? session.def.steps[check.expected] : null;
      if (!next) return pick(lang, 'Not now.', 'ليس الآن.');
      return pick(lang, `Not yet. The next step is ${next.n}: ${next.en}`, `ليس بعد. الخطوة التالية هي ${next.n}: ${next.ar}`);
    }
    case 'equipment':
      return pick(lang, `You still need equipment:\n${missingByTable(state)}`, `ما زال ينقصك:\n${missingByTable(state)}`);
    case 'sanitizer':
      return pick(lang, 'Go to the hand sanitizer first: the hand-hygiene station (blue sign) in front of the bed area.', 'اذهب إلى معقم اليدين أولاً: محطة نظافة اليدين (اللافتة الزرقاء) أمام منطقة السرير.');
    case 'bed':
      return pick(lang, 'Go next to the patient first.', 'اقترب من المريض أولاً.');
    case 'position':
      return pick(lang, 'Raise the bed head to 30–45° with the bed control (the post beside the bed, press E).', 'ارفع رأس السرير إلى 30–45 درجة بمفتاح السرير (العمود بجانب السرير، اضغط E).');
    case 'distractor':
      return pick(lang, 'That is not part of this procedure.', 'هذه الخطوة ليست من هذا الإجراء.');
    case 'done':
      return pick(lang, 'You already did that step.', 'لقد نفّذت هذه الخطوة بالفعل.');
  }
}

const NEXT = ['next', 'what now', 'what should i do', 'what do i do', 'now what', 'continue', 'stuck', 'hint', 'ايه الخطوه', 'الخطوه الجايه', 'الخطوه التاليه', 'اعمل ايه', 'بعد كده', 'التالي', 'ماذا افعل', 'ما التالي', 'ايه بعد', 'ساعدني', 'تلميح'];
const WHY = ['why', 'reason', 'rationale', 'لماذا', 'ليه', 'ليش', 'السبب', 'اساس'];
const HOW = ['how', 'explain', 'what am i doing', 'كيف', 'ازاي', 'اشرح', 'شرح', 'طريقه'];
const EQUIP = ['equipment', 'missing', 'supplies', 'items', 'where', 'tool', 'اين', 'فين', 'ادوات', 'معدات', 'ناقص', 'محتاج', 'مستلزمات', 'احتاج', 'اجيب'];
const LIST = ['all steps', 'list', 'steps', 'checklist', 'remaining', 'الخطوات', 'قايمه', 'قائمه', 'المتبقي', 'كل الخطوات'];
const HYGIENE = ['sanitizer', 'wash', 'hygiene', 'تعقيم', 'غسل', 'معقم'];
const BED = ['position', 'bed', 'semi', 'fowler', 'head up', 'سرير', 'وضعيه', 'راس'];
const THANKS = ['thank', 'شكرا', 'تسلم'];
const HELLO = ['hello', 'hi', 'hey', 'مرحبا', 'اهلا', 'سلام'];

export function coachAnswer(state: CoachState, question: string): string {
  const { session, lang } = state;
  const q = ` ${normalize(question)} `;
  const next = session.nextStep();

  if (any(q, LIST)) {
    return session.def.steps
      .map((s) => `${session.isDone(s.index) ? '✓' : s.index === next?.index && session.def.ordered ? '→' : '•'} ${s.n}. ${stepText(s, lang)}`)
      .join('\n');
  }
  if (any(q, EQUIP)) {
    return session.missing().length === 0
      ? pick(lang, 'You have all the equipment you need.', 'معك كل الأدوات المطلوبة.')
      : pick(lang, `Still missing:\n${missingByTable(state)}`, `ما زال ينقصك:\n${missingByTable(state)}`);
  }
  if (any(q, WHY) || any(q, HOW)) {
    if (!next) return pick(lang, 'All steps are done. Press Finish.', 'تمت كل الخطوات. اضغط إنهاء.');
    if (any(q, WHY)) return pick(lang, `Why step ${next.n}: ${why(next, lang)}`, `سبب الخطوة ${next.n}: ${why(next, lang)}`);
    return pick(lang, `Step ${next.n}: ${next.en}\nWhat you do (as in your course sheet): ${next.doing}`, `الخطوة ${next.n}: ${next.ar}\nما الذي أفعله: ${next.doing}`);
  }
  if (any(q, HYGIENE) && next?.kind === 'hygiene') return whereToGo(next, state);
  if (any(q, HYGIENE)) return pick(lang, 'The hand sanitizer is at the hand-hygiene station (stand with the blue sign, in front of the bed area).', 'معقم اليدين في محطة نظافة اليدين (العمود ذو اللافتة الزرقاء أمام منطقة السرير).');
  if (any(q, BED)) return pick(lang, 'The bed control is the post beside the bed. Each press (E) raises the head: 0°, 15°, 30°, 45°, 60°.', 'مفتاح السرير هو العمود بجانب السرير. كل ضغطة (E) ترفع الرأس: 0 و15 و30 و45 و60 درجة.');
  if (any(q, NEXT)) {
    if (!next) return pick(lang, 'All steps are done. Press Finish.', 'تمت كل الخطوات. اضغط إنهاء.');
    if (!session.def.ordered) {
      const left = session.def.steps.filter((s) => !session.isDone(s.index)).slice(0, 3);
      return pick(lang, `These can be done in any order. Still to do:\n${left.map((s) => `• ${s.en}`).join('\n')}`, `يمكن تنفيذها بأي ترتيب. المتبقي:\n${left.map((s) => `• ${s.ar}`).join('\n')}`);
    }
    return pick(lang, `Next is step ${next.n}: ${next.en}\n${whereToGo(next, state)}`, `الخطوة التالية ${next.n}: ${next.ar}\n${whereToGo(next, state)}`);
  }
  if (any(q, THANKS)) return pick(lang, 'You are welcome. Keep going!', 'العفو. استمر!');
  if (any(q, HELLO)) return introMessage(state);
  return pick(lang, 'Ask me: what is next, why, how, what equipment is missing, or list the steps.', 'اسألني: ما الخطوة التالية، لماذا، كيف، ما الأدوات الناقصة، أو اعرض الخطوات.');
}
