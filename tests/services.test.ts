import { LEDGER, PASSAGES, PEOPLE, REQUESTS, NEEDS, CAMPAIGNS } from '@/data/seed';
import { crisisFor } from '@/constants/crisis';
import { detectTopic, followUp, respond, retrieve } from '@/services/guide';
import { matchItemToNeeds, matchSevakToRequest, explainMatch, recommendCampaign } from '@/services/matching';
import { analyzeBill, SAMPLE_BILLS } from '@/services/ocr';
import { computeSevaPath, gentleObservation, isTrustedSevak } from '@/services/path';
import { assessRisk, checkProhibitedItem, detectCrisis } from '@/services/safety';
import { DEMO_TRANSCRIPT, structureNeed } from '@/services/structuring';
import { checkTone } from '@/services/tone';
import { REFLECTIONS } from '@/data/seed';

const aarav = PEOPLE.find((p) => p.id === 'p-aarav')!;

describe('safety', () => {
  it('routes crisis phrases, in English, Hinglish and Hindi', () => {
    expect(detectCrisis('I want to end my life')).toBe(true);
    expect(detectCrisis('mujhe lagta hai marna chahta hoon')).toBe(true);
    expect(detectCrisis('मुझे आत्महत्या के विचार आते हैं')).toBe(true);
    expect(detectCrisis('I am feeling unmotivated today')).toBe(false);
  });
  it('classifies risk levels', () => {
    expect(assessRisk({ text: 'resume review', mode: 'remote' }).level).toBe('low');
    expect(assessRisk({ text: 'walk me to the clinic', mode: 'in-person' }).level).toBe('medium');
    const high = assessRisk({ text: 'tutor my child at home', mode: 'in-person' });
    expect(high.level).toBe('high');
    expect(high.needsOrganization).toBe(true);
  });
  it('blocks prohibited items', () => {
    expect(checkProhibitedItem('Leftover cooked food')).toBeTruthy();
    expect(checkProhibitedItem('strip of tablets and syrup')).toBe('Medicines');
    expect(checkProhibitedItem('Class 10 maths textbooks')).toBeNull();
  });
  it('keeps crisis resources in configuration', () => {
    expect(crisisFor().resources.length).toBeGreaterThan(0);
    expect(crisisFor('XX').locale).toBe('India');
  });
});

describe('tone check', () => {
  it('flags superior and unsafe language and suggests, never rewrites', () => {
    const t = checkTone('I want to help this poor woman');
    expect(t[0].kind).toBe('superior');
    expect(t[0].suggestion).toContain('Sunita-ji');
    expect(checkTone('give me your number so we can talk')[0].kind).toBe('unsafe');
    expect(checkTone('Happy to go at your pace.')).toHaveLength(0);
  });
});

describe('structuring and matching', () => {
  it('structures the demo transcript and keeps the original separate', () => {
    const n = structureNeed(DEMO_TRANSCRIPT);
    expect(n.category).toBe('learning');
    expect(n.skillsNeeded).toContain('mathematics');
    expect(n.days).toContain('saturday');
    expect(n.mode).toBe('remote');
  });
  it('explains why a Sevak matches', () => {
    const n = structureNeed(DEMO_TRANSCRIPT);
    const req = { ...REQUESTS[1], requesterId: 'p-meera', skillsNeeded: n.skillsNeeded, days: n.days, language: 'English', mode: n.mode, risk: 'low' as const };
    const m = matchSevakToRequest(aarav, req);
    expect(m.eligible).toBe(true);
    expect(explainMatch(m.reasons)).toMatch(/Recommended because you selected mathematics/);
    expect(explainMatch(m.reasons)).toMatch(/not a guarantee/);
  });
  it('never matches high-risk requests or own requests', () => {
    expect(matchSevakToRequest(aarav, { ...REQUESTS[0], risk: 'high' }).eligible).toBe(false);
    expect(matchSevakToRequest(aarav, { ...REQUESTS[0], requesterId: aarav.id }).eligible).toBe(false);
  });
  it('requires orientation for medium-risk in-person help', () => {
    const meera = PEOPLE.find((p) => p.id === 'p-meera')!;
    expect(matchSevakToRequest(meera, REQUESTS[0]).eligible).toBe(false);
  });
  it('recommends campaigns with reasons and honours dismissals', () => {
    expect(recommendCampaign(aarav, CAMPAIGNS[0], [])?.reasons.join(' ')).toMatch(/Education/);
    expect(recommendCampaign(aarav, CAMPAIGNS[0], [CAMPAIGNS[0].id])).toBeNull();
  });
  it('matches Class 10 books to verified needs', () => {
    const res = matchItemToNeeds({ category: 'School books', title: 'Class 10 books', description: '' }, NEEDS);
    expect(res.length).toBeGreaterThanOrEqual(2);
    expect(res.every((r) => r.need.category === 'School books')).toBe(true);
  });
});

