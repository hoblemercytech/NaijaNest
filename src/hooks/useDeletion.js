import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useSupabaseQuery } from './useSupabaseQuery';
import { useAuth } from '../context/AuthContext';

/** Whether this person has an open deletion request. */
export function useMyDeletionRequest() {
  const { user } = useAuth();
  return useSupabaseQuery(
    async () => {
      const { data, error } = await supabase.rpc('nn_my_deletion_request');
      if (error) throw error;
      return data?.[0] ?? null;
    },
    [user?.id],
    { enabled: !!user }
  );
}

/** The admin queue. */
export function useDeletionQueue() {
  return useSupabaseQuery(async () => {
    const { data, error } = await supabase.rpc('nn_deletion_queue');
    if (error) throw error;
    return data ?? [];
  }, []);
}

export function useDeletionActions() {
  const request = useCallback(async (reason) => {
    const { error } = await supabase.rpc('nn_request_account_deletion', {
      p_reason: reason || null,
    });
    if (error) throw error;
  }, []);

  const cancel = useCallback(async () => {
    const { error } = await supabase.rpc('nn_cancel_account_deletion');
    if (error) throw error;
  }, []);

  const complete = useCallback(async (requestId, note) => {
    const { data, error } = await supabase.rpc('nn_complete_account_deletion', {
      p_request: requestId,
      p_note: note || null,
    });
    if (error) throw error;
    return data;
  }, []);

  const refuse = useCallback(async (requestId, note) => {
    const { error } = await supabase.rpc('nn_refuse_account_deletion', {
      p_request: requestId,
      p_note: note,
    });
    if (error) throw error;
  }, []);

  return { request, cancel, complete, refuse };
}