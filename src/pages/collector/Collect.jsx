import { useState } from 'react';
import { useDueContributions, useTodaysCollections, useCollectorActions } from '../../hooks/useCollector';
import { useAvatarUrls } from '../../hooks/useAvatar';
import { money, shortDate, timeOnly } from '../../lib/format';
import { friendlyError } from '../../lib/errors';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Input, Textarea } from '../../components/ui/Field';
import Avatar from '../../components/ui/Avatar';
import { EmptyState, ErrorState, SkeletonLines } from '../../components/ui/States';
import { useToast } from '../../components/ui/Toast';
import './collector.css';
import { CheckCircle2 } from 'lucide-react';

/**
 * The screen a collector uses all day, standing up, one-handed.
 *
 * Two taps to record a payment: the customer row, then Confirm. The amount is
 * never typed — it comes from the scheduled day and is re-read server-side, so
 * there is no keypad to fumble and no way to enter the wrong figure.
 *
 * "Missed days" is a separate list rather than a filter, because settling an
 * old day is a different intent from working through today's round, and mixing
 * them invites recording a payment against the wrong date.
 */
export default function Collect() {
  const [scope, setScope] = useState('today');
  const [search, setSearch] = useState('');
  const due = useDueContributions(scope, search);
  const collected = useTodaysCollections();
  const avatars = useAvatarUrls(due.data?.map((r) => r.customer?.avatar_url));
  const [selected, setSelected] = useState(null);

  const refreshAll = () => {
    due.refetch();
    collected.refetch();
  };

  return (
    <>
      <header className="page-head">
        <h1>Record a payment</h1>
        <p>Tap a customer, confirm the amount. Cash only.</p>
      </header>

      <div className="seg" role="tablist" aria-label="Which days to show">
        <button
          role="tab"
          aria-selected={scope === 'today'}
          className={`seg-btn${scope === 'today' ? ' is-on' : ''}`}
          onClick={() => setScope('today')}
        >
          Today
        </button>
        <button
          role="tab"
          aria-selected={scope === 'missed'}
          className={`seg-btn${scope === 'missed' ? ' is-on' : ''}`}
          onClick={() => setScope('missed')}
        >
          Missed days
        </button>
      </div>

      <Input
        placeholder="Search name, member ID or phone"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Search customers"
      />

      <div style={{ marginTop: 'var(--s-4)' }}>
        {due.loading && <SkeletonLines count={5} height={70} />}
        {due.error && !due.loading && <ErrorState message={due.error} onRetry={due.refetch} />}

        {!due.loading && !due.error && !due.data?.length && (
          <Card large>
            <EmptyState
              title={scope === 'today' ? 'Everyone has paid today' : 'No missed days'}
              message={
                scope === 'today'
                  ? "Nothing left on today's round. Check back tomorrow."
                  : 'None of your customers have an unpaid day behind them.'
              }
              Icon={CheckCircle2}
            />
          </Card>
        )}

        <div className="pay-list">
          {due.data?.map((row) => (
            <button key={row.id} className="pay-row" onClick={() => setSelected(row)}>
              <Avatar name={row.customer?.full_name} url={avatars[row.customer?.avatar_url]} size={44} />
              <span className="pay-who">
                <span className="pay-name">{row.customer?.full_name}</span>
                <span className="pay-meta num">
                  {row.customer?.member_id} · Day {row.day_number}
                  {scope === 'missed' && ` · ${shortDate(row.contribution_date)}`}
                </span>
              </span>
              <span className="pay-amount num">{money(row.expected_amount)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* A collector's own record of the round, so they can reconcile cash
          without leaving the screen they are already on. */}
      {!!collected.data?.length && (
        <Card large style={{ marginTop: 'var(--s-6)' }}>
          <h2 style={{ fontSize: 'var(--t-h3)', marginBottom: 'var(--s-3)' }}>
            Recorded today
          </h2>
          {collected.data.map((c) => (
            <div className="done-row" key={c.id}>
              <div>
                <div className="small" style={{ fontWeight: 500 }}>{c.customer?.full_name}</div>
                <div className="xs muted num">{c.customer?.member_id} · {timeOnly(c.paid_at)}</div>
              </div>
              <span className="num" style={{ fontWeight: 600 }}>{money(c.actual_amount)}</span>
            </div>
          ))}
        </Card>
      )}

      <RecordSheet row={selected} onClose={() => setSelected(null)} onDone={refreshAll} />
    </>
  );
}

function RecordSheet({ row, onClose, onDone }) {
  const { recordPayment } = useCollectorActions();
  const { toast, toastError } = useToast();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  if (!row) return null;

  const submit = async () => {
    setBusy(true);
    try {
      await recordPayment(row.id, new Date().toISOString(), note);
      toast(`${money(row.expected_amount)} recorded for ${row.customer?.full_name}.`);
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
      title={row.customer?.full_name}
      description={`${row.customer?.member_id} · Day ${row.day_number} of the cycle`}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="money" onClick={submit} loading={busy}>Record payment</Button>
        </>
      }
    >
      {/* Shown as a figure, never an input. The database writes the scheduled
          amount regardless of anything sent from here. */}
      <div className="pay-confirm">
        <span className="small muted">Collecting</span>
        <span className="num">{money(row.expected_amount)}</span>
        <span className="xs muted">
          For {shortDate(row.contribution_date)} · recorded as paid now
        </span>
      </div>

      <Textarea
        label="Note (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Paid at the shop"
      />
    </Modal>
  );
}
