import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { ArrowLeft, Bell, CircleAlert, WifiOff } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  AccessibilityInfo, Animated, Modal, Platform, Pressable, ScrollView, StyleProp, StyleSheet, Switch, Text, TextInput, TextInputProps, TextStyle,
  View, ViewProps, ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { highContrast, light, MIN_TOUCH, Palette, radius, space } from '@/constants/theme';
import { translate } from '@/i18n';
import { useApp } from '@/store/useApp';

export const useTheme = (): Palette => useApp((s) => (s.settings.highContrast ? highContrast : light));
export const useT = () => {
  const lang = useApp((s) => s.settings.lang);
  return (k: string) => translate(lang, k);
};
/** True if either the in-app toggle or the operating system asks for reduced motion. */
export const useReducedMotion = () => {
  const setting = useApp((s) => s.settings.reducedMotion);
  const [os, setOs] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setOs).catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setOs);
    return () => sub.remove();
  }, []);
  return setting || os;
};

export const tap = () => { if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => undefined); };
export const soft = () => { if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined); };

/* ---------- Text ---------- */
type Variant = 'display' | 'h1' | 'h2' | 'h3' | 'body' | 'small' | 'label';
const sizes: Record<Variant, TextStyle> = {
  display: { fontSize: 30, lineHeight: 38, fontWeight: '800' },
  h1: { fontSize: 24, lineHeight: 31, fontWeight: '700' },
  h2: { fontSize: 19, lineHeight: 26, fontWeight: '700' },
  h3: { fontSize: 16, lineHeight: 23, fontWeight: '700' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  small: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  label: { fontSize: 14, lineHeight: 18, fontWeight: '600' },
};

export function T({ v = 'body', color, style, children, ...rest }: {
  v?: Variant; color?: keyof Palette; style?: StyleProp<TextStyle>; children?: React.ReactNode;
} & Omit<React.ComponentProps<typeof Text>, 'style'>) {
  const c = useTheme();
  return <Text {...rest} style={[sizes[v], { color: c[color ?? (v === 'small' || v === 'label' ? 'muted' : 'ink')] }, style]}>{children}</Text>;
}

/* ---------- Layout ---------- */
export function Screen({ children, scroll = true, padBottom = 120, header, footer }: {
  children: React.ReactNode; scroll?: boolean; padBottom?: number; header?: React.ReactNode; footer?: React.ReactNode;
}) {
  const c = useTheme();
  const offline = useApp((s) => s.settings.offline);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top', 'left', 'right']}>
      {offline && <OfflineBanner />}
      {header}
      {scroll ? (
        <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: padBottom, gap: space.lg }} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={{ flex: 1, padding: space.lg, gap: space.lg }}>{children}</View>
      )}
      {footer}
    </SafeAreaView>
  );
}

export function AppHeader({ title, subtitle, back = true, right, bell }: {
  title: string; subtitle?: string; back?: boolean; right?: React.ReactNode; bell?: boolean;
}) {
  const c = useTheme();
  const unread = useApp((s) => s.notifications.filter((n) => !n.read && (!n.toId || n.toId === s.userId)).length);
  return (
    <View style={[styles.header, { borderBottomColor: c.border }]}>
      {back && (
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))} style={styles.iconBtn} hitSlop={8}>
          <ArrowLeft color={c.ink} size={24} />
        </Pressable>
      )}
      <View style={{ flex: 1 }}>
        <T v="h2" numberOfLines={1} accessibilityRole="header">{title}</T>
        {subtitle ? <T v="small" numberOfLines={1}>{subtitle}</T> : null}
      </View>
      {right}
      {bell && (
        <Pressable accessibilityRole="button" accessibilityLabel={`Notifications, ${unread} unread`} onPress={() => router.push('/notifications')} style={styles.iconBtn}>
          <Bell color={c.ink} size={24} />
          {unread > 0 && <View style={[styles.dot, { backgroundColor: c.saffron }]} />}
        </Pressable>
      )}
    </View>
  );
}

