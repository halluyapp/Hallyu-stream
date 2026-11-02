/** Shelf — ReelLabel header + horizontal snap row (§11.4). */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { layout } from '@/theme/tokens';
import { ReelLabel } from './ReelLabel';

export function Shelf({
  label,
  children,
  trailing,
}: {
  label: string;
  children: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <View style={styles.shelf}>
      <View style={{ paddingHorizontal: layout.marginMobile }}>
        <ReelLabel label={label} trailing={trailing} />
      </View>
      <View style={styles.row}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  shelf: {
    gap: 12,
    marginBottom: layout.gapShelfStack,
  },
  row: {
    flexDirection: 'row',
    gap: layout.gapShelf,
    paddingHorizontal: layout.marginMobile,
  },
});
