/** ContinueCard — landscape 16:9 still with a copper progress hairline (§11.3). */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { colors, layout, radius, type } from '@/theme/tokens';
import { FallbackTile } from './FallbackTile';

export function ContinueCard({
  title,
  meta,
  cover,
  progress,
  width = layout.continueCardWidth,
  onPress,
  accessibilityLabel,
}: {
  title: string;
  meta?: string | null;
  cover: string | null;
  /** 0–1 */
  progress: number;
  width?: number;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  const height = Math.round(width * layout.landscapeRatio);
  const [failed, setFailed] = React.useState(false);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.wrap, { width }, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? `Resume ${title}${meta ? `, ${meta}` : ''}`}
    >
      <View style={[styles.frame, { height }]}>
        {cover && !failed ? (
          <Image
            source={{ uri: cover }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            recyclingKey={cover}
            onError={() => setFailed(true)}
          />
        ) : (
          <FallbackTile title={title} height={height} width={width} />
        )}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.min(100, Math.max(2, progress * 100))}%` }]} />
        </View>
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {meta ? (
        <Text style={styles.meta} numberOfLines={1}>
          {meta}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  frame: {
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.bgElevated,
  },
  progressTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 3,
    backgroundColor: 'rgba(10, 11, 13, 0.55)',
  },
  progressFill: {
    height: 3,
    backgroundColor: colors.accentCopper,
  },
  title: {
    ...type.meta,
    color: colors.textPrimary,
  },
  meta: {
    ...type.micro,
    color: colors.textMuted,
  },
});
