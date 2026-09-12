import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Building2, Copy, Check } from 'lucide-react';
import { useAdminWithdrawals } from '../../hooks/useAdminLedger';
import { useAdminActions } from '../../hooks/useAdmin';
import { money, shortDate, dateTime } from '../../lib/format';
import { friendlyError } from '../../lib/errors';
import { downloadCsv } from '../../lib/csv';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Input, Select, Textarea } from '../../components/ui/Field';
import Pager from '../../components/ui/Pager';
import StatusBadge from '../../components/ui/Status';
import { EmptyState, ErrorState, SkeletonLines } from '../../components/ui/States';
import { useToast } from '../../components/ui/Toast';
import './admin.css';

/**
 * Payouts, handled by the office.
 *
 * Three steps on purpose: approve (we agree to pay), send the transfer in the
 * bank's own portal, then mark paid. Marking paid is what reduces the balance
 * and closes the cycle, so it is deliberately last and never automatic — the
 * app has no way to know whether a transfer actually left.
 */
export default function Withdrawals() {
  const [status, setStatus] = useState('PENDING');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(0);
  const { data, loading, error, refetch } = useAdminWithdrawals({ status, from, to, page });
  const { confirmWithdrawal } = useAdminActions();
  const { toast, toastError } = useToast();
  const [paying, setPaying] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const rows = data?.rows || [];
  const reset = (fn) => (e) => { fn(e.target.value); setPage(0); };

  const approve = async (w) => {
    setBusyId(w.id);
    try {
      await confirmWithdrawal(w.id);
      toast('Approved. Send the transfer, then mark it paid.');
      refetch();
    } catch (err) {
      toastError(friendlyError(err));
    } finally {
      setBusyId(null);
    }
  };

  const exportRows = () =>
    downloadCsv(
      'naijanest-withdrawals',
      [
        { key: 'requested_at', label: 'Requested', format: (v) => dateTime(v) },
        { key: 'customer.member_id', label: 'Member ID' },
        { key: 'customer.full_name', label: 'Customer' },
        { key: 'requested_amount', label: 'Amount (NGN)' },
        { key: 'bank_name', label: 'Bank' },
        { key: 'account_number', label: 'Account number' },
        { key: 'account_name', label: 'Account name' },
        { key: 'status', label: 'Status' },
        { key: 'paid_at', label: 'Paid', format: (v) => (v ? dateTime(v) : '') },
        { key: 'paid_reference', label: 'Transfer reference' },
        { key: 'rejection_reason', label: 'Rejection reason' },
      ],
      rows
    );

  return (
    <>
      <header className="page-head row-between">
        <div>
          <h1>Withdrawals</h1>
          <p>Paid by bank transfer from the office.</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportRows} disabled={!rows.length}>
          Export page
        </Button>
      </header>

      <Card>
        <div className="filter-grid">
          <Select label="Status" value={status} onChange={reset(setStatus)}>
            <option value="">All statuses</option>
            <option value="PENDING">Awaiting approval</option>
            <option value="CONFIRMED">Approved — to pay</option>
            <option value="PAID">Paid</option>
            <option value="REJECTED">Rejected</option>
          </Select>
          <Input label="From" type="date" value={from} max={to || undefined} onChange={reset(setFrom)} />
          <Input label="To" type="date" value={to} min={from || undefined} onChange={reset(setTo)} />
        </div>
      </Card>

      <div style={{ marginTop: 'var(--s-4)' }}>
        {loading && <SkeletonLines count={4} height={150} />}
        {error && !loading && <ErrorState message={error} onRetry={refetch} />}

        {!loading && !error && !rows.length && (
          <Card large>
            <EmptyState
              title="Nothing here"
              message={
                status === 'PENDING'
                  ? 'Requests appear here when a customer completes a cycle and asks for their savings.'
                  : 'No withdrawals with that status.'
              }
              Icon={ArrowUpRight}
            />
          </Card>
        )}

        <div className="stack">
          {rows.map((w) => (
            <Card key={w.id}>
              <div className="row-between" style={{ alignItems: 'flex-start' }}>
                <div style={{ minWidth: 0 }}>
                  <div className="num" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.35rem' }}>
                    {money(w.requested_amount)}
                  </div>
                  <Link to={`/admin/users/${w.customer?.id}`} className="ledger-name">
                    {w.customer?.full_name}
                  </Link>
                  <p className="xs muted num" style={{ margin: '2px 0 0' }}>
                    {w.customer?.member_id} · requested {shortDate(w.requested_at)}
                  </p>
                </div>
                <StatusBadge status={w.status} />
              </div>

              {/* The transfer details, laid out to be copied into a banking
                  portal without transcription errors. */}
              {w.bank_name && (
                <div className="payout-bank">
                  <div className="payout-bank-head">
                    <Building2 size={15} strokeWidth={1.9} />
                    <span>Transfer to</span>
                  </div>
                  <dl className="detail-list">
                    <div><dt>Bank</dt><dd>{w.bank_name}</dd></div>
                    <div>
                      <dt>Account number</dt>
                      <dd><CopyValue value={w.account_number} /></dd>
                    </div>
                    <div><dt>Account name</dt><dd>{w.account_name}</dd></div>
                  </dl>
                </div>
              )}

              {w.rejection_reason && (
                <p className="xs" style={{ color: 'var(--danger)', marginTop: 8 }}>
                  {w.rejection_reason}
                </p>
              )}
              {w.status === 'PAID' && (
                <p className="xs muted" style={{ marginTop: 8 }}>
                  Paid {dateTime(w.paid_at)}
                  {w.paid_reference && ` · ref ${w.paid_reference}`}
                </p>
              )}

              {w.status === 'PENDING' && (
                <div className="row" style={{ gap: 8, marginTop: 'var(--s-4)' }}>
                  <Button style={{ flex: 1 }} loading={busyId === w.id} onClick={() => approve(w)}>
                    Approve
                  </Button>
                  <Button variant="danger" onClick={() => setRejecting(w)}>Reject</Button>
                </div>
              )}

              {w.status === 'CONFIRMED' && (
                <>
                  <div className="row" style={{ gap: 8, marginTop: 'var(--s-4)' }}>
                    <Button variant="money" style={{ flex: 1 }} onClick={() => setPaying(w)}>
                      I've sent the transfer
                    </Button>
                    <Button variant="danger" onClick={() => setRejecting(w)}>Reject</Button>
                  </div>
                  <p className="field-hint">
                    Approved {dateTime(w.confirmed_at)}. Send the money in your bank's portal
                    first — marking it paid closes the cycle and cannot be undone.
                  </p>
                </>
              )}
            </Card>
          ))}
        </div>

        <Pager page={page} count={data?.count || 0} pageSize={data?.pageSize || 25} onChange={setPage} />
      </div>

      <PayModal withdrawal={paying} onClose={() => setPaying(null)} onDone={refetch} />
      <RejectModal withdrawal={rejecting} onClose={() => setRejecting(null)} onDone={refetch} />
    </>
  );
}

