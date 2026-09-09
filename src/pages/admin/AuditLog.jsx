import { useState } from 'react';
import { useAuditLog } from '../../hooks/useAdmin';
import { dateTime, relative } from '../../lib/format';
import { downloadCsv } from '../../lib/csv';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Select } from '../../components/ui/Field';
import { EmptyState, ErrorState, SkeletonLines } from '../../components/ui/States';
import './admin.css';

const PAGE_SIZE = 30;

const ACTIONS = [
  'CYCLE_REQUESTED', 'CYCLE_ACTIVATED', 'CYCLE_REJECTED', 'CYCLE_COMPLETED', 'CYCLE_CLOSED',
  'CONTRIBUTION_RECORDED', 'CONTRIBUTION_BACKDATED_PAID', 'CONTRIBUTION_EDITED',
  'WITHDRAWAL_REQUESTED', 'WITHDRAWAL_CONFIRMED', 'WITHDRAWAL_REJECTED', 'WITHDRAWAL_PAID',
  'CASH_HANDOVER_CREATED', 'CASH_HANDOVER_RECEIVED', 'CASH_HANDOVER_DISPUTED',
  'CUSTOMER_ASSIGNED', 'CUSTOMER_REASSIGNED', 'PROFILE_EDITED', 'AVATAR_UPDATED',
];

const label = (action) =>
  action.toLowerCase().replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());

/**
 * Append-only history of every financial and administrative action. A database
 * trigger rejects updates and deletes on this table, so what is shown here is
 * what happened — including anything an admin did.
 */
export default function AuditLog() {
  const [action, setAction] = useState('');
  const [page, setPage] = useState(0);
  const { data, loading, error, refetch } = useAuditLog({ action, page, pageSize: PAGE_SIZE });

  const rows = data?.rows || [];
  const pages = Math.ceil((data?.count || 0) / PAGE_SIZE);

  const exportRows = () =>
    downloadCsv(
      'naijanest-audit-log',
      [
        { key: 'created_at', label: 'When', format: (v) => dateTime(v) },
        { key: 'actor.full_name', label: 'Who' },
        { key: 'actor_role', label: 'Role' },
        { key: 'action', label: 'Action' },
        { key: 'entity_type', label: 'Entity' },
        { key: 'entity_id', label: 'Entity ID' },
        { key: 'reason', label: 'Reason' },
      ],
      rows
    );

  return (
    <>
      <header className="page-head row-between">
        <div>
          <h1>Audit log</h1>
          <p>Every financial and administrative action, in order.</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportRows} disabled={!rows.length}>
          Export page
        </Button>
      </header>

      <Select
        value={action}
        onChange={(e) => { setAction(e.target.value); setPage(0); }}
        aria-label="Filter by action"
      >
        <option value="">All actions</option>
        {ACTIONS.map((a) => (
          <option key={a} value={a}>{label(a)}</option>
        ))}
      </Select>

      <div style={{ marginTop: 'var(--s-4)' }}>
        {loading && <SkeletonLines count={6} height={62} />}
        {error && !loading && <ErrorState message={error} onRetry={refetch} />}

        {!loading && !error && !rows.length && (
          <Card large>
            <EmptyState
              title={action ? 'Nothing logged for that action' : 'Nothing logged yet'}
              message="Entries appear as soon as anyone records a payment, activates a cycle or moves cash."
              icon="⎙"
            />
          </Card>
        )}

        {rows.length > 0 && (
          <Card large>
            {rows.map((row) => (
              <div className="audit-row" key={row.id}>
                <div className="audit-main">
                  <span className="audit-action">{label(row.action)}</span>
                  <span className="xs muted">
                    {row.actor?.full_name || 'System'}
                    {row.actor_role && ` · ${row.actor_role.toLowerCase()}`}
                  </span>
                  {row.reason && <span className="xs audit-reason">{row.reason}</span>}
                </div>
                <span className="xs muted" title={dateTime(row.created_at)}>
                  {relative(row.created_at)}
                </span>
              </div>
            ))}
          </Card>
        )}

        {pages > 1 && (
          <div className="pager">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span className="small muted num">Page {page + 1} of {pages}</span>
            <Button variant="outline" size="sm" disabled={page + 1 >= pages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        )}
      </div>
    </>
  );
}