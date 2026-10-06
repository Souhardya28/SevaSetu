import { router } from 'expo-router';
import { CheckCircle2, Circle, CircleDot } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';
import { AppHeader, Banner, Button, Card, Row, Screen, T, useTheme } from '@/components/ui';
import { computeSevaPath } from '@/services/path';
import { pathInputsFor } from '@/lib/derive';
import { useApp, useMe } from '@/store/useApp';

export default function Path() {
  const c = useTheme();
  const me = useMe();
  const app = useApp();
  if (!me) return null;
  const steps = computeSevaPath(pathInputsFor(app, me.id));
  const href: Record<string, string> = { first: '/sathi', reflect: '/journal', repeat: '/sathi', trusted: '/sathi', abhiyan: '/abhiyan', training: '/abhiyan/c-lamps' };
  return (
    <Screen header={<AppHeader title="Seva Path" subtitle="Your own pace, no rankings" />}>
      <Banner tone="indigo">A path, not a ladder. Nobody sees where you are on it, and nobody is ahead of anyone.</Banner>
      <View style={{ gap: 0 }}>
        {steps.map((s, i) => (
          <Row key={s.id} gap={14} style={{ alignItems: 'flex-start' }} accessible accessibilityLabel={`${s.title}. ${s.done ? 'Done' : s.current ? 'Suggested next' : 'Later'}. ${s.blurb}`}>
            <View style={{ alignItems: 'center', width: 28 }}>
              {s.done ? <CheckCircle2 color={c.green} size={26} /> : s.current ? <CircleDot color={c.saffron} size={26} /> : <Circle color={c.border} size={26} />}
              {i < steps.length - 1 && <View style={{ width: 3, height: 52, backgroundColor: s.done ? c.green : c.border, marginTop: 2 }} />}
            </View>
            <View style={{ flex: 1, paddingBottom: 12 }}>
              <T v="h3" style={{ color: s.done ? c.green : c.ink }}>{s.title}</T>
              <T v="small">{s.blurb}</T>
              {s.current && href[s.id] && <Button label="Take this step" kind="secondary" onPress={() => router.push(href[s.id])} style={{ marginTop: 8 }} />}
            </View>
          </Row>
        ))}
      </View>
      <Card tone="alt"><T v="small">Sensitive roles need relevant training and organizer approval. Leading a campaign needs experience, training and a clean safety record. These are safeguards, not rewards.</T></Card>
    </Screen>
  );
}
