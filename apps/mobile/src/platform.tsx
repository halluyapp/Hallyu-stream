import React, { useEffect, useRef } from 'react';
import { BackHandler, Linking, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LucideRN from 'lucide-react-native';
import Video, { type VideoRef } from 'react-native-video';
import QRCode from 'react-native-qrcode-svg';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import {
  MEDIA_REQUEST_HEADERS,
  library,
  zarhosting,
  type KeyValueStore,
} from '@hallyu/shared';
import type {
  DownloadManager,
  IconName,
  IconProps,
  PlatformServices,
  QrRendererProps,
  RemoteKey,
  ScannerRendererProps,
  VideoRendererProps,
} from '@hallyu/ui';

// ── Storage adapters ──────────────────────────────────────────────────────

export const asyncStorageAdapter: KeyValueStore = {
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
  removeItem: (key) => AsyncStorage.removeItem(key),
};

export const secureStorageAdapter: KeyValueStore = {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: async (key, value) => { await SecureStore.setItemAsync(key, value); },
  removeItem: async (key) => { await SecureStore.deleteItemAsync(key); },
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

export const NativeIcon: React.FC<IconProps> = ({ name, size = 24, color = '#F4EFE7', filled }) => {
  const Cmp = iconMap[name] || L.Circle;
  return <Cmp width={size} height={size} color={color} strokeWidth={1.75} fill={filled ? color : 'none'} />;
};

// ── Player ────────────────────────────────────────────────────────────────

export const NativeVideo: React.FC<VideoRendererProps> = ({
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

// ── QR ────────────────────────────────────────────────────────────────────

export const NativeQrCode: React.FC<QrRendererProps> = ({ value, size, color = '#F4EFE7', background = '#171A21' }) => (
  <QRCode value={value} size={size} color={color} backgroundColor={background} />
);

// ── Scanner ───────────────────────────────────────────────────────────────

export const NativeScanner: React.FC<ScannerRendererProps> = ({ onDetected, torchEnabled, onCancel }) => {
  const [permission, requestPermission] = useCameraPermissions();
  useEffect(() => {
    if (!permission?.granted) void requestPermission();
  }, [permission?.granted, requestPermission]);

  if (!permission?.granted) {
    return (
      <View style={[StyleSheet.absoluteFillObject, { alignItems: 'center', justifyContent: 'center', padding: 24 }]}>
        <Text style={{ color: '#F4EFE7', textAlign: 'center' }}>
          Camera access is off. Enter the code shown on your TV instead.
        </Text>
      </View>
    );
  }

  return (
    <CameraView
      style={StyleSheet.absoluteFillObject}
      facing="back"
      enableTorch={Boolean(torchEnabled)}
      barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      onBarcodeScanned={(result) => onDetected(result.data)}
    />
  );
};

// ── Downloads (foreground, device-only, integrity-checked) ────────────────

const resumables = new Map<string, FileSystem.DownloadResumable>();

async function downloadDir(): Promise<string> {
  const dir = `${FileSystem.documentDirectory}downloads/`;
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  return dir;
}

async function updateEntry(id: string, patch: Record<string, unknown>): Promise<void> {
  const items = await library.getDownloads();
  const existing = items.find((item) => item.id === id);
  if (!existing) return;
  await library.upsertDownload({ ...existing, ...patch, updatedAt: Date.now() } as never);
}

export const nativeDownloads: DownloadManager = {
  async start(entry) {
    const dir = await downloadDir();
    const fileUri = `${dir}${entry.id}.mp4`;
    await updateEntry(entry.id, { status: 'downloading', localPath: fileUri, bytes: 0 });
    const resumable = FileSystem.createDownloadAsync(
      entry.url,
      fileUri,
      { headers: MEDIA_REQUEST_HEADERS },
      (progress) => {
        void updateEntry(entry.id, {
          status: 'downloading',
          bytes: progress.totalBytesWritten,
          totalBytes: progress.totalBytesExpectedToWrite,
        });
      },
    );
    resumables.set(entry.id, resumable);
    try {
      const result = await resumable.downloadAsync();
      const info = result ? await FileSystem.getInfoAsync(result.uri) : null;
      const valid = Boolean(info?.exists && (info as { size?: number }).size && (info as { size?: number }).size! > 0);
      if (!valid) {
        await updateEntry(entry.id, { status: 'failed', reason: 'The downloaded file was incomplete.' });
        return;
      }
      await updateEntry(entry.id, {
        status: 'complete',
        localPath: result?.uri,
        bytes: (info as { size?: number }).size,
        totalBytes: (info as { size?: number }).size,
        reason: undefined,
      });
    } catch (error) {
      await updateEntry(entry.id, {
        status: 'failed',
        reason: error instanceof Error ? error.message : 'Download failed.',
      });
    }
  },
  async pause(id) {
    const resumable = resumables.get(id);
    if (resumable) await resumable.pauseAsync();
    await updateEntry(id, { status: 'paused' });
  },
  async resume(id) {
    const resumable = resumables.get(id);
    if (resumable) await resumable.resumeAsync();
    await updateEntry(id, { status: 'downloading' });
  },
  async cancel(id) {
    const resumable = resumables.get(id);
    if (resumable) await resumable.cancelAsync();
    resumables.delete(id);
    await library.removeDownload(id);
  },
  async retry(id) {
    const items = await library.getDownloads();
    const entry = items.find((item) => item.id === id);
    if (!entry) return;
    // Fresh signed URL — never reuse the expired one (`05` §2).
    const stream = await zarhosting.getStream({
      subjectId: entry.subjectId,
      detailPath: entry.detailPath,
      season: entry.season,
      episode: entry.episode,
    });
    const source = stream.sources.find((s) => s.resolution === entry.quality) || stream.sources[0];
    if (!source) {
      await updateEntry(id, { status: 'failed', reason: 'No playable source is available now.' });
      return;
    }
    await nativeDownloads.start({ id, url: source.url, title: entry.title, quality: entry.quality });
  },
};

// ── Remote back (phone hardware back → nav back) ──────────────────────────

export function useNativeRemoteKeys(handler: (key: RemoteKey) => void): void {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      ref.current('back');
      return true;
    });
    return () => subscription.remove();
  }, []);
}

// ── Services ──────────────────────────────────────────────────────────────

export const nativeServices: PlatformServices = {
  Icon: NativeIcon,
  Video: NativeVideo,
  QrCode: NativeQrCode,
  Scanner: NativeScanner,
  downloads: nativeDownloads,
  haptics: { light: () => { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } },
  openSettings: () => { void Linking.openSettings(); },
  useRemoteKeys: useNativeRemoteKeys,
  isWeb: false,
};
