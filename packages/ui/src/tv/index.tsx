import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { color, copy, pairing, radius, seasonEpisodeForTitle, space, type Title } from '@hallyu/shared';
import { InlineBanner, PrimaryButton, SecondaryButton, Wordmark } from '../components';
import { s, tvText } from '../theme';
import { FocusProvider, Focusable, useFocusScope } from './focus';
import { TvNavProvider, type TvNavApi, type TvPane, type TvRoute } from './context';
import {
  LeftRail,
  TvActivationScreen,
  TvDetailScreen,
  TvDevicesScreen,
  TvExploreScreen,
  TvHomeScreen,
  TvLibraryScreen,
  TvPlayerScreen,
  TvSearchScreen,
  TvSettingsScreen,
} from './screens';

function ExitDialog({ visible, onConfirm, onCancel }: { visible: boolean; onConfirm: () => void; onCancel: () => void }) {
  if (!visible) return null;
  return <ExitDialogContent onConfirm={onConfirm} onCancel={onCancel} />;
}

function ExitDialogContent({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  useFocusScope('exit');
  return (
    <View style={[s.fill, s.center, { backgroundColor: color.bg.veil }]}>
      <View style={[s.elevated, { padding: space[8], gap: space[4], width: 640, borderRadius: radius.md }]}>
        <Text style={tvText('h2')}>Leave HALLYU-STREAM?</Text>
        <Text style={[tvText('body'), { color: color.text.muted }]}>Playback will stop and your position is saved.</Text>
        <View style={[s.row, { gap: space[3] }]}>
          <Focusable id="exit-confirm" scope="exit" onSelect={onConfirm} style={{ borderRadius: radius.sm }}>
            <PrimaryButton label="Exit" tv />
          </Focusable>
          <Focusable id="exit-cancel" scope="exit" onSelect={onCancel} style={{ borderRadius: radius.sm }}>
            <SecondaryButton label={copy.actions.cancel} tv />
          </Focusable>
        </View>
      </View>
    </View>
  );
}

function PaneScreen({ pane }: { pane: TvPane }) {
  switch (pane) {
    case 'explore': return <TvExploreScreen />;
    case 'search': return <TvSearchScreen />;
    case 'library': return <TvLibraryScreen />;
    case 'settings': return <TvSettingsScreen />;
    case 'devices': return <TvDevicesScreen />;
    default: return <TvHomeScreen />;
  }
}

export function TvApp({ initialPane = 'home' }: { initialPane?: TvPane }) {
  const [paired, setPaired] = useState<boolean | null>(null);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [pane, setPane] = useState<TvPane>(initialPane);
  const [stack, setStack] = useState<TvRoute[]>([]);
  const [keyboardVisible, setKeyboardVisible] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [exitConfirm, setExitConfirm] = useState(false);
  const [playPauseSignal, setPlayPauseSignal] = useState(0);
  const [checkTick, setCheckTick] = useState(0);

  const checkPairing = useCallback(async () => {
    setServiceError(null);
    const credential = await pairing.getTvCredential();
    if (!credential) {
      setPaired(false);
      return;
    }
    try {
      const heartbeat = await pairing.heartbeat(credential.deviceToken);
      if (heartbeat.revoked) {
        await pairing.clearTvCredential();
        setPaired(false);
      } else {
        setPaired(true);
      }
    } catch (error) {
      // No fake "still paired" state when the service cannot confirm the session (`14.4`).
      setServiceError(error instanceof Error ? error.message : copy.states.pairingServiceDown.body);
      setPaired(false);
    }
  }, []);

  useEffect(() => {
    void checkPairing();
  }, [checkPairing, checkTick]);

  const handleBack = useCallback(() => {
    if (exitConfirm) { setExitConfirm(false); return; }
    if (settingsOpen) { setSettingsOpen(false); return; }
    if (keyboardVisible && pane === 'search') { setKeyboardVisible(false); return; }
    if (stack.length) { setStack((prev) => prev.slice(0, -1)); return; }
    if (pane !== 'home') { setPane('home'); return; }
    setExitConfirm(true);
  }, [exitConfirm, settingsOpen, keyboardVisible, pane, stack.length]);

  const handlePlayPause = useCallback(() => setPlayPauseSignal((v) => v + 1), []);
  const handleMenu = useCallback(() => setSettingsOpen((v) => !v), []);

  const switchPane = useCallback((next: TvPane) => {
    setPane(next);
    setStack([]);
    setSettingsOpen(false);
    setKeyboardVisible(next === 'search');
  }, []);

  const openDetail = useCallback((title: Title) => {
    const { season, episode } = seasonEpisodeForTitle(title);
    setStack((prev) => [...prev, { name: 'detail', title, season, episode }]);
  }, []);

  const openPlayer = useCallback((title: Title, season: number, episode: number, startPositionMs?: number) => {
    setStack((prev) => [...prev, { name: 'player', title, season, episode, startPositionMs }]);
  }, []);

  const unpairLocal = useCallback(async () => {
    await pairing.clearTvCredential();
    setStack([]);
    setPane('home');
    setPaired(false);
  }, []);

  const navValue = useMemo<TvNavApi>(
    () => ({
      pane,
      stack,
      keyboardVisible,
      settingsOpen,
      switchPane,
      openDetail,
      openPlayer,
      back: handleBack,
      setKeyboardVisible,
      setSettingsOpen,
      unpairLocal,
    }),
    [pane, stack, keyboardVisible, settingsOpen, switchPane, openDetail, openPlayer, handleBack, unpairLocal],
  );

  const route = stack[stack.length - 1];

  return (
    <FocusProvider initialScope="activation" onBack={handleBack} onPlayPause={handlePlayPause} onMenu={handleMenu}>
      <TvNavProvider value={navValue}>
        {paired === null ? (
          <View style={[s.screen, s.center, { gap: space[5] }]}>
            <Wordmark size={64} showHangul tv />
            <ActivityIndicator color={color.accent.copper} />
          </View>
        ) : !paired ? (
          <View style={s.screen}>
            {serviceError && (
              <InlineBanner
                message={serviceError}
                tone="error"
                tv
                actionLabel={copy.actions.retry}
                onAction={() => setCheckTick((v) => v + 1)}
              />
            )}
            <TvActivationScreen onPaired={() => setPaired(true)} />
          </View>
        ) : (
          <View style={[s.screen, { flexDirection: 'row' }]}>
            <LeftRail />
            <View style={{ flex: 1 }}>
              {route ? (
                route.name === 'detail' ? <TvDetailScreen route={route} /> : <TvPlayerScreen route={route} playPauseSignal={playPauseSignal} />
              ) : (
                <PaneScreen pane={pane} />
              )}
            </View>
            <ExitDialog visible={exitConfirm} onConfirm={() => setExitConfirm(false)} onCancel={() => setExitConfirm(false)} />
          </View>
        )}
      </TvNavProvider>
    </FocusProvider>
  );
}

export * from './context';
export * from './focus';
