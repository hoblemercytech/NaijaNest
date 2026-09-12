import { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserCog } from 'lucide-react';
import {
  useCollectors, useCollectorLoads, usePromotableUsers, useAdminActions,
} from '../../hooks/useAdmin';
import { useAvatarUrls } from '../../hooks/useAvatar';
import { shortDate } from '../../lib/format';
import { friendlyError } from '../../lib/errors';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Input, Textarea } from '../../components/ui/Field';
import StatusBadge from '../../components/ui/Status';
import Avatar from '../../components/ui/Avatar';
import { EmptyState, ErrorState, SkeletonLines } from '../../components/ui/States';
import { useToast } from '../../components/ui/Toast';
import './admin.css';

/**
 * Collector roster.
 *
 * A collector is made by promoting an existing account rather than creating a
 * new one: the person already signed up, set their own password and has a
 * member ID. Creating an auth user from here would need the service role key,
 * which must never reach the browser.
 */
export default function Collectors() {
  const { data, loading, error, refetch } = useCollectors();
  const loads = useCollectorLoads();
  const { setUserRole } = useAdminActions();
  const { toast, toastError } = useToast();
  const [promoting, setPromoting] = useState(false);
  const [demoting, setDemoting] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const avatars = useAvatarUrls(data?.map((c) => c.avatar_url));

  const refreshAll = () => {
    refetch();
    loads.refetch();
  };

  const demote = async (collector, reason) => {
    setBusyId(collector.id);
    try {
      await setUserRole(collector.id, 'USER', reason);
      toast(`${collector.full_name} is now a customer account.`);
      setDemoting(null);
      refreshAll();
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
          <h1>Collectors</h1>
          <p>Staff who hold cash and record contributions.</p>
        </div>
        <Button onClick={() => setPromoting(true)}>Add collector</Button>
      </header>

      {loading && <SkeletonLines count={3} height={78} />}
      {error && !loading && <ErrorState message={error} onRetry={refetch} />}

      {!loading && !error && !data?.length && (
        <Card large>
          <EmptyState
            title="No collectors yet"
            message="Until a collector exists, customers cannot be assigned and no cycle can be activated."
            Icon={UserCog}
            action={<Button onClick={() => setPromoting(true)}>Add your first collector</Button>}
          />
        </Card>
      )}

      <div className="stack">
        {data?.map((c) => {
          const load = loads.data?.[c.id] || 0;
          return (
            <Card key={c.id}>
              <div className="row-between" style={{ alignItems: 'flex-start' }}>
                <div className="row" style={{ gap: 12, minWidth: 0 }}>
                  <Avatar name={c.full_name} url={avatars[c.avatar_url]} size={42} />
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ fontSize: 'var(--t-body)' }}>{c.full_name}</h3>
                    <p className="xs muted num" style={{ margin: '2px 0 0' }}>
                      {c.member_id} · {c.phone || 'no phone'}
                    </p>
                    <p className="xs muted" style={{ margin: '4px 0 0' }}>
                      {load} customer{load === 1 ? '' : 's'} assigned
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flex: 'none' }}>
                  <StatusBadge status={c.status} />
                  <div className="xs muted" style={{ marginTop: 6 }}>{shortDate(c.created_at)}</div>
                  <div className="row" style={{ gap: 4, marginTop: 6, justifyContent: 'flex-end' }}>
                    <Link to={`/admin/collectors/${c.id}`} className="btn btn-ghost btn-sm">Open</Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      loading={busyId === c.id}
                      onClick={() => setDemoting(c)}
                    >
                      Remove role
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <PromoteModal open={promoting} onClose={() => setPromoting(false)} onDone={refreshAll} />
      <DemoteModal
        collector={demoting}
        load={demoting ? loads.data?.[demoting.id] || 0 : 0}
        busy={!!busyId}
        onClose={() => setDemoting(null)}
        onConfirm={demote}
      />
    </>
  );
}

function PromoteModal({ open, onClose, onDone }) {
  const [search, setSearch] = useState('');
  const people = usePromotableUsers(search);
  const { setUserRole } = useAdminActions();
  const { toast, toastError } = useToast();
  const [busyId, setBusyId] = useState(null);

  if (!open) return null;

  const promote = async (person) => {
    setBusyId(person.id);
    try {
      await setUserRole(person.id, 'COLLECTOR', 'Promoted from the collectors screen');
      toast(`${person.full_name} is now a collector.`);
      onClose();
      onDone();
    } catch (err) {
      toastError(friendlyError(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Add a collector"
      description="Promote someone who already has a BudgetSave account."
      footer={<Button variant="outline" onClick={onClose} block>Done</Button>}
    >
      <Input
        placeholder="Search name, member ID or email"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Search accounts"
      />

      <p className="field-hint">
        They keep their member ID. Ask them to sign out and back in afterwards so their
        new screens load.
      </p>

      <div style={{ marginTop: 'var(--s-4)' }}>
        {people.loading && <SkeletonLines count={3} height={58} />}
        {people.error && !people.loading && (
          <ErrorState message={people.error} onRetry={people.refetch} />
        )}

        {!people.loading && !people.error && !people.data?.length && (
          <EmptyState
            title={search ? 'No accounts match' : 'No customer accounts available'}
            message={
              search
                ? 'Try a different name, member ID or email.'
                : 'Ask the person to sign up first, then promote them here.'
            }
            Icon={UserCog}
          />
        )}

        <div className="stack">
          {people.data?.map((p) => (
            <div className="promote-row" key={p.id}>
              <div style={{ minWidth: 0 }}>
                <div className="small" style={{ fontWeight: 600 }}>{p.full_name}</div>
                <div className="xs muted num">{p.member_id} · {p.email}</div>
                {p.hasOpenCycle && (
                  <div className="xs warn-text" style={{ marginTop: 2 }}>
                    Has an open cycle — close it first
                  </div>
                )}
              </div>
              <Button
                size="sm"
                disabled={p.hasOpenCycle}
                loading={busyId === p.id}
                onClick={() => promote(p)}
              >
                Make collector
              </Button>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

function DemoteModal({ collector, load, busy, onClose, onConfirm }) {
  const [reason, setReason] = useState('');

  if (!collector) return null;
  const blocked = load > 0;

  return (
    <Modal
      open
      onClose={onClose}
      title="Remove collector role"
      description={collector.full_name}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button
            variant="danger"
            disabled={blocked}
            loading={busy}
            onClick={() => onConfirm(collector, reason)}
          >
            Remove role
          </Button>
        </>
      }
    >
      {blocked ? (
        <p className="warn-text">
          {load} customer{load === 1 ? ' is' : 's are'} still assigned to them. Reassign
          everyone from the Customers screen first — otherwise those customers would have
          nobody to pay.
        </p>
      ) : (
        <p className="muted small">
          Their past collections and handovers stay on the record. They become a normal
          customer account and lose access to the collector screens.
        </p>
      )}
      <Textarea
        label="Reason (optional)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Left the company"
      />
    </Modal>
  );
}
