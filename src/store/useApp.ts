import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  AUDIT, CAMPAIGNS, COMMITMENTS, ITEMS, LEDGER, MOD_ITEMS, NEEDS, NOTIFICATIONS, PEOPLE, PRASAD, REFLECTIONS, REQUESTS,
} from '@/data/seed';
import { assessRisk } from '@/services/safety';
import type {
  AppNotification, AuditEvent, Campaign, CampaignStatus, ChatMessage, Commitment, HelpRequest, ItemListing, ItemNeed,
  LedgerEntry, Match, MeetingPlan, ModItem, Person, Prasad, Reflection, Report, Reservation, RoleKey, SahabhagiFeedback,
  Visibility, Lang, ReceiptStatus,
} from '@/types';

export const uid = (p: string) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const now = () => new Date().toISOString();

export interface Settings {
  lang: Lang;
  reducedMotion: boolean;
  highContrast: boolean;
  offline: boolean;
  anonymousDefault: boolean;
}

export interface Join { id: string; campaignId: string; roleId: string; personId: string; status: 'confirmed' | 'needs-training' | 'pending-approval'; at: string }
export interface Consent { id: string; label: string; detail: string; granted: boolean; version: string; at: string; required?: boolean }
export interface PendingUpload { id: string; label: string; status: 'queued' | 'uploaded' | 'failed' }

export interface RequestDraft {
  originalText: string;
  step: number;
  updatedAt: string;
}

export interface NewRequestInput {
  originalText: string;
  title: string;
  category: HelpRequest['category'];
  outcome: string;
  language: string;
  mode: 'remote' | 'in-person';
  area: string;
  days: string[];
  whenLabel: string;
  minutes: number;
  accessibility: string[];
  skillsNeeded: string[];
  offer?: string;
  visibility: Visibility;
}

interface Data {
  hydrated: boolean;
  onboarded: boolean;
  userId: string | null;
  available: boolean;
  settings: Settings;
  people: Person[];
  requests: HelpRequest[];
  matches: Match[];
  messages: ChatMessage[];
  feedback: SahabhagiFeedback[];
  reflections: Reflection[];
  commitments: Commitment[];
  prasad: Prasad[];
  campaigns: Campaign[];
  ledger: LedgerEntry[];
  joins: Join[];
  dismissed: string[];
  trainings: string[];
  items: ItemListing[];
  needs: ItemNeed[];
  reservations: Reservation[];
  notifications: AppNotification[];
  reports: Report[];
  blocked: string[];
  trustedContact: string;
  modItems: ModItem[];
  audit: AuditEvent[];
  consents: Consent[];
  deletionRequested: boolean;
  draft: RequestDraft | null;
  uploads: PendingUpload[];
  lastSynced: string;
  crisisRoutings: number;
}

const DEFAULT_CONSENTS: Consent[] = [
  { id: 'terms', label: 'Code of Conduct and Accountability Pledge', detail: 'You have read and agreed to the pledge. This is not a substitute for safety checks.', granted: false, version: 'pledge-v1', at: '', required: true },
  { id: 'reflections-private', label: 'Keep my reflections private', detail: 'Reflections are visible only to you. Turning this off is not offered in this demo.', granted: true, version: 'privacy-v1', at: '', required: true },
  { id: 'ai-evidence', label: 'Let Seva Guide point to my own reflections', detail: 'Lets the guide say things like "you have mentioned listening often", citing your own entries.', granted: false, version: 'ai-v1', at: '' },
  { id: 'model-training', label: 'Use my reflections to improve models', detail: 'Off by default. Private reflections are never used for training without this separate opt-in.', granted: false, version: 'ai-v1', at: '' },
  { id: 'exact-contact', label: 'Share exact contact details after a match', detail: 'Off by default. Contact stays masked inside the app.', granted: false, version: 'privacy-v1', at: '' },
];

