import { mirrorHand, type HandPose, type HandsPose, type HeldKind, type Vec3 } from './Hands';
import type { Anchors, ScriptStep } from './handsScript';

const PI = Math.PI;
const open: HandPose['curl'] = [0.1, 0.1, 0.1, 0.1, 0.1];
const relaxed: HandPose['curl'] = [0.25, 0.3, 0.3, 0.32, 0.35];
const grip: HandPose['curl'] = [0.5, 0.6, 0.65, 0.7, 0.75];
const point: HandPose['curl'] = [0.6, 0.05, 0.1, 0.85, 0.9];
const ease = (x: number) => x * x * (3 - 2 * x);
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const seg = (u: number, a: number, b: number) => ease(clamp01((u - a) / (b - a)));
const wave = (u: number, cycles: number) => Math.sin(u * cycles * 2 * PI);
const add = (a: Vec3, x: number, y: number, z = 0): Vec3 => [a[0] + x, a[1] + y, a[2] + z];
const lerp3 = (a: Vec3, b: Vec3, t: number): Vec3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/** The rotation that points a hand at `to` when it is at `from` (fingers and held tools point along -z). */
function aim(from: Vec3, to: Vec3, roll = 0): Vec3 {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const dz = to[2] - from[2];
  return [Math.atan2(dy, Math.hypot(dx, dz)), Math.atan2(-dx, -dz), roll];
}

/** A right hand holding a tool of length `len` whose tip is on `target`, coming from the direction `from` (target -> hand). */
function tool(target: Vec3, from: Vec3, len: number, curl: HandPose['curl'] = grip, roll = 0): HandPose {
  const n = Math.hypot(...from) || 1;
  const pos: Vec3 = [target[0] + (from[0] / n) * len, target[1] + (from[1] / n) * len, target[2] + (from[2] / n) * len];
  return { pos, rot: aim(pos, target, roll), curl, spread: 0.05 };
}

/** A flat left hand resting at a point, palm toward the patient. */
const rest = (at: Vec3, roll = PI * 0.1, curl: HandPose['curl'] = relaxed): HandPose => ({ pos: at, rot: [0.45, -0.25, roll], curl, spread: 0.1 });

const step = (id: string, en: string, ar: string, tipEn: string, tipAr: string, sec: number, pose: ScriptStep['pose'], look = 'mouth'): ScriptStep => ({ id, en, ar, tipEn, tipAr, sec, pose, look });

const hands = (r: HandPose, l: HandPose, held: HeldKind | null = null, extra: Partial<HandsPose> = {}): HandsPose => ({ r, l, foam: 0, held, wet: 0, ...extra });

const out: Vec3 = [0.7, -0.6, 0.4]; // direction from the target to the hand: right, below, nearer
const OUT_R: Vec3 = [0.6, -0.5, 0.55];

