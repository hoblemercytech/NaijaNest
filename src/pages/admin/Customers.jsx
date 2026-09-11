import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCustomers, useCollectors, useCollectorLoads, useAdminActions } from '../../hooks/useAdmin';
import { useAvatarUrls } from '../../hooks/useAvatar';
import { shortDate } from '../../lib/format';
import { friendlyError } from '../../lib/errors';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Input, Select, Textarea } from '../../components/ui/Field';
import StatusBadge from '../../components/ui/Status';
import Avatar from '../../components/ui/Avatar';
import { EmptyState, ErrorState, SkeletonLines } from '../../components/ui/States';
import { useToast } from '../../components/ui/Toast';
import './admin.css';
import { UserCog, Users } from 'lucide-react';

const PAGE_SIZE = 20;

/**
 * Customer directory. A customer with no collector cannot start a cycle at all,
 * so that gap is called out rather than left as a blank cell.
 */
export default function Customers() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const { data, loading, error, refetch } = useCustomers({ search, page, pageSize: PAGE_SIZE });
  const [assigning, setAssigning] = useState(null);

  const rows = data?.rows || [];
  const avatars = useAvatarUrls(rows.map((c) => c.avatar_url));
  const total = data?.count || 0;
  const pages = Math.ceil(total / PAGE_SIZE);

  const onSearch = (e) => {
    setSearch(e.target.value);
    setPage(0);
  };

  return (
    <>
      <header className="page-head">
        <h1>Customers</h1>
        <p>{total > 0 ? `${total} registered` : 'Everyone who has signed up.'}</p>
      </header>

      <Input
        placeholder="Search by name, member ID or phone"
        value={search}
        onChange={onSearch}
        aria-label="Search customers"
      />

      <div style={{ marginTop: 'var(--s-4)' }}>
        {loading && <SkeletonLines count={4} height={78} />}
        {error && !loading && <ErrorState message={error} onRetry={refetch} />}

        {!loading && !error && !rows.length && (
          <Card large>
            <EmptyState
              title={search ? 'No customers match that search' : 'No customers yet'}
              message={search ? 'Try a different name, member ID or phone number.' : 'Customers appear here as soon as they sign up.'}
              Icon={Users}
            />
          </Card>
        )}

        <div className="stack">
          {rows.map((c) => (
            <Card key={c.id}>
              <div className="row-between" style={{ alignItems: 'flex-start', gap: 'var(--s-3)' }}>
                <div className="row" style={{ gap: 12, minWidth: 0 }}>
                  <Avatar name={c.full_name} url={avatars[c.avatar_url]} size={42} />
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ fontSize: 'var(--t-body)' }}>{c.full_name}</h3>
                    <p className="xs muted num" style={{ margin: '2px 0 0' }}>
                      {c.member_id} · {c.phone || 'no phone'}
                    </p>
                    <p className="xs" style={{ margin: '4px 0 0' }}>
                      {c.collector ? (
                        <span className="muted">Collector: {c.collector.full_name}</span>
                      ) : (
                        <span className="warn-text">No collector assigned — cannot start a cycle</span>
                      )}
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flex: 'none' }}>
                  <StatusBadge status={c.status} />
                  <div className="xs muted" style={{ marginTop: 6 }}>{shortDate(c.created_at)}</div>
                  <div className="row" style={{ gap: 6, marginTop: 8, justifyContent: 'flex-end' }}>
                    <Link to={`/admin/users/${c.id}`} className="btn btn-ghost btn-sm">Open</Link>
                    <Button variant="outline" size="sm" onClick={() => setAssigning(c)}>
                      {c.collector ? 'Reassign' : 'Assign'}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {pages > 1 && (
          <div className="pager">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span className="small muted num">Page {page + 1} of {pages}</span>
            <Button variant="outline" size="sm" disabled={page + 1 >= pages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        )}
      </div>

      <AssignModal customer={assigning} onClose={() => setAssigning(null)} onDone={refetch} />
    </>
  );
}

function AssignModal({ customer, onClose, onDone }) {
  const collectors = useCollectors();
  const loads = useCollectorLoads();
  const { assignCollector } = useAdminActions();
  const { toast, toastError } = useToast();
  const [choice, setChoice] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  if (!customer) return null;

  const active = (collectors.data || []).filter((c) => c.status === 'ACTIVE');

  const submit = async () => {
    if (!choice) return;
    setBusy(true);
    try {
      await assignCollector(customer.id, choice, note);
      toast('Collector assigned.');
      setChoice(''); setNote('');
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
      title={customer.collector ? 'Reassign collector' : 'Assign a collector'}
      description={`${customer.full_name} · ${customer.member_id}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={submit} loading={busy} disabled={!choice}>Confirm</Button>
        </>
      }
    >
      {collectors.loading && <SkeletonLines count={2} height={48} />}

      {!collectors.loading && !active.length && (
        <EmptyState
          title="No active collectors"
          message="Create a collector before assigning customers."
          Icon={UserCog}
        />
      )}

      {!collectors.loading && active.length > 0 && (
        <>
          {customer.collector && (
            <p className="small muted">
              Currently with {customer.collector.full_name}. Reassigning moves their open
              cycle, unpaid days and pending withdrawals to the new collector. Past records
              stay with whoever recorded them.
            </p>
          )}
          <Select label="Collector" value={choice} onChange={(e) => setChoice(e.target.value)}>
            <option value="">Choose a collector…</option>
            {active.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name} ({loads.data?.[c.id] || 0} customers)
              </option>
            ))}
          </Select>
          <Textarea
            label="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Reason for the change"
          />
        </>
      )}
    </Modal>
  );
}