const initial = (): Data => ({
  hydrated: false, onboarded: false, userId: null, available: true,
  settings: { lang: 'en', reducedMotion: false, highContrast: false, offline: false, anonymousDefault: false },
  people: PEOPLE, requests: REQUESTS, matches: [], messages: [], feedback: [],
  reflections: REFLECTIONS, commitments: COMMITMENTS, prasad: PRASAD,
  campaigns: CAMPAIGNS, ledger: LEDGER, joins: [], dismissed: [], trainings: [],
  items: ITEMS, needs: NEEDS, reservations: [],
  notifications: NOTIFICATIONS, reports: [], blocked: [], trustedContact: '',
  modItems: MOD_ITEMS, audit: AUDIT, consents: DEFAULT_CONSENTS, deletionRequested: false,
  draft: null, uploads: [], lastSynced: now(), crisisRoutings: 0,
});

interface Actions {
  setHydrated: () => void;
  login: (personId: string) => void;
  signUp: (p: { name: string; roles: RoleKey[]; interests: string[]; availability: string[]; lang: Lang }) => void;
  logout: () => void;
  completeOnboarding: () => void;
  updateSettings: (s: Partial<Settings>) => void;
  setAvailable: (v: boolean) => void;
  advanceVerification: (step: 'phone' | 'college' | 'identity' | 'orientation') => void;

  saveDraft: (d: RequestDraft | null) => void;
  publishRequest: (input: NewRequestInput) => HelpRequest;
  acceptRequest: (requestId: string) => string | null;
  sendMessage: (matchId: string, text: string) => void;
  updatePlan: (matchId: string, plan: MeetingPlan) => void;
  setTrustedContact: (matchId: string | null, contact: string) => void;
  checkIn: (matchId: string) => void;
  checkOut: (matchId: string) => void;
  cancelMatch: (matchId: string, note: string) => void;
  rescheduleMatch: (matchId: string, when: string) => void;
  completeSession: (matchId: string) => void;
  submitFeedback: (f: SahabhagiFeedback) => void;
  addReflection: (r: Omit<Reflection, 'id' | 'at' | 'personId'>) => void;
  deleteReflection: (id: string) => void;
  addCommitment: (text: string) => void;
  toggleCommitment: (id: string) => void;
  sendPrasad: (matchId: string, text: string, kind: 'text' | 'voice') => void;
  openPrasad: (id: string) => void;
  reportPrasad: (id: string) => void;
  deletePrasad: (id: string) => void;

  joinCampaign: (campaignId: string, roleId: string) => Join['status'];
  dismissCampaign: (campaignId: string) => void;
  completeTraining: (id: string) => void;
  donate: (campaignId: string, amount: number, anonymous: boolean) => void;
  applyBillFindings: (p: { campaignId: string; entryId?: string; status: ReceiptStatus; why: string; evidence: string[]; confidence: ModItem['confidence'] }) => void;
  addCampaignUpdate: (campaignId: string, text: string, consent: boolean) => void;
  resolveMod: (id: string, action: 'approve' | 'request-info' | 'pause' | 'correct' | 'dismiss', note: string) => void;
  submitAppeal: (campaignId: string, text: string) => void;

  postItem: (i: Omit<ItemListing, 'id' | 'donorId' | 'createdAt' | 'status'>) => ItemListing;
  reserveItem: (itemId: string, needId: string, pickupPoint: string) => Reservation;
  confirmReceipt: (resId: string, conditionOk: boolean, thanks: string) => void;
  closeReservation: (resId: string) => void;
  confirmCondition: (itemId: string) => void;

  addReport: (r: Omit<Report, 'id' | 'at' | 'by' | 'status'>) => void;
  blockPerson: (id: string) => void;
  unblockPerson: (id: string) => void;
  markNotificationsRead: () => void;
  setConsent: (id: string, granted: boolean) => void;
  requestDeletion: () => void;
  logCrisisRouting: () => void;
  queueUpload: (label: string) => string;
  retryUploads: () => void;
  resetDemo: () => void;
}

export type AppState = Data & Actions;

const REPLIES = [
  'Thank you! That works for me.',
  'Sounds good. I will bring what I need.',
  'Yes, please. I would like to go at a gentle pace.',
];

