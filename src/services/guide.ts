import { PASSAGES } from '@/data/seed';
import { crisisFor } from '@/constants/crisis';
import { detectCrisis } from '@/services/safety';
import type { Passage } from '@/types';

export type GuideMode = 'discover' | 'prepare' | 'reflect' | 'learn' | 'support';

export const MODE_INFO: Record<GuideMode, { label: string; blurb: string; starter: string }> = {
  discover: { label: 'Discover', blurb: 'Find an opportunity that fits you', starter: 'I have a free Saturday. What could I do?' },
  prepare: { label: 'Prepare', blurb: 'Boundaries, etiquette and training', starter: 'How should I prepare for my first session?' },
  reflect: { label: 'Reflect', blurb: 'Think back on a session, without scoring', starter: 'Help me reflect on today.' },
  learn: { label: 'Learn', blurb: 'Source-labelled teachings', starter: 'What did Vivekananda say about giving?' },
  support: { label: 'Support', blurb: 'Gentle, non-clinical conversation', starter: 'I am feeling unmotivated.' },
};

export interface Retrieval { passage: Passage | null; confidence: number }

const STOP = new Set(['the', 'a', 'an', 'is', 'am', 'are', 'i', 'me', 'my', 'to', 'of', 'and', 'in', 'on', 'what', 'did', 'say', 'about', 'how', 'do', 'feel', 'feeling', 'very', 'so']);

/** Keyword retrieval over curated passages. A real build swaps this for pgvector + embeddings. */
export function retrieve(query: string): Retrieval {
  const words = query.toLowerCase().replace(/[^a-zऀ-ॿ\s]/g, ' ').split(/\s+/).filter((w) => w && !STOP.has(w));
  let best: Passage | null = null;
  let bestScore = 0;
  for (const p of PASSAGES) {
    const hay = `${p.tags.join(' ')} ${p.text}`.toLowerCase();
    let s = 0;
    for (const w of words) {
      if (p.tags.includes(w)) s += 2;
      else if (w.length > 3 && hay.includes(w)) s += 1;
    }
    if (s > bestScore) { bestScore = s; best = p; }
  }
  const confidence = Math.min(bestScore / 4, 1);
  return confidence >= 0.5 ? { passage: best, confidence } : { passage: null, confidence };
}

export type Topic = 'unmotivated' | 'sad' | 'anxious' | 'lonely' | 'pride' | 'other';

