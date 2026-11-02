import React, {useEffect, useRef} from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import Svg, {Circle, Defs, LinearGradient, Path, Rect, Stop} from 'react-native-svg';
import {C, R, S, useTheme} from '../theme';
import {Title} from '../api/provider';
import {formatPosition, progressRatio} from '../core/platform';

/* ------------------------------- icons ------------------------------ */

export type IconName =
  | 'home' | 'explore' | 'search' | 'library' | 'settings' | 'play' | 'pause'
  | 'plus' | 'check' | 'back' | 'forward' | 'close' | 'download' | 'tv'
  | 'qr' | 'refresh' | 'trash' | 'info' | 'offline' | 'alert' | 'clock'
  | 'subtitles' | 'volume' | 'volumeOff' | 'fullscreen' | 'rewind' | 'skip';

const PATHS: Record<IconName, string> = {
  home: 'M3 10.5 12 3l9 7.5V21H14v-6h-4v6H3z',
  explore: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm3.5 5.5-2.2 5.3-5.3 2.2 2.2-5.3z',
  search: 'M10.5 4a6.5 6.5 0 1 0 4.1 11.6l4.4 4.4 1.4-1.4-4.4-4.4A6.5 6.5 0 0 0 10.5 4zm0 2a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9z',
  library: 'M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z',
  settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm8.4 4a8.4 8.4 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a8.3 8.3 0 0 0-2-1.2L15.6 3h-3.9l-.4 2.7a8.3 8.3 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5a8.4 8.4 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-1a8.3 8.3 0 0 0 2 1.2l.4 2.7h3.9l.4-2.7a8.3 8.3 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z',
  play: 'M8 5v14l11-7z',
  pause: 'M7 5h4v14H7zm6 0h4v14h-4z',
  plus: 'M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z',
  check: 'M9.6 17.3 4.3 12l1.4-1.4 3.9 3.9 8.7-8.7L19.7 7z',
  back: 'M15.4 5.4 8.8 12l6.6 6.6-1.4 1.4L6 12l8-8z',
  forward: 'M8.6 18.6 15.2 12 8.6 5.4 10 4l8 8-8 8z',
  close: 'M18.3 5.7 12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7 2.9 18.3 9.2 12 2.9 5.7 4.3 4.3l6.3 6.3 6.3-6.3z',
  download: 'M11 3h2v9h3.5L12 17.5 7.5 12H11zM5 19h14v2H5z',
  tv: 'M3 5h18a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1h-7v2h3v2H7v-2h3v-2H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm1 2v9h16V7z',
  qr: 'M3 3h7v7H3zm2 2v3h3V5zM14 3h7v7h-7zm2 2v3h3V5zM3 14h7v7H3zm2 2v3h3v-3zM14 14h3v3h-3zm5 0h2v2h-2zm-5 5h2v2h-2zm3 0h4v2h-4z',
  refresh: 'M12 4a8 8 0 0 1 7.4 5H22l-4 5-4-5h2.6A6 6 0 1 0 12 18a6 6 0 0 0 5.2-3l1.7 1A8 8 0 1 1 12 4z',
  trash: 'M9 3h6l1 2h4v2H4V5h4zM6 8h12l-1 13H7z',
  info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm1 13h-2v-6h2zm0-8h-2V6h2z',
  offline: 'M3 3l18 18-1.4 1.4L18 20.8A10 10 0 0 1 12 22a10 10 0 0 1-9-6l1.7-1A8 8 0 0 0 16.6 19L2 4.4zM12 2a10 10 0 0 1 9.9 8.6l-2 .2A8 8 0 0 0 6.5 5.1L5.1 3.7A10 10 0 0 1 12 2z',
  alert: 'M12 2 1 21h22zm0 6 6.5 11h-13zM11 10h2v5h-2zm0 6h2v2h-2z',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm1 4v5.2l3.6 2.1-1 1.7-4.6-2.7V7z',
  subtitles: 'M3 5h18v14H3zm3 9h5v2H6zm7 0h5v2h-5zM6 9h4v2H6zm6 0h6v2h-6z',
  volume: 'M4 9h4l5-4v14l-5-4H4zm12.5-1.5a5 5 0 0 1 0 9v-2a3 3 0 0 0 0-5z',
  volumeOff: 'M4 9h4l5-4v14l-5-4H4zm12 1.6 1.4-1.4 2.1 2.1 2.1-2.1 1.4 1.4-2.1 2.1 2.1 2.1-1.4 1.4-2.1-2.1-2.1 2.1-1.4-1.4 2.1-2.1z',
  fullscreen: 'M4 4h6v2H6v4H4zm10 0h6v6h-2V6h-4zM4 14h2v4h4v2H4zm14 0h2v6h-6v-2h4z',
  rewind: 'M11 12 21 5v14zM3 5h2v14H3zm3 7 6-4v8z',
  skip: 'M13 12 3 19V5zm8-7h-2v14h2zM10 12l7-4v8z',
};

