import { useState } from 'react';
import { useCycleHistory, useCycleSchedule } from '../../hooks/useCustomer';
import { PER_LABEL } from '../../lib/banks';
import { money, shortDate } from '../../lib/format';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/Status';
import { EmptyState, ErrorState, SkeletonLines } from '../../components/ui/States';
import ContributionCalendar from '../../components/ContributionCalendar';
import './user.css';
import { CalendarDays } from 'lucide-react';

/**
 * Cycle history. Closed cycles stay visible with their original terms — a plan
 * price change never rewrites what a past cycle cost.
 */
export default function Contributions() {
  const { data, loading, error, refetch } = useCycleHistory();
  const [openId, setOpenId] = useState(null);

  return (
    <>
      <header className="page-head">
        <h1>Contributions</h1>
        <p>Your cycles, past and present.</p>
      </header>

      {loading && <SkeletonLines count={3} height={96} />}
      {error && !loading && <ErrorState message={error} onRetry={refetch} />}

      {!loading && !error && data?.length === 0 && (
        <Card large>
          <EmptyState
            title="Nothing here yet"
            message="Once you start a contribution cycle, it and every cycle after it stay on this page."
            Icon={CalendarDays}
          />
        </Card>
      )}

      <div className="stack">
        {data?.map((c) => (
          <Card key={c.id}>
            <div className="row-between" style={{ alignItems: 'flex-start' }}>
              <div>
                <h3 className="num">{money(c.daily_amount_snapshot)} {PER_LABEL[c.frequency] || "a day"}</h3>
                <p className="small muted" style={{ margin: '2px 0 0' }}>
                  {c.periods ?? c.duration_days} payments
                  {c.start_date && ` · from ${shortDate(c.start_date)}`}
                  {c.closed_at && ` · closed ${shortDate(c.closed_at)}`}
                </p>
                {c.rejection_reason && (
                  <p className="history-reason">Reason: {c.rejection_reason}</p>
                )}
              </div>
              <StatusBadge status={c.status} />
            </div>

            {c.start_date && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpenId(openId === c.id ? null : c.id)}
                style={{ marginTop: 8, marginLeft: -12 }}
              >
                {openId === c.id ? 'Hide days' : 'View days'}
              </Button>
            )}

            {openId === c.id && <CycleDays cycleId={c.id} />}
          </Card>
        ))}
      </div>
    </>
  );
}

function CycleDays({ cycleId }) {
  const { data, loading, error, refetch } = useCycleSchedule(cycleId);
  return (
    <div style={{ marginTop: 'var(--s-4)' }}>
      {loading && <SkeletonLines count={1} height={44} />}
      {error && !loading && <ErrorState message={error} onRetry={refetch} />}
      {!loading && !error && <ContributionCalendar days={data || []} />}
    </div>
  );
}
