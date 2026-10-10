import type { EventLog } from '../../core/EventLog';
import { t } from '../../i18n';
import type { PatientModel } from '../patient/PatientModel';
import type { Scenario } from './index';

export type EndReason = 'stabilized' | 'deteriorated' | 'timeout' | 'ended-by-student';

/** Runs one attempt of a scenario: tracks progress and decides when the case ends. */
export class ScenarioSession {
  status: 'idle' | 'running' | 'completed' = 'idle';
  endReason: EndReason | null = null;
  onChange?: () => void;

  private stableFor = 0;
  private stabilised = false;
  private doctorNotified = false;

  constructor(readonly scenario: Scenario, private patient: PatientModel, private log: EventLog) {}

  get isStabilised(): boolean {
    return this.stabilised;
  }

  /** Current objective text (in the current language). */
  get objective(): string {
    if (this.status !== 'running') return '';
    return t(this.stabilised && !this.doctorNotified ? this.scenario.stableObjectiveKey : this.scenario.objectiveKey);
  }

  start(): void {
    if (this.status !== 'idle') return;
    this.status = 'running';
    this.log.record('session-start');
    this.onChange?.();
  }

  notifyDoctor(): void {
    if (this.status !== 'running') return;
    const v = this.patient.getVitals();
    this.log.record('doctor-notified', { spo2: v.spo2, sys: v.systolic, dia: v.diastolic });
    this.doctorNotified = true;
    this.onChange?.();
  }

  /** Call every frame with the simulated time step. */
  update(dt: number): void {
    if (this.status !== 'running' || dt <= 0) return;
    const v = this.patient.getVitals();

    const x = { glucose: this.patient.getGlucose() };

    if (this.scenario.isStable(v, this.patient.getInterventions(), x)) this.stableFor += dt;
    else this.stableFor = 0;

    if (!this.stabilised && this.stableFor >= this.scenario.stableSeconds) {
      this.stabilised = true;
      this.log.record('patient-stabilised');
      this.onChange?.();
    }

    if (this.stabilised && this.doctorNotified) this.end('stabilized');
    else if (this.scenario.isFailed(v, x)) this.end('deteriorated');
    else if (this.patient.getSimTime() >= this.scenario.timeLimitSec) this.end('timeout');
  }

  finish(): void {
    this.end('ended-by-student');
  }

  private end(reason: EndReason): void {
    if (this.status !== 'running') return;
    this.status = 'completed';
    this.endReason = reason;
    this.log.record('session-end', { reason });
    this.onChange?.();
  }
}
