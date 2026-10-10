import type { ScoreReport } from '../../domain/scoring';

/**
 * The simulator "learns" the student: it remembers recent runs on this device and feeds the pattern
 * (recurring weak areas, trend) into the debrief. Stored locally only. Never stores answers or personal data.
 */
const KEY = 'nurseverse-progress';
const MAX_RUNS = 30;

export interface RunRecord {
  scenarioId: string;
  score: number;
  weak: string[]; // ids of score items that lost points
  at: number;
}

export interface ProgressSummary {
  runs: number;
  averageScore: number;
  byScenario: Record<string, { runs: number; best: number; last: number }>;
  recurringWeak: string[]; // score item ids that keep losing points
}

function load(): RunRecord[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(raw) ? (raw as RunRecord[]).filter((r) => r && typeof r.score === 'number' && Array.isArray(r.weak)) : [];
  } catch {
    return [];
  }
}

export function recordRun(scenarioId: string, report: ScoreReport): void {
  const runs = load();
  runs.push({ scenarioId, score: report.total, weak: report.items.filter((i) => i.points < i.maxPoints).map((i) => i.id), at: Date.now() });
  try {
    localStorage.setItem(KEY, JSON.stringify(runs.slice(-MAX_RUNS)));
  } catch {
    /* storage blocked: progress is simply not kept */
  }
}

export function summarize(): ProgressSummary {
  const runs = load();
  const byScenario: ProgressSummary['byScenario'] = {};
  for (const r of runs) {
    const s = byScenario[r.scenarioId] ?? { runs: 0, best: 0, last: 0 };
    s.runs += 1;
    s.best = Math.max(s.best, r.score);
    s.last = r.score;
    byScenario[r.scenarioId] = s;
  }
  const counts = new Map<string, number>();
  for (const r of runs.slice(-10)) for (const id of r.weak) counts.set(id, (counts.get(id) ?? 0) + 1);
  const recurringWeak = [...counts.entries()].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => id);
  const averageScore = runs.length ? Math.round(runs.reduce((s, r) => s + r.score, 0) / runs.length) : 0;
  return { runs: runs.length, averageScore, byScenario, recurringWeak };
}
