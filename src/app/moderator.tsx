import { router } from 'expo-router';
import React, { useState } from 'react';
import { Banner, Button, Card, Chip, EmptyState, Field, Row, Screen, SectionTitle, T, AppHeader } from '@/components/ui';
import { fmtDate } from '@/lib/derive';
import { useApp, useMe } from '@/store/useApp';
import type { ModItem, ModKind } from '@/types';

const KIND_LABEL: Record<ModKind, string> = {
  profile: 'Pending profiles', organization: 'Organization verification', request: 'High-risk requests', message: 'Flagged messages', report: 'User reports',
  campaign: 'Campaign anomalies', bill: 'Bill mismatches', consent: 'Content-consent issues', appeal: 'Appeals', crisis: 'Crisis escalations',
};

export default function Moderator() {
  const me = useMe();
  const items = useApp((s) => s.modItems);
  const audit = useApp((s) => s.audit);
  const logout = useApp((s) => s.logout);
  const [tab, setTab] = useState<'queue' | 'audit'>('queue');
  const [kind, setKind] = useState<ModKind | 'all'>('all');
  const [showDone, setShowDone] = useState(false);
  if (!me) return null;
  if (!me.roles.includes('moderator')) return <Screen header={<AppHeader title="Moderation" />}><EmptyState title="Moderators only" body="Switch to the demo moderator account from Profile." action={{ label: 'Go home', onPress: () => router.replace('/(tabs)') }} /></Screen>;
  const open = items.filter((i) => i.status === 'open');
  const shown = items.filter((i) => (showDone ? true : i.status === 'open') && (kind === 'all' || i.kind === kind));
  const kinds = Array.from(new Set(items.map((i) => i.kind)));
  return (
    <Screen header={<AppHeader back={false} title="Moderation" subtitle={`${open.length} open · AI assists, people decide`} right={<Button label="Sign out" kind="quiet" onPress={() => { logout(); router.replace('/onboarding'); }} />} />} padBottom={40}>
      <Banner tone="indigo">Flags are suggestions with stated uncertainty. You can override any of them. Nothing is frozen, removed or restricted without a person choosing it.</Banner>
      <Row><Chip label="Queue" selected={tab === 'queue'} onPress={() => setTab('queue')} /><Chip label="Audit log" selected={tab === 'audit'} onPress={() => setTab('audit')} /></Row>
      {tab === 'audit' ? (
        <>
          <SectionTitle>Audit log</SectionTitle>
          {audit.map((a) => <Card key={a.id} tone="alt"><T v="label">{fmtDate(a.at)} · {a.actor}</T><T>{a.action}</T></Card>)}
        </>
      ) : (
        <>
          <Row wrap>
            <Chip label="All" selected={kind === 'all'} onPress={() => setKind('all')} />
            {kinds.map((k) => <Chip key={k} label={KIND_LABEL[k]} selected={kind === k} onPress={() => setKind(k)} />)}
          </Row>
          <Chip label={showDone ? 'Hide resolved' : 'Show resolved'} onPress={() => setShowDone(!showDone)} />
          {shown.length === 0 && <EmptyState title="Queue is clear" body="Nothing is waiting for review." />}
          {shown.map((i) => <ModCard key={i.id} item={i} />)}
        </>
      )}
    </Screen>
  );
}

function ModCard({ item }: { item: ModItem }) {
  const resolve = useApp((s) => s.resolveMod);
  const [note, setNote] = useState('');
  const hasLink = !!item.link?.campaignId;
  const isBill = item.kind === 'bill' || item.kind === 'campaign';
  return (
    <Card tone={item.status === 'resolved' ? 'green' : 'plain'}>
      <Row wrap><Chip label={KIND_LABEL[item.kind]} tone="indigo" /><Chip label={`AI confidence: ${item.confidence}`} tone={item.confidence === 'high' ? 'terracotta' : 'saffron'} /></Row>
      <T v="h3">{item.title}</T>
      <T v="label">WHY IT WAS FLAGGED</T>
      <T v="small" color="ink">{item.why}</T>
      <T v="label">EVIDENCE</T>
      {item.evidence.map((e) => <T key={e} v="small" color="ink">• {e}</T>)}
      <T v="label">RECOMMENDED (you may override)</T>
      <T v="small" color="ink">{item.recommended}</T>
      {item.status === 'resolved' ? <Banner tone="green" title="Resolved">{item.resolution}</Banner> : (
        <>
          <Field label="Your note (kept in the audit log)" value={note} onChangeText={setNote} />
          <Row wrap>
            <Button label={isBill ? 'Approve receipt' : 'Approve'} onPress={() => resolve(item.id, 'approve', note)} />
            <Button label="Ask for information" kind="secondary" onPress={() => resolve(item.id, 'request-info', note)} />
          </Row>
          <Row wrap>
            {hasLink && <Button label="Mark corrected" kind="secondary" onPress={() => resolve(item.id, 'correct', note)} />}
            {hasLink && <Button label="Temporarily pause" kind="danger" onPress={() => resolve(item.id, 'pause', note)} />}
            <Button label="Override: no action" kind="quiet" onPress={() => resolve(item.id, 'dismiss', note)} />
          </Row>
        </>
      )}
    </Card>
  );
}
