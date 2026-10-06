import { router } from 'expo-router';
import React, { useState } from 'react';
import { z } from 'zod';
import { AppHeader, Banner, Button, Card, Chip, Field, Row, Screen, SectionTitle, T } from '@/components/ui';
import { DEMO_ACCOUNTS } from '@/data/seed';
import { useApp } from '@/store/useApp';
import { setupDraft } from './setup';

const phoneSchema = z.string().regex(/^[6-9]\d{9}$/, 'Enter a 10-digit Indian mobile number');
const emailSchema = z.string().email('Enter a valid email address');
const nameSchema = z.string().trim().min(2, 'Please enter your first name');

export default function Auth() {
  const login = useApp((s) => s.login);
  const signUp = useApp((s) => s.signUp);
  const [method, setMethod] = useState<'phone' | 'email'>('phone');
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [err, setErr] = useState('');

  const sendCode = () => {
    const n = nameSchema.safeParse(name);
    if (!n.success) return setErr(n.error.issues[0].message);
    const v = (method === 'phone' ? phoneSchema : emailSchema).safeParse(value);
    if (!v.success) return setErr(v.error.issues[0].message);
    setErr('');
    setOtpSent(true);
  };

  const verify = () => {
    if (otp !== '123456') return setErr('Demo code is 123456. No real message is sent in demo mode.');
    signUp({ name: name.trim(), roles: setupDraft.roles, interests: setupDraft.interests, availability: setupDraft.availability, lang: setupDraft.lang });
    router.replace('/onboarding/verify');
  };

  return (
    <Screen header={<AppHeader title="Sign in" subtitle="Your details stay minimal" />}>
      <Banner tone="saffron" title="Demo mode">No real SMS or email is sent. Use code 123456, or tap a demo account below.</Banner>
      <Row><Chip label="Phone OTP" selected={method === 'phone'} onPress={() => { setMethod('phone'); setOtpSent(false); setValue(''); }} /><Chip label="Email" selected={method === 'email'} onPress={() => { setMethod('email'); setOtpSent(false); setValue(''); }} /></Row>
      <Field label="First name or chosen display name" value={name} onChangeText={setName} autoCapitalize="words" />
      <Field label={method === 'phone' ? 'Mobile number' : 'Email address'} value={value} onChangeText={setValue} keyboardType={method === 'phone' ? 'number-pad' : 'email-address'} autoCapitalize="none" hint="Never shown publicly. Kept masked inside chats." />
      {otpSent && <Field label="Enter the 6-digit code" value={otp} onChangeText={setOtp} keyboardType="number-pad" maxLength={6} />}
      {err ? <T v="small" color="red" accessibilityLiveRegion="polite">{err}</T> : null}
      <Button label={otpSent ? 'Verify and continue' : 'Send code'} onPress={otpSent ? verify : sendCode} />
      <SectionTitle>Or try a demo account</SectionTitle>
      {DEMO_ACCOUNTS.map((a) => (
        <Card key={a.personId} onPress={() => { login(a.personId); router.replace(a.personId === 'p-kavya' ? '/moderator' : '/(tabs)'); }} label={`Demo login as ${a.label}`}>
          <T v="h3">{a.label}</T><T v="small">{a.hint}</T>
        </Card>
      ))}
      <T v="small">Everyone in this demo is fictional.</T>
    </Screen>
  );
}
