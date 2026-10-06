import { router } from 'expo-router';
import { Lock } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { GrowthTheme } from '@/components/domain';
import { AppHeader, Banner, Button, Card, Chip, ConfirmationSheet, EmptyState, Field, Row, Screen, SectionTitle, T } from '@/components/ui';
import { fmtDate } from '@/lib/derive';
import { gentleObservation, growthThemes, QUALITIES } from '@/services/path';
import { useApp, useMe } from '@/store/useApp';
import type { Quality } from '@/types';

export default function Journal() {
  const me = useMe();
  const all = useApp((s) => s.reflections);
  const commitments = useApp((s) => s.commitments);
  const prasad = useApp((s) => s.prasad);
  const evidenceConsent = useApp((s) => s.consents.find((c) => c.id === 'ai-evidence')?.granted);
  const del = useApp((s) => s.deleteReflection);
  const add = useApp((s) => s.addCommitment);
  const toggle = useApp((s) => s.toggleCommitment);
  const [filter, setFilter] = useState<Quality | 'all'>('all');
  const [q, setQ] = useState('');
  const [askDel, setAskDel] = useState<string | null>(null);
  const [newC, setNewC] = useState('');

  const mine = useMemo(() => all.filter((r) => r.personId === me?.id), [all, me?.id]);
  const shown = mine.filter((r) => (filter === 'all' || r.qualities.includes(filter)) && (!q || JSON.stringify(r).toLowerCase().includes(q.toLowerCase())));
  const themes = growthThemes(mine);
  const obs = gentleObservation(mine);
  const myCommits = commitments.filter((c) => c.personId === me?.id);
  const myPrasad = prasad.filter((p) => p.toId === me?.id);

  return (
    <Screen header={<AppHeader title="Seva Journal" subtitle="Private to you" />}>
      <Banner tone="indigo" icon={<Lock size={20} color="#26325F" />} title="Only you can read this">Reflections are private by default and never used to train models unless you separately opt in.</Banner>

      <SectionTitle>Inner Growth Map</SectionTitle>
      {themes.length === 0 ? <EmptyState title="Your themes will appear here" body="After you write a few reflections, you will see qualities that you mention yourself. This is not a score." /> : (
        <>
          {obs && <Card tone="saffron"><T color="ink">{obs}</T><T v="small">{evidenceConsent ? 'Based on your own entries, shown below each theme.' : 'Shown only to you. Turn on "Let Seva Guide point to my reflections" in Privacy to let the guide cite them.'}</T></Card>}
          {themes.map((t) => <GrowthTheme key={t.quality} theme={t} />)}
          <T v="small">No scores. No comparison with anyone. No psychological measurement.</T>
        </>
      )}

      <SectionTitle>Personal commitments</SectionTitle>
      {myCommits.map((c) => (
        <Card key={c.id} onPress={() => toggle(c.id)} label={`${c.text}. ${c.done ? 'Done' : 'Not done'}. Tap to toggle.`}>
          <Row style={{ justifyContent: 'space-between' }}><T style={{ flex: 1, textDecorationLine: c.done ? 'line-through' : 'none' }}>{c.text}</T><Chip label={c.done ? 'Done' : 'Open'} tone={c.done ? 'green' : 'saffron'} /></Row>
        </Card>
      ))}
      <Field label="Add a commitment" value={newC} onChangeText={setNewC} placeholder="Something small and kind" />
      <Button label="Add" kind="secondary" disabled={!newC.trim()} onPress={() => { add(newC.trim()); setNewC(''); }} />

      {myPrasad.length > 0 && (
        <>
          <SectionTitle>Prasad messages</SectionTitle>
          <Card tone="saffron" onPress={() => router.push('/prasad')} label="Open Prasad messages"><T>{myPrasad.length} private message(s) from past acts of service.</T></Card>
        </>
      )}

      <SectionTitle>Timeline</SectionTitle>
      <Field label="Search by theme or word" value={q} onChangeText={setQ} placeholder="e.g. listening" />
      <Row wrap>
        <Chip label="All" selected={filter === 'all'} onPress={() => setFilter('all')} />
        {QUALITIES.map((x) => <Chip key={x} label={x} selected={filter === x} onPress={() => setFilter(x)} />)}
      </Row>
      {shown.length === 0 && <EmptyState title="No entries here yet" body="Reflections you write after a session will appear in this timeline." />}
      {shown.map((r) => (
        <Card key={r.id}>
          <Row style={{ justifyContent: 'space-between' }}><T v="label">{fmtDate(r.at)}</T><Row wrap>{r.qualities.map((x) => <Chip key={x} label={x} tone="indigo" />)}</Row></Row>
          <T v="h3">{r.taught}</T>
          {r.listenedWell ? <T v="small" color="ink">Listened well: {r.listenedWell}</T> : null}
          {r.assumedQuickly ? <T v="small" color="ink">Assumed too quickly: {r.assumedQuickly}</T> : null}
          {r.nextTime ? <T v="small" color="ink">Next time: {r.nextTime}</T> : null}
          <Button label="Delete this entry" kind="quiet" onPress={() => setAskDel(r.id)} />
        </Card>
      ))}
      <ConfirmationSheet visible={!!askDel} danger title="Delete this reflection?" body="It is removed from your journal permanently." confirmLabel="Delete" onClose={() => setAskDel(null)} onConfirm={() => askDel && del(askDel)} />
    </Screen>
  );
}
