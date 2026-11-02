/** Universal state templates — EmptyState, ErrorState, skeletons (§15). */
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, layout, radius, type } from '@/theme/tokens';
import { PrimaryButton } from './Buttons';

export function EmptyState({
  line,
  body,
  actionLabel,
  onAction,
}: {
  line: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.center} accessibilityLiveRegion="polite">
      <Text style={styles.serifLine}>{line}</Text>
      <Text style={styles.bodyText}>{body}</Text>
      {actionLabel && onAction ? (
        <PrimaryButton label={actionLabel} onPress={onAction} style={{ marginTop: 24 }} />
      ) : null}
    </View>
  );
}

export function ErrorState({
  line = 'The screen is quiet.',
  body,
  onRetry,
}: {
  line?: string;
  body: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.center} accessibilityLiveRegion="assertive">
      <View style={styles.errorGlyph}>
        <Text style={styles.errorMark}>!</Text>
      </View>
      <Text style={styles.serifLine}>{line}</Text>
      <Text style={styles.bodyText}>{body}</Text>
      {onRetry ? <PrimaryButton label="Try again" onPress={onRetry} style={{ marginTop: 24 }} /> : null}
    </View>
  );
}

/** SkeletonBlock — shimmer once, then hold (mobile). */
export function SkeletonBlock({ width, height, radius: r = radius.sm, style }: { width: number | `${number}%`; height: number; radius?: number; style?: object }) {
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(shimmer, {
      toValue: 1,
      duration: 900,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [shimmer]);
  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.9] });
  return (
    <Animated.View
      style={[{ width, height, borderRadius: r, backgroundColor: colors.bgElevated, opacity }, style]}
    />
  );
}

export function SkeletonShelf({ posterWidth = layout.posterShelfWidth }: { posterWidth?: number }) {
  return (
    <View style={{ marginBottom: layout.gapShelfStack, gap: 12, paddingHorizontal: layout.marginMobile }}>
      <SkeletonBlock width="40%" height={14} radius={4} />
      <View style={{ flexDirection: 'row', gap: layout.gapShelf }}>
        {[0, 1, 2].map((i) => (
          <SkeletonBlock key={i} width={posterWidth} height={Math.round(posterWidth * 1.5)} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: layout.marginMobile * 2,
    gap: 10,
  },
  serifLine: {
    fontFamily: fonts.display,
    fontSize: 26,
    lineHeight: 32,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  bodyText: {
    ...type.body,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 300,
  },
  errorGlyph: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    borderWidth: 1.75,
    borderColor: colors.stateError,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  errorMark: {
    ...type.h2,
    color: colors.stateError,
  },
});
