/**
 * Fixed places of the procedure room (metres, floor plan x/z). The 3D props are built at these spots and the
 * guidance, the minimap and the "am I close enough" rules all read them from here.
 */
export interface Point {
  x: number;
  z: number;
}

/** The hand-hygiene station: a stand with a sign, in front of the bed bay, visible from where the nurse starts. */
export const HYGIENE_STATION: Point = { x: -1.5, z: 1.9 };
/** The sanitizer on the headwall (also works). */
export const HEADWALL_SANITIZER: Point = { x: -2.35, z: -3.0 };
/** The bed control pendant, beside the bed. */
export const BED_CONTROL: Point = { x: 0.85, z: -1.15 };
export const BED_CENTER: Point = { x: 0, z: -1.4 };

export const NEAR_SANITIZER = 2.4;
export const NEAR_BED = 1.9;

const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.z - b.z);

/** Distance from a point to the bed's footprint (x within +-0.55, z between -2.5 and -0.3). */
export function distanceToBed(p: Point): number {
  const dx = Math.max(Math.abs(p.x) - 0.55, 0);
  const dz = Math.max(-2.5 - p.z, p.z + 0.3, 0);
  return Math.hypot(dx, dz);
}

export function whereAmI(p: Point) {
  return {
    nearBed: distanceToBed(p) <= NEAR_BED,
    nearSanitizer: dist(p, HYGIENE_STATION) <= NEAR_SANITIZER || dist(p, HEADWALL_SANITIZER) <= NEAR_SANITIZER,
  };
}
