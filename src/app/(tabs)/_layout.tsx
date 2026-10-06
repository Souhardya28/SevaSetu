import { Tabs } from 'expo-router';
import { Gift, HandHeart, House, Megaphone, User } from 'lucide-react-native';
import React from 'react';
import { useT, useTheme } from '@/components/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabsLayout() {
  const c = useTheme();
  const t = useT();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.indigo,
        tabBarInactiveTintColor: c.muted,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarStyle: { backgroundColor: c.surface, borderTopColor: c.border, height: 60 + insets.bottom, paddingBottom: insets.bottom + 4, paddingTop: 6 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('tab.home'), tabBarIcon: ({ color }) => <House color={color} size={24} />, tabBarAccessibilityLabel: 'Home tab' }} />
      <Tabs.Screen name="sathi" options={{ title: t('tab.sathi'), tabBarIcon: ({ color }) => <HandHeart color={color} size={24} />, tabBarAccessibilityLabel: 'Sathi tab, person to person help' }} />
      <Tabs.Screen name="abhiyan" options={{ title: t('tab.abhiyan'), tabBarIcon: ({ color }) => <Megaphone color={color} size={24} />, tabBarAccessibilityLabel: 'Abhiyan tab, campaigns' }} />
      <Tabs.Screen name="daan" options={{ title: t('tab.daan'), tabBarIcon: ({ color }) => <Gift color={color} size={24} />, tabBarAccessibilityLabel: 'Daan tab, sharing items' }} />
      <Tabs.Screen name="profile" options={{ title: t('tab.profile'), tabBarIcon: ({ color }) => <User color={color} size={24} />, tabBarAccessibilityLabel: 'Profile tab' }} />
    </Tabs>
  );
}
