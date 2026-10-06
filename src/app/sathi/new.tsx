import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { PrivacySelector, SafetyBanner, StructuredNeedPreview, VoiceRecorder } from '@/components/domain';
import { AppHeader, Banner, Button, Card, Chip, Field, Row, Screen, T, soft } from '@/components/ui';
import { assessRisk } from '@/services/safety';
import { CATEGORY_LABEL, structureNeed, StructuredNeed } from '@/services/structuring';
import { useApp } from '@/store/useApp';
import type { HelpCategory, HelpRequest, Visibility } from '@/types';

const OFFERS = ['Conversation practice', 'A skill I can share', 'Knowledge or stories', 'A thank-you note', 'Nothing right now'];
const TITLES = ['Tell us in your words', 'Check the structure', 'Something you can offer (optional)', 'Who can see this?', 'Safety review'];

export default function NewRequest() {
  const draft = useApp((s) => s.draft);
  const saveDraft = useApp((s) => s.saveDraft);
  const publish = useApp((s) => s.publishRequest);
  const login = useApp((s) => s.login);
  const offline = useApp((s) => s.settings.offline);

  const [step, setStep] = useState(0);
  const [text, setText] = useState('');
  const [need, setNeed] = useState<StructuredNeed | null>(null);
  const [offer, setOffer] = useState<string>('Nothing right now');
  const [offerText, setOfferText] = useState('');
  const [vis, setVis] = useState<Visibility>('circle');
  const [published, setPublished] = useState<HelpRequest | null>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (text.trim()) saveDraft({ originalText: text, step, updatedAt: new Date().toISOString() });
  }, [text, step, saveDraft]);

  const risk = useMemo(() => (need ? assessRisk({ text: `${text} ${need.title}`, mode: need.mode }) : null), [need, text]);

  const toStructure = () => {
    setBusy(true);
    setTimeout(() => { setNeed(structureNeed(text)); setBusy(false); setStep(1); }, offline ? 100 : 700);
  };

  const doPublish = () => {
    if (!need) return;
    const offerFinal = offer === 'Nothing right now' ? undefined : offerText.trim() || offer;
    const r = publish({ originalText: text, title: need.title, category: need.category, outcome: need.outcome, language: need.language, mode: need.mode, area: '', days: need.days, whenLabel: need.whenLabel, minutes: need.minutes, accessibility: need.accessibility, skillsNeeded: need.skillsNeeded, offer: offerFinal, visibility: vis });
    soft();
    setPublished(r);
  };

  if (published) {
    return (
      <Screen header={<AppHeader title="Request shared" back={false} />}>
        <Banner tone="green" title={published.status === 'pending-review' ? 'Sent for human review' : 'Your request is shared'}>
          {published.status === 'pending-review'
            ? 'Because this involves higher-risk help, a person will connect you with a verified organization. It is not visible to individual volunteers.'
            : `It is visible to ${published.visibility === 'private' ? 'people we suggest' : published.visibility === 'circle' ? 'your trusted circle' : 'verified Sevaks nearby'}. You stay in control and can edit or withdraw it anytime.`}
        </Banner>
        <Card tone="alt">
          <T v="h3">Demo shortcut</T>
          <T v="small" color="ink">In real use, a matching Sevak would be notified. To try the other side, continue as Aarav, a verified Sevak who selected mathematics.</T>
          <Button label="Continue as Aarav (Sevak)" onPress={() => { login('p-aarav'); router.replace(published.status === 'open' ? `/sathi/${published.id}` : '/(tabs)/sathi'); }} />
        </Card>
        <Button label="Back to Sathi" kind="secondary" onPress={() => router.replace('/(tabs)/sathi')} />
      </Screen>
    );
  }

  const footer = (
    <View style={{ padding: 16, gap: 8 }}>
      {step === 0 && <Button label="Structure my request" loading={busy} disabled={text.trim().length < 12} onPress={toStructure} />}
      {step === 1 && <Button label="Looks right, continue" onPress={() => setStep(2)} />}
      {step === 2 && <Button label="Continue" onPress={() => setStep(3)} />}
      {step === 3 && <Button label="Continue" onPress={() => setStep(4)} />}
      {step === 4 && <Button label={risk?.needsOrganization ? 'Send for human review' : 'Publish request'} onPress={doPublish} />}
      {step > 0 && <Button label="Back" kind="quiet" onPress={() => setStep(step - 1)} />}
    </View>
  );

  return (
    <Screen header={<AppHeader title={TITLES[step]} subtitle={`Step ${step + 1} of 5 · saved as a draft on this device`} />} footer={footer}>
      {step === 0 && (
        <>
          {draft && !text && <Banner tone="saffron" title="You have an unfinished draft"><Button label="Restore my draft" kind="secondary" onPress={() => { setText(draft.originalText); }} /></Banner>}
          <T v="small">Say it however feels natural, in English, Hindi or a mix. You choose what to share.</T>
          <Field label="Your request" value={text} onChangeText={setText} multiline placeholder="For example: I am finding algebra difficult and would like a patient helper…" />
          <VoiceRecorder onTranscript={(t) => setText(t)} />
        </>
      )}
      {step === 1 && need && (
        <>
          <StructuredNeedPreview need={need} original={text} />
          <Button label={editing ? 'Done editing' : 'Edit the structure'} kind="secondary" onPress={() => setEditing(!editing)} />
          {editing && (
            <Card>
              <Field label="Title" value={need.title} onChangeText={(v) => setNeed({ ...need, title: v })} />
              <Field label="Outcome you want" value={need.outcome} onChangeText={(v) => setNeed({ ...need, outcome: v })} multiline />
              <Field label="When are you free?" value={need.whenLabel} onChangeText={(v) => setNeed({ ...need, whenLabel: v })} />
              <T v="label" color="ink">Kind of help</T>
              <Row wrap>{(Object.keys(CATEGORY_LABEL) as HelpCategory[]).map((k) => <Chip key={k} label={CATEGORY_LABEL[k]} selected={need.category === k} onPress={() => setNeed({ ...need, category: k })} />)}</Row>
              <T v="label" color="ink">Remote or in person</T>
              <Row><Chip label="Remote" selected={need.mode === 'remote'} onPress={() => setNeed({ ...need, mode: 'remote' })} /><Chip label="In person" selected={need.mode === 'in-person'} onPress={() => setNeed({ ...need, mode: 'in-person' })} /></Row>
            </Card>
          )}
        </>
      )}
      {step === 2 && (
        <>
          <Banner tone="indigo">You never have to offer anything. Support is not something to be repaid. If you would like to share something, choose below.</Banner>
          <Row wrap>{OFFERS.map((o) => <Chip key={o} label={o} selected={offer === o} onPress={() => setOffer(o)} />)}</Row>
          {offer !== 'Nothing right now' && <Field label="Say more (optional)" value={offerText} onChangeText={setOfferText} />}
        </>
      )}
      {step === 3 && (
        <>
          <PrivacySelector value={vis} onChange={setVis} />
          <T v="small">Your exact address, phone number and personal history are never shown. People see only an approximate area until you choose to meet.</T>
        </>
      )}
      {step === 4 && need && risk && (
        <>
          <SafetyBanner risk={risk.level} reasons={risk.reasons} />
          <Card>
            <T v="h3">Safeguards that will apply</T>
            {risk.requirements.map((r) => <T key={r} v="small" color="ink">• {r}</T>)}
          </Card>
          <Card tone="alt">
            <T v="h3">{need.title}</T>
            <T v="small" color="ink">{need.whenLabel} · {need.mode === 'remote' ? 'Remote' : 'In person'} · {vis === 'private' ? 'Private matching' : vis === 'circle' ? 'Trusted circle' : 'Public'}</T>
            <T v="small">Offer: {offer === 'Nothing right now' ? 'None (and that is fine)' : offerText || offer}</T>
          </Card>
        </>
      )}
    </Screen>
  );
}
