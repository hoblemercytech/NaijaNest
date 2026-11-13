import { useState } from 'react';
import { BadgeCheck } from 'lucide-react';
import { usePaymentReview, usePaymentReviewActions } from '../../hooks/usePaymentReview';
import { money, dateTime } from '../../lib/format';
import { friendlyError } from '../../lib/errors';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Field';
import { EmptyState, ErrorState, SkeletonLines } from '../../components/ui/States';
import { useToast } from '../../components/ui/Toast';
import './admin.css';

const KINDS = {
  CREDIT_FAILED: {
    title: 'Money arrived but could not be credited',
    help: (d) => `${d.error || 'Unknown reason'}. Fix the cause (for example the plan), then retry, or resolve it if you handled it another way.`,
    canRetry: true,
  },
  UNDERPAID: {
    title: 'Customer paid less than the amount due',
    help: (d) => `Expected ${money(d.expected)}, received ${money(d.received)}. Nothing was credited.`,
    canRetry: false,
  },
  OVERPAID: {
    title: 'Customer paid more than the amount due',
    help: (d) => `Expected ${money(d.expected)}, received ${money(d.received)}. The amount due was credited. The extra needs sorting out.`,
    canRetry: false,
  },
  MISMATCH: {
    title: "Payment record doesn't match",
    help: () => 'ALATPay returned a record that does not match this payment. Check it in the ALATPay dashboard before doing anything.',
    canRetry: true,
  },
  SETTLE_ERROR: {
    title: 'Crediting failed on our side',
    help: (d) => `${d.error || 'Unknown error'}. Retry once the cause is fixed.`,
    canRetry: true,
  },
};

/** Gateway payments the system could not finish by itself. */
export default function PaymentReview() {
  const { data, loading, error, refetch } = usePaymentReview();
  const { retry } = usePaymentReviewActions();
  const { toast, toastError } = useToast();
  const [resolving, setResolving] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const doRetry = async (e) => {
    setBusyId(e.event_id);
    try {
      await retry(e.event_id);
      toast('Retry requested. The system will try again within a minute.');
      refetch();
    } catch (err) {
      toastError(friendlyError(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <header className="page-head">
        <h1>Payment review</h1>
        <p>Automatic payments that need a person to look at them.</p>
      </header>

      {loading && <SkeletonLines count={3} height={120} />}
      {error && !loading && <ErrorState message={error} onRetry={refetch} />}

      {!loading && !error && !data?.length && (
        <Card large>
          <EmptyState
            title="Nothing to review"
            message="Every automatic payment has gone through cleanly."
            Icon={BadgeCheck}
          />
        </Card>
      )}

      <div className="stack">
        {data?.map((e) => {
          const kind = KINDS[e.kind] || { title: e.kind, help: () => '', canRetry: false };
          const d = e.detail || {};
          return (
            <Card key={e.event_id} style={{ borderLeft: '3px solid var(--gold)' }}>
              <h3>{kind.title}</h3>
              <p className="small muted" style={{ margin: '4px 0 0' }}>{kind.help(d)}</p>

              <dl className="detail-list" style={{ marginTop: 'var(--s-3)' }}>
                <div>
                  <dt>Customer</dt>
                  <dd>{e.customer_name || '—'} <span className="num muted">{e.member_id}</span></dd>
                </div>
                <div><dt>Collector</dt><dd>{e.collector_name || '—'}</dd></div>
                <div>
                  <dt>Payment</dt>
                  <dd className="num">{money(e.claimed_amount)} · {e.periods}×</dd>
                </div>
                <div><dt>Reported</dt><dd>{dateTime(e.created_at)}</dd></div>
                {e.txn_id && <div><dt>ALATPay reference</dt><dd className="num xs">{e.txn_id}</dd></div>}
              </dl>

              <div className="row" style={{ gap: 8, marginTop: 'var(--s-4)' }}>
                {kind.canRetry && (
                  <Button style={{ flex: 1 }} loading={busyId === e.event_id} onClick={() => doRetry(e)}>
                    Retry
                  </Button>
                )}
                <Button variant="outline" style={{ flex: 1 }} onClick={() => setResolving(e)}>
                  Mark resolved
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <ResolveModal event={resolving} onClose={() => setResolving(null)} onDone={refetch} />
    </>
  );
}

function ResolveModal({ event, onClose, onDone }) {
  const { resolve } = usePaymentReviewActions();
  const { toast, toastError } = useToast();
  const [note, setNote] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (!event) return null;

  const submit = async () => {
    if (!note.trim()) return setError('Say what you did, so the record explains itself later.');
    setBusy(true);
    setError(null);
    try {
      await resolve(event.event_id, note.trim());
      toast('Marked as resolved.');
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
      title="Mark as resolved"
      description={`${event.customer_name || 'Payment'} · ${money(event.claimed_amount)}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={submit} loading={busy}>Mark resolved</Button>
        </>
      }
    >
      <Textarea
        label="What did you do?"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        error={error}
        placeholder="Refunded the extra ₦500 by transfer"
      />
    </Modal>
  );
}