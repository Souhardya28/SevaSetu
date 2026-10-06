import { router } from 'expo-router';
import {
  BadgeCheck, BookOpen, CalendarClock, CheckCircle2, CircleDashed, Eye, Gift, Handshake, HeartHandshake, Lock, Mic, ShieldAlert,
  ShieldCheck, Sparkles, Square, Users, Globe, MapPin, Clock, TriangleAlert, Flag,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Banner, Button, Card, Chip, Field, Row, Sheet, T, tap, useReducedMotion, useTheme, soft } from '@/components/ui';
import { space } from '@/constants/theme';
import { DEMO_TRANSCRIPT, StructuredNeed, CATEGORY_LABEL } from '@/services/structuring';
import { riskLabel } from '@/services/safety';
import { receiptLabel } from '@/services/ocr';
import type { ToneIssue } from '@/services/tone';
import { useApp } from '@/store/useApp';
import type {
  Campaign, ItemListing, LedgerEntry as LedgerEntryT, Match, Organization, Passage, Prasad, ReceiptStatus, Risk, Verification, Visibility,
} from '@/types';
import type { ThemeCount } from '@/services/path';

/* ---------- Brand ---------- */
export function BridgeMark({ size = 64 }: { size?: number }) {
  const c = useTheme();
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessibilityLabel="SevaSetu bridge mark">
      <Path d="M6 44 Q32 8 58 44" stroke={c.indigo} strokeWidth={4} fill="none" strokeLinecap="round" />
      <Path d="M6 50 H58" stroke={c.saffron} strokeWidth={4} strokeLinecap="round" />
      <Circle cx={6} cy={44} r={5} fill={c.indigo} />
      <Circle cx={58} cy={44} r={5} fill={c.indigo} />
      <Circle cx={32} cy={23} r={4} fill={c.saffron} />
    </Svg>
  );
}

/* ---------- Badges ---------- */
export function TrustBadge({ label, tone = 'green' }: { label: string; tone?: 'green' | 'indigo' | 'saffron' | 'red' }) {
  const c = useTheme();
  return <Chip label={label} tone={tone} icon={<ShieldCheck size={16} color={{ green: c.green, indigo: c.indigo, saffron: c.saffron, red: c.red }[tone]} />} />;
}
export const TrustTag = ({ label }: { label: string }) => <Chip label={label} tone="terracotta" />;

export function VerificationBadge({ ok, label }: { ok: boolean | 'pending'; label: string }) {
  const c = useTheme();
  const Icon = ok === true ? BadgeCheck : CircleDashed;
  return (
    <Row accessible accessibilityLabel={`${label}: ${ok === true ? 'verified' : ok === 'pending' ? 'pending' : 'not yet'}`}>
      <Icon size={20} color={ok === true ? c.green : c.muted} />
      <T v="small" color="ink">{label}</T>
      <T v="label" color={ok === true ? 'green' : 'muted'}>{ok === true ? 'Verified' : ok === 'pending' ? 'Pending' : 'Not yet'}</T>
    </Row>
  );
}

export function VerificationList({ v }: { v: Verification }) {
  return (
    <View style={{ gap: 8 }}>
      <VerificationBadge ok={v.phone} label="Phone" />
      <VerificationBadge ok={v.college} label="College affiliation" />
      <VerificationBadge ok={v.identity === 'completed' ? true : v.identity === 'pending' ? 'pending' : false} label="Identity check (result only)" />
      <VerificationBadge ok={v.orientation} label="Safety orientation" />
    </View>
  );
}

export function TransparencyStatus({ status }: { status: ReceiptStatus | 'ok' }) {
  const tone = status === 'verified' || status === 'ok' || status === 'corrected' ? 'green' : status === 'pending' || status === 'missing' ? 'saffron' : 'terracotta';
  const label = status === 'ok' ? 'Transparent' : receiptLabel[status];
  const c = useTheme();
  const Icon = tone === 'green' ? CheckCircle2 : tone === 'saffron' ? CircleDashed : TriangleAlert;
  return <Chip label={label} tone={tone} icon={<Icon size={16} color={tone === 'green' ? c.green : tone === 'saffron' ? c.saffron : c.terracotta} />} />;
}

