import { t } from '../../i18n';
import type { Debrief, DebriefInput, DebriefingService } from './types';
import { SMALL_TALK, type Intent } from './intents';

/** Topics the student asked the patient about, from the event log. */
export function askedTopics(events: DebriefInput['events']): Set<string> {
  const asked = new Set<string>();
  for (const e of events) {
    if (e.type !== 'history-asked') continue;
    for (const i of (e.data?.intents as Intent[] | undefined) ?? []) if (!SMALL_TALK.includes(i)) asked.add(i);
  }
  return asked;
}

/** Offline debrief built from the score report and the event log. */
export function buildLocalDebrief({ scenario, events, report }: DebriefInput): Debrief {
  const strengths = report.items.filter((i) => i.points === i.maxPoints).slice(0, 3).map((i) => `${i.label}: ${i.feedback}`);
  const improvements = report.items
    .filter((i) => i.points < i.maxPoints)
    .sort((a, b) => b.maxPoints - b.points - (a.maxPoints - a.points))
    .slice(0, 3)
    .map((i) => `${i.label}: ${i.feedback}`);

  // History taking
  const asked = askedTopics(events);
  const missing = scenario.keyHistory.filter((k) => !asked.has(k));
  const names = (list: string[]) => list.map((k) => t(`intent.${k}`)).join(', ');
  if (missing.length === 0) strengths.push(t('deb.history.ok'));
  else if (asked.size === 0) improvements.push(t('deb.history.none', { topics: names(missing) }));
  else improvements.push(t('deb.history.some', { topics: names(missing) }));

  // Handover quality (SBAR)
  const sbar = events.find((e) => e.type === 'sbar-sent');
  const quality = (sbar?.data?.quality as number | undefined) ?? -1;
  if (quality === 2) strengths.push(t('deb.sbar.best'));
  else if (quality === 1) improvements.push(t('deb.sbar.ok'));
  else if (quality === 0) improvements.push(t('deb.sbar.bad'));

  return { strengths, improvements, nextStep: t(scenario.debriefTipKey), source: 'local' };
}

export class LocalDebriefing implements DebriefingService {
  async debrief(input: DebriefInput): Promise<Debrief> {
    return buildLocalDebrief(input);
  }
}
