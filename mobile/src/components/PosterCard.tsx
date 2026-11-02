/** PosterCard — 2:3 frame, radius.sm, typographic fallback art. */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { colors, layout, radius, type } from '@/theme/tokens';
import { FallbackTile } from './FallbackTile';

export function PosterCard({
  title,
  cover,
  year,
  width = layout.posterShelfWidth,
  onPress,
  onLongPress,
  showTitle = true,
}: {
  title: string;
  cover: string | null;
  year?: number | null;
  width?: number;
  onPress?: () => void;
  onLongPress?: () => void;
  showTitle?: boolean;
}) {
  const height = Math.round(width * 1.5);
  const [failed, setFailed] = React.useState(false);
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      android_ripple={{ color: colors.bgVeil, borderless: false }}
      style={({ pressed }) => [styles.wrap, { width }, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${title}${year ? `, ${year}` : ''}. Opens details.`}
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
      </View>
      {showTitle ? (
        <>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {year ? <Text style={styles.meta}>{year}</Text> : null}
        </>
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
  title: {
    ...type.meta,
    color: colors.textPrimary,
  },
  meta: {
    ...type.micro,
    color: colors.textFaint,
  },
});