export function ConditionBadge({ item }: { item: ItemListing }) {
  return (
    <Row wrap>
      <Chip label={item.condition} tone="indigo" />
      <Chip label={item.conditionConfirmed ? 'Condition confirmed' : 'Condition not yet confirmed'} tone={item.conditionConfirmed ? 'green' : 'saffron'} />
    </Row>
  );
}

/* ---------- Cards ---------- */
export function PrimaryActionCard({ icon, title, onPress }: { icon: React.ReactNode; title: string; onPress: () => void }) {
  return (
    <Card onPress={onPress} label={title} style={{ flex: 1, minHeight: 104, justifyContent: 'center', alignItems: 'flex-start' }}>
      {icon}
      <T v="h3">{title}</T>
    </Card>
  );
}

export function HumanStoryCard({ name, story, children, onPress }: { name: string; story: string; children?: React.ReactNode; onPress?: () => void }) {
  const c = useTheme();
  return (
    <Card onPress={onPress} label={`${name}. ${story}`}>
      <Row gap={space.md} style={{ alignItems: 'flex-start' }}>
        <View style={[styles.avatar, { backgroundColor: c.terracottaSoft }]}><T v="h3" color="terracotta">{name.charAt(0)}</T></View>
        <View style={{ flex: 1, gap: 4 }}>
          <T v="h3">{name}</T>
          <T v="body">{story}</T>
        </View>
      </Row>
      {children}
    </Card>
  );
}

export function MatchReason({ text }: { text: string }) {
  const c = useTheme();
  return (
    <Row gap={8} style={{ alignItems: 'flex-start' }} accessible accessibilityLabel={`Why this matches you. ${text}`}>
      <Sparkles size={18} color={c.saffron} style={{ marginTop: 2 }} />
      <T v="small" color="ink" style={{ flex: 1 }}>{text}</T>
    </Row>
  );
}

export function OpportunityCard({ title, meta, why, badges, onPress, onDismiss }: {
  title: string; meta: string; why?: string; badges?: React.ReactNode; onPress: () => void; onDismiss?: () => void;
}) {
  return (
    <Card onPress={onPress} label={`${title}. ${meta}`}>
      <T v="h3">{title}</T>
      <T v="small">{meta}</T>
      {badges ? <Row wrap>{badges}</Row> : null}
      {why ? <MatchReason text={why} /> : null}
      {onDismiss ? <Button label="Not interested" kind="quiet" onPress={onDismiss} a11y={`Not interested in ${title}`} /> : null}
    </Card>
  );
}

export function SafetyBanner({ risk, reasons = [] }: { risk: Risk; reasons?: string[] }) {
  const c = useTheme();
  const tone = risk === 'low' ? 'green' : risk === 'medium' ? 'saffron' : 'red';
  const Icon = risk === 'low' ? ShieldCheck : ShieldAlert;
  return (
    <Banner tone={tone} title={riskLabel[risk]} icon={<Icon size={22} color={{ green: c.green, saffron: c.saffron, red: c.red }[tone]} />}>
      <T v="small" color="ink">
        {risk === 'low' ? 'Low-risk help. Standard Code of Conduct applies.' : risk === 'medium' ? 'Meet in a public or group place and use check-in and check-out.' : 'This needs a verified organization, a trained role and human approval.'}
        {reasons.length ? ` ${reasons.join('. ')}.` : ''}
      </T>
    </Banner>
  );
}

