import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, View } from 'react-native';
import {
  MEDIA_REQUEST_HEADERS,
  cleanShortCode,
  color,
  copy,
  episodeLabel,
  formatBytes,
  formatShortCode,
  formatTime,
  layout,
  library,
  nextEpisode,
  pairing,
  parseQrPayload,
  progressKey,
  radius,
  space,
  type Caption,
  type DownloadEntry,
  type PairedDevice,
  type PairingSession,
  type Title,
} from '@hallyu/shared';
import {
  ApprovalCard,
  BottomSheet,
  Chip,
  CountdownRing,
  DeviceCard,
  Dialog,
  DownloadRow,
  EmptyState,
  ErrorState,
  HistoryRow,
  IconButton,
  InlineBanner,
  LoadingState,
  NextEpisodeCard,
  PermissionPrimer,
  PosterGrid,
  PrimaryButton,
  QRPanel,
  ReelLabel,
  SecondaryButton,
  SegmentChips,
  Seekbar,
  SettingsRow,
  SkeletonBlock,
  Snackbar,
  StorageMeter,
  TextButton,
  Toggle,
  Wordmark,
} from '../components';
import { useLibraryList, useSelectedSource, useStream } from '../hooks/useCatalogue';
import { Icon, useLibraryVersion, usePlatform, useSettings } from '../platform/context';
import { glassStyle, mobileText, s } from '../theme';
import { useMobileNav } from './navigation';

const MARGIN = layout.marginMobile;

// ── Player ────────────────────────────────────────────────────────────────

