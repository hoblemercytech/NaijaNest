import { useState } from 'react';
import { useContributionEdit } from '../hooks/useCustomerDetail';
import { money, shortDate, dateTime, isoDateTime } from '../lib/format';
import { friendlyError } from '../lib/errors';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { Input, Textarea } from './ui/Field';
import StatusBadge from './ui/Status';
import { useToast } from './ui/Toast';
import './edit-contribution.css';

/**
 * Correcting a contribution record.
 *
 * There is no delete. A day moves between PAID, UNPAID and VOID, and the reason
 * is mandatory because the audit entry is the only thing that will explain the
 * change to whoever reads the books in six months.
 *
 * VOID exists for the case UNPAID cannot express: a day that should never have
 * been expected at all. Reverting to UNPAID says "they still owe nothing but
 * could pay it"; voiding says "this day is not part of the cycle".
 */
const OPTIONS = [
  {
    value: 'PAID',
    title: 'Mark as paid',
    body: 'The customer paid this day. The scheduled amount is recorded.',
  },
  {
    value: 'UNPAID',
    title: 'Revert to unpaid',
    body: 'Recorded by mistake. The amount comes back off their balance.',
  },
  {
    value: 'VOID',
    title: 'Void this day',
    body: 'This day should not count at all. It leaves the schedule.',
  },
];

export default function EditContributionModal({ contribution, onClose, onDone }) {
  const { editContribution } = useContributionEdit();
  const { toast, toastError } = useToast();

  const [status, setStatus] = useState(null);
  const [reason, setReason] = useState('');
  const [paidAt, setPaidAt] = useState(isoDateTime());
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (!contribution) return null;

  const close = () => {
    setStatus(null);
    setReason('');
    setError(null);
    onClose();
  };

  const submit = async () => {
    if (!status) return setError('Choose what should happen to this day.');
    if (!reason.trim()) return setError('A reason is required — it goes on the audit record.');

    setBusy(true);
    setError(null);
    try {
      await editContribution({
        id: contribution.id,
        status,
        reason: reason.trim(),
        paidAt: status === 'PAID' ? new Date(paidAt).toISOString() : null,
        note: contribution.note,
      });
      toast('Record corrected. The change is on the audit log.');
      close();
      onDone();
    } catch (err) {
      toastError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  // Offering the state a record is already in would just be a no-op button.
  const choices = OPTIONS.filter((o) => o.value !== contribution.status);

  return (
    <Modal
      open
      onClose={close}
      title={`Correct day ${contribution.day_number}`}
      description={shortDate(contribution.contribution_date)}
      footer={
        <>
          <Button variant="outline" onClick={close} disabled={busy}>Cancel</Button>
          <Button onClick={submit} loading={busy} disabled={!status}>Save correction</Button>
        </>
      }
    >
      <dl className="detail-list" style={{ marginBottom: 'var(--s-4)' }}>
        <div><dt>Currently</dt><dd><StatusBadge status={contribution.status} /></dd></div>
        <div><dt>Scheduled amount</dt><dd className="num">{money(contribution.expected_amount)}</dd></div>
        {contribution.status === 'PAID' && (
          <>
            <div><dt>Recorded at</dt><dd>{dateTime(contribution.paid_at)}</dd></div>
            <div><dt>Recorded by</dt><dd>{contribution.recorder?.full_name || '—'}</dd></div>
          </>
        )}
      </dl>

      <p className="field-label">What should happen?</p>
      <div className="fix-options">
        {choices.map((o) => (
          <button
            key={o.value}
            type="button"
            className={`fix-option${status === o.value ? ' is-picked' : ''}`}
            onClick={() => setStatus(o.value)}
            aria-pressed={status === o.value}
          >
            <span className="fix-title">{o.title}</span>
            <span className="fix-body">{o.body}</span>
          </button>
        ))}
      </div>

      {status === 'PAID' && (
        <Input
          label="When did they actually pay?"
          type="datetime-local"
          value={paidAt}
          max={isoDateTime()}
          onChange={(e) => setPaidAt(e.target.value)}
          hint="Use the real time the cash changed hands, not now."
        />
      )}

      <Textarea
        label="Reason for the correction"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        error={error}
        placeholder="Recorded against the wrong customer"
      />

      <p className="field-hint">
        Nothing is deleted. The old and new values are both written to the audit log
        against your name.
      </p>
    </Modal>
  );
}