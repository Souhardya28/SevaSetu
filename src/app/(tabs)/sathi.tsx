import { router } from 'expo-router';
import { Plus } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { OpportunityCard, TrustBadge } from '@/components/domain';
import { AppHeader, Banner, Button, Chip, EmptyState, Row, Screen, SectionTitle, Skeleton, T, useTheme } from '@/components/ui';
import { explainMatch, matchSevakToRequest } from '@/services/matching';
import { CATEGORY_LABEL } from '@/services/structuring';
import { useApp, useMe } from '@/store/useApp';
import type { HelpCategory } from '@/types';

const MODES = ['All', 'Remote', 'In person'] as const;

export default function Sathi() {
  const c = useTheme();
  const me = useMe();
  const requests = useApp((s) => s.requests);
  const blocked = useApp((s) => s.blocked);
  const matches = useApp((s) => s.matches);
  const [cat, setCat] = useState<HelpCategory | 'all'>('all');
  const [mode, setMode] = useState<(typeof MODES)[number]>('All');
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 350); return () => clearTimeout(t); }, []);
  if (!me) return null;

  const mine = requests.filter((r) => r.requesterId === me.id);
  const open = requests
    .filter((r) => r.requesterId !== me.id && r.status === 'open' && !blocked.includes(r.requesterId))
    .filter((r) => cat === 'all' || r.category === cat)
    .filter((r) => mode === 'All' || (mode === 'Remote' ? r.mode === 'remote' : r.mode === 'in-person'))
    .map((r) => ({ r, m: matchSevakToRequest(me, r) }))
    .sort((a, b) => b.m.score - a.m.score);

  return (
    <Screen header={<AppHeader back={false} bell title="Sathi" subtitle="Person-to-person help" right={<Button label="Ask" icon={<Plus size={18} color="#fff" />} onPress={() => router.push('/sathi/new')} a11y="Request support" />} />}>
      <Banner tone="indigo" title="Peer support, not therapy or crisis care.">Listening requests are companionship between peers. If someone is in crisis, SevaSetu points them to trained helplines.</Banner>

      {mine.length > 0 && (
        <>
          <SectionTitle>Your requests</SectionTitle>
          {mine.map((r) => {
            const match = matches.find((m) => m.requestId === r.id && m.status !== 'cancelled');
            return (
              <OpportunityCard key={r.id} title={r.title} meta={`${r.whenLabel} · ${r.visibility === 'private' ? 'Private matching' : r.visibility === 'circle' ? 'Trusted circle' : 'Public'}`}
                badges={<Chip label={r.status === 'open' ? 'Waiting for a Sevak' : r.status === 'matched' ? 'Matched' : r.status === 'completed' ? 'Completed' : r.status === 'pending-review' ? 'With a human reviewer' : 'Cancelled'} tone={r.status === 'matched' || r.status === 'completed' ? 'green' : 'saffron'} />}
                onPress={() => router.push(match ? `/sathi/room/${match.id}` : `/sathi/${r.id}`)} />
            );
          })}
        </>
      )}

      <SectionTitle>Offer help</SectionTitle>
      <Row wrap>
        <Chip label="All kinds" selected={cat === 'all'} onPress={() => setCat('all')} />
        {(Object.keys(CATEGORY_LABEL) as HelpCategory[]).map((k) => <Chip key={k} label={CATEGORY_LABEL[k]} selected={cat === k} onPress={() => setCat(k)} />)}
      </Row>
      <Row wrap>{MODES.map((m) => <Chip key={m} label={m} selected={mode === m} onPress={() => setMode(m)} />)}</Row>

      {loading ? <><Skeleton /><Skeleton /></> : open.length === 0 ? (
        <EmptyState title="No requests match these filters" body="Try another category. New requests appear as people ask." action={{ label: 'Clear filters', onPress: () => { setCat('all'); setMode('All'); } }} />
      ) : open.map(({ r, m }) => (
        <OpportunityCard key={r.id} title={r.title}
          meta={`${r.mode === 'remote' ? 'Remote' : `${r.distanceKm.toFixed(1)} km`} · ${r.minutes} min · ${r.language} · ${r.urgency === 'soon' ? 'Soon' : r.urgency === 'low' ? 'No rush' : 'This week'}`}
          why={explainMatch(m.reasons)}
          badges={<>
            <TrustBadge label={r.risk === 'low' ? 'Low risk' : 'Medium risk'} tone={r.risk === 'low' ? 'green' : 'saffron'} />
            {r.requesterId === 'p-sunita' && <TrustBadge label="Verified Anchor present" tone="indigo" />}
            {r.category === 'listening' && <Chip label="Peer support only" tone="terracotta" />}
          </>}
          onPress={() => router.push(`/sathi/${r.id}`)} />
      ))}
      <T v="small" style={{ color: c.muted }}>Everyone shown is fictional. Exact addresses and phone numbers are never displayed.</T>
    </Screen>
  );
}
