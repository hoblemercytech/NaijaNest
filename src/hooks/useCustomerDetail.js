import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useSupabaseQuery, unwrap } from './useSupabaseQuery';

/**
 * One customer's whole picture: profile, balance, cycles and withdrawals.
 *
 * The same hook serves the collector and the admin views. There is no role
 * branch here because RLS already decides what comes back — a collector asking
 * for a customer who isn't theirs gets nothing, without this code checking.
 */
export function useCustomerDetail(customerId) {
  return useSupabaseQuery(
    async () => {
      const profile = await unwrap(
        supabase
          .from('profiles')
          .select('id, member_id, full_name, email, phone, avatar_url, status, created_at')
          .eq('id', customerId)
          .maybeSingle()
      );
      if (!profile) return null;

      const [summary, cycles, withdrawals, assignment] = await Promise.all([
        unwrap(
          supabase
            .from('user_financial_summary')
            .select('total_contributed, total_withdrawn, current_balance')
            .eq('user_id', customerId)
            .maybeSingle()
        ),
        unwrap(
          supabase
            .from('contribution_cycles')
            .select(`
              id, status, daily_amount_snapshot, duration_days, start_date,
              expected_end_date, closed_at, rejection_reason, created_at
            `)
            .eq('user_id', customerId)
            .order('created_at', { ascending: false })
        ),
        unwrap(
          supabase
            .from('withdrawals')
            .select('id, requested_amount, status, requested_at, paid_at, rejection_reason')
            .eq('user_id', customerId)
            .order('requested_at', { ascending: false })
            .limit(20)
        ),
        unwrap(
          supabase
            .from('collector_assignments')
            .select(`
              assigned_at,
              collector:profiles!collector_assignments_collector_id_fkey(id, full_name, phone)
            `)
            .eq('customer_id', customerId)
            .eq('is_active', true)
            .maybeSingle()
        ),
      ]);

      return {
        profile,
        summary: summary || { total_contributed: 0, total_withdrawn: 0, current_balance: 0 },
        cycles: cycles || [],
        withdrawals: withdrawals || [],
        collector: assignment?.collector || null,
      };
    },
    [customerId],
    { enabled: !!customerId }
  );
}

/** Day-by-day rows for one cycle, with who recorded each payment. */
export function useCycleDays(cycleId) {
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

export function useContributionEdit() {
  /**
   * Corrections never delete. A record moves between PAID, UNPAID and VOID, and
   * every move writes the before and after to the audit log with the reason —
   * so a mistake is visible history rather than a hole in the books.
   */
  const editContribution = useCallback(async ({ id, status, reason, paidAt, note }) => {
    const { error } = await supabase.rpc('nn_edit_contribution', {
      p_contribution_id: id,
      p_status: status,
      p_reason: reason,
      p_paid_at: paidAt || null,
      p_note: note || null,
    });
    if (error) throw error;
  }, []);

  return { editContribution };
}