export function PrivacySelector({ value, onChange }: { value: Visibility; onChange: (v: Visibility) => void }) {
  const c = useTheme();
  const opts: { v: Visibility; label: string; body: string; icon: React.ReactNode }[] = [
    { v: 'private', label: 'Private matching', body: 'Only people we suggest can see it.', icon: <Lock size={20} color={c.indigo} /> },
    { v: 'circle', label: 'Trusted campus or community circle', body: 'Verified people in your circle.', icon: <Users size={20} color={c.indigo} /> },
    { v: 'public', label: 'Public opportunity', body: 'Visible to verified Sevaks nearby. Never shows address or phone.', icon: <Globe size={20} color={c.indigo} /> },
  ];
  return (
    <View style={{ gap: 8 }} accessibilityRole="radiogroup">
      {opts.map((o) => (
        <Pressable key={o.v} accessibilityRole="radio" accessibilityState={{ selected: value === o.v }} accessibilityLabel={`${o.label}. ${o.body}`} onPress={() => { tap(); onChange(o.v); }}
          style={[styles.option, { borderColor: value === o.v ? c.indigo : c.border, backgroundColor: value === o.v ? c.indigoSoft : c.surface }]}>
          {o.icon}
          <View style={{ flex: 1 }}><T v="h3">{o.label}</T><T v="small">{o.body}</T></View>
          {value === o.v && <CheckCircle2 size={22} color={c.indigo} />}
        </Pressable>
      ))}
    </View>
  );
}

/* ---------- Voice (simulated: no microphone in demo mode) ---------- */
export function VoiceRecorder({ onTranscript }: { onTranscript: (t: string) => void }) {
  const c = useTheme();
  const reduced = useReducedMotion();
  const [state, setState] = useState<'idle' | 'recording' | 'transcribing' | 'done'>('idle');
  const [secs, setSecs] = useState(0);
  const pulse = useState(() => new Animated.Value(1))[0];
  const queueUpload = useApp((s) => s.queueUpload);
  const offline = useApp((s) => s.settings.offline);

  useEffect(() => {
    if (state !== 'recording') return;
    const t = setInterval(() => setSecs((x) => x + 1), 1000);
    if (!reduced) Animated.loop(Animated.sequence([Animated.timing(pulse, { toValue: 1.15, duration: 600, useNativeDriver: true }), Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true })])).start();
    return () => { clearInterval(t); pulse.stopAnimation(); pulse.setValue(1); };
  }, [state, reduced, pulse]);

  const stop = () => {
    setState('transcribing');
    queueUpload('Voice note');
    setTimeout(() => { setState('done'); onTranscript(DEMO_TRANSCRIPT); soft(); }, 900);
  };

  return (
    <Card tone="indigo" style={{ alignItems: 'center', gap: space.md }}>
      <Animated.View style={{ transform: [{ scale: pulse }] }}>
        <Pressable
          accessibilityRole="button" accessibilityLabel={state === 'recording' ? 'Stop recording' : 'Start voice request'}
          onPress={() => { tap(); if (state === 'recording') stop(); else { setSecs(0); setState('recording'); } }}
          style={[styles.mic, { backgroundColor: state === 'recording' ? c.red : c.indigo }]}>
          {state === 'recording' ? <Square size={26} color="#fff" /> : <Mic size={30} color="#fff" />}
        </Pressable>
      </Animated.View>
      {state === 'transcribing' ? <Row><ActivityIndicator color={c.indigo} /><T v="small" color="ink">Transcribing…</T></Row> : (
        <T v="small" color="ink" style={{ textAlign: 'center' }} accessibilityLiveRegion="polite">
          {state === 'idle' ? 'Tap to speak in your own words' : state === 'recording' ? `Recording… ${secs}s. Tap to stop.` : offline ? 'Saved on this device. Upload will retry when you are online.' : 'Transcript added below. You can edit it.'}
        </T>
      )}
      <T v="small" style={{ textAlign: 'center' }}>Demo mode: no microphone is used. A sample transcript stands in for speech-to-text.</T>
    </Card>
  );
}

