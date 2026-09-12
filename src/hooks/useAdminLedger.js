import { supabase } from '../lib/supabase';
import { useSupabaseQuery } from './useSupabaseQuery';

/**
 * Read-only ledgers for the admin.
 *
 * All three page server-side with an exact count. These tables grow by a row
 * per customer per day, so a 90-day cycle across 500 customers is 45,000 rows —
 * pulling that into the browser to filter it would be slow and would hand the
 * client far more data than the screen shows.
 */
const PAGE_SIZE = 25;

export function useAdminCycles({ status = '', search = '', page = 0 } = {}) {
  return useSupabaseQuery(async () => {
    let query = supabase
      .from('contribution_cycles')
      .select(
        `id, status, daily_amount_snapshot, duration_days, start_date,
         expected_end_date, closed_at, created_at, rejection_reason,
         customer:profiles!contribution_cycles_user_id_fkey(id, member_id, full_name),
         collector:profiles!contribution_cycles_collector_id_fkey(id, full_name)`,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

    if (status) query = query.eq('status', status);

    const { data, error, count } = await query;
    if (error) throw error;

    // The search targets the joined customer, which PostgREST cannot filter on
    // in the same pass, so it narrows the page rather than the whole table.
    const term = search.trim().toLowerCase();
    const rows = term
      ? (data || []).filter(
          (r) =>
            r.customer?.full_name?.toLowerCase().includes(term) ||
            r.customer?.member_id?.toLowerCase().includes(term)
        )
      : data || [];

    return { rows, count: count || 0, pageSize: PAGE_SIZE };
  }, [status, search, page]);
}

export function useAdminContributions({ status = '', from = '', to = '', page = 0 } = {}) {
  return useSupabaseQuery(async () => {
    let query = supabase
      .from('daily_contributions')
      .select(
        `id, contribution_date, day_number, expected_amount, actual_amount,
         status, paid_at, note,
         customer:profiles!daily_contributions_user_id_fkey(id, member_id, full_name),
         collector:profiles!daily_contributions_collector_id_fkey(id, full_name),
         recorder:profiles!daily_contributions_recorded_by_fkey(full_name)`,
        { count: 'exact' }
      )
      .order('contribution_date', { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

    if (status) query = query.eq('status', status);
    if (from) query = query.gte('contribution_date', from);
    if (to) query = query.lte('contribution_date', to);

    const { data, error, count } = await query;
    if (error) throw error;
    return { rows: data || [], count: count || 0, pageSize: PAGE_SIZE };
  }, [status, from, to, page]);
}

export function useAdminWithdrawals({ status = '', from = '', to = '', page = 0 } = {}) {
  return useSupabaseQuery(async () => {
    let query = supabase
      .from('withdrawals')
      .select(
        `id, requested_amount, status, requested_at, confirmed_at, paid_at,
         rejection_reason, note, bank_name, account_number, account_name, paid_reference,
         customer:profiles!withdrawals_user_id_fkey(id, member_id, full_name),
         collector:profiles!withdrawals_collector_id_fkey(id, full_name)`,
        { count: 'exact' }
      )
      .order('requested_at', { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

    if (status) query = query.eq('status', status);
    if (from) query = query.gte('requested_at', `${from}T00:00:00`);
    if (to) query = query.lte('requested_at', `${to}T23:59:59`);

    const { data, error, count } = await query;
    if (error) throw error;
    return { rows: data || [], count: count || 0, pageSize: PAGE_SIZE };
  }, [status, from, to, page]);
}
