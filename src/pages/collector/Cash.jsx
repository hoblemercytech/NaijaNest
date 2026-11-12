import { useState } from 'react';
import { useMyHandovers, useCashPosition, useCollectorActions } from '../../hooks/useCollector';
import { useRealtime, LIVE_TABLES } from '../../hooks/useRealtime';
import { money, dateTime, shortDate } from '../../lib/format';
import { friendlyError } from '../../lib/errors';
import { Card, CardHead } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Input, Textarea } from '../../components/ui/Field';
import StatusBadge from '../../components/ui/Status';
import { EmptyState, ErrorState, SkeletonLines } from '../../components/ui/States';
import { useToast } from '../../components/ui/Toast';
import './collector.css';

/**
 * Cash handovers. Only physical cash can be handed over — transfers go straight
 * to the office account and never pass through the collector's hands. The
 * database enforces the limit; this screen just starts from the right number.
 */
export default function Cash() {
  const handovers = useMyHandovers();
  const cash = useCashPosition();
  const [open, setOpen] = useState(false);

  const refresh = () => {
    handovers.refetch();
    cash.refetch();
  };
  useRealtime(LIVE_TABLES.COLLECTOR, refresh);

  const c = cash.data;
  const inHand = Number(c?.cash_in_hand ?? 0);
  const awaiting = Number(c?.handover_pending ?? 0);
  const available = Number(c?.available_to_hand_over ?? 0);

  return (
    <>
      <header className="page-head row-between">
        <div>
          <h1>Cash handover</h1>
          <p>Cash you have passed to the office.</p>
        </div>
        <Button onClick={() => setOpen(true)} disabled={cash.loading || available <= 0}>
          New handover
        </Button>
      </header>

      {cash.loading && <SkeletonLines count={1} height={160} />}
      {cash.error && !cash.loading && <ErrorState message={cash.error} onRetry={cash.refetch} />}

      {!cash.loading && !cash.error && (
        <Card large>
          <CardHead title="Cash you are holding" />
          <div className="num" style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1.8rem' }}>
            {money(inHand)}
          </div>
          <dl className="detail-list" style={{ marginTop: 'var(--s-3)' }}>
            <div><dt>Cash collected (all time)</dt><dd className="num">{money(c?.cash_collected)}</dd></div>
            <div><dt>Paid out to customers</dt><dd className="num">{money(c?.cash_paid_out)}</dd></div>
            <div><dt>Handed over and confirmed</dt><dd className="num">{money(c?.cash_handed_over)}</dd></div>
            <div><dt>Waiting for admin</dt><dd className="num">{money(awaiting)}</dd></div>
            <div><dt>You can hand over now</dt><dd className="num">{money(available)}</dd></div>
            <div><dt>Cash collected today</dt><dd className="num">{money(c?.cash_today)}</dd></div>
            <div><dt>Transfers today (already with the office)</dt><dd className="num">{money(c?.transfer_today)}</dd></div>
          </dl>
        </Card>
      )}

      <div style={{ marginTop: 'var(--s-5)' }}>
        {handovers.loading && <SkeletonLines count={3} height={72} />}
        {handovers.error && !handovers.loading && (
          <ErrorState message={handovers.error} onRetry={handovers.refetch} />
        )}

        {!handovers.loading && !handovers.error && !handovers.data?.length && (
          <Card large>
            <EmptyState
              title="No handovers yet"
              message="Record one each time you pass cash to the office, so the books match."
              icon="▦"
            />
          </Card>
        )}

        <div className="stack">
          {handovers.data?.map((h) => (
            <Card key={h.id}>
              <div className="row-between" style={{ alignItems: 'flex-start' }}>
                <div>
                  <div className="num" style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1.15rem' }}>
                    {money(h.amount)}
                  </div>
                  <div className="xs muted">
                    Submitted {shortDate(h.submitted_at)}
                    {h.status === 'RECEIVED' && ` · confirmed ${dateTime(h.received_at)}`}
                  </div>
                  {h.note && <div className="xs muted" style={{ marginTop: 4 }}>{h.note}</div>}
                  {h.admin_note && h.status === 'DISPUTED' && (
                    <div className="xs" style={{ marginTop: 4, color: 'var(--warn)' }}>
                      {h.admin_note}
                    </div>
                  )}
                </div>
                <StatusBadge status={h.status} />
              </div>
            </Card>
          ))}
        </div>
      </div>

      {open && (
        <HandoverModal
          available={available}
          onClose={() => setOpen(false)}
          onDone={refresh}
        />
      )}
    </>
  );
}

function HandoverModal({ available, onClose, onDone }) {
  const { createHandover } = useCollectorActions();
  const { toast, toastError } = useToast();
  // Starts at everything he can hand over; he edits it down if handing over less.
  const [amount, setAmount] = useState(String(available));
  const [note, setNote] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      return setError('Enter the amount you are handing over.');
    }
    if (value > available) {
      return setError(`You can hand over at most ${money(available)}.`);
    }
    setBusy(true);
    setError(null);
    try {
      await createHandover(value, note);
      toast('Handover recorded. An admin will confirm it.');
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
      title="Record a cash handover"
      description="Count the cash first — an admin confirms this against what they receive."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={submit} loading={busy}>Submit</Button>
        </>
      }
    >
      <Input
        label="Amount (₦)"
        type="number"
        inputMode="numeric"
        min="1"
        max={available}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        error={error}
        hint={`Cash you can hand over now: ${money(available)}. Lower the amount if you are handing over less. Transfers are not included — they already went to the office.`}
      />
      <Textarea
        label="Note (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Handed to the office at 5pm"
      />
    </Modal>
  );
}