export function Icon({
  name,
  size = 22,
  color = C.ivory,
  filled = true,
}: {
  name: IconName;
  size?: number;
  color?: string;
  filled?: boolean;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={PATHS[name]} fill={filled ? color : 'none'} stroke={filled ? 'none' : color} strokeWidth={1.6} />
    </Svg>
  );
}

/* ---------------------------- primitives ---------------------------- */

/** S4: letterspaced caps over a hairline rule. The section signature. */
export function ReelLabel({children, style}: {children: string; style?: any}) {
  const {t, c} = useTheme();
  return (
    <View style={styles.reelRow}>
      <Text style={[t.reel, {color: c.muted}, style]}>{children.toUpperCase()}</Text>
      <View style={[styles.reelRule, {backgroundColor: c.hairline}]} />
    </View>
  );
}

export function Hairline({style}: {style?: ViewStyle}) {
  const {c} = useTheme();
  return <View style={[{height: StyleSheet.hairlineWidth, backgroundColor: c.hairline}, style]} />;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  loading,
  full,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  full?: boolean;
}) {
  const {c, t, r, s} = useTheme();
  const bg =
    variant === 'primary' ? c.copper : variant === 'secondary' ? c.elevated : variant === 'danger' ? 'transparent' : 'transparent';
  const fg =
    variant === 'primary' ? c.obsidian : variant === 'danger' ? c.error : c.ivory;
  const border = variant === 'secondary' ? c.hairlineStrong : variant === 'danger' ? c.error : 'transparent';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || loading}
      onPress={onPress}
      style={({pressed}) => [
        styles.button,
        {
          backgroundColor: bg,
          borderColor: border,
          borderWidth: variant === 'secondary' || variant === 'danger' ? 1 : 0,
          borderRadius: r.pill,
          paddingHorizontal: s.lg,
          opacity: disabled ? 0.4 : pressed ? 0.82 : 1,
          alignSelf: full ? 'stretch' : 'flex-start',
        },
      ]}>
      {loading ? (
        <ActivityIndicator color={fg} size="small" />
      ) : (
        <>
          {icon ? <Icon name={icon} size={18} color={fg} /> : null}
          <Text style={[t.labelLg, {color: fg, marginLeft: icon ? s.xs : 0}]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  const {c, t, r, s} = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{selected: !!active}}
      style={({pressed}) => [
        styles.chip,
        {
          borderRadius: r.pill,
          borderColor: active ? c.copper : c.hairline,
          backgroundColor: active ? c.copperTint : 'transparent',
          paddingHorizontal: s.md,
          opacity: pressed ? 0.8 : 1,
        },
      ]}>
      <Text style={[t.labelMd, {color: active ? c.copperLight : c.muted}]}>{label}</Text>
    </Pressable>
  );
}

/* ------------------------------ posters ----------------------------- */

