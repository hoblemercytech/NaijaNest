import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Re-runs a refetch when rows change in the tables a screen depends on.
 *
 * Installed as a PWA there is no address bar and no pull-to-refresh, so a
 * collector could stare at yesterday's total for an hour. This closes that.
 *
 * Two deliberate choices:
 *
 *   - Changes are debounced. Activating a 365-day cycle inserts 365 rows in
 *     one transaction; without this that is 365 refetches.
 *   - RLS applies to realtime exactly as it does to queries, so a collector
 *     only ever receives events for rows they can already read. The filter
 *     here is about noise, not access.
 */
export function useRealtime(tables, onChange, { enabled = true, delay = 400 } = {}) {
  const handler = useRef(onChange);

  // Assigned in an effect, not during render — writing to a ref while
  // rendering makes the component impure.
  useEffect(() => {
    handler.current = onChange;
  });

  const key = Array.isArray(tables) ? tables.join(',') : String(tables || '');

  useEffect(() => {
    if (!enabled || !key) return undefined;

    let timer = null;
    const ping = () => {
      clearTimeout(timer);
      timer = setTimeout(() => handler.current?.(), delay);
    };

    const channel = supabase.channel(`live:${key}:${Math.random().toString(36).slice(2, 8)}`);
    key.split(',').forEach((table) => {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, ping);
    });
    channel.subscribe();

    // Realtime sockets drop when a phone sleeps or the app is backgrounded, and
    // the client reconnects silently — but any change during that gap is lost.
    // Refetching on return is what stops a collector seeing a stale total.
    const onVisible = () => {
      if (document.visibilityState === 'visible') ping();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', ping);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', ping);
      supabase.removeChannel(channel);
    };
  }, [key, enabled, delay]);
}

/** The tables each role's screens actually depend on. */
export const LIVE_TABLES = {
  USER: ['daily_contributions', 'contribution_cycles', 'withdrawals', 'profiles'],
  COLLECTOR: ['daily_contributions', 'contribution_cycles', 'withdrawals', 'cash_handovers'],
  ADMIN: ['daily_contributions', 'contribution_cycles', 'withdrawals', 'cash_handovers', 'kyc_submissions'],
};