/** Account numbers get mistyped. One tap instead. */
function CopyValue({ value }) {
  const [copied, setCopied] = useState(false);
  if (!value) return <span>—</span>;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard is blocked without HTTPS or a user gesture; the number is
      // still on screen to read.
    }
  };

  return (
    <button type="button" className="copy-value num" onClick={copy} title="Copy">
      {value}
      {copied ? <Check size={13} strokeWidth={2.4} /> : <Copy size={13} strokeWidth={2} />}
    </button>
  );
}

function PayModal({ withdrawal, onClose, onDone }) {
  const { payWithdrawal } = useAdminActions();
  const { toast, toastError } = useToast();
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  if (!withdrawal) return null;

  const submit = async () => {
    setBusy(true);
    try {
      await payWithdrawal(withdrawal.id, withdrawal.requested_amount, reference, note);
      toast('Marked as paid. The cycle is now closed.');
      setReference(''); setNote('');
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
      title="Confirm you sent the transfer"
      description={withdrawal.customer?.full_name}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>Not yet</Button>
          <Button variant="money" onClick={submit} loading={busy}>Yes, it's sent</Button>
        </>
      }
    >
      <div className="payout-amount">
        <span className="small muted">You are confirming you transferred</span>
        <span className="num">{money(withdrawal.requested_amount)}</span>
        <span className="xs muted">
          {withdrawal.bank_name} · {withdrawal.account_number}
        </span>
      </div>

      <p className="muted small">
        This closes the customer's cycle and reduces their balance to zero. They can then
        start a new cycle.
      </p>

      <Input
        label="Transfer reference (optional)"
        value={reference}
        onChange={(e) => setReference(e.target.value)}
        placeholder="From your bank's confirmation"
        hint="Worth recording — it is what settles a dispute months later."
      />
      <Textarea
        label="Note (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
    </Modal>
  );
}

function RejectModal({ withdrawal, onClose, onDone }) {
  const { rejectWithdrawal } = useAdminActions();
  const { toast, toastError } = useToast();
  const [reason, setReason] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (!withdrawal) return null;

  const submit = async () => {
    if (!reason.trim()) return setError('The customer sees this, so say what to fix.');
    setBusy(true);
    setError(null);
    try {
      await rejectWithdrawal(withdrawal.id, reason);
      toast('Rejected. Their balance is unchanged.');
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
      <p className="muted small">
        Rejecting does not touch their savings. They can correct their details and request
        again.
      </p>
      <Textarea
        label="Reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        error={error}
        placeholder="The account name does not match your NaijaNest account name"
      />
    </Modal>
  );
}
