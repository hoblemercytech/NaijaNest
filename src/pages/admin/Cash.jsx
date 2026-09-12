import { useState } from 'react';
import { useAllHandovers, useAdminActions } from '../../hooks/useAdmin';
import { money, dateTime, shortDate } from '../../lib/format';
import { friendlyError } from '../../lib/errors';
import { downloadCsv } from '../../lib/csv';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Field';
import StatusBadge from '../../components/ui/Status';
import { EmptyState, ErrorState, SkeletonLines } from '../../components/ui/States';
import { useToast } from '../../components/ui/Toast';
import './admin.css';

/**
 * Cash handovers. A collector's submission is a claim about physical money;
 * confirming it here is what makes it a fact in the books, which is why the
 * two are separate people and separate actions.
 */
export default function Cash() {
  const { data, loading, error, refetch } = useAllHandovers();
  const { receiveHandover } = useAdminActions();
  const { toast, toastError } = useToast();
  const [disputing, setDisputing] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const confirm = async (h) => {
    setBusyId(h.id);
    try {
      await receiveHandover(h.id);
      toast(`${money(h.amount)} confirmed as received.`);
      refetch();
    } catch (err) {
      toastError(friendlyError(err));
    } finally {
      setBusyId(null);
    }
  };

  const exportRows = () =>
    downloadCsv(
      'budgetsave-cash-handovers',
      [
        { key: 'collector.member_id', label: 'Collector ID' },
        { key: 'collector.full_name', label: 'Collector' },
        { key: 'amount', label: 'Amount (NGN)' },
        { key: 'status', label: 'Status' },
        { key: 'submitted_at', label: 'Submitted', format: (v) => dateTime(v) },
        { key: 'received_at', label: 'Confirmed', format: (v) => (v ? dateTime(v) : '') },
        { key: 'note', label: 'Collector note' },
        { key: 'admin_note', label: 'Admin note' },
      ],
      data || []
    );

  const pending = (data || []).filter((h) => h.status === 'PENDING');
  const settled = (data || []).filter((h) => h.status !== 'PENDING');
  const pendingTotal = pending.reduce((sum, h) => sum + Number(h.amount), 0);

  return (
    <>
      <header className="page-head row-between">
        <div>
          <h1>Cash handovers</h1>
          <p>Money collectors have passed to the office.</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportRows} disabled={!data?.length}>
          Export CSV
        </Button>
      </header>

      {loading && <SkeletonLines count={3} height={96} />}
      {error && !loading && <ErrorState message={error} onRetry={refetch} />}

      {!loading && !error && !data?.length && (
        <Card large>
          <EmptyState
            title="No handovers recorded"
            message="Collectors submit these as they pass cash in. Confirm each one against what you actually receive."
            icon="▦"
          />
        </Card>
      )}

      {pending.length > 0 && (
        <>
          <div className="stat" style={{ marginBottom: 'var(--s-4)' }}>
            <div className="stat-label">Awaiting your confirmation</div>
            <div className="stat-value num">{money(pendingTotal)}</div>
            <div className="xs muted">{pending.length} handover{pending.length === 1 ? '' : 's'}</div>
          </div>

          <div className="stack">
            {pending.map((h) => (
              <Card key={h.id} style={{ borderLeft: '3px solid var(--gold)' }}>
                <div className="row-between" style={{ alignItems: 'flex-start' }}>
                  <div>
                    <h3 className="num">{money(h.amount)}</h3>
                    <p className="xs muted" style={{ margin: '2px 0 0' }}>
                      {h.collector?.full_name} · <span className="num">{h.collector?.member_id}</span>
                    </p>
                    <p className="xs muted" style={{ margin: '2px 0 0' }}>
                      Submitted {dateTime(h.submitted_at)}
                    </p>
                    {h.note && <p className="xs muted" style={{ marginTop: 6 }}>{h.note}</p>}
                  </div>
                  <StatusBadge status={h.status} />
                </div>

                <div className="row" style={{ gap: 8, marginTop: 'var(--s-4)' }}>
                  <Button style={{ flex: 1 }} loading={busyId === h.id} onClick={() => confirm(h)}>
                    Confirm received
                  </Button>
                  <Button variant="danger" onClick={() => setDisputing(h)}>Dispute</Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {settled.length > 0 && (
        <Card large style={{ marginTop: 'var(--s-6)' }}>
          <h2 style={{ fontSize: 'var(--t-h3)', marginBottom: 'var(--s-3)' }}>History</h2>
          {settled.map((h) => (
            <div className="done-row" key={h.id}>
              <div>
                <div className="small" style={{ fontWeight: 500 }}>{h.collector?.full_name}</div>
                <div className="xs muted">
                  {h.status === 'RECEIVED' ? `Confirmed ${shortDate(h.received_at)}` : h.admin_note}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="num" style={{ fontWeight: 600 }}>{money(h.amount)}</div>
                <StatusBadge status={h.status} />
              </div>
            </div>
          ))}
        </Card>
      )}

      <DisputeModal handover={disputing} onClose={() => setDisputing(null)} onDone={refetch} />
    </>
  );
}

function DisputeModal({ handover, onClose, onDone }) {
  const { disputeHandover } = useAdminActions();
  const { toast, toastError } = useToast();
  const [reason, setReason] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (!handover) return null;

  const submit = async () => {
    if (!reason.trim()) return setError('Say what the discrepancy is.');
    setBusy(true);
    setError(null);
    try {
      await disputeHandover(handover.id, reason);
      toast('Handover marked as disputed.');
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
      title="Dispute this handover"
      description={`${handover.collector?.full_name} · ${money(handover.amount)}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="danger" onClick={submit} loading={busy}>Mark disputed</Button>
        </>
      }
    >
      <p className="muted small">
        The collector sees this reason. The record stays — nothing is deleted, and the
        dispute is written to the audit log.
      </p>
      <Textarea
        label="What is the discrepancy?"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        error={error}
        placeholder="Counted ₦480,000, not ₦500,000"
      />
    </Modal>
  );
}
