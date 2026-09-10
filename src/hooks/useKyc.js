import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useSupabaseQuery, unwrap } from './useSupabaseQuery';

/**
 * The caller's own verification record. Returns null when nothing has been
 * submitted, which the UI treats as the starting state rather than an error.
 */
export function useMyKyc() {
  const { user } = useAuth();
  return useSupabaseQuery(
    () =>
      unwrap(
        supabase
          .from('kyc_submissions')
          .select(`
            id, full_name, phone, date_of_birth, address_line, city, state,
            id_type, id_number, id_document_path, status, submitted_at,
            reviewed_at, rejection_reason
          `)
          .eq('user_id', user.id)
          .maybeSingle()
      ),
    [user?.id],
    { enabled: !!user }
  );
}

/** Admin review queue. Pending first, because that is the work. */
export function useKycQueue(status = 'PENDING') {
  return useSupabaseQuery(async () => {
    let query = supabase
      .from('kyc_submissions')
      .select(`
        id, user_id, full_name, phone, date_of_birth, address_line, city, state,
        id_type, id_number, id_document_path, status, submitted_at,
        reviewed_at, rejection_reason,
        customer:profiles!kyc_submissions_user_id_fkey(id, member_id, full_name, email)
      `)
      .order('submitted_at', { ascending: true })
      .limit(100);

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }, [status]);
}

export function useKycActions() {
  /**
   * Uploads the ID document first, then submits. The document goes up before
   * the record so a submission never references a file that failed to arrive.
   */
  const submitKyc = useCallback(async (userId, form, file) => {
    let documentPath = null;

    if (file) {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const path = `${userId}/id-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('kyc-documents')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;
      documentPath = path;
    }

    const { error } = await supabase.rpc('nn_submit_kyc', {
      p_full_name: form.fullName,
      p_phone: form.phone,
      p_date_of_birth: form.dateOfBirth,
      p_address_line: form.address,
      p_city: form.city || null,
      p_state: form.state || null,
      p_id_type: form.idType,
      p_id_number: form.idNumber,
      p_document_path: documentPath,
    });
    if (error) throw error;
  }, []);

  const reviewKyc = useCallback(async (userId, approve, reason) => {
    const { error } = await supabase.rpc('nn_review_kyc', {
      p_user: userId,
      p_approve: approve,
      p_reason: reason || null,
    });
    if (error) throw error;
  }, []);

  /** Signed URL for an ID document. Short-lived — these are not avatars. */
  const documentUrl = useCallback(async (path) => {
    if (!path) return null;
    const { data, error } = await supabase.storage
      .from('kyc-documents')
      .createSignedUrl(path, 300);
    if (error) return null;
    return data?.signedUrl ?? null;
  }, []);

  return { submitKyc, reviewKyc, documentUrl };
}

export const ID_TYPES = [
  { value: 'NIN', label: 'NIN (National Identity Number)', hint: '11 digits' },
  { value: 'DRIVERS_LICENSE', label: "Driver's licence" },
  { value: 'VOTERS_CARD', label: "Voter's card (PVC)" },
  { value: 'INTERNATIONAL_PASSPORT', label: 'International passport' },
];

export const ID_TYPE_LABEL = Object.fromEntries(
  ID_TYPES.map((t) => [t.value, t.label.replace(/ \(.*\)/, '')])
);