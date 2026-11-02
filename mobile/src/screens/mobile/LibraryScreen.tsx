import React from 'react';
import {FlatList, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useApp} from '../../state/store';
import {useTheme} from '../../theme';
import {Button, EmptyState, Icon, PosterCard, ReelLabel, ResumeLine} from '../../components/ui';

export default function LibraryScreen({navigation}: any) {
  const {c, t, s, device} = useTheme();
  const insets = useSafeAreaInsets();
  const {library, continueWatching, downloads} = useApp();
  const resume = continueWatching();
  const columns = device.widthClass === 'compact' ? 2 : 3;
  const itemWidth = Math.floor((device.width - s.gutter * 2 - s.sm * (columns - 1)) / columns);

  return (
    <ScrollView
      style={{flex: 1, backgroundColor: c.obsidian}}
      contentContainerStyle={{paddingTop: insets.top + s.sm, paddingBottom: s.xxl}}>
      <View style={{paddingHorizontal: s.gutter}}>
        <Text style={[t.displayMd, {color: c.ivory}]}>Library</Text>
        <Text style={[t.bodySm, {color: c.muted, marginTop: 2}]}>
          {library.length} saved · {downloads.length} in the offline queue
        </Text>
      </View>

      <View style={{flexDirection: 'row', gap: s.sm, paddingHorizontal: s.gutter, marginTop: s.md}}>
        <Button label="Downloads" icon="download" variant="secondary" onPress={() => navigation.navigate('Downloads')} />
        <Button label="Devices" icon="tv" variant="secondary" onPress={() => navigation.navigate('PairingHub')} />
      </View>

      {resume.length > 0 ? (
        <View style={{marginTop: s.lg}}>
          <View style={{paddingHorizontal: s.gutter, marginBottom: s.sm}}>
            <ReelLabel>Continue watching</ReelLabel>
          </View>
          {resume.slice(0, 4).map(p => (
            <Pressable
              key={p.subjectId}
              onPress={() =>
                navigation.navigate('Player', {
                  subjectId: p.subjectId,
                  detailPath: p.detailPath,
                  title: p.title,
                  season: p.season,
                  episode: p.episode,
                  poster: p.poster,
                  startAtMs: p.positionMs,
                })
              }
              style={({pressed}) => [
                styles.resumeRow,
                {borderBottomColor: c.hairline, opacity: pressed ? 0.7 : 1},
              ]}>
              <View style={{width: 64, height: 96, borderRadius: 8, overflow: 'hidden', backgroundColor: c.elevated}}>
                {p.poster ? (
                  <PosterCard
                    title={{subjectId: p.subjectId, detailPath: p.detailPath, title: p.title, poster: p.poster, type: 'series'}}
                    onPress={() => {}}
                    width={64}
                    showTitle={false}
                  />
                ) : null}
              </View>
              <View style={{flex: 1, marginLeft: s.sm}}>
                <Text numberOfLines={1} style={[t.titleSm, {color: c.ivory}]}>
                  {p.title}
                </Text>
                <Text style={[t.micro, {color: c.muted, marginTop: 2}]}>
                  {p.season > 0 ? `Season ${p.season} · Episode ${p.episode}` : 'Film'}
                </Text>
                <ResumeLine positionMs={p.positionMs} durationMs={p.durationMs} />
              </View>
              <Icon name="play" size={18} color={c.copper} />
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={{paddingHorizontal: s.gutter, marginTop: s.lg, marginBottom: s.sm}}>
        <ReelLabel>Saved titles</ReelLabel>
      </View>

      {library.length === 0 ? (
        <EmptyState
          icon="library"
          headline="Your library is empty"
          body="Tap “Add to library” on any title and it will wait for you here."
          actionLabel="Browse the catalogue"
          onAction={() => navigation.navigate('Home')}
        />
      ) : (
        <FlatList
          data={library}
          scrollEnabled={false}
          key={`cols-${columns}`}
          numColumns={columns}
          keyExtractor={item => item.subjectId}
          contentContainerStyle={{paddingHorizontal: s.gutter}}
          columnWrapperStyle={{gap: s.sm}}
          renderItem={({item}) => (
            <View style={{marginBottom: s.md}}>
              <PosterCard
                title={{
                  subjectId: item.subjectId,
                  detailPath: item.detailPath,
                  title: item.title,
                  poster: item.poster,
                  type: item.type,
                }}
                width={itemWidth}
                onPress={() =>
                  navigation.navigate('Detail', {
                    subjectId: item.subjectId,
                    detailPath: item.detailPath,
                    title: item.title,
                  })
                }
              />
            </View>
          )}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  resumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
