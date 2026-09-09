import { useState } from 'react';
import { useParams } from 'react-router-dom';
import CustomerDetail from '../../components/CustomerDetail';
import { useCustomerDetail } from '../../hooks/useCustomerDetail';
import { useAdminActions } from '../../hooks/useAdmin';
import { supabase } from '../../lib/supabase';
import { friendlyError } from '../../lib/errors';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Input, Textarea } from '../../components/ui/Field';
import { useToast } from '../../components/ui/Toast';

/**
 * Admin view: the same page plus the account controls.
 *
 * Disabling is a status change, never a delete — the person's contribution and
 * withdrawal history has to survive them leaving, or the books stop balancing.
 */
export default function AdminCustomerDetail() {
  const { id } = useParams();
  const detail = useCustomerDetail(id);
  const [editing, setEditing] = useState(false);
  const [statusChange, setStatusChange] = useState(null);

  const profile = detail.data?.profile;
  const disabled = profile?.status === 'DISABLED';

  return (
    <>
      <CustomerDetail
        mode="admin"
        backTo="/admin/users"
        actions={
          profile && (
            <div className="row wrap" style={{ gap: 8 }}>
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                Edit details
              </Button>
              <Button
                variant={disabled ? 'outline' : 'danger'}
                size="sm"
                onClick={() => setStatusChange(disabled ? 'ACTIVE' : 'DISABLED')}
              >
                {disabled ? 'Re-enable account' : 'Disable account'}
              </Button>
            </div>
          )
        }
      />

      <EditDetailsModal
        open={editing}
        profile={profile}
        onClose={() => setEditing(false)}
        onDone={detail.refetch}
      />
      <StatusModal
        status={statusChange}
        profile={profile}
        onClose={() => setStatusChange(null)}
        onDone={detail.refetch}
      />
    </>
  );
}

function EditDetailsModal({ open, profile, onClose, onDone }) {
  const { toast, toastError } = useToast();
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);

  if (!open || !profile) return null;

  const current = form ?? { full_name: profile.full_name, phone: profile.phone || '', reason: '' };
  const set = (k) => (e) => setForm({ ...current, [k]: e.target.value });

  const submit = async () => {
    setBusy(true);
    try {
      // nn_update_customer_profile audits the before and after. Passing null
      // for status leaves it untouched — status changes go through their own
      // modal so they always carry a reason.
      const { error } = await supabase.rpc('nn_update_customer_profile', {
        p_customer: profile.id,
        p_full_name: current.full_name,
        p_phone: current.phone,
        p_status: null,
        p_reason: current.reason || 'Details corrected by admin',
      });
      if (error) throw error;

      toast('Details updated.');
      setForm(null);
      onClose();
      onDone();
    } catch (err) {
      toastError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={() => { setForm(null); onClose(); }}
      title="Edit customer details"
      description={profile.member_id}
      footer={
        <>
          <Button variant="outline" onClick={() => { setForm(null); onClose(); }} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} loading={busy}>Save</Button>
        </>
      }
    >
      <Input label="Full name" value={current.full_name} onChange={set('full_name')} />
      <Input label="Phone number" type="tel" inputMode="tel" value={current.phone} onChange={set('phone')} />
      <Textarea
        label="Reason (optional)"
        value={current.reason}
        onChange={set('reason')}
        placeholder="Name was misspelled at signup"
      />
      <p className="field-hint">
        Email and member ID cannot be changed — they identify the account and its records.
      </p>
    </Modal>
  );
}

function StatusModal({ status, profile, onClose, onDone }) {
  const { setAccountStatus } = useAdminActions();
  const { toast, toastError } = useToast();
  const [reason, setReason] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (!status || !profile) return null;
  const disabling = status === 'DISABLED';

  const submit = async () => {
    if (disabling && !reason.trim()) return setError('Say why the account is being disabled.');
    setBusy(true);
    setError(null);
    try {
      await setAccountStatus(profile.id, status, reason);
      toast(disabling ? 'Account disabled.' : 'Account re-enabled.');
      setReason('');
      onClose();
      onDone();
    } catch (err) {
      toastError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={disabling ? 'Disable this account' : 'Re-enable this account'}
      description={`${profile.full_name} · ${profile.member_id}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant={disabling ? 'danger' : 'primary'} onClick={submit} loading={busy}>
            {disabling ? 'Disable' : 'Re-enable'}
          </Button>
        </>
      }
    >
      {disabling ? (
        <p className="muted small">
          They will not be able to sign in or start a new cycle. Nothing is deleted — their
          contributions, withdrawals and balance stay exactly as they are, and any open
          cycle keeps running until it is settled.
        </p>
      ) : (
        <p className="muted small">They will be able to sign in again immediately.</p>
      )}

      <Textarea
        label={disabling ? 'Reason' : 'Note (optional)'}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        error={error}
        placeholder={disabling ? 'Requested account closure' : ''}
      />
    </Modal>
  );
}