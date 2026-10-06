export type RoleKey = 'sevak' | 'sahabhagi' | 'organization' | 'anchor' | 'donor' | 'moderator';
export type Risk = 'low' | 'medium' | 'high' | 'prohibited';
export type Visibility = 'private' | 'circle' | 'public';
export type Lang = 'en' | 'hi';

export interface Verification {
  phone: boolean;
  college: boolean;
  identity: 'none' | 'pending' | 'completed';
  orientation: boolean;
  skills: string[];
}

export interface Person {
  id: string;
  displayName: string;
  roles: RoleKey[];
  languages: string[];
  skills: string[];
  interests: string[];
  availability: string[];
  area: string;
  bio: string;
  affiliation?: string;
  trustTags: string[];
  verification: Verification;
  anchorVerified?: boolean;
  fictional: true;
}

export type HelpCategory =
  | 'daily' | 'technical' | 'learning' | 'listening' | 'accessibility' | 'forms' | 'remote' | 'nearby';

export interface HelpRequest {
  id: string;
  requesterId: string;
  originalText: string;
  title: string;
  story: string;
  category: HelpCategory;
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
  risk: Risk;
  riskReasons: string[];
  status: 'open' | 'matched' | 'completed' | 'pending-review' | 'cancelled';
  boundaries: string[];
  distanceKm: number;
  urgency: 'low' | 'normal' | 'soon';
  createdAt: string;
  matchId?: string;
}

export interface MeetingPlan {
  when: string;
  mode: 'remote' | 'in-person';
  place: string;
  placeKind: 'public' | 'campus' | 'online' | 'other';
  notes: string;
}

export interface ChatMessage {
  id: string;
  matchId: string;
  senderId: string; // 'system' for system notes
  text: string;
  at: string;
}

export interface Match {
  id: string;
  requestId: string;
  sevakId: string;
  sahabhagiId: string;
  status: 'planning' | 'scheduled' | 'completed' | 'cancelled';
  plan: MeetingPlan;
  checkIn: { sevak?: string; sahabhagi?: string };
  checkOut: { sevak?: string; sahabhagi?: string };
  trustedContact?: string;
  rescheduleNote?: string;
  createdAt: string;
  contactShared: boolean;
}

export interface SahabhagiFeedback {
  matchId: string;
  arrived: boolean;
  respected: boolean;
  listened: boolean;
  boundaries: boolean;
  again: boolean;
  tags: string[];
  comment: string;
}

export type Quality = 'Patience' | 'Humility' | 'Steadiness' | 'Courage' | 'Listening' | 'Teamwork';

export interface Reflection {
  id: string;
  personId: string;
  matchId?: string;
  at: string;
  taught: string;
  listenedWell: string;
  assumedQuickly: string;
  nextTime: string;
  qualities: Quality[];
}

export interface Commitment {
  id: string;
  personId: string;
  text: string;
  at: string;
  done: boolean;
}

export interface Prasad {
  id: string;
  toId: string;
  fromLabel: string;
  kind: 'text' | 'voice';
  text: string;
  at: string;
  opened: boolean;
  reported?: boolean;
}

export type ReceiptStatus = 'verified' | 'pending' | 'missing' | 'duplicate' | 'mismatch' | 'corrected';

export interface LedgerEntry {
  id: string;
  campaignId: string;
  date: string;
  kind: 'in' | 'out';
  amount: number;
  category: string;
  purpose: string;
  vendor?: string;
  receipt: ReceiptStatus;
  human: 'reviewed' | 'pending' | 'n/a';
  redacted: boolean;
  anonymous?: boolean;
  note?: string;
}

export interface BudgetLine { label: string; planned: number }
export interface CampaignRole { id: string; title: string; slots: number; filled: number; training?: string; risk: Risk }
export type CampaignStatus = 'active' | 'paused' | 'completed' | 'under-review';
export interface StatusEvent { at: string; status: CampaignStatus; note: string; by: string }

export interface Campaign {
  id: string;
  title: string;
  category: string;
  orgId: string;
  story: string;
  objective: string;
  area: string;
  distanceKm: number;
  timeline: string;
  commitment: string;
  skillsNeeded: string[];
  interests: string[];
  roles: CampaignRole[];
  budget: BudgetLine[];
  goal?: number;
  status: CampaignStatus;
  statusHistory: StatusEvent[];
  updates: { at: string; text: string; consentConfirmed: boolean }[];
  externalBooking?: boolean;
  fictional: true;
}

export interface Organization {
  id: string;
  name: string;
  kind: string;
  verifiedOn: string;
  dossier: { label: string; status: 'verified' | 'pending' }[];
  contactLabel: string;
}

export interface ItemListing {
  id: string;
  donorId: string;
  title: string;
  category: string;
  description: string;
  condition: 'Like new' | 'Good' | 'Worn but usable';
  conditionConfirmed: boolean;
  age: string;
  quantity: number;
  area: string;
  pickup: 'pickup' | 'drop-point' | 'partner';
  availability: string;
  audience: 'organization' | 'individual';
  status: 'available' | 'reserved' | 'handed-over' | 'closed';
  emoji: string;
  createdAt: string;
}

export interface ItemNeed {
  id: string;
  requesterLabel: string;
  verified: boolean;
  org: boolean;
  category: string;
  text: string;
  area: string;
  distanceKm: number;
  keywords: string[];
}

export interface Reservation {
  id: string;
  itemId: string;
  needId: string;
  pickupPoint: string;
  code: string;
  status: 'reserved' | 'received' | 'closed';
  conditionOk?: boolean;
  thanks?: string;
  at: string;
}

export interface AppNotification {
  id: string;
  at: string;
  toId?: string;
  title: string;
  body: string;
  read: boolean;
  href?: string;
}

export interface Report {
  id: string;
  at: string;
  by: string;
  targetType: string;
  targetLabel: string;
  reason: string;
  detail: string;
  status: 'received' | 'in-review' | 'resolved';
}

export type ModKind =
  | 'profile' | 'organization' | 'request' | 'message' | 'report' | 'campaign' | 'bill' | 'consent' | 'appeal' | 'crisis';

export interface ModItem {
  id: string;
  kind: ModKind;
  title: string;
  why: string;
  confidence: 'low' | 'medium' | 'high';
  evidence: string[];
  recommended: string;
  status: 'open' | 'resolved';
  resolution?: string;
  link?: { campaignId?: string; ledgerId?: string };
}

export interface AuditEvent { id: string; at: string; actor: string; action: string }

export interface Passage {
  id: string;
  work: string;
  chapter: string;
  location: string;
  text: string;
  kind: 'direct-quote' | 'paraphrase';
  tags: string[];
  editorialStatus: 'demo-pending-verification';
}
