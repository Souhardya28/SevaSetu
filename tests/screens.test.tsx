jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => ({ id: (global as unknown as { __id: string }).__id }),
  usePathname: () => '/',
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));
jest.mock('expo-haptics', () => ({ selectionAsync: jest.fn(), notificationAsync: jest.fn(), NotificationFeedbackType: { Success: 'success' } }));
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { SafeAreaView: ({ children }: { children: React.ReactNode }) => React.createElement(View, null, children), useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) };
});

import { render, screen } from '@testing-library/react-native';
import React from 'react';
import MatchRoom from '@/app/sathi/room/[id]';
import RequestDetail from '@/app/sathi/[id]';
import Home from '@/app/(tabs)/index';
import Daan from '@/app/(tabs)/daan';
import Abhiyan from '@/app/(tabs)/abhiyan';
import Sathi from '@/app/(tabs)/sathi';
import Profile from '@/app/(tabs)/profile';
import CampaignDetail from '@/app/abhiyan/[id]';
import LedgerScreen from '@/app/abhiyan/ledger/[id]';
import Journal from '@/app/journal';
import Path from '@/app/path';
import Safety from '@/app/safety';
import Moderator from '@/app/moderator';
import Privacy from '@/app/privacy';
import Guide from '@/app/guide';
import { useApp } from '@/store/useApp';

const setId = (id: string) => { (global as unknown as { __id: string }).__id = id; };

beforeEach(() => { useApp.getState().resetDemo(); jest.spyOn(console, 'error').mockImplementation(() => undefined); });

describe('screens render without loops or crashes', () => {
  it('match room', async () => {
    useApp.getState().login('p-aarav');
    const id = useApp.getState().acceptRequest('h-neha')!;
    setId(id);
    await render(<MatchRoom />);
    expect(screen.getByText(/Protected room/)).toBeTruthy();
    expect(screen.getByText(/Meeting plan/)).toBeTruthy();
  });
  it('request detail shows an explanation, boundaries and respectful help', async () => {
    useApp.getState().login('p-aarav');
    setId('h-neha');
    await render(<RequestDetail />);
    expect(screen.getByText(/Recommended because you selected resume review/)).toBeTruthy();
    expect(screen.getByText(/What respectful help looks like/)).toBeTruthy();
  });
  it('tabs and secondary screens', async () => {
    useApp.getState().login('p-aarav');
    for (const C of [Home, Daan, Abhiyan, Sathi, Profile, Journal, Path, Safety, Privacy, Guide]) await render(<C />);
  });
  it('campaign, ledger', async () => {
    useApp.getState().login('p-aarav');
    setId('c-lamps');
    await render(<CampaignDetail />);
    await render(<LedgerScreen />);
    expect(screen.getAllByText(/Possible duplicate/).length).toBeGreaterThan(0);
  });
  it('moderator', async () => {
    useApp.getState().login('p-kavya');
    await render(<Moderator />);
    expect(screen.getByText(/AI assists, people decide/)).toBeTruthy();
  });
});
