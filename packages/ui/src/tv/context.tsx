import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { Title } from '@hallyu/shared';

export type TvPane = 'home' | 'explore' | 'search' | 'library' | 'settings' | 'devices';

export interface TvRoute {
  name: 'detail' | 'player';
  title: Title;
  season: number;
  episode: number;
  startPositionMs?: number;
}

export interface TvNavApi {
  pane: TvPane;
  stack: TvRoute[];
  keyboardVisible: boolean;
  settingsOpen: boolean;
  switchPane(pane: TvPane): void;
  openDetail(title: Title): void;
  openPlayer(title: Title, season: number, episode: number, startPositionMs?: number): void;
  back(): void;
  setKeyboardVisible(value: boolean): void;
  setSettingsOpen(value: boolean): void;
  unpairLocal(): void;
}

const TvNavContext = createContext<TvNavApi | null>(null);

export function TvNavProvider({ value, children }: { value: TvNavApi; children: ReactNode }) {
  const memo = useMemo(() => value, [value]);
  return <TvNavContext.Provider value={memo}>{children}</TvNavContext.Provider>;
}

export function useTvNav(): TvNavApi {
  const ctx = useContext(TvNavContext);
  if (!ctx) throw new Error('TvNavProvider is missing');
  return ctx;
}
