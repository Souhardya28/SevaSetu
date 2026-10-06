import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { AppHeader, Button, Card, EmptyState, Screen, T } from '@/components/ui';
import { fmtDate } from '@/lib/derive';
import { useApp } from '@/store/useApp';

export default function Notifications() {
  const userId = useApp((s) => s.userId);
  const all = useApp((s) => s.notifications);
  const markRead = useApp((s) => s.markNotificationsRead);
  const list = all.filter((n) => !n.toId || n.toId === userId);
  useEffect(() => () => markRead(), [markRead]);
  return (
    <Screen header={<AppHeader title="Notifications" subtitle="Calm and only when useful" />}>
      {list.length === 0 ? <EmptyState title="All quiet" body="Nothing needs your attention." /> : list.map((n) => (
        <Card key={n.id} tone={n.read ? 'plain' : 'saffron'} onPress={n.href ? () => router.push(n.href as string) : undefined} label={`${n.title}. ${n.body}`}>
          <T v="h3">{n.title}</T>
          <T v="small" color="ink">{n.body}</T>
          <T v="small">{fmtDate(n.at)}</T>
        </Card>
      ))}
      <Button label="Mark all as read" kind="quiet" onPress={markRead} />
    </Screen>
  );
}
