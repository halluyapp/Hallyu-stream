import React, {useState} from 'react';
import {Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useApp} from '../../state/store';
import {useTheme} from '../../theme';
import {Chip, Hairline, Icon, ReelLabel} from '../../components/ui';
import {DEFAULT_PAIRING_BASE} from '../../api/pairing';

const QUALITIES = ['auto', '360p', '480p', '720p', '1080p'] as const;
const LANGS = ['en', 'ko', 'tl', 'zh', 'es'];

export default function SettingsScreen({navigation}: any) {
  const {c, t, s, device} = useTheme();
  const insets = useSafeAreaInsets();
  const {settings, updateSettings, resetAll, deviceToken, showToast, library, downloads} = useApp();
  const [confirmReset, setConfirmReset] = useState(false);

  const Row = ({
    label,
    detail,
    right,
    onPress,
  }: {
    label: string;
    detail?: string;
    right?: React.ReactNode;
    onPress?: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({pressed}) => [styles.row, {opacity: pressed ? 0.7 : 1}]}>
      <View style={{flex: 1, paddingRight: s.md}}>
        <Text style={[t.bodyMd, {color: c.ivory}]}>{label}</Text>
        {detail ? <Text style={[t.micro, {color: c.faint, marginTop: 2}]}>{detail}</Text> : null}
      </View>
      {right}
    </Pressable>
  );

  return (
    <ScrollView
      style={{flex: 1, backgroundColor: c.obsidian}}
      contentContainerStyle={{paddingTop: insets.top + s.sm, paddingBottom: s.xxl}}>
      <View style={{paddingHorizontal: s.gutter}}>
        <Text style={[t.displayMd, {color: c.ivory}]}>Settings</Text>
        <Text style={[t.bodySm, {color: c.muted, marginTop: 2}]}>
          {device.isTv ? 'Television' : 'Mobile'} · {device.width}×{device.height}dp
        </Text>
      </View>

      <View style={{marginTop: s.lg, paddingHorizontal: s.gutter}}>
        <ReelLabel>Playback</ReelLabel>
      </View>

      <View style={{paddingHorizontal: s.gutter}}>
        <Row
          label="Autoplay next episode"
          detail="Start the next episode when one ends"
          right={
            <Switch
              value={settings.autoplayNext}
              onValueChange={v => updateSettings({autoplayNext: v})}
              trackColor={{true: c.copperDeep, false: c.elevated}}
              thumbColor={settings.autoplayNext ? c.copper : c.faint}
            />
          }
        />
        <Hairline />
        <Row
          label="Preferred quality"
          detail={settings.preferredQuality === 'auto' ? 'Auto — starts modest, adapts on seek' : settings.preferredQuality}
        />
        <View style={{flexDirection: 'row', flexWrap: 'wrap', paddingBottom: s.sm}}>
          {QUALITIES.map(q => (
            <Chip
              key={q}
              label={q === 'auto' ? 'Auto' : q}
              active={settings.preferredQuality === q}
              onPress={() => updateSettings({preferredQuality: q})}
            />
          ))}
        </View>
        <Hairline />
        <Row
          label="Subtitles"
          detail="Burn-in is not supported; captions are fetched per episode"
          right={
            <Switch
              value={settings.subtitlesOn}
              onValueChange={v => updateSettings({subtitlesOn: v})}
              trackColor={{true: c.copperDeep, false: c.elevated}}
              thumbColor={settings.subtitlesOn ? c.copper : c.faint}
            />
          }
        />
        <View style={{flexDirection: 'row', flexWrap: 'wrap', paddingVertical: s.sm}}>
          {LANGS.map(l => (
            <Chip
              key={l}
              label={l.toUpperCase()}
              active={settings.subtitleLanguage === l}
              onPress={() => updateSettings({subtitleLanguage: l})}
            />
          ))}
        </View>
        <Hairline />
      </View>

      <View style={{marginTop: s.lg, paddingHorizontal: s.gutter}}>
        <ReelLabel>Devices</ReelLabel>
      </View>
      <View style={{paddingHorizontal: s.gutter}}>
        <Row
          label="Pair a television"
          detail="Show a code, or scan the one on your TV"
          right={<Icon name="forward" size={18} color={c.faint} />}
          onPress={() => navigation.navigate('PairingHub')}
        />
        <Hairline />
        <Row
          label="Paired devices"
          detail={deviceToken ? 'This phone is signed in to the pairing service' : 'Not signed in yet'}
          right={<Icon name="forward" size={18} color={c.faint} />}
          onPress={() => navigation.navigate('Devices')}
        />
        <Hairline />
        <Row
          label="Pairing service"
          detail={settings.pairingBaseUrl || DEFAULT_PAIRING_BASE}
          right={<Icon name="info" size={18} color={c.faint} />}
          onPress={() =>
            Alert.alert(
              'Pairing service',
              'Set the signalling service address in your build (PAIRING_BASE_URL) or edit it below in a future build. The service never carries video.',
              [{text: 'Understood'}],
            )
          }
        />
        <Hairline />
      </View>

      <View style={{marginTop: s.lg, paddingHorizontal: s.gutter}}>
        <ReelLabel>Appearance & data</ReelLabel>
      </View>
      <View style={{paddingHorizontal: s.gutter}}>
        <Row
          label="Reduce visual effects"
          detail="Turns off glass and parallax on low-power hardware"
          right={
            <Switch
              value={settings.reduceEffects}
              onValueChange={v => updateSettings({reduceEffects: v})}
              trackColor={{true: c.copperDeep, false: c.elevated}}
              thumbColor={settings.reduceEffects ? c.copper : c.faint}
            />
          }
        />
        <Hairline />
        <Row
          label="Offline queue"
          detail={`${downloads.length} items prepared`}
          right={<Icon name="forward" size={18} color={c.faint} />}
          onPress={() => navigation.navigate('Downloads')}
        />
        <Hairline />
        <Row label="Saved titles" detail={`${library.length} titles`} />
        <Hairline />
      </View>

      <View style={{marginTop: s.lg, paddingHorizontal: s.gutter}}>
        <ReelLabel>About</ReelLabel>
      </View>
      <View style={{paddingHorizontal: s.gutter}}>
        <Row label="HALLYU-STREAM" detail="Version 1.0.0 · NOCTURNE design system" />
        <Hairline />
        <Row
          label="Playback architecture"
          detail="Media streams directly from the CDN to this device. No proxy, no transcoding."
        />
        <Hairline />
        <Pressable
          onPress={() => {
            if (!confirmReset) {
              setConfirmReset(true);
              showToast('Tap again to erase local data');
              return;
            }
            resetAll().then(() => {
              setConfirmReset(false);
              showToast('Local data erased');
            });
          }}
          style={({pressed}) => [styles.row, {opacity: pressed ? 0.7 : 1}]}>
          <Text style={[t.bodyMd, {color: c.error}]}>
            {confirmReset ? 'Tap again to confirm' : 'Erase local data'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center', paddingVertical: 14, minHeight: 52},
});