export function Card({ children, style, tone, onPress, label }: {
  children: React.ReactNode; style?: StyleProp<ViewStyle>; tone?: 'plain' | 'indigo' | 'saffron' | 'green' | 'terracotta' | 'red' | 'alt';
  onPress?: () => void; label?: string;
}) {
  const c = useTheme();
  const bg = { plain: c.surface, indigo: c.indigoSoft, saffron: c.saffronSoft, green: c.greenSoft, terracotta: c.terracottaSoft, red: c.redSoft, alt: c.surfaceAlt }[tone ?? 'plain'];
  const inner = [styles.card, { backgroundColor: bg, borderColor: c.border }, style];
  if (onPress) {
    return (
      <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={() => { tap(); onPress(); }} style={({ pressed }) => [inner, pressed && { opacity: 0.85 }]}>
        {children}
      </Pressable>
    );
  }
  return <View style={inner}>{children}</View>;
}

export function Row({ children, style, gap = space.sm, wrap, ...rest }: ViewProps & { children: React.ReactNode; style?: StyleProp<ViewStyle>; gap?: number; wrap?: boolean }) {
  return <View {...rest} style={[{ flexDirection: 'row', alignItems: 'center', gap, flexWrap: wrap ? 'wrap' : 'nowrap' }, style]}>{children}</View>;
}

export function SectionTitle({ children, action }: { children: string; action?: { label: string; onPress: () => void } }) {
  const c = useTheme();
  return (
    <Row style={{ justifyContent: 'space-between' }}>
      <T v="h2" accessibilityRole="header">{children}</T>
      {action && (
        <Pressable accessibilityRole="link" accessibilityLabel={action.label} onPress={action.onPress} style={{ minHeight: 44, justifyContent: 'center' }}>
          <T v="label" style={{ color: c.indigo }}>{action.label}</T>
        </Pressable>
      )}
    </Row>
  );
}

/* ---------- Controls ---------- */
export function Button({ label, onPress, kind = 'primary', icon, disabled, loading, a11y, style }: {
  label: string; onPress: () => void; kind?: 'primary' | 'secondary' | 'quiet' | 'danger' | 'saffron'; icon?: React.ReactNode;
  disabled?: boolean; loading?: boolean; a11y?: string; style?: StyleProp<ViewStyle>;
}) {
  const c = useTheme();
  const palette = {
    primary: { bg: c.indigo, fg: c.onIndigo, bd: c.indigo },
    saffron: { bg: c.saffron, fg: '#FFFFFF', bd: c.saffron },
    secondary: { bg: c.surface, fg: c.indigo, bd: c.indigo },
    quiet: { bg: 'transparent', fg: c.indigo, bd: 'transparent' },
    danger: { bg: c.surface, fg: c.red, bd: c.red },
  }[kind];
  return (
    <Pressable
      accessibilityRole="button" accessibilityLabel={a11y ?? label} accessibilityState={{ disabled: !!disabled || !!loading, busy: !!loading }}
      disabled={disabled || loading} onPress={() => { tap(); onPress(); }}
      style={({ pressed }) => [styles.btn, { backgroundColor: palette.bg, borderColor: palette.bd, opacity: disabled ? 0.45 : pressed ? 0.85 : 1 }, style]}
    >
      {icon}
      <T v="h3" style={{ color: palette.fg }}>{loading ? 'Please wait…' : label}</T>
    </Pressable>
  );
}

