import { supabase } from '../lib/supabase';
import { useSupabaseQuery } from './useSupabaseQuery';

/** Confirmed transfers, filtered by day and collector. */
export function useTransfersReport({ from = '', to = '', collectorId = '' } = {}) {
  return useSupabaseQuery(async () => {
    const { data, error } = await supabase.rpc('nn_transfers_report', {
      p_from: from || null,
      p_to: to || null,
      p_collector: collectorId || null,
    });
    if (error) throw error;
    return data ?? [];
  }, [from, to, collectorId]);
}