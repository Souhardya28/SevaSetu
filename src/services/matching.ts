import type { Campaign, HelpRequest, ItemListing, ItemNeed, Person } from '@/types';

export interface MatchResult {
  score: number; // 0..1 ordering aid only. Never shown as a percentage.
  reasons: string[];
  eligible: boolean;
  blockedReason?: string;
}

const overlap = (a: string[], b: string[]) => a.filter((x) => b.some((y) => y.toLowerCase() === x.toLowerCase()));

/** Explainable, rule-based matching of a Sevak to a request. No hidden model. */
export function matchSevakToRequest(person: Person, req: HelpRequest): MatchResult {
  const reasons: string[] = [];
  let score = 0;

  if (person.id === req.requesterId) return { score: 0, reasons: [], eligible: false, blockedReason: 'This is your own request.' };

  if (req.risk === 'high') return { score: 0, reasons: [], eligible: false, blockedReason: 'High-risk requests go through a verified organization.' };
  if (req.risk === 'medium' && !person.verification.orientation) {
    return { score: 0, reasons: [], eligible: false, blockedReason: 'Complete the safety orientation to help in person.' };
  }

  const skill = overlap(req.skillsNeeded, person.skills);
  if (skill.length) { score += 0.4; reasons.push(`selected ${skill.join(', ')}`); }

  if (person.languages.some((l) => l.toLowerCase() === req.language.toLowerCase())) { score += 0.2; reasons.push(`speak ${req.language}`); }

  const dayHit = overlap(req.days, person.availability);
  if (dayHit.length) { score += 0.2; reasons.push(`are available ${niceJoin(dayHit.map((d) => (d === 'weekends' ? 'on weekends' : d === 'remote' ? 'for remote help' : d === 'weekdays' ? 'on weekdays' : `on ${cap(d)}`)))}`); }

  if (req.mode === 'remote') { score += 0.1; } else if (req.distanceKm <= 5) { score += 0.1; reasons.push(`live about ${req.distanceKm.toFixed(1)} km away`); }

  if (person.verification.identity === 'completed') score += 0.05;
  if (person.verification.orientation) score += 0.05;

  return { score: Math.min(score, 1), reasons, eligible: true };
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const niceJoin = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}` : xs[0]);

export function explainMatch(reasons: string[]): string {
  if (!reasons.length) return 'Shown because it is open to everyone in your circle. We could not find a specific match, so please judge for yourself.';
  const list = niceJoin(reasons);
  return `Recommended because you ${list}. This is a suggestion, not a guarantee.`;
}

/* ---------- Abhiyan recommendation ---------- */
export function recommendCampaign(person: Person, c: Campaign, dismissed: string[]): { score: number; reasons: string[] } | null {
  if (dismissed.includes(c.id)) return null;
  const reasons: string[] = [];
  let score = 0;
  const interest = overlap(c.interests, person.interests);
  if (interest.length) { score += 0.4; reasons.push(`you chose ${interest.join(' and ')} as interests`); }
  const skill = overlap(c.skillsNeeded, [...person.skills, ...person.languages]);
  if (skill.length) { score += 0.3; reasons.push(`your skills include ${skill.join(', ')}`); }
  if (c.distanceKm <= 5) { score += 0.15; reasons.push(`it is ${c.distanceKm.toFixed(1)} km away`); }
  if (c.roles.some((r) => r.risk === 'low')) score += 0.05;
  return { score, reasons };
}

/* ---------- Daan: donor item to expressed needs ---------- */
export function matchItemToNeeds(item: Pick<ItemListing, 'category' | 'title' | 'description'>, needs: ItemNeed[]): { need: ItemNeed; why: string }[] {
  const hay = `${item.title} ${item.description} ${item.category}`.toLowerCase();
  return needs
    .map((n) => {
      const catHit = n.category.toLowerCase() === item.category.toLowerCase();
      const kw = n.keywords.filter((k) => hay.includes(k));
      const score = (catHit ? 2 : 0) + kw.length;
      return { need: n, score, kw, catHit };
    })
    .filter((x) => x.score > 0 && x.catHit)
    .sort((a, b) => b.score - a.score || a.need.distanceKm - b.need.distanceKm)
    .map((x) => ({
      need: x.need,
      why: `${x.need.verified ? 'A verified request' : 'A request'} ${x.need.distanceKm.toFixed(1)} km away asks for ${item.category.toLowerCase()}${x.kw.length ? ` (${x.kw.slice(0, 2).join(', ')})` : ''}.`,
    }));
}

/* ---------- Category suggestion from an image label (demo vision stand-in) ---------- */
export function suggestCategoryFromLabel(label: string): { category: string; emoji: string; hint: string } {
  const l = label.toLowerCase();
  if (/book|textbook|class/.test(l)) return { category: 'School books', emoji: '📚', hint: 'Looks like books. Please confirm the class and subject.' };
  if (/cycle|bike|bicycle/.test(l)) return { category: 'Cycles', emoji: '🚲', hint: 'Looks like a cycle. Please check brakes and tyres in person.' };
  if (/bag/.test(l)) return { category: 'School bags', emoji: '🎒', hint: 'Looks like a bag. Please check zips and straps.' };
  if (/pen|pencil|notebook|stationery/.test(l)) return { category: 'Stationery', emoji: '✏️', hint: 'Looks like stationery.' };
  return { category: 'Other approved reusable goods', emoji: '📦', hint: 'We are not sure what this is. Please choose a category.' };
}
