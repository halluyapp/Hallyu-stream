/**
 * Design tokens — transcribed verbatim from HALLYU_STREAM_UI_UX_MASTER_PLAN.md §9–10.
 * These are the only legal sources of colour, type, space, shape and depth.
 * Values are plain numbers/strings so they can be consumed by RN StyleSheet and the web harness alike.
 */

export const color = {
  bg: {
    obsidian: '#0A0B0D',
    surface: '#111318',
    elevated: '#171A21',
    glass: 'rgba(17, 19, 24, 0.72)',
    glassLow: 'rgba(17, 19, 24, 0.48)',
    veil: 'rgba(10, 11, 13, 0.60)',
    scrimTop: 'rgba(10,11,13,0)',
    scrimBottom: '#0A0B0D',
  },
  text: {
    primary: '#F4EFE7',
    muted: '#A8A199',
    faint: '#6E6862',
    onAccent: '#120D09',
    inverse: '#0A0B0D',
  },
  accent: {
    copper: '#C97B4A',
    copperLight: '#E0A277',
    copperDeep: '#8F5230',
    copperTint: 'rgba(201, 123, 74, 0.14)',
  },
  state: {
    error: '#D9584B',
    warning: '#D9A441',
    success: '#7FA877',
    info: '#6E8CA8',
    progress: '#C97B4A',
  },
  hairline: 'rgba(244, 239, 231, 0.10)',
  topHighlight: 'rgba(244, 239, 231, 0.08)',
  captionScrim: 'rgba(10,11,13,0.72)',
} as const;

export const radius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

/** 4dp grid: space.1 … space.10 (the plan lists 4·8·12·16·20·24·32·40·48·64). */
export const space = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 32,
  8: 40,
  9: 48,
  10: 64,
} as const;

export const layout = {
  marginMobile: 20,
  marginMobileCompact: 16,
  marginMobileLarge: 24,
  marginTv: 48,
  gapShelfMobile: 12,
  gapShelfTv: 24,
  gapShelfStackMobile: 28,
  gapShelfStackTv: 48,
  posterRatio: 2 / 3,
  landscapeRatio: 16 / 9,
  heroMobileVh: 0.56,
  heroTvDissolve: 0.4,
  navHeight: 64,
  touchMin: 48,
  focusOffset: 4,
  focusRingWidth: 3,
  tvSafePercent: 0.05,
  poster: {
    mobile: { width: 120, height: 180 },
    featured: { width: 140, height: 210 },
    tv: { width: 260, height: 390 },
  },
  continueMobile: { width: 240, height: 135 },
  episodeStillMobile: { width: 128, height: 72 },
  episodeStillTv: { width: 320, height: 180 },
} as const;

export const elevation = {
  0: 'none',
  1: '0 2px 8px rgba(0,0,0,0.40)',
  2: '0 8px 24px rgba(0,0,0,0.50)',
  3: '0 16px 48px rgba(0,0,0,0.60)',
} as const;

export const motion = {
  duration: {
    1: 120,
    2: 180,
    3: 240,
    4: 320,
    5: 400,
  },
  ease: {
    standard: 'cubic-bezier(0.20, 0, 0, 1)',
    emphasis: 'cubic-bezier(0.05, 0.7, 0.1, 1)',
    exit: 'cubic-bezier(0.30, 0, 0.80, 0.15)',
  },
} as const;

export const blur = {
  chromeMobile: 16,
  chromeTv: 24,
} as const;

/**
 * Fonts are bundled by each native app (`@expo-google-fonts/fraunces`, `inter`).
 * The web harness falls back to Georgia/system-ui when the files are absent.
 */
export const font = {
  display: 'Fraunces_600SemiBold',
  displayFallback: 'Georgia, "Times New Roman", serif',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodyStrong: 'Inter_600SemiBold',
  bodyFallback: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
} as const;

export const typography = {
  mobile: {
    displayXl: { size: 40, line: 46, family: 'display', weight: '600' },
    displayL: { size: 32, line: 38, family: 'display', weight: '600' },
    h1: { size: 28, line: 34, family: 'display', weight: '600' },
    h2: { size: 20, line: 26, family: 'body', weight: '600' },
    body: { size: 16, line: 24, family: 'body', weight: '400' },
    bodyStrong: { size: 16, line: 24, family: 'body', weight: '600' },
    meta: { size: 13, line: 18, family: 'body', weight: '400' },
    label: { size: 12, line: 16, family: 'body', weight: '600', tracking: 0.14 },
    micro: { size: 11, line: 14, family: 'body', weight: '500' },
    button: { size: 16, line: 20, family: 'body', weight: '600' },
  },
  tv: {
    display: { size: 56, line: 62, family: 'display', weight: '600' },
    h1: { size: 40, line: 48, family: 'display', weight: '600' },
    h2: { size: 28, line: 36, family: 'body', weight: '600' },
    body: { size: 22, line: 30, family: 'body', weight: '400' },
    bodyStrong: { size: 22, line: 30, family: 'body', weight: '600' },
    meta: { size: 18, line: 24, family: 'body', weight: '400' },
    label: { size: 20, line: 24, family: 'body', weight: '600' },
    code: { size: 64, line: 72, family: 'display', weight: '600', tracking: 0.2 },
  },
} as const;

/** Glass budget: chrome only; lowTier collapses to opaque elevated + hairline (`9.7`). */
export function glassFill(lowTier: boolean): string {
  return lowTier ? color.bg.elevated : color.bg.glass;
}

export const brand = {
  wordmark: 'HALLYU-STREAM',
  hangul: '한류 스트림',
  copperRuleWidthRatio: 0.52,
  about:
    'An independent streaming experience for film and television. Not affiliated with, endorsed by, or connected to Moviebox.',
} as const;
