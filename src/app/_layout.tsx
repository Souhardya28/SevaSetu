import { Stack, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SevaGuideButton } from '@/components/domain';
import { ErrorState, Screen, useTheme } from '@/components/ui';
import { useApp } from '@/store/useApp';

const TAB_PATHS = ['/', '/sathi', '/abhiyan', '/daan', '/profile'];
// Hidden where a sticky footer or input sits at the bottom, so it never covers an action.
const NO_GUIDE = ['/guide', '/onboarding', '/sathi/', '/daan/new', '/daan/request', '/abhiyan/bill', '/verification', '/moderator'];

function Shell() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const c = useTheme();
  const hydrated = useApp((s) => s.hydrated);
  const userId = useApp((s) => s.userId);
  const reduced = useApp((s) => s.settings.reducedMotion);
  const setHydrated = useApp((s) => s.setHydrated);
  const moderator = useApp((s) => s.people.find((p) => p.id === s.userId)?.roles.includes('moderator'));

  useEffect(() => {
    const t = setTimeout(setHydrated, 1500); // safety net if storage is slow
    return () => clearTimeout(t);
  }, [setHydrated]);

  useEffect(() => {
    if (hydrated && !userId && !pathname.startsWith('/onboarding')) router.replace('/onboarding');
  }, [hydrated, userId, pathname, router]);

  const showGuide = hydrated && !!userId && !moderator && !NO_GUIDE.some((p) => pathname.startsWith(p));
  const onTab = TAB_PATHS.includes(pathname);

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, animation: reduced ? 'none' : 'slide_from_right', contentStyle: { backgroundColor: c.bg } }}>
        <Stack.Screen name="guide" options={{ presentation: 'modal', animation: reduced ? 'none' : 'slide_from_bottom' }} />
      </Stack>
      {showGuide && <SevaGuideButton bottom={(onTab ? 76 : 20) + insets.bottom} />}
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Shell />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/** Route-level error boundary: a calm message with retry instead of a blank screen. */
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => Promise<void> }) {
  return (
    <Screen>
      <ErrorState message={`${error.message.slice(0, 240)} Your data is safe on this device.`} onRetry={retry} />
    </Screen>
  );
}
