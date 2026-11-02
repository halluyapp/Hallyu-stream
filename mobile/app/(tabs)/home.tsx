/** Home — the Marquee Hero + reel shelves + Continue Watching (§6.1.3, S1). */
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Bookmark } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, fonts, layout, radius, type } from '@/theme/tokens';
import { fetchHome } from '@/services/zarhosting/api';
import type { HomeSection, Title } from '@/services/zarhosting/types';
import { openTitle, openPlayer } from '@/lib/nav';
import { useLibrary } from '@/lib/store';
import { creditsLine, formatDuration, minLeft, formatTime } from '@/lib/format';
import { PosterCard } from '@/components/PosterCard';
import { ContinueCard } from '@/components/ContinueCard';
import { Shelf } from '@/components/Shelf';
import { ErrorState, SkeletonShelf } from '@/components/States';

type Status = 'loading' | 'ready' | 'error';

export default function HomeScreen() {
  const [status, setStatus] = useState<Status>('loading');
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [hero, setHero] = useState<Title | null>(null);
  const library = useLibrary();
  const insets = useSafeAreaInsets();

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const rows = await fetchHome();
      const all = rows.flatMap((r) => r.titles);
      const heroPick = all.find((t) => t.backdrop) ?? all[0] ?? null;
      setHero(heroPick);
      setSections(rows);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const heroProgress =
    hero && library.progress.length
      ? library.progress.find((p) => p.subjectId === hero.subjectId)
      : undefined;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: layout.navHeight + 48 + insets.bottom }}
        showsVerticalScrollIndicator={false}
        testID="home-scroll"
      >
        {status === 'loading' ? (
          <View style={{ paddingTop: 8 }}>
          <View style={styles.heroSkeleton} />
            <SkeletonShelf />
            <SkeletonShelf />
          </View>
        ) : status === 'error' ? (
          <View style={{ height: 620, justifyContent: 'center' }}>
            <ErrorState
              body="We can't reach the catalogue right now. Check your connection and try again."
              onRetry={load}
            />
          </View>
        ) : hero ? (
          <MarqueeHero
            title={hero}
            resumeLabel={heroProgress ? `Resume · ${formatTime(heroProgress.positionMs)}` : null}
            onPlay={() =>
              openPlayer({
                subjectId: hero.subjectId,
                detailPath: hero.detailPath,
                title: hero.title,
                season: heroProgress?.season ?? 1,
                episode: heroProgress?.episode ?? 1,
                positionMs: heroProgress?.positionMs ?? 0,
                contentType: hero.contentType ?? 'movie',
              })
            }
            onInfo={() => openTitle(hero)}
            onMyList={async () => {
              Haptics.selectionAsync().catch(() => undefined);
              await library.toggleWatchlist({
                subjectId: hero.subjectId,
                detailPath: hero.detailPath,
                title: hero.title,
                cover: hero.cover,
                contentType: hero.contentType,
              });
            }}
            inList={library.watchlist.some((w) => w.subjectId === hero.subjectId)}
          />
        ) : null}

        {status === 'ready' ? (
          <>
            {library.progress.length ? (
              <Shelf label="Continue watching">
                {library.progress.slice(0, 10).map((p) => (
                  <ContinueCard
                    key={p.key}
                    title={p.title}
                    meta={[
                      p.contentType === 'series' ? `S${p.season}:E${p.episode}` : null,
                      p.durationMs ? minLeft(p.positionMs, p.durationMs) : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                    cover={p.cover}
                    progress={p.durationMs ? p.positionMs / p.durationMs : 0.02}
                    onPress={() =>
                      openPlayer({
                        subjectId: p.subjectId,
                        detailPath: p.detailPath,
                        title: p.title,
                        season: p.season,
                        episode: p.episode,
                        positionMs: p.positionMs,
                        contentType: p.contentType ?? 'movie',
                      })
                    }
                  />
                ))}
              </Shelf>
            ) : null}

            {sections.map((section) => (
              <View key={section.key}>
                <Shelf label={section.label}>
                  {section.titles.map((t) => (
                    <PosterCard
                      key={t.subjectId}
                      title={t.title}
                      cover={t.cover}
                      year={t.releaseYear}
                      onPress={() => openTitle(t)}
                    />
                  ))}
                </Shelf>
              </View>
            ))}

            {!sections.length && !library.progress.length ? (
              <ErrorState body="The catalogue returned nothing yet. Check your connection and try again." onRetry={load} />
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

/** S1 — Marquee Hero: full-bleed backdrop, lower dissolve, serif title, credits, copper Play. */
function MarqueeHero({
  title,
  resumeLabel,
  onPlay,
  onInfo,
  onMyList,
  inList,
}: {
  title: Title;
  resumeLabel: string | null;
  onPlay: () => void;
  onInfo: () => void;
  onMyList: () => void;
  inList: boolean;
}) {
  const [artReady, setArtReady] = useState(false);
  const art = title.backdrop ?? title.cover;
  return (
    <View style={styles.hero}>
      {art ? (
        <Image
          source={{ uri: art }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          onLoadEnd={() => setArtReady(true)}
          transition={400}
        />
      ) : null}
      <LinearGradient
        colors={['rgba(10,11,13,0.05)', 'rgba(10,11,13,0.0)', colors.bgObsidian]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={styles.heroContent}>
        <View style={styles.kicker}>
          <Text style={styles.kickerText}>{title.contentType === 'series' ? 'SERIES' : 'FEATURE'}</Text>
        </View>
        <Text style={styles.heroTitle} numberOfLines={2}>
          {title.title}
        </Text>
        <Text style={styles.credits} numberOfLines={1}>
          {creditsLine([
            title.releaseYear ? String(title.releaseYear) : null,
            title.rating ? `★${title.rating}` : null,
            title.genres[0] ?? null,
          ])}
        </Text>
        <View style={styles.heroActions}>
          <Pressable
            onPress={onPlay}
            style={({ pressed }) => [styles.playBtn, pressed && styles.playBtnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Play"
          >
            <Play size={18} color={colors.textOnAccent} fill={colors.textOnAccent} />
            <Text style={styles.playLabel}>{resumeLabel ?? 'Play'}</Text>
          </Pressable>
          <Pressable onPress={onMyList} style={styles.ghostBtn} accessibilityRole="button" accessibilityLabel="My List">
            <Bookmark size={20} color={inList ? colors.accentCopper : colors.textPrimary} fill={inList ? colors.accentCopper : 'transparent'} />
          </Pressable>
          <Pressable onPress={onInfo} style={styles.ghostBtn} accessibilityRole="button" accessibilityLabel="More info">
            <Text style={styles.infoLabel}>Info</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const HERO_H = 460;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgObsidian,
  },
  heroSkeleton: {
    height: HERO_H,
    backgroundColor: colors.bgElevated,
  },
  hero: {
    height: HERO_H,
    backgroundColor: colors.bgElevated,
    justifyContent: 'flex-end',
  },
  heroContent: {
    paddingHorizontal: layout.marginMobile,
    paddingBottom: 24,
    gap: 6,
  },
  kicker: {
    marginBottom: 2,
  },
  kickerText: {
    ...type.micro,
    color: colors.textMuted,
    letterSpacing: 2,
  },
  heroTitle: {
    fontFamily: fonts.display,
    fontSize: 34,
    lineHeight: 40,
    color: colors.textPrimary,
  },
  credits: {
    ...type.meta,
    color: colors.textMuted,
  },
  heroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 48,
    paddingHorizontal: 22,
    borderRadius: radius.sm,
    backgroundColor: colors.accentCopper,
  },
  playBtnPressed: {
    backgroundColor: colors.accentCopperDeep,
  },
  playLabel: {
    ...type.button,
    color: colors.textOnAccent,
  },
  ghostBtn: {
    height: 48,
    minWidth: 48,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10,11,13,0.35)',
  },
  infoLabel: {
    ...type.button,
    color: colors.textPrimary,
  },
});

void 0;