describe('Seva Guide', () => {
  it('never returns philosophy for a crisis message', () => {
    const r = respond('support', 'I want to kill myself');
    expect(r.kind).toBe('crisis');
    expect(r.passage).toBeUndefined();
    expect(r.resources?.length).toBeGreaterThan(0);
  });
  it('acknowledges feeling, asks what support, then retrieves a labelled source', () => {
    const r = respond('support', 'I am feeling unmotivated');
    expect(r.kind).toBe('ask');
    expect(r.choices?.length).toBe(4);
    const t = followUp('teaching', detectTopic('I am feeling unmotivated'), 'I am feeling unmotivated');
    expect(t.kind).toBe('teaching');
    expect(t.passage?.work).toBeTruthy();
    expect(t.passage?.location).toBeTruthy();
  });
  it('does not invent a quotation when nothing verified is found', () => {
    expect(retrieve('quantum chromodynamics lattice').passage).toBeNull();
    expect(respond('learn', 'quantum chromodynamics lattice').kind).toBe('not-found');
  });
  it('every passage carries source metadata and an honest verification flag', () => {
    for (const p of PASSAGES) {
      expect(p.work && p.chapter && p.location).toBeTruthy();
      expect(p.editorialStatus).toBe('demo-pending-verification');
    }
  });
});

describe('Public Ledger OCR', () => {
  const entries = LEDGER.filter((l) => l.campaignId === 'c-lamps');
  it('flags a possible duplicate without accusing', () => {
    const f = analyzeBill(SAMPLE_BILLS.A, entries, []);
    expect(f.find((x) => x.status === 'duplicate')?.detail).toMatch(/may be a genuine/);
  });
  it('flags an amount mismatch', () => {
    const f = analyzeBill(SAMPLE_BILLS.B, entries, ['Hall contribution']);
    expect(f.find((x) => x.status === 'mismatch')?.matchedEntryId).toBe('l-5');
  });
  it('seeded ledger has one possible duplicate and receipts are redacted', () => {
    expect(LEDGER.filter((l) => l.receipt === 'duplicate')).toHaveLength(1);
    expect(LEDGER.every((l) => l.redacted)).toBe(true);
  });
});

describe('Seva Path and growth', () => {
  const base = { completedActs: 0, acceptableFeedback: true, reflections: 0, joinedAbhiyan: false, trainingDone: false };
  it('unlocks Trusted Sevak privately at the threshold with good feedback', () => {
    expect(isTrustedSevak({ ...base, completedActs: 5 })).toBe(true);
    expect(isTrustedSevak({ ...base, completedActs: 5, acceptableFeedback: false })).toBe(false);
    expect(isTrustedSevak({ ...base, completedActs: 4 })).toBe(false);
  });
  it('never exposes the threshold number in any step text', () => {
    const text = JSON.stringify(computeSevaPath({ ...base, completedActs: 2 }));
    expect(text).not.toMatch(/\b5\b|five/i);
  });
  it('points to the user own evidence without scoring', () => {
    const mine = REFLECTIONS.filter((r) => r.personId === 'p-aarav');
    expect(gentleObservation(mine)).toMatch(/mentioned .* more often in your recent reflections/);
  });
});

describe('product guardrails', () => {
  it('seed people expose no ratings, counts or rankings', () => {
    const json = JSON.stringify(PEOPLE);
    expect(json).not.toMatch(/rating|stars|leaderboard|helpedCount|rank/i);
  });
});
