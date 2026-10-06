import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Camera, ImageIcon, Sparkles } from 'lucide-react-native';
import React, { useState } from 'react';
import { ConditionBadge } from '@/components/domain';
import { AppHeader, Banner, Button, Card, Chip, Field, Row, Screen, T, soft, useTheme } from '@/components/ui';
import { matchItemToNeeds, suggestCategoryFromLabel } from '@/services/matching';
import { checkProhibitedItem } from '@/services/safety';
import { useApp } from '@/store/useApp';
import type { ItemListing } from '@/types';

const CATS = ['School books', 'College books', 'Stationery', 'School bags', 'Cycles', 'Clothes', 'Sewing machines', 'Assistive items', 'Small electronics', 'Furniture', 'Other approved reusable goods'];
const CONDITIONS: ItemListing['condition'][] = ['Like new', 'Good', 'Worn but usable'];
const SAMPLES = [{ label: 'Class 10 books', emoji: '📚' }, { label: 'Cycle', emoji: '🚲' }, { label: 'School bags', emoji: '🎒' }];

export default function NewItem() {
  const c = useTheme();
  const post = useApp((s) => s.postItem);
  const needs = useApp((s) => s.needs);
  const queueUpload = useApp((s) => s.queueUpload);
  const addReport = useApp((s) => s.addReport);
  const [step, setStep] = useState(0);
  const [photo, setPhoto] = useState<{ uri?: string; label: string; emoji: string } | null>(null);
  const [category, setCategory] = useState('');
  const [hint, setHint] = useState('');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [cond, setCond] = useState<ItemListing['condition']>('Good');
  const [age, setAge] = useState('1 year');
  const [qty, setQty] = useState('1');
  const [pickup, setPickup] = useState<ItemListing['pickup']>('drop-point');
  const [avail, setAvail] = useState('Weekends');
  const [aud, setAud] = useState<ItemListing['audience']>('organization');
  const [decl, setDecl] = useState(false);
  const [posted, setPosted] = useState<ItemListing | null>(null);

  const choose = (label: string, emoji: string, uri?: string) => {
    const s = suggestCategoryFromLabel(label);
    setPhoto({ uri, label, emoji: uri ? s.emoji : emoji });
    queueUpload(`Item photo: ${label}`);
    setCategory(s.category);
    setHint(s.hint);
    if (!title) setTitle(label === 'Class 10 books' ? 'Class 10 Maths, Science and Social Science books' : label);
    if (label === 'Class 10 books' && !desc) setDesc('Maharashtra board textbooks, a few pencil marks, no missing pages.');
    soft();
    setStep(1);
  };

  const pick = async (camera: boolean) => {
    try {
      const res = camera ? await ImagePicker.launchCameraAsync({ quality: 0.5 }) : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.5 });
      if (!res.canceled && res.assets[0]) choose('Item photo', '📦', res.assets[0].uri);
    } catch { setHint('Could not open the photo picker. Choose a sample instead.'); }
  };

  const text = `${title} ${desc}`;
  const blocked = checkProhibitedItem(text);
  const draft = { category, title, description: desc };
  const suggestions = matchItemToNeeds(draft, needs);

  const publish = () => {
    const item = post({ title, category, description: desc, condition: cond, conditionConfirmed: false, age, quantity: Number(qty) || 1, area: 'Kothrud, Pune (approximate)', pickup, availability: avail, audience: aud, emoji: photo?.emoji ?? '📦' });
    setPosted(item);
  };

  if (posted) {
    return (
      <Screen header={<AppHeader title="Listing shared" back={false} />}>
        <Banner tone="green" title="Thank you for sharing">Your exact address is never shown. Pick a need to start a safe handover.</Banner>
        <Button label="Choose a nearby need" onPress={() => router.replace(`/daan/${posted.id}`)} />
        <Button label="Back to Daan" kind="quiet" onPress={() => router.replace('/(tabs)/daan')} />
      </Screen>
    );
  }

  return (
    <Screen header={<AppHeader title={['Add a photo', 'Check the details', 'Nearby needs', 'Safety and share'][step]} subtitle={`Step ${step + 1} of 4`} />}>
      {step === 0 && (
        <>
          <T v="small">A photo helps people see what you are offering. We suggest a category from it, and you can always correct us.</T>
          <Row wrap>
            <Button label="Choose photo" kind="secondary" icon={<ImageIcon size={18} color={c.indigo} />} onPress={() => pick(false)} />
            <Button label="Take photo" kind="secondary" icon={<Camera size={18} color={c.indigo} />} onPress={() => pick(true)} />
          </Row>
          <T v="label">OR TRY A SAMPLE PHOTO (DEMO)</T>
          <Row wrap>{SAMPLES.map((s) => <Chip key={s.label} label={`${s.emoji} ${s.label}`} onPress={() => choose(s.label, s.emoji)} />)}</Row>
        </>
      )}

      {step === 1 && photo && (
        <>
          <Card tone="alt">
            {photo.uri ? <Image source={{ uri: photo.uri }} style={{ width: '100%', height: 160, borderRadius: 12 }} contentFit="cover" accessibilityLabel="Your item photo" /> : <T style={{ fontSize: 56, lineHeight: 70 }} accessibilityLabel={`Sample photo of ${photo.label}`}>{photo.emoji}</T>}
            <Row><Sparkles size={18} color={c.saffron} /><T v="small" color="ink" style={{ flex: 1 }}>AI suggestion: {category}. {hint} A photo cannot guarantee condition.</T></Row>
          </Card>
          <T v="label" color="ink">Category (change if we got it wrong)</T>
          <Row wrap>{CATS.map((k) => <Chip key={k} label={k} selected={category === k} onPress={() => setCategory(k)} />)}</Row>
          <Field label="Title" value={title} onChangeText={setTitle} />
          <Field label="Description" value={desc} onChangeText={setDesc} multiline hint="Mention anything that is worn, missing or not working." />
          <T v="label" color="ink">Condition (you decide)</T>
          <Row wrap>{CONDITIONS.map((k) => <Chip key={k} label={k} selected={cond === k} onPress={() => setCond(k)} />)}</Row>
          <Field label="Approximate age" value={age} onChangeText={setAge} />
          <Field label="Quantity" value={qty} onChangeText={setQty} keyboardType="number-pad" />
          <Field label="When are you available?" value={avail} onChangeText={setAvail} />
          <T v="label" color="ink">Handover</T>
          <Row wrap>
            <Chip label="Public or campus drop point" selected={pickup === 'drop-point'} onPress={() => setPickup('drop-point')} />
            <Chip label="Partner pickup" selected={pickup === 'partner'} onPress={() => setPickup('partner')} />
            <Chip label="Pickup from me" selected={pickup === 'pickup'} onPress={() => setPickup('pickup')} />
          </Row>
          <T v="label" color="ink">Who may ask for it?</T>
          <Row><Chip label="Organizations only" selected={aud === 'organization'} onPress={() => setAud('organization')} /><Chip label="Individuals too" selected={aud === 'individual'} onPress={() => setAud('individual')} /></Row>
          {blocked && (
            <Banner tone="red" title={`${blocked} are not accepted`}>
              This listing cannot be posted. If you think this is a mistake, you can report it for a person to review.
              <Button label="Report for review" kind="quiet" onPress={() => addReport({ targetType: 'Daan listing', targetLabel: title || 'My listing', reason: 'Flagged by mistake', detail: text })} />
            </Banner>
          )}
          <Button label="See nearby needs" disabled={!title.trim() || !category || !!blocked} onPress={() => setStep(2)} />
        </>
      )}

      {step === 2 && (
        <>
          <ConditionBadge item={{ condition: cond, conditionConfirmed: false } as ItemListing} />
          {suggestions.length === 0 ? <Banner tone="indigo">No matching needs yet. You can still share, and we will tell you when one appears.</Banner> : (
            <Banner tone="green" title="Matches nearby">{suggestions.map((s) => s.why).join(' ')}</Banner>
          )}
          {suggestions.map(({ need }) => (
            <Card key={need.id}>
              <T v="h3">{need.requesterLabel}</T>
              <T v="small" color="ink">{need.text}</T>
              <T v="small">{need.distanceKm.toFixed(1)} km away</T>
            </Card>
          ))}
          <Button label="Continue" onPress={() => setStep(3)} />
        </>
      )}

      {step === 3 && (
        <>
          <Card>
            <T v="h3">Safety declaration</T>
            <T v="small" color="ink">I confirm this item is safe, legal to give, and not a medicine, open food, weapon, counterfeit, recalled or unsafe electrical product. I will meet in a public or partner place.</T>
            <Chip label={decl ? 'I confirm' : 'Tap to confirm'} selected={decl} onPress={() => setDecl(!decl)} />
          </Card>
          <Button label="Share this item" disabled={!decl || !!blocked} onPress={publish} />
        </>
      )}
      {step > 0 && <Button label="Back" kind="quiet" onPress={() => setStep(step - 1)} />}
    </Screen>
  );
}
