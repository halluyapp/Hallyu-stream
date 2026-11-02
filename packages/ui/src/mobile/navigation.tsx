import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Animated, View } from 'react-native';
import { copy, library, type Title } from '@hallyu/shared';
import { useRemoteKeys } from '../platform/context';
import { OnboardingCard, PageDots, PrimaryButton, TextButton, Wordmark } from '../components';
import { s, space } from '../theme';

export type MobileTab = 'home' | 'explore' | 'search' | 'library' | 'settings';

export type MobileRoute =
  | { name: 'detail'; title: Title }
  | { name: 'player'; title: Title; season: number; episode: number; startPositionMs?: number }
  | { name: 'pairingHub' }
  | { name: 'scanner' }
  | { name: 'approval'; challengeId: string }
  | { name: 'devices' }
  | { name: 'downloads' }
  | { name: 'about' }
  | { name: 'settingsSub'; section: 'quality' | 'subtitles' | 'storage' }
  | { name: 'librarySegment'; segment: 'continue' | 'list' | 'history' | 'downloads' };

export interface MobileNavState {
  tab: MobileTab;
  stack: MobileRoute[];
}

export interface MobileNavApi extends MobileNavState {
  navigate(route: MobileRoute): void;
  switchTab(tab: MobileTab): void;
  back(): void;
  reset(): void;
}

const MobileNavContext = createContext<MobileNavApi | null>(null);

export function useMobileNav(): MobileNavApi {
  const ctx = useContext(MobileNavContext);
  if (!ctx) throw new Error('MobileNavProvider is missing');
  return ctx;
}

export function MobileNavProvider({
  children,
  initialTab = 'home',
}: {
  children: ReactNode;
  initialTab?: MobileTab;
}) {
  const [tab, setTab] = useState<MobileTab>(initialTab);
  const [stack, setStack] = useState<MobileRoute[]>([]);

  const navigate = useCallback((route: MobileRoute) => setStack((prev) => [...prev, route]), []);
  const switchTab = useCallback((next: MobileTab) => {
    setTab(next);
    setStack([]);
  }, []);
  const back = useCallback(() => setStack((prev) => prev.slice(0, -1)), []);
  const reset = useCallback(() => setStack([]), []);

  useRemoteKeys((key) => {
    if (key === 'back') back();
  });

  const value = useMemo<MobileNavApi>(
    () => ({ tab, stack, navigate, switchTab, back, reset }),
    [tab, stack, navigate, switchTab, back, reset],
  );
  return <MobileNavContext.Provider value={value}>{children}</MobileNavContext.Provider>;
}

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const sweep = useState(new Animated.Value(0))[0];
  useEffect(() => {
    Animated.timing(sweep, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    const timer = setTimeout(onDone, 1400);
    return () => clearTimeout(timer);
  }, [sweep, onDone]);
  const translateX = sweep.interpolate({ inputRange: [0, 1], outputRange: [-220, 220] });
  return (
    <View style={[s.screen, s.center]}>
      <View style={{ overflow: 'hidden', paddingHorizontal: 24 }}>
        <Wordmark size={38} showHangul />
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: 60,
            backgroundColor: 'rgba(201,123,74,0.18)',
            transform: [{ translateX }],
          }}
        />
      </View>
    </View>
  );
}

export function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const [index, setIndex] = useState(0);
  const card = copy.onboarding[index];
  const last = index === copy.onboarding.length - 1;
  const finish = async () => {
    await library.setOnboardingSeen();
    onDone();
  };
  return (
    <View style={s.screen}>
      <View style={{ position: 'absolute', top: 24, right: 16, zIndex: 3 }}>
        <TextButton label="Skip" onPress={finish} color={colorForText()} />
      </View>
      <OnboardingCard title={card.title} body={card.body} />
      <View style={{ paddingHorizontal: 20, paddingBottom: 40, gap: space[4] }}>
        <PageDots count={copy.onboarding.length} active={index} />
        <PrimaryButton
          label={last ? 'Enter' : 'Continue'}
          onPress={() => (last ? finish() : setIndex((i) => i + 1))}
        />
      </View>
    </View>
  );
}

function colorForText(): string {
  return '#F4EFE7';
}
