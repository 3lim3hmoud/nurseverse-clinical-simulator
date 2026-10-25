import { mirrorHand, type HandPose, type HandsPose, type Vec3 } from './Hands';

/** View-space positions (see Hands.viewPoint) of the things the hands reach for. */
export interface WashAnchors {
  tap: Vec3;
  soap: Vec3;
  towel: Vec3;
}

export interface WashStep {
  id: string;
  en: string;
  ar: string;
  /** why it matters / how to do it, shown under the title */
  tipEn: string;
  tipAr: string;
  /** seconds at normal speed */
  sec: number;
  /** is the tap running (u = 0..1 through the step) */
  water: (u: number) => boolean;
  /** lather on the hands at the start and the end of the step */
  foam: [number, number];
  pose(u: number, a: WashAnchors): HandsPose;
}

const PI = Math.PI;
const H = (pos: Vec3, rot: Vec3, curl: HandPose['curl'], spread = 0): HandPose => ({ pos, rot, curl, spread });
const open: HandPose['curl'] = [0.05, 0.05, 0.05, 0.05, 0.05];
const relaxed: HandPose['curl'] = [0.25, 0.3, 0.3, 0.32, 0.35];
const fist: HandPose['curl'] = [0.5, 1, 1, 1, 1];
/** right pose + its mirror image for the left hand */
const both = (r: HandPose, foam: number, towel = false): HandsPose => ({ r, l: mirrorHand(r), foam, towel });
const swap = (p: HandsPose): HandsPose => ({ ...p, r: mirrorHand(p.l), l: mirrorHand(p.r) });
const wave = (u: number, cycles: number) => Math.sin(u * cycles * 2 * PI);
const ease = (x: number) => x * x * (3 - 2 * x);
const lerp3 = (a: Vec3, b: Vec3, t: number): Vec3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const add = (a: Vec3, x: number, y: number, z: number): Vec3 => [a[0] + x, a[1] + y, a[2] + z];
/** keep a reach target inside the middle of the view, so both arms stay on screen */
const inside = (p: Vec3, max = 0.13): Vec3 => [Math.max(-max, Math.min(max, p[0])), p[1], p[2]];

const Y = -0.085;
const Z = -0.47;

/** Hands up, fingers up, palm facing the other hand (the right one; mirror for the left). */
const PRAYER: Vec3 = [PI / 2, PI / 2, 0];
/** a hand held up with the fingers leaning away, the way you hold them to rub: the wrists are apart, the fingers lean together */
const up = (x: number, y: number, z: number, o: { yaw?: number; roll?: number; lean?: number; tilt?: number; curl?: HandPose['curl']; spread?: number } = {}): HandPose => ({
  pos: [x, y, z],
  rot: [PI / 2, PI / 2 + (o.yaw ?? 0), o.roll ?? 0],
  curl: o.curl ?? open,
  spread: o.spread ?? 0.05,
  tilt: o.tilt ?? 0.14,
  lean: o.lean ?? -0.5,
});

/**
 * The WHO hand-washing technique with soap and water (about 40-60 seconds), one entry per movement.
 * Each pose is a pure function of the progress through the step, so the animation can be scrubbed and tested.
 */
