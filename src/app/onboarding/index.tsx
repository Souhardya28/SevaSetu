import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Animated, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BridgeMark } from '@/components/domain';
import { Button, Row, T, useReducedMotion, useTheme } from '@/components/ui';
import { space } from '@/constants/theme';
import { useApp } from '@/store/useApp';

const SLIDES = [
  { title: 'Ask with dignity', body: 'Anyone can need support, and anyone can give it. You stay in control of what you share and who sees it.' },
  { title: 'Serve with humility', body: 'The person you help is not smaller than you. Service is something we do together, and both people give something.' },
  { title: 'Grow through consistency', body: 'Small, steady acts matter more than big moments. There are no rankings, only a private path of your own.' },
];

export default function Welcome() {
  const c = useTheme();
  const reduced = useReducedMotion();
  const hydrated = useApp((s) => s.hydrated);
  const userId = useApp((s) => s.userId);
  const [splash, setSplash] = useState(true);
  const [i, setI] = useState(0);
  const draw = useState(() => new Animated.Value(reduced ? 1 : 0))[0];

  useEffect(() => {
    if (!reduced) Animated.timing(draw, { toValue: 1, duration: 1400, useNativeDriver: true }).start();
    const t = setTimeout(() => setSplash(false), reduced ? 500 : 2000);
    return () => clearTimeout(t);
  }, [reduced, draw]);

  useEffect(() => {
    if (hydrated && userId && !splash) router.replace('/(tabs)');
  }, [hydrated, userId, splash]);

  if (splash || (hydrated && userId)) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center', gap: space.lg }}>
        <Animated.View style={{ opacity: draw, transform: [{ scale: draw.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }] }}>
          <BridgeMark size={112} />
        </Animated.View>
        <T v="display" color="indigo" accessibilityRole="header">SevaSetu</T>
        <T v="body" style={{ textAlign: 'center', paddingHorizontal: space.xl }}>A bridge from intention to service.</T>
      </SafeAreaView>
    );
  }

  const s = SLIDES[i];
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg, padding: space.xl, justifyContent: 'space-between' }}>
      <View style={{ alignItems: 'center', gap: space.xl, marginTop: space.xxl }}>
        <BridgeMark size={88} />
        <View accessible accessibilityLabel={`${s.title}. ${s.body}`} style={{ gap: space.md, alignItems: 'center' }}>
          <T v="display" color="indigo" style={{ textAlign: 'center' }}>{s.title}</T>
          <T v="body" style={{ textAlign: 'center' }}>{s.body}</T>
        </View>
        <Row gap={8} accessibilityLabel={`Slide ${i + 1} of ${SLIDES.length}`}>
          {SLIDES.map((_, k) => <View key={k} style={{ width: k === i ? 28 : 10, height: 10, borderRadius: 5, backgroundColor: k === i ? c.saffron : c.border }} />)}
        </Row>
      </View>
      <View style={{ gap: space.sm }}>
        <Button label={i < SLIDES.length - 1 ? 'Next' : 'Begin'} onPress={() => (i < SLIDES.length - 1 ? setI(i + 1) : router.push('/onboarding/setup'))} />
        {i < SLIDES.length - 1 && <Button label="Skip" kind="quiet" onPress={() => router.push('/onboarding/setup')} />}
      </View>
    </SafeAreaView>
  );
}
