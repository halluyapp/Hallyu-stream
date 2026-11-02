import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Pressable, RefreshControl, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import {
  color,
  copy,
  episodeLabel,
  formatBytes,
  formatTime,
  layout,
  library,
  nextEpisode,
  progressKey,
  radius,
  seasonEpisodeForTitle,
  space,
  zarhosting,
  type DownloadEntry,
  type StreamPayload,
  type Title,
} from '@hallyu/shared';
import {
  BottomSheet,
  CreditsLine,
  EmptyState,
  EpisodeRow,
  ErrorState,
  FallbackArtwork,
  IconButton,
  InlineBanner,
  LandscapeCard,
  LoadingState,
  MarqueeHero,
  PosterGrid,
  PrimaryButton,
  QueryRow,
  ReelLabel,
  SearchField,
  SecondaryButton,
  Shelf,
  Chip,
  SkeletonBlock,
  TopBar,
} from '../components';
import { useDetail, useHome, useLibraryList, useSearch } from '../hooks/useCatalogue';
import { Icon, useLibraryVersion, usePlatform, useSettings } from '../platform/context';
import { mobileText, s } from '../theme';
import { useMobileNav } from './navigation';

const MARGIN = layout.marginMobile;

// ── Home ──────────────────────────────────────────────────────────────────

export function HomeScreen() {
  const nav = useMobileNav();
  const home = useHome();
  const watchlist = useLibraryList(() => library.getWatchlist());
  const continuing = useLibraryList(() => library.getContinueWatching());
  const { haptics } = usePlatform();

  const openDetail = useCallback((title: Title) => nav.navigate({ name: 'detail', title }), [nav]);
  const openPlayer = useCallback(
    (title: Title) => {
      const { season, episode } = seasonEpisodeForTitle(title);
      nav.navigate({ name: 'player', title, season, episode });
    },
    [nav],
  );
  const toggleList = useCallback(
    async (title: Title) => {
      await library.toggleWatchlist(title);
      haptics.light();
    },
    [haptics],
  );

  const heroTitle = home.data?.shelves[0]?.titles[0];

  if (home.loading) return <LoadingState rows={2} />;
  if (!home.data && home.error) {
    return <ErrorState title={copy.states.catalogueEmpty.title} body={home.error} onAction={home.reload} />;
  }

  return (
    <ScrollView style={s.screen} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
      {home.cached && <InlineBanner message={`${copy.labels.saved} shelves · ${copy.states.offline.body}`} tone="warning" />}
      {home.error && <InlineBanner message={home.error} tone="error" actionLabel={copy.actions.retry} onAction={home.reload} />}
      {heroTitle && (
        <MarqueeHero
          title={heroTitle}
          onPlay={() => openPlayer(heroTitle)}
          onMore={() => openDetail(heroTitle)}
          onMyList={() => toggleList(heroTitle)}
          inList={watchlist.some((w) => w.subjectId === heroTitle.subjectId)}
        />
      )}
      {continuing.length > 0 && (
        <View style={{ paddingHorizontal: MARGIN, marginBottom: layout.gapShelfStackMobile }}>
          <ReelLabel action="All ›" onAction={() => nav.navigate({ name: 'librarySegment', segment: 'continue' })}>
            {copy.labels.continueWatching}
          </ReelLabel>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {continuing.map((entry) => (
              <LandscapeCard
                key={entry.key}
                title={entry.title}
                imageUrl={entry.cover}
                width={layout.continueMobile.width}
                height={layout.continueMobile.height}
                meta={`${episodeLabel(entry.season, entry.episode)} · ${formatTime(entry.positionMs)}`}
                progress={entry.durationMs ? entry.positionMs / entry.durationMs : undefined}
                onPress={() =>
                  nav.navigate({
                    name: 'player',
                    title: {
                      subjectId: entry.subjectId,
                      detailPath: entry.detailPath,
                      title: entry.title,
                      cover: entry.cover,
                      genres: [],
                      contentType: entry.season > 0 ? 'series' : 'movie',
                      seasons: [],
                    },
                    season: entry.season,
                    episode: entry.episode,
                    startPositionMs: entry.positionMs,
                  })
                }
              />
            ))}
          </ScrollView>
        </View>
      )}
      {home.data?.shelves.map((shelf) => (
        <View key={shelf.id} style={{ paddingHorizontal: MARGIN }}>
          <Shelf label={shelf.label} titles={shelf.titles} onTitlePress={openDetail} />
        </View>
      ))}
    </ScrollView>
  );
}

