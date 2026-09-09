import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useSupabaseQuery, unwrap } from './useSupabaseQuery';

/**
 * Every number here comes from the database. Nothing is added up in the
 * browser — the view and the cycle_summary rollup are the source of truth,
 * so a stale render can never invent a balance.
 */
export function useFinancialSummary() {
  const { user } = useAuth();
  return useSupabaseQuery(
    async () => {
      const row = await unwrap(
        supabase
          .from('user_financial_summary')
          .select('total_contributed, total_withdrawn, current_balance')
          .eq('user_id', user.id)
          .maybeSingle()
      );
      // No rows yet simply means no contributions have been recorded.
      return row || { total_contributed: 0, total_withdrawn: 0, current_balance: 0 };
    },
    [user?.id],
    { enabled: !!user }
  );
}

/**
 * The one cycle a customer can act on. COMPLETED counts as open because the
 * money is still sitting there until a withdrawal closes it.
 */
export function useOpenCycle() {
  const { user } = useAuth();
  return useSupabaseQuery(
    async () => {
      const cycle = await unwrap(
        supabase
          .from('contribution_cycles')
          .select(`
            id, status, daily_amount_snapshot, duration_days, start_date,
            expected_end_date, activated_at, rejection_reason, created_at,
            collector:profiles!contribution_cycles_collector_id_fkey(id, full_name, phone)
          `)
          .in('status', ['PENDING_ACTIVATION', 'ACTIVE', 'COMPLETED'])
          .maybeSingle()
      );
      if (!cycle) return null;

      const rollup = await unwrap(
        supabase
          .from('cycle_summary')
          .select('days_paid, days_missed, contributed, withdrawn')
          .eq('cycle_id', cycle.id)
          .maybeSingle()
      );

      return { ...cycle, ...(rollup || { days_paid: 0, days_missed: 0, contributed: 0, withdrawn: 0 }) };
    },
    [user?.id],
    { enabled: !!user }
  );
}

/** Day-by-day schedule for one cycle. */
export function useCycleSchedule(cycleId) {
  return useSupabaseQuery(
    () =>
      unwrap(
        supabase
          .from('daily_contributions')
          .select(`
            id, day_number, contribution_date, expected_amount, actual_amount,
            status, payment_method, paid_at, note,
            recorder:profiles!daily_contributions_recorded_by_fkey(full_name)
          `)
          .eq('cycle_id', cycleId)
          .order('day_number', { ascending: true })
      ),
    [cycleId],
    { enabled: !!cycleId }
  );
}

export function useCycleHistory() {
  const { user } = useAuth();
  return useSupabaseQuery(
    () =>
      unwrap(
        supabase
          .from('contribution_cycles')
          .select('id, status, daily_amount_snapshot, duration_days, start_date, expected_end_date, closed_at, rejection_reason, created_at')
          .order('created_at', { ascending: false })
      ),
    [user?.id],
    { enabled: !!user }
  );
}

export function useWithdrawals() {
  const { user } = useAuth();
  return useSupabaseQuery(
    () =>
      unwrap(
        supabase
          .from('withdrawals')
          .select('id, cycle_id, requested_amount, status, requested_at, confirmed_at, paid_at, rejection_reason, note')
          .order('requested_at', { ascending: false })
      ),
    [user?.id],
    { enabled: !!user }
  );
}

export function useActivePlans() {
  return useSupabaseQuery(
    () =>
      unwrap(
        supabase
          .from('contribution_plans')
          .select('id, name, daily_amount, description')
          .eq('is_active', true)
          .order('daily_amount', { ascending: true })
      ),
    []
  );
}

/** Thin wrappers so pages call one function instead of assembling RPC names. */
export function useCustomerActions() {
  const requestCycle = useCallback(async (planId, durationDays) => {
    const { data, error } = await supabase.rpc('nn_request_cycle', {
      p_plan_id: planId,
      p_duration_days: durationDays,
    });
    if (error) throw error;
    return data;
  }, []);

  const requestWithdrawal = useCallback(async (cycleId) => {
    // No amount is passed. The database computes it under a row lock.
    const { data, error } = await supabase.rpc('nn_request_withdrawal', {
      p_cycle_id: cycleId,
    });
    if (error) throw error;
    return data;
  }, []);

  return { requestCycle, requestWithdrawal };
}