import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, View } from 'react-native';
import {
  MEDIA_REQUEST_HEADERS,
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
  progressKey,
  radius,
  seasonEpisodeForTitle,
  space,
  type HomeShelf,
  type Title,
} from '@hallyu/shared';
import {
  BottomSheet,
  BufferingRing,
  Chip,
  CreditsLine,
  Dialog,
  EmptyState,
  ErrorState,
  FallbackArtwork,
  InlineBanner,
  LandscapeCard,
  LoadingState,
  NextEpisodeCard,
  PosterCard,
  PrimaryButton,
  QRPanel,
  ReelLabel,
  SecondaryButton,
  Seekbar,
  SkeletonBlock,
  StorageMeter,
  Toggle,
  Wordmark,
  CountdownRing,
} from '../components';
import { useDetail, useHome, useLibraryList, useSearch, useSelectedSource, useStream } from '../hooks/useCatalogue';
import { Icon, usePlatform, useSettings } from '../platform/context';
import { glassStyle, s, tvText } from '../theme';
import { Focusable, useFocus, useFocusScope } from './focus';
import { useTvNav, type TvPane, type TvRoute } from './context';

const TV_MARGIN = layout.marginTv;

// ── Activation ────────────────────────────────────────────────────────────

export function TvActivationScreen({ onPaired }: { onPaired: () => void }) {
  useFocusScope('activation');
  const { setFocused } = useFocus();
  const [session, setSession] = useState<Awaited<ReturnType<typeof pairing.createSession>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(false);
  const [rejected, setRejected] = useState(false);

  const create = useCallback(async () => {
    setLoading(true);
    setError(null);
    setRejected(false);
    try {
      const next = await pairing.createSession({ tvName: 'Living Room TV', tvModel: 'Android TV' });
      setSession(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.states.pairingServiceDown.body);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void create();
  }, [create]);

  useEffect(() => {
    if (zoom) setFocused('activation-zoom-close');
  }, [zoom, setFocused]);

  useEffect(() => {
    if (!session || session.status !== 'pending') return;
    const id = setInterval(async () => {
      try {
        const next = await pairing.getSession(session.challengeId);
        setSession(next);
        if (next.status === 'approved' && next.deviceToken && next.deviceId) {
          await pairing.saveTvCredential(next.deviceId, next.deviceToken);
          onPaired();
        }
        if (next.status === 'rejected') setRejected(true);
        if (next.status === 'expired') void create();
      } catch (err) {
        setError(err instanceof Error ? err.message : copy.states.pairingServiceDown.body);
      }
    }, 3000);
    return () => clearInterval(id);
  }, [session, create, onPaired]);

  if (loading && !session) {
    return (
      <View style={[s.screen, s.center, { gap: space[5] }]}>
        <Wordmark size={64} showHangul tv />
        <ActivityIndicator color={color.accent.copper} />
        <Text style={[tvText('meta'), { color: color.text.muted }]}>Your screening room is opening.</Text>
      </View>
    );
  }

  if (error && !session) {
    return <ErrorState title={copy.states.pairingServiceDown.title} body={error} actionLabel={copy.actions.retry} onAction={() => void create()} tv />;
  }

  return (
    <View style={[s.screen, { padding: TV_MARGIN, paddingTop: TV_MARGIN * 0.7 }]}>
      <View style={[s.rowBetween, { marginBottom: space[6] }]}>
        <Wordmark size={44} tv />
        {session && <CountdownRing expiresAt={session.expiresAt} tv />}
      </View>

      {rejected ? (
        <View style={[s.center, { gap: space[4] }]}>
          <ErrorState {...stateProps(copy.states.pairingRejected)} onAction={() => void create()} tv />
        </View>
      ) : (
        <View style={[s.row, { gap: space[10], flex: 1, alignItems: 'center' }]}>
          <View style={{ gap: space[4], alignItems: 'center' }}>
            <Focusable id="activation-qr" scope="activation" onSelect={() => setZoom(true)} style={{ borderRadius: radius.md }}>
              {session && <QRPanel value={session.qrPayload || session.challengeId} size={280} tv />}
            </Focusable>
            <Text style={tvText('code')}>{session ? formatShortCode(session.shortCode || '') : '—'}</Text>
            <Text style={[tvText('meta'), { color: color.text.muted }]}>Or enter this code</Text>
          </View>

          <View style={{ flex: 1, gap: space[5], maxWidth: 720 }}>
            <Text style={tvText('h1')}>Connect your phone</Text>
            <Text style={tvText('body')}>1. Open HALLYU-STREAM</Text>
            <Text style={tvText('body')}>2. Tap Connect to TV</Text>
            <Text style={tvText('body')}>3. Scan this code</Text>
            <Text style={[tvText('meta'), { color: color.text.muted }]}>{copy.states.qrSecurity}</Text>
            <View style={[s.row, { gap: space[4] }]}>
              <Focusable id="activation-regenerate" scope="activation" onSelect={() => void create()} style={{ borderRadius: radius.sm }}>
                <SecondaryButton label={copy.actions.regenerate} onPress={() => void create()} tv icon="refresh" />
              </Focusable>
            </View>
          </View>
        </View>
      )}

      {zoom && session && (
        <View style={[s.fill, s.center, { backgroundColor: color.bg.veil }]}>
          <View style={{ gap: space[5], alignItems: 'center' }}>
            <QRPanel value={session.qrPayload || session.challengeId} size={420} tv />
            <Focusable id="activation-zoom-close" scope="activation" onSelect={() => setZoom(false)} style={{ borderRadius: radius.sm }}>
              <PrimaryButton label="Close" onPress={() => setZoom(false)} tv />
            </Focusable>
          </View>
        </View>
      )}
    </View>
  );
}

function stateProps(state: { title: string; body: string; action: string }) {
  return { title: state.title, body: state.body, actionLabel: state.action };
}

// ── Left rail ─────────────────────────────────────────────────────────────

const RAIL_ITEMS: { id: TvPane; label: string; icon: 'home' | 'compass' | 'search' | 'library' | 'settings' | 'tv' }[] = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'explore', label: 'Explore', icon: 'compass' },
  { id: 'search', label: 'Search', icon: 'search' },
  { id: 'library', label: 'Library', icon: 'library' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
  { id: 'devices', label: 'Devices', icon: 'tv' },
];

