import type { HelpRequest, Risk } from '@/types';

export interface RiskAssessment {
  level: Risk;
  reasons: string[];
  needsOrganization: boolean;
  requirements: string[];
}

const HIGH_PATTERNS: [RegExp, string][] = [
  [/\b(child|children|kid|kids|minor|minors|bachcha|bachche|class [1-9]\b|primary school)\b/i, 'Work involving minors needs a verified organization and trained role'],
  [/\b(suicid|self[- ]harm|abuse|abused|assault|violence|crisis|panic attack|depress)/i, 'Mental-health crisis or abuse-related situation'],
  [/\b(medicine|medical|injection|dialysis|surgery|wound|dose|dawai)\b/i, 'Medical activity must be handled by licensed professionals'],
  [/\b(loan|bank account|atm|pin number|cash handover|hold (my )?money|upi pin|password)\b/i, 'Financial custody is not allowed through person-to-person help'],
];

const MEDIUM_PATTERNS: [RegExp, string][] = [
  [/\b(my home|at home|my house|come to my|ghar)\b/i, 'Meeting at a private home'],
  [/\b(accompany|escort|take me to|hospital visit|walk me)\b/i, 'Accompanying an adult'],
  [/\b(pickup|pick up|collect from)\b/i, 'Home pickup'],
];

export function assessRisk(input: { text: string; mode: 'remote' | 'in-person' }): RiskAssessment {
  const reasons: string[] = [];
  let level: Risk = 'low';
  for (const [re, why] of HIGH_PATTERNS) if (re.test(input.text)) { reasons.push(why); level = 'high'; }
  if (level !== 'high') {
    for (const [re, why] of MEDIUM_PATTERNS) if (re.test(input.text)) { reasons.push(why); level = 'medium'; }
    if (level === 'low' && input.mode === 'in-person') { reasons.push('In-person help'); level = 'medium'; }
  }
  const requirements =
    level === 'high'
      ? ['Verified organization', 'Trained role', 'Human approval', 'Supervision']
      : level === 'medium'
        ? ['Meet in a public or group location', 'Check-in and check-out', 'Optional trusted contact']
        : ['Standard Code of Conduct'];
  return { level, reasons, needsOrganization: level === 'high', requirements };
}

export const riskLabel: Record<Risk, string> = {
  low: 'Low risk', medium: 'Medium risk', high: 'High risk', prohibited: 'Not allowed',
};

/* ---------- Daan prohibited items ---------- */
const PROHIBITED_ITEMS: [RegExp, string][] = [
  [/\b(medicine|tablet|syrup|capsule|injection|dawai)\b/i, 'Medicines'],
  [/\b(open food|cooked food|leftover|opened packet|opened)\b.*\b(food|packet)\b|\bcooked food\b|\bleftovers?\b/i, 'Open or cooked food'],
  [/\b(gun|knife|weapon|pistol|sword|firecracker)\b/i, 'Weapons'],
  [/\b(counterfeit|fake brand|replica)\b/i, 'Counterfeit goods'],
  [/\b(recalled|recall notice)\b/i, 'Recalled products'],
  [/\b(exposed wire|faulty wiring|damaged charger|frayed cable|swollen battery|sparking)\b/i, 'Unsafe electrical goods'],
  [/\b(licen[cs]e required|arms|liquor|alcohol|tobacco)\b/i, 'Items requiring licences'],
  [/\b(underwear|innerwear|used bra|lingerie)\b/i, 'Intimate personal items'],
];

export function checkProhibitedItem(text: string): string | null {
  for (const [re, label] of PROHIBITED_ITEMS) if (re.test(text)) return label;
  return null;
}

/* ---------- Crisis detection (conservative, errs toward routing to help) ---------- */
const CRISIS_PATTERNS: RegExp[] = [
  /\b(kill myself|end my life|want to die|suicide|suicidal|self[- ]harm|hurt myself|cut myself|no reason to live|better off dead|end it all)\b/i,
  /\b(being abused|he hits me|she hits me|beats me|sexually assaulted|raped|in danger right now|unsafe at home)\b/i,
  /(आत्महत्या|मर जाना चाहता|मर जाना चाहती|जान दे|खुद को नुकसान|जीना नहीं चाहता|जीना नहीं चाहती)/,
  /\b(marna chahta|marna chahti|jaan de dunga|jaan de dungi|jeena nahi chahta|jeena nahi chahti)\b/i,
];

export function detectCrisis(text: string): boolean {
  return CRISIS_PATTERNS.some((re) => re.test(text));
}

export function summarizeRequestRisk(r: Pick<HelpRequest, 'risk'>): string {
  return riskLabel[r.risk];
}
