import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { CampaignCard, ReflectionPrompt } from '@/components/domain';
import { AppHeader, Banner, Button, Card, Chip, EmptyState, Field, Row, Screen, SectionTitle, T, ToggleRow, soft } from '@/components/ui';
import { QUALITIES } from '@/services/path';
import { useApp, useMe, usePerson } from '@/store/useApp';
import type { Quality } from '@/types';

const TAGS = ['Patient', 'Respectful', 'Clear', 'Reliable', 'Good listener'];

export default function Complete() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const me = useMe();
  const match = useApp((s) => s.matches.find((m) => m.id === id));
  const req = useApp((s) => s.requests.find((r) => r.id === match?.requestId));
  const other = usePerson(match ? (match.sevakId === me?.id ? match.sahabhagiId : match.sevakId) : undefined);
  const submitFeedback = useApp((s) => s.submitFeedback);
  const addReflection = useApp((s) => s.addReflection);
  const sendPrasad = useApp((s) => s.sendPrasad);
  const campaign = useApp((s) => s.campaigns.find((c) => c.id === 'c-lamps'));
  const alreadyFeedback = useApp((s) => s.feedback.some((f) => f.matchId === id));

  const [f, setF] = useState({ arrived: true, respected: true, listened: true, boundaries: true, again: true });
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [prasad, setPrasad] = useState('');
  const [prasadSent, setPrasadSent] = useState(false);
  const [r, setR] = useState({ taught: '', listenedWell: '', assumedQuickly: '', nextTime: '' });
  const [q, setQ] = useState<Quality[]>([]);
  const [saved, setSaved] = useState<'feedback' | 'reflection' | null>(alreadyFeedback ? 'feedback' : null);

  if (!match || !me || !req) return <Screen header={<AppHeader title="Reflection" />}><EmptyState title="Nothing to reflect on yet" body="Complete a session first." /></Screen>;

  const isSevak = match.sevakId === me.id;

  if (saved) {
    return (
      <Screen header={<AppHeader title={saved === 'reflection' ? 'Added to your Seva Journal' : 'Thank you'} back={false} />}>
        <Banner tone="green" title={saved === 'reflection' ? 'Your reflection is saved, privately.' : 'Your feedback was recorded privately.'}>
          {saved === 'reflection' ? 'Only you can read it. You can delete any entry at any time. Your Seva Path continues quietly.' : 'It is never shown publicly. It only helps us keep sessions respectful.'}
        </Banner>
        {saved === 'reflection' && campaign && (
          <>
            <SectionTitle>If you would like to continue</SectionTitle>
            <T v="small">Because you helped with learning, this education Abhiyan may suit you. It is only a suggestion.</T>
            <CampaignCard c={campaign} why="Recommended because you helped with mathematics and chose Education as an interest." onPress={() => router.push('/abhiyan/c-lamps')} />
          </>
        )}
        {saved === 'reflection' && <Button label="Open Seva Journal" onPress={() => router.replace('/journal')} />}
        <Button label="Done" kind="secondary" onPress={() => router.replace('/(tabs)')} />
      </Screen>
    );
  }

  if (!isSevak) {
    const yn = (k: keyof typeof f, label: string) => <ToggleRow key={k} label={label} value={f[k]} onChange={(v) => setF({ ...f, [k]: v })} />;
    return (
      <Screen header={<AppHeader title="How did it feel?" subtitle="Private feedback" />}>
        <Banner tone="indigo">This is only about your experience. It is never public and never a star rating.</Banner>
        <Card>
          {yn('arrived', `Did ${other?.displayName ?? 'they'} arrive or respond as agreed?`)}
          {yn('respected', 'Did you feel respected?')}
          {yn('listened', 'Did they listen?')}
          {yn('boundaries', 'Were your boundaries respected?')}
          {yn('again', 'Would you feel comfortable matching again?')}
        </Card>
        <T v="label" color="ink">If you like, add words that describe them</T>
        <Row wrap>{TAGS.map((t) => <Chip key={t} label={t} selected={tags.includes(t)} onPress={() => setTags(tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t])} />)}</Row>
        <Field label="Private comment (optional)" value={comment} onChangeText={setComment} multiline />
        <Card tone="saffron">
          <T v="h3">A Prasad, only if you wish</T>
          <T v="small" color="ink">Later, you may send a short note or memory. It is entirely optional and private by default.</T>
          <Field label="Short note (optional)" value={prasad} onChangeText={setPrasad} multiline />
          {prasadSent && <Chip label="Prasad sent privately" tone="green" />}
        </Card>
        <Button label="Submit private feedback" onPress={() => {
          submitFeedback({ matchId: match.id, ...f, tags, comment });
          if (prasad.trim()) { sendPrasad(match.id, prasad.trim(), 'text'); setPrasadSent(true); }
          soft(); setSaved('feedback');
        }} />
        <Button label="Skip for now" kind="quiet" onPress={() => router.replace('/(tabs)')} />
      </Screen>
    );
  }

  return (
    <Screen header={<AppHeader title="What did they teach me?" subtitle="Private reflection" />}>
      <Banner tone="indigo">There is no score and no “success” here. This is a quiet look at what you noticed. Only you can see it.</Banner>
      <ReflectionPrompt label={`What did ${other?.displayName ?? 'this person'} or the situation teach you?`} value={r.taught} onChange={(v) => setR({ ...r, taught: v })} />
      <ReflectionPrompt label="Where did you listen well?" value={r.listenedWell} onChange={(v) => setR({ ...r, listenedWell: v })} />
      <ReflectionPrompt label="Where did you assume too quickly?" value={r.assumedQuickly} onChange={(v) => setR({ ...r, assumedQuickly: v })} />
      <ReflectionPrompt label="What will you do differently next time?" value={r.nextTime} onChange={(v) => setR({ ...r, nextTime: v })} />
      <T v="label" color="ink">Which quality did you practise?</T>
      <Row wrap>{QUALITIES.map((x) => <Chip key={x} label={x} selected={q.includes(x)} onPress={() => setQ(q.includes(x) ? q.filter((y) => y !== x) : [...q, x])} />)}</Row>
      <Button label="Save to my Seva Journal" disabled={r.taught.trim().length < 3} onPress={() => { addReflection({ matchId: match.id, ...r, qualities: q }); soft(); setSaved('reflection'); }} />
      <Button label="Not now" kind="quiet" onPress={() => router.replace('/(tabs)')} />
    </Screen>
  );
}
