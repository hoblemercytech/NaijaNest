import { useMemo, useState } from 'react';
import { Landmark } from 'lucide-react';
import { useTransfersReport } from '../../hooks/useTransfersReport';
import { useCollectors } from '../../hooks/useAdmin';
import { money, dateTime, isoDate } from '../../lib/format';
import { downloadCsv } from '../../lib/csv';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Field';
import { EmptyState, ErrorState, SkeletonLines } from '../../components/ui/States';
import './admin.css';

const EMPTY_ROWS = [];
/** Every confirmed transfer, by collector and day, with the account it was paid into. */
export default function Transfers() {
  const today = isoDate();
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [collectorId, setCollectorId] = useState('');

  const collectors = useCollectors();
  const { data, loading, error, refetch } = useTransfersReport({ from, to, collectorId });

  const rows = data ?? EMPTY_ROWS;
  const total = rows.reduce((sum, r) => sum + Number(r.amount), 0);

  const perCollector = useMemo(() => {
    const totals = new Map();
    rows.forEach((r) => {
      const name = r.collector_name || 'No collector';
      totals.set(name, (totals.get(name) || 0) + Number(r.amount));
    });
    return [...totals.entries()];
  }, [rows]);

  const exportRows = () =>
    downloadCsv(
      'budgetsave-transfers',
      [
        { key: 'confirmed_at', label: 'Confirmed', format: (v) => (v ? dateTime(v) : '') },
        { key: 'customer_name', label: 'Customer' },
        { key: 'member_id', label: 'Member ID' },
        { key: 'collector_name', label: 'Collector' },
        { key: 'amount', label: 'Amount (NGN)' },
        { key: 'periods', label: 'Payments' },
        { key: 'bank_name', label: 'Bank' },
        { key: 'account_number', label: 'Account number' },
        { key: 'account_name', label: 'Account name' },
        { key: 'reference', label: 'Reference' },
        { key: 'confirmed_by', label: 'Confirmed by' },
        { key: 'source', label: 'Source' },
      ],
      rows
    );

  return (
    <>
      <header className="page-head row-between">
        <div>
          <h1>Transfers</h1>
          <p>Every confirmed transfer, by collector and day.</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportRows} disabled={!rows.length}>
          Export CSV
        </Button>
      </header>

      <Card>
        <div className="filter-grid">
          <Input label="From" type="date" value={from} max={to || undefined}
                 onChange={(e) => setFrom(e.target.value)} />
          <Input label="To" type="date" value={to} min={from || undefined}
                 onChange={(e) => setTo(e.target.value)} />
          <Select label="Collector" value={collectorId} onChange={(e) => setCollectorId(e.target.value)}>
            <option value="">All collectors</option>
            {(collectors.data || []).map((c) => (
              <option key={c.id} value={c.id}>{c.full_name}</option>
            ))}
          </Select>
        </div>
      </Card>

      {!loading && !error && rows.length > 0 && (
        <div style={{ marginTop: 'var(--s-4)' }}>
          <div className="stat">
            <div className="stat-label">Total transferred</div>
            <div className="stat-value num">{money(total)}</div>
            <div className="xs muted">{rows.length} transfer{rows.length === 1 ? '' : 's'}</div>
          </div>

          {!collectorId && perCollector.length > 1 && (
            <Card style={{ marginTop: 'var(--s-3)' }}>
              {perCollector.map(([name, sum]) => (
                <div className="done-row" key={name}>
                  <div className="small" style={{ fontWeight: 500 }}>{name}</div>
                  <div className="num" style={{ fontWeight: 600 }}>{money(sum)}</div>
                </div>
              ))}
            </Card>
          )}
        </div>
      )}

      <div style={{ marginTop: 'var(--s-4)' }}>
        {loading && <SkeletonLines count={4} height={96} />}
        {error && !loading && <ErrorState message={error} onRetry={refetch} />}

        {!loading && !error && !rows.length && (
          <Card large>
            <EmptyState
              title="No transfers in this range"
              message="Try another day or collector."
              Icon={Landmark}
            />
          </Card>
        )}

        <div className="stack">
          {rows.map((r) => (
            <Card key={r.claim_id}>
              <div className="row-between" style={{ alignItems: 'flex-start' }}>
                <div style={{ minWidth: 0 }}>
                  <h3 className="num">{money(r.amount)}</h3>
                  <p className="small" style={{ margin: '2px 0 0', fontWeight: 600 }}>{r.customer_name}</p>
                  <p className="xs muted num" style={{ margin: '2px 0 0' }}>
                    {r.member_id} · {r.periods} payment{r.periods === 1 ? '' : 's'}
                  </p>
                </div>
                <span className="xs muted">{r.source}</span>
              </div>

              <dl className="detail-list" style={{ marginTop: 'var(--s-3)' }}>
                <div><dt>Collector</dt><dd>{r.collector_name || '—'}</dd></div>
                <div>
                  <dt>Paid into</dt>
                  <dd>
                    {r.bank_name || '—'} · <span className="num">{r.account_number || '—'}</span>
                    {r.account_name && <span className="muted"> · {r.account_name}</span>}
                  </dd>
                </div>
                {r.reference && <div><dt>Reference</dt><dd className="num xs">{r.reference}</dd></div>}
                <div><dt>Confirmed</dt><dd>{dateTime(r.confirmed_at)}{r.confirmed_by ? ` · ${r.confirmed_by}` : ''}</dd></div>
              </dl>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}