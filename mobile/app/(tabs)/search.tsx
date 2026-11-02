/** Search — live results after 2 chars, 300ms debounce, recents (§6.1.5). */
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Search as SearchIcon, X, Clock, ChevronRight } from 'lucide-react-native';
import { colors, layout, radius, type } from '@/theme/tokens';
import { searchTitles } from '@/services/zarhosting/api';
import type { Title } from '@/services/zarhosting/types';
import { openTitle } from '@/lib/nav';
import { useLibrary } from '@/lib/store';
import { creditsLine } from '@/lib/format';
import { EmptyState, ErrorState, SkeletonBlock } from '@/components/States';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Title[] | null>(null);
  const [status, setStatus] = useState<'idle' | 'typing' | 'ready' | 'error'>('idle');
  const library = useLibrary();
  const insets = useSafeAreaInsets();

  const run = useCallback(
    async (q: string) => {
      setStatus('typing');
      try {
        const res = await searchTitles(q);
        setResults(res.titles);
        setStatus('ready');
        if (res.titles.length) await library.addSearchQuery(q);
      } catch {
        setStatus('error');
      }
    },
    [library],
  );

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults(null);
      setStatus('idle');
      return;
    }
    const timer = setTimeout(() => run(q), 300);
    return () => clearTimeout(timer);
  }, [query, run]);

  const showIdle = status === 'idle' && !results;
  const showTyping = status === 'typing';

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.field}>
          <SearchIcon size={18} color={colors.textMuted} strokeWidth={1.75} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search titles"
            placeholderTextColor={colors.textFaint}
            style={styles.input}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            onSubmitEditing={() => {
              const q = query.trim();
              if (q.length >= 2) run(q);
            }}
            accessibilityLabel="Search titles"
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} accessibilityLabel="Clear search">
              <X size={18} color={colors.textMuted} strokeWidth={1.75} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: layout.navHeight + 48 + insets.bottom }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {showIdle ? (
          <>
            {library.searchHistory.length ? (
              <View style={styles.section}>
                <Text style={styles.reelLabel}>{'R E C E N T'}</Text>
                {library.searchHistory.map((q) => (
                  <Pressable
                    key={q}
                    onPress={() => setQuery(q)}
                    style={styles.queryRow}
                    accessibilityRole="button"
                  >
                    <Clock size={16} color={colors.textFaint} strokeWidth={1.75} />
                    <Text style={styles.queryText}>{q}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            <View style={{ paddingVertical: 32 }}>
              <EmptyState
                line="Find a title."
                body="Start typing — results appear as you type. Recent searches stay on this device."
              />
            </View>
          </>
        ) : showTyping ? (
          <View style={styles.rows}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={styles.skeletonRow}>
                <SkeletonBlock width={96} height={54} />
                <View style={{ gap: 6, flex: 1 }}>
                  <SkeletonBlock width="70%" height={14} radius={4} />
                  <SkeletonBlock width="40%" height={11} radius={4} />
                </View>
              </View>
            ))}
          </View>
        ) : status === 'error' ? (
          <ErrorState body="The search didn't go through. Check your connection and try again." onRetry={() => run(query.trim())} />
        ) : results && results.length ? (
          <View style={styles.rows}>
            {results.map((t) => (
              <ResultRow key={t.subjectId} title={t} />
            ))}
            <Text style={styles.endLine}>That's everything for “{query.trim()}”.</Text>
          </View>
        ) : results ? (
          <View style={{ paddingVertical: 40 }}>
            <EmptyState line="No matches." body={`Nothing found for “${query.trim()}”. Try a shorter title, or check the spelling.`} />
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function ResultRow({ title }: { title: Title }) {
  const [failed, setFailed] = useState(false);
  return (
    <Pressable onPress={() => openTitle(title)} style={({ pressed }) => [styles.resultRow, pressed && { opacity: 0.8 }]} accessibilityRole="button" accessibilityLabel={`${title.title}. Opens details.`}>
      <View style={styles.thumb}>
        {title.cover && !failed ? (
          <Image source={{ uri: title.cover }} style={StyleSheet.absoluteFill} contentFit="cover" recyclingKey={title.cover} onError={() => setFailed(true)} />
        ) : (
          <Text style={styles.thumbGlyph}>{title.title[0] ?? '—'}</Text>
        )}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.resultTitle} numberOfLines={1}>
          {title.title}
        </Text>
        <Text style={styles.resultMeta} numberOfLines={1}>
          {creditsLine([
            title.contentType === 'series' ? 'Series' : title.contentType === 'movie' ? 'Film' : null,
            title.releaseYear ? String(title.releaseYear) : null,
            title.genres[0] ?? null,
          ])}
        </Text>
      </View>
      <ChevronRight size={18} color={colors.textFaint} strokeWidth={1.75} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgObsidian,
  },
  header: {
    paddingHorizontal: layout.marginMobile,
    paddingBottom: 12,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 52,
    paddingHorizontal: 16,
    borderRadius: radius.sm,
    backgroundColor: colors.bgSurface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    ...type.body,
    paddingVertical: 0,
  },
  section: {
    paddingHorizontal: layout.marginMobile,
    paddingTop: 20,
    gap: 4,
  },
  reelLabel: {
    ...type.label,
    letterSpacing: 1.7,
    color: colors.textMuted,
    marginBottom: 8,
  },
  queryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    minHeight: layout.touchMin,
  },
  queryText: {
    ...type.body,
    color: colors.textPrimary,
    flex: 1,
  },
  rows: {
    paddingHorizontal: layout.marginMobile,
    paddingTop: 8,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    minHeight: layout.touchMin,
  },
  thumb: {
    width: 96,
    height: 54,
    borderRadius: radius.xs,
    backgroundColor: colors.bgElevated,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbGlyph: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 20,
    color: colors.textFaint,
  },
  resultTitle: {
    ...type.bodyStrong,
    color: colors.textPrimary,
  },
  resultMeta: {
    ...type.meta,
    color: colors.textMuted,
  },
  skeletonRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    paddingVertical: 10,
  },
  endLine: {
    ...type.meta,
    color: colors.textFaint,
    textAlign: 'center',
    paddingVertical: 24,
  },
});
