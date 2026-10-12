import { allItems, isBedsideFixture, PROCEDURES } from './catalog';
import type { EquipItem, Mode, ProcedureDef, ProcStep } from './types';

/** An item laid out on the supply tables. `extra` ones are not needed (exam distractors). */
export interface SceneItem extends EquipItem {
  extra: boolean;
  /** already at the bedside: counted as ready, never put on a table */
  fixture: boolean;
}

/** One thing the nurse can choose to do. Exam lists also contain steps of other procedures (stepIndex = null). */
export interface ActionRef {
  key: string;
  stepIndex: number | null;
  en: string;
  ar: string;
}

export interface Context {
  nearBed: boolean;
  nearSanitizer: boolean;
  /** commanded bed head angle in radians */
  headAngleRad: number;
}

export type BlockReason = 'order' | 'equipment' | 'bed' | 'sanitizer' | 'position' | 'distractor' | 'done';
export type Check = { ok: true } | { ok: false; reason: BlockReason; expected?: number; missing?: EquipItem[] };

export interface ProcError {
  t: number;
  type: 'order' | 'distractor' | 'extra-item';
  detail: string;
}

export interface SessionResult {
  percent: number;
  passed: boolean;
  completion: number;
  orderAccuracy: number;
  equipmentScore: number;
  stepsDone: number;
  stepsTotal: number;
  requiredCollected: number;
  requiredTotal: number;
  extras: number;
  orderErrors: number;
  distractorErrors: number;
  seconds: number;
  timedOut: boolean;
}

/** semi-Fowler's with a little tolerance */
export const POSITION_MIN = (25 * Math.PI) / 180;
export const POSITION_MAX = (50 * Math.PI) / 180;
export const PASS_PERCENT = 80;

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

function shuffle<T>(list: T[], rnd: () => number): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * The rules of one run of a procedure: which equipment is in the tray, which steps are done and in which order.
 * No 3D and no UI in here, so every rule can be tested.
 *
 *  - ordered procedures: only the next step can be done; anything else is an order error and does nothing
 *  - bundles: any order
 *  - practice shows the way (next step, equipment list); exam adds distractor items and steps and hides the way
 */
export class ProcedureSession {
  readonly items: SceneItem[];
  readonly actions: ActionRef[];
  readonly limitSec: number | null;
  readonly errors: ProcError[] = [];
  readonly performed: { stepIndex: number; t: number }[] = [];
  private tray = new Set<string>();
  private doneSet = new Set<number>();
  private endedAt: number | null = null;
  private timedOut = false;
  private readonly t0: number;

  constructor(
    readonly def: ProcedureDef,
    readonly mode: Mode,
    private readonly now: () => number = () => Date.now() / 1000,
    seed = 1,
  ) {
    this.t0 = now();
    const rnd = mulberry32(seed);
    const required: SceneItem[] = allItems(def).map((i) => ({ ...i, extra: false, fixture: isBedsideFixture(i) }));
    const stepActions: ActionRef[] = def.steps.map((s) => ({ key: `s${s.index}`, stepIndex: s.index, en: s.en, ar: s.ar }));

    if (mode === 'exam') {
      const have = new Set(required.map((i) => norm(i.en)));
      const pool = PROCEDURES.filter((p) => p.id !== def.id).flatMap((p) => allItems(p));
      const seen = new Set<string>();
      const distractors = shuffle(pool, rnd).filter((i) => {
        const k = norm(i.en);
        if (have.has(k) || seen.has(k)) return false;
        seen.add(k);
        return true;
      });
      const extras = distractors.slice(0, 6).map((i): SceneItem => ({ ...i, id: `x-${i.id}`, group: Math.floor(rnd() * Math.max(1, def.groups.length)), extra: true, fixture: false }));
      this.items = [...required, ...extras];

      const stepKeys = new Set(def.steps.map((s) => norm(s.en)));
      const foreign = shuffle(
        PROCEDURES.filter((p) => p.id !== def.id).flatMap((p) => p.steps.map((s) => ({ p, s }))),
        rnd,
      ).filter(({ s }) => !stepKeys.has(norm(s.en)));
      const fake: ActionRef[] = foreign.slice(0, 3).map(({ p, s }) => ({ key: `x-${p.id}-${s.index}`, stepIndex: null, en: s.en, ar: s.ar }));
      this.actions = shuffle([...stepActions, ...fake], rnd);
      this.limitSec = def.steps.length * 50 + 120;
    } else {
      this.items = required;
      this.actions = stepActions;
      this.limitSec = null;
    }
  }

  // ---- equipment ----
  /** What has to be collected: everything that is not already at the bedside. */
  get required(): EquipItem[] {
    return this.items.filter((i) => !i.extra && !i.fixture);
  }
  /** Items to lay out on the supply tables. */
  tableItems(): SceneItem[] {
    return this.items.filter((i) => !i.fixture);
  }
  fixtures(): SceneItem[] {
    return this.items.filter((i) => i.fixture);
  }
  has(id: string): boolean {
    return this.tray.has(id);
  }
  /** The items the nurse picked up (not the bedside fixtures). */
  trayItems(): SceneItem[] {
    return this.items.filter((i) => !i.fixture && this.tray.has(i.id));
  }
  missing(): EquipItem[] {
    return this.required.filter((i) => !this.tray.has(i.id));
  }

