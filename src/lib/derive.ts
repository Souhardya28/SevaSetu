import { computeSevaPath, PathInputs } from '@/services/path';
import type { AppState } from '@/store/useApp';

export function pathInputsFor(s: AppState, personId: string): PathInputs {
  const completed = s.matches.filter((m) => m.status === 'completed' && m.sevakId === personId).length;
  // Seeded history: demo Sevak has two earlier private acts that predate this device.
  const seeded = personId === 'p-aarav' ? 2 : 0;
  const myFeedback = s.feedback.filter((f) => s.matches.find((m) => m.id === f.matchId)?.sevakId === personId);
  return {
    completedActs: completed + seeded,
    acceptableFeedback: myFeedback.every((f) => f.respected && f.boundaries),
    reflections: s.reflections.filter((r) => r.personId === personId).length,
    joinedAbhiyan: s.joins.some((j) => j.personId === personId && j.status !== 'needs-training'),
    trainingDone: s.trainings.length > 0,
  };
}

export const currentPathStep = (s: AppState, personId: string) => computeSevaPath(pathInputsFor(s, personId)).find((x) => x.current);

export const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};
