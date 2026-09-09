import { useState } from 'react';
import { useCollectorWithdrawals, useCollectorActions } from '../../hooks/useCollector';
import { money, shortDate, dateTime } from '../../lib/format';
import { friendlyError } from '../../lib/errors';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Field';
import StatusBadge from '../../components/ui/Status';
import { EmptyState, ErrorState, SkeletonLines } from '../../components/ui/States';
import { useToast } from '../../components/ui/Toast';
import './collector.css';

/**
 * Withdrawals move in three steps on purpose: confirm (you agree to pay),
 * hand over the cash, then mark paid. Marking paid is what closes the cycle and
 * reduces the balance, so it is deliberately the last thing and never automatic.
 */
export default function Withdrawals() {
  const { data, loading, error, refetch } = useCollectorWithdrawals();
  const { confirmWithdrawal } = useCollectorActions();
  const { toast, toastError } = useToast();
  const [paying, setPaying] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const confirm = async (w) => {
    setBusyId(w.id);
    try {
      await confirmWithdrawal(w.id);
      toast('Confirmed. Pay the cash, then mark it paid.');
      refetch();
    } catch (err) {
      toastError(friendlyError(err));
    } finally {
      setBusyId(null);
    }
  };

  const waiting = (data || []).filter((w) => ['PENDING', 'CONFIRMED'].includes(w.status));
  const settled = (data || []).filter((w) => ['PAID', 'REJECTED'].includes(w.status));

  return (
    <>
      <header className="page-head">
        <h1>Withdrawals</h1>
        <p>Customers asking for their savings back.</p>
      </header>

      {loading && <SkeletonLines count={3} height={110} />}
      {error && !loading && <ErrorState message={error} onRetry={refetch} />}

      {!loading && !error && !data?.length && (
        <Card large>
          <EmptyState
            title="No withdrawal requests"
            message="When a customer asks for their balance, it appears here."
            icon="↑"
          />
        </Card>
      )}

      <div className="stack">
        {waiting.map((w) => (
          <Card key={w.id}>
            <div className="row-between" style={{ alignItems: 'flex-start' }}>
              <div>
                <h3>{w.customer?.full_name}</h3>
                <p className="xs muted num" style={{ margin: '2px 0 0' }}>
                  {w.customer?.member_id} · {w.customer?.phone || 'no phone'}
                </p>
              </div>
              <StatusBadge status={w.status} />
            </div>

            <div className="payout-amount">
              <span className="small muted">Amount to pay in cash</span>
              <span className="num">{money(w.requested_amount)}</span>
              <span className="xs muted">Requested {shortDate(w.requested_at)}</span>
            </div>

            <div className="row" style={{ gap: 8 }}>
              {w.status === 'PENDING' ? (
                <>
                  <Button
                    style={{ flex: 1 }}
                    loading={busyId === w.id}
                    onClick={() => confirm(w)}
                  >
                    Confirm
                  </Button>
                  <Button variant="danger" onClick={() => setRejecting(w)}>Reject</Button>
                </>
              ) : (
                <>
                  <Button variant="money" style={{ flex: 1 }} onClick={() => setPaying(w)}>
                    Mark as paid
                  </Button>
                  <Button variant="danger" onClick={() => setRejecting(w)}>Reject</Button>
                </>
              )}
            </div>

            {w.status === 'CONFIRMED' && (
              <p className="field-hint">
                Confirmed {dateTime(w.confirmed_at)}. Hand over the cash before marking it paid —
                that closes the cycle and cannot be undone.
              </p>
            )}
          </Card>
        ))}
      </div>

      {settled.length > 0 && (
        <Card large style={{ marginTop: 'var(--s-6)' }}>
          <h2 style={{ fontSize: 'var(--t-h3)', marginBottom: 'var(--s-3)' }}>History</h2>
          {settled.map((w) => (
            <div className="done-row" key={w.id}>
              <div>
                <div className="small" style={{ fontWeight: 500 }}>{w.customer?.full_name}</div>
                <div className="xs muted">
                  {w.status === 'PAID' ? dateTime(w.paid_at) : `Rejected: ${w.rejection_reason}`}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="num" style={{ fontWeight: 600 }}>{money(w.requested_amount)}</div>
                <StatusBadge status={w.status} />
              </div>
            </div>
          ))}
        </Card>
      )}

      <PayModal withdrawal={paying} onClose={() => setPaying(null)} onDone={refetch} />
      <RejectModal withdrawal={rejecting} onClose={() => setRejecting(null)} onDone={refetch} />
    </>
  );
}

function PayModal({ withdrawal, onClose, onDone }) {
  const { markWithdrawalPaid } = useCollectorActions();
  const { toast, toastError } = useToast();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  if (!withdrawal) return null;

  const submit = async () => {
    setBusy(true);
    try {
      // The amount is sent back exactly as requested; the database re-checks it
      // against the live balance and refuses if anything has shifted.
      await markWithdrawalPaid(
        withdrawal.id,
        withdrawal.requested_amount,
        new Date().toISOString(),
        note
      );
      toast('Withdrawal paid. The cycle is now closed.');
      setNote('');
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
      title="Confirm you paid the cash"
      description={withdrawal.customer?.full_name}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>Not yet</Button>
          <Button variant="money" onClick={submit} loading={busy}>Yes, I paid it</Button>
        </>
      }
    >
      <div className="payout-amount">
        <span className="small muted">You are confirming you handed over</span>
        <span className="num">{money(withdrawal.requested_amount)}</span>
      </div>
      <p className="muted small">
        This closes the cycle immediately and adds the amount to your cash paid out for
        today. The customer can then start a new cycle.
      </p>
      <Textarea
        label="Note (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Paid at the market stall"
      />
    </Modal>
  );
}

function RejectModal({ withdrawal, onClose, onDone }) {
  const { rejectWithdrawal } = useCollectorActions();
  const { toast, toastError } = useToast();
  const [reason, setReason] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (!withdrawal) return null;

  const submit = async () => {
    if (!reason.trim()) return setError('The customer will see this, so it cannot be empty.');
    setBusy(true);
    setError(null);
    try {
      await rejectWithdrawal(withdrawal.id, reason);
      toast('Request rejected. Their balance is unchanged.');
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
      title="Reject this withdrawal"
      description={`${withdrawal.customer?.full_name} · ${money(withdrawal.requested_amount)}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="danger" onClick={submit} loading={busy}>Reject</Button>
        </>
      }
    >
      <p className="muted small">Rejecting does not touch their savings. They can ask again.</p>
      <Textarea
        label="Reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        error={error}
        placeholder="No cash on hand today — come back tomorrow"
      />
    </Modal>
  );
}