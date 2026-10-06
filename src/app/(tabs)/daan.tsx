import { router } from 'expo-router';
import { Plus } from 'lucide-react-native';
import React, { useState } from 'react';
import { ItemCard, TrustBadge } from '@/components/domain';
import { AppHeader, Banner, Button, Card, Chip, EmptyState, Row, Screen, SectionTitle, T } from '@/components/ui';
import { useApp, useMe } from '@/store/useApp';

export default function Daan() {
  const me = useMe();
  const items = useApp((s) => s.items);
  const needs = useApp((s) => s.needs);
  const reservations = useApp((s) => s.reservations);
  const [view, setView] = useState<'items' | 'needs'>('items');
  if (!me) return null;
  const mine = items.filter((i) => i.donorId === me.id);
  const avail = items.filter((i) => i.donorId !== me.id && i.status === 'available');
  const needSorted = [...needs].sort((a, b) => a.distanceKm - b.distanceKm);
  return (
    <Screen header={<AppHeader back={false} bell title="Daan" subtitle="Everyday material giving" right={<Button label="Share" icon={<Plus size={18} color="#fff" />} onPress={() => router.push('/daan/new')} a11y="Share an item" />} />}>
      <Banner tone="indigo">Give what is still useful. Medicines, open food, weapons, counterfeit or unsafe goods and intimate items are not accepted.</Banner>
      <Row><Chip label="Items offered" selected={view === 'items'} onPress={() => setView('items')} /><Chip label="Needs near you" selected={view === 'needs'} onPress={() => setView('needs')} /></Row>

      {view === 'items' ? (
        <>
          {mine.length > 0 && <SectionTitle>Your listings</SectionTitle>}
          {mine.map((i) => <ItemCard key={i.id} item={i} onPress={() => router.push(`/daan/${i.id}`)} />)}
          <SectionTitle>Available nearby</SectionTitle>
          {avail.length === 0 ? <EmptyState title="Nothing offered right now" body="Be the first to share something useful." action={{ label: 'Share an item', onPress: () => router.push('/daan/new') }} /> : avail.map((i) => <ItemCard key={i.id} item={i} onPress={() => router.push(`/daan/${i.id}`)} />)}
          {reservations.length > 0 && <Card tone="green"><T v="h3">{reservations.filter((r) => r.status === 'reserved').length} handover(s) in progress</T><T v="small" color="ink">Open the listing to see its pickup code.</T></Card>}
        </>
      ) : (
        <>
          <SectionTitle>Expressed needs</SectionTitle>
          {needSorted.map((n) => (
            <Card key={n.id}>
              <T v="h3">{n.category}</T>
              <T>{n.text}</T>
              <T v="small">{n.requesterLabel} · {n.distanceKm.toFixed(1)} km · {n.area}</T>
              <Row wrap>{n.verified && <TrustBadge label="Verified request" />}{n.org && <Chip label="Organization" tone="indigo" />}</Row>
            </Card>
          ))}
          <Button label="I need an item" kind="secondary" onPress={() => router.push('/daan/request')} />
        </>
      )}
    </Screen>
  );
}
