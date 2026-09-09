/**
 * Status is never carried by colour alone — every badge pairs a tone with
 * its own word, so it survives greyscale and colour-blindness.
 */
const TONES = {
  PAID: 'ok', ACTIVE: 'ok', RECEIVED: 'ok', CONFIRMED: 'ok', COMPLETED: 'ok',
  UNPAID: 'warn', PENDING: 'warn', PENDING_ACTIVATION: 'warn', DISPUTED: 'warn',
  REJECTED: 'danger',
  CLOSED: 'neutral', VOID: 'neutral', DISABLED: 'neutral',
  FUTURE: 'future',
};

const LABELS = {
  PENDING_ACTIVATION: 'Awaiting activation',
  PENDING_SETUP: 'Invite sent',
  PAID: 'Paid', UNPAID: 'Unpaid', VOID: 'Voided', FUTURE: 'Upcoming',
  ACTIVE: 'Active', COMPLETED: 'Completed', CLOSED: 'Closed', REJECTED: 'Rejected',
  PENDING: 'Pending', CONFIRMED: 'Confirmed', RECEIVED: 'Received',
  DISPUTED: 'Disputed', DISABLED: 'Disabled',
};

export default function StatusBadge({ status, label }) {
  if (!status) return null;
  const tone = TONES[status] || 'neutral';
  return (
    <span className={`badge badge-${tone}`}>
      <span className="dot" aria-hidden="true" />
      {label || LABELS[status] || status}
    </span>
  );
}

export function ProgressBar({ value, max, label }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div
      className="progress"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label || 'Progress'}
    >
      <div className="progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}