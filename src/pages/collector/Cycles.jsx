import { useState } from 'react';
import { usePendingCycles, useCollectorActions } from '../../hooks/useCollector';
import { money, shortDate, isoDate } from '../../lib/format';
import { friendlyError } from '../../lib/errors';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Input, Textarea } from '../../components/ui/Field';
import { EmptyState, ErrorState, SkeletonLines } from '../../components/ui/States';
import { useToast } from '../../components/ui/Toast';
import './collector.css';

/**
 * Cycle requests. Activating one generates the full day-by-day schedule in a
 * single transaction, so the start date chosen here is the date day 1 falls on.
 */
export default function Cycles() {
  const { data, loading, error, refetch } = usePendingCycles();
  const [activating, setActivating] = useState(null);
  const [rejecting, setRejecting] = useState(null);

  return (
    <>
      <header className="page-head">
        <h1>Cycle requests</h1>
        <p>Customers waiting to start saving.</p>
      </header>

      {loading && <SkeletonLines count={3} height={104} />}
      {error && !loading && <ErrorState message={error} onRetry={refetch} />}

      {!loading && !error && !data?.length && (
        <Card large>
          <EmptyState
            title="No requests waiting"
            message="When one of your customers chooses a plan, it appears here for you to activate."
            icon="◇"
          />
        </Card>
      )}

      <div className="stack">
        {data?.map((c) => (
          <Card key={c.id}>
            <h3>{c.customer?.full_name}</h3>
            <p className="xs muted num" style={{ margin: '2px 0 0' }}>
              {c.customer?.member_id} · {c.customer?.phone || 'no phone'}
            </p>

            <dl className="detail-list" style={{ marginTop: 'var(--s-3)' }}>
              <div><dt>Daily amount</dt><dd className="num">{money(c.daily_amount_snapshot)}</dd></div>
              <div><dt>Duration</dt><dd className="num">{c.duration_days} days</dd></div>
              <div>
                <dt>If they pay every day</dt>
                <dd className="num">{money(c.daily_amount_snapshot * c.duration_days)}</dd>
              </div>
              <div><dt>Requested</dt><dd>{shortDate(c.created_at)}</dd></div>
            </dl>

            <div className="row" style={{ gap: 8, marginTop: 'var(--s-4)' }}>
              <Button onClick={() => setActivating(c)} style={{ flex: 1 }}>Activate</Button>
              <Button variant="danger" onClick={() => setRejecting(c)}>Reject</Button>
            </div>
          </Card>
        ))}
      </div>

      <ActivateModal cycle={activating} onClose={() => setActivating(null)} onDone={refetch} />
      <RejectModal cycle={rejecting} onClose={() => setRejecting(null)} onDone={refetch} />
    </>
  );
}

function ActivateModal({ cycle, onClose, onDone }) {
  const { activateCycle } = useCollectorActions();
  const { toast, toastError } = useToast();
  const [startDate, setStartDate] = useState(isoDate());
  const [busy, setBusy] = useState(false);

  if (!cycle) return null;

  const submit = async () => {
    setBusy(true);
    try {
      await activateCycle(cycle.id, startDate);
      toast('Cycle activated.');
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
      title="Activate this cycle"
      description={`${cycle.customer?.full_name} · ${money(cycle.daily_amount_snapshot)} for ${cycle.duration_days} days`}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={submit} loading={busy}>Activate</Button>
        </>
      }
    >
      <Input
        label="Day 1 falls on"
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        hint="Every contribution day is created from this date. It cannot be changed afterwards."
      />
    </Modal>
  );
}

function RejectModal({ cycle, onClose, onDone }) {
  const { rejectCycle } = useCollectorActions();
  const { toast, toastError } = useToast();
  const [reason, setReason] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (!cycle) return null;

  const submit = async () => {
    if (!reason.trim()) return setError('The customer will see this, so it cannot be empty.');
    setBusy(true);
    setError(null);
    try {
      await rejectCycle(cycle.id, reason);
      toast('Request rejected.');
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
      title="Reject this request"
      description={cycle.customer?.full_name}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="danger" onClick={submit} loading={busy}>Reject request</Button>
        </>
      }
    >
      <Textarea
        label="Reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        error={error}
        placeholder="Explain why, in a sentence"
      />
    </Modal>
  );
}