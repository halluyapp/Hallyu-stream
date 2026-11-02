import React, {useEffect, useMemo, useState} from 'react';
import {Image, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {api} from '../../api/provider';
import {useAsync} from '../../core/hooks';
import {useApp} from '../../state/store';
import {useTheme} from '../../theme';
import {Button, Chip, ErrorState, Icon, ProgressBar, ReelLabel} from '../../components/ui';
import {formatDuration, formatPosition, formatYear} from '../../core/platform';

export default function DetailScreen({route, navigation}: any) {
  const {detailPath, title: fallbackTitle} = route.params;
  const {c, t, s, device} = useTheme();
  const insets = useSafeAreaInsets();
  const {isSaved, toggleLibrary, progress, showToast} = useApp();
  const {data, error, loading, reload} = useAsync(signal => api.detail(detailPath, signal), [detailPath]);
  const [season, setSeason] = useState<number | null>(null);

  useEffect(() => {
    if (data && data.seasons.length > 0 && season === null) {
      setSeason(data.seasons[0].season);
    }
  }, [data, season]);

  const activeSeason = useMemo(
    () => data?.seasons.find(x => x.season === season) ?? data?.seasons[0],
    [data, season],
  );

  /** Resume target: the most recent unfinished episode of this title. */
  const resume = useMemo(() => {
    if (!data) {
      return null;
    }
    return (
      Object.values(progress)
        .filter(p => p.subjectId === data.subjectId && p.durationMs > 0 && p.positionMs / p.durationMs < 0.95)
        .sort((a, b) => b.updatedAt - a.updatedAt)[0] ?? null
    );
  }, [data, progress]);

  const openPlayer = (se: number, ep: number, startAtMs = 0) => {
    if (!data) {
      return;
    }
    navigation.navigate('Player', {
      subjectId: data.subjectId,
      detailPath: data.detailPath,
      title: data.title,
      season: se,
      episode: ep,
      poster: data.poster,
      startAtMs,
    });
  };

  if (loading) {
    return (
      <View style={{flex: 1, backgroundColor: c.obsidian}}>
        <View style={{height: 260, backgroundColor: c.surface}} />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={{flex: 1, backgroundColor: c.obsidian, paddingTop: insets.top}}>
        <Pressable onPress={() => navigation.goBack()} style={{padding: s.md}} accessibilityLabel="Go back">
          <Icon name="back" size={22} color={c.ivory} />
        </Pressable>
        <ErrorState message={error ?? 'This title is not available.'} onRetry={() => reload()} />
      </View>
    );
  }

  const isMovie = data.type === 'movie';
  const saved = isSaved(data.subjectId);
  const meta = [
    data.year || formatYear(undefined),
    isMovie && data.durationSeconds ? formatDuration(data.durationSeconds) : null,
    data.rating ? `${data.rating} ★` : null,
    data.country,
  ]
    .filter(Boolean)
    .join('  ·  ');

  return (
    <ScrollView style={{flex: 1, backgroundColor: c.obsidian}} contentContainerStyle={{paddingBottom: s.xxl}}>
      <View style={{height: device.widthClass === 'compact' ? 300 : 340}}>
        <Image source={{uri: data.backdrop || data.poster}} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <View style={[StyleSheet.absoluteFill, {backgroundColor: 'rgba(10,11,13,0.45)'}]} />
        <View style={{flex: 1, paddingTop: insets.top}}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={12}
            accessibilityLabel="Go back"
            style={{
              margin: s.md,
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: c.glass,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Icon name="back" size={20} color={c.ivory} />
          </Pressable>
        </View>
      </View>

      <View style={{marginTop: -s.xxl, paddingHorizontal: s.gutter}}>
        <Text style={[t.displayLg, {color: c.ivory}]}>{data.title || fallbackTitle}</Text>
        <Text style={[t.labelMd, {color: c.muted, marginTop: s.xs}]}>{meta}</Text>

        <View style={{marginTop: s.md}}>
          {resume ? (
            <Button
              label={`Resume${resume.season > 0 ? ` S${resume.season} E${resume.episode}` : ''} · ${formatPosition(resume.positionMs)}`}
              icon="play"
              onPress={() => openPlayer(resume.season, resume.episode, resume.positionMs)}
            />
          ) : (
            <Button
              label={isMovie ? 'Play' : 'Play S1 E1'}
              icon="play"
              onPress={() => openPlayer(isMovie ? 0 : 1, isMovie ? 0 : 1)}
            />
          )}
        </View>

        <View style={{flexDirection: 'row', gap: s.sm, marginTop: s.sm}}>
          <Button
            label={saved ? 'In library' : 'Add to library'}
            icon={saved ? 'check' : 'plus'}
            variant="secondary"
            onPress={() => {
              toggleLibrary({
                subjectId: data.subjectId,
                detailPath: data.detailPath,
                title: data.title,
                poster: data.poster,
                type: data.type,
              });
              showToast(saved ? 'Removed from library' : 'Added to library');
            }}
          />
          <Button
            label="Prepare"
            icon="download"
            variant="secondary"
            onPress={() =>
              navigation.navigate('Downloads', {
                request: {
                  subjectId: data.subjectId,
                  detailPath: data.detailPath,
                  title: data.title,
                  poster: data.poster,
                  season: isMovie ? 0 : activeSeason?.season ?? 1,
                  episode: isMovie ? 0 : activeSeason?.episodes[0]?.episode ?? 1,
                },
              })
            }
          />
        </View>

        {data.genres.length > 0 ? (
          <View style={{flexDirection: 'row', flexWrap: 'wrap', marginTop: s.md}}>
            {data.genres.slice(0, 4).map(g => (
              <Chip key={g} label={g} />
            ))}
          </View>
        ) : null}

        {data.description ? (
          <Text style={[t.bodyMd, {color: c.muted, marginTop: s.md}]}>{data.description}</Text>
        ) : null}

        {!isMovie && data.seasons.length > 0 ? (
          <View style={{marginTop: s.lg}}>
            <ReelLabel>Episodes</ReelLabel>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginTop: s.sm}}>
              {data.seasons.map(se => (
                <Chip
                  key={se.season}
                  label={`Season ${se.season}`}
                  active={activeSeason?.season === se.season}
                  onPress={() => setSeason(se.season)}
                />
              ))}
            </ScrollView>

            <View style={{marginTop: s.sm}}>
              {activeSeason?.episodes.map(ep => {
                const p = progress[`${data.subjectId}|${ep.season}|${ep.episode}`];
                const ratio = p && p.durationMs > 0 ? p.positionMs / p.durationMs : 0;
                return (
                  <Pressable
                    key={ep.id}
                    onPress={() => openPlayer(ep.season, ep.episode, p?.positionMs ?? 0)}
                    accessibilityLabel={`Episode ${ep.episode}`}
                    style={({pressed}) => [
                      styles.episodeRow,
                      {borderBottomColor: c.hairline, opacity: pressed ? 0.7 : 1},
                    ]}>
                    <Text style={[t.titleSm, {color: c.muted, width: 34}]}>
                      {String(ep.episode).padStart(2, '0')}
                    </Text>
                    <View style={{flex: 1}}>
                      <Text style={[t.bodyMd, {color: c.ivory}]}>Episode {ep.episode}</Text>
                      {ratio > 0.01 ? (
                        <View style={{marginTop: 6}}>
                          <ProgressBar ratio={ratio} />
                        </View>
                      ) : null}
                    </View>
                    <Icon name="play" size={16} color={c.faint} />
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {data.subtitles.length > 0 ? (
          <Text style={[t.micro, {color: c.faint, marginTop: s.lg}]}>
            Subtitles: {data.subtitles.slice(0, 6).join(', ')}
          </Text>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  episodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
