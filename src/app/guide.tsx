import { router } from 'expo-router';
import { Phone, Send, X } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SourceCitationCard } from '@/components/domain';
import { Banner, Button, Card, Chip, Row, T, tap, useTheme } from '@/components/ui';
import { detectTopic, followUp, GuideMode, GuideReply, MODE_INFO, respond, Topic } from '@/services/guide';
import { detectCrisis } from '@/services/safety';
import { useApp } from '@/store/useApp';

interface Turn { id: number; from: 'user' | 'guide'; text?: string; reply?: GuideReply }

export default function Guide() {
  const c = useTheme();
  const logCrisis = useApp((s) => s.logCrisisRouting);
  const [mode, setMode] = useState<GuideMode>('support');
  const [turns, setTurns] = useState<Turn[]>([{ id: 0, from: 'guide', reply: { kind: 'text', text: 'Namaste. I am an AI guide inspired by verified teachings of Swami Vivekananda. I am not him, and I do not replace a counsellor, doctor or lawyer. How can I help?' } }]);
  const [text, setText] = useState('');
  const [topic, setTopic] = useState<Topic>('other');
  const [original, setOriginal] = useState('');
  const scroll = useRef<ScrollView>(null);
  const idRef = useRef(1);

  const push = (t: Omit<Turn, 'id'>) => { setTurns((x) => [...x, { ...t, id: idRef.current++ }]); setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 80); };

  const send = (msg: string, m: GuideMode = mode) => {
    const t = msg.trim();
    if (!t) return;
    push({ from: 'user', text: t });
    setText('');
    setOriginal(t);
    setTopic(detectTopic(t));
    if (detectCrisis(t)) logCrisis();
    setTimeout(() => push({ from: 'guide', reply: respond(m, t) }), 400);
  };

  const choose = (id: string, label: string) => {
    push({ from: 'user', text: label });
    setTimeout(() => push({ from: 'guide', reply: followUp(id, topic, original) }), 350);
  };

  const call = (n: string) => Linking.openURL(`tel:${n}`).catch(() => undefined);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <Row style={{ padding: 16, justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <T v="h1" accessibilityRole="header">Seva Guide</T>
          <T v="small">An AI guide inspired by verified teachings of Swami Vivekananda</T>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Close Seva Guide" onPress={() => router.back()} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}><X color={c.ink} size={26} /></Pressable>
      </Row>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }} style={{ flexGrow: 0 }}>
        {(Object.keys(MODE_INFO) as GuideMode[]).map((k) => <Chip key={k} label={MODE_INFO[k].label} selected={mode === k} onPress={() => setMode(k)} />)}
      </ScrollView>
      <T v="small" style={{ paddingHorizontal: 16, paddingTop: 6 }}>{MODE_INFO[mode].blurb}</T>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scroll} contentContainerStyle={{ padding: 16, gap: 12 }} keyboardShouldPersistTaps="handled">
          {turns.map((t) => t.from === 'user' ? (
            <View key={t.id} style={{ alignSelf: 'flex-end', maxWidth: '85%', backgroundColor: c.indigo, padding: 12, borderRadius: 16 }}><T style={{ color: c.onIndigo }}>{t.text}</T></View>
          ) : (
            <GuideBubble key={t.id} reply={t.reply!} onChoose={choose} onCall={call} />
          ))}
          {turns.length === 1 && (
            <Card tone="alt">
              <T v="label">TRY</T>
              <Row wrap>
                <Chip label="I am feeling unmotivated" onPress={() => { setMode('support'); send('I am feeling unmotivated', 'support'); }} />
                <Chip label="What did Vivekananda say about giving?" onPress={() => { setMode('learn'); send('What did Vivekananda say about giving?', 'learn'); }} />
                <Chip label="How do I prepare for my first session?" onPress={() => { setMode('prepare'); send('How do I prepare for my first session?', 'prepare'); }} />
              </Row>
            </Card>
          )}
        </ScrollView>
        <View style={{ padding: 12, borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.surface, gap: 6 }}>
          <T v="small">Not for emergencies. If you or someone is in danger, call 112.</T>
          <Row>
            <TextInput accessibilityLabel="Message to Seva Guide" value={text} onChangeText={setText} placeholder={MODE_INFO[mode].starter} placeholderTextColor={c.muted} onSubmitEditing={() => send(text)}
              style={{ flex: 1, minHeight: 48, borderWidth: 1.5, borderColor: c.border, borderRadius: 14, paddingHorizontal: 14, color: c.ink, fontSize: 16, backgroundColor: c.bg }} />
            <Pressable accessibilityRole="button" accessibilityLabel="Send" onPress={() => { tap(); send(text); }} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: c.indigo, alignItems: 'center', justifyContent: 'center' }}><Send color="#fff" size={20} /></Pressable>
          </Row>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function GuideBubble({ reply, onChoose, onCall }: { reply: GuideReply; onChoose: (id: string, label: string) => void; onCall: (n: string) => void }) {
  const c = useTheme();
  const crisis = reply.kind === 'crisis';
  return (
    <View style={{ alignSelf: 'flex-start', maxWidth: '95%', gap: 8 }}>
      <Card tone={crisis ? 'red' : 'plain'} style={crisis ? { borderColor: c.red, borderWidth: 2 } : undefined}>
        {crisis && <T v="h3" color="red">You are not alone. Please reach out now.</T>}
        <T accessibilityLiveRegion="polite">{reply.text}</T>
        {reply.resources?.map((r) => (
          <Button key={r.id} label={`${r.label}: ${r.number}`} kind={crisis ? 'danger' : 'secondary'} icon={<Phone size={18} color={crisis ? c.red : c.indigo} />} onPress={() => onCall(r.number)} a11y={`Call ${r.label} on ${r.number}`} />
        ))}
        {reply.resources && <T v="small">Numbers come from a configuration file that must be audited for your area before launch. No one is contacted automatically.</T>}
        {crisis && <Button label="Open Safety centre" kind="secondary" onPress={() => router.replace('/safety')} />}
      </Card>
      {reply.passage && <SourceCitationCard p={reply.passage} />}
      {reply.choices && <Row wrap>{reply.choices.map((ch) => <Chip key={ch.id} label={ch.label} onPress={() => onChoose(ch.id, ch.label)} />)}</Row>}
      {reply.action && <Button label={reply.action.label} kind="secondary" onPress={() => router.push(reply.action!.href)} />}
      {reply.kind === 'not-found' && <Banner tone="indigo">No verified passage found, so no quotation is shown.</Banner>}
    </View>
  );
}
