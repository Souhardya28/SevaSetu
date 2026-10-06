import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { AppHeader, Button, Card, Chip, Row, Screen, T, useTheme } from '@/components/ui';
import { INTERESTS } from '@/data/seed';
import { useApp } from '@/store/useApp';
import type { Lang, RoleKey } from '@/types';
import { Check } from 'lucide-react-native';

const ROLES: { key: RoleKey; label: string; hint: string }[] = [
  { key: 'sevak', label: 'I want to offer help', hint: 'Sevak: give time, knowledge or practical support' },
  { key: 'sahabhagi', label: 'I may need support', hint: 'Sahabhagi: you stay in control of your request' },
  { key: 'organization', label: 'I represent an organization', hint: 'Run a verified campaign' },
  { key: 'anchor', label: 'I am an on-ground Anchor', hint: 'ASHA worker or trusted social worker' },
  { key: 'donor', label: 'I want to donate useful items', hint: 'Daan: share things that are still useful' },
];
const AVAIL = [
  { k: 'one-time', l: 'One-time' }, { k: 'weekends', l: 'Weekends' }, { k: 'weekly', l: 'Weekly' },
  { k: 'remote', l: 'Remote' }, { k: 'nearby', l: 'Nearby in-person' },
];

export const setupDraft: { lang: Lang; roles: RoleKey[]; interests: string[]; availability: string[] } = { lang: 'en', roles: [], interests: [], availability: [] };

export default function Setup() {
  const c = useTheme();
  const update = useApp((s) => s.updateSettings);
  const [step, setStep] = useState(0);
  const [lang, setLang] = useState<Lang>('en');
  const [roles, setRoles] = useState<RoleKey[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [avail, setAvail] = useState<string[]>([]);
  const toggle = <T,>(arr: T[], v: T, set: (a: T[]) => void) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const titles = ['Choose your language', 'How would you like to take part?', 'What are you drawn to?', 'When can you help?'];
  const canNext = step === 0 || (step === 1 && roles.length > 0) || (step === 2 && interests.length > 0) || (step === 3 && avail.length > 0);

  const next = () => {
    if (step < 3) { setStep(step + 1); return; }
    Object.assign(setupDraft, { lang, roles, interests, availability: avail });
    router.push('/onboarding/auth');
  };

  return (
    <Screen header={<AppHeader title={titles[step]} subtitle={`Step ${step + 1} of 4`} back={step > 0} right={step === 0 ? undefined : undefined} />}
      footer={<View style={{ padding: 16, gap: 8 }}><Button label="Continue" disabled={!canNext} onPress={next} />{step > 0 && <Button label="Back" kind="quiet" onPress={() => setStep(step - 1)} />}</View>}>
      {step === 0 && (
        <>
          {([['en', 'English'], ['hi', 'हिन्दी (Hindi)']] as const).map(([k, l]) => (
            <Card key={k} onPress={() => { setLang(k); update({ lang: k }); }} label={l} style={{ borderColor: lang === k ? c.indigo : c.border, borderWidth: lang === k ? 2 : 1 }}>
              <Row style={{ justifyContent: 'space-between' }}><T v="h2">{l}</T>{lang === k && <Check color={c.indigo} />}</Row>
            </Card>
          ))}
          <T v="small">More Indian languages can be added by dropping in a dictionary file. Marathi, Tamil and Bengali are on the roadmap.</T>
        </>
      )}
      {step === 1 && (
        <>
          <T v="small">You can choose more than one. Nobody is only a giver or only a receiver.</T>
          {ROLES.map((r) => (
            <Pressable key={r.key} accessibilityRole="checkbox" accessibilityState={{ checked: roles.includes(r.key) }} accessibilityLabel={`${r.label}. ${r.hint}`} onPress={() => toggle(roles, r.key, setRoles)}
              style={{ padding: 14, borderRadius: 14, borderWidth: 1.5, minHeight: 64, borderColor: roles.includes(r.key) ? c.indigo : c.border, backgroundColor: roles.includes(r.key) ? c.indigoSoft : c.surface }}>
              <T v="h3">{r.label}</T><T v="small">{r.hint}</T>
            </Pressable>
          ))}
        </>
      )}
      {step === 2 && <Row wrap>{INTERESTS.map((i) => <Chip key={i} label={i} selected={interests.includes(i)} onPress={() => toggle(interests, i, setInterests)} />)}</Row>}
      {step === 3 && (
        <>
          <T v="small">Choose what is true for you. You can change this anytime and rest whenever you need.</T>
          <Row wrap>{AVAIL.map((a) => <Chip key={a.k} label={a.l} selected={avail.includes(a.k)} onPress={() => toggle(avail, a.k, setAvail)} />)}</Row>
        </>
      )}
    </Screen>
  );
}
