jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

import { DEMO_TRANSCRIPT, structureNeed } from '@/services/structuring';
import { SAMPLE_BILLS, analyzeBill } from '@/services/ocr';
import { useApp } from '@/store/useApp';

const s = () => useApp.getState();

beforeEach(() => { s().resetDemo(); });

describe('Journey A: person-to-person seva', () => {
  it('runs from request to private reflection', () => {
    s().login('p-meera');
    const n = structureNeed(DEMO_TRANSCRIPT);
    const req = s().publishRequest({ originalText: DEMO_TRANSCRIPT, title: n.title, category: n.category, outcome: n.outcome, language: n.language, mode: n.mode, area: '', days: n.days, whenLabel: n.whenLabel, minutes: n.minutes, accessibility: n.accessibility, skillsNeeded: n.skillsNeeded, visibility: 'circle' });
    expect(req.originalText).toBe(DEMO_TRANSCRIPT);
    expect(req.status).toBe('open');
    expect(req.area).toMatch(/approximate/);

    s().login('p-aarav');
    const matchId = s().acceptRequest(req.id)!;
    expect(matchId).toBeTruthy();
    expect(s().requests.find((r) => r.id === req.id)?.status).toBe('matched');
    expect(s().matches[0].contactShared).toBe(false);

    s().checkIn(matchId);
    s().checkOut(matchId);
    s().updatePlan(matchId, { when: 'Saturday 6 PM', mode: 'remote', place: 'Online call inside SevaSetu', placeKind: 'online', notes: '' });
    s().completeSession(matchId);
    expect(s().matches[0].status).toBe('completed');

    const before = s().reflections.filter((r) => r.personId === 'p-aarav').length;
    s().addReflection({ matchId, taught: 'Patience matters', listenedWell: '', assumedQuickly: '', nextTime: '', qualities: ['Patience'] });
    expect(s().reflections.filter((r) => r.personId === 'p-aarav').length).toBe(before + 1);
  });

  it('keeps reflections private to their author', () => {
    s().login('p-aarav');
    s().addReflection({ taught: 'x', listenedWell: '', assumedQuickly: '', nextTime: '', qualities: [] });
    s().login('p-meera');
    const visibleToMeera = s().reflections.filter((r) => r.personId === s().userId);
    expect(visibleToMeera).toHaveLength(0);
  });

  it('routes a high-risk request to human review, not to volunteers', () => {
    s().login('p-meera');
    const r = s().publishRequest({ originalText: 'Please tutor my child at home', title: 'Tutoring', category: 'learning', outcome: '', language: 'English', mode: 'in-person', area: '', days: [], whenLabel: '', minutes: 60, accessibility: [], skillsNeeded: [], visibility: 'public' });
    expect(r.status).toBe('pending-review');
    expect(s().modItems.some((m) => m.kind === 'request' && m.status === 'open')).toBe(true);
  });

  it('cancelling reopens the request without penalty', () => {
    s().login('p-aarav');
    const id = s().acceptRequest('h-neha')!;
    s().cancelMatch(id, 'plans changed');
    expect(s().requests.find((r) => r.id === 'h-neha')?.status).toBe('open');
  });
});

describe('Journey B: transparent campaign', () => {
  it('flags a bill for human review and keeps history after moderation', () => {
    const entries = s().ledger.filter((l) => l.campaignId === 'c-lamps');
    const findings = analyzeBill(SAMPLE_BILLS.B, entries, []);
    const f = findings.find((x) => x.status === 'mismatch')!;
    s().login('p-aarav');
    s().applyBillFindings({ campaignId: 'c-lamps', entryId: f.matchedEntryId, status: f.status, why: f.detail, evidence: [], confidence: 'medium' });
    expect(s().ledger.find((l) => l.id === 'l-5')?.receipt).toBe('mismatch');
    const mod = s().modItems.find((m) => m.link?.ledgerId === 'l-5')!;

    s().login('p-kavya');
    s().resolveMod(mod.id, 'correct', 'Vendor added screen rental');
    const e = s().ledger.find((l) => l.id === 'l-5')!;
    expect(e.receipt).toBe('corrected');
    expect(e.note).toMatch(/screen rental/);
    expect(s().audit[0].action).toMatch(/Corrected transparently/);
  });

  it('pausing is a human action with visible status history', () => {
    s().login('p-kavya');
    const m = s().modItems.find((x) => x.link?.campaignId === 'c-lamps')!;
    s().resolveMod(m.id, 'pause', 'Waiting for second bill');
    const c = s().campaigns.find((x) => x.id === 'c-lamps')!;
    expect(c.status).toBe('under-review');
    expect(c.statusHistory.length).toBeGreaterThan(1);
  });

  it('teaching role needs orientation and organizer approval', () => {
    s().login('p-aarav');
    expect(s().joinCampaign('c-lamps', 'r-teach')).toBe('needs-training');
    s().completeTraining('r-teach');
    expect(s().joinCampaign('c-lamps', 'r-teach')).toBe('pending-approval');
    expect(s().joinCampaign('c-river', 'r-clean')).toBe('confirmed');
  });
});

describe('Journey C: everyday Daan', () => {
  it('goes from listing to reservation to receipt to closed with expired code', () => {
    s().login('p-aarav');
    const item = s().postItem({ title: 'Class 10 books', category: 'School books', description: 'Complete set', condition: 'Good', conditionConfirmed: false, age: '1 year', quantity: 3, area: 'Kothrud', pickup: 'drop-point', availability: 'Weekends', audience: 'organization', emoji: '📚' });
    const res = s().reserveItem(item.id, 'n-library', 'Campus library entrance');
    expect(res.code).toMatch(/^\d{4}$/);
    s().confirmReceipt(res.id, true, 'Thank you');
    expect(s().items.find((i) => i.id === item.id)?.status).toBe('handed-over');
    s().closeReservation(res.id);
    expect(s().reservations.find((r) => r.id === res.id)?.code).toBe('----');
  });
});

describe('Journey D: crisis routing is logged without content', () => {
  it('increments a counter only', () => {
    s().logCrisisRouting();
    expect(s().crisisRoutings).toBe(1);
  });
});

describe('privacy', () => {
  it('model training consent is off by default and exact contact is off', () => {
    expect(s().consents.find((c) => c.id === 'model-training')?.granted).toBe(false);
    expect(s().consents.find((c) => c.id === 'exact-contact')?.granted).toBe(false);
  });
  it('anonymous donations are recorded as anonymous on the public ledger', () => {
    s().donate('c-lamps', 500, true);
    const last = s().ledger[s().ledger.length - 1];
    expect(last.anonymous).toBe(true);
    expect(last.redacted).toBe(true);
  });
});
