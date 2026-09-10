import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, FileText, ExternalLink } from 'lucide-react';
import { useKycQueue, useKycActions, ID_TYPE_LABEL } from '../../hooks/useKyc';
import { shortDate, dateTime } from '../../lib/format';
import { friendlyError } from '../../lib/errors';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Field';
import StatusBadge from '../../components/ui/Status';
import { EmptyState, ErrorState, SkeletonLines } from '../../components/ui/States';
import { useToast } from '../../components/ui/Toast';
import './admin.css';

const TABS = [
  { value: 'PENDING', label: 'Awaiting review' },
  { value: 'VERIFIED', label: 'Verified' },
  { value: 'REJECTED', label: 'Rejected' },
];

/**
 * Verification review.
 *
 * This is the only screen in the app that shows a customer's ID number and home
 * address, and it is admin-only at the database level. The document opens in a
 * new tab through a five-minute signed URL rather than being embedded, so a
 * scan of somebody's ID is never sitting in a page that might be left open.
 */
export default function Kyc() {
  const [tab, setTab] = useState('PENDING');
  const queue = useKycQueue(tab);
  const { reviewKyc, documentUrl } = useKycActions();
  const { toast, toastError } = useToast();
  const [rejecting, setRejecting] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const approve = async (row) => {
    setBusyId(row.user_id);
    try {
      await reviewKyc(row.user_id, true);
      toast(`${row.full_name} verified. They can withdraw now.`);
      queue.refetch();
    } catch (err) {
      toastError(friendlyError(err));
    } finally {
      setBusyId(null);
    }
  };

  const openDocument = async (path) => {
    const url = await documentUrl(path);
    if (url) window.open(url, '_blank', 'noopener');
    else toastError('Could not open that document.');
  };

  const rows = queue.data || [];

  return (
    <>
      <header className="page-head">
        <h1>Verification</h1>
        <p>Check each customer against their ID before approving.</p>
      </header>

      <div className="seg" role="tablist" aria-label="Verification status">
        {TABS.map((t) => (
          <button
            key={t.value}
            role="tab"
            aria-selected={tab === t.value}
            className={`seg-btn${tab === t.value ? ' is-on' : ''}`}
            onClick={() => setTab(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {queue.loading && <SkeletonLines count={3} height={150} />}
      {queue.error && !queue.loading && <ErrorState message={queue.error} onRetry={queue.refetch} />}

      {!queue.loading && !queue.error && !rows.length && (
        <Card large>
          <EmptyState
            title={tab === 'PENDING' ? 'Nothing waiting' : 'Nothing here'}
            message={
              tab === 'PENDING'
                ? 'Submissions appear here as customers send their details in.'
                : 'No records with that status yet.'
            }
            Icon={ShieldCheck}
          />
        </Card>
      )}

      <div className="stack">
        {rows.map((row) => (
          <Card key={row.id}>
            <div className="row-between" style={{ alignItems: 'flex-start' }}>
              <div style={{ minWidth: 0 }}>
                <Link to={`/admin/users/${row.user_id}`} className="ledger-name">
                  {row.customer?.full_name}
                </Link>
                <p className="xs muted num" style={{ margin: '2px 0 0' }}>
                  {row.customer?.member_id} · submitted {shortDate(row.submitted_at)}
                </p>
              </div>
              <StatusBadge status={row.status} />
            </div>

            <dl className="detail-list" style={{ marginTop: 'var(--s-3)' }}>
              <div><dt>Name on ID</dt><dd>{row.full_name}</dd></div>
              <div><dt>Date of birth</dt><dd>{shortDate(row.date_of_birth)}</dd></div>
              <div><dt>Phone</dt><dd className="num">{row.phone}</dd></div>
              <div>
                <dt>Address</dt>
                <dd>{[row.address_line, row.city, row.state].filter(Boolean).join(', ')}</dd>
              </div>
              <div><dt>ID type</dt><dd>{ID_TYPE_LABEL[row.id_type]}</dd></div>
              <div><dt>ID number</dt><dd className="num">{row.id_number}</dd></div>
              {row.reviewed_at && (
                <div><dt>Reviewed</dt><dd>{dateTime(row.reviewed_at)}</dd></div>
              )}
            </dl>

            {row.rejection_reason && (
              <p className="xs" style={{ color: 'var(--danger)', marginTop: 6 }}>
                {row.rejection_reason}
              </p>
            )}

            <div className="row wrap" style={{ gap: 8, marginTop: 'var(--s-4)' }}>
              {row.id_document_path ? (
                <Button variant="outline" size="sm" onClick={() => openDocument(row.id_document_path)}>
                  <FileText size={15} /> View ID <ExternalLink size={13} />
                </Button>
              ) : (
                <span className="xs warn-text">No document uploaded</span>
              )}

              {row.status !== 'VERIFIED' && (
                <Button
                  size="sm"
                  loading={busyId === row.user_id}
                  onClick={() => approve(row)}
                  style={{ marginLeft: 'auto' }}
                >
                  Approve
                </Button>
              )}
              {row.status === 'PENDING' && (
                <Button variant="danger" size="sm" onClick={() => setRejecting(row)}>
                  Reject
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      <RejectModal
        row={rejecting}
        onClose={() => setRejecting(null)}
        onDone={queue.refetch}
      />
    </>
  );
}

function RejectModal({ row, onClose, onDone }) {
  const { reviewKyc } = useKycActions();
  const { toast, toastError } = useToast();
  const [reason, setReason] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (!row) return null;

  const submit = async () => {
    if (!reason.trim()) return setError('The customer sees this, so tell them what to fix.');
    setBusy(true);
    setError(null);
    try {
      await reviewKyc(row.user_id, false, reason);
      toast('Rejected. They can correct their details and resubmit.');
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
      title="Reject this submission"
      description={row.customer?.full_name}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="danger" onClick={submit} loading={busy}>Reject</Button>
        </>
      }
    >
      <p className="muted small">
        They can fix the problem and submit again. Say specifically what was wrong —
        "photo is blurred" is actionable, "invalid" is not.
      </p>
      <Textarea
        label="Reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        error={error}
        placeholder="The name on your ID does not match your account name"
      />
    </Modal>
  );
}