/** Detail — decide and play (§6.1.7 / §6.1.8). Backdrop dissolve, copper Play, seasons/episodes. */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Bookmark, ChevronLeft, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, fonts, layout, radius, type } from '@/theme/tokens';
import { fetchDetail } from '@/services/zarhosting/api';
import type { Season, Title } from '@/services/zarhosting/types';
import { useLibrary } from '@/lib/store';
import { openPlayer, openTitle } from '@/lib/nav';
import { creditsLine, formatDuration, formatTime } from '@/lib/format';
import { PrimaryButton, SecondaryButton } from '@/components/Buttons';
import { BottomSheet } from '@/components/BottomSheet';
import { ErrorState, SkeletonBlock } from '@/components/States';
import { FallbackTile } from '@/components/FallbackTile';
import { ReelLabel } from '@/components/ReelLabel';

type State =
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'ready'; title: Title; seasons: Season[] };

export default function DetailScreen() {
  const params = useLocalSearchParams<{
    subjectId: string;
    detailPath: string;
    title: string;
    cover: string;
    contentType: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const library = useLibrary();

  const [state, setState] = useState<State>({ kind: 'loading' });
  const [episodeSheet, setEpisodeSheet] = useState<{ season: Season } | null>(null);

  const subjectId = params.subjectId ?? '';
  const detailPath = params.detailPath ?? '';

  const load = useCallback(async () => {
    setState({ kind: 'loading' });
    try {
      const detail = await fetchDetail(detailPath);
      setState({ kind: 'ready', title: detail.title, seasons: detail.seasons });
    } catch {
      setState({ kind: 'error' });
    }
  }, [detailPath]);

  useEffect(() => {
    if (detailPath) load();
  }, [detailPath, load]);

  const inList = library.watchlist.some((w) => w.subjectId === subjectId);

  const resumeEntry = useMemo(() => {
    if (state.kind !== 'ready') return null;
    const entries = library.progress.filter((p) => p.subjectId === subjectId);
    return entries.length ? entries[0] : null;
  }, [library.progress, state.kind, subjectId]);

  const headerTitle = state.kind === 'ready' ? state.title.title : (params.title ?? '');

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 64 }}>
        {/* Backdrop (16:9) dissolving to obsidian */}
        <View style={styles.backdropWrap}>
          {params.cover ? (
            <Image source={{ uri: params.cover }} style={StyleSheet.absoluteFill} contentFit="cover" transition={320} />
          ) : state.kind === 'ready' && state.title.backdrop ? (
            <Image source={{ uri: state.title.backdrop }} style={StyleSheet.absoluteFill} contentFit="cover" transition={320} />
          ) : (
            <FallbackTile title={headerTitle} height={260} width={9999} />
          )}
          <LinearGradient
            colors={['rgba(10,11,13,0.25)', 'rgba(10,11,13,0.0)', colors.bgObsidian]}
            locations={[0, 0.4, 1]}
            style={StyleSheet.absoluteFill}
          />
          <Pressable
            onPress={() => router.back()}
            style={[styles.backBtn, { top: insets.top + 8 }]}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <ChevronLeft size={24} color={colors.textPrimary} strokeWidth={2} />
          </Pressable>
        </View>

        {state.kind === 'loading' ? (
          <View style={{ paddingHorizontal: layout.marginMobile, gap: 10 }}>
            <SkeletonBlock width="80%" height={32} />
            <SkeletonBlock width="50%" height={16} radius={4} />
            <SkeletonBlock width="100%" height={60} radius={8} />
          </View>
        ) : state.kind === 'error' ? (
          <ErrorState body="We couldn't load this title. Check your connection and try again." onRetry={load} />
        ) : (
          <DetailBody
            title={state.title}
            seasons={state.seasons}
            inList={inList}
            resumeLabel={
              resumeEntry
                ? resumeEntry.contentType === 'series'
                  ? `Resume S${resumeEntry.season}:E${resumeEntry.episode}`
                  : `Resume · ${formatTime(resumeEntry.positionMs)}`
                : null
            }
            onPlay={(se, ep, positionMs) =>
              openPlayer({
                subjectId: state.title.subjectId,
                detailPath: state.title.detailPath,
                title: state.title.title,
                season: se,
                episode: ep,
                positionMs,
                contentType: state.title.contentType ?? 'movie',
              })
            }
            onMyList={() => {
              Haptics.selectionAsync().catch(() => undefined);
              void library.toggleWatchlist({
                subjectId: state.title.subjectId,
                detailPath: state.title.detailPath,
                title: state.title.title,
                cover: state.title.cover,
                contentType: state.title.contentType,
              });
            }}
            onEpisodes={(season) => setEpisodeSheet({ season })}
          />
        )}
      </ScrollView>

      <EpisodeSheet
        season={episodeSheet?.season ?? null}
        titleName={headerTitle}
        subjectId={subjectId}
        detailPath={detailPath}
        onClose={() => setEpisodeSheet(null)}
        onPlay={(se, ep) => {
          setEpisodeSheet(null);
          if (state.kind === 'ready') {
            openPlayer({
              subjectId: state.title.subjectId,
              detailPath: state.title.detailPath,
              title: state.title.title,
              season: se,
              episode: ep,
              positionMs: 0,
              contentType: state.title.contentType ?? 'series',
            });
          }
        }}
      />
    </View>
  );
}