export const BEDSIDE = {
  speak: (): ScriptStep[] => [
    step('speak', 'Explain what you will do, then raise the head of the bed', 'اشرح للمريض ما ستفعله، ثم ارفع رأس السرير', 'Say it calmly even if the patient is sedated; head of bed 30–45° (semi-Fowler).', 'اشرح بهدوء حتى لو كان المريض مخدراً؛ ارفع الرأس 30–45° (نصف جالس).', 5, (u) => {
      const g = wave(u, 3) * 0.02;
      const r = { pos: [0.1, -0.1 + g, -0.42] as Vec3, rot: [0.35, 0.25, PI * 0.88] as Vec3, curl: open, spread: 0.3 };
      return hands(r, mirrorHand({ ...r, pos: [0.1, -0.1 - g, -0.42] }));
    }, 'chest'),
  ],

  assess: (): ScriptStep[] => [
    step('pulse', 'Check the pulse and SpO₂ at the wrist', 'افحص النبض وتشبّع الأكسجين عند المعصم', 'Two fingers on the radial pulse; read the monitor.', 'ضع إصبعين على النبض الكعبري وراقب الشاشة.', 4, (u, a) => {
      const w = a.wrist;
      const r = { ...tool(add(w, 0, 0), [0.25, -0.35, 0.8], 0.11, point, 0.2), spread: 0.05 };
      const l = rest(add(w, -0.17, -0.12, 0.05));
      return hands(r, l);
    }, 'wrist'),
    step('listen', 'Listen to the breath sounds on both sides', 'استمع إلى أصوات التنفس على الجانبين', 'Compare left and right, front of the chest.', 'قارن الجانب الأيسر بالأيمن في مقدمة الصدر.', 6, (u, a) => {
      const side = u < 0.5 ? -1 : 1;
      const v = u < 0.5 ? u * 2 : (u - 0.5) * 2;
      const c = add(a.chest, side * 0.075, 0.0);
      const move = seg(v, 0, 0.3);
      const r = tool(add(c, 0, 0.03 * (1 - move)), [0.5, -0.6, 0.65], 0.1, grip, 0);
      const l = rest(add(a.chest, side * -0.2, -0.05, 0.05));
      return hands(r, l, 'steth');
    }, 'chest'),
  ],

  bag: (): ScriptStep[] => [
    step('bag', 'Give the extra breaths with the bag, mask sealed on the face', 'أعطِ الأنفاس الإضافية بالكيس مع إحكام القناع على الوجه', 'Left hand holds the mask (C-grip), right hand squeezes the bag slowly; watch the chest rise.', 'اليد اليسرى تمسك القناع (قبضة C) واليمنى تضغط الكيس ببطء؛ راقب ارتفاع الصدر.', 6, (u, a) => {
      const m = a.mouth;
      const r = tool(add(m, 0, -0.01), [0.1, -0.55, 0.85], 0.24, grip, 0);
      const l = { pos: add(m, -0.1, -0.03, 0.1), rot: [0.5, -0.4, PI * 0.2] as Vec3, curl: [0.8, 0.7, 0.4, 0.4, 0.4] as HandPose['curl'], spread: 0.1 };
      const sq = Math.max(0, wave(u, 5));
      return hands({ ...r, pos: add(r.pos, 0, -0.01 * sq) }, l, 'bag', { squeeze: sq });
    }),
  ],

  suction: (): ScriptStep[] => [
    step('insert', 'Pass the catheter down the tube without suction', 'مرّر القسطرة داخل الأنبوب دون شفط', 'Sterile glove on the catheter hand; slide it in gently until you meet resistance, then pull back 1 cm.', 'القفاز المعقّم على اليد التي تحمل القسطرة؛ أدخلها برفق حتى المقاومة ثم اسحبها 1 سم.', 5, (u, a) => {
      const depth = seg(u, 0.1, 0.9);
      const tip = add(a.mouth, 0.0, 0.0, 0.0);
      const target: Vec3 = [tip[0] + 0.1 * (1 - depth), tip[1] + 0.05 * (1 - depth), tip[2]];
      return hands(tool(target, OUT_R, 0.38, grip), rest(add(a.mouth, -0.09, -0.04, 0.08), PI * 0.1, [0.5, 0.6, 0.6, 0.6, 0.6]), 'catheter');
    }),
    step('withdraw', 'Apply suction while you withdraw, turning the catheter (10–15 s at most)', 'اشفط أثناء السحب مع تدوير القسطرة (10–15 ثانية كحد أقصى)', 'Thumb over the port, roll the catheter between your fingers, never push in and out.', 'ضع إبهامك على الفتحة ودوّر القسطرة بين أصابعك، ولا تدفعها وتسحبها.', 6, (u, a) => {
      const out = seg(u, 0, 1);
      const target: Vec3 = [a.mouth[0] + 0.12 * out, a.mouth[1] + 0.06 * out, a.mouth[2]];
      const t = tool(target, OUT_R, 0.38, [0.8, 0.6, 0.6, 0.7, 0.7], wave(u, 4) * 0.5);
      return hands(t, rest(add(a.mouth, -0.09, -0.04, 0.08), PI * 0.1, [0.5, 0.6, 0.6, 0.6, 0.6]), 'catheter');
    }),
  ],

  check: (): ScriptStep[] => [
    step('depth', 'Check the tube position at the lips (cm mark)', 'افحص موضع الأنبوب عند الشفتين (علامة السنتيمتر)', 'Read the centimetre mark at the teeth or lips and compare it with the chart.', 'اقرأ علامة السنتيمتر عند الأسنان أو الشفتين وقارنها بالتوثيق.', 4, (u, a) => {
      const t = { ...tool(add(a.mouth, 0.02, -0.01), [0.3, -0.3, 0.9], 0.12, point, 0.1), spread: 0.05 };
      return hands(t, rest(add(a.mouth, -0.13, -0.08, 0.08)));
    }),
    step('cuff', 'Check the cuff pressure (20–30 cmH₂O)', 'افحص ضغط الكَفّ (20–30 سم ماء)', 'Connect the manometer to the pilot balloon and read the dial.', 'صِل جهاز القياس ببالون التحكم واقرأ المؤشر.', 5, (u, a) => {
      const balloon = add(a.mouth, -0.12, -0.18, 0.0);
      const t = tool(balloon, [0.7, -0.4, 0.6], 0.14, grip, 0);
      return hands(t, rest(add(balloon, -0.1, -0.02, 0.06)), 'syringe');
    }),
  ],

  oral: (): ScriptStep[] => [
    step('swab', 'Clean the mouth, teeth and tongue with the swab', 'نظّف الفم والأسنان واللسان بالفرشاة الإسفنجية', 'Gentle strokes, one direction, one swab per area; keep the tube still.', 'حركات لطيفة في اتجاه واحد، فرشاة لكل منطقة؛ ثبّت الأنبوب.', 6, (u, a) => {
      const a2 = u * 3 * 2 * PI;
      const target = add(a.mouth, 0.02 * Math.cos(a2), 0.012 * Math.sin(a2) + 0.0);
      return hands(tool(target, [0.55, -0.45, 0.7], 0.2, grip, 0), rest(add(a.mouth, -0.12, -0.04, 0.08)), 'swab');
    }),
    step('secure', 'Secure the tube with the holder or tape: firm, not tight', 'ثبّت الأنبوب بالحامل أو الشريط: بإحكام دون ضغط زائد', 'You should fit one finger under the strap; check the skin underneath.', 'يجب أن يدخل إصبع واحد تحت الشريط؛ افحص الجلد أسفله.', 5, (u, a) => {
      const k = seg(u, 0, 1);
      const x = 0.18 - 0.36 * k;
      const r = { pos: add(a.mouth, x, -0.04, 0.12), rot: [0.5, 0.3, PI * 0.1] as Vec3, curl: grip, spread: 0.1 };
      return hands(r, rest(add(a.mouth, 0, -0.05, 0.08), 0, [0.5, 0.5, 0.5, 0.5, 0.5]));
    }),
  ],

  inspect: (): ScriptStep[] => [
    step('inspect', 'Inspect the skin at the corners of the mouth, the lips and the nostrils', 'افحص الجلد عند زوايا الفم والشفتين والمنخرين', 'Look for redness or pressure marks where the tube or holder rests.', 'ابحث عن احمرار أو علامات ضغط حيث يلامس الأنبوب أو الحامل الجلد.', 6, (u, a) => {
      const path = [[0.07, 0], [0, 0.0], [-0.07, 0], [-0.03, 0.05], [0.03, 0.05]];
      const f = u * (path.length - 1);
      const i = Math.min(path.length - 2, Math.floor(f));
      const k = ease(f - i);
      const x = path[i][0] + (path[i + 1][0] - path[i][0]) * k;
      const y = path[i][1] + (path[i + 1][1] - path[i][1]) * k;
      const target = add(a.mouth, x, y - 0.01);
      return hands({ ...tool(target, [0.3, -0.4, 0.85], 0.12, point, 0.15), spread: 0.05 }, rest(add(a.mouth, -0.2, -0.02, 0.05)));
    }),
  ],

  reposition: (): ScriptStep[] => [
    step('reposition', 'Move the tube to the other corner of the mouth', 'انقل الأنبوب إلى الزاوية الأخرى للفم', 'Hold the tube at the lips so it cannot slip; slide the holder across; the cm mark stays the same.', 'أمسك الأنبوب عند الشفتين حتى لا ينزلق؛ حرّك الحامل؛ تبقى علامة السنتيمتر كما هي.', 6, (u, a) => {
      const k = seg(u, 0.2, 0.8);
      const x = 0.05 - 0.1 * k;
      return hands(tool(add(a.mouth, x, 0), [0.4, -0.3, 0.8], 0.12, grip, 0), rest(add(a.mouth, -0.06 - 0.0, -0.1, 0.12), 0, [0.5, 0.6, 0.6, 0.6, 0.6]));
    }),
  ],

  comfort: (): ScriptStep[] => [
    step('fio2', 'Return the FiO₂ to the baseline on the ventilator', 'أعِد نسبة الأكسجين (FiO₂) إلى المستوى الأساسي على جهاز التنفس', 'Check the set value, turn the dial back, confirm on the screen.', 'تحقق من القيمة المضبوطة، أعد المقبض، وأكّد على الشاشة.', 5, (u, a) => {
      const v = a.vent;
      const turn = wave(u, 1.5) * 0.5;
      const l = { pos: add(v, 0.03, -0.1, 0.1), rot: [0.3, -0.3, turn] as Vec3, curl: [0.7, 0.6, 0.6, 0.65, 0.7] as HandPose['curl'], spread: 0.05 };
      return hands(rest(add(v, 0.15, -0.2, 0.1)), l);
    }, 'vent'),
    step('comfort', 'Make sure the patient is comfortable', 'تأكد من راحة المريض', 'Reposition, rest a hand on the shoulder, give a way to call you.', 'عدّل الوضع، ضع يدك على كتفه، ووفّر وسيلة للنداء.', 4, (u, a) => {
      const pat = wave(u, 2) * 0.01;
      const c = add(a.chest, 0.0, 0.06 + pat);
      return hands({ pos: add(c, 0.08, -0.04, 0.12), rot: [0.45, 0.2, PI * 0.08], curl: relaxed, spread: 0.2 }, rest(add(a.chest, -0.2, -0.1, 0.1)));
    }, 'chest'),
  ],

  document: (): ScriptStep[] => [
    step('document', 'Document the care: time, tube cm mark, cuff pressure, secretions, breath sounds, tolerance', 'وثّق الرعاية: الوقت، علامة سنتيمتر الأنبوب، ضغط الكَفّ، الإفرازات، أصوات التنفس، التحمّل', 'Chart exactly what you saw and did, including any complication.', 'سجّل ما رأيته وما فعلته بدقة، بما في ذلك أي مضاعفات.', 6, (u) => {
      const stroke = wave(u, 10) * 0.012;
      const l = { pos: [-0.07, -0.12, -0.4] as Vec3, rot: [0.5, -0.1, PI * 0.95] as Vec3, curl: open, spread: 0.1 };
      const r = { pos: [0.04 + stroke, -0.08 + wave(u, 3) * 0.015, -0.4] as Vec3, rot: [0.7, 0.15, 0] as Vec3, curl: [0.6, 0.6, 0.65, 0.8, 0.85] as HandPose['curl'], spread: 0 };
      return hands(r, l, 'clip', { heldIn: 'l' });
    }, 'basin'),
  ],
};

/** Which hand movements go with a step of the procedure (by what it says), or none. */
export function bedsideScriptFor(stepEn: string): { id: string; steps: ScriptStep[] } | null {
  const t = stepEn.toLowerCase();
  if (/explain|semi-fowler/.test(t)) return { id: 'speak', steps: BEDSIDE.speak() };
  if (/pre-?oxygenate/.test(t)) return { id: 'bag', steps: BEDSIDE.bag() };
  if (/suction/.test(t)) return { id: 'suction', steps: BEDSIDE.suction() };
  if (/check ett/.test(t)) return { id: 'check', steps: BEDSIDE.check() };
  if (/secure ett|oral care/.test(t)) return { id: 'oral', steps: BEDSIDE.oral() };
  if (/inspect skin/.test(t)) return { id: 'inspect', steps: BEDSIDE.inspect() };
  if (/reposition ett/.test(t)) return { id: 'reposition', steps: BEDSIDE.reposition() };
  if (/\bfio/.test(t) || /patient comfort/.test(t)) return { id: 'comfort', steps: BEDSIDE.comfort() };
  if (/reassess|assess/.test(t)) return { id: 'assess', steps: BEDSIDE.assess() };
  return null;
}
export type { Anchors };
