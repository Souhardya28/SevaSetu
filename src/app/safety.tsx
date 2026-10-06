import { Linking } from 'react-native';
import { Phone } from 'lucide-react-native';
import React, { useState } from 'react';
import { ReportSheet } from '@/components/domain';
import { AppHeader, Banner, Button, Card, Chip, Field, Row, Screen, SectionTitle, T, useTheme } from '@/components/ui';
import { crisisFor } from '@/constants/crisis';
import { fmtDate } from '@/lib/derive';
import { useApp, usePerson } from '@/store/useApp';

const PLEDGE: [string, string][] = [
  ['Respect', 'I will treat every person as an equal. I will not pity, patronise or humiliate.'],
  ['Honesty', 'I will be truthful about my skills, availability and intentions.'],
  ['Boundaries', 'I will honour the limits a person sets, and keep my own.'],
  ['Privacy', 'I will never share anyone\'s story, photo, number or address without their clear consent.'],
  ['Reliability', 'If plans change I will say so early. Rescheduling kindly is always welcome.'],
  ['No exploitation', 'I will not ask for money, favours, contact details or anything in return.'],
  ['No discrimination', 'I will not treat people differently by religion, caste, gender, disability, language or background.'],
  ['No unauthorised advice', 'I will not give medical, legal or financial advice. I will point to qualified people.'],
  ['Reporting', 'If I see or feel something unsafe, I will report it, and I will support others who do.'],
];

export default function Safety() {
  const c = useTheme();
  const trusted = useApp((s) => s.trustedContact);
  const setTrusted = useApp((s) => s.setTrustedContact);
  const blocked = useApp((s) => s.blocked);
  const unblock = useApp((s) => s.unblockPerson);
  const reports = useApp((s) => s.reports);
  const [name, setName] = useState(trusted);
  const [report, setReport] = useState(false);
  const res = crisisFor();
  return (
    <Screen header={<AppHeader title="Safety centre" subtitle="Help, boundaries and reporting" />}>
      <Banner tone="red" title="In danger right now?">Call the emergency number. SevaSetu cannot respond to emergencies.</Banner>
      {res.resources.map((r) => (
        <Card key={r.id}>
          <T v="h3">{r.label}</T><T v="small">{r.note}</T>
          <Button label={`Call ${r.number}`} kind="danger" icon={<Phone size={18} color={c.red} />} onPress={() => Linking.openURL(`tel:${r.number}`).catch(() => undefined)} />
          <T v="small">Listed for {res.locale}. This entry must be audited before launch.</T>
        </Card>
      ))}

      <SectionTitle>Report or block</SectionTitle>
      <Button label="Report a concern" onPress={() => setReport(true)} />
      {reports.length > 0 && reports.map((r) => (
        <Card key={r.id} tone="alt"><T v="h3">{r.targetLabel}</T><T v="small" color="ink">{r.reason} · {fmtDate(r.at)}</T><Chip label={r.status === 'received' ? 'Received. Evidence preserved' : r.status === 'in-review' ? 'In review' : 'Resolved'} tone="indigo" /><T v="small">You can appeal any outcome.</T></Card>
      ))}
      {blocked.length > 0 && <T v="h3">Blocked people</T>}
      {blocked.map((b) => <BlockedRow key={b} id={b} onUnblock={() => unblock(b)} />)}

      <SectionTitle>Trusted contact</SectionTitle>
      <Field label="Someone who knows when you are meeting" value={name} onChangeText={setName} hint="Stored only on this device." />
      <Button label="Save trusted contact" kind="secondary" onPress={() => setTrusted(null, name.trim())} />

      <SectionTitle>Code of Conduct and Accountability Pledge</SectionTitle>
      {PLEDGE.map(([h, b]) => <Card key={h}><T v="h3">{h}</T><T v="small" color="ink">{b}</T></Card>)}
      <T v="small">A checkbox is not a safety system. Human review, trained roles, verification and reporting are the real safeguards.</T>
      <ReportSheet visible={report} onClose={() => setReport(false)} targetType="General" targetLabel="General concern" />
    </Screen>
  );
}

function BlockedRow({ id, onUnblock }: { id: string; onUnblock: () => void }) {
  const p = usePerson(id);
  return <Row style={{ justifyContent: 'space-between' }}><T>{p?.displayName ?? 'Person'}</T><Button label="Unblock" kind="quiet" onPress={onUnblock} /></Row>;
}
