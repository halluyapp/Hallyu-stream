import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Pressable, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import { useRemoteKeys, type RemoteKey } from '../platform/context';
import { focusStyle } from '../theme';
import { useSettings } from '../platform/context';

type Direction = 'up' | 'down' | 'left' | 'right';

interface FocusItem {
  id: string;
  scope: string;
  x: number;
  y: number;
  width: number;
  height: number;
  disabled?: boolean;
  onSelect?: () => void;
}

interface FocusApi {
  focusedId: string | null;
  setFocused(id: string): void;
  register(id: string, item: Omit<FocusItem, 'id'>): void;
  unregister(id: string): void;
  setScope(scope: string): void;
  move(direction: Direction): void;
  select(): void;
  scope: string;
}

const FocusContext = createContext<FocusApi | null>(null);

export function FocusProvider({
  children,
  initialScope = 'root',
  onBack,
  onPlayPause,
  onMenu,
}: {
  children: ReactNode;
  initialScope?: string;
  onBack?: () => void;
  onPlayPause?: () => void;
  onMenu?: () => void;
}) {
  const items = useRef(new Map<string, FocusItem>());
  const lastByScope = useRef(new Map<string, string>());
  const [scope, setScopeState] = useState(initialScope);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const focusedRef = useRef<string | null>(null);
  const scopeRef = useRef(scope);
  const contentScopeRef = useRef<string>(initialScope === 'rail' ? 'home' : initialScope);

  useEffect(() => {
    focusedRef.current = focusedId;
  }, [focusedId]);
  useEffect(() => {
    scopeRef.current = scope;
  }, [scope]);

  const register = useCallback((id: string, item: Omit<FocusItem, 'id'>) => {
    items.current.set(id, { id, ...item });
  }, []);

  const unregister = useCallback((id: string) => {
    items.current.delete(id);
  }, []);

  const setFocused = useCallback((id: string) => {
    const item = items.current.get(id);
    if (!item || item.disabled) return;
    setFocusedId(id);
    lastByScope.current.set(item.scope, id);
  }, []);

  const setScope = useCallback((next: string) => {
    setScopeState(next);
    if (next !== 'rail') contentScopeRef.current = next;
    const remembered = lastByScope.current.get(next);
    if (remembered && items.current.has(remembered)) {
      setFocusedId(remembered);
      return;
    }
    const first = Array.from(items.current.values()).find((item) => item.scope === next && !item.disabled);
    setFocusedId(first ? first.id : null);
  }, []);

  const move = useCallback((direction: Direction) => {
    const currentId = focusedRef.current;
    const current = currentId ? items.current.get(currentId) : undefined;
    const candidates = Array.from(items.current.values()).filter(
      (item) => !item.disabled && item.scope === scopeRef.current,
    );
    if (!candidates.length) return;
    if (!current) {
      setFocused(candidates[0].id);
      return;
    }
    const cx = current.x + current.width / 2;
    const cy = current.y + current.height / 2;
    let best: { item: FocusItem; score: number } | null = null;
    for (const item of candidates) {
      if (item.id === current.id) continue;
      const x = item.x + item.width / 2;
      const y = item.y + item.height / 2;
      const dx = x - cx;
      const dy = y - cy;
      const primary = direction === 'left' ? -dx : direction === 'right' ? dx : direction === 'up' ? -dy : dy;
      const secondary = direction === 'left' || direction === 'right' ? Math.abs(dy) : Math.abs(dx);
      if (primary <= 8) continue;
      const score = primary + secondary * 2;
      if (!best || score < best.score) best = { item, score };
    }
    // Left edge → rail; right edge of rail → last content pane (`5.3`, `5.6`).
    if (!best && direction === 'left' && scopeRef.current !== 'rail') {
      setScope('rail');
      return;
    }
    if (!best && direction === 'right' && scopeRef.current === 'rail') {
      setScope(contentScopeRef.current);
      return;
    }
    // Rail wraps vertically; shelves do not wrap sideways — fall back to the nearest same-scope item.
    if (!best) {
      const fallback = candidates
        .filter((item) => item.id !== current.id)
        .sort((a, b) => {
          const da = Math.abs(a.x - cx) + Math.abs(a.y - cy);
          const db = Math.abs(b.x - cx) + Math.abs(b.y - cy);
          return da - db;
        })[0];
      if (fallback) setFocused(fallback.id);
      return;
    }
    setFocused(best.item.id);
  }, [setFocused, setScope]);

  const select = useCallback(() => {
    const id = focusedRef.current;
    if (!id) return;
    items.current.get(id)?.onSelect?.();
  }, []);

  const handlerRef = useRef<(key: RemoteKey) => void>(() => {});
  useEffect(() => {
    handlerRef.current = (key: RemoteKey) => {
      switch (key) {
        case 'up':
        case 'down':
        case 'left':
        case 'right':
          move(key);
          break;
        case 'select':
          select();
          break;
        case 'back':
          onBack?.();
          break;
        case 'playPause':
          onPlayPause?.();
          break;
        case 'menu':
          onMenu?.();
          break;
      }
    };
  }, [move, select, onBack, onPlayPause, onMenu]);

  useRemoteKeys((key) => handlerRef.current(key));

  const api = useMemo<FocusApi>(
    () => ({ focusedId, setFocused, register, unregister, setScope, move, select, scope }),
    [focusedId, setFocused, register, unregister, setScope, move, select, scope],
  );
  return <FocusContext.Provider value={api}>{children}</FocusContext.Provider>;
}

export function useFocus(): FocusApi {
  const ctx = useContext(FocusContext);
  if (!ctx) throw new Error('FocusProvider is missing');
  return ctx;
}

export function useFocusScope(scope: string): void {
  const { setScope } = useFocus();
  useEffect(() => {
    setScope(scope);
  }, [scope, setScope]);
}

export function Focusable({
  id,
  scope = 'root',
  onSelect,
  children,
  style,
  disabled,
  autoFocus,
}: {
  id: string;
  scope?: string;
  onSelect?: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  autoFocus?: boolean;
}) {
  const ref = useRef<View>(null);
  const { register, unregister, focusedId, setFocused } = useFocus();
  const { settings } = useSettings();
  const focused = focusedId === id;

  const measure = useCallback(() => {
    ref.current?.measureInWindow((x, y, width, height) => {
      register(id, { scope, x, y, width, height, disabled, onSelect });
    });
  }, [id, scope, disabled, onSelect, register]);

  useEffect(() => {
    measure();
    if (autoFocus) setFocused(id);
    return () => unregister(id);
  }, [measure, autoFocus, id, setFocused, unregister]);

  const onLayout = (_e: LayoutChangeEvent) => measure();

  return (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      accessibilityState={{ disabled, selected: focused }}
      disabled={disabled}
      onLayout={onLayout}
      onPress={() => {
        if (disabled) return;
        setFocused(id);
        onSelect?.();
      }}
      style={[style, focused && focusStyle(true, settings.reduceMotion)]}
    >
      {children}
    </Pressable>
  );
}
