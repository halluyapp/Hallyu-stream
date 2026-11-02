import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import {
  brand,
  color,
  copy,
  episodeLabel,
  formatBytes,
  formatTime,
  layout,
  radius,
  space,
  type Caption,
  type DownloadEntry,
  type HistoryEntry,
  type PairedDevice,
  type PairingSession,
  type ProgressEntry,
  type Title,
} from '@hallyu/shared';
import { Icon, usePlatform, useSettings, type IconName } from '../platform/context';
import { glassStyle, mobileText, s, tvText } from '../theme';

// ── Brand ─────────────────────────────────────────────────────────────────

export function Wordmark({ size = 34, tv = false, showHangul = false }: { size?: number; tv?: boolean; showHangul?: boolean }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text
        accessibilityRole="header"
        style={[
          tv ? tvText('display', { fontSize: size }) : mobileText('displayL', { fontSize: size }),
          { letterSpacing: 0.04 * size, textAlign: 'center' },
        ]}
      >
        {brand.wordmark}
      </Text>
      <View
        style={{
          width: size * 3.2,
          height: 2,
          backgroundColor: color.accent.copper,
          marginTop: 6,
          alignSelf: 'flex-end',
          marginRight: size * 1.1,
        }}
      />
      {showHangul && (
        <Text style={[mobileText('meta', { color: 'rgba(244,239,231,0.6)', letterSpacing: 0.3 * 12, marginTop: 12 })]}>
          {brand.hangul}
        </Text>
      )}
    </View>
  );
}

export function BrandRule({ width = 120 }: { width?: number }) {
  return <View style={{ width, height: 2, backgroundColor: color.accent.copper }} />;
}

export function ScreenTitle({ children, tv = false }: { children: ReactNode; tv?: boolean }) {
  return <Text style={[tv ? tvText('h1') : mobileText('h1'), { marginBottom: space[4] }]}>{children}</Text>;
}

export function ReelLabel({
  children,
  tv = false,
  action,
  onAction,
}: {
  children: ReactNode;
  tv?: boolean;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: space[3], gap: space[3] }}>
      <Text style={[tv ? tvText('label', { fontSize: 16 }) : mobileText('label'), { textTransform: 'uppercase', color: color.text.muted }]}>
        {children}
      </Text>
      <View style={{ flex: 1, height: 1, backgroundColor: color.hairline }} />
      {action && onAction && (
        <TextButton label={action} onPress={onAction} tv={tv} color={color.accent.copperLight} />
      )}
    </View>
  );
}

// ── Buttons & inputs ──────────────────────────────────────────────────────

