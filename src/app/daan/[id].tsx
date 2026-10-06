import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { ConditionBadge, HandoverCard, ReportSheet, TrustBadge } from '@/components/domain';
import { AppHeader, Banner, Button, Card, Chip, EmptyState, Field, Row, Screen, SectionTitle, T, ToggleRow, soft } from '@/components/ui';
import { SAFE_PLACES } from '@/data/seed';
import { matchItemToNeeds } from '@/services/matching';
import { useApp, useMe, usePerson } from '@/store/useApp';

export default function ItemDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const me = useMe();
  const item = useApp((s) => s.items.find((i) => i.id === id));
  const donor = usePerson(item?.donorId);
  const needs = useApp((s) => s.needs);
  const res = useApp((s) => s.reservations.find((r) => r.itemId === id && r.status !== 'closed') ?? s.reservations.find((r) => r.itemId === id));
  const reserve = useApp((s) => s.reserveItem);
  const confirmReceipt = useApp((s) => s.confirmReceipt);
  const closeRes = useApp((s) => s.closeReservation);
  const confirmCondition = useApp((s) => s.confirmCondition);
  const [needId, setNeedId] = useState<string | null>(null);
  const [point, setPoint] = useState(SAFE_PLACES[0]);
  const [conditionOk, setConditionOk] = useState(true);
  const [thanks, setThanks] = useState('');
  const [report, setReport] = useState(false);

  if (!item || !me) return <Screen header={<AppHeader title="Item" />}><EmptyState title="Listing not found" body="It may have been closed." action={{ label: 'Back to Daan', onPress: () => router.replace('/(tabs)/daan') }} /></Screen>;
  const mine = item.donorId === me.id;
  const suggestions = matchItemToNeeds(item, needs);
  const need = needs.find((n) => n.id === (res?.needId ?? needId));

  return (
    <Screen header={<AppHeader title={item.title} subtitle={item.category} />}>
      <Card>
        <T style={{ fontSize: 52, lineHeight: 64 }} accessibilityLabel={`${item.category} photo placeholder`}>{item.emoji}</T>
        <T>{item.description}</T>
        <T v="small">Qty {item.quantity} · {item.age} old · {item.area} · {item.availability}</T>
        <ConditionBadge item={item} />
        <Row wrap>
          <Chip label={item.audience === 'organization' ? 'Organizations preferred' : 'Individuals welcome'} tone="indigo" />
          <Chip label={item.pickup === 'drop-point' ? 'Public drop point' : item.pickup === 'partner' ? 'Partner pickup' : 'Pickup from donor'} tone="indigo" />
        </Row>
        {donor && <T v="small">Shared by {donor.displayName}{donor.trustTags.length ? ` · ${donor.trustTags.join(', ')}` : ''}</T>}
        <T v="small">Photos cannot guarantee condition. Please check in person at handover.</T>
      </Card>

      {!item.conditionConfirmed && (
        <Banner tone="saffron" title="Condition needs confirming">{mine ? 'Please confirm the condition below so receivers know what to expect.' : 'The donor has not confirmed the condition yet. Check at handover.'}
          {mine && <Button label="Confirm condition is as described" kind="secondary" onPress={() => confirmCondition(item.id)} />}
        </Banner>
      )}

      {!res && item.status === 'available' && (
        <>
          <SectionTitle>{mine ? 'Choose a need to serve' : 'Request this item'}</SectionTitle>
          {(mine ? suggestions : needs.filter((n) => n.category === item.category).map((n) => ({ need: n, why: `${n.requesterLabel} · ${n.distanceKm.toFixed(1)} km` }))).map(({ need: n, why }) => (
            <Card key={n.id} onPress={() => setNeedId(n.id)} label={`Choose ${n.requesterLabel}`} style={{ borderColor: needId === n.id ? '#26325F' : undefined, borderWidth: needId === n.id ? 2 : 1 }}>
              <T v="h3">{n.requesterLabel}</T>
              <T v="small" color="ink">{n.text}</T>
              <Row wrap>{n.verified && <TrustBadge label="Verified" />}<Chip label={`${n.distanceKm.toFixed(1)} km`} tone="indigo" /></Row>
              <T v="small">{why}</T>
            </Card>
          ))}
          {suggestions.length === 0 && mine && <EmptyState title="No matching need yet" body="We will notify you when a verified need appears." />}
          {needId && (
            <>
              <T v="label" color="ink">Pickup point</T>
              <Row wrap>{SAFE_PLACES.slice(0, 3).map((p) => <Chip key={p} label={p} selected={point === p} onPress={() => setPoint(p)} />)}</Row>
              <Button label="Reserve and create handover code" onPress={() => { reserve(item.id, needId, point); soft(); }} />
            </>
          )}
        </>
      )}

      {res && (
        <>
          <SectionTitle>Handover</SectionTitle>
          {need && <T v="small">For: {need.requesterLabel}</T>}
          <HandoverCard code={res.code} point={res.pickupPoint} status={res.status === 'reserved' ? 'Reserved. Waiting for handover' : res.status === 'received' ? 'Receipt confirmed' : 'Closed. Personal details expired'} />
          {res.status === 'reserved' && (
            <Card>
              <T v="h3">Receiver confirms (demo)</T>
              <T v="small">In real use the receiver enters the code on their own device. Here you can act as the receiver to complete the journey.</T>
              <ToggleRow label="Condition is as described" value={conditionOk} onChange={setConditionOk} />
              <Field label="Optional thank-you (private)" value={thanks} onChangeText={setThanks} multiline />
              <Button label={`Confirm receipt with code ${res.code}`} onPress={() => { confirmReceipt(res.id, conditionOk, thanks); soft(); }} />
            </Card>
          )}
          {res.status === 'received' && (
            <>
              <Banner tone="green" title="Handover complete">{res.conditionOk ? 'Receiver confirmed the condition matched.' : 'Receiver noted a difference in condition. The donor can follow up.'}{res.thanks ? ` Thank-you: "${res.thanks}"` : ''}</Banner>
              <Button label="Close listing and expire personal data" onPress={() => closeRes(res.id)} />
            </>
          )}
          {res.status === 'closed' && <Banner tone="indigo">Listing closed. Pickup code and any contact details have been expired automatically.</Banner>}
        </>
      )}
      <Button label="Report this listing" kind="quiet" onPress={() => setReport(true)} />
      <ReportSheet visible={report} onClose={() => setReport(false)} targetType="Daan listing" targetLabel={item.title} />
    </Screen>
  );
}
