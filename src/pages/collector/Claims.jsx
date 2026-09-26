import { useState } from 'react';
import { Landmark, Check, CircleAlert, Copy, Phone } from 'lucide-react';
import { usePendingClaims, usePaymentActions } from '../../hooks/usePayments';
import { useRealtime } from '../../hooks/useRealtime';
import { money, dateTime } from '../../lib/format';
import { friendlyError } from '../../lib/errors';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Input, Textarea } from '../../components/ui/Field';
import { EmptyState, ErrorState, SkeletonLines } from '../../components/ui/States';
import { useToast } from '../../components/ui/Toast';
import './collector.css';

/**
 * Payments customers say they have made.
 *
 * Confirming is the act that creates the contributions, so the screen is
 * built to slow that down by one beat: check the account first, then confirm.
 * A collector under time pressure will tap the green button, and the copy
 * here is what stands between that habit and a balance credited for money
 * that never arrived.
 */
export default function Claims() {
  const claims = usePendingClaims();
  const { confirmClaim } = usePaymentActions();
  const { toast, toastError } = useToast();

  const [confirming, setConfirming] = useState(null);
  const [rejecting, setRejecting] = useState(null);

  useRealtime(['payment_claims'], claims.refetch);

  const rows = claims.data || [];

  const copy = async (value) => {
    try {
      await navigator.clipboard.writeText(value);
      toast('Copied.');
    } catch {
      // Clipboard needs HTTPS and a gesture; the value is on screen.
    }
  };

  return (
    <>
      <header className="page-head">
        <h1>Reported payments</h1>
        <p>Check your account before confirming. Confirming credits the customer.</p>
      </header>

      {claims.loading && <SkeletonLines count={3} height={150} />}
      {claims.error && !claims.loading && (
        <ErrorState message={claims.error} onRetry={claims.refetch} />
      )}

      {!claims.loading && !claims.error && !rows.length && (
        <Card large>
          <EmptyState
            title="Nothing waiting"
            message="When a customer transfers and taps “I have paid”, it appears here."
            Icon={Landmark}
          />
        </Card>
      )}

      <div className="stack">
        {rows.map((c) => (
          <Card key={c.id}>
            <div className="row-between" style={{ alignItems: 'flex-start' }}>
              <div style={{ minWidth: 0 }}>
                <h3 style={{ margin: 0 }}>{c.customer_name}</h3>
                <p className="xs muted num" style={{ margin: '2px 0 0' }}>
                  {c.member_id}
                  {c.customer_phone && (
                    <>
                      {' · '}
                      <a href={`tel:${c.customer_phone.replace(/\s/g, '')}`}>
                        <Phone size={11} style={{ verticalAlign: '-1px' }} /> {c.customer_phone}
                      </a>
                    </>
                  )}
                </p>
              </div>
              <span className="pay-pending-dot" aria-hidden="true" />
            </div>

            <div className="payout-amount" style={{ marginTop: 'var(--s-3)' }}>
              <span className="small muted">They say they transferred</span>
              <span className="num">{money(c.claimed_amount)}</span>
              <span className="xs muted">
                {c.periods} {c.periods === 1 ? 'payment' : 'payments'} · reported {dateTime(c.created_at)}
              </span>
            </div>

            <dl className="detail-list">
              <div>
                <dt>Into</dt>
                <dd>{c.bank_name} · {c.account_number}</dd>
              </div>
              {c.reference && (
                <div>
                  <dt>Their reference</dt>
                  <dd>
                    <button type="button" className="copy-value num" onClick={() => copy(c.reference)}>
                      {c.reference} <Copy size={13} strokeWidth={2} />
                    </button>
                  </dd>
                </div>
              )}
            </dl>

            <div className="panel-note tone-amber" style={{ marginTop: 'var(--s-3)' }}>
              <span className="panel-note-icon"><CircleAlert size={17} strokeWidth={1.9} /></span>
              <div>
                <p>
                  Open your bank app and check the money is there. Confirming creates
                  {' '}{c.periods} {c.periods === 1 ? 'contribution' : 'contributions'} and
                  cannot be undone.
                </p>
              </div>
            </div>

            <div className="row" style={{ gap: 8, marginTop: 'var(--s-4)' }}>
              <Button style={{ flex: 1 }} onClick={() => setConfirming(c)}>
                <Check size={16} /> I can see it
              </Button>
              <Button variant="danger" onClick={() => setRejecting(c)}>Not there</Button>
            </div>
          </Card>
        ))}
      </div>

      <ConfirmModal
        claim={confirming}
        onClose={() => setConfirming(null)}
        onDone={claims.refetch}
        confirmClaim={confirmClaim}
        toast={toast}
        toastError={toastError}
      />

      <RejectModal
        claim={rejecting}
        onClose={() => setRejecting(null)}
        onDone={claims.refetch}
      />
    </>
  );
}

function ConfirmModal({ claim, onClose, onDone, confirmClaim, toast, toastError }) {
  const [reference, setReference] = useState('');
  const [busy, setBusy] = useState(false);

  if (!claim) return null;

  const submit = async () => {
    setBusy(true);
    try {
      const done = await confirmClaim(claim.id, reference);
      toast(`${done} ${done === 1 ? 'contribution' : 'contributions'} recorded.`);
      setReference('');
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
      title="Confirm the money arrived"
      description={claim.customer_name}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={submit} loading={busy}>Yes, confirm</Button>
        </>
      }
    >
      <div className="payout-amount">
        <span className="small muted">You are confirming you can see</span>
        <span className="num">{money(claim.claimed_amount)}</span>
        <span className="xs muted">in {claim.bank_name} · {claim.account_number}</span>
      </div>

      <p className="muted small">
        This records {claim.periods} {claim.periods === 1 ? 'contribution' : 'contributions'}{' '}
        against their plan immediately. If the money is not there, close this and mark it
        not found instead.
      </p>

      <Input
        label="Bank reference (optional)"
        value={reference}
        onChange={(e) => setReference(e.target.value)}
        hint="From your own statement. It is what settles a dispute months later."
      />
    </Modal>
  );
}

function RejectModal({ claim, onClose, onDone }) {
  const { rejectClaim } = usePaymentActions();
  const { toast, toastError } = useToast();
  const [reason, setReason] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (!claim) return null;

  const submit = async () => {
    if (!reason.trim()) return setError('The customer sees this, so say what to do next.');
    setBusy(true);
    setError(null);
    try {
      await rejectClaim(claim.id, reason);
      toast('Marked as not found.');
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
      title="Payment not found"
      description={`${claim.customer_name} · ${money(claim.claimed_amount)}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="danger" onClick={submit} loading={busy}>Mark not found</Button>
        </>
      }
    >
      <p className="muted small">
        Nothing is taken from the customer. They can check their bank and report it again.
      </p>
      <Textarea
        label="What should they do?"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        error={error}
        placeholder="Nothing has arrived yet — check your bank and send us the reference"
      />
    </Modal>
  );
}