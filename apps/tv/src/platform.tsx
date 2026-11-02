import React, { useEffect, useRef } from 'react';
import { Linking, Text, View, useTVEventHandler } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import * as LucideRN from 'lucide-react-native';
import Video, { type VideoRef } from 'react-native-video';
import QRCode from 'react-native-qrcode-svg';
import { MEDIA_REQUEST_HEADERS, type KeyValueStore } from '@hallyu/shared';
import type {
  IconName,
  IconProps,
  PlatformServices,
  QrRendererProps,
  RemoteKey,
  VideoRendererProps,
} from '@hallyu/ui';

// ── Storage ───────────────────────────────────────────────────────────────

export const asyncStorageAdapter: KeyValueStore = {
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
  removeItem: (key) => AsyncStorage.removeItem(key),
};

/** TV device credential lives in platform secure storage (`09` §2). */
export const keychainAdapter: KeyValueStore = {
  async getItem(key) {
    const credentials = await Keychain.getGenericPassword({ service: key });
    return credentials ? credentials.password : null;
  },
  async setItem(key, value) {
    await Keychain.setGenericPassword(key, value, { service: key });
  },
  async removeItem(key) {
    await Keychain.resetGenericPassword({ service: key });
  },
};

// ── Icons ─────────────────────────────────────────────────────────────────

const L = LucideRN as unknown as Record<string, React.ComponentType<any>>;
const pick = (name: string) => L[name] || L.Circle;

const iconMap: Record<IconName, React.ComponentType<any>> = {
  home: pick('Home'), compass: pick('Compass'), search: pick('Search'), library: pick('Library'),
  settings: pick('Settings'), tv: pick('Tv'), qr: pick('QrCode'), bookmark: pick('Bookmark'),
  download: pick('Download'), play: pick('Play'), pause: pick('Pause'), replay: pick('RotateCcw'),
  seekBack: pick('Rewind'), seekForward: pick('FastForward'), cc: pick('Captions'), quality: pick('Signal'),
  audio: pick('AudioLines'), expand: pick('Maximize'), chevronLeft: pick('ChevronLeft'), chevronRight: pick('ChevronRight'),
  close: pick('X'), clear: pick('X'), clock: pick('Clock'), check: pick('Check'), alert: pick('AlertTriangle'),
  trash: pick('Trash2'), flash: pick('Zap'), plus: pick('Plus'), minus: pick('Minus'), more: pick('MoreHorizontal'),
  info: pick('Info'), wifi: pick('Wifi'), storage: pick('HardDrive'), refresh: pick('RefreshCw'),
  arrowLeft: pick('ArrowLeft'), arrowRight: pick('ArrowRight'), arrowUp: pick('ArrowUp'), arrowDown: pick('ArrowDown'),
  keyboard: pick('Keyboard'), checkCircle: pick('CheckCircle'), x: pick('X'), filter: pick('Filter'),
  grid: pick('LayoutGrid'), list: pick('List'), skip: pick('SkipForward'), volume: pick('Volume2'),
  brightness: pick('Sun'), menu: pick('Menu'), link: pick('Link'), shield: pick('Shield'), eye: pick('Eye'),
  eyeOff: pick('EyeOff'), film: pick('Film'), calendar: pick('Calendar'), star: pick('Star'), device: pick('Tv'),
  unpair: pick('Unplug'), scan: pick('ScanLine'), key: pick('Key'), captions: pick('Captions'),
  sparkles: pick('Sparkles'), layers: pick('Layers'), signal: pick('Signal'), backspace: pick('Delete'),
  space: pick('Minus'), enter: pick('CornerDownLeft'),
};

export const TvIcon: React.FC<IconProps> = ({ name, size = 32, color = '#F4EFE7', filled }) => {
  const Cmp = iconMap[name] || L.Circle;
  return <Cmp width={size} height={size} color={color} strokeWidth={1.75} fill={filled ? color : 'none'} />;
};

// ── Player ────────────────────────────────────────────────────────────────

export const TvVideo: React.FC<VideoRendererProps> = ({
  sourceUrl,
  headers,
  paused,
  seekToMs,
  captionUrl,
  captionLabel,
  onProgress,
  onEnd,
  onError,
  onReady,
  onBuffer,
  style,
}) => {
  const ref = useRef<VideoRef>(null);
  useEffect(() => {
    if (seekToMs !== undefined) ref.current?.seek(seekToMs / 1000);
  }, [seekToMs]);

  if (!sourceUrl) {
    return (
      <View style={[style, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' }]}>
        <Text style={{ color: '#A8A199' }}>Preparing the stream…</Text>
      </View>
    );
  }

  return (
    <Video
      ref={ref}
      source={{ uri: sourceUrl, headers: headers || MEDIA_REQUEST_HEADERS }}
      paused={paused}
      resizeMode="contain"
      style={style}
      onProgress={(e) => onProgress?.(e.currentTime * 1000, Number.isFinite(e.seekableDuration) ? e.seekableDuration * 1000 : undefined)}
      onEnd={() => onEnd?.()}
      onError={(e) => onError?.(e.error?.localizedDescription || e.error?.errorString || 'Playback failed')}
      onReadyForDisplay={() => { onReady?.(); onBuffer?.(false); }}
      onBuffer={(e) => onBuffer?.(e.isBuffering)}
      textTracks={captionUrl ? [{ title: captionLabel || 'Subtitles', language: captionLabel || 'en', uri: captionUrl }] : undefined}
      selectedTextTrack={captionUrl ? { type: 'index', value: 0 } : { type: 'disabled' }}
    />
  );
};

export const TvQrCode: React.FC<QrRendererProps> = ({ value, size, color = '#F4EFE7', background = '#171A21' }) => (
  <QRCode value={value} size={size} color={color} backgroundColor={background} />
);

// ── Remote keys (react-native-tvos) ───────────────────────────────────────

export function useTvRemoteKeys(handler: (key: RemoteKey) => void): void {
  const ref = useRef(handler);
  ref.current = handler;
  useTVEventHandler((event: { eventType?: string }) => {
    const map: Record<string, RemoteKey> = {
      up: 'up', down: 'down', left: 'left', right: 'right',
      select: 'select', back: 'back', playPause: 'playPause', menu: 'menu',
    };
    const key = event.eventType ? map[event.eventType] : undefined;
    if (key) ref.current(key);
  });
}

// ── Services ──────────────────────────────────────────────────────────────

export const tvServices: PlatformServices = {
  Icon: TvIcon,
  Video: TvVideo,
  QrCode: TvQrCode,
  Scanner: null,
  downloads: null,
  haptics: { light: () => {} },
  openSettings: () => { void Linking.openSettings(); },
  useRemoteKeys: useTvRemoteKeys,
  isWeb: false,
};
