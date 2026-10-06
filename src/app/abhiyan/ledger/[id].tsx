import { router, useLocalSearchParams } from 'expo-router';
import React, { useState, useMemo } from 'react';
import { LedgerEntry, PublicLedger, ReceiptReview } from '@/components/domain';
import { AppHeader, Banner, Button, Card, Chip, EmptyState, Row, Screen, SectionTitle, T } from '@/components/ui';
import { useApp } from '@/store/useApp';

export default function LedgerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const camp = useApp((s) => s.campaigns.find((c) => c.id === id));
  const allLedger = useApp((s) => s.ledger);
  const entries = useMemo(() => allLedger.filter((l) => l.campaignId === id), [allLedger, id]);
  const [filter, setFilter] = useState<'all' | 'in' | 'out' | 'review'>('all');
  const [open, setOpen] = useState<string | null>(null);
  if (!camp) return <Screen header={<AppHeader title="Ledger" />}><EmptyState title="Not found" body="This campaign does not exist." /></Screen>;
  const shown = entries
    .filter((e) => filter === 'all' || (filter === 'review' ? e.human === 'pending' : e.kind === filter))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  const openEntry = entries.find((e) => e.id === open);
  return (
    <Screen header={<AppHeader title="Public Ledger" subtitle={camp.title} />}>
      <Banner tone="indigo" title="Open books">Every rupee in and out is listed. Receipts are redacted before they appear here. Labels show uncertainty. They are never accusations.</Banner>
      <PublicLedger entries={entries} goal={camp.goal} />
      <Button label="Add or check a bill (OCR demo)" onPress={() => router.push(`/abhiyan/bill/${camp.id}`)} />
      <SectionTitle>Entries</SectionTitle>
      <Row wrap>
        {([['all', 'All'], ['in', 'Money in'], ['out', 'Money out'], ['review', 'Awaiting review']] as const).map(([k, l]) => <Chip key={k} label={l} selected={filter === k} onPress={() => setFilter(k)} />)}
      </Row>
      {shown.length === 0 && <EmptyState title="No entries here" body="Try another filter." />}
      {shown.map((e) => (
        <React.Fragment key={e.id}>
          <LedgerEntry e={e} onPress={() => setOpen(open === e.id ? null : e.id)} />
          {openEntry?.id === e.id && e.kind === 'out' && <ReceiptReview e={e} />}
        </React.Fragment>
      ))}
      <Card tone="alt">
        <T v="h3">Corrections stay visible</T>
        <T v="small" color="ink">When an entry is corrected, the original and the change remain in its note. Nothing is quietly rewritten.</T>
      </Card>
    </Screen>
  );
}
