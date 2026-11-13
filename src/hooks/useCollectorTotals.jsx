import { supabase } from '../lib/supabase';
import { useSupabaseQuery } from './useSupabaseQuery';

/** Honest cash and transfer figures for one collector, from the database. */
export function useCollectorTotals(collectorId) {
  return useSupabaseQuery(
    async () => {
      const [totals, today] = await Promise.all([
        supabase.rpc('nn_collector_totals', { p_collector: collectorId }),
        supabase.rpc('nn_cash_position', { p_collector: collectorId }),
      ]);
      if (totals.error) throw totals.error;
      if (today.error) throw today.error;

      return {
        ...(totals.data?.[0] || {}),
        cash_today: today.data?.[0]?.cash_today ?? 0,
        transfer_today: today.data?.[0]?.transfer_today ?? 0,
      };
    },
    [collectorId],
    { enabled: !!collectorId }
  );
}