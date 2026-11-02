import React, {createContext, useContext, useMemo} from 'react';
import {Platform, PixelRatio, useWindowDimensions} from 'react-native';

/* ------------------------------------------------------------------ *
 * NOCTURNE — "The Screening Room"
 * Every colour, radius, space and duration in the app comes from here.
 * Screens may not hard-code a hex value or a millisecond.
 * ------------------------------------------------------------------ */

export const C = {
  obsidian: '#0A0B0D',
  surface: '#111318',
  elevated: '#171A21',
  glass: 'rgba(17,19,24,0.72)',
  hairline: 'rgba(244,239,231,0.12)',
  hairlineStrong: 'rgba(244,239,231,0.20)',

  ivory: '#F4EFE7',
  muted: '#A8A199',
  faint: '#6E6862',

  copper: '#C97B4A',
  copperLight: '#E0A277',
  copperDeep: '#8F5230',
  copperTint: 'rgba(201,123,74,0.14)',

  error: '#D9584B',
  warning: '#D9A441',
  success: '#7FA877',
  info: '#6E8CA8',

  veil: 'rgba(0,0,0,0.60)',
  scrimBottom: 'rgba(10,11,13,0.95)',
  scrimTop: 'rgba(10,11,13,0.00)',
} as const;

export const S = {
  xxs: 4, xs: 8, sm: 12, md: 16, lg: 24, xl: 32, xxl: 48, huge: 64,
  gutter: 20, railCollapsed: 96, railExpanded: 240,
};
export const GUTTER = 20;
export const R = {xs: 8, sm: 12, md: 16, lg: 24, pill: 999};

export const D = {instant: 120, quick: 180, standard: 240, emphasis: 320, slow: 400};

export const FONT = {
  display: 'Fraunces_500Medium',
  displaySemi: 'Fraunces_600SemiBold',
  ui: 'Inter_400Regular',
  uiMedium: 'Inter_500Medium',
  uiSemi: 'Inter_600SemiBold',
};

/* ---------------------------- type scale --------------------------- */

export type TypeScale = ReturnType<typeof mobileScale>;

const mk = (fontFamily: string, fontSize: number, lineHeight: number, letterSpacing = 0) => ({
  fontFamily,
  fontSize,
  lineHeight,
  letterSpacing,
});

const mobileScale = () => ({
  displayXl: mk(FONT.display, 32, 38, -0.2),
  displayLg: mk(FONT.display, 28, 34, -0.2),
  displayMd: mk(FONT.display, 24, 30),
  titleLg: mk(FONT.uiSemi, 20, 26, -0.1),
  titleMd: mk(FONT.uiSemi, 17, 23),
  titleSm: mk(FONT.uiMedium, 15, 20),
  bodyLg: mk(FONT.ui, 16, 24),
  bodyMd: mk(FONT.ui, 14, 21),
  bodySm: mk(FONT.ui, 13, 19),
  labelLg: mk(FONT.uiMedium, 13, 18, 0.2),
  labelMd: mk(FONT.uiMedium, 12, 16, 0.3),
  micro: mk(FONT.uiMedium, 11, 15, 0.6),
  reel: mk(FONT.uiSemi, 11, 15, 1.6),
});

/** TV floors are hard: body ≥ 20sp, nothing under 16sp. */
const tvScale = () => ({
  displayXl: mk(FONT.display, 56, 64, -0.5),
  displayLg: mk(FONT.display, 44, 52, -0.3),
  displayMd: mk(FONT.display, 36, 44),
  titleLg: mk(FONT.uiSemi, 30, 38),
  titleMd: mk(FONT.uiSemi, 26, 34),
  titleSm: mk(FONT.uiMedium, 22, 30),
  bodyLg: mk(FONT.ui, 22, 32),
  bodyMd: mk(FONT.ui, 20, 30),
  bodySm: mk(FONT.ui, 20, 30),
  labelLg: mk(FONT.uiMedium, 18, 24, 0.2),
  labelMd: mk(FONT.uiMedium, 16, 22, 0.3),
  micro: mk(FONT.uiMedium, 16, 22, 0.6),
  reel: mk(FONT.uiSemi, 16, 22, 2.4),
});

/* --------------------------- device shape -------------------------- */

export type FormFactor = 'phone' | 'tv';
export type WidthClass = 'compact' | 'medium' | 'large';

export interface Device {
  formFactor: FormFactor;
  isTv: boolean;
  isLowTier: boolean;
  width: number;
  height: number;
  widthClass: WidthClass;
  /** Glass is a budget, not a decoration: low-tier falls back to opaque + hairline. */
  glass: boolean;
  /** Overscan-safe inset for television layouts. */
  safeInset: number;
  /** TV poster geometry. */
  posterW: number;
  posterH: number;
  /** Number of posters that fit a rail without clipping. */
  railVisible: number;
}

export function buildDevice(opts: {
  isTv: boolean;
  isLowTier?: boolean;
  width: number;
  height: number;
}): Device {
  const {isTv, width, height} = opts;
  const widthClass: WidthClass = width <= 360 ? 'compact' : width <= 480 ? 'medium' : 'large';
  const posterW = isTv ? 220 : widthClass === 'compact' ? 120 : widthClass === 'medium' ? 132 : 156;
  const posterH = Math.round((posterW * 3) / 2);
  const usable = width - (isTv ? 96 + 96 : GUTTER * 2);
  return {
    formFactor: isTv ? 'tv' : 'phone',
    isTv,
    isLowTier: !!opts.isLowTier,
    width,
    height,
    widthClass,
    glass: !opts.isLowTier,
    safeInset: isTv ? Math.max(24, Math.round(Math.min(width, height) * 0.035)) : 0,
    posterW,
    posterH,
    railVisible: Math.max(2, Math.floor(usable / (posterW + S.sm))),
  };
}

interface Theme {
  c: typeof C;
  s: typeof S;
  r: typeof R;
  d: typeof D;
  t: TypeScale;
  device: Device;
}

const ThemeCtx = createContext<Theme | null>(null);

export function ThemeProvider({
  isTv,
  isLowTier,
  children,
}: {
  isTv: boolean;
  isLowTier?: boolean;
  children: React.ReactNode;
}) {
  const win = useWindowDimensions();
  const theme = useMemo<Theme>(
    () => ({
      c: C,
      s: S,
      r: R,
      d: D,
      t: isTv ? tvScale() : mobileScale(),
      device: buildDevice({isTv, isLowTier, width: win.width, height: win.height}),
    }),
    [isTv, isLowTier, win.width, win.height],
  );
  return <ThemeCtx.Provider value={theme}>{children}</ThemeCtx.Provider>;
}

export function useTheme(): Theme {
  const t = useContext(ThemeCtx);
  if (!t) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }
  return t;
}

export const px = (n: number) => PixelRatio.roundToNearestPixel(n);
export const isAndroid = Platform.OS === 'android';
