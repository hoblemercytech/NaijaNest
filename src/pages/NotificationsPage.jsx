import { useNotifications } from '../hooks/useNotifications';
import { relative } from '../lib/format';
import Button from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState, ErrorState, SkeletonLines } from '../components/ui/States';

/** One feed, three roles. What lands in it is decided by the database. */
export default function NotificationsPage() {
  const { data, loading, error, refetch, markRead, markAllRead } = useNotifications();
  const unread = (data || []).filter((n) => !n.read_at).length;

  return (
    <>
      <header className="page-head row-between">
        <div>
          <h1>Notifications</h1>
          <p>{unread > 0 ? `${unread} unread` : 'Everything read'}</p>
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>Mark all read</Button>
        )}
      </header>

      {loading && <SkeletonLines count={5} height={72} />}
      {error && !loading && <ErrorState message={error} onRetry={refetch} />}

      {!loading && !error && data?.length === 0 && (
        <EmptyState
          title="You're all caught up"
          message="Contribution records, withdrawal updates and cycle changes show up here."
        />
      )}

      {!loading && !error && data?.length > 0 && (
        <div className="stack">
          {data.map((n) => (
            <Card
              key={n.id}
              className={n.read_at ? '' : 'is-unread'}
              style={n.read_at ? undefined : { borderLeft: '3px solid var(--gold)' }}
            >
              <div className="row-between" style={{ alignItems: 'flex-start' }}>
                <h3 style={{ fontSize: 'var(--t-body)' }}>{n.title}</h3>
                <span className="xs muted" style={{ whiteSpace: 'nowrap' }}>{relative(n.created_at)}</span>
              </div>
              <p className="small muted" style={{ margin: '4px 0 0' }}>{n.body}</p>
              {!n.read_at && (
                <Button variant="ghost" size="sm" onClick={() => markRead(n.id)} style={{ marginTop: 8, marginLeft: -12 }}>
                  Mark read
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}