import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useSupabaseQuery } from './useSupabaseQuery';

export function usePaymentReview() {
  return useSupabaseQuery(async () => {
    const { data, error } = await supabase.rpc('nn_gateway_review_list');
    if (error) throw error;
    return data ?? [];
  }, []);
}

export function usePaymentReviewActions() {
  const resolve = useCallback(async (eventId, note) => {
    const { error } = await supabase.rpc('nn_gateway_resolve_event', {
      p_event_id: eventId, p_note: note,
    });
    if (error) throw error;
  }, []);

  const retry = useCallback(async (eventId) => {
    const { error } = await supabase.rpc('nn_gateway_retry_claim', { p_event_id: eventId });
    if (error) throw error;
  }, []);

  return { resolve, retry };
}