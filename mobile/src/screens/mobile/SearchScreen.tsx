import React, {useEffect, useState} from 'react';
import {ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {api, Title} from '../../api/provider';
import {useAsync, useDebounced} from '../../core/hooks';
import {useApp} from '../../state/store';
import {useTheme} from '../../theme';
import {EmptyState, ErrorState, Icon, PosterCard} from '../../components/ui';

export default function SearchScreen({navigation}: any) {
  const {c, t, s, r, device} = useTheme();
  const insets = useSafeAreaInsets();
  const {recentSearches, addRecentSearch, clearRecentSearches} = useApp();
  const [query, setQuery] = useState('');
  const debounced = useDebounced(query, 400);

  const {data, error, loading, reload} = useAsync(
    signal => (debounced.trim().length >= 2 ? api.search(debounced.trim(), 1, signal) : Promise.resolve(null)),
    [debounced],
  );

  useEffect(() => {
    if (data && data.items.length > 0) {
      addRecentSearch(debounced);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const columns = device.widthClass === 'compact' ? 2 : 3;
  const itemWidth = Math.floor((device.width - s.gutter * 2 - s.sm * (columns - 1)) / columns);

  return (
    <View style={{flex: 1, backgroundColor: c.obsidian, paddingTop: insets.top}}>
      <View style={{paddingHorizontal: s.gutter, paddingTop: s.sm}}>
        <Text style={[t.displayMd, {color: c.ivory}]}>Search</Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: s.md,
            backgroundColor: c.elevated,
            borderRadius: r.pill,
            borderWidth: 1,
            borderColor: c.hairline,
            paddingHorizontal: s.md,
            height: 48,
          }}>
          <Icon name="search" size={18} color={c.faint} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Films, series, actors"
            placeholderTextColor={c.faint}
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={() => addRecentSearch(query)}
            style={[t.bodyMd, {flex: 1, color: c.ivory, marginLeft: s.xs, paddingVertical: 0}]}
            accessibilityLabel="Search the catalogue"
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery('')} hitSlop={10} accessibilityLabel="Clear search">
              <Icon name="close" size={16} color={c.faint} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {debounced.trim().length < 2 ? (
        <View style={{paddingTop: s.lg}}>
          {recentSearches.length > 0 ? (
            <View style={{paddingHorizontal: s.gutter}}>
              <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                <Text style={[t.reel, {color: c.muted}]}>RECENT</Text>
                <Pressable onPress={clearRecentSearches} hitSlop={8}>
                  <Text style={[t.micro, {color: c.faint}]}>Clear</Text>
                </Pressable>
              </View>
              <View style={{marginTop: s.sm}}>
                {recentSearches.map(term => (
                  <Pressable
                    key={term}
                    onPress={() => setQuery(term)}
                    style={{paddingVertical: s.sm, flexDirection: 'row', alignItems: 'center'}}>
                    <Icon name="clock" size={15} color={c.faint} />
                    <Text style={[t.bodyMd, {color: c.ivory, marginLeft: s.sm}]}>{term}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : (
            <EmptyState
              icon="search"
              headline="What are you in the mood for?"
              body="Search across every shelf. Two characters is enough to begin."
            />
          )}
        </View>
      ) : loading ? (
        <View style={{paddingTop: s.xl, alignItems: 'center'}}>
          <ActivityIndicator color={c.copper} />
        </View>
      ) : error ? (
        <ErrorState message={error} onRetry={() => reload()} />
      ) : data && data.items.length === 0 ? (
        <EmptyState
          icon="search"
          headline={`Nothing for “${debounced}”`}
          body="Try a shorter phrase, or the original-language title."
        />
      ) : (
        <FlatList
          data={data?.items ?? []}
          key={`cols-${columns}`}
          numColumns={columns}
          keyExtractor={item => item.subjectId}
          contentContainerStyle={{padding: s.gutter, paddingBottom: s.xxl}}
          columnWrapperStyle={{gap: s.sm}}
          ListHeaderComponent={
            data ? (
              <Text style={[t.micro, {color: c.faint, marginBottom: s.sm}]}>
                {data.total} results · page {data.page}
              </Text>
            ) : null
          }
          renderItem={({item}: {item: Title}) => (
            <View style={{marginBottom: s.md}}>
              <PosterCard
                title={item}
                width={itemWidth}
                badge={item.year}
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
    </View>
  );
}

const styles = StyleSheet.create({});
