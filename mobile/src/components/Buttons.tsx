/** PrimaryButton (copper CTA) and SecondaryButton (hairline ghost) — §11.5. */
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, radius, type } from '@/theme/tokens';

export function PrimaryButton({
  label,
  icon,
  onPress,
  disabled,
  loading,
  style,
}: {
  label: string;
  icon?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.primary,
        (disabled || loading) && styles.primaryDisabled,
        pressed && !disabled && styles.primaryPressed,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {loading ? (
        <ActivityIndicator color={colors.textOnAccent} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[styles.primaryLabel, !!disabled && { color: colors.textFaint }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

export function SecondaryButton({
  label,
  icon,
  onPress,
  style,
}: {
  label: string;
  icon?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.secondary, pressed && styles.secondaryPressed, style]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {icon}
      <Text style={styles.secondaryLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  primary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    paddingHorizontal: 20,
    borderRadius: radius.sm,
    backgroundColor: colors.accentCopper,
  },
  primaryPressed: {
    backgroundColor: colors.accentCopperDeep,
    transform: [{ scale: 0.98 }],
  },
  primaryDisabled: {
    backgroundColor: colors.bgElevated,
  },
  primaryLabel: {
    ...type.button,
    color: colors.textOnAccent,
  },
  secondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    paddingHorizontal: 20,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.hairline,
    backgroundColor: 'transparent',
  },
  secondaryPressed: {
    backgroundColor: colors.bgVeil,
  },
  secondaryLabel: {
    ...type.button,
    color: colors.textPrimary,
  },
});
