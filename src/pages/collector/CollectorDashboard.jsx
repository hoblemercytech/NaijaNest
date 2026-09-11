import { Link } from 'react-router-dom';
import { ClipboardList, ArrowUpRight } from 'lucide-react';
import { useDailySummary, usePendingCycles, useCollectorWithdrawals } from '../../hooks/useCollector';
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
  const cycles = usePendingCycles();
  const withdrawals = useCollectorWithdrawals();

  const s = summary.data;
  const expected = Number(s?.expected_amount ?? 0);
  const collected = Number(s?.collected_amount ?? 0);
  const paidOut = Number(s?.withdrawals_paid_amount ?? 0);
  const inHand = collected - paidOut;

  const pendingWithdrawals = (withdrawals.data || []).filter((w) =>
    ['PENDING', 'CONFIRMED'].includes(w.status)
  );

  return (
    <>
      <header className="page-head">
        <h1>Good day, {profile?.full_name?.split(' ')[0]}</h1>
        <p>Here is today's round.</p>
      </header>

      {summary.loading && <SkeletonPanel />}
      {summary.error && !summary.loading && (
        <ErrorState message={summary.error} onRetry={summary.refetch} />
      )}

      {!summary.loading && !summary.error && (
        <>
          {/* Cash in hand is the figure a collector is accountable for, so it
              takes the prominent surface rather than gross collections. */}
          <section className="panel-balance">
            <div className="label">Cash you are holding today</div>
            <div className="amount num">{money(inHand)}</div>
            <div className="footnote">
              Collected {money(collected)} · Paid out {money(paidOut)}
            </div>
          </section>

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
        </>
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
    <Link to={to} className={`task-tile${count > 0 ? ' is-waiting' : ''}`}>
      {Icon && (
        <span className={`stat-icon is-${count > 0 ? 'money' : 'neutral'}`} aria-hidden="true">
          <Icon size={17} strokeWidth={1.9} />
        </span>
      )}
      <span className="stat-label">{label}</span>
      <span className="stat-value num">{loading ? '—' : count}</span>
      <span className="xs muted">{count > 0 ? hint : 'Nothing waiting'}</span>
    </Link>
  );
}
