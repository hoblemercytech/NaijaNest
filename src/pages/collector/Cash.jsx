import { useState } from 'react';
import { useMyHandovers, useDailySummary, useCollectorActions } from '../../hooks/useCollector';
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
 * Cash handovers. The amount here is genuinely typed, because it is physical
 * money the collector counted — unlike contributions and withdrawals, the
 * database has no way to know it. An admin confirms receipt separately, so a
 * handover is a claim until then, not a fact.
 */
export default function Cash() {
  const handovers = useMyHandovers();
  const summary = useDailySummary();
  const [open, setOpen] = useState(false);

  const s = summary.data;
  const inHand = Number(s?.collected_amount ?? 0) - Number(s?.withdrawals_paid_amount ?? 0);

  return (
    <>
      <header className="page-head row-between">
        <div>
          <h1>Cash handover</h1>
          <p>Money you have passed to NaijaNest.</p>
        </div>
        <Button onClick={() => setOpen(true)}>New handover</Button>
      </header>

      {!summary.loading && !summary.error && (
        <Card large>
          <CardHead title="Today" />
          <dl className="detail-list">
            <div><dt>Collected</dt><dd className="num">{money(s?.collected_amount)}</dd></div>
            <div><dt>Paid out as withdrawals</dt><dd className="num">{money(s?.withdrawals_paid_amount)}</dd></div>
            <div><dt>In hand from today</dt><dd className="num">{money(inHand)}</dd></div>
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

      <HandoverModal
        open={open}
        suggested={inHand}
        onClose={() => setOpen(false)}
        onDone={() => { handovers.refetch(); summary.refetch(); }}
      />
    </>
  );
}

function HandoverModal({ open, suggested, onClose, onDone }) {
  const { createHandover } = useCollectorActions();
  const { toast, toastError } = useToast();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const submit = async () => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      return setError('Enter the amount you are handing over.');
    }
    setBusy(true);
    setError(null);
    try {
      await createHandover(value, note);
      toast('Handover recorded. An admin will confirm it.');
      setAmount(''); setNote('');
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
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        error={error}
        hint={suggested > 0 ? `You collected ${money(suggested)} net today.` : undefined}
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