export function LeftRail() {
  const nav = useTvNav();
  const { focusedId } = useFocus();
  const { settings } = useSettings();
  const expanded = Boolean(focusedId?.startsWith('rail-'));
  return (
    <View style={[glassStyle(settings.lowTier), { width: expanded ? 240 : 96, paddingVertical: space[5], gap: space[3], borderTopRightRadius: radius.md, borderBottomRightRadius: radius.md }]}>
      {RAIL_ITEMS.map((item) => (
        <Focusable
          key={item.id}
          id={`rail-${item.id}`}
          scope="rail"
          onSelect={() => nav.switchPane(item.id)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: space[3], paddingHorizontal: space[4], minHeight: 64, borderRadius: radius.sm }}
        >
          <Icon name={item.icon} size={32} color={focusedId === `rail-${item.id}` ? color.accent.copper : color.text.muted} />
          {expanded && <Text style={[tvText('label'), { color: nav.pane === item.id ? color.accent.copperLight : color.text.primary }]}>{item.label}</Text>}
        </Focusable>
      ))}
    </View>
  );
}

// ── Focusable shelf helpers ───────────────────────────────────────────────

function TvShelf({ shelf, scope, onTitlePress }: { shelf: HomeShelf; scope: string; onTitlePress: (t: Title) => void }) {
  const { focusedId } = useFocus();
  return (
    <View style={{ marginBottom: layout.gapShelfStackTv }}>
      <ReelLabel tv>{shelf.label}</ReelLabel>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: TV_MARGIN }}>
        {shelf.titles.map((title, index) => {
          const id = `${scope}-shelf-${shelf.id}-${index}-${title.subjectId}`;
          return (
            <Focusable key={id} id={id} scope={scope} onSelect={() => onTitlePress(title)} style={{ borderRadius: radius.sm }}>
              <PosterCard title={title} width={layout.poster.tv.width} tv focused={focusedId === id} />
            </Focusable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function TvPosterGrid({ titles, scope, onTitlePress, columns = 6 }: { titles: Title[]; scope: string; onTitlePress: (t: Title) => void; columns?: number }) {
  const { focusedId } = useFocus();
  const rows: Title[][] = [];
  for (let i = 0; i < titles.length; i += columns) rows.push(titles.slice(i, i + columns));
  return (
    <View style={{ gap: layout.gapShelfTv }}>
      {rows.map((row, r) => (
        <View key={r} style={[s.row, { gap: layout.gapShelfTv }]}>
          {row.map((title, c) => {
            const id = `${scope}-grid-${r}-${c}-${title.subjectId}`;
            return (
              <Focusable key={id} id={id} scope={scope} onSelect={() => onTitlePress(title)} style={{ borderRadius: radius.sm }}>
                <PosterCard title={title} width={Math.floor((1380 - (columns - 1) * layout.gapShelfTv) / columns)} tv focused={focusedId === id} />
              </Focusable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

// ── Home ──────────────────────────────────────────────────────────────────

export function TvHomeScreen() {
  useFocusScope('home');
  const nav = useTvNav();
  const home = useHome();
  const continuing = useLibraryList(() => library.getContinueWatching());
  const hero = home.data?.shelves[0]?.titles[0];
  const { focusedId } = useFocus();

  if (home.loading) return <LoadingState tv rows={2} />;
  if (!home.data && home.error) return <ErrorState title={copy.states.catalogueEmpty.title} body={home.error} onAction={home.reload} tv />;

  const openPlayer = (title: Title) => {
    const { season, episode } = seasonEpisodeForTitle(title);
    nav.openPlayer(title, season, episode);
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: TV_MARGIN, paddingTop: space[5], paddingBottom: space[10], gap: space[6] }} showsVerticalScrollIndicator={false}>
      {home.cached && <InlineBanner message={`${copy.labels.saved} shelves`} tone="warning" tv />}
      {hero && (
        <View style={{ height: 420, justifyContent: 'flex-end', borderRadius: radius.md, overflow: 'hidden' }}>
          {hero.backdrop ? <Image source={{ uri: hero.backdrop }} style={s.fill} resizeMode="cover" /> : <FallbackArtwork title={hero.title} width={1600} height={420} tv radiusValue={0} />}
          <View style={[s.fill, { backgroundColor: 'rgba(10,11,13,0.35)' }]} />
          <View style={[s.fill, { top: '55%', backgroundColor: 'rgba(10,11,13,0.85)' }]} />
          <View style={{ padding: TV_MARGIN, gap: space[3], zIndex: 2 }}>
            <Text numberOfLines={2} style={tvText('display')}>{hero.title}</Text>
            <CreditsLine title={hero} tv />
            <View style={[s.row, { gap: space[4], marginTop: space[2] }]}>
              <Focusable id="home-hero-play" scope="home" onSelect={() => openPlayer(hero)} style={{ borderRadius: radius.sm }}>
                <PrimaryButton label={copy.actions.play} tv icon="play" />
              </Focusable>
              <Focusable id="home-hero-info" scope="home" onSelect={() => nav.openDetail(hero)} style={{ borderRadius: radius.sm }}>
                <SecondaryButton label="More info" tv icon="info" />
              </Focusable>
            </View>
          </View>
        </View>
      )}
      {continuing.length > 0 && (
        <View>
          <ReelLabel tv>{copy.labels.continueWatching}</ReelLabel>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: TV_MARGIN }}>
            {continuing.map((entry, index) => {
              const id = `home-continue-${index}`;
              const title: Title = { subjectId: entry.subjectId, detailPath: entry.detailPath, title: entry.title, cover: entry.cover, genres: [], contentType: entry.season > 0 ? 'series' : 'movie', seasons: [] };
              return (
                <Focusable key={id} id={id} scope="home" onSelect={() => nav.openPlayer(title, entry.season, entry.episode, entry.positionMs)} style={{ borderRadius: radius.sm }}>
                  <LandscapeCard title={entry.title} imageUrl={entry.cover} width={560} height={315} tv meta={`${episodeLabel(entry.season, entry.episode)} · ${formatTime(entry.positionMs)}`} progress={entry.durationMs ? entry.positionMs / entry.durationMs : undefined} focused={focusedId === id} />
                </Focusable>
              );
            })}
          </ScrollView>
        </View>
      )}
      {home.data?.shelves.map((shelf) => <TvShelf key={shelf.id} shelf={shelf} scope="home" onTitlePress={(t) => nav.openDetail(t)} />)}
    </ScrollView>
  );
}

// ── Explore ───────────────────────────────────────────────────────────────

export function TvExploreScreen() {
  useFocusScope('explore');
  const nav = useTvNav();
  const home = useHome();
  const [filter, setFilter] = useState('all');
  const allTitles = useMemo(() => {
    const seen = new Set<string>();
    const list: Title[] = [];
    for (const shelf of home.data?.shelves ?? []) for (const title of shelf.titles) if (!seen.has(title.subjectId)) { seen.add(title.subjectId); list.push(title); }
    return list;
  }, [home.data]);
  const genres = useMemo(() => Array.from(new Set((home.data?.shelves ?? []).flatMap((s) => (s.category ? [s.category] : [])))).slice(0, 5), [home.data]);
  const chips = ['all', 'films', 'series', ...genres];
  const filtered = filter === 'all' ? allTitles : filter === 'films' ? allTitles.filter((t) => t.contentType === 'movie') : filter === 'series' ? allTitles.filter((t) => t.contentType === 'series') : allTitles.filter((t) => t.genres.includes(filter));

  if (home.loading) return <LoadingState tv rows={1} />;
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: TV_MARGIN, gap: space[5] }}>
      <Text style={tvText('h1')}>Explore</Text>
      <View style={[s.row, { gap: space[3], flexWrap: 'wrap' }]}>
        {chips.map((chip, i) => (
          <Focusable key={chip} id={`explore-chip-${i}`} scope="explore" onSelect={() => setFilter(chip)} style={{ borderRadius: radius.pill }}>
            <Chip label={chip === 'all' ? 'All' : chip === 'films' ? 'Films' : chip === 'series' ? 'Series' : chip} selected={filter === chip} tv />
          </Focusable>
        ))}
      </View>
      {!genres.length && <Text style={[tvText('meta'), { color: color.text.muted }]}>{copy.labels.moreCategories}</Text>}
      {filtered.length ? <TvPosterGrid titles={filtered.slice(0, 12)} scope="explore" onTitlePress={(t) => nav.openDetail(t)} /> : <EmptyState title={copy.labels.nothingInCategory} body="Try another filter." actionLabel={copy.actions.browseHome} onAction={() => nav.switchPane('home')} tv />}
    </ScrollView>
  );
}

// ── Search + on-screen keyboard ───────────────────────────────────────────

const KEYBOARD_ROWS = [
  'QWERTYUIOP'.split(''),
  'ASDFGHJKL'.split(''),
  'ZXCVBNM'.split(''),
];

export function TvSearchScreen() {
  useFocusScope('search');
  const nav = useTvNav();
  const search = useSearch();
  const { focusedId } = useFocus();

  const pressKey = (key: string) => {
    if (key === 'OK') { void search.submit(); nav.setKeyboardVisible(false); return; }
    if (key === 'CLEAR') { search.clear(); return; }
    if (key === 'SPACE') { search.setQuery(`${search.query} `); return; }
    if (key === 'BACK') { search.setQuery(search.query.slice(0, -1)); return; }
    search.setQuery(search.query + key);
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: TV_MARGIN, gap: space[5] }}>
      <Text style={tvText('h1')}>Search</Text>
      <View style={[s.surface, { minHeight: 72, justifyContent: 'center', paddingHorizontal: space[5], borderRadius: radius.sm }]}>
        <Text style={tvText('h2')}>{search.query || 'Type to search'}</Text>
      </View>
      {search.error && <InlineBanner message={search.error} tone="error" tv />}
      {search.loading && <SkeletonBlock width="100%" height={80} />}
      {search.results.length > 0 && (
        <View>
          <Text style={[tvText('meta'), { color: color.text.muted }]}>{search.results.length} results for ‘{search.query}’</Text>
          <TvPosterGrid titles={search.results.slice(0, 6)} scope="search" onTitlePress={(t) => nav.openDetail(t)} columns={3} />
        </View>
      )}
      {search.query.length >= 2 && !search.loading && !search.results.length && <EmptyState title={copy.states.noSearchResults.title} body={copy.states.noSearchResults.body} actionLabel={copy.actions.clearSearch} onAction={search.clear} tv />}

      {nav.keyboardVisible && (
        <View style={[s.elevated, { padding: space[5], gap: space[3], borderRadius: radius.md }]}>
          {KEYBOARD_ROWS.map((row, r) => (
            <View key={r} style={[s.row, { justifyContent: 'center', gap: space[2] }]}>
              {row.map((key, c) => {
                const id = `keyboard-${r}-${c}-${key}`;
                return (
                  <Focusable key={id} id={id} scope="search" onSelect={() => pressKey(key)} style={{ minWidth: 64, minHeight: 56, borderRadius: radius.xs, alignItems: 'center', justifyContent: 'center' }}>
                    <View style={[s.center, { minWidth: 64, minHeight: 56, borderRadius: radius.xs, backgroundColor: focusedId === id ? color.accent.copperTint : color.bg.surface }]}>
                      <Text style={tvText('label')}>{key}</Text>
                    </View>
                  </Focusable>
                );
              })}
            </View>
          ))}
          <View style={[s.row, { justifyContent: 'center', gap: space[3] }]}>
            {['CLEAR', 'SPACE', 'BACK', 'OK'].map((key, i) => (
              <Focusable key={key} id={`keyboard-action-${i}`} scope="search" onSelect={() => pressKey(key)} style={{ borderRadius: radius.xs }}>
                <View style={[s.center, { minWidth: 120, minHeight: 56, borderRadius: radius.xs, backgroundColor: color.bg.surface }]}>
                  <Text style={tvText('label')}>{key === 'BACK' ? 'Backspace' : key === 'OK' ? 'OK' : key === 'SPACE' ? 'Space' : 'Clear'}</Text>
                </View>
              </Focusable>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

// ── Library ───────────────────────────────────────────────────────────────

export function TvLibraryScreen() {
  useFocusScope('library');
  const nav = useTvNav();
  const [segment, setSegment] = useState<'list' | 'history'>('list');
  const watchlist = useLibraryList(() => library.getWatchlist());
  const history = useLibraryList(() => library.getHistory());
  const titles = watchlist.map((w) => ({ subjectId: w.subjectId, detailPath: w.detailPath, title: w.title, cover: w.cover, genres: [], contentType: 'unknown' as const, seasons: [] }));

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: TV_MARGIN, gap: space[5] }}>
      <Text style={tvText('h1')}>Library</Text>
      <View style={[s.row, { gap: space[3] }]}>
        <Focusable id="library-list-chip" scope="library" onSelect={() => setSegment('list')} style={{ borderRadius: radius.pill }}><Chip label="My List" selected={segment === 'list'} tv /></Focusable>
        <Focusable id="library-history-chip" scope="library" onSelect={() => setSegment('history')} style={{ borderRadius: radius.pill }}><Chip label="History" selected={segment === 'history'} tv /></Focusable>
      </View>
      {segment === 'list' && (titles.length ? <TvPosterGrid titles={titles} scope="library" onTitlePress={(t) => nav.openDetail(t)} /> : <EmptyState {...stateProps(copy.states.emptyWatchlist)} onAction={() => nav.switchPane('home')} tv />)}
      {segment === 'history' && (history.length ? history.map((entry, i) => (
        <View key={entry.key} style={[s.surface, { padding: space[4], marginBottom: space[3] }]}>
          <Text style={tvText('bodyStrong')}>{entry.title}</Text>
          <Text style={[tvText('meta'), { color: color.text.muted }]}>{episodeLabel(entry.season, entry.episode)} · {new Date(entry.watchedAt).toLocaleDateString()}</Text>
        </View>
      )) : <EmptyState {...stateProps(copy.states.emptyHistory)} onAction={() => nav.switchPane('home')} tv />)}
    </ScrollView>
  );
}

// ── Settings / Devices ────────────────────────────────────────────────────

export function TvSettingsScreen() {
  useFocusScope('settings');
  const { settings, update } = useSettings();
  const [group, setGroup] = useState<'playback' | 'subtitles' | 'devices' | 'app'>('playback');
  const groups: { id: typeof group; label: string }[] = [
    { id: 'playback', label: 'Playback' },
    { id: 'subtitles', label: 'Subtitles' },
    { id: 'devices', label: 'Devices' },
    { id: 'app', label: 'App' },
  ];
  return (
    <View style={[s.row, { flex: 1, padding: TV_MARGIN, gap: space[10] }]}>
      <View style={{ width: 320, gap: space[3] }}>
        <Text style={tvText('h1')}>Settings</Text>
        {groups.map((g, i) => (
          <Focusable key={g.id} id={`settings-group-${i}`} scope="settings" onSelect={() => setGroup(g.id)} style={{ borderRadius: radius.sm }}>
            <View style={[s.surface, { padding: space[4], borderRadius: radius.sm, minHeight: 64, justifyContent: 'center' }]}>
              <Text style={[tvText('bodyStrong'), { color: group === g.id ? color.accent.copperLight : color.text.primary }]}>{g.label}</Text>
            </View>
          </Focusable>
        ))}
      </View>
      <View style={[s.surface, { flex: 1, padding: space[6], gap: space[5], borderRadius: radius.md }]}>
        {group === 'playback' && (
          <>
            <Text style={tvText('h2')}>Auto quality · {settings.defaultQuality}</Text>
            <Focusable id="settings-autoplay" scope="settings" onSelect={() => void update({ autoplayNext: !settings.autoplayNext })} style={{ borderRadius: radius.sm }}>
              <View style={[s.rowBetween, { minHeight: 64 }]}><Text style={tvText('body')}>Autoplay next episode</Text><Toggle value={settings.autoplayNext} onValueChange={(v) => void update({ autoplayNext: v })} tv /></View>
            </Focusable>
          </>
        )}
        {group === 'subtitles' && <Text style={tvText('body')}>Caption languages appear in the player. Size: {settings.captionSize}.</Text>}
        {group === 'devices' && <Text style={tvText('body')}>Open Devices in the rail to see this TV's pairing status.</Text>}
        {group === 'app' && (
          <>
            <Focusable id="settings-reduce" scope="settings" onSelect={() => void update({ reduceMotion: !settings.reduceMotion })} style={{ borderRadius: radius.sm }}>
              <View style={[s.rowBetween, { minHeight: 64 }]}><Text style={tvText('body')}>Reduce motion</Text><Toggle value={settings.reduceMotion} onValueChange={(v) => void update({ reduceMotion: v })} tv /></View>
            </Focusable>
            <Focusable id="settings-lowtier" scope="settings" onSelect={() => void update({ lowTier: !settings.lowTier })} style={{ borderRadius: radius.sm }}>
              <View style={[s.rowBetween, { minHeight: 64 }]}><Text style={tvText('body')}>Low-memory mode</Text><Toggle value={settings.lowTier} onValueChange={(v) => void update({ lowTier: v })} tv /></View>
            </Focusable>
          </>
        )}
      </View>
    </View>
  );
}

export function TvDevicesScreen() {
  useFocusScope('devices');
  const nav = useTvNav();
  const [credential, setCredential] = useState<Awaited<ReturnType<typeof pairing.getTvCredential>>>(null);
  const [confirm, setConfirm] = useState(false);
  useEffect(() => { void pairing.getTvCredential().then(setCredential); }, []);
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: TV_MARGIN, gap: space[5] }}>
      <Text style={tvText('h1')}>Devices</Text>
      <View style={[s.surface, { padding: space[6], gap: space[3], borderRadius: radius.md }]}>
        <Text style={tvText('h2')}>{credential ? 'Living Room TV' : 'Not paired'}</Text>
        <Text style={[tvText('body'), { color: color.text.muted }]}>{credential ? `Device id ${credential.deviceId}` : 'This TV needs a pairing code before the catalogue opens.'}</Text>
        <Text style={[tvText('meta'), { color: color.text.muted }]}>{copy.states.qrSecurity}</Text>
      </View>
      <Focusable id="devices-signout" scope="devices" onSelect={() => setConfirm(true)} style={{ borderRadius: radius.sm }}>
        <SecondaryButton label="Sign out this TV" tv icon="unpair" />
      </Focusable>
      <Text style={[tvText('meta'), { color: color.text.muted }]}>Signing out removes the local credential. To revoke from the phone, use Connected TVs there.</Text>
      <Dialog
        visible={confirm}
        title="Sign out this TV?"
        body="This TV returns to the pairing screen. The phone may still list it until it is revoked there."
        confirmLabel="Sign out"
        destructive
        tv
        onConfirm={async () => { await pairing.clearTvCredential(); setConfirm(false); nav.unpairLocal(); }}
        onCancel={() => setConfirm(false)}
      />
    </ScrollView>
  );
}

// ── Detail ────────────────────────────────────────────────────────────────

export function TvDetailScreen({ route }: { route: TvRoute }) {
  useFocusScope('detail');
  const nav = useTvNav();
  const detail = useDetail(route.title.detailPath);
  const title = detail.data?.title ?? route.title;
  const { season, episode } = seasonEpisodeForTitle(title, { season: route.season, episode: route.episode });
  const [seasonNumber, setSeasonNumber] = useState(season);
  const seasons = title.seasons.length ? title.seasons : [{ seasonNumber, maxEpisodes: 12 }];
  const active = seasons.find((s) => s.seasonNumber === seasonNumber) ?? seasons[0];

  if (detail.loading) return <LoadingState tv rows={1} />;
  if (!detail.data && detail.error) return <ErrorState title={copy.states.catalogueEmpty.title} body={detail.error} onAction={detail.reload} tv />;

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: space[10] }}>
      <View style={{ height: 540, justifyContent: 'flex-end' }}>
        {title.backdrop ? <Image source={{ uri: title.backdrop }} style={s.fill} resizeMode="cover" /> : <FallbackArtwork title={title.title} width={1600} height={540} tv radiusValue={0} />}
        <View style={[s.fill, { backgroundColor: 'rgba(10,11,13,0.30)' }]} />
        <View style={[s.fill, { top: '45%', backgroundColor: 'rgba(10,11,13,0.86)' }]} />
        <View style={{ padding: TV_MARGIN, gap: space[3], maxWidth: 1100 }}>
          <Text style={tvText('display')}>{title.title}</Text>
          <CreditsLine title={title} tv />
          <Text numberOfLines={4} style={[tvText('body'), { color: color.text.muted }]}>{title.description || '—'}</Text>
          <View style={[s.row, { gap: space[4], marginTop: space[2] }]}>
            <Focusable id="detail-play" scope="detail" onSelect={() => nav.openPlayer(title, seasonNumber, episode)} style={{ borderRadius: radius.sm }}>
              <PrimaryButton label={title.hasResource === false ? copy.states.noSources.title : copy.actions.play} tv icon="play" disabled={title.hasResource === false} />
            </Focusable>
            <Focusable id="detail-list" scope="detail" onSelect={() => void library.toggleWatchlist(title)} style={{ borderRadius: radius.sm }}>
              <SecondaryButton label={copy.actions.myList} tv icon="bookmark" />
            </Focusable>
          </View>
        </View>
      </View>
      {title.contentType === 'series' && (
        <View style={{ padding: TV_MARGIN, gap: space[4] }}>
          <ReelLabel tv>Episodes</ReelLabel>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space[3] }}>
            {seasons.map((s, i) => (
              <Focusable key={s.seasonNumber} id={`detail-season-${i}`} scope="detail" onSelect={() => setSeasonNumber(s.seasonNumber)} style={{ borderRadius: radius.pill }}>
                <Chip label={`Season ${s.seasonNumber}`} selected={seasonNumber === s.seasonNumber} tv />
              </Focusable>
            ))}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: TV_MARGIN }}>
            {Array.from({ length: active.maxEpisodes }).map((_, i) => {
              const id = `detail-ep-${seasonNumber}-${i}`;
              return (
                <Focusable key={id} id={id} scope="detail" onSelect={() => nav.openPlayer(title, seasonNumber, i + 1)} style={{ borderRadius: radius.sm }}>
                  <LandscapeCard title={`Episode ${i + 1}`} width={layout.episodeStillTv.width} height={layout.episodeStillTv.height} tv episode={`E${i + 1}`} meta={`S${seasonNumber}:E${i + 1}`} />
                </Focusable>
              );
            })}
          </ScrollView>
        </View>
      )}
      {detail.data?.similar.length ? (
        <View style={{ paddingHorizontal: TV_MARGIN }}>
          <TvShelf shelf={{ id: 'similar', label: copy.labels.titlesLikeThis, titles: detail.data.similar }} scope="detail" onTitlePress={(t) => nav.openDetail(t)} />
        </View>
      ) : null}
    </ScrollView>
  );
}

