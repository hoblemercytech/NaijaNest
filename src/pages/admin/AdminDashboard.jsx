import {
  ArrowUpRight, CalendarDays, CalendarRange, TrendingUp, UserCog, Users, Wallet,
} from 'lucide-react';
import { useAdminDashboard } from '../../hooks/useAdmin';
import { money } from '../../lib/format';
import { Card, CardHead } from '../../components/ui/Card';
import { ErrorState, SkeletonPanel, SkeletonLines } from '../../components/ui/States';
import { useRealtime, LIVE_TABLES } from '../../hooks/useRealtime';
import './admin.css';

/**
 * Operational overview. Every figure comes from nn_admin_dashboard in a single
 * round trip — nothing is summed in the browser, so what an admin sees is what
 * the database holds.
 */
export default function AdminDashboard() {
  const { data, loading, error, refetch } = useAdminDashboard();

    useRealtime(LIVE_TABLES.ADMIN, refetch);
    
  if (loading) {
    return (
      <>
        <header className="page-head"><h1>Overview</h1></header>
        <SkeletonPanel />
        <div style={{ marginTop: 'var(--s-4)' }}><SkeletonLines count={3} height={84} /></div>
      </>
    );
  }
  if (error) {
    return (
      <>
        <header className="page-head"><h1>Overview</h1></header>
        <ErrorState message={error} onRetry={refetch} />
      </>
    );
  }

  const d = data || {};
  const withCollectors = Number(d.cash_with_collectors ?? 0);

  return (
    <>
      <header className="page-head">
        <h1>Overview</h1>
        <p>Live position across every collector and customer.</p>
      </header>

      {/* Customer money owed out is the number that matters most, so it gets
          the one prominent surface. */}
      <section className="panel-balance">
        <div className="label">Total customer balance</div>
        <div className="amount num">{money(d.customer_balance)}</div>
        <div className="footnote">
          Contributed {money(d.total_contributed)} · Paid out {money(d.total_withdrawn)}
        </div>
      </section>

      <div className="metric-grid" style={{ marginTop: 'var(--s-4)' }}>
        <Metric label="Collected today" value={money(d.collected_today)} Icon={TrendingUp} />
        <Metric label="This week" value={money(d.collected_week)} Icon={CalendarDays} />
        <Metric label="This month" value={money(d.collected_month)} Icon={CalendarRange} />
        <Metric
          label="Customers"
          value={d.total_users ?? 0}
          foot={`${d.active_contributors ?? 0} contributing`}
          Icon={Users}
        />
        <Metric label="Collectors" value={d.total_collectors ?? 0} Icon={UserCog} />
        <Metric
          label="Pending withdrawals"
          value={d.pending_withdrawals ?? 0}
          foot={money(d.pending_withdrawal_amount)}
          Icon={ArrowUpRight}
          tone={(d.pending_withdrawals ?? 0) > 0 ? 'warn' : 'accent'}
        />
      </div>

      <Card large style={{ marginTop: 'var(--s-5)' }}>
        <CardHead title="Cash position" />
        <dl className="detail-list">
          <div>
            <dt><Wallet size={14} strokeWidth={1.9} /> Held by collectors</dt>
            <dd className="num">{money(withCollectors)}</dd>
          </div>
          <div>
            <dt>Handed over and confirmed</dt>
            <dd className="num">{money(d.cash_handed_over)}</dd>
          </div>
          <div>
            <dt>Handovers awaiting confirmation</dt>
            <dd className="num">{money(d.cash_handover_pending)}</dd>
          </div>
          <div>
            <dt>Paid out to customers</dt>
            <dd className="num">{money(d.cash_paid_out)}</dd>
          </div>
        </dl>
        <p className="field-hint">
          Held by collectors is collections minus payouts minus confirmed handovers.
          It is what should physically be in their hands right now.
        </p>
      </Card>
    </>
  );
}

function Metric({ label, value, foot, Icon, tone = 'accent' }) {
  return (
    <div className="stat">
      <div className="stat-head">
        <span className="stat-label">{label}</span>
        {Icon && (
          <span className={`stat-icon is-${tone}`} aria-hidden="true">
            <Icon size={15} strokeWidth={2} />
          </span>
        )}
      </div>
      <div className="stat-value num">{value}</div>
      {foot && <div className="xs muted stat-foot">{foot}</div>}
    </div>
  );
}
