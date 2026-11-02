/** Explore — deliberate browsing: chips + 2-col poster grid, fallback ladder (§6.1.4). */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RefreshCcw } from 'lucide-react-native';
import { colors, layout, radius, type } from '@/theme/tokens';
import { fetchHome } from '@/services/zarhosting/api';
import type { Title } from '@/services/zarhosting/types';
import { openTitle } from '@/lib/nav';
import { PosterCard } from '@/components/PosterCard';
import { ReelLabel } from '@/components/ReelLabel';
import { ErrorState, SkeletonBlock } from '@/components/States';

type Status = 'loading' | 'ready' | 'error';

export default function ExploreScreen() {
  const [status, setStatus] = useState<Status>('loading');
  const [all, setAll] = useState<Title[]>([]);
  const [chips, setChips] = useState<string[]>([]);
  const [chip, setChip] = useState('All');
  const insets = useSafeAreaInsets();

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const sections = await fetchHome();
      const titles = sections.flatMap((s) => s.titles);
      const seen = new Set<string>();
      const unique = titles.filter((t) => (seen.has(t.subjectId) ? false : (seen.add(t.subjectId), true)));
      const cats = new Set<string>();
      for (const t of unique) for (const c of t.categories) cats.add(c);
      setAll(unique);
      setChips(['All', 'Films', 'Series', ...[...cats].filter((c) => c !== 'All').slice(0, 8)]);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (chip === 'All') return all;
    if (chip === 'Films') return all.filter((t) => t.contentType !== 'series');
    if (chip === 'Series') return all.filter((t) => t.contentType === 'series');
    return all.filter((t) => t.categories.includes(chip));
  }, [all, chip]);

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Explore</Text>
        <Pressable onPress={load} style={styles.refresh} accessibilityLabel="Refresh">
          <RefreshCcw size={20} color={colors.textMuted} strokeWidth={1.75} />
        </Pressable>
      </View>

      {status === 'ready' ? (
        <View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {chips.map((c) => (
              <Pressable
                key={c}
                onPress={() => setChip(c)}
                style={[styles.chip, chip === c && styles.chipActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: chip === c }}
              >
                <Text style={[styles.chipText, chip === c && styles.chipTextActive]}>{c}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {status === 'loading' ? (
        <View style={styles.gridWrap}>
          <View style={styles.grid}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <SkeletonBlock key={i} width={colWidth()} height={Math.round(colWidth() * 1.5)} />
            ))}
          </View>
        </View>
      ) : status === 'error' ? (
        <ErrorState body="We can't reach the catalogue right now. Check your connection and try again." onRetry={load} />
      ) : filtered.length ? (
        <ScrollView
          contentContainerStyle={{ paddingBottom: layout.navHeight + 48 + insets.bottom }}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.grid, { paddingHorizontal: layout.marginMobile }]}>
            {filtered.map((t) => (
              <PosterCard
                key={t.subjectId}
                title={t.title}
                cover={t.cover}
                year={t.releaseYear}
                width={colWidth()}
                onPress={() => openTitle(t)}
              />
            ))}
          </View>
          <View style={{ paddingHorizontal: layout.marginMobile, paddingBottom: 24 }}>
            <ReelLabel label="More categories as they become available" />
          </View>
        </ScrollView>
      ) : (
        <ErrorState line="Nothing in this category yet." body="Try another chip, or pull down to refresh." onRetry={load} />
      )}
    </View>
  );
}

function colWidth() {
  return 152;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgObsidian,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.marginMobile,
  },
  title: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 28,
    color: colors.textPrimary,
  },
  refresh: {
    width: layout.touchMin,
    height: layout.touchMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chips: {
    gap: 8,
    paddingHorizontal: layout.marginMobile,
    paddingVertical: 16,
  },
  chip: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    backgroundColor: colors.bgSurface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: colors.accentCopperTint,
    borderColor: colors.accentCopper,
  },
  chipText: {
    ...type.meta,
    color: colors.textMuted,
  },
  chipTextActive: {
    color: colors.accentCopper,
  },
  gridWrap: {
    paddingHorizontal: layout.marginMobile,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    paddingBottom: layout.navHeight + 48,
  },
});