// ── Player ────────────────────────────────────────────────────────────────

export function TvPlayerScreen({ route, playPauseSignal }: { route: TvRoute; playPauseSignal: number }) {
  useFocusScope('player');
  const nav = useTvNav();
  const { Video } = usePlatform();
  const { settings, update } = useSettings();
  const stream = useStream({ subjectId: route.title.subjectId, detailPath: route.title.detailPath, season: route.season, episode: route.episode });
  const [paused, setPaused] = useState(false);
  const [controls, setControls] = useState(true);
  const [positionMs, setPositionMs] = useState(route.startPositionMs ?? 0);
  const [durationMs, setDurationMs] = useState<number | undefined>();
  const [quality, setQuality] = useState(settings.defaultQuality);
  const [subtitle, setSubtitle] = useState(settings.subtitleLanguage);
  const [buffering, setBuffering] = useState(true);
  const [fatal, setFatal] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [nextUp, setNextUp] = useState(false);
  const [seekToMs, setSeekToMs] = useState<number | undefined>(route.startPositionMs);
  const source = useSelectedSource(stream.data, quality);
  const captions = stream.data?.captions ?? [];
  const selectedCaption = captions.find((c) => (c.languageCode || c.language) === subtitle);
  const following = nextEpisode(route.title.seasons, route.season, route.episode);
  const positionRef = useRef(positionMs);
  positionRef.current = positionMs;

  const save = useCallback(async (pos = positionRef.current, dur = durationMs, done = false) => {
    await library.saveProgress(route.title, pos, { season: route.season, episode: route.episode, durationMs: dur, completed: done });
  }, [route.title, route.season, route.episode, durationMs]);

  useEffect(() => {
    if (playPauseSignal > 0) setPaused((v) => !v);
  }, [playPauseSignal]);
  useEffect(() => {
    if (paused || fatal) return;
    const id = setInterval(() => void save(), 5000);
    return () => clearInterval(id);
  }, [paused, fatal, save]);
  useEffect(() => () => void save(), [save]);
  useEffect(() => {
    if (paused || fatal || completed || nextUp || nav.settingsOpen) { setControls(true); return; }
    setControls(true);
    const id = setTimeout(() => setControls(false), 5000);
    return () => clearTimeout(id);
  }, [paused, fatal, completed, nextUp, nav.settingsOpen]);
  useEffect(() => {
    if (!stream.data) return;
    setBuffering(false);
    setSeekToMs(positionRef.current || route.startPositionMs);
    if (!stream.data.sources.length) setFatal(copy.states.noSources.body);
  }, [stream.data, route.startPositionMs]);

  const handleError = (message: string) => {
    if (retryCount < 2) { setRetryCount((v) => v + 1); setBuffering(true); stream.reload(); return; }
    setFatal(`${copy.states.streamFailed.title} ${message}`.trim());
  };
  const seek = (ms: number) => { setPositionMs(ms); setSeekToMs(ms); void save(ms); };
  const seekBy = (delta: number) => seek(positionRef.current + delta);
  const exit = () => { void save(); nav.back(); };

  if (fatal) return <ErrorState title={copy.states.streamFailed.title} body={fatal} actionLabel={copy.actions.retry} onAction={() => { setRetryCount(0); setFatal(null); stream.reload(); }} tv />;

  return (
    <View style={[s.screen, { backgroundColor: '#000' }]}>
      {Video && source ? (
        <Video
          sourceUrl={source.url}
          headers={MEDIA_REQUEST_HEADERS}
          paused={paused}
          seekToMs={seekToMs}
          captionUrl={selectedCaption?.url}
          captionLabel={selectedCaption?.language}
          style={s.fill}
          onProgress={(pos, dur) => { setPositionMs(pos); if (dur) setDurationMs(dur); }}
          onReady={() => setBuffering(false)}
          onBuffer={setBuffering}
          onError={handleError}
          onEnd={() => { setCompleted(true); void save(positionRef.current, durationMs, true); if (following && settings.autoplayNext) setNextUp(true); }}
        />
      ) : (
        <View style={[s.fill, s.center, { padding: TV_MARGIN }]}>
          <InlineBanner message={copy.labels.previewMediaLimitation} tone="warning" tv />
        </View>
      )}
      {buffering && <View style={[s.fill, s.center, { pointerEvents: 'none' }]}><BufferingRing tv /></View>}
      {controls && (
        <View style={[s.fill, { justifyContent: 'flex-end', padding: TV_MARGIN }]}>
          <View style={[glassStyle(settings.lowTier), { padding: space[5], gap: space[3], borderRadius: radius.md }]}>
            <Text style={tvText('h2')}>{route.title.title} · {episodeLabel(route.season, route.episode)}</Text>
            <Seekbar positionMs={positionMs} durationMs={durationMs} onSeek={seek} tv />
            <View style={[s.row, { gap: space[4], justifyContent: 'center' }]}>
              <Focusable id="player-back" scope="player" onSelect={() => seekBy(-10_000)} style={{ borderRadius: radius.sm }}><SecondaryButton label="−10s" tv icon="seekBack" /></Focusable>
              <Focusable id="player-toggle" scope="player" onSelect={() => setPaused((v) => !v)} style={{ borderRadius: radius.sm }}><PrimaryButton label={paused ? 'Play' : 'Pause'} tv icon={paused ? 'play' : 'pause'} /></Focusable>
              <Focusable id="player-forward" scope="player" onSelect={() => seekBy(10_000)} style={{ borderRadius: radius.sm }}><SecondaryButton label="+10s" tv icon="seekForward" /></Focusable>
              <Focusable id="player-menu" scope="player" onSelect={() => nav.setSettingsOpen(true)} style={{ borderRadius: radius.sm }}><SecondaryButton label="Quality · Subtitles" tv icon="quality" /></Focusable>
              <Focusable id="player-exit" scope="player" onSelect={exit} style={{ borderRadius: radius.sm }}><SecondaryButton label={copy.actions.exit} tv icon="close" /></Focusable>
            </View>
          </View>
        </View>
      )}
      {completed && !nextUp && (
        <View style={[s.fill, s.center, { backgroundColor: color.bg.veil, gap: space[4] }]}>
          <Text style={tvText('h1')}>{following ? copy.states.endOfSeries.title : 'Finished'}</Text>
          <Focusable id="player-finished" scope="player" onSelect={exit} style={{ borderRadius: radius.sm }}><PrimaryButton label={copy.actions.backToSeries} tv /></Focusable>
        </View>
      )}
      {nextUp && following && (
        <View style={[s.fill, { justifyContent: 'flex-end', alignItems: 'center', padding: TV_MARGIN }]}>
          <NextEpisodeCard title={`${route.title.title} · E${following.episode}`} episode={episodeLabel(following.season, following.episode)} tv onPlayNow={() => nav.openPlayer(route.title, following.season, following.episode)} onCancel={() => setNextUp(false)} />
        </View>
      )}
      <TvPlayerMenu
        visible={nav.settingsOpen}
        onClose={() => nav.setSettingsOpen(false)}
        sources={stream.data?.sources ?? []}
        captions={captions}
        quality={quality}
        subtitle={subtitle}
        onQuality={async (v) => { setQuality(v); await update({ defaultQuality: v }); nav.setSettingsOpen(false); }}
        onSubtitle={async (v) => { setSubtitle(v); await update({ subtitleLanguage: v }); nav.setSettingsOpen(false); }}
      />
    </View>
  );
}

