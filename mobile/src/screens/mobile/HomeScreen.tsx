import React, {useCallback, useMemo} from 'react';
import {RefreshControl, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {api, Title} from '../../api/provider';
import {useAsync} from '../../core/hooks';
import {useApp} from '../../state/store';
import {useTheme} from '../../theme';
import {EmptyState, ErrorState, Hero, Icon, Rail, ReelLabel, ResumeLine, SkeletonRail} from '../../components/ui';
import {formatPosition} from '../../core/platform';

export default function HomeScreen({navigation}: any) {
  const {c, t, s, device} = useTheme();
  const insets = useSafeAreaInsets();
  const {continueWatching, progressFor, isSaved} = useApp();
  const {data, error, loading, refreshing, reload} = useAsync(signal => api.home(signal), []);

  const featured = useMemo(() => {
    if (!data || data.length === 0) {
      return null;
    }
    const banner = data.find(sec => /banner|featured/i.test(sec.title));
    return (banner ?? data[0]).items[0] ?? null;
  }, [data]);

  const openDetail = useCallback(
    (item: Title) =>
      navigation.navigate('Detail', {
        subjectId: item.subjectId,
        detailPath: item.detailPath,
        title: item.title,
      }),
    [navigation],
  );

  const resume = continueWatching();
  const pad = {paddingTop: insets.top};

  if (loading) {
    return (
      <ScrollView style={{flex: 1, backgroundColor: c.obsidian}} contentContainerStyle={pad}>
        <View style={{height: 220, backgroundColor: c.surface, marginBottom: s.lg}} />
        <SkeletonRail />
        <SkeletonRail />
        <SkeletonRail />
      </ScrollView>
    );
  }

  if (error) {
    return (
      <View style={[styles.fill, {backgroundColor: c.obsidian}, pad]}>
        <ErrorState message={error} onRetry={() => reload()} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{flex: 1, backgroundColor: c.obsidian}}
      contentContainerStyle={{paddingBottom: s.xxl}}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => reload()}
          tintColor={c.copper}
          colors={[c.copper]}
          progressBackgroundColor={c.elevated}
        />
      }>
      <View style={pad}>
        <View style={styles.brandRow}>
          <View>
            <Text style={[t.reel, {color: c.faint}]}>HALLYU-STREAM</Text>
            <Text style={[t.displayLg, {color: c.ivory, marginTop: 2}]}>Tonight</Text>
          </View>
          <Icon name="tv" size={22} color={c.faint} />
        </View>
      </View>

      {featured ? (
        <Hero
          title={featured.title}
          backdrop={featured.poster}
          meta={[featured.genre, featured.year, featured.rating ? `${featured.rating} ★` : null]
            .filter(Boolean)
            .join('  ·  ')}
          onPlay={() =>
            navigation.navigate('Player', {
              subjectId: featured.subjectId,
              detailPath: featured.detailPath,
              title: featured.title,
              season: featured.type === 'series' ? 1 : 0,
              episode: featured.type === 'series' ? 1 : 0,
              poster: featured.poster,
            })
          }
          onInfo={() => openDetail(featured)}
        />
      ) : null}

      {resume.length > 0 ? (
        <View style={{marginTop: s.sm, marginBottom: s.lg}}>
          <View style={{paddingHorizontal: s.gutter, marginBottom: s.sm}}>
            <ReelLabel>Continue watching</ReelLabel>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal: s.gutter}}>
            {resume.slice(0, 10).map(p => (
              <View key={p.subjectId} style={{width: 220, marginRight: s.sm}}>
                <View
                  style={{
                    height: 124,
                    borderRadius: 12,
                    overflow: 'hidden',
                    backgroundColor: c.elevated,
                    borderWidth: 1,
                    borderColor: c.hairline,
                  }}>
                  {p.poster ? (
                    <View style={StyleSheet.absoluteFill}>
                      <View style={[StyleSheet.absoluteFill, {backgroundColor: c.veil}]} />
                    </View>
                  ) : null}
                  <View style={styles.resumeOverlay}>
                    <Icon name="play" size={20} color={c.ivory} />
                    <Text style={[t.labelMd, {color: c.ivory, marginLeft: 6}]}>
                      {p.season > 0 ? `S${p.season} E${p.episode}` : 'Film'}
                    </Text>
                  </View>
                </View>
                <Text numberOfLines={1} style={[t.labelLg, {color: c.ivory, marginTop: s.xs}]}>
                  {p.title}
                </Text>
                <ResumeLine positionMs={p.positionMs} durationMs={p.durationMs} />
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {data && data.length === 0 ? (
        <EmptyState
          icon="offline"
          headline="The catalogue is quiet"
          body="Nothing came back from the provider. Pull down to try again."
          actionLabel="Reload"
          onAction={() => reload()}
        />
      ) : null}

      {data?.map(section => (
        <Rail
          key={section.key}
          sectionTitle={section.title}
          items={section.items}
          onPressItem={openDetail}
          progressFor={item => {
            const p = progressFor(item.subjectId, item.type === 'series' ? 1 : 0, item.type === 'series' ? 1 : 0);
            if (!p || !p.durationMs) {
              return undefined;
            }
            return p.positionMs / p.durationMs;
          }}
          horizontalPadding={s.gutter}
        />
      ))}

      {data && data.length > 0 ? (
        <Text style={[t.micro, {color: c.faint, textAlign: 'center', marginTop: s.md}]}>
          {data.reduce((n, sec) => n + sec.items.length, 0)} titles across {data.length} shelves
        </Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: {flex: 1},
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  resumeOverlay: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
