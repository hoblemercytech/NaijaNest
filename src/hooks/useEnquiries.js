import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useSupabaseQuery, unwrap } from './useSupabaseQuery';

/** The account request queue. Admins see all; collectors see it read-only. */
export function useEnquiries(status = 'NEW') {
  return useSupabaseQuery(
    () =>
      unwrap(
        (() => {
          let q = supabase
            .from('account_enquiries')
            .select('id, full_name, phone, email, city, note, status, created_at, admin_note, created_user')
            .order('created_at', { ascending: false })
            .limit(100);
          // An empty status means "all" — chaining .eq with undefined would
          // filter on nothing and silently return zero rows.
          if (status) q = q.eq('status', status);
          return q;
        })()
      ),
    [status]
  );
}

export function useEnquiryActions() {
  const setStatus = useCallback(async (id, status, note) => {
    const { error } = await supabase
      .from('account_enquiries')
      .update({
        status,
        admin_note: note || null,
        handled_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (error) throw error;
  }, []);

  return { setStatus };
}