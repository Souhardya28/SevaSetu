import { router, useLocalSearchParams } from 'expo-router';
import { Share2 } from 'lucide-react-native';
import React, { useState, useMemo } from 'react';
import { Share } from 'react-native';
import { LedgerEntry, OrganizerDossier, PublicLedger, ReportSheet, TransparencyStatus, TrustBadge } from '@/components/domain';
import { AppHeader, Banner, Button, Card, Chip, EmptyState, Field, Row, Screen, SectionTitle, Sheet, T, ToggleRow, soft, useTheme } from '@/components/ui';
import { ORGS } from '@/data/seed';
import { riskLabel } from '@/services/safety';
import { useApp, useMe } from '@/store/useApp';

const STATUS_LABEL = { active: 'Active', paused: 'Paused', completed: 'Completed', 'under-review': 'Paused for human review' } as const;

export default function CampaignDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useTheme();
  const me = useMe();
  const camp = useApp((s) => s.campaigns.find((x) => x.id === id));
  const allLedger = useApp((s) => s.ledger);
  const ledger = useMemo(() => allLedger.filter((l) => l.campaignId === id), [allLedger, id]);
  const allJoins = useApp((s) => s.joins);
  const userId = useApp((s) => s.userId);
  const joins = useMemo(() => allJoins.filter((j) => j.campaignId === id && j.personId === userId), [allJoins, id, userId]);
  const trainings = useApp((s) => s.trainings);
  const join = useApp((s) => s.joinCampaign);
  const training = useApp((s) => s.completeTraining);
  const donate = useApp((s) => s.donate);
  const anonDefault = useApp((s) => s.settings.anonymousDefault);
  const submitAppeal = useApp((s) => s.submitAppeal);
  const [donateOpen, setDonateOpen] = useState(false);
  const [amount, setAmount] = useState('500');
  const [anon, setAnon] = useState(anonDefault);
  const [done, setDone] = useState(false);
  const [report, setReport] = useState(false);
  const [appeal, setAppeal] = useState('');
  const [appealOpen, setAppealOpen] = useState(false);
  const [msg, setMsg] = useState('');
  const [booking, setBooking] = useState(false);

  if (!camp || !me) return <Screen header={<AppHeader title="Campaign" />}><EmptyState title="Campaign not found" body="It may have been removed." /></Screen>;
  const organization = ORGS.find((o) => o.id === camp.orgId);
  const inSum = ledger.filter((l) => l.kind === 'in').reduce((n, l) => n + l.amount, 0);

  const doJoin = (roleId: string) => {
    const st = join(camp.id, roleId);
    soft();
    setMsg(st === 'confirmed' ? 'You are in. Details will arrive in your notifications.' : st === 'pending-approval' ? 'Request sent. The organizer will approve it, and you can see its status here.' : 'This role needs a short orientation first. Start it below, then ask to join again.');
  };

  return (
    <Screen header={<AppHeader title={camp.title} subtitle={`${camp.category} · ${camp.area}`}
      right={<Button label="Share" kind="quiet" icon={<Share2 size={18} color={c.indigo} />} onPress={() => Share.share({ message: `${camp.title}: ${camp.objective} (SevaSetu demo campaign)` }).catch(() => undefined)} />} />}>
      {camp.status !== 'active' && (
        <Banner tone="saffron" title={STATUS_LABEL[camp.status]}>A person on the review team made this decision after missing documentation was noticed. The organizer has been reminded and can submit a correction or appeal.</Banner>
      )}
      <Card>
        <Row wrap><TrustBadge label="Verified organizer" /><TransparencyStatus status={camp.status === 'active' ? 'ok' : 'pending'} /><Chip label="Fictional demo campaign" tone="terracotta" /></Row>
        <T>{camp.story}</T>
        <T v="h3">Objective</T>
        <T v="small" color="ink">{camp.objective}</T>
        <T v="small">{camp.timeline} · {camp.commitment}</T>
        <T v="small">Approximate location: {camp.area}. Exact venue is shared after you join.</T>
      </Card>

      <SectionTitle>Organizer dossier</SectionTitle>
      {organization && <OrganizerDossier org={organization} />}

      <SectionTitle>Volunteer roles</SectionTitle>
      {msg ? <Banner tone="green">{msg}</Banner> : null}
      {camp.roles.map((r) => {
        const j = joins.find((x) => x.roleId === r.id);
        return (
          <Card key={r.id}>
            <T v="h3">{r.title}</T>
            <T v="small">{r.slots - r.filled} of {r.slots} spots open · {riskLabel[r.risk]}</T>
            {r.training && <T v="small" color="ink">Required training: {r.training}</T>}
            {r.training && !trainings.includes(r.id) && r.risk !== 'low' && (
              <Button label="Start the orientation (demo)" kind="secondary" onPress={() => { training(r.id); setMsg('Orientation completed in demo mode. You can now ask to join.'); }} />
            )}
            {j ? <Chip label={j.status === 'confirmed' ? 'You are joined' : j.status === 'pending-approval' ? 'Waiting for organizer approval' : 'Orientation needed'} tone={j.status === 'confirmed' ? 'green' : 'saffron'} /> : null}
            <Button label={j?.status === 'confirmed' ? 'Joined' : `Join as ${r.title.toLowerCase()}`} disabled={camp.status !== 'active' || j?.status === 'confirmed'} onPress={() => doJoin(r.id)} />
          </Card>
        );
      })}

      {camp.externalBooking && (
        <Card tone="terracotta">
          <T v="h3">Donor bookings are handled by the blood centre</T>
          <T v="small" color="ink">SevaSetu never arranges, pays for or matches blood. Whether someone can donate is decided by the centre&apos;s clinicians. This booking link is a safe mock.</T>
          <Button label="Open centre booking (mock)" kind="secondary" onPress={() => setBooking(true)} />
        </Card>
      )}

      {camp.budget.length > 0 && (
        <>
          <SectionTitle>Itemised budget</SectionTitle>
          <Card>
            {camp.budget.map((b) => <Row key={b.label} style={{ justifyContent: 'space-between' }}><T v="small" color="ink">{b.label}</T><T v="small" color="ink">Rs {b.planned.toLocaleString('en-IN')}</T></Row>)}
          </Card>
          <SectionTitle action={{ label: 'Open full ledger', onPress: () => router.push(`/abhiyan/ledger/${camp.id}`) }}>Public Ledger</SectionTitle>
          <PublicLedger entries={ledger} goal={camp.goal} />
          {ledger.slice(-2).map((e) => <LedgerEntry key={e.id} e={e} />)}
          <Button label="View all entries and add a bill" onPress={() => router.push(`/abhiyan/ledger/${camp.id}`)} />
          <Button label="Donate through sandbox" kind="saffron" disabled={camp.goal === undefined} onPress={() => { setDone(false); setDonateOpen(true); }} />
          <T v="small">Received so far: Rs {inSum.toLocaleString('en-IN')}.</T>
        </>
      )}

      <SectionTitle>Progress updates</SectionTitle>
      {camp.updates.length === 0 ? <T v="small">No updates yet.</T> : camp.updates.map((u, i) => (
        <Card key={i}><T v="label">{u.at}</T><T>{u.text}</T><Chip label={u.consentConfirmed ? 'Consent confirmed' : 'Awaiting consent. Hidden'} tone={u.consentConfirmed ? 'green' : 'saffron'} /></Card>
      ))}

      <SectionTitle>Status history</SectionTitle>
      {camp.statusHistory.map((h, i) => (
        <Card key={i} tone="alt"><T v="label">{h.at} · {STATUS_LABEL[h.status]}</T><T v="small" color="ink">{h.note} ({h.by})</T></Card>
      ))}
      {camp.status !== 'active' && <Button label="Organizer: submit a correction or appeal" kind="secondary" onPress={() => setAppealOpen(true)} />}

      <Button label="Report a concern about this campaign" kind="quiet" onPress={() => setReport(true)} />

      <Sheet visible={donateOpen} onClose={() => setDonateOpen(false)} title="Sandbox donation">
        {done ? (
          <>
            <Banner tone="green" title="Recorded in the sandbox">No real money moved. In production this goes through a licensed payment partner. Your ledger line shows {anon ? '"Anonymous donor"' : 'your name only to you'}.</Banner>
            <Button label="Close" onPress={() => setDonateOpen(false)} />
          </>
        ) : (
          <>
            <Banner tone="saffron">Sandbox only. No payment is taken.</Banner>
            <Field label="Amount (Rs)" value={amount} onChangeText={setAmount} keyboardType="number-pad" />
            <ToggleRow label="Give anonymously" detail="Your identity is hidden from the public. Safety and financial compliance records are kept privately." value={anon} onChange={setAnon} />
            <Button label="Confirm sandbox donation" disabled={!(Number(amount) > 0)} onPress={() => { donate(camp.id, Number(amount), anon); soft(); setDone(true); }} />
          </>
        )}
      </Sheet>
      <Sheet visible={appealOpen} onClose={() => setAppealOpen(false)} title="Correction or appeal">
        <T>Tell reviewers what was missing and what you are attaching. A person will review it.</T>
        <Field label="Your note" value={appeal} onChangeText={setAppeal} multiline />
        <Button label="Submit" disabled={appeal.trim().length < 5} onPress={() => { submitAppeal(camp.id, appeal.trim()); setAppeal(''); setAppealOpen(false); setMsg('Your appeal was sent to the review queue.'); }} />
      </Sheet>
      <Sheet visible={booking} onClose={() => setBooking(false)} title="Centre booking (mock)">
        <Banner tone="indigo">In production this opens the blood centre&apos;s own booking system. Nothing is booked here.</Banner>
        <Button label="Close" onPress={() => setBooking(false)} />
      </Sheet>
      <ReportSheet visible={report} onClose={() => setReport(false)} targetType="Campaign" targetLabel={camp.title} />
    </Screen>
  );
}
