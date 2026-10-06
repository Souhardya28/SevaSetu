export interface ToneIssue {
  matched: string;
  why: string;
  suggestion: string;
  kind: 'superior' | 'humiliating' | 'unsafe';
}

interface Rule { re: RegExp; why: string; suggestion: (m: string) => string; kind: ToneIssue['kind'] }

const RULES: Rule[] = [
  {
    re: /\b(poor|needy|helpless|miserable|unfortunate)\s+(woman|man|person|people|family|child|boy|girl|lady|old)\b/i,
    kind: 'superior',
    why: 'Describing someone by their hardship can sound like pity rather than respect.',
    suggestion: () => 'I would like to support Sunita-ji with the requested task.',
  },
  {
    re: /\b(save|rescue)\s+(them|him|her|these people|the poor)\b/i, kind: 'superior',
    why: 'Words like "save" place you above the person. Service is shared.',
    suggestion: () => 'I would like to work alongside you on this.',
  },
  {
    re: /\b(i am a hero|i will fix|i'll fix|let me fix your|you should be grateful|be thankful)\b/i, kind: 'superior',
    why: 'This may sound like you expect gratitude or know best.',
    suggestion: () => 'Tell me how you would like this to go. I am happy to follow your lead.',
  },
  {
    re: /\b(uneducated|ignorant|illiterate|stupid|dumb|backward)\b/i, kind: 'humiliating',
    why: 'This could feel humiliating. Describe the task instead of the person.',
    suggestion: () => 'I can explain this step by step at whatever pace suits you.',
  },
  {
    re: /\b(your number|your phone number|whatsapp me|call me on|text me on|meet at your home alone|come alone|don'?t tell anyone)\b/i, kind: 'unsafe',
    why: 'Moving to private channels or meeting alone reduces safety for both of you.',
    suggestion: () => 'Could we keep chatting here for now and plan a public place to meet?',
  },
];

export function checkTone(text: string): ToneIssue[] {
  const issues: ToneIssue[] = [];
  for (const r of RULES) {
    const m = text.match(r.re);
    if (m) issues.push({ matched: m[0], why: r.why, suggestion: r.suggestion(m[0]), kind: r.kind });
  }
  return issues;
}

export const RESPECTFUL_OPENINGS = [
  'Namaste! Thank you for letting me help. How would you like to begin?',
  'Hello, I read your request and would be glad to support you. What is a good time for you?',
];