// ── Explore ───────────────────────────────────────────────────────────────

export function ExploreScreen() {
  const nav = useMobileNav();
  const home = useHome();
  const [filter, setFilter] = useState('all');

  const allTitles = useMemo(() => {
    const seen = new Set<string>();
    const list: Title[] = [];
    for (const shelf of home.data?.shelves ?? []) {
      for (const title of shelf.titles) {
        if (!seen.has(title.subjectId)) {
          seen.add(title.subjectId);
          list.push(title);
        }
      }
    }
    return list;
  }, [home.data]);

  const genres = useMemo(() => {
    const set = new Set<string>();
    for (const shelf of home.data?.shelves ?? []) if (shelf.category) set.add(shelf.category);
    for (const title of allTitles) for (const genre of title.genres) set.add(genre);
    return Array.from(set).slice(0, 8);
  }, [home.data, allTitles]);

  const chips = ['all', 'films', 'series', ...genres];
  const filtered = useMemo(() => {
    if (filter === 'all') return allTitles;
    if (filter === 'films') return allTitles.filter((t) => t.contentType === 'movie');
    if (filter === 'series') return allTitles.filter((t) => t.contentType === 'series');
    return allTitles.filter((t) => t.genres.includes(filter) || t.genres.some((g) => g.toLowerCase() === filter.toLowerCase()));
  }, [filter, allTitles]);

  if (home.loading) return <LoadingState rows={1} />;
  if (!home.data && home.error) return <ErrorState title={copy.states.catalogueEmpty.title} body={home.error} onAction={home.reload} />;

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={{ paddingTop: 24, paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={home.loading} onRefresh={home.reload} tintColor={color.accent.copper} />}
    >
      <View style={{ paddingHorizontal: MARGIN, gap: space[4] }}>
        <Text style={mobileText('h1')}>Explore</Text>
        {home.cached && <InlineBanner message={`${copy.labels.saved} shelves`} tone="warning" />}
        {home.error && <InlineBanner message={home.error} tone="error" actionLabel={copy.actions.retry} onAction={home.reload} />}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space[3] }}>
          {chips.map((chip) => (
            <Chip key={chip} label={chip === 'all' ? 'All' : chip === 'films' ? 'Films' : chip === 'series' ? 'Series' : chip} selected={filter === chip} onPress={() => setFilter(chip)} />
          ))}
        </ScrollView>
        {!genres.length && <Text style={[mobileText('meta'), { color: color.text.muted }]}>{copy.labels.moreCategories}</Text>}
      </View>
      {filtered.length ? (
        <View style={{ marginTop: space[4], height: 620 }}>
          <PosterGrid titles={filtered} onTitlePress={(title) => nav.navigate({ name: 'detail', title })} columns={2} />
        </View>
      ) : (
        <EmptyState title={copy.labels.nothingInCategory} body="Try another filter." actionLabel={copy.actions.browseHome} onAction={() => nav.switchTab('home')} />
      )}
    </ScrollView>
  );
}

// ── Search ────────────────────────────────────────────────────────────────

