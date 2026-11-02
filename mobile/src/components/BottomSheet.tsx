/** BottomSheet — radius.lg top, surface body, glass grabber strip (§11.6). */
import React, { useEffect } from 'react';
import { Easing, StyleSheet, Text, View } from 'react-native';
import Reanimated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, layout, radius, type } from '@/theme/tokens';

export function BottomSheet({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  const slide = useSharedValue(1);
  const veil = useSharedValue(0);

  useEffect(() => {
    slide.value = withTiming(visible ? 0 : 1, { duration: 240, easing: Easing.out(Easing.cubic) });
    veil.value = withTiming(visible ? 1 : 0, { duration: 240 });
  }, [visible, slide, veil]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slide.value * 600 }],
  }));
  const veilStyle = useAnimatedStyle(() => ({ opacity: veil.value }));

  if (!visible) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Pressable onPress={onClose} style={StyleSheet.absoluteFill} accessibilityLabel="Close">
        <Reanimated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bgVeil }, veilStyle]} />
      </Pressable>
      <Reanimated.View style={[styles.sheet, sheetStyle]}>
        <View style={styles.grabberStrip}>
          <View style={styles.grabber} />
        </View>
        {title ? <Text style={styles.title}>{title}</Text> : null}
        {children}
      </Reanimated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '85%',
    backgroundColor: colors.bgSurface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
  },
  grabberStrip: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: colors.bgGlass,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.textFaint,
  },
  title: {
    ...type.h1,
    color: colors.textPrimary,
    paddingHorizontal: layout.marginMobile,
    paddingTop: 16,
    paddingBottom: 4,
  },
});
