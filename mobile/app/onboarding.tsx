/** Onboarding — ≤3 skippable cards, brand moments (§6.1.2). */
import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { setSetting } from '@/lib/db';
import { colors, fonts, type } from '@/theme/tokens';
import { PrimaryButton } from '@/components/Buttons';

const CARDS = [
  { line: 'The lights go down.', body: 'A cinema built for your phone and your TV.' },
  { line: 'Every title, lit like art.', body: 'Browse, save, and pick up where you left off.' },
  { line: 'Your phone meets your TV.', body: 'Pair once with a code. Watch anywhere.' },
];

export default function Onboarding() {
  const [page, setPage] = useState(0);
  const { width } = useWindowDimensions();

  React.useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => undefined);
    return () => {
      ScreenOrientation.unlockAsync().catch(() => undefined);
    };
  }, []);

  const enter = async () => {
    try {
      await setSetting('onboardingDone', 'yes');
    } catch {
      // Non-fatal: worst case onboarding replays next launch.
    }
    router.replace('/(tabs)/home');
  };

  return (
    <View style={styles.screen}>
      <Pressable onPress={enter} style={styles.skip} accessibilityRole="button" accessibilityLabel="Skip">
        <Text style={styles.skipText}>Skip</Text>
      </Pressable>

      <View style={styles.cardZone}>
        {CARDS.map((card, i) => (
          <View key={card.line} style={[styles.card, { width: width * 0.86, transform: [{ translateX: (i - page) * width * 0.9 }], opacity: i === page ? 1 : 0.25 }]} pointerEvents={i === page ? 'auto' : 'none'}>
            <View style={styles.art}>
              <Text style={styles.artGlyph}>{['◦', '◇', '▣'][i] ?? '◦'}</Text>
            </View>
            <Text style={styles.headline}>{card.line}</Text>
            <Text style={styles.body}>{card.body}</Text>
          </View>
        ))}
      </View>

      <View style={styles.dotsRow}>
        {CARDS.map((c, i) => (
          <View key={c.line} style={[styles.dot, i === page && styles.dotActive]} />
        ))}
      </View>

      <PrimaryButton
        label={page === CARDS.length - 1 ? 'Enter' : 'Continue'}
        onPress={() => (page === CARDS.length - 1 ? enter() : setPage(page + 1))}
        style={{ alignSelf: 'stretch', marginHorizontal: 32, marginBottom: 24 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgObsidian,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skip: {
    position: 'absolute',
    top: 56,
    right: 24,
    padding: 12,
  },
  skipText: {
    ...type.button,
    color: colors.textMuted,
  },
  cardZone: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  card: {
    position: 'absolute',
    alignItems: 'center',
  },
  art: {
    width: 220,
    height: 140,
    borderRadius: 16,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
  },
  artGlyph: {
    fontFamily: fonts.display,
    fontSize: 48,
    color: colors.accentCopper,
  },
  headline: {
    fontFamily: fonts.display,
    fontSize: 30,
    lineHeight: 36,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  body: {
    ...type.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 24,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 32,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textFaint,
  },
  dotActive: {
    backgroundColor: colors.accentCopper,
    width: 18,
  },
});
