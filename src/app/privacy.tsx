import React, { useState } from 'react';
import { ConfirmationSheet, AppHeader, Banner, Button, Card, Screen, SectionTitle, Sheet, T, ToggleRow } from '@/components/ui';
import { useApp, useMe } from '@/store/useApp';
import { router } from 'expo-router';

export default function Privacy() {
  const me = useMe();
  const consents = useApp((s) => s.consents);
  const setConsent = useApp((s) => s.setConsent);
  const deletion = useApp((s) => s.deletionRequested);
  const requestDeletion = useApp((s) => s.requestDeletion);
  const app = useApp();
  const [exp, setExp] = useState(false);
  const [askDel, setAskDel] = useState(false);
  if (!me) return null;
  const mine = {
    profile: { name: me.displayName, languages: me.languages, skills: me.skills, verification: me.verification },
    reflections: app.reflections.filter((r) => r.personId === me.id),
    commitments: app.commitments.filter((c) => c.personId === me.id),
    requests: app.requests.filter((r) => r.requesterId === me.id).map((r) => ({ title: r.title, original: r.originalText })),
    consents: app.consents,
  };
  return (
    <Screen header={<AppHeader title="Privacy and consent" />}>
      <Banner tone="indigo">We collect the minimum. Reflections stay private. Exact location and contact details are never shown before you agree.</Banner>
      <SectionTitle>Your consents</SectionTitle>
      {consents.map((c) => (
        <Card key={c.id}>
          <ToggleRow label={c.label} detail={`${c.detail}${c.at ? ` · recorded ${new Date(c.at).toLocaleDateString()} (${c.version})` : ` · ${c.version}`}`} value={c.granted} onChange={(v) => (c.required && c.id === 'reflections-private' ? undefined : setConsent(c.id, v))} />
        </Card>
      ))}
      <SectionTitle>Your data</SectionTitle>
      <Card><T>Download a copy of what we hold about you, or ask us to delete your account.</T>
        <Button label="Preview my data export" kind="secondary" onPress={() => setExp(true)} />
        <Button label={deletion ? 'Deletion requested (30-day window)' : 'Request account deletion'} kind="danger" disabled={deletion} onPress={() => setAskDel(true)} />
      </Card>
      <Card tone="alt">
        <T v="h3">What we retain</T>
        <T v="small" color="ink">• Verification results only. Never raw ID numbers or documents.</T>
        <T v="small" color="ink">• Chat contact details and pickup codes expire after a handover or session closes.</T>
        <T v="small" color="ink">• Safety reports and financial records are kept in a restricted store for the legally required period.</T>
        <T v="small" color="ink">• Private reflections are deleted with your account.</T>
      </Card>
      <Sheet visible={exp} onClose={() => setExp(false)} title="Your data (preview)">
        <T v="small">{JSON.stringify(mine, null, 2)}</T>
        <Button label="Close" onPress={() => setExp(false)} />
      </Sheet>
      <ConfirmationSheet visible={askDel} danger title="Request account deletion?" body="Your profile, reflections and messages will be deleted after a 30-day window in which you can cancel. Some safety and financial records are kept as required by law." confirmLabel="Request deletion" onClose={() => setAskDel(false)} onConfirm={() => { requestDeletion(); router.back(); }} />
    </Screen>
  );
}
