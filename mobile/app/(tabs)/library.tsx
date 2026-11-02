/** Library — the viewer's shelf: Continue · My List · History (§6.1.15). */
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Play, Trash2 } from 'lucide-react-native';
import { colors, layout, radius, type } from '@/theme/tokens';
import { openTitle, openPlayer } from '@/lib/nav';
import { useLibrary } from '@/lib/store';
import { creditsLine, minLeft, formatTime, relativeTime } from '@/lib/format';
import { ContinueCard } from '@/components/ContinueCard';
import { PosterCard } from '@/components/PosterCard';
import { EmptyState, SkeletonBlock } from '@/components/States';

const SEGMENTS = ['Continue', 'My List', 'History'] as const;

export default function LibraryScreen() {
  const [segment, setSegment] = useState<(typeof SEGMENTS)[number]>('Continue');
  const library = useLibrary();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Library</Text>
      </View>

      <View style={styles.segments}>
        {SEGMENTS.map((s) => (
          <Pressable
            key={s}
            onPress={() => setSegment(s)}
            style={[styles.segment, segment === s && styles.segmentActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: segment === s }}
          >
            <Text style={[styles.segmentText, segment === s && styles.segmentTextActive]}>{s}</Text>
          </Pressable>
        ))}
      </View>

      {!library.ready ? (
        <View style={{ paddingHorizontal: layout.marginMobile, flexDirection: 'row', gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <SkeletonBlock key={i} width={120} height={180} />
          ))}
        </View>
      ) : segment === 'Continue' ? (
        <ContinueSegment />
      ) : segment === 'My List' ? (
        <MyListSegment />
      ) : (
        <HistorySegment />
      )}
    </View>
  );
}

function ContinueSegment() {
  const library = useLibrary();
  if (!library.progress.length) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <EmptyState
          line="Nothing in progress."
          body="Start something tonight — we'll remember where you stopped."
          actionLabel="Browse Home"
          onAction={() => undefined}
        />
      </View>
    );
  }
  return (
    <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
      {library.progress.map((p) => (
        <View key={p.key} style={styles.progressRow}>
          <ContinueCard
            title={p.title}
            meta={[
              p.contentType === 'series' ? `S${p.season}:E${p.episode}` : null,
              p.durationMs ? minLeft(p.positionMs, p.durationMs) : formatTime(p.positionMs),
            ]
              .filter(Boolean)
              .join(' · ')}
            cover={p.cover}
            progress={p.durationMs ? p.positionMs / p.durationMs : 0.02}
            width={232}
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
          <Pressable
            onPress={() =>
              Alert.alert('Remove from Continue Watching?', `“${p.title}” will leave this shelf. Your watchlist is unaffected.`, [
                { text: 'Keep', style: 'cancel' },
                { text: 'Remove', style: 'destructive', onPress: () => void library.removeProgress(p.key) },
              ])
            }
            style={styles.removeBtn}
            accessibilityLabel="Remove from Continue Watching"
          >
            <Trash2 size={18} color={colors.textMuted} strokeWidth={1.75} />
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

function MyListSegment() {
  const library = useLibrary();
  if (!library.watchlist.length) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <EmptyState
          line="Your list is empty."
          body="Save anything for later — tap the bookmark on any title."
        />
      </View>
    );
  }
  return (
    <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
      {library.watchlist.map((w) => (
        <PosterCard
          key={w.subjectId}
          title={w.title}
          cover={w.cover}
          width={152}
          onPress={() =>
            openTitle({ subjectId: w.subjectId, detailPath: w.detailPath, title: w.title, cover: w.cover, contentType: w.contentType })
          }
          onLongPress={() =>
            Alert.alert('Remove from My List?', `“${w.title}”`, [
              { text: 'Keep', style: 'cancel' },
              { text: 'Remove', style: 'destructive', onPress: () => void library.toggleWatchlist({ subjectId: w.subjectId, detailPath: w.detailPath, title: w.title, cover: w.cover, contentType: w.contentType }) },
            ])
          }
        />
      ))}
    </ScrollView>
  );
}

function HistorySegment() {
  const library = useLibrary();
  if (!library.history.length) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <EmptyState
          line="Nothing watched yet."
          body="Your place is kept automatically when you watch."
        />
      </View>
    );
  }
  return (
    <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
      {library.history.map((h) => (
        <View key={h.id} style={styles.historyRow}>
          <Pressable
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: layout.touchMin }}
            onPress={() =>
              openPlayer({
                subjectId: h.subjectId,
                detailPath: h.detailPath,
                title: h.title,
                season: h.season,
                episode: h.episode,
                positionMs: 0,
                contentType: 'movie',
              })
            }
            accessibilityRole="button"
            accessibilityLabel={`Rewatch ${h.title}`}
          >
            <View style={styles.playGlyph}>
              <Play size={16} color={colors.textMuted} fill={colors.textMuted} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.historyTitle} numberOfLines={1}>
                {h.title}
              </Text>
              <Text style={styles.historyMeta} numberOfLines={1}>
                {creditsLine([h.season && h.episode ? `S${h.season}:E${h.episode}` : null, relativeTime(h.watchedAt)])}
              </Text>
            </View>
            <Pressable
              onPress={() => void library.removeHistory(h.id)}
              style={styles.removeBtn}
              accessibilityLabel="Remove from history"
            >
              <Trash2 size={16} color={colors.textFaint} strokeWidth={1.75} />
            </Pressable>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgObsidian,
  },
  header: {
    paddingHorizontal: layout.marginMobile,
  },
  title: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 28,
    color: colors.textPrimary,
  },
  segments: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: layout.marginMobile,
    paddingVertical: 16,
  },
  segment: {
    height: 36,
    paddingHorizontal: 18,
    borderRadius: radius.pill,
    backgroundColor: colors.bgSurface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: colors.accentCopperTint,
    borderColor: colors.accentCopper,
  },
  segmentText: {
    ...type.meta,
    color: colors.textMuted,
  },
  segmentTextActive: {
    color: colors.accentCopper,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: layout.marginMobile,
    paddingBottom: layout.navHeight + 48,
  },
  progressRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  removeBtn: {
    width: layout.touchMin,
    height: layout.touchMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: layout.marginMobile,
    paddingBottom: layout.navHeight + 48,
  },
  historyRow: {
    paddingVertical: 4,
  },
  playGlyph: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyTitle: {
    ...type.bodyStrong,
    color: colors.textPrimary,
  },
  historyMeta: {
    ...type.meta,
    color: colors.textMuted,
  },
});
