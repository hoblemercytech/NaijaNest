import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCustomerDetail, useCycleDays } from '../hooks/useCustomerDetail';
import { useAvatarUrl } from '../hooks/useAvatar';
import { money, shortDate, dateTime, isoDate } from '../lib/format';
import { Card, CardHead } from './ui/Card';
import Button from './ui/Button';
import Avatar from './ui/Avatar';
import StatusBadge from './ui/Status';
import { EmptyState, ErrorState, SkeletonPanel, SkeletonLines } from './ui/States';
import EditContributionModal from './EditContributionModal';
import './customer-detail.css';

/**
 * One customer, everything about them.
 *
 * Shared by the collector and admin routes. `mode` only decides which actions
 * appear — what data loads is decided by RLS, so an admin sees the same shape
 * of page with a wider set of buttons.
 */
export default function CustomerDetail({ mode = 'collector', backTo, actions }) {
  const { id } = useParams();
  const { data, loading, error, refetch } = useCustomerDetail(id);
  const avatar = useAvatarUrl(data?.profile?.avatar_url);
  const [openCycleId, setOpenCycleId] = useState(null);

  if (loading) {
    return (
      <>
        <SkeletonPanel height={120} />
        <div style={{ marginTop: 'var(--s-4)' }}><SkeletonLines count={3} height={90} /></div>
      </>
    );
  }
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!data) {
    return (
      <EmptyState
        title="Customer not found"
        message="They may have been reassigned to another collector."
        icon="☰"
        action={<Link to={backTo} className="btn btn-outline">Back to customers</Link>}
      />
    );
  }

  const { profile, summary, cycles, withdrawals, collector } = data;
  const activeCycle = cycles.find((c) =>
    ['PENDING_ACTIVATION', 'ACTIVE', 'COMPLETED'].includes(c.status)
  );

  return (
    <>
      <Link to={backTo} className="back-link">← Customers</Link>

      <header className="detail-head">
        <Avatar name={profile.full_name} url={avatar} size={56} />
        <div style={{ minWidth: 0 }}>
          <h1>{profile.full_name}</h1>
          <p className="small muted num" style={{ margin: '2px 0 0' }}>
            {profile.member_id} · {profile.phone || 'no phone'}
          </p>
        </div>
        <StatusBadge status={profile.status} />
      </header>

      {actions}

      <div className="grid-2" style={{ marginTop: 'var(--s-4)' }}>
        <div className="stat">
          <div className="stat-label">Current balance</div>
          <div className="stat-value num">{money(summary.current_balance)}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Contributed</div>
          <div className="stat-value num">{money(summary.total_contributed)}</div>
          <div className="xs muted" style={{ marginTop: 2 }}>
            {money(summary.total_withdrawn)} withdrawn
          </div>
        </div>
      </div>

      <Card large style={{ marginTop: 'var(--s-4)' }}>
        <CardHead title="Details" />
        <dl className="detail-list">
          <div><dt>Email</dt><dd>{profile.email}</dd></div>
          <div><dt>Collector</dt><dd>{collector?.full_name || 'Not assigned'}</dd></div>
          <div><dt>Joined</dt><dd>{shortDate(profile.created_at)}</dd></div>
        </dl>
      </Card>

      {/* --- cycles ---------------------------------------------------- */}
      <h2 className="section-head">Contribution cycles</h2>

      {!cycles.length && (
        <Card large>
          <EmptyState
            title="No cycles yet"
            message="They have not started saving. A cycle begins when they choose a plan and you activate it."
            icon="◇"
          />
        </Card>
      )}

      <div className="stack">
        {cycles.map((c) => (
          <Card key={c.id}>
            <div className="row-between" style={{ alignItems: 'flex-start' }}>
              <div>
                <h3 className="num">{money(c.daily_amount_snapshot)} a day</h3>
                <p className="xs muted" style={{ margin: '2px 0 0' }}>
                  {c.duration_days} days
                  {c.start_date && ` · from ${shortDate(c.start_date)}`}
                  {c.closed_at && ` · closed ${shortDate(c.closed_at)}`}
                </p>
                {c.rejection_reason && (
                  <p className="xs" style={{ margin: '4px 0 0', color: 'var(--danger)' }}>
                    {c.rejection_reason}
                  </p>
                )}
              </div>
              <StatusBadge status={c.status} />
            </div>

            {c.start_date && (
              <Button
                variant="ghost"
                size="sm"
                style={{ marginTop: 8, marginLeft: -12 }}
                onClick={() => setOpenCycleId(openCycleId === c.id ? null : c.id)}
              >
                {openCycleId === c.id ? 'Hide days' : 'View and correct days'}
              </Button>
            )}

            {openCycleId === c.id && (
              <CycleDays cycleId={c.id} canEdit={mode !== 'readonly'} onChanged={refetch} />
            )}
          </Card>
        ))}
      </div>

      {/* --- withdrawals ------------------------------------------------ */}
      {withdrawals.length > 0 && (
        <>
          <h2 className="section-head">Withdrawals</h2>
          <Card large>
            {withdrawals.map((w) => (
              <div className="done-row" key={w.id}>
                <div>
                  <div className="num" style={{ fontWeight: 600 }}>{money(w.requested_amount)}</div>
                  <div className="xs muted">
                    {w.status === 'PAID'
                      ? dateTime(w.paid_at)
                      : w.status === 'REJECTED'
                      ? w.rejection_reason
                      : `Requested ${shortDate(w.requested_at)}`}
                  </div>
                </div>
                <StatusBadge status={w.status} />
              </div>
            ))}
          </Card>
        </>
      )}

      {activeCycle?.status === 'PENDING_ACTIVATION' && (
        <p className="field-hint" style={{ marginTop: 'var(--s-4)' }}>
          This customer has a cycle waiting to be activated.
        </p>
      )}
    </>
  );
}

function CycleDays({ cycleId, canEdit, onChanged }) {
  const { data, loading, error, refetch } = useCycleDays(cycleId);
  const [editing, setEditing] = useState(null);
  const today = isoDate();

  const refreshAll = () => {
    refetch();
    onChanged();
  };

  if (loading) return <div style={{ marginTop: 12 }}><SkeletonLines count={2} height={38} /></div>;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <>
      <div className="day-list">
        {data?.map((d) => {
          const upcoming = d.status === 'UNPAID' && d.contribution_date > today;
          return (
            <div className="day-row" key={d.id}>
              <span className="day-num num">{d.day_number}</span>
              <span className="day-when">
                <span className="small">{shortDate(d.contribution_date)}</span>
                {d.status === 'PAID' && (
                  <span className="xs muted">
                    {dateTime(d.paid_at)} · {d.recorder?.full_name || 'unknown'}
                  </span>
                )}
              </span>
              <span className="day-amount num">
                {money(d.status === 'PAID' ? d.actual_amount : d.expected_amount)}
              </span>
              <StatusBadge status={upcoming ? 'FUTURE' : d.status} />
              {canEdit && !upcoming && (
                <Button variant="ghost" size="sm" onClick={() => setEditing(d)}>Correct</Button>
              )}
            </div>
          );
        })}
      </div>

      <EditContributionModal
        contribution={editing}
        onClose={() => setEditing(null)}
        onDone={refreshAll}
      />
    </>
  );
}