const EMOTIONAL: [RegExp, Topic][] = [
  [/(unmotivat|no motivation|lazy|can'?t start|stuck|tired of|burn(t|ed) out|meaningless|pointless|no energy)/i, 'unmotivated'],
  [/(sad|down|low|cry|hopeless|empty)/i, 'sad'],
  [/(anxious|anxiety|nervous|worried|scared|overwhelm|stress)/i, 'anxious'],
  [/(lonely|alone|no friends|isolated)/i, 'lonely'],
  [/(i helped|i am better|they are lucky|superior|they need me)/i, 'pride'],
];

export function detectTopic(text: string): Topic {
  for (const [re, t] of EMOTIONAL) if (re.test(text)) return t;
  return 'other';
}

export interface GuideReply {
  kind: 'text' | 'ask' | 'teaching' | 'crisis' | 'not-found';
  text: string;
  passage?: Passage;
  choices?: { id: string; label: string }[];
  action?: { label: string; href: string };
  resources?: ReturnType<typeof crisisFor>['resources'];
}

export const SUPPORT_CHOICES = [
  { id: 'listen', label: 'Just listen' },
  { id: 'teaching', label: 'Share a teaching' },
  { id: 'step', label: 'Suggest a small step' },
  { id: 'human', label: 'Connect me to a person' },
];

export function crisisReply(): GuideReply {
  const c = crisisFor();
  return {
    kind: 'crisis',
    text:
      'I am really sorry you are going through this, and I am glad you said it out loud. Your safety matters more than anything else right now. I am an AI guide and cannot give crisis care, so please reach out to someone who can. If you are in immediate danger, call the emergency number now. If you can, tell a person you trust where you are and how you feel.',
    resources: c.resources,
  };
}

const ACK: Record<Topic, string> = {
  unmotivated: 'That sounds heavy. Feeling unmotivated is common, and it does not mean something is wrong with you.',
  sad: 'I am sorry you are feeling low. Thank you for telling me.',
  anxious: 'That sounds stressful. It makes sense to feel that way.',
  lonely: 'Feeling alone is hard. I am glad you reached out.',
  pride: 'Thank you for sharing that honestly. It is a good thing to notice.',
  other: 'Thank you for sharing that.',
};

export function emotionalOpening(topic: Topic): GuideReply {
  return { kind: 'ask', text: `${ACK[topic]} What kind of support would help most right now?`, choices: SUPPORT_CHOICES };
}

export function followUp(choice: string, topic: Topic, original: string): GuideReply {
  if (choice === 'listen') {
    return { kind: 'text', text: 'I am here. Take your time and say as much or as little as you like. What has been the hardest part?' };
  }
  if (choice === 'teaching') {
    const r = retrieve(`${topic} ${original}`);
    if (r.passage) {
      return {
        kind: 'teaching',
        text: r.passage.kind === 'direct-quote'
          ? 'One line that some people find helpful. Take it or leave it:'
          : 'Here is a summary of a teaching, in my own words, not a quotation:',
        passage: r.passage,
      };
    }
    return notFound();
  }
  if (choice === 'step') {
    return {
      kind: 'text',
      text: 'Here is one very small, optional step: a low-pressure opportunity with no commitment beyond a single morning. You can say no, and nothing changes.',
      action: { label: 'See a gentle opportunity', href: '/abhiyan/c-river' },
    };
  }
  if (choice === 'human') {
    const c = crisisFor();
    return {
      kind: 'text',
      text: 'Talking to a real person can help. You could reach out to a friend or family member, your college counsellor, or a helpline. Tele-MANAS is a free government service. SevaSetu peer listening is companionship, not therapy or crisis care.',
      resources: c.resources.filter((r) => r.id === 'in-telemanas' || r.id === 'in-emergency'),
    };
  }
  return { kind: 'text', text: 'I am here whenever you want to continue.' };
}

function notFound(): GuideReply {
  return {
    kind: 'not-found',
    text: 'I could not find a verified passage that fits this. I will not invent a quotation. Would you like a plain-language suggestion instead, or to try different words?',
  };
}

export function respond(mode: GuideMode, text: string): GuideReply {
  if (detectCrisis(text)) return crisisReply();
  const topic = detectTopic(text);
  if (mode === 'support' || (topic !== 'other' && mode !== 'learn')) return emotionalOpening(topic);

  if (mode === 'learn') {
    const r = retrieve(text);
    if (r.passage) {
      return {
        kind: 'teaching',
        text: r.passage.kind === 'direct-quote' ? 'Here is a passage that fits your question:' : 'Here is a short summary, not a direct quotation:',
        passage: r.passage,
      };
    }
    return notFound();
  }
  if (mode === 'discover') {
    return {
      kind: 'text',
      text: 'With a free Saturday, a few gentle options are nearby. The riverbank clean-up needs no experience, or if you enjoy teaching, Evening Learning Lamps would welcome you after a short orientation.',
      action: { label: 'Browse Abhiyan', href: '/(tabs)/abhiyan' },
    };
  }
  if (mode === 'prepare') {
    return {
      kind: 'text',
      text: 'Three things before you meet: 1) meet in a public or group place, 2) ask how the person would like to be helped before offering advice, 3) check in and out in the app. You are not expected to give medical, legal or financial advice.',
      action: { label: 'Read the Code of Conduct', href: '/safety' },
    };
  }
  return {
    kind: 'text',
    text: 'Let us look back gently. What did the person or situation teach you today? There is no score. Only what you noticed.',
    action: { label: 'Open Seva Journal', href: '/journal' },
  };
}
