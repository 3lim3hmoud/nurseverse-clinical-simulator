import type { SimEvent } from '../../core/EventLog';
import type { Scenario } from '../scenarios';

export interface ScoreItem {
  id: string; // stable key (language independent), used for progress tracking
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
