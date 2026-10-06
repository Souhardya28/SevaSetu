import { router } from 'expo-router';
import React, { useState } from 'react';
import { CampaignCard } from '@/components/domain';
import { AppHeader, Banner, Button, Chip, EmptyState, Row, Screen, SectionTitle, T } from '@/components/ui';
import { recommendCampaign } from '@/services/matching';
import { useApp, useMe } from '@/store/useApp';

export default function Abhiyan() {
  const me = useMe();
  const campaigns = useApp((s) => s.campaigns);
  const dismissed = useApp((s) => s.dismissed);
  const dismiss = useApp((s) => s.dismissCampaign);
  const [cat, setCat] = useState('All');
  if (!me) return null;

  const cats = ['All', ...Array.from(new Set(campaigns.map((c) => c.category)))];
  const list = campaigns
    .filter((c) => cat === 'All' || c.category === cat)
    .map((c) => ({ c, rec: recommendCampaign(me, c, dismissed) }))
    .filter((x) => x.rec)
    .sort((a, b) => (b.rec?.score ?? 0) - (a.rec?.score ?? 0));

  return (
    <Screen header={<AppHeader back={false} bell title="Abhiyan" subtitle="Transparent collective campaigns" />}>
      <Banner tone="indigo" title="Every campaign shows its books">Verified organizers, itemised budgets and a Public Ledger you can read yourself.</Banner>
      <Row wrap>{cats.map((k) => <Chip key={k} label={k} selected={cat === k} onPress={() => setCat(k)} />)}</Row>
      <SectionTitle>For you</SectionTitle>
      {list.length === 0 ? (
        <EmptyState title="No campaigns to show" body={dismissed.length ? 'You have hidden some campaigns. You can bring them back below.' : 'Try another category.'} action={dismissed.length ? { label: 'Show hidden campaigns', onPress: () => useApp.setState({ dismissed: [] }) } : undefined} />
      ) : list.map(({ c, rec }) => (
        <CampaignCard key={c.id} c={c}
          why={rec && rec.reasons.length ? `Recommended because ${rec.reasons.join(' and ')}.` : 'Shown because it is open to everyone. We have no specific match.'}
          onPress={() => router.push(`/abhiyan/${c.id}`)} onDismiss={() => dismiss(c.id)} />
      ))}
      <T v="small">Recommendations use only interests, skills, language, distance and availability you chose. We do not guess sensitive traits, and we do not optimise for clicks.</T>
      {dismissed.length > 0 && <Button label="Show hidden campaigns" kind="quiet" onPress={() => useApp.setState({ dismissed: [] })} />}
    </Screen>
  );
}
