import { mirrorHand, type HandPose, type HandsPose, type Vec3 } from './Hands';
import type { ScriptStep } from './handsScript';

const PI = Math.PI;
const H = (pos: Vec3, rot: Vec3, curl: HandPose['curl'], spread = 0, extra: Partial<HandPose> = {}): HandPose => ({ pos, rot, curl, spread, ...extra });
const open: HandPose['curl'] = [0.1, 0.1, 0.1, 0.1, 0.1];
const pinch: HandPose['curl'] = [0.55, 0.6, 0.62, 0.7, 0.75];
const relaxed: HandPose['curl'] = [0.25, 0.3, 0.3, 0.32, 0.35];
const ease = (x: number) => x * x * (3 - 2 * x);
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const seg = (u: number, a: number, b: number) => ease(clamp01((u - a) / (b - a)));
const lerp3 = (a: Vec3, b: Vec3, t: number): Vec3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const wave = (u: number, cycles: number) => Math.sin(u * cycles * 2 * PI);

/** Hands up beside the head (ears, temples), palms toward the face. */
const beside = (u: number, held: HandsPose['held'] = null): HandsPose => {
  const r = H([0.19, -0.015 + 0.01 * wave(u, 2), -0.31], [PI / 2, PI / 2, 0], pinch, 0.1, { tilt: 0.1 });
  return { r, l: mirrorHand(r), foam: 0, held, wet: 0 };
};

/** Putting on a surgical mask, goggles and a pair of gloves (after hand hygiene). */
export const DON_STEPS: ScriptStep[] = [
  {
    id: 'mask',
    en: 'Put on the mask',
    ar: 'ارتدِ الكمامة',
    tipEn: 'Cover the nose and mouth, press the metal strip to your nose, hook the loops behind your ears.',
    tipAr: 'غطِّ الأنف والفم، اضغط الشريط المعدني على أنفك، وعلّق الأربطة خلف أذنيك.',
    sec: 5,
    fx: [{ at: 0.6, mask: true }],
    pose: (u) => {
      if (u < 0.35) {
        const k = seg(u, 0, 0.35);
        return { r: H(lerp3([0.12, -0.3, -0.32], [0.03, -0.04, -0.38], k), [0.2, 0.1, 0], pinch, 0.1), l: H(lerp3([-0.12, -0.3, -0.32], [-0.05, -0.07, -0.4], k), [0.3, -0.2, PI * 0.9], open, 0.1), foam: 0, held: 'mask', wet: 0 };
      }
      if (u < 0.6) {
        const k = seg(u, 0.35, 0.6);
        return { r: H(lerp3([0.03, -0.04, -0.38], [0.02, 0.02, -0.24], k), [0.35, 0.05, 0], pinch, 0.1), l: H(lerp3([-0.05, -0.07, -0.4], [-0.07, 0.0, -0.26], k), [0.5, -0.1, PI * 0.9], open, 0.1), foam: 0, held: 'mask', wet: 0 };
      }
      // the loops go behind the ears, then the hands come down
      const k = seg(u, 0.6, 0.85);
      const down = seg(u, 0.85, 1);
      const p = beside(u);
      const y = (1 - down) * 1;
      return { ...p, r: { ...p.r, pos: [p.r.pos[0], p.r.pos[1] - down * 0.4, p.r.pos[2]] }, l: { ...p.l, pos: [p.l.pos[0], p.l.pos[1] - down * 0.4, p.l.pos[2]] }, foam: 0, held: k < 0.2 ? 'mask' : null, wet: 0 * y };
    },
  },
  {
    id: 'goggles',
    en: 'Put on the goggles',
    ar: 'ارتدِ النظارة الواقية',
    tipEn: 'Both hands on the frame, over the eyes, strap or arms over the ears; they must sit snug.',
    tipAr: 'ضع النظارة بكلتا اليدين على العينين وثبّت الذراعين خلف الأذنين؛ يجب أن تلتصق جيداً.',
    sec: 4,
    fx: [{ at: 0.6, goggles: true }],
    pose: (u) => {
      if (u < 0.55) {
        const k = seg(u, 0, 0.55);
        return { r: H(lerp3([0.1, -0.32, -0.34], [0.03, 0.03, -0.26], k), [0.3, 0.1, 0], pinch, 0.1), l: H(lerp3([-0.1, -0.32, -0.34], [-0.05, 0.02, -0.28], k), [0.4, -0.2, PI * 0.9], pinch, 0.1), foam: 0, held: 'goggles', wet: 0 };
      }
      const down = seg(u, 0.85, 1);
      const p = beside(u);
      return { ...p, r: { ...p.r, pos: [p.r.pos[0] - 0.03, p.r.pos[1] + 0.04 - down * 0.4, p.r.pos[2]] }, l: { ...p.l, pos: [p.l.pos[0] + 0.03, p.l.pos[1] + 0.04 - down * 0.4, p.l.pos[2]] }, foam: 0, held: null, wet: 0 };
    },
  },
  {
    id: 'glove-right',
    en: 'Put on the first glove',
    ar: 'ارتدِ القفاز الأول',
    tipEn: 'Hold the glove by the cuff, slide the hand in, pull it over the wrist.',
    tipAr: 'أمسك القفاز من الحافة، أدخل يدك، ثم اسحبه فوق المعصم.',
    sec: 4,
    fx: [{ at: 0.55, gloveR: true }],
    pose: (u) => {
      const k = seg(u, 0.1, 0.6);
      // the left hand holds the glove open; the right hand slides into it
      const l = H([-0.06, -0.1, -0.4], [0.35, -0.2, PI * 0.5], pinch, 0.1);
      const r = H(lerp3([0.14, -0.18, -0.3], [-0.0, -0.1, -0.44], k), [0.3, 0.1, 0], open, 0.2);
      return { r, l, foam: 0, held: u < 0.6 ? 'glove' : null, heldIn: 'l', wet: 0 };
    },
  },
  {
    id: 'glove-left',
    en: 'Put on the second glove',
    ar: 'ارتدِ القفاز الثاني',
    tipEn: 'Slide the gloved fingers under the cuff of the second glove, pull it on, cuffs over the wrists.',
    tipAr: 'أدخل أصابع اليد المقفّزة تحت حافة القفاز الثاني، وارتدِه، ثم اسحب الحواف فوق المعصمين.',
    sec: 4,
    fx: [{ at: 0.5, gloveL: true }],
    pose: (u) => {
      const k = seg(u, 0.1, 0.55);
      const r = H([0.06, -0.1, -0.4], [0.35, 0.2, -PI * 0.5], pinch, 0.1);
      const l = H(lerp3([-0.14, -0.18, -0.3], [0.0, -0.1, -0.44], k), [0.3, -0.1, 0], open, 0.2);
      const settle = seg(u, 0.7, 1);
      return { r: { ...r, pos: [r.pos[0] + settle * 0.03, r.pos[1], r.pos[2]] }, l, foam: 0, held: u < 0.55 ? 'glove' : null, heldIn: 'r', wet: 0 };
    },
  },
];

