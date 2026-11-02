/** §15.3 — Typographic fallback tile for missing artwork: a title card, not a grey box. */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, type } from '@/theme/tokens';

export function FallbackTile({ title, height, width }: { title: string; height: number; width: number }) {
  const initials = title
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
  return (
    <View style={[styles.tile, { height, width, borderRadius: radius.sm }]}>
      <Text style={styles.watermark}>{initials || 'H'}</Text>
      <Text style={styles.title} numberOfLines={3}>
        {title}
      </Text>
      <View style={styles.rule} />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  watermark: {
    position: 'absolute',
    fontFamily: fonts.display,
    fontSize: Math.min(96, 48),
    color: 'rgba(244, 239, 231, 0.08)',
  },
  title: {
    ...type.displayL,
    fontSize: 18,
    lineHeight: 22,
    fontFamily: fonts.display,
    color: colors.textPrimary,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  rule: {
    width: 24,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.accentCopper,
    marginTop: 10,
  },
});