export function PlayerScreen({
  title,
  season,
  episode,
  startPositionMs,
}: {
  title: Title;
  season: number;
  episode: number;
  startPositionMs?: number;
}) {
  const nav = useMobileNav();
  const { Video, haptics } = usePlatform();
  const { settings, update } = useSettings();
  const stream = useStream({ subjectId: title.subjectId, detailPath: title.detailPath, season, episode });

  const [paused, setPaused] = useState(false);
  const [controls, setControls] = useState(true);
  const [positionMs, setPositionMs] = useState(startPositionMs ?? 0);
  const [durationMs, setDurationMs] = useState<number | undefined>();
  const [quality, setQuality] = useState(settings.defaultQuality);
  const [subtitle, setSubtitle] = useState(settings.subtitleLanguage);
  const [qualityOpen, setQualityOpen] = useState(false);
  const [subtitleOpen, setSubtitleOpen] = useState(false);
  const [buffering, setBuffering] = useState(true);
  const [slowBuffer, setSlowBuffer] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [fatal, setFatal] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [nextUp, setNextUp] = useState(false);
  const [seekToMs, setSeekToMs] = useState<number | undefined>(startPositionMs);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const positionRef = useRef(positionMs);
  const durationRef = useRef(durationMs);
  positionRef.current = positionMs;
  durationRef.current = durationMs;

  const source = useSelectedSource(stream.data, quality);
  const captions = stream.data?.captions ?? [];
  const selectedCaption = captions.find((c) => (c.languageCode || c.language) === subtitle);
  const key = progressKey(title.subjectId, season, episode);
  const following = nextEpisode(title.seasons, season, episode);

  const save = useCallback(
    async (pos = positionRef.current, dur = durationRef.current, done = false) => {
      await library.saveProgress(title, pos, { season, episode, durationMs: dur, completed: done });
    },
    [title, season, episode],
  );

  // Save periodically, on pause, and on exit — never every frame (`05` §3).
  useEffect(() => {
    if (paused || fatal) return;
    const id = setInterval(() => void save(), 5000);
    return () => clearInterval(id);
  }, [paused, fatal, save]);
  useEffect(() => () => void save(), [save]);
  useEffect(() => {
    if (paused) void save();
  }, [paused, save]);

  // Controls auto-hide after 3.5s of uninterrupted playback (`13.1`).
  useEffect(() => {
    if (paused || fatal || completed || nextUp || qualityOpen || subtitleOpen) {
      setControls(true);
      return;
    }
    setControls(true);
    hideTimer.current = setTimeout(() => setControls(false), 3500);
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [paused, fatal, completed, nextUp, qualityOpen, subtitleOpen]);

  useEffect(() => {
    if (!buffering) {
      setSlowBuffer(false);
      return;
    }
    const id = setTimeout(() => setSlowBuffer(true), 8000);
    return () => clearTimeout(id);
  }, [buffering]);

  useEffect(() => {
    if (!stream.data) return;
    setBuffering(false);
    setNotice(null);
    setSeekToMs(positionRef.current || startPositionMs);
    if (!stream.data.sources.length) setFatal(copy.states.noSources.body);
  }, [stream.data, startPositionMs]);

  const showControls = useCallback(() => setControls(true), []);
  const togglePlay = useCallback(() => {
    showControls();
    haptics.light();
    setPaused((v) => !v);
  }, [showControls, haptics]);

  const seek = useCallback(
    (ms: number) => {
      showControls();
      setPositionMs(Math.max(0, ms));
      setSeekToMs(Math.max(0, ms));
      void save(Math.max(0, ms));
    },
    [showControls, save],
  );
  const seekBy = useCallback((delta: number) => seek(positionRef.current + delta), [seek]);

  const handleVideoError = useCallback(
    (message: string) => {
      if (retryCount < 2) {
        const nextCount = retryCount + 1;
        setRetryCount(nextCount);
        setBuffering(true);
        setNotice(nextCount === 1 ? copy.states.refreshingStream : copy.states.retryingStream);
        stream.reload(); // fresh signed URL — never reuse the expired one (`05` §2)
        return;
      }
      setBuffering(false);
      setNotice(null);
      setFatal(`${copy.states.streamFailed.title} ${message}`.trim());
    },
    [retryCount, stream],
  );

  const handleEnd = useCallback(async () => {
    setCompleted(true);
    await save(positionRef.current, durationRef.current, true);
    if (following && settings.autoplayNext) setNextUp(true);
  }, [save, following, settings.autoplayNext]);

  const manualRetry = useCallback(() => {
    setRetryCount(0);
    setFatal(null);
    setBuffering(true);
    setNotice(copy.states.refreshingStream);
    stream.reload();
  }, [stream]);

  const chooseQuality = useCallback(
    async (value: string) => {
      setQuality(value);
      await update({ defaultQuality: value });
      setQualityOpen(false);
      setBuffering(true);
    },
    [update],
  );

  const chooseSubtitle = useCallback(
    async (value: string) => {
      setSubtitle(value);
      await update({ subtitleLanguage: value });
      setSubtitleOpen(false);
    },
    [update],
  );

  const exit = useCallback(() => {
    void save();
    nav.back();
  }, [save, nav]);

  if (fatal) {
    return (
      <View style={[s.screen, s.center]}>
        <ErrorState
          title={copy.states.streamFailed.title}
          body={fatal}
          actionLabel={copy.actions.retry}
          onAction={manualRetry}
          secondaryLabel={copy.actions.chooseAnotherQuality}
          onSecondary={() => setQualityOpen(true)}
        />
        <TextButton label={copy.actions.exit} onPress={exit} />
      </View>
    );
  }

  return (
    <View style={s.screen}>
      <View style={[s.fill, { backgroundColor: '#000' }]}>
        {Video && source ? (
          <Video
            sourceUrl={source.url}
            headers={MEDIA_REQUEST_HEADERS}
            paused={paused}
            seekToMs={seekToMs}
            captionUrl={selectedCaption?.url}
            captionLabel={selectedCaption?.language}
            style={s.fill}
            onProgress={(pos, dur) => {
              setPositionMs(pos);
              if (dur) setDurationMs(dur);
            }}
            onReady={() => setBuffering(false)}
            onBuffer={(b) => setBuffering(b)}
            onError={handleVideoError}
            onEnd={() => void handleEnd()}
          />
        ) : (
          <View style={[s.fill, s.center, { padding: MARGIN, gap: space[4] }]}>
            {stream.loading ? <LoadingState rows={1} /> : null}
            {!stream.loading && !source && (
              <InlineBanner message={copy.labels.previewMediaLimitation} tone="warning" />
            )}
            {stream.error && <InlineBanner message={stream.error} tone="error" actionLabel={copy.actions.retry} onAction={manualRetry} />}
          </View>
        )}
      </View>

      {buffering && !fatal && (
        <View style={[s.fill, s.center, { pointerEvents: 'none' }]}>
          <View style={[glassStyle(settings.lowTier), { paddingHorizontal: space[5], paddingVertical: space[3] }]}>
            <ActivityIndicator color={color.accent.copper} />
            <Text style={[mobileText('meta'), { color: color.text.muted, marginTop: space[2] }]}>{copy.labels.preparingStream}</Text>
          </View>
        </View>
      )}
      {slowBuffer && buffering && (
        <View style={{ position: 'absolute', top: 80, alignSelf: 'center' }}>
          <InlineBanner message={copy.states.stillBuffering} tone="warning" />
        </View>
      )}
      {notice && (
        <View style={{ position: 'absolute', top: 80, alignSelf: 'center' }}>
          <View style={[glassStyle(settings.lowTier), { paddingHorizontal: space[5], paddingVertical: space[2] }]}>
            <Text style={mobileText('meta')}>{notice}</Text>
          </View>
        </View>
      )}

      {controls && !fatal && (
        <View style={[s.fill, { justifyContent: 'space-between', padding: MARGIN, paddingTop: 40 }]}>
          <View style={[glassStyle(settings.lowTier), s.rowBetween, { paddingHorizontal: space[3], minHeight: 52, gap: space[3] }]}>
            <IconButton name="chevronLeft" onPress={exit} label="Exit player" />
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={mobileText('bodyStrong')}>{title.title}</Text>
              <Text style={[mobileText('micro'), { color: color.text.muted }]}>{episodeLabel(season, episode)} · {source?.resolution || 'Auto'}</Text>
            </View>
            <IconButton name="cc" onPress={() => setSubtitleOpen(true)} label="Subtitles" />
            <IconButton name="quality" onPress={() => setQualityOpen(true)} label="Quality" />
            <IconButton name="expand" onPress={showControls} label="Fullscreen" />
          </View>

          <View style={[glassStyle(settings.lowTier), { paddingHorizontal: space[4], paddingVertical: space[3], gap: space[2] }]}>
            <View style={[s.row, { justifyContent: 'center', gap: space[6] }]}>
              <IconButton name="seekBack" onPress={() => seekBy(-10_000)} label="Seek back 10 seconds" />
              <IconButton name={paused ? 'play' : 'pause'} onPress={togglePlay} label={paused ? 'Play' : 'Pause'} />
              <IconButton name="seekForward" onPress={() => seekBy(10_000)} label="Seek forward 10 seconds" />
            </View>
            <Seekbar positionMs={positionMs} durationMs={durationMs} onSeek={seek} />
          </View>
        </View>
      )}

      {!controls && !paused && !fatal && (
        <View style={[s.fill, { pointerEvents: 'box-none' }]}>
          <View style={{ flex: 1 }} onTouchEnd={showControls} />
        </View>
      )}

      {completed && !nextUp && (
        <View style={[s.fill, s.center, { backgroundColor: color.bg.veil, padding: MARGIN, gap: space[4] }]}>
          <Text style={mobileText('displayL')}>{following ? copy.states.endOfSeries.title : 'Finished'}</Text>
          {following ? (
            <TextButton label={copy.actions.backToSeries} onPress={exit} color={color.accent.copperLight} />
          ) : (
            <PrimaryButton label={copy.actions.watchAgain} onPress={() => { setCompleted(false); seek(0); setPaused(false); }} icon="replay" />
          )}
          <TextButton label={copy.actions.backToDetail} onPress={exit} />
        </View>
      )}

      {nextUp && following && (
        <View style={[s.fill, { justifyContent: 'flex-end', alignItems: 'center', padding: MARGIN }]}>
          <NextEpisodeCard
            title={`${title.title} · E${following.episode}`}
            episode={episodeLabel(following.season, following.episode)}
            onPlayNow={() => {
              setNextUp(false);
              nav.navigate({ name: 'player', title, season: following.season, episode: following.episode });
            }}
            onCancel={() => setNextUp(false)}
          />
        </View>
      )}

      <BottomSheet visible={qualityOpen} onClose={() => setQualityOpen(false)} title="Quality">
        {stream.loading && <SkeletonBlock width="100%" height={48} />}
        <View style={{ gap: space[3], paddingBottom: space[4] }}>
          <SecondaryButton label={copy.labels.autoRecommended} onPress={() => void chooseQuality('auto')} />
          {(stream.data?.sources ?? []).map((src) => (
            <SecondaryButton
              key={src.url}
              label={`${src.resolution || 'Source'} · ${formatBytes(src.size)}`}
              onPress={() => void chooseQuality(src.resolution || 'auto')}
            />
          ))}
        </View>
      </BottomSheet>

      <BottomSheet visible={subtitleOpen} onClose={() => setSubtitleOpen(false)} title="Subtitles">
        <View style={{ gap: space[3], paddingBottom: space[4] }}>
          <SecondaryButton label={copy.labels.off} onPress={() => void chooseSubtitle('off')} />
          {captions.length ? captions.map((caption) => (
            <SecondaryButton
              key={caption.url}
              label={caption.language}
              onPress={() => void chooseSubtitle(caption.languageCode || caption.language)}
            />
          )) : <Text style={[mobileText('body'), { color: color.text.muted }]}>{copy.states.noSubtitles}</Text>}
        </View>
      </BottomSheet>
    </View>
  );
}

// ── Library ───────────────────────────────────────────────────────────────

export function LibraryScreen({ initialSegment = 'continue' }: { initialSegment?: 'continue' | 'list' | 'history' | 'downloads' }) {
  const nav = useMobileNav();
  const [segment, setSegment] = useState(initialSegment);
  const [removeKey, setRemoveKey] = useState<string | null>(null);
  const [snack, setSnack] = useState<string | null>(null);
  const continuing = useLibraryList(() => library.getContinueWatching());
  const watchlist = useLibraryList(() => library.getWatchlist());
  const history = useLibraryList(() => library.getHistory());
  const downloads = useLibraryList(() => library.getDownloads());
  const { downloads: manager } = usePlatform();

  const segments = [
    { id: 'continue', label: 'Continue' },
    { id: 'list', label: copy.labels.myList },
    { id: 'history', label: copy.labels.history },
    { id: 'downloads', label: copy.labels.downloads },
  ] as const;

  return (
    <View style={s.screen}>
      <ScrollView contentContainerStyle={{ padding: MARGIN, paddingBottom: 100, gap: space[4] }}>
        <Text style={mobileText('h1')}>Library</Text>
        <SegmentChips items={segments.map((x) => ({ id: x.id, label: x.label }))} active={segment} onChange={(id) => setSegment(id as typeof segment)} />

        {segment === 'continue' && (continuing.length ? continuing.map((entry) => (
          <ContinueRow key={entry.key} entry={entry} onPlay={() => nav.navigate({ name: 'player', title: { subjectId: entry.subjectId, detailPath: entry.detailPath, title: entry.title, cover: entry.cover, genres: [], contentType: entry.season > 0 ? 'series' : 'movie', seasons: [] }, season: entry.season, episode: entry.episode, startPositionMs: entry.positionMs })} onRemove={() => setRemoveKey(entry.key)} />
        )) : <EmptyState title={copy.states.emptyContinue.title} body={copy.states.emptyContinue.body} actionLabel={copy.states.emptyContinue.action} onAction={() => nav.switchTab('home')} />)}

        {segment === 'list' && (watchlist.length ? (
          <View style={{ height: 620 }}>
            <PosterGrid titles={watchlist.map((w) => ({ subjectId: w.subjectId, detailPath: w.detailPath, title: w.title, cover: w.cover, genres: [], contentType: 'unknown' as const, seasons: [] }))} onTitlePress={(t) => nav.navigate({ name: 'detail', title: t })} columns={2} />
          </View>
        ) : <EmptyState title={copy.states.emptyWatchlist.title} body={copy.states.emptyWatchlist.body} actionLabel={copy.states.emptyWatchlist.action} onAction={() => nav.switchTab('home')} />)}

        {segment === 'history' && (history.length ? history.map((entry) => (
          <HistoryRow key={entry.key} entry={entry} onPlay={() => nav.navigate({ name: 'detail', title: { subjectId: entry.subjectId, detailPath: entry.detailPath, title: entry.title, cover: entry.cover, genres: [], contentType: 'unknown', seasons: [] } })} />
        )) : <EmptyState title={copy.states.emptyHistory.title} body={copy.states.emptyHistory.body} actionLabel={copy.states.emptyHistory.action} onAction={() => nav.switchTab('home')} />)}

        {segment === 'downloads' && (
          <View style={{ gap: space[4] }}>
            {!manager && <InlineBanner message={copy.labels.previewDownloads} tone="info" />}
            <StorageMeter used={downloads.reduce((sum, d) => sum + (d.bytes ?? 0), 0)} free={0} />
            <PrimaryButton label="Manage downloads" onPress={() => nav.navigate({ name: 'downloads' })} icon="download" />
            {downloads.length ? downloads.map((entry) => <DownloadRow key={entry.id} entry={entry} />) : <EmptyState title="No downloads yet." body="Choose a quality on any title detail to keep it on this device." actionLabel={copy.actions.browseHome} onAction={() => nav.switchTab('home')} />}
          </View>
        )}
      </ScrollView>

      <Dialog
        visible={Boolean(removeKey)}
        title="Remove from Continue Watching?"
        body="This clears your saved position for this episode. The title stays in your history."
        confirmLabel="Remove"
        destructive
        onConfirm={async () => { if (removeKey) await library.removeProgress(removeKey); setRemoveKey(null); setSnack('Removed from Continue Watching'); }}
        onCancel={() => setRemoveKey(null)}
      />
      <Snackbar message={snack || ''} visible={Boolean(snack)} actionLabel="Dismiss" onAction={() => setSnack(null)} />
    </View>
  );
}

function ContinueRow({ entry, onPlay, onRemove }: { entry: { key: string; title: string; cover?: string; season: number; episode: number; positionMs: number }; onPlay: () => void; onRemove: () => void }) {
  return (
    <View style={[s.row, { gap: space[3], paddingVertical: space[2], borderBottomWidth: 1, borderBottomColor: color.hairline }]}>
      <View style={{ flex: 1 }}>
        <Text style={mobileText('bodyStrong')}>{entry.title}</Text>
        <Text style={[mobileText('meta'), { color: color.text.muted }]}>{episodeLabel(entry.season, entry.episode)} · {formatTime(entry.positionMs)}</Text>
      </View>
      <IconButton name="play" onPress={onPlay} label="Resume" />
      <IconButton name="clear" onPress={onRemove} label="Remove" />
    </View>
  );
}

export function DownloadsScreen() {
  const nav = useMobileNav();
  const downloads = useLibraryList(() => library.getDownloads());
  const { downloads: manager } = usePlatform();
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [snack, setSnack] = useState<string | null>(null);

  return (
    <View style={s.screen}>
      <ScrollView contentContainerStyle={{ padding: MARGIN, paddingBottom: 100, gap: space[4] }}>
        <View style={[s.rowBetween]}>
          <Text style={mobileText('h1')}>Downloads</Text>
          <IconButton name="chevronLeft" onPress={nav.back} label="Back" />
        </View>
        {!manager && <InlineBanner message={copy.labels.previewDownloads} tone="info" />}
        <Text style={[mobileText('meta'), { color: color.text.muted }]}>{copy.labels.backgroundDownloadsExperimental}</Text>
        <StorageMeter used={downloads.reduce((sum, d) => sum + (d.bytes ?? 0), 0)} free={0} />
        <ReelLabel>Downloading</ReelLabel>
        {downloads.filter((d) => ['queued', 'downloading', 'paused', 'interrupted', 'failed'].includes(d.status)).map((entry) => (
          <DownloadRow key={entry.id} entry={entry} onRetry={() => void manager?.retry(entry.id)} onCancel={() => setCancelId(entry.id)} />
        ))}
        <ReelLabel>Available offline</ReelLabel>
        {downloads.filter((d) => d.status === 'complete').map((entry) => <DownloadRow key={entry.id} entry={entry} />)}
        {!downloads.length && <EmptyState title="Nothing downloaded." body="Keep a title on this device from its detail screen." actionLabel={copy.actions.browseHome} onAction={() => nav.switchTab('home')} />}
      </ScrollView>
      <Dialog
        visible={Boolean(cancelId)}
        title="Cancel this download?"
        body="The partial file is removed. You can start again from the title detail screen."
        confirmLabel="Cancel download"
        destructive
        onConfirm={async () => { if (cancelId) { await manager?.cancel(cancelId); await library.removeDownload(cancelId); } setCancelId(null); setSnack('Download cancelled'); }}
        onCancel={() => setCancelId(null)}
      />
      <Snackbar message={snack || ''} visible={Boolean(snack)} actionLabel="Dismiss" onAction={() => setSnack(null)} />
    </View>
  );
}

// ── Settings ──────────────────────────────────────────────────────────────

export function SettingsScreen() {
  const nav = useMobileNav();
  const { settings, update } = useSettings();
  const [clearConfirm, setClearConfirm] = useState(false);
  const [snack, setSnack] = useState<string | null>(null);
  const version = useLibraryVersion();

  return (
    <ScrollView style={s.screen} contentContainerStyle={{ padding: MARGIN, paddingBottom: 100, gap: space[5] }}>
      <Text style={mobileText('h1')}>Settings</Text>
      <InlineBanner message="No account is required. Your list, history and progress stay on this device." tone="info" />

      <View>
        <ReelLabel>Playback</ReelLabel>
        <SettingsRow label="Default quality" value={settings.defaultQuality === 'auto' ? 'Auto' : settings.defaultQuality} onPress={() => nav.navigate({ name: 'settingsSub', section: 'quality' })} />
        <SettingsRow label="Subtitle language" value={settings.subtitleLanguage === 'off' ? copy.labels.off : settings.subtitleLanguage} onPress={() => nav.navigate({ name: 'settingsSub', section: 'subtitles' })} />
        <SettingsRow label="Autoplay next episode" right={<Toggle value={settings.autoplayNext} onValueChange={(v) => void update({ autoplayNext: v })} />} />
        <SettingsRow label="Caption size" value={settings.captionSize === 'large' ? 'Large' : 'Default'} onPress={() => void update({ captionSize: settings.captionSize === 'large' ? 'default' : 'large' })} />
      </View>

      <View>
        <ReelLabel>Downloads</ReelLabel>
        <SettingsRow label="Wi-Fi only" right={<Toggle value={settings.wifiOnlyDownloads} onValueChange={(v) => void update({ wifiOnlyDownloads: v })} />} />
        <SettingsRow label="Storage" value="Manage" onPress={() => nav.navigate({ name: 'settingsSub', section: 'storage' })} />
        <SettingsRow label="Downloads manager" value="Open" onPress={() => nav.navigate({ name: 'downloads' })} />
      </View>

      <View>
        <ReelLabel>Devices</ReelLabel>
        <SettingsRow label="Connected TVs" value="Manage" onPress={() => nav.navigate({ name: 'devices' })} />
        <SettingsRow label="Pair a TV" value="Connect" onPress={() => nav.navigate({ name: 'pairingHub' })} />
      </View>

      <View>
        <ReelLabel>App</ReelLabel>
        <SettingsRow label="Reduce motion" right={<Toggle value={settings.reduceMotion} onValueChange={(v) => void update({ reduceMotion: v })} />} />
        <SettingsRow label="Low-memory mode" right={<Toggle value={settings.lowTier} onValueChange={(v) => void update({ lowTier: v })} />} />
        <SettingsRow label="Clear search history" value={`${version > -1 ? 'Clear' : ''}`} destructive onPress={() => setClearConfirm(true)} />
        <SettingsRow label="About" value="HALLYU-STREAM" onPress={() => nav.navigate({ name: 'about' })} />
      </View>

      <Dialog visible={clearConfirm} title="Clear search history?" body="Recent searches on this device will be removed." confirmLabel="Clear" destructive onConfirm={async () => { await library.clearSearchHistory(); setClearConfirm(false); setSnack('Search history cleared'); }} onCancel={() => setClearConfirm(false)} />
      <Snackbar message={snack || ''} visible={Boolean(snack)} actionLabel="Dismiss" onAction={() => setSnack(null)} />
    </ScrollView>
  );
}

export function SettingsSubScreen({ section }: { section: 'quality' | 'subtitles' | 'storage' }) {
  const nav = useMobileNav();
  const { settings, update } = useSettings();
  const downloads = useLibraryList(() => library.getDownloads());
  const [confirmRemove, setConfirmRemove] = useState(false);

  if (section === 'quality') {
    return (
      <ScrollView style={s.screen} contentContainerStyle={{ padding: MARGIN, gap: space[4] }}>
        <Text style={mobileText('h1')}>Default quality</Text>
        <Text style={[mobileText('body'), { color: color.text.muted }]}>Auto starts at 360p or 480p on mobile. Real resolutions from the provider appear in the player.</Text>
        <SettingsRow label={copy.labels.autoRecommended} value={settings.defaultQuality === 'auto' ? 'Selected' : undefined} onPress={() => void update({ defaultQuality: 'auto' })} />
        <InlineBanner message="Quality options are never invented — they are listed from the stream response when you play a title." tone="info" />
        <SecondaryButton label="Back" onPress={nav.back} />
      </ScrollView>
    );
  }
  if (section === 'subtitles') {
    return (
      <ScrollView style={s.screen} contentContainerStyle={{ padding: MARGIN, gap: space[4] }}>
        <Text style={mobileText('h1')}>Subtitle language</Text>
        <Text style={[mobileText('body'), { color: color.text.muted }]}>The provider's caption languages are listed in the player. Your last choice is remembered here.</Text>
        <SettingsRow label={copy.labels.off} value={settings.subtitleLanguage === 'off' ? 'Selected' : undefined} onPress={() => void update({ subtitleLanguage: 'off' })} />
        <InlineBanner message={copy.states.noSubtitles} tone="info" />
        <SecondaryButton label="Back" onPress={nav.back} />
      </ScrollView>
    );
  }
  return (
    <ScrollView style={s.screen} contentContainerStyle={{ padding: MARGIN, gap: space[4] }}>
      <Text style={mobileText('h1')}>Storage</Text>
      <StorageMeter used={downloads.reduce((sum, d) => sum + (d.bytes ?? 0), 0)} free={0} />
      <InlineBanner message="Offline files are stored on this device only. Clearing the image cache never removes downloads." tone="info" />
      <SettingsRow label="Remove all downloads" value="Destructive" destructive onPress={() => setConfirmRemove(true)} />
      <SecondaryButton label="Back" onPress={nav.back} />
      <Dialog visible={confirmRemove} title="Remove all downloads?" body="Every offline file on this device will be deleted." confirmLabel="Remove all" destructive onConfirm={async () => { for (const d of downloads) await library.removeDownload(d.id); setConfirmRemove(false); }} onCancel={() => setConfirmRemove(false)} />
    </ScrollView>
  );
}

export function AboutScreen() {
  const nav = useMobileNav();
  return (
    <ScrollView style={s.screen} contentContainerStyle={{ padding: MARGIN, gap: space[6], paddingTop: 60 }}>
      <Wordmark size={32} showHangul />
      <Text style={[mobileText('body'), { color: color.text.muted }]}>{copy.about.body}</Text>
      <Text style={[mobileText('meta'), { color: color.text.muted }]}>{copy.about.privacy}</Text>
      <InlineBanner message="Version 0.1.0 · Phase 3 build" tone="info" />
      <SecondaryButton label="Back" onPress={nav.back} />
    </ScrollView>
  );
}

// ── Pairing ───────────────────────────────────────────────────────────────

export function PairingHubScreen() {
  const nav = useMobileNav();
  const { Scanner } = usePlatform();
  const [devices, setDevices] = useState<PairedDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    pairing.listDevices()
      .then((list) => { if (active) { setDevices(list); setError(null); } })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : 'Pairing service unavailable'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [tick]);

  const submitCode = async () => {
    const clean = cleanShortCode(code);
    if (clean.length !== 6) { setLookupError('Enter the six-character code from your TV.'); return; }
    setLookupError(null);
    try {
      const session = await pairing.lookupByCode(clean);
      nav.navigate({ name: 'approval', challengeId: session.challengeId });
    } catch (err) {
      setLookupError(err instanceof Error ? err.message : copy.states.invalidQr.body);
    }
  };

  return (
    <ScrollView style={s.screen} contentContainerStyle={{ padding: MARGIN, paddingBottom: 100, gap: space[5] }}>
      <Text style={mobileText('h1')}>Connect to TV</Text>
      {error && <InlineBanner message={error} tone="error" actionLabel={copy.actions.retry} onAction={() => setTick((v) => v + 1)} />}
      {loading && <SkeletonBlock width="100%" height={120} />}

      {!devices.length && !loading && !error && (
        <EmptyState title="No TVs connected." body="Open HALLYU-STREAM on your TV and scan the code it shows." actionLabel={copy.actions.browseHome} onAction={() => nav.switchTab('home')} />
      )}

      <View style={[s.elevated, { padding: space[5], gap: space[4] }]}>
        <Icon name="qr" size={40} color={color.accent.copper} />
        <Text style={mobileText('h2')}>Pair once with a code</Text>
        <Text style={[mobileText('body'), { color: color.text.muted }]}>{copy.states.qrSecurity}</Text>
        <PrimaryButton label={Scanner ? 'Scan TV code' : copy.actions.enterCodeInstead} onPress={() => nav.navigate({ name: 'scanner' })} icon={Scanner ? 'scan' : 'key'} />
        <Text style={[mobileText('meta'), { color: color.text.muted, textAlign: 'center' }]}>Or enter the code shown on your TV</Text>
        <View style={[s.row, { gap: space[3] }]}>
          <TextInput
            accessibilityLabel="Six character pairing code"
            value={code}
            onChangeText={(v) => setCode(formatShortCode(v))}
            placeholder="XXX-XXX"
            placeholderTextColor={color.text.faint}
            autoCapitalize="characters"
            maxLength={7}
            style={[mobileText('h1'), { flex: 1, minHeight: 52, borderWidth: 1, borderColor: color.hairline, borderRadius: radius.sm, backgroundColor: color.bg.surface, paddingHorizontal: space[4], color: color.text.primary }]}
          />
          <PrimaryButton label="Enter" onPress={() => void submitCode()} />
        </View>
        {lookupError && <InlineBanner message={lookupError} tone="error" />}
      </View>

      {devices.length > 0 && (
        <View>
          <ReelLabel>Paired devices</ReelLabel>
          {devices.map((device) => <DeviceCard key={device.id} device={device} onUnpair={() => nav.navigate({ name: 'devices' })} />)}
        </View>
      )}
      <TextButton label="Manage devices" onPress={() => nav.navigate({ name: 'devices' })} color={color.accent.copperLight} />
    </ScrollView>
  );
}