export const useApp = create<AppState>()(
  persist(
    (set, get) => {
      const notify = (toId: string | undefined, title: string, body: string, href?: string) =>
        set((s) => ({ notifications: [{ id: uid('nt'), toId, at: now(), title, body, read: false, href }, ...s.notifications] }));
      const addAudit = (actor: string, action: string) => set((s) => ({ audit: [{ id: uid('a'), at: now(), actor, action }, ...s.audit] }));
      const sys = (matchId: string, text: string) =>
        set((s) => ({ messages: [...s.messages, { id: uid('m'), matchId, senderId: 'system', text, at: now() }] }));
      const meId = () => get().userId ?? '';

      return {
        ...initial(),
        setHydrated: () => set({ hydrated: true }),
        login: (personId) => set({ userId: personId, onboarded: true }),
        signUp: ({ name, roles, interests, availability, lang }) => {
          const id = 'p-me';
          const person: Person = {
            id, displayName: name || 'Friend', roles: roles.length ? roles : ['sevak'], languages: [lang === 'hi' ? 'Hindi' : 'English'],
            skills: [], interests, availability, area: 'Pune (approximate)', bio: 'New to SevaSetu.', trustTags: [],
            verification: { phone: false, college: false, identity: 'none', orientation: false, skills: [] }, fictional: true,
          };
          set((s) => ({ people: [...s.people.filter((p) => p.id !== id), person], userId: id, onboarded: true, settings: { ...s.settings, lang } }));
        },
        logout: () => set({ userId: null }),
        completeOnboarding: () => set({ onboarded: true }),
        updateSettings: (st) => set((s) => ({ settings: { ...s.settings, ...st } })),
        setAvailable: (v) => set({ available: v }),
        advanceVerification: (step) =>
          set((s) => ({
            people: s.people.map((p) =>
              p.id !== s.userId ? p : {
                ...p,
                verification: {
                  ...p.verification,
                  phone: step === 'phone' ? true : p.verification.phone,
                  college: step === 'college' ? true : p.verification.college,
                  identity: step === 'identity' ? (p.verification.identity === 'none' ? 'pending' : 'completed') : p.verification.identity,
                  orientation: step === 'orientation' ? true : p.verification.orientation,
                },
              },
            ),
          })),

        saveDraft: (d) => set({ draft: d }),

        publishRequest: (input) => {
          const risk = assessRisk({ text: `${input.originalText} ${input.title}`, mode: input.mode });
          const id = uid('h');
          const status: HelpRequest['status'] = risk.needsOrganization ? 'pending-review' : 'open';
          const req: HelpRequest = {
            id, requesterId: meId(), originalText: input.originalText, title: input.title,
            story: input.originalText, category: input.category, outcome: input.outcome, language: input.language, mode: input.mode,
            area: `${get().people.find((p) => p.id === meId())?.area ?? 'Pune'} (approximate)`, days: input.days, whenLabel: input.whenLabel, minutes: input.minutes,
            accessibility: input.accessibility, skillsNeeded: input.skillsNeeded, offer: input.offer, visibility: input.visibility,
            risk: risk.level, riskReasons: risk.reasons, status,
            boundaries: input.mode === 'remote' ? ['Conversation stays inside SevaSetu', 'No phone numbers shared unless I agree'] : ['Meet in a public or group place', 'Check-in and check-out in the app'],
            distanceKm: input.mode === 'remote' ? 0 : 1.4, urgency: 'normal', createdAt: now(),
          };
          set((s) => ({ requests: [req, ...s.requests], draft: null }));
          if (risk.needsOrganization) {
            set((s) => ({
              modItems: [{ id: uid('m'), kind: 'request', title: 'High-risk request needs organization approval', why: risk.reasons.join('. '), confidence: 'high', evidence: ['Detected from the request text', 'No verified organization linked'], recommended: 'Route to a verified organization with a trained role, or decline kindly.', status: 'open' }, ...s.modItems],
            }));
          } else {
            notify('p-aarav', 'A request may match your skills', `${input.title}. Open to see why it was suggested.`, `/sathi/${id}`);
          }
          return req;
        },

        acceptRequest: (requestId) => {
          const s = get();
          const req = s.requests.find((r) => r.id === requestId);
          if (!req || req.status !== 'open') return null;
          const matchId = uid('mt');
          const match: Match = {
            id: matchId, requestId, sevakId: meId(), sahabhagiId: req.requesterId, status: 'planning',
            plan: { when: req.whenLabel, mode: req.mode, place: req.mode === 'remote' ? 'Online call inside SevaSetu' : 'Community hall (daytime)', placeKind: req.mode === 'remote' ? 'online' : 'public', notes: '' },
            checkIn: {}, checkOut: {}, createdAt: now(), contactShared: false,
          };
          set((st) => ({
            matches: [match, ...st.matches],
            requests: st.requests.map((r) => (r.id === requestId ? { ...r, status: 'matched', matchId } : r)),
          }));
          sys(matchId, 'The bridge is formed. Contact details stay masked. Please agree a time and a public or online place to meet.');
          notify(req.requesterId, 'A Sevak would like to help', `${s.people.find((p) => p.id === meId())?.displayName ?? 'A Sevak'} accepted your request. Say hello when you are ready.`, `/sathi/room/${matchId}`);
          return matchId;
        },

        sendMessage: (matchId, text) => {
          const m = get().matches.find((x) => x.id === matchId);
          set((s) => ({ messages: [...s.messages, { id: uid('m'), matchId, senderId: meId(), text, at: now() }] }));
          if (m) {
            const other = m.sevakId === meId() ? m.sahabhagiId : m.sevakId;
            setTimeout(() => {
              const count = get().messages.filter((x) => x.matchId === matchId && x.senderId === other).length;
              set((s) => ({ messages: [...s.messages, { id: uid('m'), matchId, senderId: other, text: `${REPLIES[count % REPLIES.length]} (demo reply)`, at: now() }] }));
            }, 1200);
          }
        },
        updatePlan: (matchId, plan) => {
          set((s) => ({ matches: s.matches.map((m) => (m.id === matchId ? { ...m, plan, status: m.status === 'planning' ? 'scheduled' : m.status } : m)) }));
          sys(matchId, `Meeting plan saved: ${plan.when} at ${plan.place}.`);
        },
        setTrustedContact: (matchId, contact) => {
          set({ trustedContact: contact });
          if (matchId) sys(matchId, contact ? 'A trusted contact has been added (stored only on this device).' : 'Trusted contact removed.');
        },
        checkIn: (matchId) => {
          const m = get().matches.find((x) => x.id === matchId);
          if (!m) return;
          const role = m.sevakId === meId() ? 'sevak' : 'sahabhagi';
          const other = role === 'sevak' ? 'sahabhagi' : 'sevak';
          set((s) => ({ matches: s.matches.map((x) => (x.id === matchId ? { ...x, checkIn: { ...x.checkIn, [role]: now() } } : x)) }));
          sys(matchId, 'You checked in. Thank you.');
          setTimeout(() => {
            set((s) => ({ matches: s.matches.map((x) => (x.id === matchId ? { ...x, checkIn: { ...x.checkIn, [other]: now() } } : x)) }));
            sys(matchId, '(demo) The other person has checked in too.');
          }, 1000);
        },
        checkOut: (matchId) => {
          const m = get().matches.find((x) => x.id === matchId);
          if (!m) return;
          const role = m.sevakId === meId() ? 'sevak' : 'sahabhagi';
          const other = role === 'sevak' ? 'sahabhagi' : 'sevak';
          set((s) => ({ matches: s.matches.map((x) => (x.id === matchId ? { ...x, checkOut: { ...x.checkOut, [role]: now() } } : x)) }));
          sys(matchId, 'You checked out safely.');
          setTimeout(() => {
            set((s) => ({ matches: s.matches.map((x) => (x.id === matchId ? { ...x, checkOut: { ...x.checkOut, [other]: now() } } : x)) }));
            sys(matchId, '(demo) The other person has checked out too.');
          }, 1000);
        },
        cancelMatch: (matchId, note) => {
          const m = get().matches.find((x) => x.id === matchId);
          set((s) => ({
            matches: s.matches.map((x) => (x.id === matchId ? { ...x, status: 'cancelled', rescheduleNote: note } : x)),
            requests: s.requests.map((r) => (m && r.id === m.requestId ? { ...r, status: 'open', matchId: undefined } : r)),
          }));
          sys(matchId, 'This plan was cancelled kindly. Nothing is recorded publicly and no one is penalised.');
        },
        rescheduleMatch: (matchId, when) => {
          set((s) => ({ matches: s.matches.map((x) => (x.id === matchId ? { ...x, plan: { ...x.plan, when }, rescheduleNote: 'Rescheduled' } : x)) }));
          sys(matchId, `A new time was suggested: ${when}. No one is penalised for rescheduling responsibly.`);
        },
        completeSession: (matchId) => {
          const m = get().matches.find((x) => x.id === matchId);
          if (!m) return;
          set((s) => ({
            matches: s.matches.map((x) => (x.id === matchId ? { ...x, status: 'completed' } : x)),
            requests: s.requests.map((r) => (r.id === m.requestId ? { ...r, status: 'completed' } : r)),
          }));
          sys(matchId, 'Session marked complete. A private reflection and feedback are now open to each of you.');
          notify(m.sahabhagiId, 'How was the session?', 'Share private feedback whenever you are ready. It is never public.', `/sathi/complete/${matchId}`);
          notify(m.sevakId, 'A moment to reflect', 'What did this person teach you?', `/sathi/complete/${matchId}`);
        },
        submitFeedback: (f) => set((s) => ({ feedback: [...s.feedback.filter((x) => x.matchId !== f.matchId), f] })),
        addReflection: (r) =>
          set((s) => ({ reflections: [{ ...r, id: uid('rf'), personId: meId(), at: now() }, ...s.reflections] })),
        deleteReflection: (id) => set((s) => ({ reflections: s.reflections.filter((r) => r.id !== id) })),
        addCommitment: (text) => set((s) => ({ commitments: [{ id: uid('cm'), personId: meId(), text, at: now(), done: false }, ...s.commitments] })),
        toggleCommitment: (id) => set((s) => ({ commitments: s.commitments.map((c) => (c.id === id ? { ...c, done: !c.done } : c)) })),
        sendPrasad: (matchId, text, kind) => {
          const m = get().matches.find((x) => x.id === matchId);
          if (!m) return;
          set((s) => ({ prasad: [{ id: uid('pr'), toId: m.sevakId, fromLabel: 'A past act of service', kind, text, at: now(), opened: false }, ...s.prasad] }));
          notify(m.sevakId, 'A private Prasad has arrived', 'You received a private message from a past act of service.', '/prasad');
        },
        openPrasad: (id) => set((s) => ({ prasad: s.prasad.map((p) => (p.id === id ? { ...p, opened: true } : p)) })),
        reportPrasad: (id) => {
          set((s) => ({ prasad: s.prasad.map((p) => (p.id === id ? { ...p, reported: true } : p)) }));
          get().addReport({ targetType: 'Prasad', targetLabel: 'A Prasad message', reason: 'Made me uncomfortable', detail: '' });
        },
        deletePrasad: (id) => set((s) => ({ prasad: s.prasad.filter((p) => p.id !== id) })),

        joinCampaign: (campaignId, roleId) => {
          const s = get();
          const c = s.campaigns.find((x) => x.id === campaignId);
          const role = c?.roles.find((r) => r.id === roleId);
          const me = s.people.find((p) => p.id === meId());
          let status: Join['status'] = 'confirmed';
          if (role && (role.risk === 'high' || role.risk === 'medium')) {
            const trained = !role.training || s.trainings.includes(role.id) || (role.risk === 'medium' && !!me?.verification.orientation);
            status = !trained ? 'needs-training' : role.risk === 'high' ? 'pending-approval' : 'confirmed';
          }
          const join: Join = { id: uid('j'), campaignId, roleId, personId: meId(), status, at: now() };
          set((st) => ({
            joins: [...st.joins.filter((j) => !(j.campaignId === campaignId && j.roleId === roleId && j.personId === meId())), join],
            campaigns: st.campaigns.map((x) => (x.id === campaignId ? { ...x, roles: x.roles.map((r) => (r.id === roleId && status === 'confirmed' ? { ...r, filled: r.filled + 1 } : r)) } : x)),
          }));
          return status;
        },
        dismissCampaign: (id) => set((s) => ({ dismissed: [...s.dismissed, id] })),
        completeTraining: (id) => set((s) => ({ trainings: s.trainings.includes(id) ? s.trainings : [...s.trainings, id] })),
        donate: (campaignId, amount, anonymous) =>
          set((s) => ({
            ledger: [...s.ledger, { id: uid('l'), campaignId, date: now().slice(0, 10), kind: 'in', amount, category: 'Donations', purpose: 'Sandbox donation (no real money moved)', receipt: 'verified', human: 'n/a', redacted: true, anonymous }],
          })),
        applyBillFindings: ({ campaignId, entryId, status, why, evidence, confidence }) => {
          set((s) => ({
            ledger: s.ledger.map((e) => (e.id === entryId ? { ...e, receipt: status, human: 'pending', note: why } : e)),
            modItems: [{ id: uid('m'), kind: 'bill', title: `Bill needs review: ${s.campaigns.find((c) => c.id === campaignId)?.title ?? 'Campaign'}`, why, confidence, evidence, recommended: 'Ask the organizer to confirm and, if needed, attach the second bill. Do not assume wrongdoing.', status: 'open', link: { campaignId, ledgerId: entryId } }, ...s.modItems],
          }));
        },
        addCampaignUpdate: (campaignId, text, consent) =>
          set((s) => ({ campaigns: s.campaigns.map((c) => (c.id === campaignId ? { ...c, updates: [{ at: now().slice(0, 10), text, consentConfirmed: consent }, ...c.updates] } : c)) })),
        resolveMod: (id, action, note) => {
          const s = get();
          const item = s.modItems.find((m) => m.id === id);
          if (!item) return;
          const cid = item.link?.campaignId;
          const lid = item.link?.ledgerId;
          const resolution = { approve: 'Approved after review', 'request-info': 'Asked organizer for more information', pause: 'Campaign temporarily paused for review', correct: 'Corrected transparently', dismiss: 'Dismissed, no action needed' }[action];
          set((st) => {
            let ledger = st.ledger;
            let campaigns = st.campaigns;
            if (lid && action !== 'dismiss') {
              const receipt: ReceiptStatus = action === 'approve' ? 'verified' : action === 'correct' ? 'corrected' : 'missing';
              ledger = ledger.map((e) => (e.id === lid ? { ...e, receipt, human: action === 'request-info' ? 'pending' : 'reviewed', note: note || e.note } : e));
            }
            if (cid && action === 'pause') {
              const next: CampaignStatus = 'under-review';
              campaigns = campaigns.map((c) => (c.id === cid ? { ...c, status: next, statusHistory: [...c.statusHistory, { at: now().slice(0, 10), status: next, note: note || 'Paused pending documentation. A person made this decision.', by: 'Moderator' }] } : c));
            }
            if (cid && action === 'approve') {
              campaigns = campaigns.map((c) => (c.id === cid && c.status === 'under-review' ? { ...c, status: 'active', statusHistory: [...c.statusHistory, { at: now().slice(0, 10), status: 'active', note: note || 'Documentation received. Campaign resumed.', by: 'Moderator' }] } : c));
            }
            return { ledger, campaigns, modItems: st.modItems.map((m) => (m.id === id ? { ...m, status: 'resolved', resolution: `${resolution}${note ? `: ${note}` : ''}` } : m)) };
          });
          addAudit(s.people.find((p) => p.id === s.userId)?.displayName ?? 'Moderator', `${resolution} (${item.title})`);
        },
        submitAppeal: (campaignId, text) =>
          set((s) => ({ modItems: [{ id: uid('m'), kind: 'appeal', title: `Correction or appeal: ${s.campaigns.find((c) => c.id === campaignId)?.title}`, why: text, confidence: 'medium', evidence: ['Submitted by the organizer'], recommended: 'Review the new documents and resume if complete.', status: 'open', link: { campaignId } }, ...s.modItems] })),

        postItem: (i) => {
          const item: ItemListing = { ...i, id: uid('i'), donorId: meId(), createdAt: now(), status: 'available' };
          set((s) => ({ items: [item, ...s.items] }));
          return item;
        },
        reserveItem: (itemId, needId, pickupPoint) => {
          const res: Reservation = { id: uid('rs'), itemId, needId, pickupPoint, code: String(Math.floor(1000 + Math.random() * 9000)), status: 'reserved', at: now() };
          set((s) => ({ reservations: [res, ...s.reservations], items: s.items.map((i) => (i.id === itemId ? { ...i, status: 'reserved' } : i)) }));
          return res;
        },
        confirmReceipt: (resId, conditionOk, thanks) => {
          const r = get().reservations.find((x) => x.id === resId);
          set((s) => ({
            reservations: s.reservations.map((x) => (x.id === resId ? { ...x, status: 'received', conditionOk, thanks } : x)),
            items: s.items.map((i) => (r && i.id === r.itemId ? { ...i, status: 'handed-over' } : i)),
          }));
        },
        closeReservation: (resId) => {
          const r = get().reservations.find((x) => x.id === resId);
          set((s) => ({
            reservations: s.reservations.map((x) => (x.id === resId ? { ...x, status: 'closed', code: '----' } : x)),
            items: s.items.map((i) => (r && i.id === r.itemId ? { ...i, status: 'closed' } : i)),
          }));
        },
        confirmCondition: (itemId) => set((s) => ({ items: s.items.map((i) => (i.id === itemId ? { ...i, conditionConfirmed: true } : i)) })),

        addReport: (r) => set((s) => ({ reports: [{ ...r, id: uid('rp'), at: now(), by: meId(), status: 'received' }, ...s.reports], modItems: [{ id: uid('m'), kind: 'report', title: `Report: ${r.targetLabel}`, why: r.reason, confidence: 'medium', evidence: [r.detail || 'No extra detail given', 'Evidence preserved'], recommended: 'Review with care. Contact the reporter if they asked for follow-up.', status: 'open' }, ...s.modItems] })),
        blockPerson: (id) => set((s) => ({ blocked: s.blocked.includes(id) ? s.blocked : [...s.blocked, id] })),
        unblockPerson: (id) => set((s) => ({ blocked: s.blocked.filter((b) => b !== id) })),
        markNotificationsRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
        setConsent: (id, granted) => set((s) => ({ consents: s.consents.map((c) => (c.id === id ? { ...c, granted, at: now() } : c)) })),
        requestDeletion: () => { set({ deletionRequested: true }); addAudit('System', 'Account deletion requested, 30-day window started'); },
        logCrisisRouting: () => set((s) => ({ crisisRoutings: s.crisisRoutings + 1 })),
        queueUpload: (label) => {
          const id = uid('up');
          const offline = get().settings.offline;
          set((s) => ({ uploads: [{ id, label, status: offline ? 'queued' : 'uploaded' }, ...s.uploads] }));
          return id;
        },
        retryUploads: () => set((s) => ({ uploads: s.uploads.map((u) => (u.status !== 'uploaded' ? { ...u, status: 'uploaded' } : u)), lastSynced: now() })),
        resetDemo: () => set({ ...initial(), hydrated: true }),
      };
    },
    {
      name: 'sevasetu-v1',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => { state?.setHydrated(); },
      partialize: (s) => {
        const { hydrated: _h, ...rest } = s;
        const data: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(rest)) if (typeof v !== 'function') data[k] = v;
        return data as unknown as AppState;
      },
    },
  ),
);

export const useMe = (): Person | undefined => useApp((s) => s.people.find((p) => p.id === s.userId));
export const usePerson = (id?: string): Person | undefined => useApp((s) => s.people.find((p) => p.id === id));
