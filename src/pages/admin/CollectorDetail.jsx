import { Link, useParams } from 'react-router-dom';
import { useCollectorDetail } from '../../hooks/useAdmin';
import { useAvatarUrl } from '../../hooks/useAvatar';
import { money, shortDate, dateTime } from '../../lib/format';
import { Card, CardHead } from '../../components/ui/Card';
import Avatar from '../../components/ui/Avatar';
import StatusBadge from '../../components/ui/Status';
import { EmptyState, ErrorState, SkeletonPanel, SkeletonLines } from '../../components/ui/States';
import '../../components/customer-detail.css';
import './admin.css';

/**
 * One collector's position.
 *
 * The headline figure is cash in hand — collections minus payouts minus
 * confirmed handovers. That is the number an operator actually needs, because
 * it is what the collector is personally accountable for right now.
 */
export default function CollectorDetail() {
  const { id } = useParams();
  const { data, loading, error, refetch } = useCollectorDetail(id);
  const avatar = useAvatarUrl(data?.profile?.avatar_url);

  if (loading) {
    return (
      <>
        <SkeletonPanel height={120} />
        <div style={{ marginTop: 'var(--s-4)' }}><SkeletonLines count={3} height={80} /></div>
      </>
    );
  }
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!data) {
    return (
      <EmptyState
        title="Collector not found"
        icon="◈"
        action={<Link to="/admin/collectors" className="btn btn-outline">Back to collectors</Link>}
      />
    );
  }

  const { profile, customers, handovers, totals } = data;
  const pendingHandovers = handovers.filter((h) => h.status === 'PENDING');

  return (
    <>
      <Link to="/admin/collectors" className="back-link">← Collectors</Link>

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

      <section className="panel-balance">
        <div className="label">Cash they should be holding</div>
        <div className="amount num">{money(totals.inHand)}</div>
        <div className="footnote">
          Collected {money(totals.collected)} · Paid out {money(totals.paidOut)} · Handed over{' '}
          {money(totals.handedOver)}
        </div>
      </section>

      {pendingHandovers.length > 0 && (
        <p className="field-hint" style={{ marginTop: 'var(--s-3)' }}>
          {money(pendingHandovers.reduce((s, h) => s + Number(h.amount), 0))} is submitted but not
          yet confirmed — it still counts as in hand until you confirm it.
        </p>
      )}

      <h2 className="section-head">Customers ({customers.length})</h2>

      {!customers.length && (
        <Card large>
          <EmptyState
            title="No customers assigned"
            message="Assign customers from the Customers screen so this collector has a round."
            icon="☰"
          />
        </Card>
      )}

      <div className="stack">
        {customers.map((c) => (
          <Link key={c.id} to={`/admin/users/${c.id}`} className="card card-link">
            <div className="row-between">
              <div className="row" style={{ gap: 12, minWidth: 0 }}>
                <Avatar name={c.full_name} size={38} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>{c.full_name}</div>
                  <div className="xs muted num">{c.member_id} · {c.phone || 'no phone'}</div>
                </div>
              </div>
              <StatusBadge status={c.status} />
            </div>
          </Link>
        ))}
      </div>

      <h2 className="section-head">Cash handovers</h2>

      <Card large>
        <CardHead title="Recent" />
        {!handovers.length && (
          <EmptyState
            title="No handovers yet"
            message="They have not passed any cash to the office."
            icon="▦"
          />
        )}
        {handovers.map((h) => (
          <div className="done-row" key={h.id}>
            <div>
              <div className="num" style={{ fontWeight: 600 }}>{money(h.amount)}</div>
              <div className="xs muted">
                Submitted {shortDate(h.submitted_at)}
                {h.received_at && ` · confirmed ${dateTime(h.received_at)}`}
              </div>
            </div>
            <StatusBadge status={h.status} />
          </div>
        ))}
      </Card>
    </>
  );
}