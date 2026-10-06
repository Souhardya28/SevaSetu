import type { HelpCategory } from '@/types';

export interface StructuredNeed {
  category: HelpCategory;
  title: string;
  outcome: string;
  language: string;
  mode: 'remote' | 'in-person';
  days: string[];
  whenLabel: string;
  accessibility: string[];
  skillsNeeded: string[];
  minutes: number;
  confidence: 'low' | 'medium' | 'high';
  notes: string[];
}

const CATEGORY_RULES: { re: RegExp; cat: HelpCategory; title: string; outcome: string; skills: string[] }[] = [
  { re: /(algebra|maths?|mathematics|calculus|equation|geometry|trigonometry)/i, cat: 'learning', title: 'Help understanding mathematics', outcome: 'Feel confident with the topic and the next test.', skills: ['mathematics'] },
  { re: /(resume|cv\b|cover letter|job application)/i, cat: 'remote', title: 'Resume review', outcome: 'A resume you feel confident sending.', skills: ['resume review'] },
  { re: /(phone|smartphone|whatsapp|laptop|wifi|app\b|email|setup|set up|bill message|digital)/i, cat: 'technical', title: 'Help with a phone or digital task', outcome: 'Be able to do the task yourself next time.', skills: ['digital literacy'] },
  { re: /(form|notice|document|application form|scholarship|letter|bijli|bill)/i, cat: 'forms', title: 'Help understanding a form or notice', outcome: 'Understand what it asks and what to do next.', skills: ['digital literacy'] },
  { re: /(english|speaking|practice|conversation|language)/i, cat: 'learning', title: 'Language practice', outcome: 'More ease speaking in everyday and interview settings.', skills: ['spoken english practice'] },
  { re: /(lonely|talk to someone|listen|someone to talk|vent)/i, cat: 'listening', title: 'Someone to listen', outcome: 'Feel heard.', skills: ['listening'] },
  { re: /(wheelchair|blind|low vision|hearing|deaf|accessib)/i, cat: 'accessibility', title: 'Accessibility support', outcome: 'Complete the task in a way that works for you.', skills: [] },
  { re: /(groceries|carry|errand|accompany|take me to)/i, cat: 'nearby', title: 'Everyday help nearby', outcome: 'Get the task done comfortably.', skills: [] },
];

const DAY_WORDS: [RegExp, string, string][] = [
  [/saturday|shanivar|शनिवार/i, 'saturday', 'Saturday'],
  [/sunday|ravivar|रविवार/i, 'sunday', 'Sunday'],
  [/weekend/i, 'weekends', 'Weekends'],
  [/evening|shaam|शाम/i, 'evenings', 'Evenings'],
  [/weekday/i, 'weekdays', 'Weekdays'],
];

export function structureNeed(text: string): StructuredNeed {
  const t = text.trim();
  const rule = CATEGORY_RULES.find((r) => r.re.test(t));
  const hasDevanagari = /[ऀ-ॿ]/.test(t);
  const hinglish = /\b(mujhe|nahi|karni|hai|samajh|chahiye|dhire|koi)\b/i.test(t);
  const language = hasDevanagari || hinglish ? 'Hindi' : 'English';
  const remote = /(online|remote|video call|phone call|on call|zoom|meet link)/i.test(t);
  const inPerson = /(come to|in person|at home|at my|accompany|take me|ghar|visit)/i.test(t);
  const mode: 'remote' | 'in-person' = inPerson && !remote ? 'in-person' : 'remote';
  const days: string[] = [];
  const labels: string[] = [];
  for (const [re, key, label] of DAY_WORDS) if (re.test(t)) { days.push(key); labels.push(label); }
  const accessibility: string[] = [];
  if (/(slow|dhire|धीरे)/i.test(t)) accessibility.push('Speak slowly');
  if (/(large print|big text|low vision)/i.test(t)) accessibility.push('Large print');
  if (/(hindi|हिंदी)/i.test(t) && language !== 'Hindi') accessibility.push('Hindi preferred');
  const durationMatch = t.match(/(\d+)\s*(min|minutes|hour|hours|hr)/i);
  const minutes = durationMatch ? (/h/i.test(durationMatch[2]) ? Number(durationMatch[1]) * 60 : Number(durationMatch[1])) : /half an hour/i.test(t) ? 30 : /(an|one|1) hour/i.test(t) ? 60 : 45;

  const notes: string[] = [];
  if (!rule) notes.push('We could not tell the kind of help. Please choose a category.');
  if (!labels.length) notes.push('No time mentioned. Please add when you are free.');
  if (!inPerson && !remote) notes.push('Assumed remote help. Change this if you prefer to meet in person.');

  return {
    category: rule?.cat ?? 'daily',
    title: rule?.title ?? 'Everyday help',
    outcome: rule?.outcome ?? 'Get the task done comfortably.',
    language,
    mode,
    days: days.length ? days : ['weekends'],
    whenLabel: labels.length ? labels.join(' / ') : 'To be decided together',
    accessibility,
    skillsNeeded: rule?.skills ?? [],
    minutes,
    confidence: rule && labels.length ? 'high' : rule ? 'medium' : 'low',
    notes,
  };
}

export const DEMO_TRANSCRIPT =
  'I am finding algebra difficult and my test is coming up. I would like someone patient to explain it, maybe online on Saturday evening for about an hour.';

export const CATEGORY_LABEL: Record<HelpCategory, string> = {
  daily: 'Daily help', technical: 'Technical help', learning: 'Learning help', listening: 'Peer listening',
  accessibility: 'Accessibility support', forms: 'Forms & documents', remote: 'Remote help', nearby: 'Nearby help',
};
