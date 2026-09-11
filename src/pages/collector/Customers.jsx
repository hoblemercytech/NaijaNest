import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMyCustomers } from '../../hooks/useCollector';
import { useAvatarUrls } from '../../hooks/useAvatar';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Field';
import StatusBadge from '../../components/ui/Status';
import Avatar from '../../components/ui/Avatar';
import { EmptyState, ErrorState, SkeletonLines } from '../../components/ui/States';
import './collector.css';
import { Users } from 'lucide-react';

/** Only the collector's own customers — enforced by RLS, not by this query. */
export default function Customers() {
  const [search, setSearch] = useState('');
  const { data, loading, error, refetch } = useMyCustomers(search);
  const avatars = useAvatarUrls(data?.map((c) => c.avatar_url));

  return (
    <>
      <header className="page-head">
        <h1>My customers</h1>
        <p>{data?.length ? `${data.length} assigned to you` : 'Everyone assigned to you.'}</p>
      </header>

      <Input
        placeholder="Search name, member ID or phone"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Search customers"
      />

      <div style={{ marginTop: 'var(--s-4)' }}>
        {loading && <SkeletonLines count={4} height={72} />}
        {error && !loading && <ErrorState message={error} onRetry={refetch} />}

        {!loading && !error && !data?.length && (
          <Card large>
            <EmptyState
              title={search ? 'No one matches that search' : 'No customers assigned to you'}
              message={
                search
                  ? 'Try a different name, member ID or phone number.'
                  : 'An admin assigns customers to you. They will show up here.'
              }
              Icon={Users}
            />
          </Card>
        )}

        <div className="stack">
          {data?.map((c) => (
            <Link key={c.id} to={`/collector/customers/${c.id}`} className="card card-link">
              <div className="row-between">
                <div className="row" style={{ gap: 12, minWidth: 0 }}>
                  <Avatar name={c.full_name} url={avatars[c.avatar_url]} size={42} />
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ fontSize: 'var(--t-body)' }}>{c.full_name}</h3>
                    <p className="xs muted num" style={{ margin: '2px 0 0' }}>
                      {c.member_id} · {c.phone || 'no phone'}
                    </p>
                  </div>
                </div>
                <StatusBadge status={c.status} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
