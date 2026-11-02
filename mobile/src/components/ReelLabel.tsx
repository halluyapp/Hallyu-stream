/** S4 — Reel labels: small letterspaced caps with a hairline rule to the edge. */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, type } from '@/theme/tokens';

export function ReelLabel({ label, trailing }: { label: string; trailing?: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{letterspace(label.toUpperCase())}</Text>
      <View style={styles.rule} />
      {trailing}
    </View>
  );
}

function letterspace(text: string): string {
  return text.split('').join(' ');
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  label: {
    ...type.label,
    color: colors.textMuted,
  },
  rule: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.hairline,
  },
});