  /** Put an item in the tray. An item that is not needed is an error (exam). */
  pick(id: string): { ok: boolean; extra: boolean } {
    const item = this.items.find((i) => i.id === id);
    if (!item || item.fixture || this.tray.has(id) || this.endedAt !== null) return { ok: false, extra: false };
    this.tray.add(id);
    if (item.extra) this.errors.push({ t: this.elapsed(), type: 'extra-item', detail: item.en });
    return { ok: true, extra: item.extra };
  }

  // ---- steps ----
  isDone(index: number): boolean {
    return this.doneSet.has(index);
  }
  get doneCount(): number {
    return this.doneSet.size;
  }
  get finished(): boolean {
    return this.doneSet.size === this.def.steps.length;
  }
  /** The step to do now (ordered), or the first one still to do (bundles). */
  nextIndex(): number | null {
    const next = this.def.steps.find((s) => !this.doneSet.has(s.index));
    return next ? next.index : null;
  }
  nextStep(): ProcStep | null {
    const i = this.nextIndex();
    return i === null ? null : this.def.steps[i];
  }

  check(key: string, ctx: Context): Check {
    const action = this.actions.find((a) => a.key === key);
    if (!action) return { ok: false, reason: 'distractor' };
    if (action.stepIndex === null) return { ok: false, reason: 'distractor' };
    const step = this.def.steps[action.stepIndex];
    if (this.doneSet.has(step.index)) return { ok: false, reason: 'done' };
    if (this.def.ordered) {
      const next = this.nextIndex();
      if (next !== step.index) return { ok: false, reason: 'order', expected: next ?? undefined };
    }
    const missing = this.missing();
    switch (step.kind) {
      case 'hygiene':
        if (!ctx.nearSanitizer) return { ok: false, reason: 'sanitizer' };
        break;
      case 'gather':
        if (missing.length > 0) return { ok: false, reason: 'equipment', missing };
        break;
      case 'position':
        if (!ctx.nearBed) return { ok: false, reason: 'bed' };
        if (ctx.headAngleRad < POSITION_MIN || ctx.headAngleRad > POSITION_MAX) return { ok: false, reason: 'position' };
        break;
      case 'bedside':
        if (!ctx.nearBed) return { ok: false, reason: 'bed' };
        break;
    }
    const gated = step.kind !== 'hygiene' && step.kind !== 'gather' && this.def.gateIndex !== null && step.index >= this.def.gateIndex;
    if (gated && missing.length > 0) return { ok: false, reason: 'equipment', missing };
    return { ok: true };
  }

  /** Try to do an action. A wrong choice is recorded as an error; the step is only done when every rule is met. */
  perform(key: string, ctx: Context): Check {
    if (this.endedAt !== null) return { ok: false, reason: 'done' };
    const result = this.check(key, ctx);
    const action = this.actions.find((a) => a.key === key);
    if (!result.ok) {
      if (result.reason === 'order') this.errors.push({ t: this.elapsed(), type: 'order', detail: action?.en ?? key });
      if (result.reason === 'distractor') this.errors.push({ t: this.elapsed(), type: 'distractor', detail: action?.en ?? key });
      return result;
    }
    const index = action!.stepIndex!;
    this.doneSet.add(index);
    this.performed.push({ stepIndex: index, t: this.elapsed() });
    return result;
  }

  // ---- time + result ----
  elapsed(): number {
    return (this.endedAt ?? this.now()) - this.t0;
  }
  timeLeft(): number | null {
    return this.limitSec === null ? null : Math.max(0, this.limitSec - this.elapsed());
  }
  get ended(): boolean {
    return this.endedAt !== null;
  }
  finish(timedOut = false): SessionResult {
    if (this.endedAt === null) {
      this.endedAt = this.now();
      this.timedOut = timedOut;
    }
    return this.result();
  }

  result(): SessionResult {
    const total = this.def.steps.length;
    const orderErrors = this.errors.filter((e) => e.type === 'order').length;
    const distractorErrors = this.errors.filter((e) => e.type === 'distractor').length;
    const extras = this.errors.filter((e) => e.type === 'extra-item').length;
    const required = this.required;
    const collected = required.filter((i) => this.tray.has(i.id)).length;
    const completion = total === 0 ? 1 : this.doneSet.size / total;
    const attempts = this.doneSet.size + orderErrors + distractorErrors;
    const orderAccuracy = attempts === 0 ? 0 : this.doneSet.size / attempts;
    const equipmentScore = required.length === 0 ? 1 : Math.max(0, Math.min(1, collected / required.length - 0.1 * extras));
    const percent = Math.round(100 * (0.45 * completion + 0.25 * orderAccuracy + 0.3 * equipmentScore));
    return {
      percent,
      passed: percent >= PASS_PERCENT && completion === 1,
      completion,
      orderAccuracy,
      equipmentScore,
      stepsDone: this.doneSet.size,
      stepsTotal: total,
      requiredCollected: collected,
      requiredTotal: required.length,
      extras,
      orderErrors,
      distractorErrors,
      seconds: Math.round(this.elapsed()),
      timedOut: this.timedOut,
    };
  }
}
