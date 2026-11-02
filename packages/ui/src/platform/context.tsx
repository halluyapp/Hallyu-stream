import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react';
import { Text, type ViewStyle } from 'react-native';
import { DEFAULT_SETTINGS, library, type Settings } from '@hallyu/shared';

export type IconName =
  | 'home' | 'compass' | 'search' | 'library' | 'settings' | 'tv' | 'qr' | 'bookmark'
  | 'download' | 'play' | 'pause' | 'replay' | 'seekBack' | 'seekForward' | 'cc'
  | 'quality' | 'audio' | 'expand' | 'chevronLeft' | 'chevronRight' | 'close' | 'clear'
  | 'clock' | 'check' | 'alert' | 'trash' | 'flash' | 'plus' | 'minus' | 'more'
  | 'info' | 'wifi' | 'storage' | 'refresh' | 'arrowLeft' | 'arrowRight' | 'arrowUp'
  | 'arrowDown' | 'keyboard' | 'checkCircle' | 'x' | 'filter' | 'grid' | 'list'
  | 'skip' | 'volume' | 'brightness' | 'menu' | 'link' | 'shield' | 'eye'
  | 'eyeOff' | 'film' | 'calendar' | 'star' | 'device' | 'unpair' | 'scan' | 'key'
  | 'captions' | 'sparkles' | 'layers' | 'signal' | 'backspace' | 'space' | 'enter';

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  filled?: boolean;
}

export type RemoteKey =
  | 'up' | 'down' | 'left' | 'right' | 'select' | 'back' | 'playPause' | 'menu';

export interface VideoRendererProps {
  sourceUrl?: string;
  headers?: Record<string, string>;
  paused: boolean;
  seekToMs?: number;
  captionUrl?: string;
  captionLabel?: string;
  onProgress?: (positionMs: number, durationMs?: number) => void;
  onEnd?: () => void;
  onError?: (message: string) => void;
  onReady?: () => void;
  onBuffer?: (buffering: boolean) => void;
  style?: ViewStyle;
}

export interface QrRendererProps {
  value: string;
  size: number;
  color?: string;
  background?: string;
}

export interface ScannerRendererProps {
  onDetected: (payload: string) => void;
  onCancel?: () => void;
  torchEnabled?: boolean;
  onToggleTorch?: () => void;
}

export interface DownloadManager {
  start(entry: { id: string; url: string; title: string; quality?: string }): Promise<void>;
  pause(id: string): Promise<void>;
  resume(id: string): Promise<void>;
  cancel(id: string): Promise<void>;
  retry(id: string): Promise<void>;
}

export interface PlatformServices {
  Icon: ComponentType<IconProps>;
  Video: ComponentType<VideoRendererProps> | null;
  QrCode: ComponentType<QrRendererProps> | null;
  Scanner: ComponentType<ScannerRendererProps> | null;
  downloads: DownloadManager | null;
  haptics: { light(): void };
  openSettings(): void;
  /** Injected platform hook for TV remote keys. Web harness uses keydown; TV uses TVEventHandler. */
  useRemoteKeys(handler: (key: RemoteKey) => void): void;
  isWeb: boolean;
}

const FallbackIcon: ComponentType<IconProps> = ({ name, size = 24, color = '#F4EFE7' }) => (
  <Text style={{ color, fontSize: size * 0.6 }}>{name.slice(0, 1).toUpperCase()}</Text>
);

const noopRemoteKeys = (_handler: (key: RemoteKey) => void): void => {};

const defaultServices: PlatformServices = {
  Icon: FallbackIcon,
  Video: null,
  QrCode: null,
  Scanner: null,
  downloads: null,
  haptics: { light: () => {} },
  openSettings: () => {},
  useRemoteKeys: noopRemoteKeys,
  isWeb: false,
};

const PlatformContext = createContext<PlatformServices>(defaultServices);

export function PlatformProvider({
  services,
  children,
}: {
  services: Partial<PlatformServices> & Pick<PlatformServices, 'Icon'>;
  children: ReactNode;
}) {
  const value = useMemo<PlatformServices>(() => ({ ...defaultServices, ...services }), [services]);
  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>;
}

export function usePlatform(): PlatformServices {
  return useContext(PlatformContext);
}

export function Icon(props: IconProps) {
  const { Icon: Impl } = usePlatform();
  return <Impl {...props} />;
}

/** Re-render RN screens when the local-first library changes. */
export function useLibraryVersion(): number {
  const [version, setVersion] = useState(0);
  useEffect(() => library.subscribe(() => setVersion((v) => v + 1)), []);
  return version;
}

export function useSettings(): { settings: Settings; update: (patch: Partial<Settings>) => Promise<void> } {
  const version = useLibraryVersion();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  useEffect(() => {
    let active = true;
    library.getSettings().then((next) => {
      if (active) setSettings(next);
    });
    return () => {
      active = false;
    };
  }, [version]);
  const update = useCallback(async (patch: Partial<Settings>) => {
    await library.setSettings(patch);
  }, []);
  return { settings, update };
}

export function useRemoteKeys(handler: (key: RemoteKey) => void): void {
  const { useRemoteKeys: injected } = usePlatform();
  injected(handler);
}
