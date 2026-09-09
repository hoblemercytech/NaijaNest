import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useSupabaseQuery, unwrap } from './useSupabaseQuery';
import { isoDate } from '../lib/format';

/** Cash position for one day, computed server-side by nn_collector_daily_summary. */
export function useDailySummary(date = isoDate()) {
  return useSupabaseQuery(async () => {
    const { data, error } = await supabase.rpc('nn_collector_daily_summary', { p_date: date });
    if (error) throw error;
    return data?.[0] || null;
  }, [date]);
}

/**
 * Everything the collector could record a payment against.
 *
 * `scope` is 'today' for the day's round, or 'missed' for past unpaid days a
 * customer wants to settle later. Both come back as the same shape so the
 * recording sheet doesn't care which list a row came from.
 *
 * RLS already limits these rows to the caller's assigned customers, so there is
 * no collector filter in the query — the database enforces it, not this code.
 */
export function useDueContributions(scope = 'today', search = '') {
  const today = isoDate();

  return useSupabaseQuery(async () => {
    let query = supabase
      .from('daily_contributions')
      .select(`
        id, day_number, contribution_date, expected_amount, actual_amount,
        status, paid_at, note, cycle_id,
        customer:profiles!daily_contributions_user_id_fkey(id, member_id, full_name, phone, avatar_url)
      `)
      .eq('status', scope === 'missed' ? 'UNPAID' : 'UNPAID');

    if (scope === 'missed') {
      query = query.lt('contribution_date', today).order('contribution_date', { ascending: false });
    } else {
      query = query.eq('contribution_date', today).order('created_at', { ascending: true });
    }

    const rows = await unwrap(query.limit(200));
    const term = search.trim().toLowerCase();
    if (!term) return rows;

    // Filtering happens here rather than in SQL because the search targets the
    // joined profile, and the row count is already capped at one round.
    return rows.filter(
      (r) =>
        r.customer?.full_name?.toLowerCase().includes(term) ||
        r.customer?.member_id?.toLowerCase().includes(term) ||
        r.customer?.phone?.includes(term)
    );
  }, [scope, search]);
}

/** Today's already-recorded payments, so a collector can check their round. */
export function useTodaysCollections(date = isoDate()) {
  return useSupabaseQuery(
    () =>
      unwrap(
        supabase
          .from('daily_contributions')
          .select(`
            id, contribution_date, actual_amount, paid_at, day_number,
            customer:profiles!daily_contributions_user_id_fkey(member_id, full_name)
          `)
          .eq('status', 'PAID')
          .eq('contribution_date', date)
          .order('paid_at', { ascending: false })
      ),
    [date]
  );
}

export function useMyCustomers(search = '') {
  const { user } = useAuth();

  return useSupabaseQuery(
    async () => {
      const rows = await unwrap(
        supabase
          .from('collector_assignments')
          .select(`
            id, assigned_at,
            customer:profiles!collector_assignments_customer_id_fkey(
              id, member_id, full_name, phone, avatar_url, status
            )
          `)
          .eq('is_active', true)
          .order('assigned_at', { ascending: false })
      );

      const term = search.trim().toLowerCase();
      const list = (rows || []).map((r) => r.customer).filter(Boolean);
      if (!term) return list;
      return list.filter(
        (c) =>
          c.full_name?.toLowerCase().includes(term) ||
          c.member_id?.toLowerCase().includes(term) ||
          c.phone?.includes(term)
      );
    },
    [user?.id, search],
    { enabled: !!user }
  );
}

export function usePendingCycles() {
  return useSupabaseQuery(
    () =>
      unwrap(
        supabase
          .from('contribution_cycles')
          .select(`
            id, daily_amount_snapshot, duration_days, status, created_at,
            customer:profiles!contribution_cycles_user_id_fkey(id, member_id, full_name, phone)
          `)
          .eq('status', 'PENDING_ACTIVATION')
          .order('created_at', { ascending: true })
      ),
    []
  );
}

export function useCollectorWithdrawals() {
  return useSupabaseQuery(
    () =>
      unwrap(
        supabase
          .from('withdrawals')
          .select(`
            id, cycle_id, requested_amount, status, requested_at, confirmed_at,
            paid_at, rejection_reason, note,
            customer:profiles!withdrawals_user_id_fkey(id, member_id, full_name, phone)
          `)
          .order('requested_at', { ascending: false })
          .limit(60)
      ),
    []
  );
}

export function useMyHandovers() {
  const { user } = useAuth();
  return useSupabaseQuery(
    () =>
      unwrap(
        supabase
          .from('cash_handovers')
          .select('id, amount, status, submitted_at, received_at, note, admin_note')
          .order('submitted_at', { ascending: false })
          .limit(40)
      ),
    [user?.id],
    { enabled: !!user }
  );
}

/**
 * Every mutation goes through an RPC. None of them accept an amount from the
 * client except the handover, which is genuinely a figure the collector counts.
 */
export function useCollectorActions() {
  const recordPayment = useCallback(async (contributionId, paidAt, note) => {
    const { error } = await supabase.rpc('nn_record_contribution', {
      p_contribution_id: contributionId,
      p_paid_at: paidAt || new Date().toISOString(),
      p_note: note || null,
    });
    if (error) throw error;
  }, []);

  const activateCycle = useCallback(async (cycleId, startDate) => {
    const { error } = await supabase.rpc('nn_activate_cycle', {
      p_cycle_id: cycleId,
      p_start_date: startDate,
    });
    if (error) throw error;
  }, []);

  const rejectCycle = useCallback(async (cycleId, reason) => {
    const { error } = await supabase.rpc('nn_reject_cycle', {
      p_cycle_id: cycleId,
      p_reason: reason,
    });
    if (error) throw error;
  }, []);

  const confirmWithdrawal = useCallback(async (id) => {
    const { error } = await supabase.rpc('nn_confirm_withdrawal', { p_withdrawal_id: id });
    if (error) throw error;
  }, []);

  const rejectWithdrawal = useCallback(async (id, reason) => {
    const { error } = await supabase.rpc('nn_reject_withdrawal', {
      p_withdrawal_id: id,
      p_reason: reason,
    });
    if (error) throw error;
  }, []);

  const markWithdrawalPaid = useCallback(async (id, amount, paidAt, note) => {
    const { error } = await supabase.rpc('nn_mark_withdrawal_paid', {
      p_withdrawal_id: id,
      p_amount: amount,
      p_paid_at: paidAt || new Date().toISOString(),
      p_note: note || null,
    });
    if (error) throw error;
  }, []);

  const createHandover = useCallback(async (amount, note) => {
    const { error } = await supabase.rpc('nn_create_cash_handover', {
      p_amount: amount,
      p_note: note || null,
    });
    if (error) throw error;
  }, []);

  return {
    recordPayment, activateCycle, rejectCycle,
    confirmWithdrawal, rejectWithdrawal, markWithdrawalPaid, createHandover,
  };
}