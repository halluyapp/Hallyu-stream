import { StyleSheet, type TextStyle, type ViewStyle } from 'react-native';
import { color, font, radius, space, typography } from '@hallyu/shared';

export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg.obsidian },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  wrap: { flexWrap: 'wrap' },
  fill: { ...StyleSheet.absoluteFillObject },
  content: { paddingHorizontal: space[5], paddingVertical: space[4] },
  surface: { backgroundColor: color.bg.surface, borderRadius: radius.md },
  elevated: { backgroundColor: color.bg.elevated, borderRadius: radius.md },
  hairline: { borderWidth: 1, borderColor: color.hairline },
  poster: { borderRadius: radius.sm, backgroundColor: color.bg.elevated, overflow: 'hidden' },
  landscape: { borderRadius: radius.sm, backgroundColor: color.bg.elevated, overflow: 'hidden' },
  glass: {
    backgroundColor: color.bg.glass,
    borderTopWidth: 1,
    borderTopColor: color.hairline,
    borderRadius: radius.md,
  },
  glassOpaque: {
    backgroundColor: color.bg.elevated,
    borderWidth: 1,
    borderColor: color.hairline,
    borderRadius: radius.md,
  },
  copperFill: { backgroundColor: color.accent.copper },
  copperTint: { backgroundColor: color.accent.copperTint, borderColor: color.accent.copper },
  button: {
    minHeight: 52,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: space[5],
  },
  buttonTv: { minHeight: 60, paddingHorizontal: space[6] },
  secondary: { borderWidth: 1.5, borderColor: color.hairline },
  iconBox: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  chip: {
    minHeight: 36,
    paddingHorizontal: space[4],
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeleton: { backgroundColor: color.bg.elevated, borderRadius: radius.xs },
  progressTrack: { height: 3, backgroundColor: color.bg.elevated, borderRadius: radius.pill, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: color.state.progress },
  divider: { height: 1, backgroundColor: color.hairline },
  focusable: { borderRadius: radius.sm },
  focusRing: {
    borderWidth: 3,
    borderColor: color.accent.copper,
    borderRadius: radius.sm,
  },
  shadow1: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 2,
  },
  shadow2: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 8,
  },
  scrimBand1: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,11,13,0.15)' },
  scrimBand2: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,11,13,0.35)' },
  scrimBand3: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,11,13,0.75)' },
  qrFrame: {
    backgroundColor: color.bg.elevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

type MobileToken = keyof typeof typography.mobile;
type TvToken = keyof typeof typography.tv;

function familyName(family: 'display' | 'body'): string {
  return family === 'display' ? font.display : font.body;
}

export function mobileText(token: MobileToken, overrides: TextStyle = {}): TextStyle {
  const t = typography.mobile[token];
  return {
    fontFamily: familyName(t.family),
    fontSize: t.size,
    lineHeight: t.line,
    fontWeight: t.weight as TextStyle['fontWeight'],
    letterSpacing: 'tracking' in t ? t.tracking : undefined,
    color: color.text.primary,
    ...overrides,
  };
}

export function tvText(token: TvToken, overrides: TextStyle = {}): TextStyle {
  const t = typography.tv[token];
  return {
    fontFamily: familyName(t.family),
    fontSize: t.size,
    lineHeight: t.line,
    fontWeight: t.weight as TextStyle['fontWeight'],
    letterSpacing: 'tracking' in t ? t.tracking : undefined,
    color: color.text.primary,
    ...overrides,
  };
}

export function glassStyle(lowTier: boolean): ViewStyle {
  return lowTier ? s.glassOpaque : s.glass;
}

export function focusStyle(focused: boolean, reducedMotion: boolean): ViewStyle | undefined {
  if (!focused) return undefined;
  return {
    borderWidth: 3,
    borderColor: color.accent.copper,
    transform: reducedMotion ? undefined : [{ scale: 1.04 }],
    ...s.shadow2,
  };
}

export { color, radius, space, typography, font };