export function Chip({ label, selected, onPress, tone, icon }: {
  label: string; selected?: boolean; onPress?: () => void; tone?: 'green' | 'saffron' | 'indigo' | 'red' | 'terracotta'; icon?: React.ReactNode;
}) {
  const c = useTheme();
  const tones = { green: [c.greenSoft, c.green], saffron: [c.saffronSoft, c.saffron], indigo: [c.indigoSoft, c.indigo], red: [c.redSoft, c.red], terracotta: [c.terracottaSoft, c.terracotta] } as const;
  const [bg, fg] = selected ? [c.indigo, c.onIndigo] : tone ? tones[tone] : [c.surface, c.ink];
  const body = (
    <View style={[styles.chip, { backgroundColor: bg, borderColor: selected ? c.indigo : tone ? fg : c.border }]}>
      {icon}
      <T v="label" style={{ color: fg }}>{label}</T>
    </View>
  );
  if (!onPress) return <View accessible accessibilityLabel={label}>{body}</View>;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: !!selected }} onPress={() => { tap(); onPress(); }} style={{ minHeight: 44, justifyContent: 'center' }}>
      {body}
    </Pressable>
  );
}

export function Field({ label, hint, error, ...props }: TextInputProps & { label: string; hint?: string; error?: string }) {
  const c = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <T v="label" color="ink">{label}</T>
      <TextInput
        accessibilityLabel={label} placeholderTextColor={c.muted}
        {...props}
        style={[styles.input, { backgroundColor: c.surface, borderColor: error ? c.red : c.border, color: c.ink }, props.multiline && { minHeight: 110, textAlignVertical: 'top' }]}
      />
      {error ? <T v="small" color="red" accessibilityLiveRegion="polite">{error}</T> : hint ? <T v="small">{hint}</T> : null}
    </View>
  );
}

export function ToggleRow({ label, detail, value, onChange }: { label: string; detail?: string; value: boolean; onChange: (v: boolean) => void }) {
  const c = useTheme();
  return (
    <Row style={{ minHeight: MIN_TOUCH, justifyContent: 'space-between' }}>
      <View style={{ flex: 1 }}>
        <T v="h3">{label}</T>
        {detail ? <T v="small">{detail}</T> : null}
      </View>
      <Switch accessibilityLabel={label} value={value} onValueChange={(v) => { tap(); onChange(v); }} trackColor={{ true: c.green, false: c.border }} />
    </Row>
  );
}

/** Groups consecutive strings and numbers into one <Text>, so mixed children never put raw text inside a View. */
function wrapText(children: React.ReactNode): React.ReactNode {
  const out: React.ReactNode[] = [];
  let buf = '';
  const flush = () => { if (buf.trim()) out.push(<T key={`t${out.length}`} v="small" color="ink">{buf}</T>); buf = ''; };
  React.Children.forEach(children, (c) => {
    if (typeof c === 'string' || typeof c === 'number') buf += c;
    else if (c === null || c === undefined || typeof c === 'boolean') return;
    else { flush(); out.push(c); }
  });
  flush();
  return out;
}

export function Banner({ tone = 'indigo', title, children, icon }: { tone?: 'indigo' | 'saffron' | 'green' | 'red' | 'terracotta'; title?: string; children?: React.ReactNode; icon?: React.ReactNode }) {
  const c = useTheme();
  const fg = { indigo: c.indigo, saffron: c.saffron, green: c.green, red: c.red, terracotta: c.terracotta }[tone];
  return (
    <Card tone={tone} style={{ borderColor: fg }}>
      <Row gap={space.md} style={{ alignItems: 'flex-start' }}>
        {icon}
        <View style={{ flex: 1, gap: 4 }}>
          {title ? <T v="h3" style={{ color: fg }}>{title}</T> : null}
          {wrapText(children)}
        </View>
      </Row>
    </Card>
  );
}

