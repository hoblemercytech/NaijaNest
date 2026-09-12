import { ArrowUpRight } from 'lucide-react';
import { useCollectorWithdrawals } from '../../hooks/useCollector';
import { money, shortDate, dateTime } from '../../lib/format';
import { Card } from '../../components/ui/Card';
import StatusBadge from '../../components/ui/Status';
import { EmptyState, ErrorState, SkeletonLines } from '../../components/ui/States';
import './collector.css';

/**
 * Read-only. Payouts are bank transfers sent by the office, so a collector no
 * longer confirms or pays them — they see their customers' requests for
 * context, nothing more. The RPCs enforce this too: nn_confirm_withdrawal and
 * nn_mark_withdrawal_paid now reject anyone who is not an admin.
 */
export default function Withdrawals() {
  const { data, loading, error, refetch } = useCollectorWithdrawals();

  const waiting = (data || []).filter((w) => ['PENDING', 'CONFIRMED'].includes(w.status));
  const settled = (data || []).filter((w) => ['PAID', 'REJECTED'].includes(w.status));

  return (
    <>
      <header className="page-head">
        <h1>Withdrawals</h1>
        <p>Your customers' requests. The office sends the transfers.</p>
      </header>

      {loading && <SkeletonLines count={3} height={110} />}
      {error && !loading && <ErrorState message={error} onRetry={refetch} />}

      {!loading && !error && !data?.length && (
        <Card large>
          <EmptyState
            title="No withdrawal requests"
            message="When a customer asks for their balance, it appears here."
            Icon={ArrowUpRight}
          />
        </Card>
      )}

      <div className="stack">
        {waiting.map((w) => (
          <Card key={w.id}>
            <div className="row-between" style={{ alignItems: 'flex-start' }}>
              <div>
                <h3>{w.customer?.full_name}</h3>
                <p className="xs muted num" style={{ margin: '2px 0 0' }}>
                  {w.customer?.member_id} · {w.customer?.phone || 'no phone'}
                </p>
              </div>
              <StatusBadge status={w.status} />
            </div>

            <div className="payout-amount">
              <span className="small muted">Amount to pay in cash</span>
              <span className="num">{money(w.requested_amount)}</span>
              <span className="xs muted">Requested {shortDate(w.requested_at)}</span>
            </div>


            <p className="field-hint">
              {w.status === 'PENDING'
                ? 'Waiting for the office to approve it.'
                : `Approved ${dateTime(w.confirmed_at)}. The office is sending the transfer.`}
            </p>
          </Card>
        ))}
      </div>

      {settled.length > 0 && (
        <Card large style={{ marginTop: 'var(--s-6)' }}>
          <h2 style={{ fontSize: 'var(--t-h3)', marginBottom: 'var(--s-3)' }}>History</h2>
          {settled.map((w) => (
            <div className="done-row" key={w.id}>
              <div>
                <div className="small" style={{ fontWeight: 500 }}>{w.customer?.full_name}</div>
                <div className="xs muted">
                  {w.status === 'PAID' ? dateTime(w.paid_at) : `Rejected: ${w.rejection_reason}`}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="num" style={{ fontWeight: 600 }}>{money(w.requested_amount)}</div>
                <StatusBadge status={w.status} />
              </div>
            </div>
          ))}
        </Card>
      )}

    </>
  );
}
