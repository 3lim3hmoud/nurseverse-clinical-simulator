import { BAG_ML, FLUID_TIME_SCALE } from '../physiology/fluids';
import type { Interventions, IvInfusion } from '../physiology/interventions';
import type { GlucoseTreatment } from '../physiology/glucose';
import type { OxygenSetup } from '../physiology/oxygen';
import type { PhysiologyEngine } from '../physiology';
import { medById, type MedId } from '../medications';
import type { PatientProfile, Vitals } from './types';

type Listener = (vitals: Vitals) => void;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/**
 * The patient: current vitals + what the nurse has done. Time only advances while the simulation runs
 * (tick is called with dt = 0 when paused).
 */
export class PatientModel {
  /** Called once when the hanging IV bag runs dry. */
  onBagEmpty?: () => void;

  private interventions: Interventions = { oxygen: null, headElevated: false, legsRaised: false, iv: null };
  private bagMl = BAG_ML;
  private current: Vitals;
  private drift = { hr: 0, spo2: 0, rr: 0, sys: 0, dia: 0 };
  private elapsed = 0;
  private simTime = 0;
  private listeners = new Set<Listener>();
  private drugs: { id: MedId; t0: number }[] = [];

  constructor(readonly profile: PatientProfile, initial: Vitals, private engine: PhysiologyEngine) {
    this.current = { ...initial };
  }

  getVitals(): Vitals {
    return this.current;
  }

  getInterventions(): Interventions {
    return this.interventions;
  }

  /** Seconds of simulated time since the case started. */
  getSimTime(): number {
    return this.simTime;
  }

  /** mL left in the hanging bag. */
  getBagMl(): number {
    return this.bagMl;
  }

  /** True when an infusion is set and the bag still has fluid. */
  isIvRunning(): boolean {
    return this.interventions.iv !== null && this.bagMl > 0;
  }

  applyOxygen(setup: OxygenSetup): void {
    this.interventions = { ...this.interventions, oxygen: { ...setup } };
  }

  removeOxygen(): void {
    this.interventions = { ...this.interventions, oxygen: null };
  }

  setHeadElevated(on: boolean): void {
    this.interventions = { ...this.interventions, headElevated: on };
  }

  setLegsRaised(on: boolean): void {
    this.interventions = { ...this.interventions, legsRaised: on };
  }

  startIv(infusion: IvInfusion): void {
    this.interventions = { ...this.interventions, iv: { ...infusion } };
  }

  stopIv(): void {
    this.interventions = { ...this.interventions, iv: null };
  }

  /** Blood glucose in mg/dL, or undefined for cases that do not model it. Needs a glucometer in the simulation. */
  getGlucose(): number | undefined {
    const g = this.engine.getGlucose?.();
    return g === undefined ? undefined : Math.round(g);
  }

  giveGlucoseTreatment(kind: GlucoseTreatment): void {
    this.engine.applyTreatment?.(kind);
  }

  /** A medication has been given: its effect on the vitals ramps in from now. */
  giveMedication(id: MedId): void {
    this.drugs.push({ id, t0: this.simTime });
  }

  /** Sum of the active drug effects, each scaled by how far it has ramped in. */
  private drugDelta(): Partial<Vitals> {
    const sum: Partial<Vitals> = {};
    for (const d of this.drugs) {
      const effect = medById(d.id).effect;
      if (!effect) continue;
      const k = clamp((this.simTime - d.t0) / effect.rampSec, 0, 1);
      for (const [key, value] of Object.entries(effect.delta) as [keyof Vitals, number][]) sum[key] = (sum[key] ?? 0) + value * k;
    }
    return sum;
  }

  hangNewBag(): void {
    this.bagMl = BAG_ML;
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  tick(dt: number): void {
    if (dt <= 0) return;
    this.simTime += dt;

    let effective = this.interventions;
    const iv = this.interventions.iv;
    if (iv) {
      if (this.bagMl > 0) {
        this.bagMl = Math.max(0, this.bagMl - (iv.rateMlHr / 3600) * FLUID_TIME_SCALE * dt);
        if (this.bagMl === 0) this.onBagEmpty?.();
      }
      if (this.bagMl <= 0) effective = { ...this.interventions, iv: null };
    }
    const raw = this.engine.step(dt, effective);

    this.elapsed += dt;
    if (this.elapsed < 1) return;
    this.elapsed -= 1;

    // small natural variation on top of the physiology
    const step = (value: number, range: number) => clamp(value + (Math.random() - 0.5) * range * 0.8, -range, range);
    const d = this.drift;
    d.hr = step(d.hr, 3);
    d.spo2 = step(d.spo2, 0.8);
    d.rr = step(d.rr, 1);
    d.sys = step(d.sys, 3);
    d.dia = step(d.dia, 2);

    const fx = this.drugDelta();
    this.current = {
      heartRate: Math.round(raw.heartRate + d.hr + (fx.heartRate ?? 0)),
      spo2: Math.min(100, Math.round(raw.spo2 + d.spo2)),
      respiratoryRate: Math.max(4, Math.round(raw.respiratoryRate + d.rr)),
      systolic: Math.round(raw.systolic + d.sys),
      diastolic: Math.round(raw.diastolic + d.dia),
      temperatureC: Math.round((raw.temperatureC + (fx.temperatureC ?? 0)) * 10) / 10,
    };
    this.listeners.forEach((fn) => fn(this.current));
  }
}
