import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminWithdrawals } from '../../hooks/useAdminLedger';
import { money, shortDate, dateTime } from '../../lib/format';
import { downloadCsv } from '../../lib/csv';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Field';
import Pager from '../../components/ui/Pager';
import StatusBadge from '../../components/ui/Status';
import { EmptyState, ErrorState, SkeletonLines } from '../../components/ui/States';
import './admin.css';

/** Every withdrawal request. Only PAID ones have moved money. */
export default function Withdrawals() {
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(0);
  const { data, loading, error, refetch } = useAdminWithdrawals({ status, from, to, page });

  const rows = data?.rows || [];
  const reset = (fn) => (e) => { fn(e.target.value); setPage(0); };

  const exportRows = () =>
    downloadCsv(
      'budgetsave-withdrawals',
      [
        { key: 'requested_at', label: 'Requested', format: (v) => dateTime(v) },
        { key: 'customer.member_id', label: 'Member ID' },
        { key: 'customer.full_name', label: 'Customer' },
        { key: 'requested_amount', label: 'Amount (NGN)' },
        { key: 'status', label: 'Status' },
        { key: 'confirmed_at', label: 'Confirmed', format: (v) => (v ? dateTime(v) : '') },
        { key: 'paid_at', label: 'Paid', format: (v) => (v ? dateTime(v) : '') },
        { key: 'collector.full_name', label: 'Collector' },
        { key: 'rejection_reason', label: 'Rejection reason' },
        { key: 'note', label: 'Note' },
      ],
      rows
    );

  return (
    <>
      <header className="page-head row-between">
        <div>
          <h1>Withdrawals</h1>
          <p>Every request. Only paid ones reduce a balance.</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportRows} disabled={!rows.length}>
          Export page
        </Button>
      </header>

      <Card>
        <div className="filter-grid">
          <Select label="Status" value={status} onChange={reset(setStatus)}>
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PAID">Paid</option>
            <option value="REJECTED">Rejected</option>
          </Select>
          <Input label="From" type="date" value={from} max={to || undefined} onChange={reset(setFrom)} />
          <Input label="To" type="date" value={to} min={from || undefined} onChange={reset(setTo)} />
        </div>
      </Card>

      <div style={{ marginTop: 'var(--s-4)' }}>
        {loading && <SkeletonLines count={5} height={72} />}
        {error && !loading && <ErrorState message={error} onRetry={refetch} />}

        {!loading && !error && !rows.length && (
          <Card large>
            <EmptyState
              title="No withdrawals match"
              message="Try clearing the filters, or check back once customers start withdrawing."
              icon="↑"
            />
          </Card>
        )}

        <div className="stack">
          {rows.map((w) => (
            <Card key={w.id}>
              <div className="row-between" style={{ alignItems: 'flex-start' }}>
                <div style={{ minWidth: 0 }}>
                  <div className="num" style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1.1rem' }}>
                    {money(w.requested_amount)}
                  </div>
                  <Link to={`/admin/users/${w.customer?.id}`} className="ledger-name">
                    {w.customer?.full_name}
                  </Link>
                  <p className="xs muted num" style={{ margin: '2px 0 0' }}>
                    {w.customer?.member_id} · {w.collector?.full_name || 'no collector'}
                  </p>
                  <p className="xs muted" style={{ margin: '2px 0 0' }}>
                    Requested {shortDate(w.requested_at)}
                    {w.paid_at && ` · paid ${dateTime(w.paid_at)}`}
                  </p>
                  {w.rejection_reason && (
                    <p className="xs" style={{ margin: '4px 0 0', color: 'var(--danger)' }}>
                      {w.rejection_reason}
                    </p>
                  )}
                </div>
                <StatusBadge status={w.status} />
              </div>
            </Card>
          ))}
        </div>

        <Pager page={page} count={data?.count || 0} pageSize={data?.pageSize || 25} onChange={setPage} />
      </div>
    </>
  );
}
