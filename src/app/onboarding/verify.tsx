import { router } from 'expo-router';
import React from 'react';
import { VerificationList } from '@/components/domain';
import { AppHeader, Banner, Button, Card, Screen, T } from '@/components/ui';
import { useApp, useMe } from '@/store/useApp';

/** Verification is SIMULATED. Production design: DigiLocker or another authorised provider returns a result only. */
export default function Verify({ inApp }: { inApp?: boolean }) {
  const me = useMe();
  const adv = useApp((s) => s.advanceVerification);
  const consent = useApp((s) => s.setConsent);
  const pledge = useApp((s) => s.consents.find((c) => c.id === 'terms'));
  if (!me) return null;
  const v = me.verification;
  const steps: { key: 'phone' | 'college' | 'identity' | 'orientation'; label: string; body: string; done: boolean }[] = [
    { key: 'phone', label: 'Verify phone', body: 'Simulated one-tap verification.', done: v.phone },
    { key: 'college', label: 'Confirm college affiliation', body: 'Simulated. Production: organisation email or institution partner.', done: v.college },
    { key: 'identity', label: v.identity === 'pending' ? 'Complete identity check' : 'Start identity check', body: 'Simulated. Production: DigiLocker or an authorised provider. SevaSetu stores only the result, never Aadhaar or PAN numbers.', done: v.identity === 'completed' },
    { key: 'orientation', label: 'Complete safety orientation', body: 'A 10-minute walkthrough of boundaries, consent and reporting.', done: v.orientation },
  ];
  return (
    <Screen header={<AppHeader title="Verification" subtitle="Simulated for the hackathon" back={!!inApp || router.canGoBack()} />}>
      <Banner tone="saffron" title="This is a demo simulation">Nothing here is a real identity check. We never store raw government ID numbers, and you can ask us to delete verification results at any time.</Banner>
      <VerificationList v={v} />
      {steps.map((s) => (
        <Card key={s.key}>
          <T v="h3">{s.label}</T><T v="small">{s.body}</T>
          <Button label={s.done ? 'Done' : s.label} disabled={s.done} kind="secondary" onPress={() => adv(s.key)} />
        </Card>
      ))}
      <Card tone="indigo">
        <T v="h3">Code of Conduct and Accountability Pledge</T>
        <T v="small" color="ink">Read it in full under Safety. A checkbox is not our safety system. It is a promise we ask each other to keep.</T>
        <Button label="Read the pledge" kind="secondary" onPress={() => router.push('/safety')} />
        <Button label={pledge?.granted ? 'Pledge accepted' : 'I accept the pledge'} disabled={pledge?.granted} onPress={() => consent('terms', true)} />
      </Card>
      <Button label="Continue to SevaSetu" disabled={!pledge?.granted} onPress={() => router.replace('/(tabs)')} />
    </Screen>
  );
}
