/** Splash — brand moment: wordmark + copper brand rule + Hangul, one light sweep (§6.1.1). */
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { colors, fonts } from '@/theme/tokens';
import { getSetting } from '@/lib/db';

export default function Splash() {
  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Single light sweep across the wordmark, 800ms, once — the projector lamp.
    Animated.timing(sweep, {
      toValue: 1,
      duration: 800,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(async () => {
      let seen: string | null = null;
      try {
        seen = await getSetting('onboardingDone');
      } catch {
        seen = null;
      }
      router.replace(seen === 'yes' ? '/(tabs)/home' : '/onboarding');
    }, 1400);
    return () => clearTimeout(timer);
  }, [sweep]);

  const sweepTranslate = sweep.interpolate({ inputRange: [0, 1], outputRange: [-160, 160] });

  return (
    <View style={styles.screen}>
      <View style={styles.wordmarkWrap} accessibilityRole="header">
        <View>
          <Text style={styles.wordmark}>HALLYU-STREAM</Text>
          <Animated.View
            style={[
              styles.sweep,
              { transform: [{ translateX: sweepTranslate }] },
            ]}
          />
        </View>
        <View style={styles.brandRule} />
        <Text style={styles.hangul}>한류 스트림</Text>
      </View>
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
  wordmarkWrap: {
    alignItems: 'center',
  },
  wordmark: {
    fontFamily: fonts.display,
    fontSize: 28,
    letterSpacing: 0.04 * 28,
    color: colors.textPrimary,
  },
  brandRule: {
    width: 96,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.accentCopper,
    marginTop: 6,
  },
  sweep: {
    position: 'absolute',
    top: -8,
    bottom: -8,
    width: 60,
    backgroundColor: 'rgba(244, 239, 231, 0.10)',
    transform: [{ skewX: '-12deg' }],
  },
  hangul: {
    fontFamily: fonts.uiMedium,
    fontSize: 9,
    letterSpacing: 0.3 * 9,
    color: 'rgba(244, 239, 231, 0.6)',
    marginTop: 14,
  },
});
