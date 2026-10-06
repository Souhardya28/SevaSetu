import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Animated } from 'react-native';
import { HumanStoryCard, MatchReason, ReportSheet, SafetyBanner, TrustTag, VerificationList } from '@/components/domain';
import { AppHeader, Banner, Button, Card, Chip, EmptyState, Field, Row, Screen, SectionTitle, Sheet, T, useReducedMotion } from '@/components/ui';
import { explainMatch, matchSevakToRequest } from '@/services/matching';
import { CATEGORY_LABEL } from '@/services/structuring';
import { useApp, useMe, usePerson } from '@/store/useApp';

export default function RequestDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const me = useMe();
  const req = useApp((s) => s.requests.find((r) => r.id === id));
  const person = usePerson(req?.requesterId);
  const accept = useApp((s) => s.acceptRequest);
  const [pause, setPause] = useState(false);
  const [ask, setAsk] = useState(false);
  const [question, setQuestion] = useState('');
  const [sentQ, setSentQ] = useState(false);
  const [report, setReport] = useState(false);
  const [paused, setPaused] = useState(false);

  if (!req || !me) return <Screen header={<AppHeader title="Request" />}><EmptyState title="This request is no longer available" body="It may have been matched or withdrawn." action={{ label: 'Back to Sathi', onPress: () => router.replace('/(tabs)/sathi') }} /></Screen>;

  const mine = req.requesterId === me.id;
  const m = matchSevakToRequest(me, req);

  const doAccept = () => {
    const mid = accept(req.id);
    if (mid) router.replace(`/sathi/room/${mid}`);
  };

  return (
    <Screen header={<AppHeader title={req.title} subtitle={person ? `From ${person.displayName}` : undefined} />}
      footer={!mine && req.status === 'open' ? (
        <Card style={{ margin: 16, gap: 8 }}>
          {m.eligible ? <Button label="Accept this request" onPress={() => setPause(true)} /> : <Banner tone="saffron" title="Not available to you yet">{m.blockedReason}</Banner>}
          <Button label="Ask a safe clarifying question" kind="secondary" onPress={() => setAsk(true)} />
        </Card>
      ) : undefined}>
      {person && (
        <HumanStoryCard name={person.displayName} story={req.story}>
          {person.anchorVerified && <Chip label="Verified Anchor is supporting this request" tone="indigo" />}
        </HumanStoryCard>
      )}
      <Card>
        <T v="label">WHAT THEY WOULD LIKE</T>
        <T>{req.outcome}</T>
        <Row wrap>
          <Chip label={CATEGORY_LABEL[req.category]} tone="indigo" />
          <Chip label={`${req.minutes} minutes`} tone="indigo" />
          <Chip label={req.whenLabel} tone="indigo" />
          <Chip label={req.mode === 'remote' ? 'Remote' : req.area} tone="indigo" />
          <Chip label={req.language} tone="indigo" />
          {req.accessibility.map((a) => <Chip key={a} label={a} tone="terracotta" />)}
        </Row>
        {req.offer ? <T v="small" color="ink">They offered, only if you wish: {req.offer}</T> : null}
        <T v="small">Optional gesture only. Nothing needs to be repaid.</T>
      </Card>

      {!mine && <Card tone="alt"><MatchReason text={explainMatch(m.reasons)} /></Card>}

      <SafetyBanner risk={req.risk} reasons={req.riskReasons} />

      <Card>
        <T v="h3">Boundaries set by {person?.displayName ?? 'the requester'}</T>
        {req.boundaries.map((b) => <T key={b} v="small" color="ink">• {b}</T>)}
      </Card>

      <Card tone="green">
        <T v="h3">What respectful help looks like</T>
        <T v="small" color="ink">• Ask how they would like to be helped before offering advice.</T>
        <T v="small" color="ink">• Go at their pace. Silence is not always understanding.</T>
        <T v="small" color="ink">• Keep their story private, always.</T>
        <T v="small" color="ink">• You are not expected to give medical, legal or financial advice.</T>
      </Card>

      {person && (
        <>
          <SectionTitle>{`About ${person.displayName}`}</SectionTitle>
          <Card>
            <VerificationList v={person.verification} />
            <Row wrap>{person.trustTags.map((t) => <TrustTag key={t} label={t} />)}</Row>
            <Row wrap>{person.languages.map((l) => <Chip key={l} label={l} tone="indigo" />)}</Row>
          </Card>
        </>
      )}
      {!mine && <Button label="Report a concern" kind="quiet" onPress={() => setReport(true)} />}

      <Sheet visible={pause} onClose={() => setPause(false)} title="A moment before you commit">
        <FeelFirst skippable done={() => setPaused(true)} />
        <T>This is a promise to a real person. If your plans change, you can reschedule or cancel kindly, without any public mark.</T>
        <Button label="Yes, I will be there" onPress={() => { setPause(false); doAccept(); }} />
        <Button label="Not right now" kind="quiet" onPress={() => setPause(false)} />
        {paused && <T v="small">Thank you for taking the moment.</T>}
      </Sheet>

      <Sheet visible={ask} onClose={() => setAsk(false)} title="Ask a clarifying question">
        {sentQ ? (
          <>
            <Banner tone="green">Sent. They can answer when they are ready. Please do not ask for contact details.</Banner>
            <Button label="Close" onPress={() => { setAsk(false); setSentQ(false); setQuestion(''); }} />
          </>
        ) : (
          <>
            <T v="small">Good questions: pace, language, what to bring. Avoid asking for phone numbers or personal history.</T>
            <Field label="Your question" value={question} onChangeText={setQuestion} multiline />
            <Button label="Send question" disabled={question.trim().length < 5} onPress={() => setSentQ(true)} />
          </>
        )}
      </Sheet>
      <ReportSheet visible={report} onClose={() => setReport(false)} targetType="Request" targetLabel={req.title} />
    </Screen>
  );
}

/** A short reflective pause. Never a forced timer: always skippable. */
function FeelFirst({ done }: { skippable?: boolean; done: () => void }) {
  const reduced = useReducedMotion();
  const v = useState(() => new Animated.Value(reduced ? 1 : 0))[0];
  useEffect(() => {
    if (!reduced) Animated.timing(v, { toValue: 1, duration: 1200, useNativeDriver: true }).start();
  }, [reduced, v]);
  return (
    <Card tone="indigo">
      <Animated.View style={{ opacity: v }}>
        <T v="h3">Feel first, organize afterwards</T>
        <T color="ink">Take a breath. Picture the person on the other side of this request. What would make them feel respected?</T>
      </Animated.View>
      <Button label="I have paused" kind="secondary" onPress={done} />
      <T v="small">You can skip this and continue whenever you like.</T>
    </Card>
  );
}
