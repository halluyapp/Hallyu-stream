import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Video, {OnLoadData, OnProgressData, SelectedTrackType, TextTrackType} from 'react-native-video';
import {api, MEDIA_HEADERS, selectSource, Source, StreamInfo} from '../api/provider';
import {useApp} from '../state/store';
import {useTheme} from '../theme';
import {Icon, ProgressBar} from '../components/ui';
import {formatPosition} from '../core/platform';

type Phase = 'resolving' | 'playing' | 'recovering' | 'failed';

const MAX_RETRIES = 2;

export default function PlayerScreen({route, navigation}: any) {
  const {subjectId, detailPath, title, season, episode, poster, startAtMs = 0} = route.params;
  const {c, t, s, r, device} = useTheme();
  const insets = useSafeAreaInsets();
  const {settings, saveProgress, progressFor, showToast} = useApp();

  const [phase, setPhase] = useState<Phase>('resolving');
  const [stream, setStream] = useState<StreamInfo | null>(null);
  const [source, setSource] = useState<Source | null>(null);
  const [qualityOpen, setQualityOpen] = useState(false);
  const [captionsOn, setCaptionsOn] = useState(settings.subtitlesOn);
  const [paused, setPaused] = useState(false);
  const [position, setPosition] = useState(startAtMs);
  const [duration, setDuration] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [recoveryMessage, setRecoveryMessage] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  const playerRef = useRef<any>(null);
  const retries = useRef(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resumeAt = useRef(startAtMs);
  const savedAt = useRef(0);

  const hideDelay = device.isTv ? 5000 : 3500;

  const scheduleHide = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
    }
    hideTimer.current = setTimeout(() => setControlsVisible(false), hideDelay);
  }, [hideDelay]);

  const revealControls = useCallback(() => {
    setControlsVisible(true);
    scheduleHide();
  }, [scheduleHide]);

  const resolve = useCallback(
    async (isRetry = false) => {
      setPhase(isRetry ? 'recovering' : 'resolving');
      setErrorText(null);
      try {
        const info = await api.stream({subjectId, detailPath, season, episode});
        const picked = selectSource(info, {
          preferred: settings.preferredQuality,
          isTv: device.isTv,
          fallbackToAny: true,
        });
        if (!picked) {
          setPhase('failed');
          setErrorText('No playable source came back for this episode.');
          return;
        }
        setStream(info);
        setSource(picked);
        setRecoveryMessage(
          isRetry ? `Resuming at ${formatPosition(resumeAt.current)}…` : null,
        );
        setPhase('playing');
        scheduleHide();
      } catch (e: any) {
        setPhase('failed');
        setErrorText(e?.message ?? 'This stream stopped responding.');
      }
    },
    [subjectId, detailPath, season, episode, settings.preferredQuality, device.isTv, scheduleHide],
  );

  useEffect(() => {
    void resolve(false);
    return () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Persist progress at most every 5 seconds of playback. */
  const persist = useCallback(
    (pos: number, dur: number) => {
      if (!dur || dur <= 0) {
        return;
      }
      const now = Date.now();
      if (now - savedAt.current < 5000 && pos < dur - 2000) {
        return;
      }
      savedAt.current = now;
      saveProgress({
        subjectId,
        detailPath,
        title,
        poster: poster ?? '',
        season,
        episode,
        positionMs: pos,
        durationMs: dur,
      });
    },
    [subjectId, detailPath, title, poster, season, episode, saveProgress],
  );

  const onLoad = (data: OnLoadData) => {
    setDuration(data.duration * 1000);
    if (resumeAt.current > 1000 && data.duration * 1000 > resumeAt.current) {
      playerRef.current?.seek(resumeAt.current / 1000);
      setPosition(resumeAt.current);
    }
    setPhase('playing');
  };

  const onProgress = (data: OnProgressData) => {
    setPosition(data.currentTime * 1000);
    persist(data.currentTime * 1000, duration);
  };

  /**
   * Signed URLs expire. When playback dies mid-stream we re-resolve the JSON, pick the
   * same quality if it still exists, and seek back to where the viewer was. Two
   * attempts, then we stop and say so plainly.
   */
  const onError = async () => {
    if (retries.current >= MAX_RETRIES) {
      setPhase('failed');
      setErrorText('This stream stopped responding.');
      return;
    }
    retries.current += 1;
    resumeAt.current = position;
    setPhase('recovering');
    setRecoveryMessage('Refreshing the stream…');
    await new Promise(res => setTimeout(res, 900));
    await resolve(true);
  };

  const seekBy = (deltaSeconds: number) => {
    const target = Math.max(0, Math.min(duration / 1000, position / 1000 + deltaSeconds));
    playerRef.current?.seek(target);
    setPosition(target * 1000);
    revealControls();
  };

  const textTracks = useMemo(() => {
    if (!stream) {
      return [];
    }
    return stream.captions.map(cap => ({
      title: cap.label,
      language: cap.language as any,
      type: TextTrackType.SUBRIP,
      uri: cap.url,
    }));
  }, [stream]);

  const selectedTextTrack = useMemo(() => {
    if (!captionsOn || textTracks.length === 0) {
      return {type: SelectedTrackType.DISABLED} as const;
    }
    const preferred = textTracks.find(x => x.language === settings.subtitleLanguage);
    return preferred
      ? ({type: SelectedTrackType.LANGUAGE, value: preferred.language} as const)
      : ({type: SelectedTrackType.INDEX, value: 0} as const);
  }, [captionsOn, textTracks, settings.subtitleLanguage]);

  const close = () => {
    if (duration > 0) {
      persist(position, duration);
    }
    navigation.goBack();
  };

  const titleLine = season > 0 ? `${title} · S${season} E${episode}` : title;

  return (
    <View style={{flex: 1, backgroundColor: '#000'}}>
      <StatusBar hidden />
      {source ? (
        <Video
          ref={playerRef}
          source={{uri: source.url, headers: MEDIA_HEADERS}}
          style={StyleSheet.absoluteFill}
          resizeMode="contain"
          paused={paused}
          onLoad={onLoad}
          onProgress={onProgress}
          onError={onError}
          onEnd={() => {
            persist(duration, duration);
            if (settings.autoplayNext && season > 0) {
              navigation.replace('Player', {
                ...route.params,
                episode: episode + 1,
                startAtMs: 0,
              });
            } else {
              setControlsVisible(true);
            }
          }}
          progressUpdateInterval={1000}
          textTracks={textTracks}
          selectedTextTrack={selectedTextTrack}
          playInBackground={false}
          playWhenInactive={false}
          bufferConfig={{minBufferMs: 15000, maxBufferMs: 50000, bufferForPlaybackMs: 2500}}
        />
      ) : null}

      {/* Tap surface: reveals chrome, never blocks playback. */}
      <Pressable style={StyleSheet.absoluteFill} onPress={revealControls} accessibilityLabel="Show controls" />

      {phase === 'resolving' || phase === 'recovering' ? (
        <View style={[styles.center, {backgroundColor: 'rgba(0,0,0,0.55)'}]} pointerEvents="none">
          <ActivityIndicator color={c.copper} />
          <Text style={[t.bodyMd, {color: c.ivory, marginTop: s.md}]}>
            {phase === 'resolving' ? 'Finding the best source…' : recoveryMessage ?? 'Refreshing the stream…'}
          </Text>
          {phase === 'recovering' ? (
            <Text style={[t.micro, {color: c.muted, marginTop: 4}]}>
              Attempt {retries.current} of {MAX_RETRIES}
            </Text>
          ) : null}
        </View>
      ) : null}

      {phase === 'failed' ? (
        <View style={[styles.center, {backgroundColor: 'rgba(0,0,0,0.85)', padding: s.xl}]}>
          <Icon name="alert" size={34} color={c.warning} />
          <Text style={[t.titleMd, {color: c.ivory, marginTop: s.md, textAlign: 'center'}]}>
            {errorText ?? 'This stream stopped responding.'}
          </Text>
          <Text style={[t.bodySm, {color: c.muted, marginTop: s.xs, textAlign: 'center'}]}>
            The link may have expired. Re-resolving usually fixes it.
          </Text>
          <View style={{flexDirection: 'row', gap: s.sm, marginTop: s.lg}}>
            <Pressable
              onPress={() => {
                retries.current = 0;
                resumeAt.current = position;
                void resolve(false);
              }}
              style={{paddingHorizontal: s.lg, paddingVertical: 12, borderRadius: r.pill, backgroundColor: c.copper}}>
              <Text style={[t.labelLg, {color: c.obsidian}]}>Try again</Text>
            </Pressable>
            <Pressable
              onPress={close}
              style={{paddingHorizontal: s.lg, paddingVertical: 12, borderRadius: r.pill, borderWidth: 1, borderColor: c.hairlineStrong}}>
              <Text style={[t.labelLg, {color: c.ivory}]}>Close</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {controlsVisible && phase === 'playing' ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <View style={[styles.topBar, {paddingTop: insets.top + s.sm}]}>
            <Pressable onPress={close} hitSlop={12} accessibilityLabel="Close player" style={{padding: s.xs}}>
              <Icon name="close" size={24} color={c.ivory} />
            </Pressable>
            <View style={{flex: 1, marginLeft: s.sm}}>
              <Text numberOfLines={1} style={[t.titleSm, {color: c.ivory}]}>
                {titleLine}
              </Text>
              {source ? (
                <Text style={[t.micro, {color: c.muted}]}>
                  {source.quality} · {source.format}
                  {stream?.limited ? ' · limited' : ''}
                </Text>
              ) : null}
            </View>
            {stream && stream.sources.length > 1 ? (
              <Pressable onPress={() => setQualityOpen(v => !v)} hitSlop={10} accessibilityLabel="Choose quality" style={{padding: s.xs}}>
                <Text style={[t.labelLg, {color: c.copperLight}]}>{source?.quality ?? 'Auto'}</Text>
              </Pressable>
            ) : null}
          </View>

          {qualityOpen && stream ? (
            <View style={[styles.qualityPanel, {backgroundColor: c.glass, borderColor: c.hairline, borderRadius: r.md, right: s.gutter, top: insets.top + 64}]}>
              {Array.from(new Map(stream.sources.map(x => [x.quality, x])).values()).map(opt => (
                <Pressable
                  key={opt.quality}
                  onPress={() => {
                    resumeAt.current = position;
                    setSource(opt);
                    setQualityOpen(false);
                    showToast(`${opt.quality} selected`);
                  }}
                  style={{paddingVertical: 10, paddingHorizontal: s.md}}>
                  <Text
                    style={[
                      t.labelLg,
                      {color: opt.quality === source?.quality ? c.copperLight : c.ivory},
                    ]}>
                    {opt.quality}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          <View style={styles.centerControls} pointerEvents="box-none">
            <Pressable onPress={() => seekBy(-10)} hitSlop={12} accessibilityLabel="Rewind ten seconds" style={{padding: s.md}}>
              <Icon name="rewind" size={30} color={c.ivory} />
            </Pressable>
            <Pressable
              onPress={() => {
                setPaused(p => !p);
                revealControls();
              }}
              accessibilityLabel={paused ? 'Play' : 'Pause'}
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: c.glass,
                borderWidth: 1,
                borderColor: c.hairlineStrong,
                alignItems: 'center',
                justifyContent: 'center',
                marginHorizontal: s.lg,
              }}>
              <Icon name={paused ? 'play' : 'pause'} size={28} color={c.ivory} />
            </Pressable>
            <Pressable onPress={() => seekBy(10)} hitSlop={12} accessibilityLabel="Forward ten seconds" style={{padding: s.md}}>
              <Icon name="skip" size={30} color={c.ivory} />
            </Pressable>
          </View>

          <View style={[styles.bottomBar, {paddingBottom: insets.bottom + s.md}]}>
            <Text style={[t.micro, {color: c.ivory, width: 56}]}>{formatPosition(position)}</Text>
            <View style={{flex: 1, marginHorizontal: s.sm}}>
              <ProgressBar ratio={duration > 0 ? position / duration : 0} height={4} />
            </View>
            <Text style={[t.micro, {color: c.muted, width: 56, textAlign: 'right'}]}>{formatPosition(duration)}</Text>
            {textTracks.length > 0 ? (
              <Pressable
                onPress={() => {
                  setCaptionsOn(v => !v);
                  revealControls();
                }}
                hitSlop={10}
                accessibilityLabel="Toggle subtitles"
                style={{marginLeft: s.md}}>
                <Icon name="subtitles" size={20} color={captionsOn ? c.copper : c.ivory} />
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center'},
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(10,11,13,0.72)',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: 'rgba(10,11,13,0.72)',
  },
  centerControls: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qualityPanel: {position: 'absolute', borderWidth: 1, paddingVertical: 4, minWidth: 120},
});
