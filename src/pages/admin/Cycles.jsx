import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminCycles } from '../../hooks/useAdminLedger';
import { money, shortDate } from '../../lib/format';
import { downloadCsv } from '../../lib/csv';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Field';
import Pager from '../../components/ui/Pager';
import StatusBadge from '../../components/ui/Status';
import { EmptyState, ErrorState, SkeletonLines } from '../../components/ui/States';
import './admin.css';

const STATUSES = ['PENDING_ACTIVATION', 'ACTIVE', 'COMPLETED', 'CLOSED', 'REJECTED'];

/** Every contribution cycle across the operation, read-only. */
export default function Cycles() {
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const { data, loading, error, refetch } = useAdminCycles({ status, search, page });

  const rows = data?.rows || [];

  const reset = (fn) => (e) => { fn(e.target.value); setPage(0); };

  const exportRows = () =>
    downloadCsv(
      'naijanest-cycles',
      [
        { key: 'customer.member_id', label: 'Member ID' },
        { key: 'customer.full_name', label: 'Customer' },
        { key: 'collector.full_name', label: 'Collector' },
        { key: 'daily_amount_snapshot', label: 'Daily amount (NGN)' },
        { key: 'duration_days', label: 'Duration (days)' },
        { key: 'status', label: 'Status' },
        { key: 'start_date', label: 'Start', format: (v) => (v ? shortDate(v) : '') },
        { key: 'expected_end_date', label: 'Expected end', format: (v) => (v ? shortDate(v) : '') },
        { key: 'closed_at', label: 'Closed', format: (v) => (v ? shortDate(v) : '') },
        { key: 'rejection_reason', label: 'Rejection reason' },
      ],
      rows
    );

  return (
    <>
      <header className="page-head row-between">
        <div>
          <h1>Cycles</h1>
          <p>Every contribution cycle, past and present.</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportRows} disabled={!rows.length}>
          Export page
        </Button>
      </header>

      <Card>
        <div className="filter-grid">
          <Select label="Status" value={status} onChange={reset(setStatus)}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, ' ').toLowerCase()}</option>
            ))}
          </Select>
          <Input
            label="Customer"
            placeholder="Name or member ID"
            value={search}
            onChange={reset(setSearch)}
          />
        </div>
      </Card>

      <div style={{ marginTop: 'var(--s-4)' }}>
        {loading && <SkeletonLines count={5} height={72} />}
        {error && !loading && <ErrorState message={error} onRetry={refetch} />}

        {!loading && !error && !rows.length && (
          <Card large>
            <EmptyState
              title="No cycles match"
              message={status || search ? 'Try clearing the filters.' : 'Cycles appear here once customers start saving.'}
              icon="◌"
            />
          </Card>
        )}

        <div className="stack">
          {rows.map((c) => (
            <Card key={c.id}>
              <div className="row-between" style={{ alignItems: 'flex-start' }}>
                <div style={{ minWidth: 0 }}>
                  <Link to={`/admin/users/${c.customer?.id}`} className="ledger-name">
                    {c.customer?.full_name}
                  </Link>
                  <p className="xs muted num" style={{ margin: '2px 0 0' }}>
                    {c.customer?.member_id} · {money(c.daily_amount_snapshot)}/day × {c.duration_days}
                  </p>
                  <p className="xs muted" style={{ margin: '2px 0 0' }}>
                    {c.collector?.full_name || 'no collector'}
                    {c.start_date && ` · from ${shortDate(c.start_date)}`}
                  </p>
                  {c.rejection_reason && (
                    <p className="xs" style={{ margin: '4px 0 0', color: 'var(--danger)' }}>
                      {c.rejection_reason}
                    </p>
                  )}
                </div>
                <StatusBadge status={c.status} />
              </div>
            </Card>
          ))}
        </div>

        <Pager page={page} count={data?.count || 0} pageSize={data?.pageSize || 25} onChange={setPage} />
      </div>
    </>
  );
}