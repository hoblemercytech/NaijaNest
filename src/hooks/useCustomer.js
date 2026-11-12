
import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useSupabaseQuery, unwrap } from './useSupabaseQuery';

/**
 * Financial summary comes directly from the database.
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

      return row || {
        total_contributed: 0,
        total_withdrawn: 0,
        current_balance: 0,
      };
    },
    [user?.id],
    { enabled: !!user }
  );
}

/**
 * The customer's current actionable cycle.
 * COMPLETED remains open until withdrawal is paid and the cycle is CLOSED.
 */
async function loadOpenCycles(userId) {
  const cycles = await unwrap(
    supabase
      .from('contribution_cycles')
      .select(`
        id, status, daily_amount_snapshot, duration_days, frequency, periods,
        start_date, expected_end_date, activated_at, rejection_reason, created_at,
        collector:profiles!contribution_cycles_collector_id_fkey(id, full_name, phone)
      `)
      .eq('user_id', userId)
      .in('status', ['PENDING_ACTIVATION', 'ACTIVE', 'COMPLETED'])
      .order('created_at', { ascending: false })
  );
  if (!cycles?.length) return [];

  const rollups = await unwrap(
    supabase
      .from('cycle_summary')
      .select('cycle_id, days_paid, days_missed, contributed, withdrawn')
      .in('cycle_id', cycles.map((c) => c.id))
  );
  const byId = new Map((rollups || []).map((r) => [r.cycle_id, r]));

  return cycles.map((c) => ({
    ...c,
    days_paid: 0, days_missed: 0, contributed: 0, withdrawn: 0,
    ...(byId.get(c.id) || {}),
  }));
}

/** Every plan the customer currently has open, newest first. */
export function useOpenCycles() {
  const { user } = useAuth();
  return useSupabaseQuery(
    () => loadOpenCycles(user.id),
    [user?.id],
    { enabled: !!user }
  );
}

/**
 * Kept so older screens still work: returns the newest open plan, or null.
 * Any screen that should handle several plans needs useOpenCycles instead.
 */
export function useOpenCycle() {
  const { user } = useAuth();
  return useSupabaseQuery(
    async () => (await loadOpenCycles(user.id))[0] ?? null,
    [user?.id],
    { enabled: !!user }
  );
}

/** Day-by-day contribution schedule. */
export function useCycleSchedule(cycleId) {
  return useSupabaseQuery(
    () =>
      unwrap(
        supabase
          .from('daily_contributions')
          .select(`
            id,
            day_number,
            contribution_date,
            expected_amount,
            actual_amount,
            status,
            payment_method,
            paid_at,
            note,
            recorder:profiles!daily_contributions_recorded_by_fkey(
              full_name
            )
          `)
          .eq('cycle_id', cycleId)
          .order('day_number', { ascending: true })
      ),
    [cycleId],
    { enabled: !!cycleId }
  );
}

/** Customer's previous contribution cycles. */
export function useCycleHistory() {
  const { user } = useAuth();

  return useSupabaseQuery(
    () =>
      unwrap(
        supabase
          .from('contribution_cycles')
          .select(`
            id,
            status,
            daily_amount_snapshot,
            duration_days,
            frequency,
            periods,
            start_date,
            expected_end_date,
            closed_at,
            rejection_reason,
            created_at
          `)
          .order('created_at', { ascending: false })
      ),
    [user?.id],
    { enabled: !!user }
  );
}

/** Customer withdrawal history. */
export function useWithdrawals() {
  const { user } = useAuth();

  return useSupabaseQuery(
    () =>
      unwrap(
        supabase
          .from('withdrawals')
          .select(`
            id,
            cycle_id,
            requested_amount,
            status,
            requested_at,
            confirmed_at,
            paid_at,
            rejection_reason,
            note
          `)
          .order('requested_at', { ascending: false })
      ),
    [user?.id],
    { enabled: !!user }
  );
}

/** Active contribution plans and their supported frequencies. */
export function useActivePlans() {
  return useSupabaseQuery(
    () =>
      unwrap(
        supabase
          .from('contribution_plans')
          .select(`
            id,
            name,
            daily_amount,
            description,
            allowed_frequencies
          `)
          .eq('is_active', true)
          .order('daily_amount', { ascending: true })
      ),
    []
  );
}

/** Customer actions handled by database RPC functions. */
export function useCustomerActions() {
  const requestCycle = useCallback(
    async (planId, periods, frequency = 'DAILY') => {
      const { data, error } = await supabase.rpc('nn_request_cycle', {
        p_plan_id: planId,
        p_periods: periods,
        p_frequency: frequency,
      });

      if (error) throw error;
      return data;
    },
    []
  );

  const requestWithdrawal = useCallback(
    async (cycleId, bankDetails) => {
      const { data, error } = await supabase.rpc(
        'nn_request_withdrawal',
        {
          p_cycle_id: cycleId,
          p_bank_name: bankDetails.bankName,
          p_account_number: bankDetails.accountNumber,
          p_account_name: bankDetails.accountName,
        }
      );

      if (error) throw error;
      return data;
    },
    []
  );

  return {
    requestCycle,
    requestWithdrawal,
  };
}