export function PosterCard({
  title,
  onPress,
  width,
  showTitle = true,
  progress,
  badge,
  focused,
}: {
  title: Title;
  onPress: () => void;
  width?: number;
  showTitle?: boolean;
  progress?: number;
  badge?: string;
  focused?: boolean;
}) {
  const {c, t, r, s, device} = useTheme();
  const w = width ?? device.posterW;
  const h = Math.round((w * 3) / 2);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title.title}
      style={({pressed}) => [
        {width: w, marginRight: s.sm, opacity: pressed ? 0.85 : 1},
        focused ? {transform: [{scale: 1.04}]} : null,
      ]}>
      <View
        style={{
          width: w,
          height: h,
          borderRadius: r.sm,
          overflow: 'hidden',
          backgroundColor: c.elevated,
          borderWidth: focused ? 3 : 1,
          borderColor: focused ? c.copper : c.hairline,
        }}>
        {title.poster ? (
          <Image source={{uri: title.poster}} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.center]}>
            <Icon name="play" size={24} color={c.faint} />
          </View>
        )}
        {badge ? (
          <View style={[styles.badge, {backgroundColor: c.obsidian, borderRadius: r.xs}]}>
            <Text style={[t.micro, {color: c.copperLight}]}>{badge}</Text>
          </View>
        ) : null}
        {progress !== undefined && progress > 0.01 ? (
          <View style={styles.posterProgressTrack}>
            <View
              style={{
                width: `${Math.min(100, progress * 100)}%`,
                height: 3,
                backgroundColor: c.copper,
              }}
            />
          </View>
        ) : null}
      </View>
      {showTitle ? (
        <Text numberOfLines={2} style={[t.labelMd, {color: c.ivory, marginTop: s.xs}]}>
          {title.title}
        </Text>
      ) : null}
    </Pressable>
  );
}

