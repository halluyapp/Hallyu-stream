import {useCallback, useEffect, useRef, useState} from 'react';

export interface AsyncState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  refreshing: boolean;
  reload: (silent?: boolean) => void;
}

/** Minimal async loader with abort-on-unmount and a pull-to-refresh flag. */
export function useAsync<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  deps: unknown[],
): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [nonce, setNonce] = useState(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    const controller = new AbortController();
    let alive = true;
    setError(null);
    if (data === null) {
      setLoading(true);
    }
    fnRef
      .current(controller.signal)
      .then(result => {
        if (alive) {
          setData(result);
          setError(null);
        }
      })
      .catch((e: any) => {
        if (alive && e?.name !== 'AbortError') {
          setError(e?.message ?? 'Something went wrong.');
        }
      })
      .finally(() => {
        if (alive) {
          setLoading(false);
          setRefreshing(false);
        }
      });
    return () => {
      alive = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  const reload = useCallback((silent?: boolean) => {
    if (!silent) {
      setRefreshing(true);
    }
    setNonce(n => n + 1);
  }, []);

  return {data, error, loading, refreshing, reload};
}

export function useDebounced<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
