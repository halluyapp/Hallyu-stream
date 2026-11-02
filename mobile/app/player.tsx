/**
 * Player — watch (§13). Device-direct playback (ADR 001): the player loads the
 * signed CDN URL with configured media headers; nothing is proxied.
 * Honest states: resolve, buffering, bounded re-resolve, failure card.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as ScreenOrientation from 'expo-screen-orientation';
import {
  ChevronLeft,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Settings2,
  Subtitles,
  Maximize,
} from 'lucide-react-native';
import { MEDIA_HEADERS } from '@/services/zarhosting/config';
import { resolveStream } from '@/services/zarhosting/api';
import { colors, fonts, layout, radius, type } from '@/theme/tokens';
import { useLibrary } from '@/lib/store';
import { progressKey } from '@/lib/db';
import { formatTime } from '@/lib/format';
import { BottomSheet } from '@/components/BottomSheet';
import { PrimaryButton, SecondaryButton } from '@/components/Buttons';

type Phase =
  | { kind: 'resolving'; attempt: number }
  | { kind: 'playing' }
  | { kind: 'failed' };

export default function PlayerScreen() {
  const params = useLocalSearchParams<{
    subjectId: string;
    detailPath: string;
    title: string;
    season: string;
    episode: string;
    positionMs: string;
    contentType: string;
    subtitleLangs: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const library = useLibrary();

  const subjectId = params.subjectId ?? '';
  const detailPath = params.detailPath ?? '';
  const titleName = params.title ?? '';
  const season = Number(params.season ?? '1') || 1;
  const episode = Number(params.episode ?? '1') || 1;
  const startPosition = Number(params.positionMs ?? '0') || 0;
  const isSeries = params.contentType === 'series';

  const [phase, setPhase] = useState<Phase>({ kind: 'resolving', attempt: 1 });
  const [sources, setSources] = useState<{ resolution: string | null; url: string }[]>([]);
  const [lockedQuality, setLockedQuality] = useState<string | null>(null); // null = Auto
  const [captions, setCaptions] = useState<{ language: string; url: string }[]>([]);
  // Languages the provider advertises for this title (no track URLs in this build).
  // Languages the provider advertises for this title (no track URLs in this build).
  const [subLangs] = useState<string[]>(() =>
    (params.subtitleLangs ?? '').split('|').map((s) => s.trim()).filter(Boolean),
  );
  const [sheet, setSheet] = useState<'quality' | 'subtitles' | null>(null);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [currentTime, setCurrentTime] = useState(startPosition);
  const [duration, setDuration] = useState(0);
  const [buffering, setBuffering] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSave = useRef(0);
  const activeUrl = useRef<string | null>(null);
  const trackWidth = useRef(0);

  const loadStream = useCallback(
    async (attempt: number, useLocked: string | null) => {
      setPhase({ kind: 'resolving', attempt });
      try {
        const res = await resolveStream(subjectId, detailPath, season, episode);
        if (!res.hasResource || !res.sources.length) {
          setSources([]);
          setPhase({ kind: 'failed' });
          return;
        }
        setSources(res.sources.map((s) => ({ resolution: s.resolution, url: s.url, format: s.format })));
        setCaptions(res.captions.map((c) => ({ language: c.language, url: c.url })));
        setLockedQuality(useLocked);
        const chosen =
          (useLocked ? res.sources.find((s) => s.resolution === useLocked) : undefined) ??
          res.sources.find((s) => s.resolution === (library.settings.defaultQuality === 'auto' ? null : library.settings.defaultQuality)) ??
          res.sources.find((s) => s.resolution === '480p') ??
          res.sources.find((s) => s.resolution === '360p') ??
          res.sources[0];
        if (!chosen) {
          setPhase({ kind: 'failed' });
          return;
        }
        activeUrl.current = chosen.url;
        player.replace({ uri: chosen.url, headers: MEDIA_HEADERS });
        if (startPosition > 0) player.currentTime = startPosition / 1000;
        player.play();
        setPhase({ kind: 'playing' });
        void library
          .addHistory({ subjectId, detailPath, title: titleName, cover: null, season, episode })
          .catch(() => undefined);
      } catch {
        if (attempt < 2) {
          setTimeout(() => void loadStream(attempt + 1, useLocked), 1200);
        } else {
          setPhase({ kind: 'failed' });
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [subjectId, detailPath, season, episode, startPosition, library.settings.defaultQuality, library.addHistory, titleName],
  );

  const player = useVideoPlayer(null, (p) => {
    p.addListener('timeUpdate', (e) => {
      setCurrentTime(e.currentTime * 1000);
      if (p.duration && Number.isFinite(p.duration)) setDuration(p.duration);
    });
    p.addListener('statusChange', (e) => {
      if (e.status === 'loading') setBuffering(true);
      if (e.status === 'readyToPlay') setBuffering(false);
      if (e.status === 'error') {
        // Bounded re-resolve on recoverable failure (§13.5).
        setBuffering(false);
        if (!failedRef.current) void loadStream(2, lockedQuality);
      }
    });
  });

  const failedRef = useRef(false);
  useEffect(() => {
    failedRef.current = phase.kind === 'failed';
  }, [phase.kind]);

  // Initial resolve
  useEffect(() => {
    void loadStream(1, null);
    ScreenOrientation.unlockAsync().catch(() => undefined);
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => undefined);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playing = player.playing;

  // Progress saving: throttled periodic + on pause/unmount (pack 05 §3).
  const saveNow = useCallback(
    (completed = false) => {
      if (!activeUrl.current) return;
      void library
        .saveProgress({
          subjectId,
          detailPath,
          title: titleName,
          cover: null,
          contentType: isSeries ? 'series' : 'movie',
          season,
          episode,
          positionMs: completed ? 0 : currentTime,
          durationMs: duration ? Math.round(duration * 1000) : null,
          completed,
        })
        .catch(() => undefined);
    },
    [currentTime, detailPath, duration, isSeries, library, season, subjectId, titleName, episode],
  );

  useEffect(() => {
    if (!playing) {
      saveNow();
      return;
    }
    const timer = setInterval(() => {
      lastSave.current += 1;
      if (lastSave.current >= 5) {
        lastSave.current = 0;
        saveNow();
      }
    }, 1000);
    return () => {
      clearInterval(timer);
      saveNow();
    };
  }, [playing, saveNow]);

  useEffect(
    () => () => {
      saveNow();
    },
    [saveNow],
  );

  // Controls auto-hide after 3.5s of playback (§13.1).
  const poke = useCallback(() => {
    setControlsVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControlsVisible(false), 3500);
  }, []);
  useEffect(() => {
    if (playing) poke();
    else setControlsVisible(true);
  }, [playing, poke]);

  const seekBy = (sec: number) => {
    const next = Math.max(0, Math.min(player.duration || duration, player.currentTime + sec));
    player.currentTime = next;
    setCurrentTime(next * 1000);
    poke();
  };

  const progressPct = duration ? Math.min(1, currentTime / (duration * 1000)) : 0;

  return (
    <View style={styles.screen}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="contain"
        allowsFullscreen={false}
        allowsPictureInPicture={false}
        requiresLinearPlayback={false}
      />
      <Pressable style={StyleSheet.absoluteFill} onPress={poke} accessibilityLabel="Show controls" />

      {phase.kind === 'resolving' ? (
        <View style={styles.centerChip} pointerEvents="none">
          <Text style={styles.chipText}>
            {phase.attempt > 1 ? `Retrying (${phase.attempt} of 2)…` : 'Preparing the stream…'}
          </Text>
        </View>
      ) : null}

      {buffering && phase.kind === 'playing' ? (
        <View style={styles.centerChip} pointerEvents="none">
          <Text style={styles.chipText}>Still buffering… check your connection</Text>
        </View>
      ) : null}

      {phase.kind === 'failed' ? (
        <View style={styles.failed}>
          <Text style={styles.failedLine}>This stream stopped responding.</Text>
          <Text style={styles.failedBody}>The link to this video expired and couldn't be renewed.</Text>
          <PrimaryButton
            label="Try again"
            onPress={() => {
              failedRef.current = false;
              void loadStream(1, lockedQuality);
            }}
          />
          <SecondaryButton label="Choose another quality" onPress={() => setSheet('quality')} />
          <SecondaryButton
            label="Exit"
            onPress={() => {
              saveNow();
              router.back();
            }}
          />
        </View>
      ) : null}

      {controlsVisible && phase.kind !== 'failed' ? (
        <>
          <View style={[styles.topBar, { top: insets.top }]}>
            <Pressable
              onPress={() => {
                saveNow();
                router.back();
              }}
              style={styles.chromeBtn}
              accessibilityLabel="Back"
            >
              <ChevronLeft size={24} color={colors.textPrimary} strokeWidth={2} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={styles.titleText} numberOfLines={1}>
                {titleName}
                {isSeries ? ` · S${season}:E${episode}` : ''}
              </Text>
            </View>
            <Pressable onPress={() => setSheet('subtitles')} style={styles.chromeBtn} accessibilityLabel="Subtitles">
              <Subtitles size={20} color={colors.textPrimary} strokeWidth={1.75} />
            </Pressable>
            <Pressable onPress={() => setSheet('quality')} style={styles.chromeBtn} accessibilityLabel="Quality">
              <Settings2 size={20} color={colors.textPrimary} strokeWidth={1.75} />
            </Pressable>
            <Pressable
              onPress={() => {
                ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => undefined);
              }}
              style={styles.chromeBtn}
              accessibilityLabel="Fullscreen"
            >
              <Maximize size={20} color={colors.textPrimary} strokeWidth={1.75} />
            </Pressable>
          </View>

          <View style={[styles.bottomBar, { bottom: insets.bottom + 8 }]}>
            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
            <Pressable
              style={styles.track}
              onLayout={(e) => (trackWidth.current = e.nativeEvent.layout.width)}
              onPress={(e) => {
                const w = trackWidth.current;
                if (!w || !duration) return;
                const fraction = Math.max(0, Math.min(1, e.nativeEvent.locationX / w));
                player.currentTime = fraction * duration;
                setCurrentTime(fraction * duration * 1000);
                poke();
              }}
              accessibilityLabel="Seekbar"
            >
              <View style={styles.trackFillWrap}>
                <View style={[styles.trackFill, { flex: progressPct }]} />
                <View style={[styles.trackRest, { flex: Math.max(0.0001, 1 - progressPct) }]} />
              </View>
              <View style={[styles.thumb, { left: `${progressPct * 100}%` }]} />
            </Pressable>
            <Text style={styles.timeText}>{duration ? formatTime(duration * 1000) : '—'}</Text>
            <View style={styles.transport}>
              <Pressable onPress={() => seekBy(-10)} style={styles.chromeBtn} accessibilityLabel="Back 10 seconds">
                <RotateCcw size={22} color={colors.textPrimary} strokeWidth={1.75} />
              </Pressable>
              <Pressable
                onPress={() => (playing ? player.pause() : player.play())}
                style={[styles.chromeBtn, styles.playPause]}
                accessibilityLabel={playing ? 'Pause' : 'Play'}
              >
                {playing ? (
                  <Pause size={26} color={colors.textPrimary} fill={colors.textPrimary} />
                ) : (
                  <Play size={26} color={colors.textPrimary} fill={colors.textPrimary} />
                )}
              </Pressable>
              <Pressable onPress={() => seekBy(10)} style={styles.chromeBtn} accessibilityLabel="Forward 10 seconds">
                <RotateCw size={22} color={colors.textPrimary} strokeWidth={1.75} />
              </Pressable>
            </View>
          </View>
        </>
      ) : null}

      {/* Quality sheet — real sources only (§13.4). */}
      <BottomSheet visible={sheet === 'quality'} onClose={() => setSheet(null)} title="Quality">
        <View style={{ paddingHorizontal: layout.marginMobile, paddingBottom: 40, paddingTop: 8 }}>
          {sources.length ? (
            sources.map((s) => (
              <Pressable
                key={s.url}
                style={styles.sheetRow}
                onPress={() => {
                  setSheet(null);
                  void loadStream(1, s.resolution);
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected: s.resolution === lockedQuality }}
              >
                <Text style={styles.sheetRowLabel}>{s.resolution ?? 'Source'}</Text>
                {s.resolution === lockedQuality ? <View style={styles.currentDot} /> : null}
              </Pressable>
            ))
          ) : (
            <Text style={styles.sheetEmpty}>No selectable qualities right now.</Text>
          )}
          <Pressable
            style={styles.sheetRow}
            onPress={() => {
              setSheet(null);
              void loadStream(1, null);
            }}
          >
            <Text style={[styles.sheetRowLabel, lockedQuality === null && { color: colors.accentCopper }]}>Auto (recommended)</Text>
            {lockedQuality === null ? <View style={styles.currentDot} /> : null}
          </Pressable>
        </View>
      </BottomSheet>

      {/* Subtitles sheet — honesty: only real caption tracks (§13.8). */}
      <BottomSheet visible={sheet === 'subtitles'} onClose={() => setSheet(null)} title="Subtitles">
        <View style={{ paddingHorizontal: layout.marginMobile, paddingBottom: 40, paddingTop: 8 }}>
          {captions.length || subLangs.length ? (
            (captions.length
              ? captions.map((c) => ({ key: c.url, language: c.language }))
              : subLangs.map((l) => ({ key: `lang-${l}`, language: l }))
            ).map((c) => (
              <View key={c.key} style={styles.sheetRow}>
                <Text style={styles.sheetRowLabel}>{c.language}</Text>
                <Text style={styles.sheetEmpty}>Not rendered in this build</Text>
              </View>
            ))
          ) : (
            <Text style={styles.sheetEmpty}>No subtitles for this title.</Text>
          )}
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000000',
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  centerChip: {
    position: 'absolute',
    top: 80,
    alignSelf: 'center',
    backgroundColor: colors.bgGlass,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
  },
  chipText: {
    ...type.meta,
    color: colors.textPrimary,
  },
  failed: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.bgObsidian,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 32,
  },
  failedLine: {
    fontFamily: fonts.display,
    fontSize: 26,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  failedBody: {
    ...type.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 12,
  },
  topBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.bgGlassLow,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.bgGlassLow,
    gap: 8,
  },
  chromeBtn: {
    width: layout.touchMin,
    height: layout.touchMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    ...type.bodyStrong,
    color: colors.textPrimary,
  },
  timeText: {
    ...type.micro,
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  track: {
    flex: 1,
    height: 24,
    justifyContent: 'center',
  },
  trackFillWrap: {
    flexDirection: 'row',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: colors.bgElevated,
  },
  trackFill: {
    backgroundColor: colors.accentCopper,
  },
  trackRest: {
    backgroundColor: colors.bgElevated,
  },
  thumb: {
    position: 'absolute',
    top: 4,
    width: 16,
    height: 16,
    marginLeft: -8,
    borderRadius: radius.pill,
    backgroundColor: colors.accentCopperLight,
  },
  transport: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingTop: 4,
  },
  playPause: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.bgGlass,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    minHeight: layout.touchMin,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  sheetRowLabel: {
    ...type.bodyStrong,
    color: colors.textPrimary,
  },
  sheetEmpty: {
    ...type.meta,
    color: colors.textMuted,
    paddingVertical: 12,
  },
  currentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accentCopper,
  },
});
