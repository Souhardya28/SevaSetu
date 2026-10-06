import type { Quality, Reflection } from '@/types';

export interface PathStep { id: string; title: string; blurb: string; done: boolean; current?: boolean }

export interface PathInputs {
  completedActs: number; // private; never shown as a number
  acceptableFeedback: boolean;
  reflections: number;
  joinedAbhiyan: boolean;
  trainingDone: boolean;
}

/** Threshold is private. The UI never displays it. */
export const TRUSTED_SEVAK_THRESHOLD = 5;

export function isTrustedSevak(i: PathInputs) {
  return i.completedActs >= TRUSTED_SEVAK_THRESHOLD && i.acceptableFeedback;
}

export function computeSevaPath(i: PathInputs): PathStep[] {
  const steps: Omit<PathStep, 'current'>[] = [
    { id: 'first', title: 'A first act', blurb: 'Offer help once, at your own pace.', done: i.completedActs >= 1 },
    { id: 'reflect', title: 'A first reflection', blurb: 'Notice what the experience taught you.', done: i.reflections >= 1 },
    { id: 'repeat', title: 'Repeated commitment', blurb: 'Keep showing up, quietly and reliably.', done: i.completedActs >= 3 },
    { id: 'trusted', title: 'Trusted Sevak', blurb: 'Unlocked through steady acts with respectful feedback.', done: isTrustedSevak(i) },
    { id: 'abhiyan', title: 'Join an Abhiyan', blurb: 'Serve alongside a team.', done: i.joinedAbhiyan },
    { id: 'training', title: 'Complete role training', blurb: 'For roles that need extra care.', done: i.trainingDone },
    { id: 'team', title: 'Support a team', blurb: 'Help others find their footing.', done: false },
    { id: 'lead', title: 'Lead, only after approval', blurb: 'Requires experience, training and a clean safety record.', done: false },
  ];
  const firstOpen = steps.findIndex((s) => !s.done);
  return steps.map((s, idx) => ({ ...s, current: idx === firstOpen }));
}

export const QUALITIES: Quality[] = ['Patience', 'Humility', 'Steadiness', 'Courage', 'Listening', 'Teamwork'];

export interface ThemeCount { quality: Quality; count: number; evidence: Reflection[] }

/** Themes drawn only from the person's own reflections. No scores, no comparison. */
export function growthThemes(refs: Reflection[]): ThemeCount[] {
  return QUALITIES.map((q) => {
    const evidence = refs.filter((r) => r.qualities.includes(q));
    return { quality: q, count: evidence.length, evidence };
  }).filter((t) => t.count > 0).sort((a, b) => b.count - a.count);
}

export function gentleObservation(refs: Reflection[]): string | null {
  const t = growthThemes(refs);
  if (!t.length) return null;
  return `You have mentioned ${t[0].quality.toLowerCase()} more often in your recent reflections.`;
}
