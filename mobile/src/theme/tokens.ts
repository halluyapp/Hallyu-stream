/**
 * NOCTURNE design tokens — single source of truth.
 * Normative values from HALLYU_STREAM_UI_UX_MASTER_PLAN.md §9–10.
 * Any value change must come back through a revision of that document.
 */

export const colors = {
  bgObsidian: '#0A0B0D',
  bgSurface: '#111318',
  bgElevated: '#171A21',
  bgGlass: 'rgba(17, 19, 24, 0.72)',
  bgGlassLow: 'rgba(17, 19, 24, 0.48)',
  bgVeil: 'rgba(10, 11, 13, 0.60)',

  textPrimary: '#F4EFE7',
  textMuted: '#A8A199',
  textFaint: '#6E6862',
  textOnAccent: '#120D09',

  accentCopper: '#C97B4A',
  accentCopperLight: '#E0A277',
  accentCopperDeep: '#8F5230',
  accentCopperTint: 'rgba(201, 123, 74, 0.14)',

  stateError: '#D9584B',
  stateWarning: '#D9A441',
  stateSuccess: '#7FA877',
  stateInfo: '#6E8CA8',

  hairline: 'rgba(244, 239, 231, 0.10)',
  topHighlight: 'rgba(244, 239, 231, 0.08)',
} as const;

export const radius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

export const space = [4, 8, 12, 16, 20, 24, 32, 40, 48, 64] as const;

export const layout = {
  marginMobile: 20,
  gapShelf: 12,
  gapShelfStack: 28,
  posterRatio: 2 / 3,
  landscapeRatio: 9 / 16,
  heroMobileHeight: 0.52,
  navHeight: 64,
  touchMin: 48,
  posterShelfWidth: 120,
  posterFeaturedWidth: 140,
  continueCardWidth: 240,
  episodeStillWidth: 128,
} as const;

/** Font family names after loading via expo-font (see app/_layout.tsx). */
export const fonts = {
  display: 'Fraunces_600SemiBold',
  displayRegular: 'Fraunces_400Regular',
  ui: 'Inter_400Regular',
  uiMedium: 'Inter_500Medium',
  uiStrong: 'Inter_600SemiBold',
} as const;

export const type = {
  displayXl: { fontSize: 32, lineHeight: 36, fontFamily: fonts.display, letterSpacing: -0.01 * 32 },
  displayL: { fontSize: 28, lineHeight: 32, fontFamily: fonts.display, letterSpacing: -0.01 * 28 },
  h1: { fontSize: 22, lineHeight: 28, fontFamily: fonts.uiStrong },
  h2: { fontSize: 18, lineHeight: 24, fontFamily: fonts.uiStrong },
  body: { fontSize: 15, lineHeight: 22, fontFamily: fonts.ui },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontFamily: fonts.uiStrong },
  meta: { fontSize: 13, lineHeight: 18, fontFamily: fonts.ui },
  label: { fontSize: 12, lineHeight: 16, fontFamily: fonts.uiStrong, letterSpacing: 0.14 * 12 },
  button: { fontSize: 14, lineHeight: 18, fontFamily: fonts.uiStrong, letterSpacing: 0.01 * 14 },
  micro: { fontSize: 11, lineHeight: 14, fontFamily: fonts.uiMedium, letterSpacing: 0.02 * 11 },
} as const;

/** Motion tokens (§9.9). */
export const motion = {
  duration1: 120,
  duration2: 180,
  duration3: 240,
  duration4: 320,
  duration5: 400,
} as const;

export const shadow = {
  e1: {
    shadowColor: '#000000',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  e2: {
    shadowColor: '#000000',
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  e3: {
    shadowColor: '#000000',
    shadowOpacity: 0.6,
    shadowRadius: 48,
    shadowOffset: { width: 0, height: 16 },
    elevation: 10,
  },
} as const;
