import React, {useMemo, useState} from 'react';
import {FlatList, StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {api, Title} from '../../api/provider';
import {useAsync} from '../../core/hooks';
import {useTheme} from '../../theme';
import {Chip, ErrorState, PosterCard, SkeletonRail} from '../../components/ui';

const FILTERS = ['All', 'Series', 'Movies', 'K-Drama', 'C-Drama', 'Anime', 'Romance', 'Nollywood'];

export default function ExploreScreen({navigation}: any) {
  const {c, t, s, device} = useTheme();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState('All');
  const {data, error, loading, reload} = useAsync(signal => api.home(signal), []);

  const all = useMemo(() => {
    if (!data) {
      return [] as Title[];
    }
    const seen = new Set<string>();
    const out: Title[] = [];
    data.forEach(section => {
      section.items.forEach(item => {
        if (!seen.has(item.subjectId)) {
          seen.add(item.subjectId);
          out.push({...item, genre: item.genre ?? section.title});
        }
      });
    });
    return out;
  }, [data]);

  const filtered = useMemo(() => {
    if (filter === 'All') {
      return all;
    }
    if (filter === 'Series') {
      return all.filter(i => i.type === 'series');
    }
    if (filter === 'Movies') {
      return all.filter(i => i.type === 'movie');
    }
    return all.filter(i => (i.genre ?? '').toLowerCase().includes(filter.toLowerCase()));
  }, [all, filter]);

  const columns = device.widthClass === 'compact' ? 2 : device.widthClass === 'medium' ? 3 : 4;
  const itemWidth = Math.floor((device.width - s.gutter * 2 - s.sm * (columns - 1)) / columns);

  return (
    <View style={{flex: 1, backgroundColor: c.obsidian, paddingTop: insets.top}}>
      <View style={{paddingHorizontal: s.gutter, paddingTop: s.sm}}>
        <Text style={[t.displayMd, {color: c.ivory}]}>Explore</Text>
        <Text style={[t.bodySm, {color: c.muted, marginTop: 2}]}>Every shelf, one wall.</Text>
      </View>

      <View style={{height: 52, justifyContent: 'center'}}>
        <FlatList
          horizontal
          data={FILTERS}
          keyExtractor={f => f}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{paddingHorizontal: s.gutter, alignItems: 'center'}}
          renderItem={({item}) => (
            <Chip label={item} active={filter === item} onPress={() => setFilter(item)} />
          )}
        />
      </View>

      {loading ? (
        <View style={{paddingTop: s.md}}>
          <SkeletonRail />
          <SkeletonRail />
        </View>
      ) : error ? (
        <ErrorState message={error} onRetry={() => reload()} />
      ) : (
        <FlatList
          data={filtered}
          key={`cols-${columns}`}
          numColumns={columns}
          keyExtractor={item => item.subjectId}
          contentContainerStyle={{padding: s.gutter, paddingBottom: s.xxl}}
          columnWrapperStyle={{gap: s.sm}}
          renderItem={({item}) => (
            <View style={{marginBottom: s.md}}>
              <PosterCard
                title={item}
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
          ListEmptyComponent={
            <Text style={[t.bodyMd, {color: c.muted, textAlign: 'center', marginTop: s.xl}]}>
              Nothing in this shelf yet.
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({});
