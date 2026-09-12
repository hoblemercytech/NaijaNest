import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useSupabaseQuery, unwrap } from './useSupabaseQuery';

/** Whole-operation figures, computed in one round trip by nn_admin_dashboard. */
export function useAdminDashboard() {
  return useSupabaseQuery(async () => {
    const { data, error } = await supabase.rpc('nn_admin_dashboard');
    if (error) throw error;
    return data;
  }, []);
}

export function useAllPlans() {
  return useSupabaseQuery(
    () =>
      unwrap(
        supabase
          .from('contribution_plans')
          .select('id, name, daily_amount, description, is_active, created_at')
          .order('daily_amount', { ascending: true })
      ),
    []
  );
}

/**
 * Customer directory with the collector currently assigned to each one.
 * Search runs server-side so the browser never holds the whole table.
 */
export function useCustomers({ search = '', page = 0, pageSize = 20 } = {}) {
  return useSupabaseQuery(async () => {
    let query = supabase
      .from('profiles')
      .select(
        `id, member_id, full_name, email, phone, avatar_url, status, created_at,
         assignment:collector_assignments!collector_assignments_customer_id_fkey(
           is_active, collector:profiles!collector_assignments_collector_id_fkey(id, full_name)
         )`,
        { count: 'exact' }
      )
      .eq('role', 'USER')
      .order('created_at', { ascending: false })
      .range(page * pageSize, page * pageSize + pageSize - 1);

    const term = search.trim();
    if (term) {
      query = query.or(
        `full_name.ilike.%${term}%,member_id.ilike.%${term}%,phone.ilike.%${term}%`
      );
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return {
      rows: (data || []).map((row) => ({
        ...row,
        collector: row.assignment?.find((a) => a.is_active)?.collector || null,
      })),
      count: count || 0,
    };
  }, [search, page, pageSize]);
}

export function useCollectors() {
  return useSupabaseQuery(
    () =>
      unwrap(
        supabase
          .from('profiles')
          .select('id, member_id, full_name, email, phone, avatar_url, status, created_at')
          .eq('role', 'COLLECTOR')
          .order('full_name', { ascending: true })
      ),
    []
  );
}

/** How many active customers each collector carries, for the assignment picker. */
export function useCollectorLoads() {
  return useSupabaseQuery(async () => {
    const { data, error } = await supabase
      .from('collector_assignments')
      .select('collector_id')
      .eq('is_active', true);
    if (error) throw error;

    const counts = {};
    (data || []).forEach((row) => {
      counts[row.collector_id] = (counts[row.collector_id] || 0) + 1;
    });
    return counts;
  }, []);
}

/** Pending and settled cash handovers across every collector. */
export function useAllHandovers() {
  return useSupabaseQuery(
    () =>
      unwrap(
        supabase
          .from('cash_handovers')
          .select(`
            id, amount, status, submitted_at, received_at, note, admin_note,
            collector:profiles!cash_handovers_collector_id_fkey(id, member_id, full_name)
          `)
          .order('submitted_at', { ascending: false })
          .limit(100)
      ),
    []
  );
}

export function useAuditLog({ action = '', page = 0, pageSize = 30 } = {}) {
  return useSupabaseQuery(async () => {
    let query = supabase
      .from('audit_logs')
      .select(
        `id, action, entity_type, entity_id, old_values, new_values, reason,
         actor_role, created_at,
         actor:profiles!audit_logs_actor_id_fkey(member_id, full_name)`,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(page * pageSize, page * pageSize + pageSize - 1);

    if (action) query = query.eq('action', action);

    const { data, error, count } = await query;
    if (error) throw error;
    return { rows: data || [], count: count || 0 };
  }, [action, page, pageSize]);
}

/** Daily series for the analytics charts. */
export function useAnalytics(startDate, endDate) {
  return useSupabaseQuery(async () => {
    const { data, error } = await supabase.rpc('nn_admin_analytics', {
      p_start: startDate,
      p_end: endDate,
    });
    if (error) throw error;
    return data || [];
  }, [startDate, endDate]);
}

export function useCollectorPerformance(startDate, endDate) {
  return useSupabaseQuery(async () => {
    const { data, error } = await supabase.rpc('nn_collector_performance', {
      p_start: startDate,
      p_end: endDate,
    });
    if (error) throw error;
    return data || [];
  }, [startDate, endDate]);
}

/**
 * Customers who could become staff. Anyone with an open cycle is excluded here
 * as well as blocked in the database, so the picker never offers a choice that
 * will be refused a second later.
 */
export function usePromotableUsers(search = '') {
  return useSupabaseQuery(async () => {
    let query = supabase
      .from('profiles')
      .select('id, member_id, full_name, email, phone, role, status')
      .eq('role', 'USER')
      .eq('status', 'ACTIVE')
      .order('full_name', { ascending: true })
      .limit(50);

    const term = search.trim();
    if (term) {
      query = query.or(`full_name.ilike.%${term}%,member_id.ilike.%${term}%,email.ilike.%${term}%`);
    }

    const people = await unwrap(query);
    if (!people?.length) return [];

    const { data: openCycles, error } = await supabase
      .from('contribution_cycles')
      .select('user_id')
      .in('status', ['PENDING_ACTIVATION', 'ACTIVE', 'COMPLETED'])
      .in('user_id', people.map((p) => p.id));
    if (error) throw error;

    const blocked = new Set((openCycles || []).map((c) => c.user_id));
    return people.map((p) => ({ ...p, hasOpenCycle: blocked.has(p.id) }));
  }, [search]);
}

/** One collector: their customers, collections and handovers. */
export function useCollectorDetail(collectorId) {
  return useSupabaseQuery(
    async () => {
      const profile = await unwrap(
        supabase
          .from('profiles')
          .select('id, member_id, full_name, email, phone, avatar_url, status, created_at')
          .eq('id', collectorId)
          .maybeSingle()
      );
      if (!profile) return null;

      const [assignments, handovers, contributions, withdrawals] = await Promise.all([
        unwrap(
          supabase
            .from('collector_assignments')
            .select(`
              assigned_at,
              customer:profiles!collector_assignments_customer_id_fkey(id, member_id, full_name, phone, avatar_url, status)
            `)
            .eq('collector_id', collectorId)
            .eq('is_active', true)
            .order('assigned_at', { ascending: false })
        ),
        unwrap(
          supabase
            .from('cash_handovers')
            .select('id, amount, status, submitted_at, received_at, note')
            .eq('collector_id', collectorId)
            .order('submitted_at', { ascending: false })
            .limit(20)
        ),
        unwrap(
          supabase
            .from('daily_contributions')
            .select('actual_amount')
            .eq('collector_id', collectorId)
            .eq('status', 'PAID')
        ),
        unwrap(
          supabase
            .from('withdrawals')
            .select('requested_amount')
            .eq('collector_id', collectorId)
            .eq('status', 'PAID')
        ),
      ]);

      // Summed here rather than in SQL because these are already-filtered lists
      // of one collector's own rows, not a scan of the whole table.
      const collected = (contributions || []).reduce((s, r) => s + Number(r.actual_amount || 0), 0);
      const paidOut = (withdrawals || []).reduce((s, r) => s + Number(r.requested_amount || 0), 0);
      const handedOver = (handovers || [])
        .filter((h) => h.status === 'RECEIVED')
        .reduce((s, h) => s + Number(h.amount), 0);

      return {
        profile,
        customers: (assignments || []).map((a) => a.customer).filter(Boolean),
        handovers: handovers || [],
        totals: {
          collected,
          paidOut,
          handedOver,
          // What should physically be in their hands right now.
          inHand: collected - paidOut - handedOver,
        },
      };
    },
    [collectorId],
    { enabled: !!collectorId }
  );
}

export function useNotificationSettings() {
  return useSupabaseQuery(
    () =>
      unwrap(
        supabase
          .from('notification_settings')
          .select('type, send_email, description')
          .order('type', { ascending: true })
      ),
    []
  );
}

export function useAdminActions() {
  const savePlan = useCallback(async (plan) => {
    const payload = {
      name: plan.name.trim(),
      daily_amount: Number(plan.daily_amount),
      description: plan.description?.trim() || null,
      is_active: plan.is_active,
    };

    // Plans are the one table admins write directly — RLS restricts the policy
    // to admins, and there is no atomicity concern the way there is with money.
    const { error } = plan.id
      ? await supabase.from('contribution_plans').update(payload).eq('id', plan.id)
      : await supabase.from('contribution_plans').insert(payload);
    if (error) throw error;
  }, []);

  const togglePlan = useCallback(async (id, isActive) => {
    const { error } = await supabase
      .from('contribution_plans')
      .update({ is_active: isActive })
      .eq('id', id);
    if (error) throw error;
  }, []);

  const assignCollector = useCallback(async (customerId, collectorId, note) => {
    const { error } = await supabase.rpc('nn_assign_collector', {
      p_customer: customerId,
      p_collector: collectorId,
      p_note: note || null,
    });
    if (error) throw error;
  }, []);

  const setAccountStatus = useCallback(async (customerId, status, reason) => {
    const { error } = await supabase.rpc('nn_update_customer_profile', {
      p_customer: customerId,
      p_status: status,
      p_reason: reason || null,
    });
    if (error) throw error;
  }, []);

  const receiveHandover = useCallback(async (id, note) => {
    const { error } = await supabase.rpc('nn_receive_cash_handover', {
      p_id: id,
      p_note: note || null,
    });
    if (error) throw error;
  }, []);

  const disputeHandover = useCallback(async (id, reason) => {
    const { error } = await supabase.rpc('nn_dispute_cash_handover', {
      p_id: id,
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

  const payWithdrawal = useCallback(async (id, amount, reference, note) => {
    const { error } = await supabase.rpc('nn_mark_withdrawal_paid', {
      p_withdrawal_id: id,
      p_amount: amount,
      p_paid_at: new Date().toISOString(),
      p_note: note || null,
      p_reference: reference || null,
    });
    if (error) throw error;
  }, []);

  const setUserRole = useCallback(async (userId, role, reason) => {
    const { error } = await supabase.rpc('nn_set_user_role', {
      p_user: userId,
      p_role: role,
      p_reason: reason || null,
    });
    if (error) throw error;
  }, []);

  const setEmailForType = useCallback(async (type, sendEmail) => {
    const { error } = await supabase
      .from('notification_settings')
      .update({ send_email: sendEmail, updated_at: new Date().toISOString() })
      .eq('type', type);
    if (error) throw error;
  }, []);

  return {
    savePlan, togglePlan, assignCollector, setAccountStatus,
    receiveHandover, disputeHandover, setUserRole, setEmailForType,
    confirmWithdrawal, rejectWithdrawal, payWithdrawal,
  };
}