/* ---------- States ---------- */
export function EmptyState({ title, body, action }: { title: string; body: string; action?: { label: string; onPress: () => void } }) {
  return (
    <Card tone="alt" style={{ alignItems: 'center', gap: space.sm, paddingVertical: space.xl }}>
      <T v="h3" style={{ textAlign: 'center' }}>{title}</T>
      <T v="small" style={{ textAlign: 'center' }}>{body}</T>
      {action && <Button label={action.label} kind="secondary" onPress={action.onPress} />}
    </Card>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const c = useTheme();
  return (
    <Card tone="red" style={{ gap: space.sm }}>
      <Row><CircleAlert color={c.red} size={22} /><T v="h3" color="red">Something did not work</T></Row>
      <T v="small" color="ink">{message}</T>
      {onRetry && <Button label="Try again" kind="secondary" onPress={onRetry} />}
    </Card>
  );
}

export function Skeleton({ height = 70 }: { height?: number }) {
  const c = useTheme();
  const reduced = useReducedMotion();
  const v = useState(() => new Animated.Value(0.5))[0];
  useEffect(() => {
    if (reduced) return;
    const a = Animated.loop(Animated.sequence([Animated.timing(v, { toValue: 1, duration: 700, useNativeDriver: true }), Animated.timing(v, { toValue: 0.5, duration: 700, useNativeDriver: true })]));
    a.start();
    return () => a.stop();
  }, [reduced, v]);
  return <Animated.View accessibilityLabel="Loading" style={{ height, borderRadius: radius.md, backgroundColor: c.surfaceAlt, opacity: v }} />;
}

export function OfflineBanner() {
  const c = useTheme();
  const last = useApp((s) => s.lastSynced);
  const pending = useApp((s) => s.uploads.filter((u) => u.status !== 'uploaded').length);
  return (
    <View accessibilityRole="alert" style={{ backgroundColor: c.ink, paddingVertical: 8, paddingHorizontal: space.lg }}>
      <Row><WifiOff color="#fff" size={18} />
        <T v="small" style={{ color: '#fff', flex: 1 }}>Offline. Showing saved content (last updated {new Date(last).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}). {pending ? `${pending} upload(s) waiting.` : 'Drafts are saved on this device.'}</T>
      </Row>
    </View>
  );
}

/* ---------- Sheets ---------- */
export function Sheet({ visible, onClose, title, children }: { visible: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  const c = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close" accessibilityRole="button" />
      <View style={[styles.sheet, { backgroundColor: c.bg }]}>
        <View style={[styles.grab, { backgroundColor: c.border }]} />
        <T v="h2" accessibilityRole="header" style={{ marginBottom: space.md }}>{title}</T>
        <ScrollView style={{ maxHeight: 520 }} keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: space.md, paddingBottom: space.xl }}>{children}</ScrollView>
      </View>
    </Modal>
  );
}

export function ConfirmationSheet({ visible, title, body, confirmLabel, danger, onConfirm, onClose }: {
  visible: boolean; title: string; body: string; confirmLabel: string; danger?: boolean; onConfirm: () => void; onClose: () => void;
}) {
  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      <T>{body}</T>
      <Button label={confirmLabel} kind={danger ? 'danger' : 'primary'} onPress={() => { onClose(); onConfirm(); }} />
      <Button label="Not now" kind="quiet" onPress={onClose} />
    </Sheet>
  );
}

/* ---------- Motion ---------- */
export function FadeIn({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: StyleProp<ViewStyle> }) {
  const reduced = useReducedMotion();
  const v = useState(() => new Animated.Value(reduced ? 1 : 0))[0];
  useEffect(() => {
    if (reduced) { v.setValue(1); return; }
    Animated.timing(v, { toValue: 1, duration: 360, delay, useNativeDriver: true }).start();
  }, [reduced, delay, v]);
  return <Animated.View style={[{ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }, style]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.lg, paddingVertical: space.sm, minHeight: 60, borderBottomWidth: StyleSheet.hairlineWidth },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  dot: { position: 'absolute', top: 9, right: 9, width: 10, height: 10, borderRadius: 5 },
  card: { borderRadius: radius.lg, borderWidth: 1, padding: space.lg, gap: space.sm },
  btn: { minHeight: MIN_TOUCH, borderRadius: radius.md, borderWidth: 1.5, paddingHorizontal: space.lg, paddingVertical: space.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1 },
  input: { borderWidth: 1.5, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, minHeight: MIN_TOUCH },
  scrim: { flex: 1, backgroundColor: 'rgba(20,24,40,0.45)' },
  sheet: { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: space.lg, paddingBottom: space.xl },
  grab: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, marginBottom: space.md },
});