function TvPlayerMenu(props: {
  visible: boolean;
  onClose: () => void;
  sources: { url: string; resolution?: string; size?: number }[];
  captions: { url: string; language: string; languageCode?: string }[];
  quality: string;
  subtitle: string;
  onQuality: (v: string) => void;
  onSubtitle: (v: string) => void;
}) {
  if (!props.visible) return null;
  return <TvPlayerMenuContent {...props} />;
}

function TvPlayerMenuContent({
  visible,
  onClose,
  sources,
  captions,
  quality,
  subtitle,
  onQuality,
  onSubtitle,
}: {
  visible: boolean;
  onClose: () => void;
  sources: { url: string; resolution?: string; size?: number }[];
  captions: { url: string; language: string; languageCode?: string }[];
  quality: string;
  subtitle: string;
  onQuality: (v: string) => void;
  onSubtitle: (v: string) => void;
}) {
  useFocusScope('player-menu');
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Quality · Subtitles" tv>
      <View style={{ gap: space[3], paddingBottom: space[6] }}>
        <Text style={tvText('h2')}>Quality</Text>
        <Focusable id="menu-auto" scope="player-menu" onSelect={() => onQuality('auto')} style={{ borderRadius: radius.sm }}><SecondaryButton label={`${copy.labels.autoRecommended}${quality === 'auto' ? ' · Selected' : ''}`} tv /></Focusable>
        {sources.map((src, i) => (
          <Focusable key={src.url} id={`menu-quality-${i}`} scope="player-menu" onSelect={() => onQuality(src.resolution || 'auto')} style={{ borderRadius: radius.sm }}>
            <SecondaryButton label={`${src.resolution || 'Source'} · ${formatBytes(src.size)}`} tv />
          </Focusable>
        ))}
        <Text style={[tvText('h2'), { marginTop: space[4] }]}>Subtitles</Text>
        <Focusable id="menu-off" scope="player-menu" onSelect={() => onSubtitle('off')} style={{ borderRadius: radius.sm }}><SecondaryButton label={copy.labels.off} tv /></Focusable>
        {captions.length ? captions.map((cap, i) => (
          <Focusable key={cap.url} id={`menu-sub-${i}`} scope="player-menu" onSelect={() => onSubtitle(cap.languageCode || cap.language)} style={{ borderRadius: radius.sm }}><SecondaryButton label={cap.language} tv /></Focusable>
        )) : <Text style={[tvText('body'), { color: color.text.muted }]}>{copy.states.noSubtitles}</Text>}
      </View>
    </BottomSheet>
  );
}

export function TvErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  useFocusScope('error');
  return <ErrorState title={copy.states.catalogueEmpty.title} body={message} onAction={onRetry} tv />;
}
