import { useSyncExternalStore } from 'react';

export type ControlId = 'joy' | 'act' | 'top';
export interface Spot {
  /** centre of the control as a share of the screen, 0..1 */
  x: number;
  y: number;
}
export type Orient = 'landscape' | 'portrait';

export interface Settings {
  /** joystick size, 1 = normal */
  joySize: number;
  /** E button size, 1 = normal */
  actSize: number;
  /** how visible the on-screen controls are, 0.35..1 */
  opacity: number;
  /** swap the joystick and the E button */
  leftHanded: boolean;
  /** how fast the view turns when the finger drags, 1 = normal */
  lookSens: number;
  invertY: boolean;
  vibrate: boolean;
  /** small text under the controls ("Move", "Use") */
  labels: boolean;
  /** graphics: auto adapts to the phone, low = fastest, high = sharpest (takes effect when a session starts) */
  quality: 'auto' | 'low' | 'high';
  /** side panel when a session starts: open, closed, or auto (closed on a phone held sideways) */
  panel: 'auto' | 'open' | 'closed';
  /** where the player moved the controls to, per way of holding the phone */
  layout: Record<Orient, Partial<Record<ControlId, Spot>>>;
}

export const DEFAULTS: Settings = {
  joySize: 1,
  actSize: 1,
  opacity: 0.85,
  leftHanded: false,
  lookSens: 1,
  invertY: false,
  vibrate: true,
  labels: true,
  quality: 'auto',
  panel: 'auto',
  layout: { landscape: {}, portrait: {} },
};

const KEY = 'nv.settings.v1';
const clamp = (n: unknown, lo: number, hi: number, d: number) => (typeof n === 'number' && Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d);
const bool = (v: unknown, d: boolean) => (typeof v === 'boolean' ? v : d);
const pick = <T extends string>(v: unknown, all: readonly T[], d: T): T => (all.includes(v as T) ? (v as T) : d);

function spots(raw: unknown): Partial<Record<ControlId, Spot>> {
  const out: Partial<Record<ControlId, Spot>> = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const id of ['joy', 'act', 'top'] as const) {
    const s = (raw as Record<string, { x?: unknown; y?: unknown }>)[id];
    if (s && typeof s.x === 'number' && typeof s.y === 'number') out[id] = { x: clamp(s.x, 0.03, 0.97, 0.5), y: clamp(s.y, 0.03, 0.97, 0.5) };
  }
  return out;
}

/** Anything read from storage is checked: a damaged or old value falls back to the default. */
export function sanitize(raw: unknown): Settings {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const layout = (r.layout && typeof r.layout === 'object' ? r.layout : {}) as Record<string, unknown>;
  return {
    joySize: clamp(r.joySize, 0.7, 1.6, DEFAULTS.joySize),
    actSize: clamp(r.actSize, 0.7, 1.8, DEFAULTS.actSize),
    opacity: clamp(r.opacity, 0.35, 1, DEFAULTS.opacity),
    leftHanded: bool(r.leftHanded, DEFAULTS.leftHanded),
    lookSens: clamp(r.lookSens, 0.4, 2.5, DEFAULTS.lookSens),
    invertY: bool(r.invertY, DEFAULTS.invertY),
    vibrate: bool(r.vibrate, DEFAULTS.vibrate),
    labels: bool(r.labels, DEFAULTS.labels),
    quality: pick(r.quality, ['auto', 'low', 'high'] as const, DEFAULTS.quality),
    panel: pick(r.panel, ['auto', 'open', 'closed'] as const, DEFAULTS.panel),
    layout: { landscape: spots(layout.landscape), portrait: spots(layout.portrait) },
  };
}

function load(): Settings {
  try {
    const s = localStorage.getItem(KEY);
    return sanitize(s ? JSON.parse(s) : null);
  } catch {
    return sanitize(null);
  }
}

let current: Settings = load();
const listeners = new Set<() => void>();

export const getSettings = (): Settings => current;

export function updateSettings(patch: Partial<Settings>): void {
  current = sanitize({ ...current, ...patch });
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    /* private mode: the settings last until the page is closed */
  }
  listeners.forEach((l) => l());
}

export function resetSettings(): void {
  current = sanitize(null);
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

/** Move one control (for one way of holding the phone). `null` puts it back where it was. */
export function setSpot(orient: Orient, id: ControlId, spot: Spot | null): void {
  const layout = { landscape: { ...current.layout.landscape }, portrait: { ...current.layout.portrait } };
  if (spot) layout[orient][id] = spot;
  else delete layout[orient][id];
  updateSettings({ layout });
}

export function useSettings(): Settings {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    getSettings,
    getSettings,
  );
}

export const orientation = (): Orient => (window.matchMedia('(orientation: portrait)').matches ? 'portrait' : 'landscape');

/** A short buzz for the buttons, when the phone can do it and the player wants it. */
export function buzz(ms = 12): void {
  if (current.vibrate && 'vibrate' in navigator) navigator.vibrate(ms);
}

/** Does the side panel start open? "Auto": yes, except on a phone held sideways, where it would cover half of the room. */
export function panelStartsOpen(touch: boolean): boolean {
  if (current.panel === 'open') return true;
  if (current.panel === 'closed') return false;
  return !(touch && window.matchMedia('(orientation: landscape)').matches && window.innerHeight <= 520);
}
