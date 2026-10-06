import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { CheckCircle2, Circle } from 'lucide-react-native';
import React, { useState, useMemo } from 'react';
import { ActivityIndicator } from 'react-native';
import { TransparencyStatus } from '@/components/domain';
import { AppHeader, Banner, Button, Card, Chip, EmptyState, Row, Screen, SectionTitle, T, soft, useTheme } from '@/components/ui';
import { analyzeBill, BillFinding, ExtractedBill, SAMPLE_BILLS } from '@/services/ocr';
import { useApp } from '@/store/useApp';

const STEPS = ['Reading the bill', 'Extracting vendor, date, amount and items', 'Checking for a possible duplicate', 'Comparing with the ledger amount', 'Comparing with the stated budget purpose', 'Flagging anything uncertain for a person'];

export default function BillScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useTheme();
  const camp = useApp((s) => s.campaigns.find((x) => x.id === id));
  const allLedger = useApp((s) => s.ledger);
  const ledger = useMemo(() => allLedger.filter((l) => l.campaignId === id), [allLedger, id]);
  const apply = useApp((s) => s.applyBillFindings);
  const queueUpload = useApp((s) => s.queueUpload);
  const offline = useApp((s) => s.settings.offline);
  const login = useApp((s) => s.login);
  const [uri, setUri] = useState<string | null>(null);
  const [step, setStep] = useState(-1);
  const [bill, setBill] = useState<ExtractedBill | null>(null);
  const [findings, setFindings] = useState<BillFinding[]>([]);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');

  if (!camp) return <Screen header={<AppHeader title="Bill" />}><EmptyState title="Not found" body="This campaign does not exist." /></Screen>;

  const run = (key: 'A' | 'B', imageUri?: string) => {
    setUri(imageUri ?? null); setBill(null); setFindings([]); setSent(false); setErr('');
    queueUpload(`Bill photo for ${camp.title}`);
    let i = 0;
    setStep(0);
    const timer = setInterval(() => {
      i += 1;
      if (i >= STEPS.length) {
        clearInterval(timer);
        const b = SAMPLE_BILLS[key];
        setBill(b);
        setFindings(analyzeBill(b, ledger, camp.budget.map((x) => x.label)));
        setStep(STEPS.length);
        soft();
      } else setStep(i);
    }, offline ? 80 : 450);
  };

  const pick = async (camera: boolean) => {
    try {
      const res = camera ? await ImagePicker.launchCameraAsync({ quality: 0.5 }) : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.5 });
      if (!res.canceled && res.assets[0]) run('A', res.assets[0].uri);
    } catch {
      setErr('Could not open the photo picker here. Use a sample bill below.');
    }
  };

  const review = findings.find((f) => f.status === 'duplicate' || f.status === 'mismatch');
  const submit = () => {
    if (!bill) return;
    const worst = review ?? findings[0];
    apply({ campaignId: camp.id, entryId: worst.matchedEntryId, status: worst.status, why: `${worst.label}: ${worst.detail}`, evidence: [`Bill from ${bill.vendor} dated ${bill.date}`, `Total Rs ${bill.total}`, `OCR confidence ${Math.round(bill.confidence * 100)}%, ${bill.engine}`], confidence: review ? 'medium' : 'low' });
    setSent(true);
  };

  return (
    <Screen header={<AppHeader title="Check a bill" subtitle={camp.title} />}>
      <Banner tone="saffron" title="Demo OCR">Text extraction here is simulated with two sample bills. A production build calls an OCR service. Either way, a person makes every decision.</Banner>
      <Row wrap>
        <Button label="Choose a photo" kind="secondary" onPress={() => pick(false)} />
        <Button label="Capture with camera" kind="secondary" onPress={() => pick(true)} />
      </Row>
      <Row wrap>
        <Button label="Use sample bill A" kind="secondary" onPress={() => run('A')} />
        <Button label="Use sample bill B" kind="secondary" onPress={() => run('B')} />
      </Row>
      {err ? <T v="small" color="red">{err}</T> : null}
      {uri && <Image source={{ uri }} style={{ width: '100%', height: 160, borderRadius: 14 }} contentFit="cover" accessibilityLabel="Selected bill photo" />}
      {offline && step >= 0 && <Chip label="Offline: upload queued, analysis ran locally" tone="saffron" />}

      {step >= 0 && (
        <Card>
          {STEPS.map((s, i) => (
            <Row key={s} accessibilityLabel={`${s}. ${i < step ? 'done' : i === step ? 'in progress' : 'waiting'}`}>
              {i < step ? <CheckCircle2 size={20} color={c.green} /> : i === step ? <ActivityIndicator size="small" color={c.indigo} /> : <Circle size={20} color={c.border} />}
              <T v="small" color="ink">{s}</T>
            </Row>
          ))}
        </Card>
      )}

      {bill && (
        <>
          <SectionTitle>What we read</SectionTitle>
          <Card>
            <T v="h3">{bill.vendor}</T>
            <T v="small" color="ink">{bill.date} · Total Rs {bill.total.toLocaleString('en-IN')}</T>
            {bill.lines.map((l) => <Row key={l.item} style={{ justifyContent: 'space-between' }}><T v="small" color="ink">{l.item}</T><T v="small" color="ink">Rs {l.amount.toLocaleString('en-IN')}</T></Row>)}
            <T v="small">Confidence {Math.round(bill.confidence * 100)}%. Please check the numbers, because OCR can be wrong.</T>
          </Card>
          <SectionTitle>What stands out</SectionTitle>
          {findings.map((f) => (
            <Card key={f.label} tone={f.status === 'verified' ? 'green' : 'saffron'}>
              <Row wrap><TransparencyStatus status={f.status} /></Row>
              <T v="h3">{f.label}</T>
              <T v="small" color="ink">{f.detail}</T>
            </Card>
          ))}
          <Banner tone="indigo">These are flags for a human reviewer, not conclusions. Nobody is accused of anything.</Banner>
          {sent ? (
            <>
              <Banner tone="green" title="Sent to the review queue">A moderator will look at it. The ledger entry now shows &quot;{review ? (review.status === 'duplicate' ? 'Possible duplicate' : 'Amount mismatch') : 'Pending human review'}&quot;.</Banner>
              <Button label="See the ledger" onPress={() => router.replace(`/abhiyan/ledger/${camp.id}`)} />
              <Card tone="alt">
                <T v="h3">Demo shortcut</T>
                <T v="small" color="ink">Switch to Kavya, a moderator, to review it.</T>
                <Button label="Continue as moderator" kind="secondary" onPress={() => { login('p-kavya'); router.replace('/moderator'); }} />
              </Card>
            </>
          ) : <Button label="Send for human review" onPress={submit} />}
        </>
      )}
    </Screen>
  );
}
