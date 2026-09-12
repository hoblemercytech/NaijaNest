import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminContributions } from '../../hooks/useAdminLedger';
import { money, shortDate, dateTime } from '../../lib/format';
import { downloadCsv } from '../../lib/csv';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Field';
import Pager from '../../components/ui/Pager';
import StatusBadge from '../../components/ui/Status';
import { EmptyState, ErrorState, SkeletonLines } from '../../components/ui/States';
import './admin.css';

/** Every scheduled contribution day, paid or not. */
export default function Contributions() {
  const [status, setStatus] = useState('PAID');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(0);
  const { data, loading, error, refetch } = useAdminContributions({ status, from, to, page });

  const rows = data?.rows || [];
  const reset = (fn) => (e) => { fn(e.target.value); setPage(0); };

  const pageTotal = rows
    .filter((r) => r.status === 'PAID')
    .reduce((sum, r) => sum + Number(r.actual_amount || 0), 0);

  const exportRows = () =>
    downloadCsv(
      'budgetsave-contributions',
      [
        { key: 'contribution_date', label: 'Date', format: (v) => shortDate(v) },
        { key: 'customer.member_id', label: 'Member ID' },
        { key: 'customer.full_name', label: 'Customer' },
        { key: 'day_number', label: 'Day' },
        { key: 'expected_amount', label: 'Expected (NGN)' },
        { key: 'actual_amount', label: 'Paid (NGN)' },
        { key: 'status', label: 'Status' },
        { key: 'paid_at', label: 'Paid at', format: (v) => (v ? dateTime(v) : '') },
        { key: 'recorder.full_name', label: 'Recorded by' },
        { key: 'collector.full_name', label: 'Collector' },
        { key: 'note', label: 'Note' },
      ],
      rows
    );

  return (
    <>
      <header className="page-head row-between">
        <div>
          <h1>Contributions</h1>
          <p>Every scheduled day, paid or not.</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportRows} disabled={!rows.length}>
          Export page
        </Button>
      </header>

      <Card>
        <div className="filter-grid">
          <Select label="Status" value={status} onChange={reset(setStatus)}>
            <option value="">All</option>
            <option value="PAID">Paid</option>
            <option value="UNPAID">Unpaid</option>
            <option value="VOID">Voided</option>
          </Select>
          <Input label="From" type="date" value={from} max={to || undefined} onChange={reset(setFrom)} />
          <Input label="To" type="date" value={to} min={from || undefined} onChange={reset(setTo)} />
        </div>
      </Card>

      {rows.length > 0 && status === 'PAID' && (
        <div className="stat" style={{ marginTop: 'var(--s-4)' }}>
          <div className="stat-label">Total on this page</div>
          <div className="stat-value num">{money(pageTotal)}</div>
          <div className="xs muted">Use Analytics for whole-period totals.</div>
        </div>
      )}

      <div style={{ marginTop: 'var(--s-4)' }}>
        {loading && <SkeletonLines count={6} height={62} />}
        {error && !loading && <ErrorState message={error} onRetry={refetch} />}

        {!loading && !error && !rows.length && (
          <Card large>
            <EmptyState
              title="No contributions match"
              message="Try widening the date range or clearing the status filter."
              icon="▤"
            />
          </Card>
        )}

        {rows.length > 0 && (
          <Card large>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Customer</th>
                    <th className="right">Amount</th>
                    <th>Status</th>
                    <th>Recorded by</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td className="num">{shortDate(r.contribution_date)}</td>
                      <td>
                        <Link to={`/admin/users/${r.customer?.id}`} className="ledger-name">
                          {r.customer?.full_name}
                        </Link>
                        <div className="xs muted num">{r.customer?.member_id}</div>
                      </td>
                      <td className="right num">
                        {money(r.status === 'PAID' ? r.actual_amount : r.expected_amount)}
                      </td>
                      <td><StatusBadge status={r.status} /></td>
                      <td className="xs muted">{r.recorder?.full_name || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        <Pager page={page} count={data?.count || 0} pageSize={data?.pageSize || 25} onChange={setPage} />
      </div>
    </>
  );
}
