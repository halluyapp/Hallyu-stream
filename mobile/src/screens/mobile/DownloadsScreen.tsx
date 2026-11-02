import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {api, selectSource} from '../../api/provider';
import {useApp} from '../../state/store';
import {useTheme} from '../../theme';
import {Button, EmptyState, Hairline, Icon, ProgressBar, ReelLabel} from '../../components/ui';
import {humanBytes} from '../../core/platform';

export default function DownloadsScreen({route, navigation}: any) {
  const {c, t, s, r, device} = useTheme();
  const insets = useSafeAreaInsets();
  const {downloads, setDownload, removeDownload, settings, showToast} = useApp();
  const [busy, setBusy] = useState(false);
  const request = route.params?.request;

  /**
   * Resolve the stream on device, pick a source, and record it in the offline queue.
   * The bytes still come from the CDN — this app never proxies media — so an entry
   * carries the resolved URL and its expiry behaviour is handled by the player.
   */
  const prepare = useCallback(async () => {
    if (!request) {
      return;
    }
    setBusy(true);
    try {
      const info = await api.stream({
        subjectId: request.subjectId,
        detailPath: request.detailPath,
        season: request.season,
        episode: request.episode,
      });
      const source = selectSource(info, {preferred: settings.preferredQuality, isTv: device.isTv, fallbackToAny: true});
      if (!source) {
        showToast('No downloadable source for this episode.');
        return;
      }
      setDownload({
        id: `${request.subjectId}|${request.season}|${request.episode}|${source.quality}`,
        subjectId: request.subjectId,
        detailPath: request.detailPath,
        title: request.title,
        poster: request.poster,
        season: request.season,
        episode: request.episode,
        quality: source.quality,
        url: source.url,
        status: 'ready',
        bytes: source.sizeBytes,
        createdAt: Date.now(),
      });
      showToast(`${source.quality} copy queued`);
    } catch (e: any) {
      showToast(e?.message ?? 'Could not prepare this episode.');
    } finally {
      setBusy(false);
    }
  }, [request, settings.preferredQuality, device.isTv, setDownload, showToast]);

  useEffect(() => {
    if (request) {
      void prepare();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ScrollView
      style={{flex: 1, backgroundColor: c.obsidian}}
      contentContainerStyle={{paddingTop: insets.top + s.sm, paddingBottom: s.xxl}}>
      <View style={{flexDirection: 'row', alignItems: 'center', paddingHorizontal: s.gutter}}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} accessibilityLabel="Go back">
          <Icon name="back" size={22} color={c.ivory} />
        </Pressable>
        <Text style={[t.displayMd, {color: c.ivory, marginLeft: s.sm}]}>Downloads</Text>
      </View>

      {busy ? (
        <View style={{flexDirection: 'row', alignItems: 'center', padding: s.gutter}}>
          <ActivityIndicator color={c.copper} />
          <Text style={[t.bodySm, {color: c.muted, marginLeft: s.sm}]}>Resolving the best source…</Text>
        </View>
      ) : null}

      <View style={{paddingHorizontal: s.gutter, marginTop: s.md}}>
        <Text style={[t.micro, {color: c.faint}]}>
          Sources are resolved on this device. Playback streams from the CDN with the provider's
          signed URL; expired links are re-resolved automatically when you press play.
        </Text>
      </View>

      <View style={{paddingHorizontal: s.gutter, marginTop: s.lg}}>
        <ReelLabel>Offline queue</ReelLabel>
      </View>

      {downloads.length === 0 ? (
        <EmptyState
          icon="download"
          headline="Nothing queued"
          body="Open a title and tap Download to prepare a copy for this device."
          actionLabel="Browse"
          onAction={() => navigation.navigate('Tabs')}
        />
      ) : (
        <View style={{paddingHorizontal: s.gutter, marginTop: s.sm}}>
          {downloads.map(d => (
            <View key={d.id}>
              <View style={styles.row}>
                <View style={{flex: 1}}>
                  <Text numberOfLines={1} style={[t.titleSm, {color: c.ivory}]}>
                    {d.title}
                  </Text>
                  <Text style={[t.micro, {color: c.muted, marginTop: 2}]}>
                    {d.season > 0 ? `S${d.season} E${d.episode} · ` : ''}
                    {d.quality} · {humanBytes(d.bytes)}
                  </Text>
                  <View style={{marginTop: 8, width: 140}}>
                    <ProgressBar ratio={d.status === 'ready' ? 1 : 0.4} />
                  </View>
                </View>
                <Pressable
                  onPress={() =>
                    navigation.navigate('Player', {
                      subjectId: d.subjectId,
                      detailPath: d.detailPath,
                      title: d.title,
                      season: d.season,
                      episode: d.episode,
                      poster: d.poster,
                    })
                  }
                  hitSlop={10}
                  accessibilityLabel={`Play ${d.title}`}
                  style={{padding: s.xs}}>
                  <Icon name="play" size={20} color={c.copper} />
                </Pressable>
                <Pressable
                  onPress={() => {
                    removeDownload(d.id);
                    showToast('Removed from queue');
                  }}
                  hitSlop={10}
                  accessibilityLabel={`Remove ${d.title}`}
                  style={{padding: s.xs, marginLeft: s.xs}}>
                  <Icon name="trash" size={18} color={c.faint} />
                </Pressable>
              </View>
              <Hairline />
            </View>
          ))}
        </View>
      )}

      {request ? (
        <View style={{paddingHorizontal: s.gutter, marginTop: s.lg}}>
          <Button label="Prepare another quality" variant="secondary" icon="refresh" onPress={prepare} />
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center', paddingVertical: 14},
});