export function SearchScreen() {
  const nav = useMobileNav();
  const search = useSearch();
  const home = useHome();
  const recent = useLibraryList(() => library.getSearchHistory());
  const [filter, setFilter] = useState<'all' | 'movie' | 'series'>('all');
  const [grid, setGrid] = useState(false);

  const popular = useMemo(() => {
    const titles = home.data?.shelves.flatMap((shelf) => shelf.titles) ?? [];
    return Array.from(new Set(titles.map((t) => t.title))).slice(0, 6);
  }, [home.data]);

  const filtered = useMemo(
    () => (filter === 'all' ? search.results : search.results.filter((t) => t.contentType === filter)),
    [filter, search.results],
  );

  return (
    <ScrollView style={s.screen} contentContainerStyle={{ padding: MARGIN, paddingBottom: 100, gap: space[4] }} keyboardShouldPersistTaps="handled">
      <SearchField value={search.query} onChange={search.setQuery} onSubmit={() => void search.submit()} onClear={search.clear} />
      <View style={[s.rowBetween]}>
        <View style={[s.row, { gap: space[3] }]}>
          <Chip label="All" selected={filter === 'all'} onPress={() => setFilter('all')} />
          <Chip label="Films" selected={filter === 'movie'} onPress={() => setFilter('movie')} />
          <Chip label="Series" selected={filter === 'series'} onPress={() => setFilter('series')} />
        </View>
        <IconButton name={grid ? 'list' : 'grid'} onPress={() => setGrid((v) => !v)} label="Toggle result layout" />
      </View>

      {search.loading && <LoadingState rows={1} />}
      {search.error && <InlineBanner message={search.error} tone="error" actionLabel={copy.actions.retry} onAction={() => void search.submit()} />}

      {!search.query.trim() && (
        <View style={{ gap: space[4] }}>
          <ReelLabel>{copy.labels.recent}</ReelLabel>
          {recent.length ? recent.map((q) => (
            <QueryRow key={q} query={q} onPress={() => void search.submit(q)} onRemove={() => void library.removeSearchQuery(q)} />
          )) : <Text style={[mobileText('meta'), { color: color.text.muted }]}>No recent searches.</Text>}
          <ReelLabel>{copy.labels.popularSearches}</ReelLabel>
          <View style={[s.row, s.wrap, { gap: space[3] }]}>
            {popular.map((q) => <Chip key={q} label={q} onPress={() => void search.submit(q)} />)}
          </View>
        </View>
      )}

      {search.query.trim().length > 0 && !search.loading && !search.error && filtered.length === 0 && (
        <EmptyState title={copy.states.noSearchResults.title} body={copy.states.noSearchResults.body} actionLabel={copy.actions.clearSearch} onAction={search.clear} />
      )}

      {search.query.trim().length > 0 && filtered.length > 0 && (
        grid ? (
          <View style={{ height: 620 }}>
            <PosterGrid titles={filtered} onTitlePress={(title) => nav.navigate({ name: 'detail', title })} columns={3} />
          </View>
        ) : (
          <View style={{ gap: space[2] }}>
            {filtered.map((title) => (
              <PressableRow key={title.subjectId} title={title} onPress={() => nav.navigate({ name: 'detail', title })} />
            ))}
            {search.hasMore && <PrimaryButton label="Load more" onPress={() => void search.loadMore()} />}
            {!search.hasMore && <Text style={[mobileText('meta'), { color: color.text.muted, textAlign: 'center' }]}>{copy.labels.endOfResults.replace('…', search.query)}</Text>}
          </View>
        )
      )}
    </ScrollView>
  );
}

function PressableRow({ title, onPress }: { title: Title; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[s.row, { gap: space[4], paddingVertical: space[3], borderBottomWidth: 1, borderBottomColor: color.hairline }]}>
      <View style={[s.row, { flex: 1, gap: space[4] }]}>
        {title.cover ? (
          <Image source={{ uri: title.cover }} style={{ width: 96, height: 54, borderRadius: radius.xs, backgroundColor: color.bg.elevated }} />
        ) : (
          <FallbackArtwork title={title.title} width={96} height={54} radiusValue={radius.xs} />
        )}
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={mobileText('bodyStrong')}>{title.title}</Text>
          <Text numberOfLines={1} style={[mobileText('meta'), { color: color.text.muted }]}>
            {title.releaseYear ?? '—'} · {title.genres.slice(0, 2).join(', ') || '—'}
          </Text>
        </View>
      </View>
      <Icon name="chevronRight" size={20} color={color.text.muted} />
    </Pressable>
  );
}

// ── Detail ────────────────────────────────────────────────────────────────