function DetailBody({
  title,
  seasons,
  inList,
  resumeLabel,
  onPlay,
  onMyList,
  onEpisodes,
}: {
  title: Title;
  seasons: Season[];
  inList: boolean;
  resumeLabel: string | null;
  onPlay: (se: number, ep: number, positionMs: number) => void;
  onMyList: () => void;
  onEpisodes: (season: Season) => void;
}) {
  const [season, setSeason] = useState<Season | null>(seasons[0] ?? null);
  const library = useLibrary();
  const [overviewOpen, setOverviewOpen] = useState(false);

  useEffect(() => {
    if (!season && seasons.length) setSeason(seasons[0] ?? null);
  }, [seasons, season]);

  const seasonEpisodes = useMemo(() => {
    if (!season) return [];
    return Array.from({ length: season.maxEpisodes }, (_, i) => i + 1).map((ep) => ({ season, ep }));
  }, [season]);

  const episodeProgress = (ep: number) =>
    library.progress.find((p) => p.subjectId === title.subjectId && p.season === season?.seasonNumber && p.episode === ep) ?? null;

  return (
    <View style={{ paddingHorizontal: layout.marginMobile, gap: 16 }}>
      <View style={{ gap: 6 }}>
        <Text style={styles.title}>{title.title}</Text>
        <Text style={styles.credits}>
          {creditsLine([
            title.releaseYear ? String(title.releaseYear) : null,
            title.contentType === 'series' ? 'Series' : title.contentType === 'movie' ? 'Film' : null,
            title.rating ? `★${title.rating}` : null,
            title.genres.slice(0, 2).join(', ') || null,
          ])}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <PrimaryButton
          label={resumeLabel ?? 'Play'}
          icon={<Play size={16} color={colors.textOnAccent} fill={colors.textOnAccent} />}
          onPress={() => {
            const resume = library.progress.find((p) => p.subjectId === title.subjectId);
            onPlay(resume?.season ?? 1, resume?.episode ?? 1, resume?.positionMs ?? 0);
          }}
          style={{ flex: 1 }}
        />
        <SecondaryButton
          label={inList ? 'In My List' : 'My List'}
          icon={<Bookmark size={18} color={inList ? colors.accentCopper : colors.textPrimary} fill={inList ? colors.accentCopper : 'transparent'} />}
          onPress={onMyList}
          style={{ flex: 1 }}
        />
      </View>

      {title.description ? (
        <Pressable onPress={() => setOverviewOpen(!overviewOpen)} disabled>
          <Text style={styles.overview} numberOfLines={overviewOpen ? undefined : 4}>
            {title.description}
          </Text>
        </Pressable>
      ) : null}

      {title.contentType === 'series' && seasons.length ? (
        <View style={{ gap: 12 }}>
          <ReelLabel label="Seasons" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {seasons.map((s) => (
              <Pressable
                key={s.seasonNumber}
                onPress={() => setSeason(s)}
                style={[styles.seasonPill, season?.seasonNumber === s.seasonNumber && styles.seasonPillActive]}
              >
                <Text style={[styles.seasonText, season?.seasonNumber === s.seasonNumber && styles.seasonTextActive]}>
                  Season {s.seasonNumber}
                </Text>
              </Pressable>
            ))}
          </View>

          {seasonEpisodes.slice(0, 3).map(({ season: s, ep }) => {
            const p = episodeProgress(ep);
            return (
              <Pressable
                key={ep}
                onPress={() => onPlay(s.seasonNumber, ep, p?.positionMs ?? 0)}
                style={({ pressed }) => [styles.episodeRow, pressed && { opacity: 0.8 }]}
                accessibilityRole="button"
                accessibilityLabel={`Episode ${ep}${p ? ', resume' : ''}`}
              >
                <View style={styles.still}>
                  {p ? <View style={[styles.epProgress, { width: `${p.durationMs ? Math.min(100, (p.positionMs / p.durationMs) * 100) : 2}%` }]} /> : null}
                  <Text style={styles.stillGlyph}>E{ep}</Text>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.episodeTitle}>Episode {ep}</Text>
                  <Text style={styles.episodeMeta}>{p ? `Resume · ${formatTime(p.positionMs)}` : 'Not started'}</Text>
                </View>
                <ChevronRight size={18} color={colors.textFaint} strokeWidth={1.75} />
              </Pressable>
            );
          })}

          <SecondaryButton label="See all episodes" onPress={() => season && onEpisodes(season)} />
        </View>
      ) : null}
    </View>
  );
}

