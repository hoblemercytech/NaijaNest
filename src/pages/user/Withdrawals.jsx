import { useWithdrawals, useFinancialSummary } from '../../hooks/useCustomer';
import { money, dateTime, shortDate } from '../../lib/format';
import { Card, CardHead } from '../../components/ui/Card';
import StatusBadge from '../../components/ui/Status';
import { EmptyState, ErrorState, SkeletonLines } from '../../components/ui/States';
import './user.css';

/**
 * Withdrawal history. A rejected or pending request never moves the balance,
 * so the summary at the top is safe to read straight from the database view.
 */
export default function Withdrawals() {
  const summary = useFinancialSummary();
  const { data, loading, error, refetch } = useWithdrawals();

  return (
    <>
      <header className="page-head">
        <h1>Withdrawals</h1>
        <p>Every payout is cash, handed to you by your collector.</p>
      </header>

      {!summary.loading && !summary.error && (
        <div className="grid-2" style={{ marginBottom: 'var(--s-5)' }}>
          <div className="stat">
            <div className="stat-label">Available now</div>
            <div className="stat-value num">{money(summary.data.current_balance)}</div>
          </div>
          <div className="stat">
            <div className="stat-label">Withdrawn to date</div>
            <div className="stat-value num">{money(summary.data.total_withdrawn)}</div>
          </div>
        </div>
      )}

      <Card large>
        <CardHead title="History" />
        {loading && <SkeletonLines count={3} height={64} />}
        {error && !loading && <ErrorState message={error} onRetry={refetch} />}

        {!loading && !error && data?.length === 0 && (
          <EmptyState
            title="No withdrawal history yet"
            message="When you request your balance, it shows up here with its status."
            icon="↑"
          />
        )}

        {!loading && !error && data?.map((w) => (
          <div className="history-row" key={w.id}>
            <div>
              <div className="history-amount num">{money(w.requested_amount)}</div>
              <div className="xs muted">
                Requested {shortDate(w.requested_at)}
                {w.status === 'PAID' && ` · Paid ${dateTime(w.paid_at)}`}
              </div>
              {w.status === 'REJECTED' && (
                <div className="history-reason">Reason: {w.rejection_reason}</div>
              )}
            </div>
            <StatusBadge status={w.status} />
          </div>
        ))}
      </Card>
    </>
  );
}