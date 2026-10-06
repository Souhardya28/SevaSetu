import React, { useMemo } from 'react';
import { PrasadCard } from '@/components/domain';
import { AppHeader, Banner, EmptyState, Screen } from '@/components/ui';
import { useApp, useMe } from '@/store/useApp';

export default function PrasadScreen() {
  const me = useMe();
  const allPrasad = useApp((s) => s.prasad);
  const items = useMemo(() => allPrasad.filter((p) => p.toId === me?.id), [allPrasad, me?.id]);
  const open = useApp((s) => s.openPrasad);
  const report = useApp((s) => s.reportPrasad);
  const del = useApp((s) => s.deletePrasad);
  return (
    <Screen header={<AppHeader title="Prasad" subtitle="Experience messages, received later" />}>
      <Banner tone="saffron">A Prasad is a gift from someone you once served. It is always optional for them, private by default, and never needs a reply.</Banner>
      {items.length === 0 ? <EmptyState title="No Prasad yet" body="If someone chooses to send one, it will arrive here quietly." /> : items.map((p) => (
        <PrasadCard key={p.id} p={p} onOpen={() => open(p.id)} onReport={() => report(p.id)} onDelete={() => del(p.id)} />
      ))}
    </Screen>
  );
}