export function DetailScreen({ title: fallback }: { title: Title }) {
  const nav = useMobileNav();
  const detail = useDetail(fallback.detailPath);
  const version = useLibraryVersion();
  const [inList, setInList] = useState(false);
  const [progress, setProgress] = useState<number | undefined>();
  const [episodeSheet, setEpisodeSheet] = useState(false);
  const [season, setSeason] = useState(1);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [downloadSources, setDownloadSources] = useState<StreamPayload | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const { haptics, downloads } = usePlatform();
  const { settings } = useSettings();
  const { width } = useWindowDimensions();

  const title = detail.data?.title ?? fallback;
  const { season: defaultSeason, episode: defaultEpisode } = seasonEpisodeForTitle(title);
  const key = progressKey(title.subjectId, defaultSeason, defaultEpisode);

  useEffect(() => {
    let active = true;
    library.isInWatchlist(title.subjectId).then((v) => active && setInList(v));
    library.getProgressFor(key).then((entry) => active && setProgress(entry?.positionMs));
    return () => { active = false; };
  }, [title.subjectId, key, version]);

  const openPlayer = useCallback(
    (se = defaultSeason, ep = defaultEpisode, start = progress) => {
      nav.navigate({ name: 'player', title, season: se, episode: ep, startPositionMs: start });
    },
    [nav, title, defaultSeason, defaultEpisode, progress],
  );

  const toggleList = async () => {
    const added = await library.toggleWatchlist(title);
    setInList(added);
    haptics.light();
  };

  const openDownload = async () => {
    setDownloadOpen(true);
    setDownloadError(null);
    setDownloadSources(null);
    try {
      const stream = await zarhosting.getStream({
        subjectId: title.subjectId,
        detailPath: title.detailPath,
        season: defaultSeason,
        episode: defaultEpisode,
      });
      setDownloadSources(stream);
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : 'Could not resolve download sources.');
    }
  };

  const startDownload = async (quality?: string) => {
    if (!downloads) {
      setNotice(copy.labels.previewDownloads);
      setDownloadOpen(false);
      return;
    }
    const source = downloadSources?.sources.find((s) => (s.resolution || '') === quality) ?? downloadSources?.sources[0];
    if (!source) return;
    const entry: DownloadEntry = {
      id: progressKey(title.subjectId, defaultSeason, defaultEpisode),
      subjectId: title.subjectId,
      detailPath: title.detailPath,
      title: title.title,
      cover: title.cover,
      season: defaultSeason,
      episode: defaultEpisode,
      quality: source.resolution,
      totalBytes: source.size,
      status: 'queued',
      updatedAt: Date.now(),
    };
    await library.upsertDownload(entry);
    await downloads.start({ id: entry.id, url: source.url, title: entry.title, quality: entry.quality });
    setDownloadOpen(false);
  };

  if (detail.loading) return <LoadingState rows={1} />;
  if (!detail.data && detail.error) return <ErrorState title={copy.states.catalogueEmpty.title} body={detail.error} onAction={detail.reload} secondaryLabel="Back" onSecondary={nav.back} />;

  const seasons = title.seasons.length ? title.seasons : [{ seasonNumber: defaultSeason, maxEpisodes: 12 }];
  const activeSeason = seasons.find((s) => s.seasonNumber === season) ?? seasons[0];
  const noSource = title.hasResource === false;
  const next = nextEpisode(title.seasons, defaultSeason, defaultEpisode);

  return (
    <ScrollView style={s.screen} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
      <View style={{ height: Math.round(width * 0.56), justifyContent: 'flex-end' }}>
        {title.backdrop ? (
          <Image source={{ uri: title.backdrop }} style={[s.fill]} resizeMode="cover" />
        ) : (
          <FallbackArtwork title={title.title} width={width} height={Math.round(width * 0.56)} radiusValue={0} />
        )}
        <View style={[s.fill, { backgroundColor: 'rgba(10,11,13,0.25)' }]} />
        <View style={[s.fill, { top: '55%', backgroundColor: 'rgba(10,11,13,0.75)' }]} />
        <View style={[s.fill, { top: '82%', backgroundColor: color.bg.obsidian }]} />
        <TopBar onBack={nav.back} />
      </View>
      <View style={{ paddingHorizontal: MARGIN, gap: space[4], marginTop: -space[8] }}>
        <Text style={mobileText('displayL')}>{title.title}</Text>
        <CreditsLine title={title} />
        <View style={[s.row, { gap: space[3], flexWrap: 'wrap' }]}>
          <PrimaryButton
            label={noSource ? copy.states.noSources.title : progress ? `${copy.actions.resume} from ${formatTime(progress)}` : copy.actions.play}
            onPress={() => openPlayer()}
            disabled={noSource}
            icon="play"
          />
          <SecondaryButton label={copy.actions.myList} onPress={toggleList} icon={inList ? 'bookmark' : 'plus'} />
          <SecondaryButton label={copy.actions.download} onPress={() => void openDownload()} icon="download" disabled={noSource} />
        </View>
        {progress !== undefined && <TextButtonLine label={copy.actions.startOver} onPress={() => openPlayer(defaultSeason, defaultEpisode, 0)} />}
        {title.description && <Text style={[mobileText('body'), { color: color.text.muted }]} numberOfLines={5}>{title.description}</Text>}
        {title.contentType === 'series' && (
          <View style={{ gap: space[3] }}>
            <ReelLabel action={copy.actions.seeAllEpisodes} onAction={() => setEpisodeSheet(true)}>Episodes</ReelLabel>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space[3] }}>
              {seasons.map((s) => <Chip key={s.seasonNumber} label={`Season ${s.seasonNumber}`} selected={season === s.seasonNumber} onPress={() => setSeason(s.seasonNumber)} />)}
            </ScrollView>
            {Array.from({ length: Math.min(3, activeSeason.maxEpisodes) }).map((_, i) => (
              <EpisodeRow key={i} episode={i + 1} title={`Episode ${i + 1}`} onPress={() => openPlayer(activeSeason.seasonNumber, i + 1)} />
            ))}
          </View>
        )}
        {detail.data?.similar.length ? (
          <View style={{ marginHorizontal: -MARGIN }}>
            <Shelf label={copy.labels.titlesLikeThis} titles={detail.data.similar} onTitlePress={(t) => nav.navigate({ name: 'detail', title: t })} />
          </View>
        ) : null}
        {notice && <InlineBanner message={notice} tone="info" />}
      </View>

      <BottomSheet visible={episodeSheet} onClose={() => setEpisodeSheet(false)} title={`Season ${activeSeason.seasonNumber}`}>
        <View style={{ gap: space[3], paddingBottom: space[4] }}>
          {Array.from({ length: activeSeason.maxEpisodes }).map((_, i) => (
            <EpisodeRow key={i} episode={i + 1} title={`Episode ${i + 1}`} watched={false} onPress={() => { setEpisodeSheet(false); openPlayer(activeSeason.seasonNumber, i + 1); }} />
          ))}
        </View>
      </BottomSheet>

      <BottomSheet visible={downloadOpen} onClose={() => setDownloadOpen(false)} title="Choose download quality">
        {downloadError && <InlineBanner message={downloadError} tone="error" actionLabel={copy.actions.retry} onAction={() => void openDownload()} />}
        {!downloadSources && !downloadError && <SkeletonBlock width="100%" height={48} />}
        {downloadSources?.sources.length ? downloadSources.sources.map((source) => (
          <View key={source.url} style={{ marginBottom: space[3] }}>
            <SecondaryButton label={`${source.resolution || 'Source'} · ${formatBytes(source.size)}`} onPress={() => void startDownload(source.resolution)} />
          </View>
        )) : null}
        {downloadSources && !downloadSources.sources.length && <Text style={[mobileText('body'), { color: color.text.muted }]}>{copy.states.noSources.body}</Text>}
      </BottomSheet>
    </ScrollView>
  );
}

function TextButtonLine({ label, onPress }: { label: string; onPress: () => void }) {
  return <Text onPress={onPress} style={[mobileText('body'), { color: color.accent.copperLight }]}>{label}</Text>;
}
