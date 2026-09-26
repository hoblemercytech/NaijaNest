import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useSupabaseQuery, unwrap } from './useSupabaseQuery';
import { useAuth } from '../context/AuthContext';

/** The account this customer should transfer into. */
export function useMyPaymentAccount() {
  const { user } = useAuth();
  return useSupabaseQuery(
    async () => {
      const { data, error } = await supabase.rpc('nn_my_payment_account');
      if (error) throw error;
      return data?.[0] ?? null;
    },
    [user?.id],
    { enabled: !!user }
  );
}

/** This customer's own claims, newest first. */
export function useMyPaymentClaims() {
  const { user } = useAuth();
  return useSupabaseQuery(
    () =>
      unwrap(
        supabase
          .from('payment_claims')
          .select('id, periods, claimed_amount, reference, status, reject_reason, created_at, reviewed_at')
          .order('created_at', { ascending: false })
          .limit(20)
      ),
    [user?.id],
    { enabled: !!user }
  );
}

/** Claims waiting on staff — their own customers, or all for an admin. */
export function usePendingClaims() {
  return useSupabaseQuery(async () => {
    const { data, error } = await supabase.rpc('nn_pending_payment_claims');
    if (error) throw error;
    return data ?? [];
  }, []);
}

export function usePaymentActions() {
  const submitClaim = useCallback(async (cycleId, periods, reference) => {
    const { data, error } = await supabase.rpc('nn_submit_payment_claim', {
      p_cycle_id: cycleId,
      p_periods: periods,
      p_reference: reference || null,
    });
    if (error) throw error;
    return data;
  }, []);

  const confirmClaim = useCallback(async (claimId, providerRef) => {
    const { data, error } = await supabase.rpc('nn_confirm_payment_claim', {
      p_claim_id: claimId,
      p_provider_ref: providerRef || null,
    });
    if (error) throw error;
    return data;
  }, []);

  const rejectClaim = useCallback(async (claimId, reason) => {
    const { error } = await supabase.rpc('nn_reject_payment_claim', {
      p_claim_id: claimId,
      p_reason: reason,
    });
    if (error) throw error;
  }, []);

  /** Cash, recorded by a collector — several periods at once. */
  const recordAhead = useCallback(async (cycleId, count, note) => {
    const { data, error } = await supabase.rpc('nn_record_contributions_ahead', {
      p_cycle_id: cycleId,
      p_count: count,
      p_paid_at: new Date().toISOString(),
      p_note: note || null,
    });
    if (error) throw error;
    return data;
  }, []);

  return { submitClaim, confirmClaim, rejectClaim, recordAhead };
}

/** Collector payment accounts, for the admin screen. */
export function useCollectorAccounts() {
  return useSupabaseQuery(
    () =>
      unwrap(
        supabase
          .from('collector_accounts')
          .select(`
            id, bank_name, account_number, account_name, provider, provider_ref,
            is_active, created_at,
            collector:profiles!collector_accounts_collector_id_fkey(id, full_name, member_id)
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
      ),
    []
  );
}

export function useCollectorAccountActions() {
  const setAccount = useCallback(async (collectorId, form) => {
    const { data, error } = await supabase.rpc('nn_set_collector_account', {
      p_collector: collectorId,
      p_bank_name: form.bankName,
      p_account_number: form.accountNumber,
      p_account_name: form.accountName,
      p_provider_ref: form.providerRef || null,
    });
    if (error) throw error;
    return data;
  }, []);

  return { setAccount };
}

/**
 * Every payment in, cash and transfer together.
 *
 * Server-side filtering and paging: an admin with a year of daily
 * contributions has tens of thousands of rows, and filtering those in the
 * browser means shipping all of them first.
 */
export function usePaymentsLedger(filters) {
  const {
    from = '', to = '', collectorId = '', customerId = '',
    method = '', page = 0, pageSize = 50,
  } = filters || {};

  return useSupabaseQuery(
    async () => {
      const { data, error } = await supabase.rpc('nn_payments_ledger', {
        p_from: from || null,
        p_to: to || null,
        p_collector: collectorId || null,
        p_customer: customerId || null,
        p_method: method || null,
        p_limit: pageSize,
        p_offset: page * pageSize,
      });
      if (error) throw error;

      return {
        rows: data ?? [],
        count: Number(data?.[0]?.total_count ?? 0),
        pageSize,
      };
    },
    [from, to, collectorId, customerId, method, page, pageSize]
  );
}

/** How money reached each collector — cash against transfer. */
export function useCollectorMoneyIn(from, to) {
  return useSupabaseQuery(
    async () => {
      const { data, error } = await supabase.rpc('nn_collector_money_in', {
        p_from: from || null,
        p_to: to || null,
      });
      if (error) throw error;
      return data ?? [];
    },
    [from, to]
  );
}

/** Recent webhook activity, so a silent failure is visible. */
export function useProviderEvents() {
  return useSupabaseQuery(async () => {
    const { data, error } = await supabase.rpc('nn_provider_events', { p_limit: 50 });
    if (error) throw error;
    return data ?? [];
  }, []);
}