/** Taking the PPE off again, in the right order: gloves, goggles, mask. */
export const DOFF_STEPS: ScriptStep[] = [
  {
    id: 'doff-gloves',
    en: 'Take the gloves off without touching the outside',
    ar: 'اخلع القفازين دون لمس السطح الخارجي',
    tipEn: 'Pinch the first glove at the wrist and peel it inside out; hold it in the other hand; slide a finger under the second cuff and peel it over the first; bin both.',
    tipAr: 'اقرص القفاز الأول عند المعصم واسحبه مقلوباً؛ أمسكه بيدك الأخرى؛ أدخل إصبعاً تحت حافة القفاز الثاني واسحبه فوق الأول؛ ثم ارمهما معاً.',
    sec: 7,
    fx: [{ at: 0.3, gloveL: false }, { at: 0.75, gloveR: false }],
    pose: (u) => {
      if (u < 0.3) {
        const k = seg(u, 0, 0.3);
        // right hand pinches the cuff of the left glove and peels it away
        return { r: H(lerp3([0.06, -0.14, -0.42], [-0.02, -0.1, -0.4], k), [0.4, 0.5, 0], pinch, 0), l: H([-0.05, -0.1, -0.42], [0.6, 0.1, 0], relaxed, 0.1), foam: 0, held: null, wet: 0 };
      }
      if (u < 0.75) {
        const k = seg(u, 0.3, 0.75);
        // the peeled glove is balled in the right hand; the bare left finger slips under the right cuff
        return { r: H([0.05, -0.1, -0.42], [0.5, 0.2, 0.2], [0.9, 1, 1, 1, 1], 0), l: H(lerp3([-0.06, -0.12, -0.4], [0.04, -0.09, -0.4], k), [0.5, -0.2, 0], [0.5, 0.1, 0.6, 0.8, 0.8], 0), foam: 0, held: 'glove', wet: 0 };
      }
      const k = seg(u, 0.75, 1);
      return { r: H(lerp3([0.05, -0.1, -0.42], [0.12, -0.3, -0.38], k), [0.5, 0.2, 0.2], [0.9, 1, 1, 1, 1], 0), l: H(lerp3([0.04, -0.09, -0.4], [0.0, -0.2, -0.42], k), [0.5, -0.2, 0], relaxed, 0), foam: 0, held: k < 0.8 ? 'glove' : null, wet: 0 };
    },
  },
  {
    id: 'doff-goggles',
    en: 'Take the goggles off by the strap',
    ar: 'اخلع النظارة من الشريط',
    tipEn: 'Touch only the clean strap or arms, never the front.',
    tipAr: 'المس الشريط أو الذراعين النظيفين فقط، وليس مقدمة النظارة.',
    sec: 3,
    fx: [{ at: 0.5, goggles: false }],
    pose: (u) => {
      const up = seg(u, 0, 0.45);
      const away = seg(u, 0.5, 1);
      const p = beside(u);
      return { ...p, r: { ...p.r, pos: [p.r.pos[0] - 0.02, p.r.pos[1] - 0.3 + up * 0.32 - away * 0.35, p.r.pos[2]] }, l: { ...p.l, pos: [p.l.pos[0] + 0.02, p.l.pos[1] - 0.3 + up * 0.32 - away * 0.35, p.l.pos[2]] }, foam: 0, held: u > 0.55 ? 'goggles' : null, wet: 0 };
    },
  },
  {
    id: 'doff-mask',
    en: 'Take the mask off by the ties',
    ar: 'اخلع الكمامة من الأربطة',
    tipEn: 'Untie or lift the loops from behind the ears; do not touch the front of the mask.',
    tipAr: 'فكّ الأربطة أو ارفعها من خلف الأذنين دون لمس مقدمة الكمامة.',
    sec: 3,
    fx: [{ at: 0.5, mask: false }],
    pose: (u) => {
      const up = seg(u, 0, 0.45);
      const away = seg(u, 0.5, 1);
      const p = beside(u);
      return { ...p, r: { ...p.r, pos: [p.r.pos[0], p.r.pos[1] - 0.3 + up * 0.32 - away * 0.35, p.r.pos[2]] }, l: { ...p.l, pos: [p.l.pos[0], p.l.pos[1] - 0.3 + up * 0.32 - away * 0.35, p.l.pos[2]] }, foam: 0, held: u > 0.55 ? 'mask' : null, wet: 0 };
    },
  },
];
