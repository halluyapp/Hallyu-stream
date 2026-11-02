/** About — full brand lockup with Hangul, honest disclaimer (§6.1.18, Appendix A). */
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import Constants from 'expo-constants';
import { colors, fonts, layout, radius, type } from '@/theme/tokens';

export default function AboutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const version = Constants.expoConfig?.version ?? '0.1.0';

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ padding: layout.marginMobile, paddingTop: insets.top + 12, gap: 16 }}>
        <View style={styles.backRow}>
          <View style={{ height: 48, justifyContent: 'center' }}>
            <Text onPress={() => router.back()} style={styles.back} accessibilityRole="button" accessibilityLabel="Back">
              <ChevronLeft size={24} color={colors.textPrimary} strokeWidth={2} />
            </Text>
          </View>
        </View>

        <View style={styles.lockup}>
          <Text style={styles.wordmark}>HALLYU-STREAM</Text>
          <View style={styles.brandRule} />
          <Text style={styles.hangul}>한류 스트림</Text>
        </View>

        <Text style={styles.meta}>Version {version}</Text>

        <Text style={styles.body}>
          An independent streaming experience for film and television. Not affiliated with, endorsed by, or connected
          to Moviebox.
        </Text>

        <Text style={styles.body}>
          Catalogue and stream information are provided by a public metadata service. Video plays directly from the
          media provider to your device. Camera access would be used only to scan TV pairing codes; storage only to
          keep downloads.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgObsidian,
  },
  backRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginHorizontal: -12,
  },
  back: {
    width: layout.touchMin,
    height: layout.touchMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockup: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  wordmark: {
    fontFamily: fonts.display,
    fontSize: 24,
    letterSpacing: 0.04 * 24,
    color: colors.textPrimary,
  },
  brandRule: {
    width: 88,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.accentCopper,
  },
  hangul: {
    fontFamily: fonts.uiMedium,
    fontSize: 9,
    letterSpacing: 0.3 * 9,
    color: 'rgba(244, 239, 231, 0.6)',
  },
  meta: {
    ...type.meta,
    color: colors.textMuted,
    textAlign: 'center',
  },
  body: {
    ...type.body,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
  },
});
