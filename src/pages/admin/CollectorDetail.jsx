import { Link, useParams } from 'react-router-dom';
import { useCollectorDetail } from '../../hooks/useAdmin';
import { useCollectorTotals } from '../../hooks/useCollectorTotals';
import { useAvatarUrl, useAvatarUrls } from '../../hooks/useAvatar';
import { money, shortDate, dateTime } from '../../lib/format';
import { Card, CardHead } from '../../components/ui/Card';
import Avatar from '../../components/ui/Avatar';
import StatusBadge from '../../components/ui/Status';
import { EmptyState, ErrorState, SkeletonPanel, SkeletonLines } from '../../components/ui/States';
import '../../components/customer-detail.css';
import './admin.css';
import { UserCog, Users, Wallet } from 'lucide-react';

/**
 * One collector's position.
 *
 * The headline figure is physical cash in hand — cash they recorded, minus any
 * customer payouts they made themselves, minus confirmed handovers. Transfers
 * go straight to the business account and never pass through their hands, so
 * they are shown separately and never counted as cash.
 */
export default function CollectorDetail() {
  const { id } = useParams();
  const { data, loading, error, refetch } = useCollectorDetail(id);
  const totalsQuery = useCollectorTotals(id);
  const avatar = useAvatarUrl(data?.profile?.avatar_url);
  const avatars = useAvatarUrls(data?.customers?.map((c) => c.avatar_url));

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
        Icon={UserCog}
        action={<Link to="/admin/collectors" className="btn btn-outline">Back to collectors</Link>}
      />
    );
  }

  const { profile, customers, handovers } = data;
  const t = totalsQuery.data;
  const inHand = Number(t?.cash_in_hand ?? 0);
  const pendingAmount = Number(t?.handover_pending ?? 0);

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
        <div className="amount num">{totalsQuery.loading ? '—' : money(inHand)}</div>
        <div className="footnote">
          Cash collected {money(t?.cash_collected)} · Handed over {money(t?.cash_handed_over)}
        </div>
      </section>

      {totalsQuery.error && !totalsQuery.loading && (
        <div style={{ marginTop: 'var(--s-3)' }}>
          <ErrorState message={totalsQuery.error} onRetry={totalsQuery.refetch} />
        </div>
      )}

      {pendingAmount > 0 && (
        <p className="field-hint" style={{ marginTop: 'var(--s-3)' }}>
          {money(pendingAmount)} is submitted but not yet confirmed — it still counts as in hand
          until you confirm it.
        </p>
      )}

      {t && (
        <Card large style={{ marginTop: 'var(--s-4)' }}>
          <CardHead title="Money collected" />
          <dl className="detail-list">
            <div><dt>Cash collected, today</dt><dd className="num">{money(t.cash_today)}</dd></div>
            <div><dt>Transfers collected, today</dt><dd className="num">{money(t.transfer_today)}</dd></div>
            <div><dt>Cash collected, all time</dt><dd className="num">{money(t.cash_collected)}</dd></div>
            <div><dt>Transfers collected, all time</dt><dd className="num">{money(t.transfers_collected)}</dd></div>
            <div><dt>Customer payouts they paid in cash</dt><dd className="num">{money(t.cash_paid_out)}</dd></div>
          </dl>
          <p className="field-hint">
            Transfers are paid into the business account, so they are never part of the cash
            a collector holds.
          </p>
        </Card>
      )}

      <h2 className="section-head">Customers ({customers.length})</h2>

      {!customers.length && (
        <Card large>
          <EmptyState
            title="No customers assigned"
            message="Assign customers from the Customers screen so this collector has a round."
            Icon={Users}
          />
        </Card>
      )}

      <div className="stack">
        {customers.map((c) => (
          <Link key={c.id} to={`/admin/users/${c.id}`} className="card card-link">
            <div className="row-between">
              <div className="row" style={{ gap: 12, minWidth: 0 }}>
                <Avatar name={c.full_name} url={avatars[c.avatar_url]} size={38} />
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
            Icon={Wallet}
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
