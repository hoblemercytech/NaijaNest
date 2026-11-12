import { Link } from 'react-router-dom';
import { ClipboardList, ArrowUpRight } from 'lucide-react';
import { useCallback } from 'react';
import {
  useDailySummary,
  usePendingCycles,
  useCollectorWithdrawals,
  useCashPosition,
} from '../../hooks/useCollector';
import { useRealtime, LIVE_TABLES } from '../../hooks/useRealtime';
import { useAuth } from '../../context/AuthContext';
import { money } from '../../lib/format';
import { Card, CardHead } from '../../components/ui/Card';
import { ProgressBar } from '../../components/ui/Status';
import { ErrorState, SkeletonPanel, SkeletonLines } from '../../components/ui/States';
import './collector.css';

/**
 * The collector's morning screen: what is owed today, what has come in, and
 * what is waiting on them. Every figure is calculated by the database from real
 * transactions — none of it is a running total kept in the app.
 */
export default function CollectorDashboard() {
  const { profile } = useAuth();
  const summary = useDailySummary();
  const cash = useCashPosition();
  const cycles = usePendingCycles();
  const withdrawals = useCollectorWithdrawals();

  const refreshAll = useCallback(() => {
    summary.refetch();
    cash.refetch();
    cycles.refetch();
    withdrawals.refetch();
  }, [summary, cash, cycles, withdrawals]);

  useRealtime(LIVE_TABLES.COLLECTOR, refreshAll);

  // Today's round (progress bar): cash and confirmed transfers together.
  const s = summary.data;
  const expected = Number(s?.expected_amount ?? 0);
  const collected = Number(s?.collected_amount ?? 0);

  // Cash the collector is physically holding. Transfers never enter this.
  const inHand = Number(cash.data?.cash_in_hand ?? 0);
  const awaiting = Number(cash.data?.handover_pending ?? 0);
  const cashToday = Number(cash.data?.cash_today ?? 0);
  const transferToday = Number(cash.data?.transfer_today ?? 0);
  const collectedToday = cashToday + transferToday;

  const pendingWithdrawals = (withdrawals.data || []).filter((w) =>
    ['PENDING', 'CONFIRMED'].includes(w.status)
  );

  return (
    <>
      <header className="page-head">
        <h1>Good day, {profile?.full_name?.split(' ')[0]}</h1>
        <p>Here is today's round.</p>
      </header>

      {/* Cash in hand is the figure a collector is accountable for, so it
          takes the prominent surface rather than gross collections. */}
      {cash.loading && <SkeletonPanel />}
      {cash.error && !cash.loading && (
        <ErrorState message={cash.error} onRetry={cash.refetch} />
      )}

      {!cash.loading && !cash.error && (
  <>
    <section className="panel-balance">
      <div className="label">Collected today</div>
      <div className="amount num">{money(collectedToday)}</div>
      <div className="footnote">
        Cash {money(cashToday)} · Transfer {money(transferToday)}
      </div>
    </section>

    <Card large style={{ marginTop: 'var(--s-3)' }}>
      <CardHead title="Cash to hand over" />
      <dl className="detail-list">
        <div><dt>Cash you are holding</dt><dd className="num">{money(inHand)}</dd></div>
        {awaiting > 0 && (
          <div><dt>Waiting for admin</dt><dd className="num">{money(awaiting)}</dd></div>
        )}
      </dl>
      <Link
        to="/collector/cash"
        className="btn btn-money btn-block"
        style={{ marginTop: 'var(--s-3)' }}
      >
        Cash handover
      </Link>
    </Card>
  </>
)}

      {summary.loading && (
        <div style={{ marginTop: 'var(--s-4)' }}><SkeletonPanel /></div>
      )}
      {summary.error && !summary.loading && (
        <ErrorState message={summary.error} onRetry={summary.refetch} />
      )}

      {!summary.loading && !summary.error && (
        <Card large style={{ marginTop: 'var(--s-4)' }}>
          <CardHead title="Today's collection" />
          <ProgressBar
            value={collected}
            max={expected || 1}
            label={`${money(collected)} of ${money(expected)} collected`}
          />
          <div className="row-between small" style={{ marginTop: 8 }}>
            <span className="muted num">{money(collected)} of {money(expected)}</span>
            <span className="num">
              {s?.customers_paid ?? 0} paid · {s?.customers_unpaid ?? 0} unpaid
            </span>
          </div>

          {/* A navigation action, so it is an anchor wearing the button's
              styles — not a button wrapping a link. */}
          <Link
            to="/collector/collect"
            className="btn btn-money btn-block"
            style={{ marginTop: 'var(--s-4)' }}
          >
            Record a payment
          </Link>
        </Card>
      )}

      <div className="grid-2" style={{ marginTop: 'var(--s-4)' }}>
        <TaskTile
          Icon={ClipboardList}
          to="/collector/cycles"
          label="Cycle requests"
          count={cycles.data?.length ?? 0}
          loading={cycles.loading}
          hint="Waiting for you to activate"
        />
        <TaskTile
          Icon={ArrowUpRight}
          to="/collector/withdrawals"
          label="Withdrawals"
          count={pendingWithdrawals.length}
          loading={withdrawals.loading}
          hint="Waiting to be paid"
        />
      </div>

      {(cycles.loading || withdrawals.loading) && (
        <div style={{ marginTop: 'var(--s-4)' }}><SkeletonLines count={1} height={60} /></div>
      )}
    </>
  );
}

function TaskTile({ to, label, count, loading, hint, Icon }) {
  return (
    <Link to={to} className={`task-tile tone-${count > 0 ? 'amber' : 'teal'}${count > 0 ? ' is-waiting' : ''}`}>
      {Icon && (
        <span className="stat-icon" aria-hidden="true">
          <Icon size={17} strokeWidth={1.9} />
        </span>
      )}
      <span className="stat-label">{label}</span>
      <span className="stat-value num">{loading ? '—' : count}</span>
      <span className="xs muted">{count > 0 ? hint : 'Nothing waiting'}</span>
    </Link>
  );
}
