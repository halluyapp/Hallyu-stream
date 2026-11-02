import React, {useCallback, useRef, useState} from 'react';
import {Animated, Pressable, StyleSheet, View, ViewStyle} from 'react-native';
import {C, D, R, useTheme} from '../theme';

/**
 * TV focus.
 *
 * The ring is 3dp of copper, the card lifts 4% and gains elevation. Focus is never
 * signalled by colour alone: the ring is geometry, so it survives a colour-blind
 * viewer and a washed-out panel.
 */
export function Focusable({
  children,
  onPress,
  onLongPress,
  style,
  hasTVPreferredFocus,
  disabled,
  accessibilityLabel,
  ringInset = -4,
  scaleTo = 1.04,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: ViewStyle | ViewStyle[];
  hasTVPreferredFocus?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  ringInset?: number;
  scaleTo?: number;
}) {
  const {c, device} = useTheme();
  const [focused, setFocused] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  const onFocus = useCallback(() => {
    setFocused(true);
    Animated.timing(scale, {
      toValue: scaleTo,
      duration: D.quick,
      useNativeDriver: true,
    }).start();
  }, [scale, scaleTo]);

  const onBlur = useCallback(() => {
    setFocused(false);
    Animated.timing(scale, {toValue: 1, duration: D.instant, useNativeDriver: true}).start();
  }, [scale]);

  return (
    <Animated.View
      style={[
        {transform: [{scale}]},
        focused ? {elevation: 8, zIndex: 4} : null,
        style as any,
      ]}>
      <Pressable
        accessible
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{disabled: !!disabled, selected: focused}}
        disabled={disabled}
        hasTVPreferredFocus={hasTVPreferredFocus}
        onFocus={onFocus}
        onBlur={onBlur}
        onPress={onPress}
        onLongPress={onLongPress}
        focusable={!disabled}
        style={StyleSheet.absoluteFillObject as any}>
        <View style={StyleSheet.absoluteFill} />
      </Pressable>
      {children}
      {focused && device.isTv ? (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            {
              borderWidth: 3,
              borderColor: c.copper,
              borderRadius: R.md,
              margin: ringInset,
            },
          ]}
        />
      ) : null}
    </Animated.View>
  );
}

/**
 * A focusable that wraps arbitrary content and keeps the pressable above it.
 * Use this for posters, rail items and episode cells.
 */
export function FocusRing({
  children,
  focused,
  radius = R.sm,
}: {
  children: React.ReactNode;
  focused: boolean;
  radius?: number;
}) {
  const {c} = useTheme();
  if (!focused) {
    return <>{children}</>;
  }
  return (
    <View>
      {children}
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          {borderWidth: 3, borderColor: c.copper, borderRadius: radius, margin: -3},
        ]}
      />
    </View>
  );
}

export const TV = {C, D, R};