export function PrimaryButton({
  label,
  onPress,
  icon,
  disabled,
  loading,
  tv = false,
  style,
}: {
  label: string;
  onPress?: () => void;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  tv?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        tv && s.buttonTv,
        disabled ? { backgroundColor: color.bg.elevated } : s.copperFill,
        pressed && !disabled && { backgroundColor: color.accent.copperDeep, transform: [{ scale: 0.98 }] },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={color.text.onAccent} />
      ) : (
        <>
          {icon && <Icon name={icon} size={tv ? 28 : 20} color={disabled ? color.text.faint : color.text.onAccent} />}
          <Text
            style={[
              tv ? tvText('label') : mobileText('button'),
              { color: disabled ? color.text.faint : color.text.onAccent, marginLeft: icon ? space[2] : 0 },
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

export function SecondaryButton({
  label,
  onPress,
  icon,
  tv = false,
  style,
  disabled,
}: {
  label: string;
  onPress?: () => void;
  icon?: IconName;
  tv?: boolean;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [s.button, tv && s.buttonTv, s.secondary, pressed && { backgroundColor: color.bg.veil }, style]}
    >
      {icon && <Icon name={icon} size={tv ? 28 : 20} color={color.text.primary} />}
      <Text style={[tv ? tvText('label') : mobileText('button'), { marginLeft: icon ? space[2] : 0 }]}>{label}</Text>
    </Pressable>
  );
}

export function TextButton({
  label,
  onPress,
  tv = false,
  color: tint = color.text.muted,
}: {
  label: string;
  onPress?: () => void;
  tv?: boolean;
  color?: string;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} hitSlop={8} style={{ minHeight: tv ? 48 : 36, justifyContent: 'center' }}>
      <Text style={[tv ? tvText('label') : mobileText('body'), { color: tint }]}>{label}</Text>
    </Pressable>
  );
}

export function IconButton({
  name,
  onPress,
  filled,
  tv = false,
  tint = color.text.primary,
  label,
}: {
  name: IconName;
  onPress?: () => void;
  filled?: boolean;
  tv?: boolean;
  tint?: string;
  label?: string;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label || name} onPress={onPress} style={[s.iconBox, tv && { width: 56, height: 56 }]}>
      <Icon name={name} size={tv ? 32 : 24} color={filled ? color.accent.copper : tint} filled={filled} />
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  tv = false,
  icon,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  tv?: boolean;
  icon?: IconName;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        s.chip,
        tv && { minHeight: 44, paddingHorizontal: space[5] },
        selected && s.copperTint,
      ]}
    >
      {icon && <Icon name={icon} size={tv ? 20 : 16} color={selected ? color.accent.copperLight : color.text.muted} />}
      <Text
        style={[
          tv ? tvText('label', { fontSize: 18 }) : mobileText('meta'),
          { color: selected ? color.accent.copperLight : color.text.muted, marginLeft: icon ? space[2] : 0 },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function SearchField({
  value,
  onChange,
  onSubmit,
  onClear,
  placeholder = 'Search titles',
  tv = false,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit?: () => void;
  onClear?: () => void;
  placeholder?: string;
  tv?: boolean;
}) {
  return (
    <View
      style={[
        s.row,
        {
          minHeight: tv ? 64 : 52,
          borderRadius: radius.sm,
          backgroundColor: color.bg.surface,
          borderWidth: 1,
          borderColor: color.hairline,
          paddingHorizontal: space[4],
          gap: space[3],
        },
      ]}
    >
      <Icon name="search" size={tv ? 28 : 20} color={color.text.muted} />
      <TextInput
        accessibilityLabel="Search titles"
        value={value}
        onChangeText={onChange}
        onSubmitEditing={onSubmit}
        placeholder={placeholder}
        placeholderTextColor={color.text.faint}
        style={[tv ? tvText('h2') : mobileText('body'), { flex: 1, color: color.text.primary }]}
        returnKeyType="search"
      />
      {value.length > 0 && onClear && <IconButton name="clear" onPress={onClear} tv={tv} label="Clear search" />}
    </View>
  );
}

export function Toggle({ value, onValueChange, tv = false }: { value: boolean; onValueChange: (v: boolean) => void; tv?: boolean }) {
  const w = tv ? 64 : 44;
  const h = tv ? 36 : 26;
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      onPress={() => onValueChange(!value)}
      style={{
        width: w,
        height: h,
        borderRadius: radius.pill,
        backgroundColor: value ? color.accent.copper : color.bg.elevated,
        borderWidth: 1,
        borderColor: color.hairline,
        justifyContent: 'center',
        padding: 3,
      }}
    >
      <View
        style={{
          width: h - 6,
          height: h - 6,
          borderRadius: radius.pill,
          backgroundColor: color.text.primary,
          alignSelf: value ? 'flex-end' : 'flex-start',
        }}
      />
    </Pressable>
  );
}

// ── Artwork & cards ───────────────────────────────────────────────────────

export function FallbackArtwork({
  title,
  width,
  height,
  tv = false,
  radiusValue = radius.sm,
}: {
  title: string;
  width: number;
  height: number;
  tv?: boolean;
  radiusValue?: number;
}) {
  const initials = title
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  return (
    <View style={{ width, height, borderRadius: radiusValue, backgroundColor: color.bg.elevated, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ position: 'absolute', fontSize: Math.min(width, height) * 0.7, color: 'rgba(244,239,231,0.08)', fontFamily: 'Georgia' }}>
        {initials}
      </Text>
      <Text
        numberOfLines={3}
        style={[tv ? tvText('h2', { fontSize: Math.min(22, width / 10) }) : mobileText('body', { fontSize: Math.min(16, width / 8) }), { textAlign: 'center', paddingHorizontal: space[2] }]}
      >
        {title}
      </Text>
      <View style={{ width: 24, height: 2, backgroundColor: color.accent.copper, marginTop: space[3] }} />
    </View>
  );
}

function ArtworkImage({ uri, width, height, radiusValue }: { uri?: string; width: number; height: number; radiusValue?: number }) {
  const [failed, setFailed] = useState(false);
  if (!uri || failed) return null;
  return (
    <Image
      source={{ uri }}
      style={{ width, height, borderRadius: radiusValue ?? radius.sm }}
      resizeMode="cover"
      onError={() => setFailed(true)}
    />
  );
}

export function PosterCard({
  title,
  width = layout.poster.mobile.width,
  onPress,
  onLongPress,
  tv = false,
  focused = false,
  progress,
  unavailable,
}: {
  title: Title;
  width?: number;
  onPress?: () => void;
  onLongPress?: () => void;
  tv?: boolean;
  focused?: boolean;
  progress?: number;
  unavailable?: boolean;
}) {
  const height = Math.round(width / layout.posterRatio);
  const [failed, setFailed] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title.title}, ${title.releaseYear ?? '—'}. Double-tap to open.`}
      onPress={onPress}
      onLongPress={onLongPress}
      style={[{ width, marginRight: tv ? layout.gapShelfTv : layout.gapShelfMobile }, focused && { transform: [{ scale: 1.04 }], borderWidth: 3, borderColor: color.accent.copper, borderRadius: radius.sm }]}
    >
      <View style={[s.poster, { width, height }, focused && s.shadow2]}>
        {title.cover && !failed ? (
          <Image source={{ uri: title.cover }} style={{ width, height }} resizeMode="cover" onError={() => setFailed(true)} />
        ) : (
          <FallbackArtwork title={title.title} width={width} height={height} tv={tv} />
        )}
        {unavailable && (
          <View style={{ position: 'absolute', top: 6, left: 6, backgroundColor: color.state.info, paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.xs }}>
            <Text style={mobileText('micro', { color: color.text.inverse })}>{copy.labels.unavailable}</Text>
          </View>
        )}
        {progress !== undefined && progress > 0 && <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}><ProgressBar progress={progress} /></View>}
      </View>
      <Text numberOfLines={1} style={[tv ? tvText('meta') : mobileText('meta'), { marginTop: space[2], width }]}>
        {title.title}
      </Text>
    </Pressable>
  );
}

export function LandscapeCard({
  title,
  imageUrl,
  width,
  height,
  meta,
  progress,
  onPress,
  tv = false,
  focused = false,
  episode,
}: {
  title: string;
  imageUrl?: string;
  width: number;
  height: number;
  meta?: string;
  progress?: number;
  onPress?: () => void;
  tv?: boolean;
  focused?: boolean;
  episode?: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[{ width, marginRight: tv ? layout.gapShelfTv : layout.gapShelfMobile }, focused && { transform: [{ scale: 1.04 }], borderWidth: 3, borderColor: color.accent.copper, borderRadius: radius.sm }]}
    >
      <View style={[s.landscape, { width, height }, focused && s.shadow2]}>
        {imageUrl && !failed ? (
          <Image source={{ uri: imageUrl }} style={{ width, height }} resizeMode="cover" onError={() => setFailed(true)} />
        ) : (
          <FallbackArtwork title={episode || title} width={width} height={height} tv={tv} />
        )}
        {progress !== undefined && <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}><ProgressBar progress={progress} tv={tv} /></View>}
      </View>
      <Text numberOfLines={1} style={[tv ? tvText('bodyStrong') : mobileText('bodyStrong'), { marginTop: space[2], width }]}>{title}</Text>
      {meta && <Text numberOfLines={1} style={[tv ? tvText('meta') : mobileText('meta'), { color: color.text.muted, width }]}>{meta}</Text>}
    </Pressable>
  );
}

export function ProgressBar({ progress, tv = false }: { progress: number; tv?: boolean }) {
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <View style={[s.progressTrack, { height: tv ? 4 : 3 }]}>
      <View style={[s.progressFill, { width: `${clamped * 100}%` }]} />
    </View>
  );
}

export function CreditsLine({ title, tv = false }: { title: Title; tv?: boolean }) {
  const parts = [
    title.releaseYear ? String(title.releaseYear) : '—',
    title.contentType === 'series' ? 'Series' : title.contentType === 'movie' ? 'Film' : '—',
    title.rating !== undefined ? `★ ${title.rating.toFixed(1)}` : '—',
    title.genres.length ? title.genres.slice(0, 2).join(' · ') : '—',
  ];
  return (
    <Text numberOfLines={1} style={[tv ? tvText('meta') : mobileText('meta'), { color: color.text.muted }]}>
      {parts.join('  ·  ')}
    </Text>
  );
}

export function Shelf({
  label,
  titles,
  onTitlePress,
  tv = false,
  onSeeAll,
  lowTier,
}: {
  label: string;
  titles: Title[];
  onTitlePress: (title: Title) => void;
  tv?: boolean;
  onSeeAll?: () => void;
  lowTier?: boolean;
}) {
  if (!titles.length) return null;
  return (
    <View style={{ marginBottom: tv ? layout.gapShelfStackTv : layout.gapShelfStackMobile }}>
      <ReelLabel tv={tv} action={onSeeAll ? 'All ›' : undefined} onAction={onSeeAll}>
        {label}
      </ReelLabel>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: layout.marginMobile }}>
        {titles.map((item) => (
          <PosterCard key={item.subjectId} title={item} tv={tv} width={tv ? layout.poster.tv.width : layout.poster.mobile.width} onPress={() => onTitlePress(item)} />
        ))}
      </ScrollView>
    </View>
  );
}

export function PosterGrid({
  titles,
  onTitlePress,
  columns = 2,
  tv = false,
}: {
  titles: Title[];
  onTitlePress: (title: Title) => void;
  columns?: number;
  tv?: boolean;
}) {
  const { width } = useWindowDimensions();
  const margin = tv ? layout.marginTv : layout.marginMobile;
  const gap = tv ? layout.gapShelfTv : layout.gapShelfMobile;
  const cardWidth = Math.floor((width - margin * 2 - gap * (columns - 1)) / columns);
  return (
    <FlatList
      data={titles}
      numColumns={columns}
      keyExtractor={(item) => item.subjectId}
      columnWrapperStyle={{ gap }}
      contentContainerStyle={{ gap, paddingHorizontal: margin, paddingBottom: space[10] }}
      renderItem={({ item }) => (
        <PosterCard title={item} width={cardWidth} tv={tv} onPress={() => onTitlePress(item)} />
      )}
      showsVerticalScrollIndicator={false}
    />
  );
}

// ── States ────────────────────────────────────────────────────────────────

export function SkeletonBlock({ width, height, style }: { width: number | `${number}%`; height: number; style?: StyleProp<ViewStyle> }) {
  const { settings } = useSettings();
  const opacity = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    if (settings.lowTier || settings.reduceMotion) return;
    const anim = Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.7, duration: 500, useNativeDriver: true }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [opacity, settings.lowTier, settings.reduceMotion]);
  return <Animated.View style={[s.skeleton, { width, height, opacity }, style]} />;
}

export function EmptyState({
  title,
  body,
  actionLabel,
  onAction,
  tv = false,
  flourish,
}: {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
  tv?: boolean;
  flourish?: string;
}) {
  return (
    <View style={[s.center, { paddingHorizontal: tv ? layout.marginTv : layout.marginMobile, gap: space[4] }]}>
      <Text style={[tv ? tvText('h1') : mobileText('displayL'), { textAlign: 'center' }]}>{title}</Text>
      {flourish && <Text style={[mobileText('body', { fontStyle: 'italic', color: color.text.muted, textAlign: 'center' })]}>{flourish}</Text>}
      <Text style={[tv ? tvText('body') : mobileText('body'), { color: color.text.muted, textAlign: 'center', maxWidth: 520 }]}>{body}</Text>
      {actionLabel && onAction && <PrimaryButton label={actionLabel} onPress={onAction} tv={tv} icon="refresh" />}
    </View>
  );
}

export function ErrorState({
  title,
  body,
  actionLabel = copy.actions.retry,
  onAction,
  secondaryLabel,
  onSecondary,
  tv = false,
}: {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  tv?: boolean;
}) {
  return (
    <View style={[s.center, { paddingHorizontal: tv ? layout.marginTv : layout.marginMobile, gap: space[4] }]}>
      <Icon name="alert" size={tv ? 40 : 24} color={color.state.error} />
      <Text style={[tv ? tvText('h1') : mobileText('displayL'), { textAlign: 'center' }]}>{title}</Text>
      <Text style={[tv ? tvText('body') : mobileText('body'), { color: color.text.muted, textAlign: 'center', maxWidth: 560 }]}>{body}</Text>
      {onAction && <PrimaryButton label={actionLabel} onPress={onAction} tv={tv} icon="refresh" />}
      {secondaryLabel && onSecondary && <TextButton label={secondaryLabel} onPress={onSecondary} tv={tv} />}
    </View>
  );
}

export function LoadingState({ tv = false, rows = 2 }: { tv?: boolean; rows?: number }) {
  const { width } = useWindowDimensions();
  const heroHeight = Math.round((tv ? 420 : 320) * (width / (tv ? 1920 : 360)) ** 0.2);
  return (
    <View style={{ gap: space[5], paddingHorizontal: tv ? layout.marginTv : layout.marginMobile, paddingTop: space[4] }}>
      <SkeletonBlock width="100%" height={Math.min(heroHeight, tv ? 420 : 320)} style={{ borderRadius: radius.md }} />
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={{ gap: space[3] }}>
          <SkeletonBlock width={140} height={14} />
          <View style={{ flexDirection: 'row', gap: tv ? layout.gapShelfTv : layout.gapShelfMobile }}>
            {Array.from({ length: tv ? 4 : 3 }).map((__, j) => (
              <SkeletonBlock key={j} width={tv ? layout.poster.tv.width : layout.poster.mobile.width} height={tv ? layout.poster.tv.height : layout.poster.mobile.height} style={{ borderRadius: radius.sm }} />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

export function GlassPanel({ children, lowTier, style, tv = false }: { children: ReactNode; lowTier?: boolean; style?: StyleProp<ViewStyle>; tv?: boolean }) {
  const { settings } = useSettings();
  const opaque = lowTier ?? settings.lowTier;
  return <View style={[opaque ? s.glassOpaque : s.glass, s.shadow1, { padding: tv ? space[8] : space[5] }, style]}>{children}</View>;
}

// ── Hero & chrome ─────────────────────────────────────────────────────────

export function MarqueeHero({
  title,
  onPlay,
  onMore,
  onMyList,
  inList,
  tv = false,
  resumeLabel,
}: {
  title: Title;
  onPlay?: () => void;
  onMore?: () => void;
  onMyList?: () => void;
  inList?: boolean;
  tv?: boolean;
  resumeLabel?: string;
}) {
  const { height } = useWindowDimensions();
  const { settings } = useSettings();
  const heroHeight = tv ? Math.round(height * 0.62) : Math.round(height * layout.heroMobileVh);
  const [failed, setFailed] = useState(false);
  return (
    <View style={{ height: heroHeight, justifyContent: 'flex-end', paddingHorizontal: tv ? layout.marginTv : layout.marginMobile, paddingBottom: tv ? space[8] : space[6] }}>
      {title.backdrop && !failed ? (
        <Image source={{ uri: title.backdrop }} style={[s.fill]} resizeMode="cover" onError={() => setFailed(true)} />
      ) : (
        <View style={[s.fill, { backgroundColor: color.bg.elevated }]} />
      )}
      <View style={[s.fill, { backgroundColor: 'rgba(10,11,13,0.20)' }]} />
      <View style={[s.fill, { top: '45%', backgroundColor: 'rgba(10,11,13,0.55)' }]} />
      <View style={[s.fill, { top: '72%', backgroundColor: color.bg.obsidian }]} />
      <View style={{ maxWidth: tv ? 900 : '100%', gap: space[3] }}>
        <Text numberOfLines={2} style={tv ? tvText('display') : mobileText('displayXl')}>{title.title}</Text>
        <CreditsLine title={title} tv={tv} />
        <View style={[s.row, { gap: space[3], marginTop: space[2], flexWrap: 'wrap' }]}>
          <PrimaryButton label={resumeLabel || copy.actions.play} onPress={onPlay} tv={tv} icon="play" />
          <SecondaryButton label={tv ? 'More info' : copy.actions.myList} onPress={tv ? onMore : onMyList} tv={tv} icon={tv ? 'info' : inList ? 'bookmark' : 'plus'} />
          {tv && onMyList && <SecondaryButton label={inList ? 'In My List' : copy.actions.myList} onPress={onMyList} tv icon="bookmark" />}
        </View>
      </View>
    </View>
  );
}

export function TopBar({ title, onBack, right }: { title?: string; onBack?: () => void; right?: ReactNode }) {
  return (
    <View style={[s.rowBetween, { height: 56, paddingHorizontal: space[3], position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }]}>
      {onBack && <IconButton name="chevronLeft" onPress={onBack} label="Back" />}
      {title && <Text numberOfLines={1} style={[mobileText('h2'), { flex: 1, marginHorizontal: space[2] }]}>{title}</Text>}
      <View style={s.row}>{right}</View>
    </View>
  );
}

// ── Overlays ──────────────────────────────────────────────────────────────

export function BottomSheet({
  visible,
  onClose,
  title,
  children,
  tv = false,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  tv?: boolean;
}) {
  const { settings } = useSettings();
  return (
    <Modal visible={visible} transparent animationType={settings.reduceMotion ? 'fade' : 'slide'} onRequestClose={onClose}>
      <Pressable style={[s.fill, { backgroundColor: color.bg.veil }]} onPress={onClose} />
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <View
          style={[
            glassStyle(settings.lowTier),
            { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, paddingHorizontal: tv ? layout.marginTv : layout.marginMobile, paddingTop: space[3], paddingBottom: space[8], maxHeight: '85%' },
          ]}
        >
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: color.text.faint, alignSelf: 'center', marginBottom: space[4] }} />
          {title && <Text style={[tv ? tvText('h2') : mobileText('h1'), { marginBottom: space[4] }]}>{title}</Text>}
          <ScrollView showsVerticalScrollIndicator={false}>{children}</ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function Dialog({
  visible,
  title,
  body,
  confirmLabel,
  onConfirm,
  cancelLabel = copy.actions.cancel,
  onCancel,
  destructive,
  tv = false,
}: {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  cancelLabel?: string;
  onCancel: () => void;
  destructive?: boolean;
  tv?: boolean;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={[s.center, { backgroundColor: color.bg.veil, padding: layout.marginMobile }]}>
        <View style={[s.elevated, s.shadow2, { width: tv ? 640 : 312, padding: space[6], gap: space[4] }]}>
          <Text style={tv ? tvText('h2') : mobileText('h1')}>{title}</Text>
          <Text style={[tv ? tvText('body') : mobileText('body'), { color: color.text.muted }]}>{body}</Text>
          <View style={[s.row, { gap: space[3], justifyContent: 'flex-end', flexWrap: 'wrap' }]}>
            <TextButton label={cancelLabel} onPress={onCancel} tv={tv} />
            <PrimaryButton label={confirmLabel} onPress={onConfirm} tv={tv} style={destructive ? { backgroundColor: color.state.error } : undefined} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function Snackbar({
  message,
  visible,
  actionLabel,
  onAction,
  tv = false,
}: {
  message: string;
  visible: boolean;
  actionLabel?: string;
  onAction?: () => void;
  tv?: boolean;
}) {
  const { settings } = useSettings();
  if (!visible) return null;
  return (
    <View
      style={[
        glassStyle(settings.lowTier),
        s.rowBetween,
        {
          position: 'absolute',
          bottom: tv ? 40 : 88,
          left: tv ? layout.marginTv : layout.marginMobile,
          right: tv ? layout.marginTv : layout.marginMobile,
          paddingHorizontal: space[5],
          paddingVertical: space[3],
          zIndex: 30,
        },
      ]}
    >
      <Text style={tv ? tvText('meta') : mobileText('meta')}>{message}</Text>
      {actionLabel && onAction && <TextButton label={actionLabel} onPress={onAction} tv={tv} color={color.accent.copperLight} />}
    </View>
  );
}

export function InlineBanner({ message, tone = 'info', actionLabel, onAction, tv = false }: { message: string; tone?: 'info' | 'warning' | 'error'; actionLabel?: string; onAction?: () => void; tv?: boolean }) {
  const tint = tone === 'error' ? color.state.error : tone === 'warning' ? color.state.warning : color.state.info;
  return (
    <View style={[s.surface, s.rowBetween, { padding: space[4], gap: space[3], borderLeftWidth: 3, borderLeftColor: tint, marginBottom: space[4] }]}>
      <Icon name={tone === 'error' ? 'alert' : 'info'} size={tv ? 28 : 20} color={tint} />
      <Text style={[tv ? tvText('meta') : mobileText('meta'), { flex: 1 }]}>{message}</Text>
      {actionLabel && onAction && <TextButton label={actionLabel} onPress={onAction} tv={tv} color={color.accent.copperLight} />}
    </View>
  );
}

// ── Pairing kit ───────────────────────────────────────────────────────────

export function QRPanel({ value, size = 220, tv = false }: { value: string; size?: number; tv?: boolean }) {
  const { QrCode } = usePlatform();
  const { settings } = useSettings();
  const opaque = settings.lowTier;
  return (
    <View style={[opaque ? s.glassOpaque : s.glass, { padding: tv ? 24 : 16, alignItems: 'center', justifyContent: 'center', minWidth: size + 32, minHeight: size + 32 }]}>
      {QrCode ? (
        <QrCode value={value} size={size} color={color.text.primary} background={color.bg.elevated} />
      ) : (
        <View style={[s.qrFrame, { width: size, height: size }]}>
          <Icon name="qr" size={size * 0.5} color={color.text.faint} />
        </View>
      )}
      <Text style={[tv ? tvText('meta') : mobileText('micro'), { color: color.text.muted, marginTop: space[3], textAlign: 'center', maxWidth: size + 40 }]}>
        {copy.states.qrSecurity}
      </Text>
    </View>
  );
}

export function CountdownRing({ expiresAt, tv = false }: { expiresAt: string; tv?: boolean }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const remaining = Math.max(0, new Date(expiresAt).getTime() - now);
  const minutes = Math.floor(remaining / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1000);
  const tint = remaining === 0 ? color.state.error : remaining < 120_000 ? color.state.warning : color.accent.copper;
  return (
    <View style={[s.row, { gap: space[2] }]}>
      <View style={{ width: tv ? 20 : 14, height: tv ? 20 : 14, borderRadius: 10, borderWidth: 3, borderColor: tint }} />
      <Text style={[tv ? tvText('meta') : mobileText('meta'), { color: tint }]}>
        {remaining === 0 ? 'Expired' : `${minutes}:${String(seconds).padStart(2, '0')} left`}
      </Text>
    </View>
  );
}

export function DeviceCard({ device, onUnpair, tv = false }: { device: PairedDevice; onUnpair?: () => void; tv?: boolean }) {
  const lastSeen = device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleDateString() : 'Never';
  return (
    <View style={[s.surface, s.row, { padding: space[4], gap: space[4], marginBottom: space[3] }]}>
      <Icon name="tv" size={tv ? 40 : 28} color={color.text.muted} />
      <View style={{ flex: 1 }}>
        <Text style={tv ? tvText('bodyStrong') : mobileText('bodyStrong')}>{device.displayName}</Text>
        <Text style={[tv ? tvText('meta') : mobileText('meta'), { color: color.text.muted }]}>
          {device.model ? `${device.model} · ` : ''}Last seen {lastSeen}
        </Text>
      </View>
      {onUnpair && <TextButton label={copy.actions.unpair} onPress={onUnpair} tv={tv} color={color.state.error} />}
    </View>
  );
}

export function ApprovalCard({
  session,
  onApprove,
  onReject,
  approving,
  tv = false,
}: {
  session: PairingSession;
  onApprove: () => void;
  onReject: () => void;
  approving: boolean;
  tv?: boolean;
}) {
  return (
    <View style={[s.elevated, s.shadow2, { padding: tv ? space[8] : space[6], gap: space[4], maxWidth: tv ? 720 : 480, width: '100%' }]}>
      <Icon name="tv" size={tv ? 48 : 32} color={color.text.primary} />
      <Text style={tv ? tvText('h1') : mobileText('displayL')}>{session.tvName || 'Android TV'}</Text>
      <Text style={[tv ? tvText('body') : mobileText('body'), { color: color.text.muted }]}>{copy.labels.approvalNote}</Text>
      <CountdownRing expiresAt={session.expiresAt} tv={tv} />
      <View style={[s.row, { gap: space[3], flexWrap: 'wrap' }]}>
        <PrimaryButton label={copy.actions.approve} onPress={onApprove} loading={approving} tv={tv} icon="check" />
        <SecondaryButton label={copy.actions.reject} onPress={onReject} tv={tv} />
      </View>
    </View>
  );
}

// ── Player chrome ─────────────────────────────────────────────────────────

export function Seekbar({
  positionMs,
  durationMs,
  onSeek,
  tv = false,
}: {
  positionMs: number;
  durationMs?: number;
  onSeek: (ms: number) => void;
  tv?: boolean;
}) {
  const widthRef = useRef(1);
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    widthRef.current = e.nativeEvent.layout.width || 1;
  }, []);
  const duration = durationMs || 1;
  const progress = Math.max(0, Math.min(1, positionMs / duration));
  const handle = (e: GestureResponderEvent) => {
    if (!durationMs) return;
    onSeek((e.nativeEvent.locationX / widthRef.current) * durationMs);
  };
  return (
    <Pressable onLayout={onLayout} onPress={handle} style={{ paddingVertical: tv ? 12 : 8, justifyContent: 'center' }}>
      <View style={[s.progressTrack, { height: tv ? 6 : 4 }]}>
        <View style={[s.progressFill, { width: `${progress * 100}%` }]} />
      </View>
      <View style={{ position: 'absolute', left: `${progress * 100}%`, width: tv ? 20 : 14, height: tv ? 20 : 14, borderRadius: 10, backgroundColor: color.accent.copper, marginLeft: -7 }} />
      <View style={[s.rowBetween, { marginTop: space[2] }]}>
        <Text style={[tv ? tvText('meta') : mobileText('micro'), { color: color.text.primary }]}>{formatTime(positionMs)}</Text>
        <Text style={[tv ? tvText('meta') : mobileText('micro'), { color: color.text.muted }]}>{durationMs ? formatTime(durationMs) : '—'}</Text>
      </View>
    </Pressable>
  );
}

export function BufferingRing({ tv = false }: { tv?: boolean }) {
  return (
    <View style={[s.center, { gap: space[3] }]}>
      <ActivityIndicator size={tv ? 'large' : 'small'} color={color.accent.copper} />
      <Text style={[tv ? tvText('meta') : mobileText('meta'), { color: color.text.muted }]}>{copy.labels.preparingStream}</Text>
    </View>
  );
}

export function NextEpisodeCard({
  title,
  episode,
  onPlayNow,
  onCancel,
  tv = false,
}: {
  title: string;
  episode: string;
  onPlayNow: () => void;
  onCancel: () => void;
  tv?: boolean;
}) {
  return (
    <View style={[s.glassOpaque, s.shadow2, { padding: space[5], gap: space[3], maxWidth: tv ? 640 : 420, width: '100%' }]}>
      <Text style={[tv ? tvText('meta') : mobileText('meta'), { color: color.accent.copperLight }]}>Up next · {episode}</Text>
      <Text style={tv ? tvText('h2') : mobileText('h2')}>{title}</Text>
      <View style={[s.row, { gap: space[3] }]}>
        <PrimaryButton label="Play now" onPress={onPlayNow} tv={tv} icon="play" />
        <TextButton label={copy.actions.cancel} onPress={onCancel} tv={tv} />
      </View>
    </View>
  );
}

// ── Library / settings rows ───────────────────────────────────────────────

export function EpisodeRow({
  episode,
  title,
  onPress,
  watched,
  progress,
}: {
  episode: number;
  title: string;
  onPress?: () => void;
  watched?: boolean;
  progress?: number;
}) {
  return (
    <Pressable onPress={onPress} style={[s.row, { gap: space[4], paddingVertical: space[3], borderBottomWidth: 1, borderBottomColor: color.hairline }]}>
      <FallbackArtwork title={`E${episode}`} width={layout.episodeStillMobile.width} height={layout.episodeStillMobile.height} tv={false} radiusValue={radius.xs} />
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={mobileText('bodyStrong')}>E{episode} · {title}</Text>
        <Text style={[mobileText('meta'), { color: color.text.muted }]}>{watched ? 'Watched' : progress ? 'In progress' : '—'}</Text>
        {progress !== undefined && <ProgressBar progress={progress} />}
      </View>
      {watched ? <Icon name="check" size={20} color={color.text.primary} /> : <Icon name="play" size={20} color={color.text.muted} />}
    </Pressable>
  );
}

export function QueryRow({ query, onPress, onRemove }: { query: string; onPress: () => void; onRemove: () => void }) {
  return (
    <View style={[s.rowBetween, { paddingVertical: space[2], borderBottomWidth: 1, borderBottomColor: color.hairline }]}>
      <Pressable onPress={onPress} style={[s.row, { flex: 1, gap: space[3] }]}>
        <Icon name="clock" size={18} color={color.text.muted} />
        <Text style={mobileText('body')}>{query}</Text>
      </Pressable>
      <IconButton name="clear" onPress={onRemove} label={`Remove ${query}`} />
    </View>
  );
}

export function HistoryRow({ entry, onPlay }: { entry: HistoryEntry; onPlay: () => void }) {
  return (
    <Pressable onPress={onPlay} style={[s.row, { gap: space[4], paddingVertical: space[3], borderBottomWidth: 1, borderBottomColor: color.hairline }]}>
      {entry.cover ? <Image source={{ uri: entry.cover }} style={{ width: 48, height: 72, borderRadius: radius.xs }} /> : <FallbackArtwork title={entry.title} width={48} height={72} />}
      <View style={{ flex: 1 }}>
        <Text style={mobileText('bodyStrong')}>{entry.title}</Text>
        <Text style={[mobileText('meta'), { color: color.text.muted }]}>
          {episodeLabel(entry.season, entry.episode)} · {new Date(entry.watchedAt).toLocaleDateString()}
        </Text>
      </View>
      <Icon name="replay" size={20} color={color.text.muted} />
    </Pressable>
  );
}

export function DownloadRow({ entry, onRetry, onCancel, onPlay }: { entry: DownloadEntry; onRetry?: () => void; onCancel?: () => void; onPlay?: () => void }) {
  const pct = entry.totalBytes && entry.bytes ? Math.min(1, entry.bytes / entry.totalBytes) : undefined;
  const isFailed = entry.status === 'failed' || entry.status === 'interrupted';
  return (
    <Pressable onPress={onPlay} style={[s.row, { gap: space[4], paddingVertical: space[3], borderBottomWidth: 1, borderBottomColor: color.hairline }]}>
      {entry.cover ? <Image source={{ uri: entry.cover }} style={{ width: 48, height: 72, borderRadius: radius.xs }} /> : <FallbackArtwork title={entry.title} width={48} height={72} />}
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={mobileText('bodyStrong')}>{entry.title}</Text>
        <Text style={[mobileText('meta'), { color: isFailed ? color.state.error : color.text.muted }]}>
          {episodeLabel(entry.season, entry.episode)} · {entry.quality || '—'} · {formatBytes(entry.totalBytes ?? entry.bytes)} · {entry.status}
        </Text>
        {pct !== undefined && entry.status === 'downloading' && <ProgressBar progress={pct} />}
        {entry.reason && <Text style={[mobileText('micro'), { color: color.state.error }]}>{entry.reason}</Text>}
      </View>
      {isFailed && onRetry && <IconButton name="refresh" onPress={onRetry} label="Retry download" />}
      {onCancel && <IconButton name="trash" onPress={onCancel} label="Cancel download" />}
    </Pressable>
  );
}

export function StorageMeter({ used, free, tv = false }: { used: number; free: number; tv?: boolean }) {
  const total = used + free || 1;
  return (
    <View style={[s.surface, { padding: space[5], gap: space[3] }]}>
      <View style={s.rowBetween}>
        <Text style={tv ? tvText('h2') : mobileText('h2')}>{formatBytes(used)} used</Text>
        <Text style={[tv ? tvText('meta') : mobileText('meta'), { color: color.text.muted }]}>{formatBytes(free)} free</Text>
      </View>
      <View style={[s.progressTrack, { height: 8 }]}>
        <View style={[s.progressFill, { width: `${(used / total) * 100}%` }]} />
      </View>
    </View>
  );
}

export function SettingsRow({
  label,
  value,
  onPress,
  right,
  tv = false,
  destructive,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  right?: ReactNode;
  tv?: boolean;
  destructive?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={[s.rowBetween, { minHeight: tv ? 64 : 56, borderBottomWidth: 1, borderBottomColor: color.hairline, gap: space[3] }]}>
      <Text style={[tv ? tvText('body') : mobileText('body'), destructive ? { color: color.state.error } : undefined]}>{label}</Text>
      {right ?? (
        <View style={s.row}>
          {value && <Text style={[tv ? tvText('meta') : mobileText('meta'), { color: color.text.muted, marginRight: space[2] }]}>{value}</Text>}
          <Icon name="chevronRight" size={tv ? 26 : 18} color={color.text.muted} />
        </View>
      )}
    </Pressable>
  );
}

export function SegmentChips({
  items,
  active,
  onChange,
  tv = false,
}: {
  items: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
  tv?: boolean;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space[3], paddingBottom: space[4] }}>
      {items.map((item) => (
        <Chip key={item.id} label={item.label} selected={active === item.id} onPress={() => onChange(item.id)} tv={tv} />
      ))}
    </ScrollView>
  );
}

export function OnboardingCard({ title, body }: { title: string; body: string }) {
  return (
    <View style={[s.fill, { justifyContent: 'flex-end', padding: layout.marginMobile, paddingBottom: space[10], gap: space[3] }]}>
      <View style={[s.fill, { backgroundColor: 'rgba(10,11,13,0.35)' }]} />
      <View style={[s.fill, { top: '55%', backgroundColor: 'rgba(10,11,13,0.85)' }]} />
      <View style={{ gap: space[3], zIndex: 2 }}>
        <Text style={mobileText('displayXl')}>{title}</Text>
        <Text style={[mobileText('body'), { color: color.text.muted }]}>{body}</Text>
      </View>
    </View>
  );
}

export function PageDots({ count, active }: { count: number; active: number }) {
  return (
    <View style={[s.row, { gap: space[2], justifyContent: 'center' }]}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={{ width: i === active ? 18 : 8, height: 8, borderRadius: 4, backgroundColor: i === active ? color.accent.copper : color.text.faint }} />
      ))}
    </View>
  );
}

export function PermissionPrimer({
  title,
  body,
  allowLabel,
  alternativeLabel,
  onAllow,
  onAlternative,
  tv = false,
}: {
  title: string;
  body: string;
  allowLabel: string;
  alternativeLabel: string;
  onAllow: () => void;
  onAlternative: () => void;
  tv?: boolean;
}) {
  return (
    <GlassPanel tv={tv} style={{ gap: space[4] }}>
      <Text style={tv ? tvText('h2') : mobileText('h1')}>{title}</Text>
      <Text style={[tv ? tvText('body') : mobileText('body'), { color: color.text.muted }]}>{body}</Text>
      <PrimaryButton label={allowLabel} onPress={onAllow} tv={tv} />
      <TextButton label={alternativeLabel} onPress={onAlternative} tv={tv} color={color.accent.copperLight} />
    </GlassPanel>
  );
}
