import { useCallback, useEffect, useRef, useState } from 'react';
import { friendlyError } from '../lib/errors';

/**
 * Small wrapper around a Supabase query so every screen gets the same
 * loading / error / empty contract without repeating the boilerplate.
 *
 * Loading is derived, not stored. Each render computes a `key` describing the
 * request the caller currently wants; state holds the key of the request that
 * last resolved. If the two differ, we're loading. That means the effect never
 * calls setState synchronously — it only does so once a response has landed —
 * so there is no cascading render on mount or on any dependency change.
 *
 * `run` is a fresh closure every render, so it lives in a ref that is refreshed
 * in its own effect rather than assigned during render.
 */
export function useSupabaseQuery(run, deps = [], { enabled = true } = {}) {
  const [tick, setTick] = useState(0);
  const refetch = useCallback(() => setTick((t) => t + 1), []);

  // Plain render-time computation — no hook, no dependency array to get wrong.
  const key = JSON.stringify([deps, enabled, tick]);

  const [settled, setSettled] = useState({ key: null, data: null, error: null });

  const runRef = useRef(run);
  useEffect(() => {
    runRef.current = run;
  });

  useEffect(() => {
    if (!enabled) return undefined;

    let alive = true;
    (async () => {
      try {
        const data = await runRef.current();
        if (alive) setSettled({ key, data, error: null });
      } catch (err) {
        if (alive) setSettled({ key, data: null, error: friendlyError(err) });
      }
    })();

    return () => {
      alive = false;
    };
  }, [key, enabled]);

  const isCurrent = settled.key === key;

  /** Optimistic local edits, e.g. marking a notification read. */
  const setData = useCallback((updater) => {
    setSettled((prev) => ({
      ...prev,
      data: typeof updater === 'function' ? updater(prev.data) : updater,
    }));
  }, []);

  return {
    data: isCurrent ? settled.data : null,
    loading: enabled && !isCurrent,
    error: isCurrent ? settled.error : null,
    refetch,
    setData,
  };
}

/**
 * Awaits a Supabase query and returns its rows, throwing on error so
 * useSupabaseQuery can turn it into an error state.
 *
 * This has to await. `supabase.from(...).select(...)` returns a builder, not a
 * result — destructuring it directly reads undefined off the builder and hands
 * back undefined rows with no error, which surfaces as a screen that renders
 * nothing at all. Awaiting an already-resolved result is harmless, so callers
 * may pass either the builder or an awaited response.
 */
export async function unwrap(query) {
  const { data, error } = await query;
  if (error) throw error;
  return data;
}