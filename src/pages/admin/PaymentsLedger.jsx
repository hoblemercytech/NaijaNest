import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Banknote, Landmark, Filter, Download, Radio, CircleAlert, CheckCircle2,
} from 'lucide-react';
import {
  usePaymentsLedger, useCollectorMoneyIn, useProviderEvents,
} from '../../hooks/usePayments';
import { useCollectors } from '../../hooks/useAdmin';
import { useRealtime } from '../../hooks/useRealtime';
import { money, dateTime, shortDate } from '../../lib/format';
import { downloadCsv } from '../../lib/csv';
import { Card, CardHead } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Field';
import Pager from '../../components/ui/Pager';
import { EmptyState, ErrorState, SkeletonLines } from '../../components/ui/States';
import './admin.css';

/**
 * Every naira in, however it arrived.
 *
 * Cash and transfers were two separate screens, which meant answering "what
 * did this collector bring in last week" involved adding two numbers by hand.
 * One ledger, filterable by collector and by customer, is the screen an admin
 * actually opens.
 */
export default function PaymentsLedger() {
  const [filters, setFilters] = useState({
    from: '', to: '', collectorId: '', customerId: '', method: '', page: 0,
  });

  const ledger = usePaymentsLedger(filters);
  const breakdown = useCollectorMoneyIn(filters.from, filters.to);
  const events = useProviderEvents();
  const collectors = useCollectors();

  useRealtime(['daily_contributions', 'payment_claims'], () => {
    ledger.refetch();
    breakdown.refetch();
  });

  // Any filter change resets to the first page — otherwise you land on page 4
  // of a three-page result and see nothing.
  const set = (k) => (e) =>
    setFilters((f) => ({ ...f, [k]: e.target.value, page: 0 }));

  const rows = ledger.data?.rows || [];
  const totals = rows.reduce(
    (acc, r) => {
      const amount = Number(r.amount || 0);
      acc.all += amount;
      if (r.method === 'CASH') acc.cash += amount;
      else acc.transfer += amount;
      return acc;
    },
    { all: 0, cash: 0, transfer: 0 }
  );

  const unmatched = (events.data || []).filter(
    (e) => e.outcome === 'MISMATCH' || e.outcome === 'NO_MATCH'
  );

  const exportRows = () =>
    downloadCsv(
      'budgetsave-payments',
      [
        { key: 'paid_at', label: 'When', format: (v) => dateTime(v) },
        { key: 'method', label: 'Method' },
        { key: 'amount', label: 'Amount (NGN)' },
        { key: 'member_id', label: 'Member ID' },
        { key: 'customer_name', label: 'Customer' },
        { key: 'collector_name', label: 'Collector' },
        { key: 'reference', label: 'Reference' },
        { key: 'recorded_by_name', label: 'Recorded by' },
      ],
      rows
    );

  return (
    <>
      <header className="page-head row-between">
        <div>
          <h1>Payments</h1>
          <p>Every contribution received, cash and transfer.</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportRows} disabled={!rows.length}>
          <Download size={14} /> Export page
        </Button>
      </header>

      {/* Anything the webhook could not place needs a person, and needs one
          before the customer chases it. */}
      {unmatched.length > 0 && (
        <div className="panel-note tone-rose" style={{ marginBottom: 'var(--s-4)' }}>
          <span className="panel-note-icon"><CircleAlert size={17} strokeWidth={1.9} /></span>
          <div>
            <h4>{unmatched.length} unmatched {unmatched.length === 1 ? 'payment' : 'payments'}</h4>
            <p>
              Money arrived that does not match any reported payment. Check the webhook
              activity below and confirm manually.
            </p>
          </div>
        </div>
      )}

      <div className="metric-grid" style={{ marginBottom: 'var(--s-4)' }}>
        <div className="stat tone-green">
          <span className="stat-icon" aria-hidden="true"><Banknote size={17} strokeWidth={1.9} /></span>
          <div className="stat-label">On this page</div>
          <div className="stat-value num">{money(totals.all)}</div>
        </div>
        <div className="stat tone-amber">
          <span className="stat-icon" aria-hidden="true"><Banknote size={17} strokeWidth={1.9} /></span>
          <div className="stat-label">Cash</div>
          <div className="stat-value num">{money(totals.cash)}</div>
        </div>
        <div className="stat tone-azure">
          <span className="stat-icon" aria-hidden="true"><Landmark size={17} strokeWidth={1.9} /></span>
          <div className="stat-label">Transfer</div>
          <div className="stat-value num">{money(totals.transfer)}</div>
        </div>
      </div>

      <Card>
        <CardHead title="Filter" sub={`${ledger.data?.count ?? 0} payments match`} />
        <div className="filter-grid">
          <Select label="Collector" value={filters.collectorId} onChange={set('collectorId')}>
            <option value="">All collectors</option>
            {(collectors.data || []).map((c) => (
              <option key={c.id} value={c.id}>{c.full_name}</option>
            ))}
          </Select>

          <Select label="Method" value={filters.method} onChange={set('method')}>
            <option value="">Cash and transfer</option>
            <option value="CASH">Cash only</option>
            <option value="TRANSFER">Transfer only</option>
          </Select>

          <Input label="From" type="date" value={filters.from} max={filters.to || undefined} onChange={set('from')} />
          <Input label="To" type="date" value={filters.to} min={filters.from || undefined} onChange={set('to')} />
        </div>
      </Card>

      <div style={{ marginTop: 'var(--s-4)' }}>
        {ledger.loading && <SkeletonLines count={6} height={64} />}
        {ledger.error && !ledger.loading && (
          <ErrorState message={ledger.error} onRetry={ledger.refetch} />
        )}

        {!ledger.loading && !ledger.error && !rows.length && (
          <Card large>
            <EmptyState
              title="No payments match"
              message="Widen the dates, or clear the filters."
              Icon={Filter}
            />
          </Card>
        )}

        {rows.length > 0 && (
          <Card large>
            <table className="table is-stacked">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Customer</th>
                  <th>Collector</th>
                  <th>How</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={`${r.method}-${r.id}`}>
                    <td data-label="When">
                      <span className="small">{shortDate(r.paid_at)}</span>
                      <span className="xs muted" style={{ display: 'block' }}>
                        {new Date(r.paid_at).toLocaleTimeString('en-NG', {
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </td>

                    <td data-label="Customer">
                      <Link to={`/admin/users/${r.customer_id}`} className="ledger-name">
                        {r.customer_name}
                      </Link>
                      <span className="xs muted num" style={{ display: 'block' }}>
                        {r.member_id}
                      </span>
                    </td>

                    <td data-label="Collector">
                      <span className="small">{r.collector_name || '—'}</span>
                    </td>

                    <td data-label="How">
                      <span className={`chip ${r.method === 'CASH' ? 'is-warning' : 'is-info'}`}>
                        {r.method === 'CASH' ? 'Cash' : 'Transfer'}
                      </span>
                      {r.is_service_charge && (
                        <span className="xs muted" style={{ display: 'block', marginTop: 2 }}>
                          Service charge
                        </span>
                      )}
                      {r.periods > 1 && (
                        <span className="xs muted" style={{ display: 'block', marginTop: 2 }}>
                          {r.periods} payments
                        </span>
                      )}
                    </td>

                    <td data-label="Amount" className="num" style={{ textAlign: 'right', fontWeight: 600 }}>
                      {money(r.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        <Pager
          page={filters.page}
          count={ledger.data?.count || 0}
          pageSize={ledger.data?.pageSize || 50}
          onChange={(page) => setFilters((f) => ({ ...f, page }))}
        />
      </div>

      {/* Per collector */}
      {breakdown.data?.length > 0 && (
        <Card large style={{ marginTop: 'var(--s-6)' }}>
          <CardHead
            title="By collector"
            sub={filters.from || filters.to ? 'For the dates above' : 'All time'}
          />
          <table className="table is-stacked">
            <thead>
              <tr>
                <th>Collector</th>
                <th style={{ textAlign: 'right' }}>Cash</th>
                <th style={{ textAlign: 'right' }}>Transfer</th>
                <th style={{ textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.data.map((c) => (
                <tr key={c.collector_id}>
                  <td data-label="Collector">
                    <Link to={`/admin/collectors/${c.collector_id}`} className="ledger-name">
                      {c.collector_name}
                    </Link>
                    <span className="xs muted" style={{ display: 'block' }}>
                      {c.customers} {c.customers === 1 ? 'customer' : 'customers'} paid
                    </span>
                  </td>
                  <td data-label="Cash" className="num" style={{ textAlign: 'right' }}>
                    {money(c.cash_amount)}
                    <span className="xs muted" style={{ display: 'block' }}>{c.cash_count}×</span>
                  </td>
                  <td data-label="Transfer" className="num" style={{ textAlign: 'right' }}>
                    {money(c.transfer_amount)}
                    <span className="xs muted" style={{ display: 'block' }}>{c.transfer_count}×</span>
                  </td>
                  <td data-label="Total" className="num" style={{ textAlign: 'right', fontWeight: 700 }}>
                    {money(c.total_amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Webhook activity */}
      {events.data?.length > 0 && (
        <Card large style={{ marginTop: 'var(--s-6)' }}>
          <CardHead
            title="Automatic confirmations"
            sub="What the payment provider has sent us"
          />
          {events.data.slice(0, 12).map((e) => (
            <div className="done-row" key={e.id}>
              <div style={{ minWidth: 0 }}>
                <div className="small" style={{ fontWeight: 600 }}>
                  {money(e.amount)} · {e.account_ref}
                </div>
                <div className="xs muted">{e.note || dateTime(e.created_at)}</div>
              </div>
              <span className={`chip ${
                e.outcome === 'CONFIRMED' ? 'is-success'
                  : e.outcome === 'DUPLICATE' ? 'is-neutral'
                    : 'is-danger'
              }`}>
                {e.outcome === 'CONFIRMED' && <CheckCircle2 size={12} strokeWidth={2.4} />}
                {e.outcome}
              </span>
            </div>
          ))}
        </Card>
      )}

      {!events.data?.length && !events.loading && (
        <div className="panel-note tone-azure" style={{ marginTop: 'var(--s-6)' }}>
          <span className="panel-note-icon"><Radio size={17} strokeWidth={1.9} /></span>
          <div>
            <h4>No automatic confirmations yet</h4>
            <p>
              Once the payment provider's webhook is pointed at BudgetSave, transfers
              confirm themselves and appear here. Until then a collector confirms each
              one by hand.
            </p>
          </div>
        </div>
      )}
    </>
  );
}