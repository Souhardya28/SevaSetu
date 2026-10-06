import { router } from 'expo-router';
import React from 'react';
import { TrustTag, VerificationList } from '@/components/domain';
import { AppHeader, Button, Card, Chip, Row, Screen, SectionTitle, T, ToggleRow } from '@/components/ui';
import { DEMO_ACCOUNTS } from '@/data/seed';
import { useApp, useMe } from '@/store/useApp';

export default function Profile() {
  const me = useMe();
  const settings = useApp((s) => s.settings);
  const update = useApp((s) => s.updateSettings);
  const logout = useApp((s) => s.logout);
  const login = useApp((s) => s.login);
  const retry = useApp((s) => s.retryUploads);
  const pending = useApp((s) => s.uploads.filter((u) => u.status !== 'uploaded').length);
  const reset = useApp((s) => s.resetDemo);
  if (!me) return null;
  const go = (p: string) => () => router.push(p);

  return (
    <Screen header={<AppHeader back={false} bell title="Profile" subtitle="What others can see about you" />}>
      <Card>
        <T v="h1">{me.displayName}</T>
        <T v="small">{me.affiliation ?? 'No affiliation shown'}</T>
        <Row wrap>{me.languages.map((l) => <Chip key={l} label={l} tone="indigo" />)}{me.skills.map((s) => <Chip key={s} label={s} tone="indigo" />)}</Row>
        <T v="label">TRUST TAGS (from private feedback, never a score)</T>
        <Row wrap>{me.trustTags.length ? me.trustTags.map((t) => <TrustTag key={t} label={t} />) : <T v="small">Tags appear after respectful sessions.</T>}</Row>
        <T v="small">Public view: first name, languages, skills, availability and verification badges. No ratings, no counts, no rankings.</T>
      </Card>

      <SectionTitle>Verification</SectionTitle>
      <Card onPress={go('/verification')} label="Open verification">
        <VerificationList v={me.verification} />
        <T v="small">Simulated in this demo. We store results only, never Aadhaar or PAN numbers.</T>
      </Card>

      <SectionTitle>My growth</SectionTitle>
      <Row gap={8}>
        <Button label="Seva Journal" kind="secondary" onPress={go('/journal')} style={{ flex: 1 }} />
        <Button label="Seva Path" kind="secondary" onPress={go('/path')} style={{ flex: 1 }} />
      </Row>
      <Button label="Prasad messages" kind="secondary" onPress={go('/prasad')} />

      <SectionTitle>Accessibility and language</SectionTitle>
      <Card>
        <Row wrap><Chip label="English" selected={settings.lang === 'en'} onPress={() => update({ lang: 'en' })} /><Chip label="हिन्दी" selected={settings.lang === 'hi'} onPress={() => update({ lang: 'hi' })} /></Row>
        <ToggleRow label="High contrast" value={settings.highContrast} onChange={(v) => update({ highContrast: v })} />
        <ToggleRow label="Reduce motion" detail="Turns off animations and pulsing" value={settings.reducedMotion} onChange={(v) => update({ reducedMotion: v })} />
        <ToggleRow label="Give anonymously by default" detail="Public lists show 'Anonymous donor'. Private records are kept for compliance." value={settings.anonymousDefault} onChange={(v) => update({ anonymousDefault: v })} />
        <T v="small">Text size follows your phone&apos;s font setting.</T>
      </Card>

      <SectionTitle>Connectivity</SectionTitle>
      <Card>
        <ToggleRow label="Simulate offline mode" detail="Shows saved content, queues uploads and keeps drafts" value={settings.offline} onChange={(v) => update({ offline: v })} />
        {pending > 0 && !settings.offline && <Button label={`Retry ${pending} upload(s)`} kind="secondary" onPress={retry} />}
        {pending > 0 && settings.offline && <T v="small">{pending} upload(s) will retry when you are back online.</T>}
      </Card>

      <SectionTitle>Privacy and safety</SectionTitle>
      <Row gap={8}>
        <Button label="Privacy" kind="secondary" onPress={go('/privacy')} style={{ flex: 1 }} />
        <Button label="Safety" kind="secondary" onPress={go('/safety')} style={{ flex: 1 }} />
      </Row>

      <SectionTitle>Demo accounts</SectionTitle>
      <T v="small">Switch sides to try each journey. Everyone is fictional.</T>
      {DEMO_ACCOUNTS.map((a) => (
        <Button key={a.personId} label={`${a.label}${me.id === a.personId ? ' (current)' : ''}`} kind={me.id === a.personId ? 'primary' : 'secondary'} onPress={() => { login(a.personId); router.replace(a.personId === 'p-kavya' ? '/moderator' : '/(tabs)'); }} />
      ))}
      <Button label="Sign out" kind="quiet" onPress={() => { logout(); router.replace('/onboarding'); }} />
      <Button label="Reset all demo data" kind="danger" onPress={() => { reset(); router.replace('/onboarding'); }} />
    </Screen>
  );
}