export const WASH_STEPS: WashStep[] = [
  {
    id: 'wet',
    en: 'Wet your hands with water',
    ar: 'بلّل يديك بالماء',
    tipEn: 'Warm running water, hands and wrists under the tap.',
    tipAr: 'ماء جارٍ دافئ، اليدان والمعصمان تحت الصنبور.',
    sec: 4,
    water: () => true,
    foam: [0, 0],
    pose: (u) => both(H([0.07, Y - 0.02 + 0.01 * wave(u, 2), Z - 0.02], [0.35, 0.25, PI * 0.88], relaxed, 0.3), 0),
  },
  {
    id: 'soap',
    en: 'Apply soap',
    ar: 'ضع الصابون',
    tipEn: 'Enough soap to cover all hand surfaces.',
    tipAr: 'كمية صابون تكفي لتغطية كل أسطح اليدين.',
    sec: 4,
    water: () => false,
    foam: [0, 0.25],
    pose: (u, a) => {
      const press = u > 0.25 && u < 0.55 ? Math.sin(((u - 0.25) / 0.3) * PI) : 0;
      const reach = ease(Math.min(1, u / 0.25)) * (1 - ease(Math.max(0, (u - 0.6) / 0.35)));
      const r = H(lerp3([0.07, Y, Z], inside(add(a.soap, 0.1, -0.09 - 0.03 * press, 0.0)), reach), [0.5, 0.3, 0.2], [0.4, 0.55, 0.55, 0.6, 0.6], 0.1);
      const l = H(lerp3([-0.07, Y, Z], inside(add(a.soap, 0.03, -0.2, 0.02), 0.1), reach), [0.45, -0.1, -PI * 0.88], relaxed, 0.2);
      return { r, l, foam: 0.15, towel: false };
    },
  },
  {
    id: 'palms',
    en: 'Rub palm to palm',
    ar: 'افرك راحة اليد بالأخرى',
    tipEn: 'Rub the palms together in a straight motion.',
    tipAr: 'افرك الراحتين معاً بحركة مستقيمة.',
    sec: 5,
    water: () => false,
    foam: [0.3, 0.5],
    pose: (u) => {
      const s = wave(u, 5) * 0.03;
      const r = up(0.026, Y + s, Z);
      const l = mirrorHand(up(0.026, Y - s, Z));
      return { r, l, foam: 0.5, towel: false, wet: 0.6 };
    },
  },
  {
    id: 'dorsum',
    en: 'Right palm over the back of the left hand, fingers interlaced, then swap',
    ar: 'راحة اليمنى فوق ظهر اليسرى مع تشبيك الأصابع، ثم بدّل',
    tipEn: 'Slide the palm over the back of the other hand. Both sides.',
    tipAr: 'مرّر الراحة على ظهر اليد الأخرى. اليدان معاً.',
    sec: 7,
    water: () => false,
    foam: [0.5, 0.65],
    pose: (u) => {
      const first = u < 0.5;
      const v = first ? u * 2 : (u - 0.5) * 2;
      const slide = wave(v, 3) * 0.03;
      // left hand rests with its back to the nurse; the right hand lies across it, fingers between the fingers
      const l = H([-0.035, Y - 0.025, Z], [0.62, 0.12, 0], open, 0.45);
      const r = H([0.03 - slide * 0.5, Y + 0.035 + slide * 0.2, Z + 0.035 - slide * 0.85], [0.5, 0.62, 0], open, 0.6);
      const p: HandsPose = { r, l, foam: 0.65, towel: false, wet: 0.6 };
      return first ? p : swap(p);
    },
  },
  {
    id: 'interlaced',
    en: 'Palm to palm with fingers interlaced',
    ar: 'راحة على راحة مع تشبيك الأصابع',
    tipEn: 'Fingers laced together, rub the spaces between them.',
    tipAr: 'شبّك الأصابع وافرك المسافات بينها.',
    sec: 5,
    water: () => false,
    foam: [0.65, 0.75],
    pose: (u) => {
      const s = wave(u, 5) * 0.028;
      const r = up(0.024, Y + s, Z, { yaw: -0.5, curl: [0.1, 0.2, 0.2, 0.2, 0.2], spread: 1, tilt: 0.1, lean: -0.55 });
      const l = mirrorHand(up(0.024, Y - s, Z + 0.01, { yaw: -0.5, curl: [0.1, 0.2, 0.2, 0.2, 0.2], spread: 1, tilt: 0.1, lean: -0.55 }));
      return { r, l, foam: 0.75, towel: false, wet: 0.6 };
    },
  },
  {
    id: 'fingerbacks',
    en: 'Backs of the fingers against the opposite palms, fingers interlocked',
    ar: 'ظهر الأصابع على الراحة المقابلة مع تشابك الأصابع',
    tipEn: 'Hook the fingers and rub the backs of the fingers into the other palm.',
    tipAr: 'اعقد الأصابع وافرك ظهرها في الراحة المقابلة.',
    sec: 5,
    water: () => false,
    foam: [0.75, 0.8],
    pose: (u) => {
      const s = wave(u, 4) * 0.018;
      const r = H([0.03 + s, Y, Z], [1.05, 1.15, 0.2 * wave(u, 4)], [0.3, 0.75, 0.8, 0.8, 0.8], 0.15);
      const l = H([-0.03 - s, Y + 0.02, Z - 0.015], [1.05, -1.15, -0.2 * wave(u, 4)], [0.3, 0.75, 0.8, 0.8, 0.8], 0.15);
      return { r, l, foam: 0.8, towel: false };
    },
  },
  {
    id: 'thumbs',
    en: 'Rub each thumb, clasped in the opposite palm, with a rotating motion',
    ar: 'افرك كل إبهام داخل الكف المقابلة بحركة دائرية',
    tipEn: 'Clasp the thumb in your palm and rotate. Both thumbs.',
    tipAr: 'أمسك الإبهام بقبضة اليد المقابلة وأدِره. الإبهامان معاً.',
    sec: 6,
    water: () => false,
    foam: [0.8, 0.8],
    pose: (u) => {
      const first = u < 0.5;
      const v = first ? u * 2 : (u - 0.5) * 2;
      const l = H([-0.03, Y - 0.01, Z], [PI / 2 - 0.2, -(PI / 2) + 0.25, 0], [0.0, 0.9, 0.9, 0.9, 0.9]);
      const r = H([0.0, Y + 0.05, Z + 0.07], [PI / 2 - 0.3, PI / 2 + 0.3, wave(v, 3) * 0.7], [0.55, 1, 1, 1, 1]);
      const p: HandsPose = { r, l, foam: 0.8, towel: false };
      return first ? p : swap(p);
    },
  },
  {
    id: 'fingertips',
    en: 'Rub the fingertips of one hand in the palm of the other, circular motion',
    ar: 'افرك أطراف أصابع اليد في كف اليد الأخرى بحركة دائرية',
    tipEn: 'Close the fingertips and turn them in the palm. Both hands.',
    tipAr: 'ضمّ أطراف الأصابع وأدرها في الكف. اليدان معاً.',
    sec: 6,
    water: () => false,
    foam: [0.8, 0.8],
    pose: (u) => {
      const first = u < 0.5;
      const v = first ? u * 2 : (u - 0.5) * 2;
      const a = v * 3 * 2 * PI;
      // left palm up and tilted toward the nurse; the right fingertips, bunched together, circle in it
      const l = H([-0.02, Y - 0.03, Z + 0.01], [0.75, -0.1, PI * 0.96], [0.15, 0.1, 0.1, 0.1, 0.12], 0.1);
      const r = H([0.07 + Math.cos(a) * 0.012, Y + 0.045, Z + 0.045 + Math.sin(a) * 0.012], [-0.3, 0.9, 0], [0.45, 0.62, 0.66, 0.66, 0.62]);
      const p: HandsPose = { r, l, foam: 0.8, towel: false, wet: 0.6 };
      return first ? p : swap(p);
    },
  },
  {
    id: 'wrists',
    en: 'Rub each wrist with the opposite hand, rotating',
    ar: 'افرك كل معصم باليد المقابلة بحركة دائرية',
    tipEn: 'Grip the wrist and turn the hand around it. Both wrists.',
    tipAr: 'أمسك المعصم وأدِر اليد حوله. المعصمان معاً.',
    sec: 5,
    water: () => false,
    foam: [0.8, 0.8],
    pose: (u) => {
      const first = u < 0.5;
      const v = first ? u * 2 : (u - 0.5) * 2;
      // left hand held up and relaxed; the right hand closes around the left wrist and turns
      const l = H([-0.035, Y - 0.01, Z - 0.02], [1.0, 0.25, 0], relaxed, 0.1);
      const r = H([-0.012, Y - 0.005, Z + 0.075], [0.2, 1.3, 0.2 + wave(v, 3) * 0.45], [0.5, 1, 1, 1, 1]);
      const p: HandsPose = { r, l, foam: 0.8, towel: false, wet: 0.6 };
      return first ? p : swap(p);
    },
  },
  {
    id: 'rinse',
    en: 'Rinse your hands with water, fingers pointing down',
    ar: 'اشطف يديك بالماء وأصابعك للأسفل',
    tipEn: 'Rinse from the wrists down so the suds do not run back up your arms.',
    tipAr: 'اشطف من المعصم إلى أسفل حتى لا تعود الرغوة إلى الذراعين.',
    sec: 5,
    water: () => true,
    foam: [0.8, 0],
    pose: (u) => {
      const s = wave(u, 4) * 0.012;
      // fingers angled down into the water, the forearms still come from below (the wrists arch over the basin)
      const r = H([0.04 + s, Y - 0.045, Z - 0.03], [0.4, 0.05, -PI / 2], [0.12, 0.12, 0.12, 0.12, 0.12], 0.25);
      return both(r, 0.8 * (1 - u));
    },
  },
  {
    id: 'dry',
    en: 'Dry with a paper towel, then turn off the tap with the towel',
    ar: 'جفّف بمنشفة ورقية ثم أغلق الصنبور بالمنشفة نفسها',
    tipEn: 'Pat dry, and use the towel to close the tap so clean hands do not touch it.',
    tipAr: 'جفّف بالتربيت واستخدم المنشفة لإغلاق الصنبور حتى لا تلمسه يداك النظيفتان.',
    sec: 7,
    water: (u) => u < 0.8,
    foam: [0, 0],
    pose: (u, a) => {
      const rest = H([0.07, Y, Z], [0.4, 0.2, 0.2], relaxed, 0.1);
      const restL = mirrorHand(rest);
      if (u < 0.2) {
        const k = ease(u / 0.2);
        // right hand reaches the towel dispenser and pulls a sheet down
        return { r: H(lerp3(rest.pos, add(a.towel, 0, -0.05 - 0.05 * k, 0.02), k), [0.5, -0.1, 0.1], [0.4, 0.6, 0.6, 0.65, 0.65]), l: restL, foam: 0, towel: u > 0.12 };
      }
      if (u < 0.65) {
        const v = (u - 0.2) / 0.45;
        const k = ease(Math.min(1, v * 4));
        const dab = wave(v, 3) * 0.02;
        // towel in the right hand, pat the left hand, then the right
        const r = H(lerp3(add(a.towel, 0, -0.1, 0.02), [0.02, Y + 0.03, Z + 0.02], k), [0.15, 0.2, 0], [0.2, 0.2, 0.2, 0.2, 0.2], 0.1);
        const l = H(lerp3(restL.pos, [-0.04, Y - 0.03 + dab * 0.5, Z], k), [0.1, -0.2, PI * 0.1], open, 0.1);
        return { r: { ...r, pos: add(r.pos, 0, dab, 0) }, l, foam: 0, towel: true };
      }
      if (u < 0.86) {
        const v = ease((u - 0.65) / 0.21);
        // reach for the tap with the towel and close it
        const closing = u > 0.76 ? Math.sin(((u - 0.76) / 0.1) * PI) * 0.03 : 0;
        return { r: H(lerp3([0.02, Y + 0.03, Z + 0.02], add(a.tap, 0.0, -0.09 - closing, 0.03), v), [0.5, 0, 0], [0.5, 0.8, 0.8, 0.8, 0.8]), l: mirrorHand(H([0.07, Y, Z], [0.4, 0.2, 0.2], relaxed, 0.1)), foam: 0, towel: true };
      }
      const v = ease((u - 0.86) / 0.14);
      // drop the towel in the bin and lower the hands
      return { r: H(lerp3(add(a.tap, 0, -0.09, 0.03), [0.09, Y - 0.1, Z + 0.05], v), [0.5, 0.2, 0], relaxed), l: restL, foam: 0, towel: u < 0.96 };
    },
  },
];

for (const step of WASH_STEPS) {
  const raw = step.pose;
  step.pose = (u, a) => {
    const p = raw(u, a);
    if (p.wet === undefined) p.wet = step.id === 'rinse' ? 1 : step.id === 'dry' ? Math.max(0, 0.8 * (1 - u * 1.4)) : 0.6;
    return p;
  };
}

export const WASH_TOTAL_SEC = WASH_STEPS.reduce((n, s) => n + s.sec, 0);

/** Which step and how far through it, for a time (seconds at normal speed) since the first step began. */
export function washAt(t: number): { index: number; u: number; done: boolean } {
  let left = Math.max(0, t);
  for (const [i, s] of WASH_STEPS.entries()) {
    if (left < s.sec) return { index: i, u: left / s.sec, done: false };
    left -= s.sec;
  }
  return { index: WASH_STEPS.length - 1, u: 1, done: true };
}