export function StructuredNeedPreview({ need, original }: { need: StructuredNeed; original: string }) {
  return (
    <View style={{ gap: space.md }}>
      <Card tone="alt">
        <T v="label">YOUR WORDS (kept exactly)</T>
        <T accessibilityLabel={`Your original words: ${original}`}>{original}</T>
      </Card>
      <Card>
        <Row><Sparkles size={18} color="#C9611A" /><T v="label">SUGGESTED STRUCTURE (AI-assisted, edit anything)</T></Row>
        <T v="h3">{need.title}</T>
        <T v="small" color="ink">Outcome you want: {need.outcome}</T>
        <Row wrap>
          <Chip label={CATEGORY_LABEL[need.category]} tone="indigo" />
          <Chip label={need.language} tone="indigo" />
          <Chip label={need.mode === 'remote' ? 'Remote' : 'In person'} tone="indigo" />
          <Chip label={`${need.minutes} min`} tone="indigo" />
          <Chip label={need.whenLabel} tone="indigo" />
          {need.accessibility.map((a) => <Chip key={a} label={a} tone="terracotta" />)}
        </Row>
        {need.notes.map((n) => <T key={n} v="small" color="saffron">• {n}</T>)}
        <T v="small">Confidence: {need.confidence}. This is a suggestion, not a certainty.</T>
      </Card>
    </View>
  );
}

export function ToneSuggestion({ issues, onUse, onKeep }: { issues: ToneIssue[]; onUse: (i: ToneIssue) => void; onKeep: () => void }) {
  if (!issues.length) return null;
  return (
    <Banner tone="saffron" title="A gentle thought about your wording">
      {issues.map((i) => (
        <View key={i.matched} style={{ gap: 6, marginTop: 4 }}>
          <T v="small" color="ink">&quot;{i.matched}&quot;: {i.why}</T>
          <T v="small" color="ink">Suggestion: &quot;{i.suggestion}&quot;</T>
          <Row wrap>
            <Button label="Use suggestion" kind="secondary" onPress={() => onUse(i)} />
            <Button label="Keep mine" kind="quiet" onPress={onKeep} />
          </Row>
        </View>
      ))}
    </Banner>
  );
}

export function MeetingPlanCard({ match, onEdit }: { match: Match; onEdit?: () => void }) {
  const c = useTheme();
  const p = match.plan;
  return (
    <Card>
      <Row><CalendarClock size={20} color={c.indigo} /><T v="h3">Meeting plan</T></Row>
      <Row><Clock size={16} color={c.muted} /><T v="small" color="ink">{p.when}</T></Row>
      <Row><MapPin size={16} color={c.muted} /><T v="small" color="ink">{p.place}</T></Row>
      {p.placeKind === 'other' && <T v="small" color="red">A public or group location is strongly recommended.</T>}
      {p.notes ? <T v="small">{p.notes}</T> : null}
      {onEdit && <Button label="Edit plan" kind="secondary" onPress={onEdit} />}
    </Card>
  );
}

export function CheckInControl({ match, meRole, onCheckIn, onCheckOut }: { match: Match; meRole: 'sevak' | 'sahabhagi'; onCheckIn: () => void; onCheckOut: () => void }) {
  const mine = match.checkIn[meRole];
  const out = match.checkOut[meRole];
  const other = meRole === 'sevak' ? 'sahabhagi' : 'sevak';
  return (
    <Card>
      <T v="h3">Check-in and check-out</T>
      <T v="small">Both of you check in when you meet and check out when you part. Nothing is public.</T>
      <Row wrap>
        <Chip label={mine ? 'You checked in' : 'You have not checked in'} tone={mine ? 'green' : 'saffron'} />
        <Chip label={match.checkIn[other] ? 'They checked in' : 'Waiting for them'} tone={match.checkIn[other] ? 'green' : 'saffron'} />
      </Row>
      {!mine ? <Button label="Check in" onPress={onCheckIn} /> : !out ? <Button label="Check out" kind="secondary" onPress={onCheckOut} /> : <Chip label="You checked out safely" tone="green" />}
    </Card>
  );
}

