import React, { useEffect, useRef, useState } from 'react';
import * as Lucide from 'lucide-react';
import QRCode from 'qrcode';
import type {
  IconName,
  IconProps,
  PlatformServices,
  QrRendererProps,
  RemoteKey,
  VideoRendererProps,
} from '@hallyu/ui';
import type { KeyValueStore } from '@hallyu/shared';

const L = Lucide as unknown as Record<string, React.ComponentType<any>>;
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

export const WebIcon: React.FC<IconProps> = ({ name, size = 24, color = '#F4EFE7', filled }) => {
  const Cmp = iconMap[name] || L.Circle;
  return <Cmp size={size} color={color} strokeWidth={1.75} fill={filled ? color : 'none'} />;
};

/** Browser `<video>` cannot set Referer/Origin headers. That limitation is stated, never proxied around. */
export const WebVideo: React.FC<VideoRendererProps> = ({
  sourceUrl,
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
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (paused) video.pause();
    else void video.play().catch(() => onError?.('The browser blocked playback. Start it with the Play control.'));
  }, [paused, sourceUrl, onError]);

  useEffect(() => {
    if (seekToMs !== undefined && ref.current) ref.current.currentTime = seekToMs / 1000;
  }, [seekToMs]);

  if (!sourceUrl) {
    return (
      <div style={{ ...((style as React.CSSProperties) || {}), display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#A8A199', fontFamily: 'system-ui', padding: 24, textAlign: 'center' }}>
        Preparing the stream… This browser preview cannot set the required media headers. On device, video is fetched directly from the provider CDN.
      </div>
    );
  }

  return (
    <video
      ref={ref}
      src={sourceUrl}
      style={{ ...((style as React.CSSProperties) || {}), width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
      autoPlay
      playsInline
      controls={false}
      onTimeUpdate={(e) => {
        const v = e.currentTarget;
        onProgress?.(v.currentTime * 1000, Number.isFinite(v.duration) ? v.duration * 1000 : undefined);
      }}
      onCanPlay={() => { onReady?.(); onBuffer?.(false); }}
      onWaiting={() => onBuffer?.(true)}
      onPlaying={() => onBuffer?.(false)}
      onEnded={() => onEnd?.()}
      onError={() => onError?.('Browser could not play this source. The required media headers cannot be set in a browser.')}
    >
      {captionUrl && <track kind="subtitles" src={captionUrl} srcLang={captionLabel || 'en'} label={captionLabel || 'Subtitles'} default />}
    </video>
  );
};

export const WebQrCode: React.FC<QrRendererProps> = ({ value, size, color = '#F4EFE7', background = '#171A21' }) => {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    QRCode.toDataURL(value, { width: size, margin: 1, color: { dark: color, light: background } })
      .then((url) => { if (active) setDataUrl(url); })
      .catch(() => { if (active) setDataUrl(null); });
    return () => { active = false; };
  }, [value, size, color, background]);
  if (!dataUrl) return <div style={{ width: size, height: size, background }} />;
  return <img src={dataUrl} width={size} height={size} alt="Pairing code" style={{ borderRadius: 8 }} />;
};

export function useWebRemoteKeys(handler: (key: RemoteKey) => void): void {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    const map: Record<string, RemoteKey> = {
      ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
      Enter: 'select', Escape: 'back', ' ': 'playPause', MediaPlayPause: 'playPause', ContextMenu: 'menu',
    };
    const onKey = (event: KeyboardEvent) => {
      const key = map[event.key];
      if (!key) return;
      if (event.key !== 'ContextMenu' && event.key !== 'MediaPlayPause') event.preventDefault();
      ref.current(key);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

export const webStorage: KeyValueStore = {
  async getItem(key) { return window.localStorage.getItem(key); },
  async setItem(key, value) { window.localStorage.setItem(key, value); },
  async removeItem(key) { window.localStorage.removeItem(key); },
};

export const webServices: PlatformServices = {
  Icon: WebIcon,
  Video: WebVideo,
  QrCode: WebQrCode,
  Scanner: null,
  downloads: null,
  haptics: { light: () => {} },
  openSettings: () => {},
  useRemoteKeys: useWebRemoteKeys,
  isWeb: true,
};
