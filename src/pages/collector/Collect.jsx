import { useCallback, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { useDueContributions, useTodaysCollections, useCollectorActions } from '../../hooks/useCollector';
import { useAvatarUrls } from '../../hooks/useAvatar';
import { useRealtime } from '../../hooks/useRealtime';
import { usePaymentActions } from '../../hooks/usePayments';
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

  const refreshAll = useCallback(() => {
    due.refetch();
    collected.refetch();
  }, [due, collected]);

  // Two collectors can work the same round. Without this, one records a payment
  // and the other still sees the customer as owing.
  useRealtime(['daily_contributions'], refreshAll);

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

/**
 * Recording cash.
 *
 * A customer regularly hands over several days at once — before travelling,
 * or after a good market day. Forcing the collector to tap through one at a
 * time is slow standing in the street, and every extra tap is a chance to
 * record the wrong person.
 *
 * One payment goes through nn_record_contribution, several through
 * nn_record_contributions_ahead in a single transaction. The second matters:
 * looping the first from here would leave a half-recorded payment if the
 * connection dropped between taps, which on a phone in a market is not rare.
 */
function RecordSheet({ row, onClose, onDone }) {
  const { recordPayment } = useCollectorActions();
  const { recordAhead } = usePaymentActions();
  const { toast, toastError } = useToast();
  const [note, setNote] = useState('');
  const [count, setCount] = useState(1);
  const [busy, setBusy] = useState(false);

  if (!row) return null;

  const perPayment = Number(row.expected_amount || 0);
  const remaining = Math.max(1, Number(row.unpaid_remaining ?? 1));
  const maxCount = Math.min(60, remaining);
  const total = perPayment * count;

  const submit = async () => {
    setBusy(true);
    try {
      if (count === 1) {
        await recordPayment(row.id, new Date().toISOString(), note);
      } else {
        await recordAhead(row.cycle_id, count, note || 'Paid ahead in cash');
      }

      toast(
        count === 1
          ? `${money(perPayment)} recorded for ${row.customer?.full_name}.`
          : `${money(total)} recorded — ${count} payments.`
      );
      setNote('');
      setCount(1);
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
          <Button variant="money" onClick={submit} loading={busy}>
            Record {money(total)}
          </Button>
        </>
      }
    >
      {maxCount > 1 && (
        <>
          <p className="field-label">How many payments are they making?</p>

          <div className="pay-stepper">
            <button
              type="button"
              onClick={() => setCount((c) => Math.max(1, c - 1))}
              disabled={count <= 1}
              aria-label="One fewer"
            >
              <Minus size={18} strokeWidth={2.2} />
            </button>

            <div className="pay-stepper-value">
              <strong className="num">{money(total)}</strong>
              <span>{count} {count === 1 ? 'payment' : 'payments'}</span>
            </div>

            <button
              type="button"
              onClick={() => setCount((c) => Math.min(maxCount, c + 1))}
              disabled={count >= maxCount}
              aria-label="One more"
            >
              <Plus size={18} strokeWidth={2.2} />
            </button>
          </div>

          <div className="pay-quick">
            {[1, 5, 7, 30].filter((q) => q <= maxCount).map((q) => (
              <button
                key={q}
                type="button"
                className={count === q ? 'is-picked' : ''}
                onClick={() => setCount(q)}
              >
                {q}×
              </button>
            ))}
          </div>

          {count > 1 && (
            <p className="field-hint">
              Count the cash before you tap. {count} payments is {money(total)}, and a
              recorded contribution cannot be removed — only corrected with a reason.
            </p>
          )}
        </>
      )}

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