export function ReflectionPrompt({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return <Field label={label} value={value} onChangeText={onChange} multiline placeholder="Write as much or as little as you like" />;
}

export function GrowthTheme({ theme }: { theme: ThemeCount }) {
  const c = useTheme();
  return (
    <Card tone="indigo" style={{ gap: 6 }}>
      <Row><HeartHandshake size={20} color={c.indigo} /><T v="h3">{theme.quality}</T></Row>
      <T v="small" color="ink">Appears in your own reflections. Not a score.</T>
      {theme.evidence.slice(0, 2).map((r) => (
        <T key={r.id} v="small" color="ink">“{r.taught}”</T>
      ))}
    </Card>
  );
}

export function PrasadCard({ p, onOpen, onReport, onDelete }: { p: Prasad; onOpen: () => void; onReport: () => void; onDelete: () => void }) {
  const c = useTheme();
  const reduced = useReducedMotion();
  const v = useState(() => new Animated.Value(p.opened ? 1 : 0))[0];
  const open = () => {
    soft();
    onOpen();
    if (reduced) v.setValue(1); else Animated.timing(v, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  };
  return (
    <Card tone="saffron">
      <Row><Gift size={22} color={c.saffron} /><T v="h3">A Prasad from a past act of service</T></Row>
      {!p.opened ? (
        <>
          <T v="small" color="ink">Someone chose to send you a private note. There is no need to reply.</T>
          <Button label="Open gently" kind="saffron" onPress={open} />
        </>
      ) : (
        <Animated.View style={{ opacity: v, gap: 8 }}>
          <T>{p.text}</T>
          <T v="small">Private to you. Never shared publicly without separate consent.</T>
          <Row wrap>
            <Button label="Report" kind="quiet" icon={<Flag size={16} color={c.indigo} />} onPress={onReport} />
            <Button label="Delete" kind="quiet" onPress={onDelete} />
          </Row>
          {p.reported && <Chip label="Reported to moderators" tone="indigo" />}
        </Animated.View>
      )}
    </Card>
  );
}

/* ---------- Campaigns ---------- */
export function CampaignCard({ c: camp, why, onPress, onDismiss }: { c: Campaign; why?: string; onPress: () => void; onDismiss?: () => void }) {
  const open = camp.roles.reduce((n, r) => n + Math.max(r.slots - r.filled, 0), 0);
  return (
    <OpportunityCard
      title={camp.title}
      meta={`${camp.category} · ${camp.distanceKm.toFixed(1)} km · ${camp.commitment}`}
      why={why}
      onPress={onPress}
      onDismiss={onDismiss}
      badges={<>
        <TrustBadge label="Verified organizer" />
        <Chip label={`${open} volunteer spots open`} tone="indigo" />
        <TransparencyStatus status={camp.status === 'active' ? 'ok' : 'pending'} />
        {camp.status !== 'active' && <Chip label={camp.status === 'under-review' ? 'Under review' : camp.status} tone="saffron" />}
      </>}
    />
  );
}

export function OrganizerDossier({ org }: { org: Organization }) {
  return (
    <Card>
      <T v="h3">{org.name}</T>
      <T v="small">{org.kind}. Verified {org.verifiedOn}.</T>
      {org.dossier.map((d) => <VerificationBadge key={d.label} ok={d.status === 'verified' ? true : 'pending'} label={d.label} />)}
      <T v="small">{org.contactLabel}</T>
    </Card>
  );
}

export function LedgerEntry({ e, onPress }: { e: LedgerEntryT; onPress?: () => void }) {
  const c = useTheme();
  const amt = `${e.kind === 'in' ? '+' : '−'} Rs ${e.amount.toLocaleString('en-IN')}`;
  return (
    <Card onPress={onPress} label={`${e.date}. ${e.purpose}. ${amt}. ${receiptLabel[e.receipt]}`}>
      <Row style={{ justifyContent: 'space-between' }}>
        <T v="label">{e.date}</T>
        <T v="h3" style={{ color: e.kind === 'in' ? c.green : c.ink }}>{amt}</T>
      </Row>
      <T v="body">{e.purpose}</T>
      <T v="small">{e.category}{e.vendor ? ` · ${e.vendor}` : ''}{e.anonymous ? ' · Anonymous donor' : ''}</T>
      <Row wrap>
        {e.kind === 'out' && <TransparencyStatus status={e.receipt} />}
        <Chip label={e.human === 'reviewed' ? 'Human reviewed' : e.human === 'pending' ? 'Awaiting human review' : 'Recorded'} tone={e.human === 'pending' ? 'saffron' : 'green'} />
        {e.redacted && <Chip label="Receipt redacted" tone="indigo" icon={<Eye size={14} color={c.indigo} />} />}
      </Row>
      {e.note ? <T v="small" color="ink">{e.note}</T> : null}
    </Card>
  );
}

export function PublicLedger({ entries, goal }: { entries: LedgerEntryT[]; goal?: number }) {
  const inSum = entries.filter((e) => e.kind === 'in').reduce((n, e) => n + e.amount, 0);
  const outSum = entries.filter((e) => e.kind === 'out').reduce((n, e) => n + e.amount, 0);
  const cats = Object.entries(entries.filter((e) => e.kind === 'out').reduce<Record<string, number>>((m, e) => ({ ...m, [e.category]: (m[e.category] ?? 0) + e.amount }), {}));
  return (
    <View style={{ gap: space.md }}>
      <Card tone="indigo">
        <T v="label">PUBLIC LEDGER SUMMARY</T>
        <Row style={{ justifyContent: 'space-between' }}><T>Money received</T><T v="h3">Rs {inSum.toLocaleString('en-IN')}</T></Row>
        <Row style={{ justifyContent: 'space-between' }}><T>Spent so far</T><T v="h3">Rs {outSum.toLocaleString('en-IN')}</T></Row>
        <Row style={{ justifyContent: 'space-between' }}><T>Remaining</T><T v="h3">Rs {(inSum - outSum).toLocaleString('en-IN')}</T></Row>
        {goal ? <T v="small">Goal: Rs {goal.toLocaleString('en-IN')}</T> : null}
      </Card>
      {cats.length > 0 && (
        <Card>
          <T v="h3">Spending by category</T>
          {cats.map(([k, n]) => <Row key={k} style={{ justifyContent: 'space-between' }}><T v="small" color="ink">{k}</T><T v="small" color="ink">Rs {n.toLocaleString('en-IN')}</T></Row>)}
        </Card>
      )}
    </View>
  );
}

export function ReceiptReview({ e }: { e: LedgerEntryT }) {
  const c = useTheme();
  return (
    <Card tone="alt">
      <Row><BookOpen size={18} color={c.indigo} /><T v="h3">Receipt (redacted)</T></Row>
      <T v="small" color="ink">Vendor: {e.vendor ?? 'n/a'}. Amount: Rs {e.amount.toLocaleString('en-IN')}. Date: {e.date}.</T>
      <T v="small">Phone numbers, patient IDs, addresses, bank details and tax IDs are blacked out before publication.</T>
    </Card>
  );
}

/* ---------- Daan ---------- */
export function ItemCard({ item, onPress }: { item: ItemListing; onPress: () => void }) {
  return (
    <Card onPress={onPress} label={`${item.title}. ${item.condition}. ${item.area}`}>
      <Row gap={space.md} style={{ alignItems: 'flex-start' }}>
        <View style={styles.emojiBox}><T style={{ fontSize: 34, lineHeight: 42 }}>{item.emoji}</T></View>
        <View style={{ flex: 1, gap: 4 }}>
          <T v="h3">{item.title}</T>
          <T v="small">{item.category} · Qty {item.quantity} · {item.area}</T>
          <ConditionBadge item={item} />
          {item.status !== 'available' && <Chip label={item.status === 'reserved' ? 'Reserved' : item.status === 'handed-over' ? 'Handed over' : 'Closed'} tone="saffron" />}
        </View>
      </Row>
    </Card>
  );
}

export function HandoverCard({ code, point, status }: { code: string; point: string; status: string }) {
  const c = useTheme();
  return (
    <Card tone="green">
      <Row><Handshake size={22} color={c.green} /><T v="h3">Handover</T></Row>
      <T v="small" color="ink">Pickup point: {point}</T>
      <T v="small" color="ink">Share this code only at handover:</T>
      <T v="display" accessibilityLabel={`Pickup code ${code.split('').join(' ')}`} style={{ letterSpacing: 6 }}>{code}</T>
      <Chip label={status} tone="green" />
    </Card>
  );
}

/* ---------- Guide ---------- */
export function SourceCitationCard({ p }: { p: Passage }) {
  const c = useTheme();
  return (
    <Card tone="indigo" style={{ borderLeftWidth: 4, borderLeftColor: c.saffron }}>
      <Row wrap>
        <Chip label={p.kind === 'direct-quote' ? 'Direct quotation' : 'Paraphrase (not a quote)'} tone={p.kind === 'direct-quote' ? 'indigo' : 'saffron'} />
        <Chip label="Demo passage: editorial verification pending" tone="terracotta" />
      </Row>
      <T accessibilityLabel={`${p.kind === 'direct-quote' ? 'Quotation' : 'Paraphrase'}: ${p.text}`} style={{ fontStyle: p.kind === 'direct-quote' ? 'italic' : 'normal' }}>
        {p.kind === 'direct-quote' ? `“${p.text}”` : p.text}
      </T>
      <T v="small" color="ink">Source: {p.work}, {p.chapter}. {p.location}.</T>
    </Card>
  );
}

export function SevaGuideButton({ bottom }: { bottom: number }) {
  const c = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Open Seva Guide" onPress={() => { tap(); router.push('/guide'); }}
      style={[styles.fab, { backgroundColor: c.surface, borderColor: c.indigo, bottom }]}>
      <Sparkles size={20} color={c.saffron} />
      <T v="label" color="indigo">Guide</T>
    </Pressable>
  );
}

/* ---------- Sheets ---------- */
export function ConsentSheet({ visible, onClose, onAgree, title, body }: { visible: boolean; onClose: () => void; onAgree: () => void; title: string; body: string }) {
  const [ok, setOk] = useState(false);
  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      <T>{body}</T>
      <Chip label={ok ? 'I understand and consent' : 'Tap to confirm you understand'} selected={ok} onPress={() => setOk(!ok)} />
      <Button label="Agree" disabled={!ok} onPress={() => { setOk(false); onAgree(); }} />
      <Button label="Not now" kind="quiet" onPress={onClose} />
    </Sheet>
  );
}

