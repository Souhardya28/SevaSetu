import { router, useLocalSearchParams } from 'expo-router';
import { Ban, Flag, Lock, Send, ShieldCheck } from 'lucide-react-native';
import React, { useRef, useState, useMemo } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckInControl, MeetingPlanCard, ReportSheet, ToneSuggestion } from '@/components/domain';
import { AppHeader, Banner, Button, Card, Chip, ConfirmationSheet, EmptyState, Field, Row, Sheet, T, useTheme } from '@/components/ui';
import { SAFE_PLACES } from '@/data/seed';
import type { Match } from '@/types';
import { checkTone, RESPECTFUL_OPENINGS, ToneIssue } from '@/services/tone';
import { useApp, useMe, usePerson } from '@/store/useApp';

export default function MatchRoom() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useTheme();
  const me = useMe();
  const match = useApp((s) => s.matches.find((m) => m.id === id));
  const req = useApp((s) => s.requests.find((r) => r.id === match?.requestId));
  const allMessages = useApp((s) => s.messages);
  const messages = useMemo(() => allMessages.filter((m) => m.matchId === id), [allMessages, id]);
  const trusted = useApp((s) => s.trustedContact);
  const a = useApp.getState(); // actions only; they are stable, so no subscription is needed
  const other = usePerson(match ? (match.sevakId === me?.id ? match.sahabhagiId : match.sevakId) : undefined);
  const [text, setText] = useState('');
  const [issues, setIssues] = useState<ToneIssue[]>([]);
  const [plan, setPlan] = useState(false);
  const [report, setReport] = useState(false);
  const [blockAsk, setBlockAsk] = useState(false);
  const [cancelAsk, setCancelAsk] = useState(false);
  const [resched, setResched] = useState(false);
  const [trustSheet, setTrustSheet] = useState(false);
  const [exitAsk, setExitAsk] = useState(false);
  const scroller = useRef<ScrollView>(null);

  if (!match || !me || !req) return <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}><AppHeader title="Match room" /><EmptyState title="This room is not available" body="It may have been closed." action={{ label: 'Go home', onPress: () => router.replace('/(tabs)') }} /></SafeAreaView>;

  const role = match.sevakId === me.id ? 'sevak' : 'sahabhagi';
  const done = match.status === 'completed' || match.status === 'cancelled';

  const send = (force = false) => {
    const t = text.trim();
    if (!t) return;
    const found = force ? [] : checkTone(t);
    if (found.length) { setIssues(found); return; }
    a.sendMessage(match.id, t);
    setText(''); setIssues([]);
    setTimeout(() => scroller.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top', 'left', 'right', 'bottom']}>
      <AppHeader title={other?.displayName ?? 'Match room'} subtitle={req.title}
        right={<Pressable accessibilityRole="button" accessibilityLabel="Emergency exit, leave this room and open Safety" onPress={() => setExitAsk(true)} style={{ minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' }}><ShieldCheck color={c.red} size={26} /></Pressable>} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scroller} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
          <Banner tone="indigo" icon={<Lock size={20} color={c.indigo} />} title="Protected room">Phone numbers and addresses stay masked. Contact is shared only if you both agree.</Banner>
          <MeetingPlanCard match={match} onEdit={done ? undefined : () => setPlan(true)} />
          {!done && <CheckInControl match={match} meRole={role} onCheckIn={() => a.checkIn(match.id)} onCheckOut={() => a.checkOut(match.id)} />}

          {messages.length === 0 && <T v="small">No messages yet. Try a respectful opening below.</T>}
          {messages.map((m) => m.senderId === 'system'
            ? <T key={m.id} v="small" style={{ textAlign: 'center' }}>{m.text}</T>
            : (
              <View key={m.id} accessible accessibilityLabel={`${m.senderId === me.id ? 'You' : other?.displayName}: ${m.text}`} style={{ alignSelf: m.senderId === me.id ? 'flex-end' : 'flex-start', maxWidth: '85%', backgroundColor: m.senderId === me.id ? c.indigo : c.surface, borderColor: c.border, borderWidth: m.senderId === me.id ? 0 : 1, padding: 12, borderRadius: 16 }}>
                <T style={{ color: m.senderId === me.id ? c.onIndigo : c.ink }}>{m.text}</T>
              </View>
            ))}

          {!done && (
            <>
              <T v="label">SUGGESTED OPENINGS</T>
              <Row wrap>{RESPECTFUL_OPENINGS.map((o) => <Chip key={o} label={o.slice(0, 38) + '…'} onPress={() => setText(o)} />)}</Row>
            </>
          )}

          <Card>
            <T v="h3">Your safety tools</T>
            <Row wrap>
              <Button label={trusted ? 'Trusted contact set' : 'Add trusted contact'} kind="secondary" onPress={() => setTrustSheet(true)} />
              <Button label="Report" kind="secondary" icon={<Flag size={16} color={c.indigo} />} onPress={() => setReport(true)} />
              <Button label="Block" kind="danger" icon={<Ban size={16} color={c.red} />} onPress={() => setBlockAsk(true)} />
            </Row>
            {!done && (
              <Row wrap>
                <Button label="Reschedule" kind="quiet" onPress={() => setResched(true)} />
                <Button label="Cancel kindly" kind="quiet" onPress={() => setCancelAsk(true)} />
              </Row>
            )}
          </Card>

          {match.status === 'cancelled' && <Banner tone="saffron" title="This plan was cancelled">No one is penalised. The request is open again.</Banner>}
          {!done && match.checkOut.sevak && match.checkOut.sahabhagi && <Button label="Complete this session" onPress={() => { a.completeSession(match.id); router.replace(`/sathi/complete/${match.id}`); }} />}
          {!done && !(match.checkOut.sevak && match.checkOut.sahabhagi) && <T v="small">After both of you check out, you can complete the session.</T>}
          {match.status === 'completed' && <Button label="Open private reflection and feedback" onPress={() => router.push(`/sathi/complete/${match.id}`)} />}
        </ScrollView>

        {!done && (
          <View style={{ padding: 12, gap: 8, borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.surface }}>
            <ToneSuggestion issues={issues} onUse={(i) => { setText(i.suggestion); setIssues([]); }} onKeep={() => send(true)} />
            <Row>
              <TextInput accessibilityLabel="Message" value={text} onChangeText={(v) => { setText(v); if (issues.length) setIssues([]); }} placeholder="Write a message" placeholderTextColor={c.muted}
                style={{ flex: 1, minHeight: 48, borderWidth: 1.5, borderColor: c.border, borderRadius: 14, paddingHorizontal: 14, color: c.ink, fontSize: 16, backgroundColor: c.bg }} onSubmitEditing={() => send()} />
              <Pressable accessibilityRole="button" accessibilityLabel="Send message" onPress={() => send()} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: c.indigo, alignItems: 'center', justifyContent: 'center' }}><Send color="#fff" size={20} /></Pressable>
            </Row>
          </View>
        )}
      </KeyboardAvoidingView>

      <PlanSheet visible={plan} onClose={() => setPlan(false)} match={match} />
      <TrustedSheet visible={trustSheet} onClose={() => setTrustSheet(false)} matchId={match.id} />
      <RescheduleSheet visible={resched} onClose={() => setResched(false)} matchId={match.id} />
      <ReportSheet visible={report} onClose={() => setReport(false)} targetType="Match room" targetLabel={`${other?.displayName ?? 'Person'} in ${req.title}`} />
      <ConfirmationSheet visible={blockAsk} danger title={`Block ${other?.displayName ?? 'this person'}?`} body="You will no longer see each other's requests. You can unblock later in Safety. Blocking does not notify them." confirmLabel="Block" onClose={() => setBlockAsk(false)} onConfirm={() => { if (other) a.blockPerson(other.id); a.cancelMatch(match.id, 'Blocked'); router.replace('/(tabs)/sathi'); }} />
      <ConfirmationSheet visible={cancelAsk} title="Cancel this plan?" body="Cancelling kindly is always okay. Nothing is shown publicly and no one is penalised." confirmLabel="Cancel plan" onClose={() => setCancelAsk(false)} onConfirm={() => a.cancelMatch(match.id, 'Cancelled by participant')} />
      <ConfirmationSheet visible={exitAsk} danger title="Leave this room now?" body="You will be taken to the Safety centre with helplines and a report option. Nothing is sent to the other person." confirmLabel="Leave and open Safety" onClose={() => setExitAsk(false)} onConfirm={() => router.replace('/safety')} />
    </SafeAreaView>
  );
}

function PlanSheet({ visible, onClose, match }: { visible: boolean; onClose: () => void; match: Match }) {
  const updatePlan = useApp((s) => s.updatePlan);
  const [when, setWhen] = useState(match.plan.when);
  const [place, setPlace] = useState(match.plan.place);
  const [notes, setNotes] = useState(match.plan.notes);
  const kind = place === 'Online call inside SevaSetu' ? 'online' : SAFE_PLACES.includes(place) ? 'public' : 'other';
  return (
    <Sheet visible={visible} onClose={onClose} title="Meeting plan">
      <Field label="When" value={when} onChangeText={setWhen} />
      <T v="label" color="ink">Where (public, campus or online recommended)</T>
      <Row wrap>{SAFE_PLACES.map((p) => <Chip key={p} label={p} selected={place === p} onPress={() => setPlace(p)} />)}</Row>
      <Field label="Or type another place" value={place} onChangeText={setPlace} />
      {kind === 'other' && <Banner tone="saffron">Please prefer a public or group location. A private home is only appropriate with an Anchor or organization present.</Banner>}
      <Field label="Notes" value={notes} onChangeText={setNotes} multiline />
      <Button label="Save plan" onPress={() => { updatePlan(match.id, { when, place, placeKind: kind, mode: kind === 'online' ? 'remote' : 'in-person', notes }); onClose(); }} />
    </Sheet>
  );
}

function TrustedSheet({ visible, onClose, matchId }: { visible: boolean; onClose: () => void; matchId: string }) {
  const trusted = useApp((s) => s.trustedContact);
  const set = useApp((s) => s.setTrustedContact);
  const [v, setV] = useState(trusted);
  return (
    <Sheet visible={visible} onClose={onClose} title="Trusted contact">
      <T>Name a friend or family member who knows when and where you are meeting. They are not messaged in this demo, and the name stays on this device.</T>
      <Field label="Their name" value={v} onChangeText={setV} />
      <Button label="Save" onPress={() => { set(matchId, v.trim()); onClose(); }} />
    </Sheet>
  );
}

function RescheduleSheet({ visible, onClose, matchId }: { visible: boolean; onClose: () => void; matchId: string }) {
  const resched = useApp((s) => s.rescheduleMatch);
  const [v, setV] = useState('');
  return (
    <Sheet visible={visible} onClose={onClose} title="Suggest a new time">
      <T>Rescheduling responsibly is welcome. It is not recorded as a failure.</T>
      <Field label="New time" value={v} onChangeText={setV} placeholder="e.g. Sunday, 5 PM" />
      <Button label="Send new time" disabled={!v.trim()} onPress={() => { resched(matchId, v.trim()); onClose(); }} />
    </Sheet>
  );
}
