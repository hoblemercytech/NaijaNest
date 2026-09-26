import { useState } from 'react';
import { Trash2, CircleAlert, UserX, Phone, Mail } from 'lucide-react';
import { useDeletionQueue, useDeletionActions } from '../../hooks/useDeletion';
import { money, dateTime } from '../../lib/format';
import { friendlyError } from '../../lib/errors';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Input, Textarea } from '../../components/ui/Field';
import { EmptyState, ErrorState, SkeletonLines } from '../../components/ui/States';
import { useToast } from '../../components/ui/Toast';
import './admin.css';

/**
 * Deletion requests.
 *
 * The queue Google Play requires an app to honour. A request older than 30
 * days is a compliance problem as well as a person left waiting, so the age
 * is shown on every card.
 */
export default function Deletions() {
  const queue = useDeletionQueue();
  const [completing, setCompleting] = useState(null);
  const [refusing, setRefusing] = useState(null);

  // Read the clock once per load rather than on every render. Ages measured
  // in days do not need to tick, and calling Date.now() during render makes
  // the component produce different output for the same data.
  const [now] = useState(() => Date.now());

  const rows = queue.data || [];

  const daysOld = (iso) => Math.floor((now - new Date(iso).getTime()) / 86400000);

  return (
    <>
      <header className="page-head">
        <h1>Deletion requests</h1>
        <p>Customers who asked us to close their account.</p>
      </header>

      {queue.loading && <SkeletonLines count={2} height={150} />}
      {queue.error && !queue.loading && (
        <ErrorState message={queue.error} onRetry={queue.refetch} />
      )}

      {!queue.loading && !queue.error && !rows.length && (
        <Card large>
          <EmptyState
            title="Nothing waiting"
            message="Requests from the app or the website appear here."
            Icon={UserX}
          />
        </Card>
      )}

      <div className="stack">
        {rows.map((r) => {
          const age = daysOld(r.created_at);
          const owed = Number(r.balance || 0) > 0;

          return (
            <Card key={r.id}>
              <div className="row-between" style={{ alignItems: 'flex-start' }}>
                <div style={{ minWidth: 0 }}>
                  <h3 style={{ margin: 0 }}>{r.full_name}</h3>
                  <p className="xs muted num" style={{ margin: '2px 0 0' }}>
                    {r.member_id} · asked {dateTime(r.created_at)}
                  </p>
                </div>

                {/* 30 days is the promise in the privacy policy, so the
                    counter turns before it is broken, not after. */}
                <span className={`chip ${age >= 21 ? 'is-danger' : age >= 14 ? 'is-warning' : 'is-neutral'}`}>
                  {age} {age === 1 ? 'day' : 'days'}
                </span>
              </div>

              <dl className="detail-list" style={{ marginTop: 'var(--s-3)' }}>
                <div>
                  <dt><Mail size={14} strokeWidth={1.9} /> Email</dt>
                  <dd><a href={`mailto:${r.email}`}>{r.email}</a></dd>
                </div>
                {r.phone && (
                  <div>
                    <dt><Phone size={14} strokeWidth={1.9} /> Phone</dt>
                    <dd className="num">
                      <a href={`tel:${r.phone.replace(/\s/g, '')}`}>{r.phone}</a>
                    </dd>
                  </div>
                )}
                <div>
                  <dt>Balance</dt>
                  <dd className="num">{money(r.balance)}</dd>
                </div>
              </dl>

              {r.reason && (
                <p className="small" style={{ marginTop: 8, color: 'var(--text-secondary)' }}>
                  “{r.reason}”
                </p>
              )}

              {owed ? (
                <div className="panel-note tone-rose" style={{ marginTop: 'var(--s-3)' }}>
                  <span className="panel-note-icon"><CircleAlert size={17} strokeWidth={1.9} /></span>
                  <div>
                    <h4>Pay them first</h4>
                    <p>
                      {money(r.balance)} is still owed. Closing this account would take
                      their money — settle the withdrawal before completing.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="row" style={{ gap: 8, marginTop: 'var(--s-4)' }}>
                  <Button variant="danger" style={{ flex: 1 }} onClick={() => setCompleting(r)}>
                    <Trash2 size={16} /> Delete their data
                  </Button>
                  <Button variant="outline" onClick={() => setRefusing(r)}>Refuse</Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <CompleteModal
        request={completing}
        onClose={() => setCompleting(null)}
        onDone={queue.refetch}
      />
      <RefuseModal
        request={refusing}
        onClose={() => setRefusing(null)}
        onDone={queue.refetch}
      />
    </>
  );
}

function CompleteModal({ request, onClose, onDone }) {
  const { complete } = useDeletionActions();
  const { toast, toastError } = useToast();
  const [note, setNote] = useState('');
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  if (!request) return null;

  const ok = typed.trim().toUpperCase() === 'DELETE';

  const go = async () => {
    setBusy(true);
    try {
      const message = await complete(request.id, note);
      setResult(message);
      toast('Personal data removed.');
      onDone();
    } catch (err) {
      toastError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const close = () => { setResult(null); setTyped(''); setNote(''); onClose(); };

  if (result) {
    return (
      <Modal
        open
        onClose={close}
        title="Data removed"
        footer={<Button block onClick={close}>Done</Button>}
      >
        <div className="panel-note tone-amber">
          <span className="panel-note-icon"><CircleAlert size={17} strokeWidth={1.9} /></span>
          <div>
            <h4>One step left</h4>
            <p>
              Delete <strong>{request.email}</strong> under Authentication → Users in
              Supabase. That is what revokes sign-in; this screen handled the data.
            </p>
          </div>
        </div>
        <p className="muted small" style={{ marginTop: 'var(--s-3)' }}>{result}</p>
      </Modal>
    );
  }

  return (
    <Modal
      open
      onClose={close}
      title="Delete this customer's data"
      description={`${request.full_name} · ${request.member_id}`}
      footer={
        <>
          <Button variant="outline" onClick={close} disabled={busy}>Cancel</Button>
          <Button variant="danger" onClick={go} loading={busy} disabled={!ok}>
            Delete their data
          </Button>
        </>
      }
    >
      <div className="panel-note tone-rose">
        <span className="panel-note-icon"><CircleAlert size={17} strokeWidth={1.9} /></span>
        <div>
          <h4>This cannot be undone</h4>
          <p>
            Name, phone, email, ID details, ID photograph, avatar and bank details are
            removed. Contribution and withdrawal amounts stay, with nothing identifying
            them attached — that is what the record-keeping rules require.
          </p>
        </div>
      </div>

      <Textarea
        label="Internal note (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Confirmed by phone on 14 Oct"
      />

      <Input
        label="Type DELETE to confirm"
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        placeholder="DELETE"
        autoCapitalize="characters"
        autoComplete="off"
      />
    </Modal>
  );
}

function RefuseModal({ request, onClose, onDone }) {
  const { refuse } = useDeletionActions();
  const { toast, toastError } = useToast();
  const [note, setNote] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (!request) return null;

  const go = async () => {
    if (!note.trim()) return setError('The customer sees this, so explain why.');
    setBusy(true);
    setError(null);
    try {
      await refuse(request.id, note);
      toast('Request refused and the customer notified.');
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
      title="Refuse this request"
      description={request.full_name}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="danger" onClick={go} loading={busy}>Refuse</Button>
        </>
      }
    >
      <div className="panel-note tone-amber">
        <span className="panel-note-icon"><CircleAlert size={17} strokeWidth={1.9} /></span>
        <div>
          <p>
            Refusing a deletion needs a lawful reason — an unsettled balance, or an
            investigation. "We would rather keep them" is not one, and both app stores
            treat it as a breach.
          </p>
        </div>
      </div>

      <Textarea
        label="Reason the customer will see"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        error={error}
        placeholder="We cannot close the account while your withdrawal is being processed."
      />
    </Modal>
  );
}