import { useState } from 'react';
import { BarChart3, UserCog } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useAnalytics, useCollectorPerformance } from '../../hooks/useAdmin';
import { useChartColors } from '../../context/ThemeContext';
import { money, moneyShort, dayMonth, isoDate } from '../../lib/format';
import { downloadCsv } from '../../lib/csv';
import { Card, CardHead } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/Field';
import { EmptyState, ErrorState, SkeletonLines } from '../../components/ui/States';
import './admin.css';

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return isoDate(d);
};

const PRESETS = [
  { label: '7 days', from: () => daysAgo(6) },
  { label: '30 days', from: () => daysAgo(29) },
  { label: '90 days', from: () => daysAgo(89) },
];

/**
 * Every series here is computed by nn_admin_analytics over a date range the
 * admin picks. When a period genuinely has no activity the charts are replaced
 * by an empty state — a flat line at zero reads as a broken chart, not as "no
 * money moved".
 */
export default function Analytics() {
  const [start, setStart] = useState(daysAgo(29));
  const [end, setEnd] = useState(isoDate());

  // recharts sets stroke/fill as SVG attributes, where var() does not resolve,
  // so the theme's colours are read from the document and passed as values.
  const c = useChartColors();
  const series = useAnalytics(start, end);
  const collectors = useCollectorPerformance(start, end);

  const rows = series.data || [];
  const hasActivity = rows.some(
    (r) => Number(r.contributions) > 0 || Number(r.withdrawals) > 0
  );

  const totals = rows.reduce(
    (acc, r) => ({
      contributions: acc.contributions + Number(r.contributions || 0),
      withdrawals: acc.withdrawals + Number(r.withdrawals || 0),
      contributionCount: acc.contributionCount + Number(r.contribution_count || 0),
      newUsers: acc.newUsers + Number(r.new_users || 0),
    }),
    { contributions: 0, withdrawals: 0, contributionCount: 0, newUsers: 0 }
  );

  const chartData = rows.map((r) => ({
    day: dayMonth(r.day),
    contributions: Number(r.contributions || 0),
    withdrawals: Number(r.withdrawals || 0),
    net: Number(r.net || 0),
  }));

  const exportSeries = () =>
    downloadCsv(
      'budgetsave-financial-activity',
      [
        { key: 'day', label: 'Date' },
        { key: 'contributions', label: 'Contributions (NGN)' },
        { key: 'contribution_count', label: 'Contribution count' },
        { key: 'withdrawals', label: 'Withdrawals (NGN)' },
        { key: 'withdrawal_count', label: 'Withdrawal count' },
        { key: 'net', label: 'Net (NGN)' },
        { key: 'new_users', label: 'New customers' },
        { key: 'handovers', label: 'Handovers confirmed (NGN)' },
      ],
      rows
    );

  const exportCollectors = () =>
    downloadCsv(
      'bu-collector-performance',
      [
        { key: 'collector_name', label: 'Collector' },
        { key: 'customers', label: 'Customers' },
        { key: 'collected', label: 'Collected (NGN)' },
        { key: 'expected', label: 'Expected (NGN)' },
        { key: 'paid_days', label: 'Days paid' },
        { key: 'missed_days', label: 'Days missed' },
        { key: 'withdrawals_paid', label: 'Withdrawals paid (NGN)' },
        { key: 'handed_over', label: 'Handed over (NGN)' },
      ],
      collectors.data || []
    );

  return (
    <>
      <header className="page-head row-between">
        <div>
          <h1>Analytics</h1>
          <p>Money movement across the whole operation.</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportSeries} disabled={!rows.length}>
          Export CSV
        </Button>
      </header>

      <Card>
        <div className="row wrap" style={{ gap: 8, marginBottom: 'var(--s-3)' }}>
          {PRESETS.map((p) => (
            <Button
              key={p.label}
              size="sm"
              variant={start === p.from() && end === isoDate() ? 'primary' : 'outline'}
              onClick={() => { setStart(p.from()); setEnd(isoDate()); }}
            >
              {p.label}
            </Button>
          ))}
        </div>
        <div className="grid-2">
          <Input label="From" type="date" value={start} max={end} onChange={(e) => setStart(e.target.value)} />
          <Input label="To" type="date" value={end} min={start} max={isoDate()} onChange={(e) => setEnd(e.target.value)} />
        </div>
      </Card>

      {series.loading && <div style={{ marginTop: 'var(--s-4)' }}><SkeletonLines count={2} height={220} /></div>}
      {series.error && !series.loading && (
        <div style={{ marginTop: 'var(--s-4)' }}>
          <ErrorState message={series.error} onRetry={series.refetch} />
        </div>
      )}

      {!series.loading && !series.error && !hasActivity && (
        <Card large style={{ marginTop: 'var(--s-4)' }}>
          <EmptyState
            title="No financial activity found for this period"
            message="Try a wider date range, or check back once contributions have been recorded."
            Icon={BarChart3}
          />
        </Card>
      )}

      {!series.loading && !series.error && hasActivity && (
        <>
          <div className="metric-grid" style={{ marginTop: 'var(--s-4)' }}>
            <Metric label="Contributions in" value={money(totals.contributions)} foot={`${totals.contributionCount} payments`} />
            <Metric label="Withdrawals out" value={money(totals.withdrawals)} />
            <Metric
              label="Net movement"
              value={money(totals.contributions - totals.withdrawals)}
              foot={`${totals.newUsers} new customers`}
            />
          </div>

          <Card large style={{ marginTop: 'var(--s-4)' }}>
            <CardHead title="Contributions and withdrawals" />
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
                  <CartesianGrid stroke={c.grid} vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: c.text }} tickLine={false} axisLine={false} minTickGap={24} />
                  <YAxis tickFormatter={moneyShort} tick={{ fontSize: 11, fill: c.text }} tickLine={false} axisLine={false} width={56} />
                  <Tooltip
                    formatter={(v) => money(v)}
                    contentStyle={{
                      borderRadius: 10,
                      border: `1px solid ${c.grid}`,
                      background: c.surface,
                      color: c.text,
                      fontSize: 13,
                    }}
                  />
                  <Line type="monotone" dataKey="contributions" name="In" stroke={c.accent} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="withdrawals" name="Out" stroke={c.money} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="field-hint">Green is money coming in, gold is money paid out.</p>
          </Card>

          <Card large style={{ marginTop: 'var(--s-4)' }}>
            <CardHead title="Net cash movement" />
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
                  <CartesianGrid stroke={c.grid} vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: c.text }} tickLine={false} axisLine={false} minTickGap={24} />
                  <YAxis tickFormatter={moneyShort} tick={{ fontSize: 11, fill: c.text }} tickLine={false} axisLine={false} width={56} />
                  <Tooltip
                    formatter={(v) => money(v)}
                    contentStyle={{
                      borderRadius: 10,
                      border: `1px solid ${c.grid}`,
                      background: c.surface,
                      color: c.text,
                      fontSize: 13,
                    }}
                  />
                  <Bar dataKey="net" name="Net" fill={c.bar} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </>
      )}

      <Card large style={{ marginTop: 'var(--s-4)' }}>
        <CardHead
          title="Collector performance"
          action={
            <Button variant="outline" size="sm" onClick={exportCollectors} disabled={!collectors.data?.length}>
              Export
            </Button>
          }
        />
        {collectors.loading && <SkeletonLines count={3} height={54} />}
        {collectors.error && !collectors.loading && (
          <ErrorState message={collectors.error} onRetry={collectors.refetch} />
        )}
        {!collectors.loading && !collectors.error && !collectors.data?.length && (
          <EmptyState title="No collectors yet" message="Add a collector to see their figures here." Icon={UserCog} />
        )}
        {!!collectors.data?.length && (
          <div className="table-wrap">
            <table className="table is-stacked">
              <thead>
                <tr>
                  <th>Collector</th>
                  <th className="right">Customers</th>
                  <th className="right">Collected</th>
                  <th className="right">Paid days</th>
                  <th className="right">Missed</th>
                  <th className="right">Handed over</th>
                </tr>
              </thead>
              <tbody>
                {collectors.data.map((c) => (
                  <tr key={c.collector_id}>
                    <td data-label="Collector">{c.collector_name}</td>
                    <td data-label="Customers" className="right num">{c.customers}</td>
                    <td data-label="Collected" className="right num">{money(c.collected)}</td>
                    <td data-label="Paid days" className="right num">{c.paid_days}</td>
                    <td data-label="Missed" className="right num">{c.missed_days}</td>
                    <td data-label="Handed over" className="right num">{money(c.handed_over)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

function Metric({ label, value, foot }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value num">{value}</div>
      {foot && <div className="xs muted" style={{ marginTop: 2 }}>{foot}</div>}
    </div>
  );
}
