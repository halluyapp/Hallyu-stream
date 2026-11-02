import { useCallback, useEffect, useRef, useState } from 'react';
import {
  library,
  zarhosting,
  type DetailPayload,
  type HomePayload,
  type SearchResult,
  type StreamPayload,
  type StreamSource,
  type Title,
} from '@hallyu/shared';
import { useLibraryVersion } from '../platform/context';

function messageOf(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'The catalogue is unavailable.';
}

export interface HomeState {
  loading: boolean;
  data: HomePayload | null;
  error: string | null;
  cached: boolean;
  reload: () => void;
}

export function useHome(refreshKey = 0): HomeState {
  const [state, setState] = useState<Omit<HomeState, 'reload'>>({
    loading: true,
    data: null,
    error: null,
    cached: false,
  });
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((v) => v + 1), []);

  useEffect(() => {
    let active = true;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    zarhosting
      .getHome()
      .then(async (data) => {
        await library.writeHomeCache({ ...data, cachedAt: Date.now() });
        if (active) setState({ loading: false, data, error: null, cached: false });
      })
      .catch(async (error) => {
        const cached = await library.readHomeCache<HomePayload & { cachedAt: number }>();
        if (active) {
          setState({
            loading: false,
            data: cached ?? null,
            error: messageOf(error),
            cached: Boolean(cached),
          });
        }
      });
    return () => {
      active = false;
    };
  }, [tick, refreshKey]);

  return { ...state, reload };
}

export interface SearchState {
  loading: boolean;
  results: Title[];
  error: string | null;
  query: string;
  hasMore: boolean;
  page: number;
  setQuery: (q: string) => void;
  submit: (q?: string) => Promise<void>;
  loadMore: () => Promise<void>;
  clear: () => void;
}

export function useSearch(initialQuery = ''): SearchState {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Title[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const requestId = useRef(0);

  const run = useCallback(async (q: string, nextPage: number, append: boolean) => {
    const id = ++requestId.current;
    if (q.trim().length < 2) {
      setResults([]);
      setLoading(false);
      setError(null);
      setHasMore(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result: SearchResult = await zarhosting.search(q.trim(), nextPage);
      if (id !== requestId.current) return;
      setResults((prev) => (append ? [...prev, ...result.titles] : result.titles));
      setPage(result.page);
      setHasMore(result.hasMore);
    } catch (err) {
      if (id === requestId.current) setError(messageOf(err));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => {
      void run(query, 1, false);
    }, 300);
    return () => clearTimeout(handle);
  }, [query, run]);

  const submit = useCallback(
    async (q?: string) => {
      const value = (q ?? query).trim();
      setQuery(value);
      if (value.length >= 2) await library.addSearchQuery(value);
      await run(value, 1, false);
    },
    [query, run],
  );

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await run(query, page + 1, true);
  }, [hasMore, loading, query, page, run]);

  const clear = useCallback(() => {
    setQuery('');
    setResults([]);
    setError(null);
    setHasMore(false);
  }, []);

  return { loading, results, error, query, hasMore, page, setQuery, submit, loadMore, clear };
}

export interface DetailState {
  loading: boolean;
  data: DetailPayload | null;
  error: string | null;
  reload: () => void;
}

export function useDetail(detailPath?: string): DetailState {
  const [state, setState] = useState<Omit<DetailState, 'reload'>>({ loading: Boolean(detailPath), data: null, error: null });
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((v) => v + 1), []);

  useEffect(() => {
    if (!detailPath) {
      setState({ loading: false, data: null, error: null });
      return;
    }
    let active = true;
    setState({ loading: true, data: null, error: null });
    zarhosting
      .getDetail(detailPath)
      .then((data) => {
        if (active) setState({ loading: false, data, error: null });
      })
      .catch((error) => {
        if (active) setState({ loading: false, data: null, error: messageOf(error) });
      });
    return () => {
      active = false;
    };
  }, [detailPath, tick]);

  return { ...state, reload };
}

export interface StreamState {
  loading: boolean;
  data: StreamPayload | null;
  error: string | null;
  reload: () => void;
}

export function useStream(
  params: { subjectId: string; detailPath: string; season: number; episode: number } | null,
): StreamState {
  const [state, setState] = useState<Omit<StreamState, 'reload'>>({ loading: Boolean(params), data: null, error: null });
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((v) => v + 1), []);
  const key = params ? `${params.subjectId}|${params.season}|${params.episode}` : '';

  useEffect(() => {
    if (!params) {
      setState({ loading: false, data: null, error: null });
      return;
    }
    let active = true;
    setState({ loading: true, error: null, data: null });
    zarhosting
      .resolveStream(params)
      .then((data) => {
        if (active) setState({ loading: false, data, error: data.sources.length ? null : 'No playable sources returned.', });
      })
      .catch((error) => {
        if (active) setState({ loading: false, data: null, error: messageOf(error) });
      });
    return () => {
      active = false;
    };
  }, [key, tick]);

  return { ...state, reload };
}

export function useLibraryList<T>(getter: () => Promise<T[]>): T[] {
  const version = useLibraryVersion();
  const [items, setItems] = useState<T[]>([]);
  const getterRef = useRef(getter);
  getterRef.current = getter;
  useEffect(() => {
    let active = true;
    getterRef.current().then((next) => {
      if (active) setItems(next);
    });
    return () => {
      active = false;
    };
  }, [version]);
  return items;
}

export function useSelectedSource(
  stream: StreamPayload | null,
  quality: string,
): StreamSource | undefined {
  if (!stream) return undefined;
  if (quality === 'auto') {
    return stream.sources.find((s) => /480|360/.test(s.resolution || '')) || stream.sources[0];
  }
  return stream.sources.find((s) => (s.resolution || '').toLowerCase() === quality.toLowerCase()) || stream.sources[0];
}
