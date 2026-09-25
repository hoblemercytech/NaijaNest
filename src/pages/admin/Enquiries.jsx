import { useState } from 'react';
import { Inbox, UserPlus, Phone, Mail, MapPin } from 'lucide-react';
import { useEnquiries, useEnquiryActions } from '../../hooks/useEnquiries';
import { useCollectors } from '../../hooks/useAdmin';
import { dateTime } from '../../lib/format';
import { friendlyError } from '../../lib/errors';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Select, Textarea } from '../../components/ui/Field';
import StatusBadge from '../../components/ui/Status';
import CreateCustomerModal from '../../components/CreateCustomerModal';
import { EmptyState, ErrorState, SkeletonLines } from '../../components/ui/States';
import { useToast } from '../../components/ui/Toast';
import './admin.css';

/**
 * Account requests.
 *
 * Customers cannot sign themselves up, so this queue is the front door. Every
 * request here is someone who wants to save and cannot yet — which makes the
 * age of the oldest NEW row the number that matters.
 */
export default function Enquiries() {
  const [status, setStatus] = useState('NEW');
  const enquiries = useEnquiries(status);
  const collectors = useCollectors();
  const { setStatus: updateStatus } = useEnquiryActions();
  const { toast, toastError } = useToast();

  const [creating, setCreating] = useState(null);
  const [declining, setDeclining] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const rows = enquiries.data || [];

  const markContacted = async (row) => {
    setBusyId(row.id);
    try {
      await updateStatus(row.id, 'CONTACTED');
      toast('Marked as contacted.');
      enquiries.refetch();
    } catch (err) {
      toastError(friendlyError(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <header className="page-head row-between">
        <div>
          <h1>Account requests</h1>
          <p>People asking to open an account. Create theirs and we email a setup link.</p>
        </div>
        <Button onClick={() => setCreating({})}>
          <UserPlus size={16} /> New customer
        </Button>
      </header>

      <Card>
        <Select
          label="Show"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="NEW">New requests</option>
          <option value="CONTACTED">Contacted</option>
          <option value="CREATED">Account created</option>
          <option value="DECLINED">Declined</option>
          <option value="">All</option>
        </Select>
      </Card>

      <div style={{ marginTop: 'var(--s-4)' }}>
        {enquiries.loading && <SkeletonLines count={3} height={140} />}
        {enquiries.error && !enquiries.loading && (
          <ErrorState message={enquiries.error} onRetry={enquiries.refetch} />
        )}

        {!enquiries.loading && !enquiries.error && !rows.length && (
          <Card large>
            <EmptyState
              title={status === 'NEW' ? 'No new requests' : 'Nothing here'}
              message="Requests from the website appear here."
              Icon={Inbox}
            />
          </Card>
        )}

        <div className="stack">
          {rows.map((row) => (
            <Card key={row.id}>
              <div className="row-between" style={{ alignItems: 'flex-start' }}>
                <div style={{ minWidth: 0 }}>
                  <h3 style={{ margin: 0 }}>{row.full_name}</h3>
                  <p className="xs muted" style={{ margin: '2px 0 0' }}>
                    Requested {dateTime(row.created_at)}
                  </p>
                </div>
                <StatusBadge status={row.status} />
              </div>

              <dl className="detail-list" style={{ marginTop: 'var(--s-3)' }}>
                <div>
                  <dt><Phone size={14} strokeWidth={1.9} /> Phone</dt>
                  <dd className="num">
                    <a href={`tel:${row.phone.replace(/\s/g, '')}`}>{row.phone}</a>
                  </dd>
                </div>
                <div>
                  <dt><Mail size={14} strokeWidth={1.9} /> Email</dt>
                  <dd><a href={`mailto:${row.email}`}>{row.email}</a></dd>
                </div>
                {row.city && (
                  <div>
                    <dt><MapPin size={14} strokeWidth={1.9} /> Area</dt>
                    <dd>{row.city}</dd>
                  </div>
                )}
              </dl>

              {row.note && (
                <p className="small" style={{ marginTop: 8, color: 'var(--text-secondary)' }}>
                  “{row.note}”
                </p>
              )}

              {row.admin_note && (
                <p className="xs" style={{ marginTop: 8, color: 'var(--danger)' }}>
                  {row.admin_note}
                </p>
              )}

              {['NEW', 'CONTACTED'].includes(row.status) && (
                <div className="row" style={{ gap: 8, marginTop: 'var(--s-4)', flexWrap: 'wrap' }}>
                  <Button style={{ flex: 1 }} onClick={() => setCreating(row)}>
                    <UserPlus size={16} /> Create account
                  </Button>
                  {row.status === 'NEW' && (
                    <Button
                      variant="outline"
                      loading={busyId === row.id}
                      onClick={() => markContacted(row)}
                    >
                      Contacted
                    </Button>
                  )}
                  <Button variant="danger" onClick={() => setDeclining(row)}>Decline</Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      <CreateCustomerModal
        open={!!creating}
        enquiry={creating?.id ? creating : null}
        collectors={collectors.data}
        onClose={() => setCreating(null)}
        onDone={enquiries.refetch}
      />

      <DeclineModal
        enquiry={declining}
        onClose={() => setDeclining(null)}
        onDone={enquiries.refetch}
      />
    </>
  );
}

function DeclineModal({ enquiry, onClose, onDone }) {
  const { setStatus } = useEnquiryActions();
  const { toast, toastError } = useToast();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  if (!enquiry) return null;

  const submit = async () => {
    setBusy(true);
    try {
      await setStatus(enquiry.id, 'DECLINED', reason);
      toast('Request declined.');
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
      title="Decline this request"
      description={enquiry.full_name}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="danger" onClick={submit} loading={busy}>Decline</Button>
        </>
      }
    >
      <p className="muted small">
        This is an internal note. The person is not emailed — if they should be told,
        call them first.
      </p>
      <Textarea
        label="Reason (internal)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="No collector covering that area yet"
      />
    </Modal>
  );
}