export function ScannerScreen() {
  const nav = useMobileNav();
  const { Scanner, openSettings } = usePlatform();
  const [permission, setPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [invalid, setInvalid] = useState(false);
  const [torch, setTorch] = useState(false);

  if (permission === 'prompt') {
    return (
      <View style={[s.screen, s.center, { padding: MARGIN }]}>
        <PermissionPrimer
          title={copy.states.permissionCamera.title}
          body={copy.states.permissionCamera.body}
          allowLabel={copy.states.permissionCamera.allow}
          alternativeLabel={copy.states.permissionCamera.alternative}
          onAllow={() => setPermission('granted')}
          onAlternative={() => nav.navigate({ name: 'pairingHub' })}
        />
      </View>
    );
  }

  return (
    <View style={s.screen}>
      <View style={[s.fill, s.center, { padding: MARGIN, gap: space[4] }]}>
        {invalid ? (
          <ErrorState title={copy.states.invalidQr.title} body={copy.states.invalidQr.body} actionLabel={copy.states.invalidQr.action} onAction={() => setInvalid(false)} secondaryLabel={copy.actions.enterCodeInstead} onSecondary={() => nav.navigate({ name: 'pairingHub' })} />
        ) : Scanner && permission === 'granted' ? (
          <Scanner
            onDetected={(payload) => {
              const challengeId = parseQrPayload(payload);
              if (!challengeId) { setInvalid(true); return; }
              nav.navigate({ name: 'approval', challengeId });
            }}
            torchEnabled={torch}
            onToggleTorch={() => setTorch((v) => !v)}
            onCancel={nav.back}
          />
        ) : (
          <View style={{ gap: space[4], width: '100%' }}>
            <InlineBanner message={copy.labels.previewCamera} tone="info" />
            <ErrorState title="Camera unavailable" body={copy.labels.permissionDeniedCamera} actionLabel={copy.actions.enterCodeInstead} onAction={() => nav.navigate({ name: 'pairingHub' })} secondaryLabel="Open settings" onSecondary={openSettings} />
          </View>
        )}
      </View>
      <View style={[s.row, { justifyContent: 'space-between', padding: MARGIN }]}>
        <TextButton label={copy.actions.enterCodeInstead} onPress={() => nav.navigate({ name: 'pairingHub' })} color={color.accent.copperLight} />
        <IconButton name="flash" onPress={() => setTorch((v) => !v)} label="Toggle torch" tint={torch ? color.accent.copper : color.text.muted} />
        <IconButton name="close" onPress={nav.back} label="Close scanner" />
      </View>
    </View>
  );
}

export function ApprovalScreen({ challengeId }: { challengeId: string }) {
  const nav = useMobileNav();
  const [session, setSession] = useState<PairingSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [deviceName, setDeviceName] = useState('Living Room TV');

  useEffect(() => {
    let active = true;
    pairing.getSession(challengeId)
      .then((s) => { if (active) { setSession(s); setDeviceName(s.tvName || deviceName); } })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : copy.states.pairingServiceDown.body); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [challengeId]);

  if (loading) return <View style={[s.screen, s.center]}><LoadingState rows={1} /></View>;
  if (error || !session) return <ErrorState title={copy.states.pairingServiceDown.title} body={error || copy.states.pairingServiceDown.body} onAction={() => nav.back()} secondaryLabel="Back" onSecondary={nav.back} />;
  if (session.status === 'expired') return <ErrorState title={copy.states.pairingExpired.title} body={copy.states.pairingExpired.body} actionLabel={copy.states.pairingExpired.action} onAction={() => nav.navigate({ name: 'scanner' })} secondaryLabel="Back" onSecondary={nav.back} />;
  if (session.status === 'rejected') return <ErrorState title={copy.states.pairingRejected.title} body={copy.states.pairingRejected.body} actionLabel={copy.states.pairingRejected.action} onAction={() => nav.navigate({ name: 'scanner' })} secondaryLabel="Back" onSecondary={nav.back} />;

  if (success) {
    return (
      <View style={[s.screen, s.center, { padding: MARGIN, gap: space[4] }]}>
        <Icon name="checkCircle" size={56} color={color.state.success} />
        <Text style={mobileText('displayL')}>{`${deviceName} connected.`}</Text>
        <Text style={[mobileText('body'), { color: color.text.muted }]}>{copy.states.pairingSuccess.body}</Text>
        <PrimaryButton label={copy.actions.done} onPress={() => nav.navigate({ name: 'pairingHub' })} />
      </View>
    );
  }

  return (
    <View style={[s.screen, s.center, { padding: MARGIN }]}>
      <ApprovalCard
        session={session}
        approving={approving}
        onApprove={async () => {
          setApproving(true);
          try {
            const result = await pairing.approve(challengeId, deviceName);
            // Only show success after backend confirmation (`07` §7, `14.5`).
            setDeviceName(result.device.displayName);
            setSuccess(true);
          } catch (err) {
            setError(err instanceof Error ? err.message : copy.states.pairingServiceDown.body);
          } finally {
            setApproving(false);
          }
        }}
        onReject={async () => {
          try { await pairing.reject(challengeId); } catch { /* rejection stays honest via backend status */ }
          nav.back();
        }}
      />
    </View>
  );
}

export function DevicesScreen() {
  const nav = useMobileNav();
  const [devices, setDevices] = useState<PairedDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [target, setTarget] = useState<PairedDevice | null>(null);
  const [snack, setSnack] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    pairing.listDevices()
      .then((list) => { if (active) { setDevices(list); setError(null); } })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : 'Pairing service unavailable'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [tick]);

  return (
    <View style={s.screen}>
      <ScrollView contentContainerStyle={{ padding: MARGIN, paddingBottom: 100, gap: space[4] }}>
        <View style={s.rowBetween}><Text style={mobileText('h1')}>Devices</Text><IconButton name="chevronLeft" onPress={nav.back} label="Back" /></View>
        {error && <InlineBanner message={error} tone="error" actionLabel={copy.actions.retry} onAction={() => setTick((v) => v + 1)} />}
        {loading && <SkeletonBlock width="100%" height={80} />}
        {devices.map((device) => <DeviceCard key={device.id} device={device} onUnpair={() => setTarget(device)} />)}
        {!loading && !devices.length && !error && <EmptyState title="No paired TVs." body="Pair a TV from the Connect to TV screen." actionLabel="Connect to TV" onAction={() => nav.navigate({ name: 'pairingHub' })} />}
        <Text style={[mobileText('meta'), { color: color.text.muted }]}>{copy.labels.pairingNote}</Text>
      </ScrollView>
      <Dialog
        visible={Boolean(target)}
        title={`Unpair ${target?.displayName ?? 'this TV'}?`}
        body={copy.labels.pairingNote}
        confirmLabel={copy.actions.unpair}
        destructive
        onConfirm={async () => {
          if (target) {
            try {
              await pairing.revokeDevice(target.id);
              setDevices((prev) => prev.filter((d) => d.id !== target.id));
              setSnack('TV unpaired. Re-pairing needs a new code.');
            } catch (err) {
              setSnack(err instanceof Error ? err.message : 'Could not unpair.');
            }
          }
          setTarget(null);
        }}
        onCancel={() => setTarget(null)}
      />
      <Snackbar message={snack || ''} visible={Boolean(snack)} actionLabel="Dismiss" onAction={() => setSnack(null)} />
    </View>
  );
}
