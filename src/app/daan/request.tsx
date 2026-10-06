import { router } from 'expo-router';
import React, { useState } from 'react';
import { AppHeader, Banner, Button, Chip, Field, Row, Screen, soft } from '@/components/ui';
import { checkProhibitedItem } from '@/services/safety';
import { useApp } from '@/store/useApp';

const CATS = ['School books', 'Stationery', 'School bags', 'Cycles', 'Clothes', 'Assistive items', 'Small electronics', 'Furniture'];

export default function RequestItem() {
  const [cat, setCat] = useState('');
  const [text, setText] = useState('');
  const [sent, setSent] = useState(false);
  const blocked = checkProhibitedItem(text);
  const me = useApp((s) => s.people.find((p) => p.id === s.userId));
  const post = () => {
    useApp.setState((s) => ({ needs: [{ id: `n-${Date.now()}`, requesterLabel: `${me?.displayName ?? 'A neighbour'} (verification pending)`, verified: false, org: false, category: cat, text, area: 'Near you', distanceKm: 1, keywords: [cat.toLowerCase()] }, ...s.needs] }));
    soft(); setSent(true);
  };
  return (
    <Screen header={<AppHeader title="I need an item" />}>
      {sent ? (
        <>
          <Banner tone="green" title="Your need is listed">Donors nearby can see it. Your name stays as a first name only and your address is never shown.</Banner>
          <Button label="Back to Daan" onPress={() => router.replace('/(tabs)/daan')} />
        </>
      ) : (
        <>
          <Row wrap>{CATS.map((k) => <Chip key={k} label={k} selected={cat === k} onPress={() => setCat(k)} />)}</Row>
          <Field label="What would help?" value={text} onChangeText={setText} multiline />
          {blocked && <Banner tone="red" title={`${blocked} cannot be requested here`}>Please ask a clinic, school or licensed provider instead.</Banner>}
          <Button label="Post my need" disabled={!cat || text.trim().length < 5 || !!blocked} onPress={post} />
        </>
      )}
    </Screen>
  );
}
