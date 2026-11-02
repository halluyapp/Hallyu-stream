/** Settings — quiet administration, grouped rows (§6.1.17). */
import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight } from 'lucide-react-native';
import { colors, layout, type } from '@/theme/tokens';
import { useLibrary } from '@/lib/store';

export default function SettingsScreen() {
  const library = useLibrary();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: layout.marginMobile, paddingBottom: layout.navHeight + 48 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { marginTop: insets.top + 16 }]}>Settings</Text>

        <Group label="P L A Y B A C K">
          <Row label="Default quality" value={library.settings.defaultQuality === 'auto' ? 'Auto (recommended)' : library.settings.defaultQuality} />
          <Row
            label="Autoplay next episode"
            toggle
            toggleValue={library.settings.autoplayNext}
            onToggle={(v) => void library.setSetting('autoplayNext', v ? 'on' : 'off')}
          />
        </Group>

        <Group label="D O W N L O A D S">
          <Row label="Downloads" value="Coming in a later phase" />
        </Group>

        <Group label="D E V I C E S">
          <Row label="Connect to TV" value="Coming in a later phase" />
        </Group>

        <Group label="A P P">
          <Row
            label="Reduce motion"
            toggle
            toggleValue={library.settings.reduceMotion === true}
            onToggle={(v) => void library.setSetting('reduceMotion', v ? 'on' : 'off')}
          />
          <Row
            label="Clear search history"
            destructive
            onPress={() =>
              Alert.alert('Clear search history?', 'Recent searches on this device will be removed.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Clear', style: 'destructive', onPress: () => void library.clearSearchHistory() },
              ])
            }
          />
          <Row label="About" value="" chevron onPress={() => router.push('/about')} />
        </Group>

        <Text style={styles.footnote}>
          An independent streaming experience. Not affiliated with, endorsed by, or connected to Moviebox.
        </Text>
      </ScrollView>
    </View>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupLabel}>{label}</Text>
      <View style={styles.groupBody}>{children}</View>
    </View>
  );
}

function Row({
  label,
  value,
  chevron,
  destructive,
  toggle,
  toggleValue,
  onToggle,
  onPress,
}: {
  label: string;
  value?: string;
  chevron?: boolean;
  destructive?: boolean;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (v: boolean) => void;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.row} disabled={toggle && !onPress} accessibilityRole={toggle ? 'switch' : 'button'}>
      <Text style={[styles.rowLabel, destructive && { color: colors.stateError }]}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
        {toggle ? <Switch value={!!toggleValue} onValueChange={onToggle} trackColor={{ true: colors.accentCopper, false: colors.bgElevated }} thumbColor={colors.textPrimary} /> : null}
        {chevron ? <ChevronRight size={18} color={colors.textFaint} strokeWidth={1.75} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgObsidian,
  },
  title: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 28,
    color: colors.textPrimary,
    marginBottom: 24,
  },
  group: {
    marginBottom: 28,
    gap: 10,
  },
  groupLabel: {
    ...type.label,
    letterSpacing: 1.7,
    color: colors.textMuted,
  },
  groupBody: {
    backgroundColor: colors.bgSurface,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: layout.touchMin,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  rowLabel: {
    ...type.body,
    color: colors.textPrimary,
  },
  rowValue: {
    ...type.meta,
    color: colors.textMuted,
  },
  footnote: {
    ...type.meta,
    color: colors.textFaint,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
});
