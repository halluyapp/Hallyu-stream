import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { color, layout, library, space } from '@hallyu/shared';
import { Icon, useSettings } from '../platform/context';
import { glassStyle, mobileText, s } from '../theme';
import { MobileNavProvider, OnboardingScreen, SplashScreen, useMobileNav, type MobileRoute, type MobileTab } from './navigation';
import { ExploreScreen, HomeScreen, SearchScreen, DetailScreen } from './screensBrowse';
import {
  AboutScreen,
  ApprovalScreen,
  DevicesScreen,
  DownloadsScreen,
  LibraryScreen,
  PairingHubScreen,
  PlayerScreen,
  ScannerScreen,
  SettingsScreen,
  SettingsSubScreen,
} from './screensApp';

const TABS: { id: MobileTab; label: string; icon: 'home' | 'compass' | 'search' | 'library' | 'settings' }[] = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'explore', label: 'Explore', icon: 'compass' },
  { id: 'search', label: 'Search', icon: 'search' },
  { id: 'library', label: 'Library', icon: 'library' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
];

function BottomNav() {
  const { tab, switchTab } = useMobileNav();
  const { settings } = useSettings();
  return (
    <View
      style={[
        glassStyle(settings.lowTier),
        s.row,
        {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          minHeight: layout.navHeight + 8,
          paddingHorizontal: space[2],
          paddingBottom: 8,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          justifyContent: 'space-around',
        },
      ]}
    >
      {TABS.map((item) => {
        const active = tab === item.id;
        return (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => switchTab(item.id)}
            style={{ minWidth: 56, minHeight: 48, alignItems: 'center', justifyContent: 'center', gap: 2 }}
          >
            <Icon name={item.icon} size={22} color={active ? color.accent.copper : color.text.muted} filled={active} />
            <Text style={[mobileText('micro'), { color: active ? color.accent.copper : color.text.muted }]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function RootScreen({ tab }: { tab: MobileTab }) {
  switch (tab) {
    case 'explore':
      return <ExploreScreen />;
    case 'search':
      return <SearchScreen />;
    case 'library':
      return <LibraryScreen />;
    case 'settings':
      return <SettingsScreen />;
    default:
      return <HomeScreen />;
  }
}

function RouteScreen({ route }: { route: MobileRoute }) {
  switch (route.name) {
    case 'detail':
      return <DetailScreen title={route.title} />;
    case 'player':
      return <PlayerScreen title={route.title} season={route.season} episode={route.episode} startPositionMs={route.startPositionMs} />;
    case 'librarySegment':
      return <LibraryScreen initialSegment={route.segment} />;
    case 'downloads':
      return <DownloadsScreen />;
    case 'settingsSub':
      return <SettingsSubScreen section={route.section} />;
    case 'about':
      return <AboutScreen />;
    case 'pairingHub':
      return <PairingHubScreen />;
    case 'scanner':
      return <ScannerScreen />;
    case 'approval':
      return <ApprovalScreen challengeId={route.challengeId} />;
    case 'devices':
      return <DevicesScreen />;
    default:
      return <HomeScreen />;
  }
}

function MobileShell() {
  const { tab, stack } = useMobileNav();
  const route = stack[stack.length - 1];
  const fullscreen = route?.name === 'player' || route?.name === 'scanner';
  return (
    <View style={s.screen}>
      {route ? <RouteScreen route={route} /> : <RootScreen tab={tab} />}
      {!route && !fullscreen && <BottomNav />}
    </View>
  );
}

export function MobileApp({ initialTab = 'home' }: { initialTab?: MobileTab }) {
  const [phase, setPhase] = useState<'splash' | 'onboarding' | 'app'>('splash');
  const decide = useCallback(async () => {
    const seen = await library.hasSeenOnboarding();
    setPhase(seen ? 'app' : 'onboarding');
  }, []);

  useEffect(() => {
    void decide();
  }, [decide]);

  if (phase === 'splash') return <SplashScreen onDone={() => void decide()} />;
  if (phase === 'onboarding') return <OnboardingScreen onDone={() => setPhase('app')} />;
  return (
    <MobileNavProvider initialTab={initialTab}>
      <MobileShell />
    </MobileNavProvider>
  );
}

export * from './navigation';