export const REPORT_REASONS = ['I felt unsafe', 'Disrespectful or demeaning language', 'Asked for money or contact details', 'Did not respect my boundaries', 'Suspicious listing or campaign', 'Something else'];

export function ReportSheet({ visible, onClose, targetType, targetLabel }: { visible: boolean; onClose: () => void; targetType: string; targetLabel: string }) {
  const addReport = useApp((s) => s.addReport);
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState('');
  const [sent, setSent] = useState(false);
  const close = () => { setReason(''); setDetail(''); setSent(false); onClose(); };
  return (
    <Sheet visible={visible} onClose={close} title="Report a concern">
      {sent ? (
        <>
          <Banner tone="green" title="Thank you. Your report was received.">A person on the safety team will review it. Evidence is preserved. You can appeal any outcome. If you are in danger now, contact the emergency number from the Safety screen.</Banner>
          <Button label="Close" onPress={close} />
        </>
      ) : (
        <>
          <T v="small">About: {targetLabel}</T>
          <Row wrap>{REPORT_REASONS.map((r) => <Chip key={r} label={r} selected={reason === r} onPress={() => setReason(r)} />)}</Row>
          <Field label="Anything else you want us to know (optional)" value={detail} onChangeText={setDetail} multiline />
          <Button label="Send report" disabled={!reason} onPress={() => { addReport({ targetType, targetLabel, reason, detail }); setSent(true); }} />
        </>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1.5, minHeight: 64 },
  mic: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' },
  emojiBox: { width: 60, height: 60, borderRadius: 14, backgroundColor: '#F3ECDD', alignItems: 'center', justifyContent: 'center' },
  fab: { position: 'absolute', right: 16, minHeight: 48, paddingHorizontal: 16, borderRadius: 24, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', gap: 8, elevation: 4, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
});