function EpisodeSheet({
  season,
  titleName,
  subjectId,
  detailPath,
  onClose,
  onPlay,
}: {
  season: Season | null;
  titleName: string;
  subjectId: string;
  detailPath: string;
  onClose: () => void;
  onPlay: (se: number, ep: number) => void;
}) {
  const library = useLibrary();
  const [episodes, setEpisodes] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!season) return;
    setLoading(true);
    setEpisodes(Array.from({ length: season.maxEpisodes }, (_, i) => i + 1));
    setLoading(false);
  }, [season]);

  return (
    <BottomSheet visible={!!season} onClose={onClose} title={season ? `${titleName} · Season ${season.seasonNumber}` : undefined}>
      <View style={{ paddingHorizontal: layout.marginMobile, paddingBottom: 40, paddingTop: 12 }}>
        {loading ? (
          <ActivityIndicator color={colors.accentCopper} />
        ) : episodes.length ? (
          episodes.map((ep) => {
            const p = library.progress.find((x) => x.subjectId === subjectId && x.detailPath === detailPath && x.season === season?.seasonNumber && x.episode === ep);
            return (
              <Pressable key={ep} onPress={() => onPlay(season?.seasonNumber ?? 1, ep)} style={styles.sheetEpisode} accessibilityRole="button" accessibilityLabel={`Play episode ${ep}`}>
                <Text style={styles.sheetEpisodeTitle}>Episode {ep}</Text>
                <Text style={styles.sheetEpisodeMeta}>{p ? `Resume · ${formatTime(p.positionMs)}` : '—'}</Text>
              </Pressable>
            );
          })
        ) : (
          <Text style={styles.sheetEmpty}>Episodes for this season aren't available yet.</Text>
        )}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgObsidian,
  },
  backdropWrap: {
    height: 280,
    justifyContent: 'flex-end',
    backgroundColor: colors.bgElevated,
  },
  backBtn: {
    position: 'absolute',
    width: layout.touchMin,
    height: layout.touchMin,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10,11,13,0.5)',
    left: 12,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 30,
    lineHeight: 36,
    color: colors.textPrimary,
  },
  credits: {
    ...type.meta,
    color: colors.textMuted,
  },
  overview: {
    ...type.body,
    color: colors.textMuted,
  },
  seasonPill: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    backgroundColor: colors.bgSurface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seasonPillActive: {
    backgroundColor: colors.accentCopperTint,
    borderColor: colors.accentCopper,
  },
  seasonText: {
    ...type.meta,
    color: colors.textMuted,
  },
  seasonTextActive: {
    color: colors.accentCopper,
  },
  episodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 72,
  },
  still: {
    width: 128,
    height: 72,
    borderRadius: radius.xs,
    backgroundColor: colors.bgElevated,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  epProgress: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    height: 3,
    backgroundColor: colors.accentCopper,
  },
  stillGlyph: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.textFaint,
  },
  episodeTitle: {
    ...type.bodyStrong,
    color: colors.textPrimary,
  },
  episodeMeta: {
    ...type.meta,
    color: colors.textMuted,
  },
  sheetEpisode: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    minHeight: layout.touchMin,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  sheetEpisodeTitle: {
    ...type.bodyStrong,
    color: colors.textPrimary,
  },
  sheetEpisodeMeta: {
    ...type.meta,
    color: colors.textMuted,
  },
  sheetEmpty: {
    ...type.body,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 24,
  },
});

void formatDuration;
