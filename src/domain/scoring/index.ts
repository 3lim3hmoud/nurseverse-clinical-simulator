import type { SimEvent } from '../../core/EventLog';
import type { Scenario } from '../scenarios';

export interface ScoreItem {
  label: string;
  points: number;
  maxPoints: number;
  feedback: string;
}

export interface ScoreReport {
  total: number; // 0-100
  grade: string;
  outcome: string;
  items: ScoreItem[];
}

/** Student performance scoring based on the recorded event log. */
export interface PerformanceScorer {
  score(events: readonly SimEvent[], scenario: Scenario): ScoreReport;
}

export { buildTimeline, type TimelineRow } from './timeline';