export function Rail({
  sectionTitle,
  items,
  onPressItem,
  progressFor,
  horizontalPadding = 20,
}: {
  sectionTitle: string;
  items: Title[];
  onPressItem: (t: Title) => void;
  progressFor?: (t: Title) => number | undefined;
  horizontalPadding?: number;
}) {
  const {s} = useTheme();
  if (items.length === 0) {
    return null;
  }
  return (
    <View style={{marginBottom: s.lg}}>
      <View style={{paddingHorizontal: horizontalPadding, marginBottom: s.sm}}>
        <ReelLabel>{sectionTitle}</ReelLabel>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{paddingHorizontal: horizontalPadding}}
        removeClippedSubviews>
        {items.map(item => (
          <PosterCard
            key={`${item.subjectId}-${item.detailPath}`}
            title={item}
            onPress={() => onPressItem(item)}
            progress={progressFor?.(item)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

/* -------------------------------- hero ------------------------------ */

export function Hero({
  title,
  backdrop,
  onPlay,
  onInfo,
  meta,
  height,
}: {
  title: string;
  backdrop?: string;
  onPlay: () => void;
  onInfo: () => void;
  meta?: string;
  height?: number;
}) {
  const {c, t, r, s, device} = useTheme();
  const h = height ?? (device.widthClass === 'compact' ? 380 : 460);
  return (
    <View style={{height: h, justifyContent: 'flex-end'}}>
      {backdrop ? (
        <Image source={{uri: backdrop}} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <View style={[StyleSheet.absoluteFill, {backgroundColor: c.elevated}]} />
      )}
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <LinearGradient id="heroFade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={c.obsidian} stopOpacity="0.15" />
            <Stop offset="0.45" stopColor={c.obsidian} stopOpacity="0.55" />
            <Stop offset="1" stopColor={c.obsidian} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#heroFade)" />
      </Svg>
      <View style={{paddingHorizontal: s.gutter, paddingBottom: s.lg}}>
        <Text style={[t.reel, {color: c.copperLight, marginBottom: s.xs}]}>FEATURED TONIGHT</Text>
        <Text style={[t.displayXl, {color: c.ivory}]} numberOfLines={2}>
          {title}
        </Text>
        {meta ? (
          <Text style={[t.bodySm, {color: c.muted, marginTop: s.xs}]} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
        <View style={{flexDirection: 'row', marginTop: s.md, gap: s.sm}}>
          <Button label="Play" icon="play" onPress={onPlay} />
          <Button label="Details" variant="secondary" onPress={onInfo} />
        </View>
      </View>
    </View>
  );
}

/* ------------------------------- states ----------------------------- */

export function EmptyState({
  icon = 'info',
  headline,
  body,
  actionLabel,
  onAction,
}: {
  icon?: IconName;
  headline: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const {c, t, s} = useTheme();
  return (
    <View style={[styles.center, {padding: s.xl}]}>
      <View style={{opacity: 0.7, marginBottom: s.md}}>
        <Icon name={icon} size={36} color={c.faint} />
      </View>
      <Text style={[t.titleMd, {color: c.ivory, textAlign: 'center'}]}>{headline}</Text>
      {body ? (
        <Text style={[t.bodySm, {color: c.muted, textAlign: 'center', marginTop: s.xs, maxWidth: 320}]}>
          {body}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <View style={{marginTop: s.lg}}>
          <Button label={actionLabel} variant="secondary" onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}

export function ErrorState({message, onRetry}: {message: string; onRetry?: () => void}) {
  const {c, t, s} = useTheme();
  return (
    <View style={[styles.center, {padding: s.xl}]}>
      <Icon name="alert" size={32} color={c.warning} />
      <Text style={[t.titleSm, {color: c.ivory, marginTop: s.md, textAlign: 'center'}]}>{message}</Text>
      {onRetry ? (
        <View style={{marginTop: s.md}}>
          <Button label="Try again" icon="refresh" variant="secondary" onPress={onRetry} />
        </View>
      ) : null}
    </View>
  );
}

export function SkeletonRail() {
  const {c, s, r, device} = useTheme();
  const opacity = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {toValue: 0.7, duration: 900, useNativeDriver: true}),
        Animated.timing(opacity, {toValue: 0.35, duration: 900, useNativeDriver: true}),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return (
    <View style={{paddingHorizontal: s.gutter, marginBottom: s.lg}}>
      <Animated.View
        style={{width: 120, height: 12, borderRadius: r.xs, backgroundColor: c.elevated, opacity, marginBottom: s.sm}}
      />
      <View style={{flexDirection: 'row'}}>
        {[0, 1, 2].map(i => (
          <Animated.View
            key={i}
            style={{
              width: device.posterW,
              height: device.posterH,
              borderRadius: r.sm,
              backgroundColor: c.elevated,
              opacity,
              marginRight: s.sm,
            }}
          />
        ))}
      </View>
    </View>
  );
}

export function ProgressBar({ratio, height = 3}: {ratio: number; height?: number}) {
  const {c} = useTheme();
  return (
    <View style={{height, backgroundColor: c.hairline, borderRadius: height}}>
      <View
        style={{
          height,
          width: `${Math.max(0, Math.min(1, ratio)) * 100}%`,
          backgroundColor: c.copper,
          borderRadius: height,
        }}
      />
    </View>
  );
}

export function Toast({message}: {message: string}) {
  const {c, t, r, s} = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(opacity, {toValue: 1, duration: 180, useNativeDriver: true}).start();
  }, [message, opacity]);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: s.gutter,
        right: s.gutter,
        bottom: 96,
        opacity,
        backgroundColor: c.elevated,
        borderColor: c.hairlineStrong,
        borderWidth: 1,
        borderRadius: r.md,
        paddingVertical: s.sm,
        paddingHorizontal: s.md,
      }}>
      <Text style={[t.bodySm, {color: c.ivory}]}>{message}</Text>
    </Animated.View>
  );
}

export function ScreenTitle({children, right}: {children: string; right?: React.ReactNode}) {
  const {c, t, s} = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        paddingHorizontal: s.gutter,
        paddingTop: s.md,
        paddingBottom: s.sm,
      }}>
      <Text style={[t.displayMd, {color: c.ivory}]}>{children}</Text>
      {right}
    </View>
  );
}

/** A resume chip: "S2 E4 · 12:31 left". */
export function ResumeLine({positionMs, durationMs}: {positionMs: number; durationMs: number}) {
  const {c, t} = useTheme();
  const left = Math.max(0, durationMs - positionMs) / 1000;
  return (
    <Text style={[t.micro, {color: c.copperLight, marginTop: 2}]}>
      {formatPosition(positionMs)} · {Math.round(left / 60)} min left
    </Text>
  );
}

export {progressRatio};

const styles = StyleSheet.create({
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  reelRow: {flexDirection: 'row', alignItems: 'center'},
  reelRule: {flex: 1, height: StyleSheet.hairlineWidth, marginLeft: S.sm},
  button: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minHeight: 44, paddingVertical: 10},
  chip: {borderWidth: 1, paddingVertical: 7, marginRight: S.xs},
  badge: {position: 'absolute', top: 8, left: 8, paddingHorizontal: 6, paddingVertical: 2},
  posterProgressTrack: {position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, backgroundColor: 'rgba(0,0,0,0.55)'},
});
