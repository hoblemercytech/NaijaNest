import { useCallback, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  FileQuestion, ShieldCheck, ShieldAlert, Clock, Banknote, CalendarCheck, Plus,
} from 'lucide-react';
import {
  useFinancialSummary, useOpenCycles, useCycleSchedule,
  useActivePlans, useCustomerActions,
} from '../../hooks/useCustomer';
import { useRealtime, LIVE_TABLES } from '../../hooks/useRealtime';
import { FREQUENCIES, PER_LABEL, NIGERIAN_BANKS } from '../../lib/banks';
import { money, shortDate, isoDate } from '../../lib/format';
import { friendlyError } from '../../lib/errors';
import { Card, CardHead, Stat } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Field';
import StatusBadge, { ProgressBar } from '../../components/ui/Status';
import { EmptyState, ErrorState, SkeletonPanel, SkeletonLines } from '../../components/ui/States';
import { useToast } from '../../components/ui/Toast';
import ContributionCalendar from '../../components/ContributionCalendar';
import './user.css';

export default function Dashboard() {
  const { profile } = useAuth();
  const summary = useFinancialSummary();
  const cycles = useOpenCycles();
  const [startOpen, setStartOpen] = useState(false);
  const [withdrawing, setWithdrawing] = useState(null); // { cycle, amount }

  const refreshAll = useCallback(() => {
    summary.refetch();
    cycles.refetch();
  }, [summary, cycles]);

  // No address bar in an installed app, so the balance has to keep itself honest.
  useRealtime(LIVE_TABLES.USER, refreshAll);

  const list = cycles.data || [];
  const balance = Number(summary.data?.current_balance ?? 0);
  const verified = profile?.kyc_verified;
 const savedIn = (c) =>
  Number(c.contributed ?? 0) - Number(c.service_charge ?? 0) - Number(c.withdrawn ?? 0);

  // A fixed term means fixed: money is locked until that plan completes.
  const anyWithdrawable = list.some((c) => c.status === 'COMPLETED' && savedIn(c) > 0);
  const anyRunning = list.some((c) => c.status === 'ACTIVE' && savedIn(c) > 0);

  return (
    <>
      <header className="page-head">
        <h1>Hello, {profile?.full_name?.split(' ')[0]}</h1>
        <p>Member <span className="num">{profile?.member_id}</span></p>
      </header>

      {/* --- balance ---------------------------------------------------- */}
      {summary.loading && <SkeletonPanel />}
      {summary.error && !summary.loading && (
        <ErrorState message={summary.error} onRetry={summary.refetch} />
      )}
      {!summary.loading && !summary.error && (
        <section className="panel-balance">
          <div className="label">Your balance</div>
          <div className="amount num">{money(balance)}</div>
          <div className="footnote">
            Contributed {money(summary.data.total_contributed)} · Withdrawn{' '}
            {money(summary.data.total_withdrawn)}
          </div>

          {anyWithdrawable && !verified && (
            <Link to="/verification" className="btn btn-outline btn-block panel-cta">
              Verify your identity to withdraw
            </Link>
          )}

          {anyRunning && (
            <p className="panel-locked">
              Your savings are still in progress. Once a plan reaches its full contribution
              target it is completed, and you can request withdrawal for that plan after
              KYC verification.
            </p>
          )}
        </section>
      )}

      <VerificationNotice status={profile?.kyc_status} verified={profile?.kyc_verified} />

      {/* --- plans ------------------------------------------------------ */}
      <div style={{ marginTop: 'var(--s-6)' }}>
        {cycles.loading && <SkeletonLines count={2} height={92} />}
        {cycles.error && !cycles.loading && (
          <ErrorState message={cycles.error} onRetry={cycles.refetch} />
        )}

        {!cycles.loading && !cycles.error && list.length === 0 && (
          <Card large>
            <EmptyState
              title="You don't have a contribution plan yet"
              message="Choose how much and how long you want to save for. Your collector activates it, then you start contributing."
              Icon={FileQuestion}
              action={<Button onClick={() => setStartOpen(true)}>Start a plan</Button>}
            />
          </Card>
        )}

        {list.length > 0 && (
          <>
            <div className="row-between" style={{ marginBottom: 'var(--s-3)' }}>
              <h2 style={{ fontSize: 'var(--t-h3)', margin: 0 }}>Your plans</h2>
              <Button variant="outline" size="sm" onClick={() => setStartOpen(true)}>
                <Plus size={16} strokeWidth={2} /> Start another plan
              </Button>
            </div>

            <div className="stack">
              {list.map((c) => (
                <CycleCard
                  key={c.id}
                  cycle={c}
                  verified={verified}
                  onWithdraw={(amount) => setWithdrawing({ cycle: c, amount })}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <StartCycleModal open={startOpen} onClose={() => setStartOpen(false)} onDone={refreshAll} />
      <WithdrawModal
        open={!!withdrawing}
        onClose={() => setWithdrawing(null)}
        cycle={withdrawing?.cycle}
        amount={withdrawing?.amount ?? 0}
        onDone={refreshAll}
      />
    </>
  );
}

/* --------------------------------------------------------------- one plan */
function CycleCard({ cycle, verified, onWithdraw }) {
  const isPending = cycle.status === 'PENDING_ACTIVATION';
  const schedule = useCycleSchedule(isPending ? null : cycle.id);
  useRealtime(LIVE_TABLES.USER, schedule.refetch, { enabled: !isPending });
  const [showDays, setShowDays] = useState(false);

  const total = cycle.periods ?? cycle.duration_days;
  const saved =
  Number(cycle.contributed ?? 0) - Number(cycle.service_charge ?? 0) - Number(cycle.withdrawn ?? 0);
  const today = isoDate();
  const todayRow = schedule.data?.find((d) => d.contribution_date === today);
  const canWithdraw = cycle.status === 'COMPLETED' && saved > 0 && verified;

  if (isPending) {
    return (
      <Card large>
        <CardHead title="Waiting for your collector" action={<StatusBadge status={cycle.status} />} />
        <p className="muted small">
          You asked for {money(cycle.daily_amount_snapshot)} {PER_LABEL[cycle.frequency] || 'a day'} for{' '}
          {total} payments. {cycle.collector?.full_name || 'Your collector'} needs to activate it
          before payment 1 starts.
        </p>
      </Card>
    );
  }

  return (
    <Card large>
      <CardHead
        title={`${money(cycle.daily_amount_snapshot)} ${PER_LABEL[cycle.frequency] || 'a day'}`}
        action={<StatusBadge status={cycle.status} />}
      >
        <p className="small muted" style={{ margin: '2px 0 0' }}>
          {shortDate(cycle.start_date)} — {shortDate(cycle.expected_end_date)}
        </p>
      </CardHead>

      <ProgressBar
        value={cycle.days_paid}
        max={total}
        label={`${cycle.days_paid} of ${total} payments made`}
      />
      <div className="row-between small muted" style={{ marginTop: 8 }}>
        <span>Payment {cycle.days_paid} of {total}</span>
        <span className="num">{money(saved)} saved</span>
      </div>

      {cycle.status === 'ACTIVE' && (
        <div className="grid-2" style={{ marginTop: 'var(--s-4)' }}>
          <Stat
            label="Due now"
            value={todayRow ? money(todayRow.expected_amount) : '—'}
            foot={todayRow ? (todayRow.status === 'PAID' ? 'Paid' : 'Not paid yet') : 'Nothing due today'}
            Icon={Banknote}
            tone={todayRow?.status === 'PAID' ? 'ok' : 'warn'}
          />
          <Stat
            label="Payments made"
            value={`${cycle.days_paid} / ${total}`}
            foot={cycle.days_missed > 0 ? `${cycle.days_missed} missed` : 'On track'}
            Icon={CalendarCheck}
            tone={cycle.days_missed > 0 ? 'warn' : 'ok'}
          />
        </div>
      )}

      <dl className="detail-list" style={{ marginTop: 'var(--s-4)' }}>
        <div><dt>Collector</dt><dd>{cycle.collector?.full_name || '—'}</dd></div>
        {cycle.collector?.phone && (
          <div><dt>Phone</dt><dd className="num">{cycle.collector.phone}</dd></div>
        )}
      </dl>

      {canWithdraw && (
        <Button
          variant="money"
          block
          onClick={() => onWithdraw(saved)}
          style={{ marginTop: 'var(--s-4)' }}
        >
          Withdraw {money(saved)}
        </Button>
      )}
      {cycle.status === 'COMPLETED' && saved > 0 && !verified && (
        <Link to="/verification" className="btn btn-outline btn-block" style={{ marginTop: 'var(--s-4)' }}>
          Verify your identity to withdraw
        </Link>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowDays((v) => !v)}
        style={{ marginTop: 8, marginLeft: -12 }}
      >
        {showDays ? 'Hide days' : 'View days'}
      </Button>

      {showDays && (
        <div style={{ marginTop: 'var(--s-3)' }}>
          {schedule.loading && <SkeletonLines count={2} height={44} />}
          {schedule.error && !schedule.loading && (
            <ErrorState message={schedule.error} onRetry={schedule.refetch} />
          )}
          {!schedule.loading && !schedule.error && (
            <ContributionCalendar days={schedule.data || []} />
          )}
        </div>
      )}
    </Card>
  );
}

/**
 * Verification prompt. Stays out of the way once verified, and never nags
 * someone whose submission is already sitting with an admin.
 */
function VerificationNotice({ status, verified }) {
  if (verified) return null;

  if (status === 'PENDING') {
    return (
      <div className="kyc-strip is-pending" style={{ marginTop: 'var(--s-4)' }}>
        <Clock size={20} strokeWidth={1.9} />
        <span>Your identity details are being reviewed. You can keep contributing meanwhile.</span>
      </div>
    );
  }

  const rejected = status === 'REJECTED';
  return (
    <Link to="/verification" className={`kyc-strip is-action${rejected ? ' is-rejected' : ''}`} style={{ marginTop: 'var(--s-4)' }}>
      {rejected ? <ShieldAlert size={20} strokeWidth={1.9} /> : <ShieldCheck size={20} strokeWidth={1.9} />}
      <span>
        {rejected
          ? 'Your verification was not approved. Tap to correct your details.'
          : 'Verify your identity so you can withdraw when you are ready.'}
      </span>
    </Link>
  );
}

/* ------------------------------------------------------------ start cycle */
function StartCycleModal({ open, onClose, onDone }) {
  const plans = useActivePlans();
  const { requestCycle } = useCustomerActions();
  const { toast, toastError } = useToast();
  const [frequency, setFrequency] = useState('DAILY');
  const [planId, setPlanId] = useState(null);
  const [periods, setPeriods] = useState(30);
  const [busy, setBusy] = useState(false);

  const freq = FREQUENCIES.find((f) => f.value === frequency);
  const plan = plans.data?.find((p) => p.id === planId);
  const target = plan ? Number(plan.daily_amount) * periods : 0;

  // A plan may not offer every frequency, and a term only exists within one.
  const available = (plans.data || []).filter(
    (p) => !p.allowed_frequencies || p.allowed_frequencies.includes(frequency)
  );

  const pickFrequency = (value) => {
    setFrequency(value);
    // The old term is meaningless under a new frequency — 30 weeks is not on
    // offer — so it resets to that frequency's first option.
    const next = FREQUENCIES.find((f) => f.value === value);
    setPeriods(next.terms[0].periods);
  };

  const submit = async () => {
    if (!planId) return;
    setBusy(true);
    try {
      await requestCycle(planId, periods, frequency);
      toast('Request sent. Your collector will activate it.');
      onClose();
      onDone();
    } catch (err) {
      toastError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Start a contribution plan"
      description="Your terms are locked in once your collector activates this."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={submit} loading={busy} disabled={!planId}>Send request</Button>
        </>
      }
    >
      {plans.loading && <SkeletonLines count={3} height={56} />}
      {plans.error && <ErrorState message={plans.error} onRetry={plans.refetch} />}

      {!plans.loading && !plans.error && !plans.data?.length && (
        <EmptyState
          title="No plans available yet"
          message="NaijaNest hasn't published any contribution plans. Check back shortly."
        />
      )}

      {!plans.loading && !plans.error && plans.data?.length > 0 && (
        <>
          <p className="field-label">How often will you contribute?</p>
          <div className="choice-grid">
            {FREQUENCIES.map((f) => (
              <button
                key={f.value}
                type="button"
                className={`choice${frequency === f.value ? ' is-picked' : ''}`}
                onClick={() => pickFrequency(f.value)}
                aria-pressed={frequency === f.value}
              >
                <span className="choice-main">{f.label}</span>
                <span className="choice-sub">{f.every}</span>
              </button>
            ))}
          </div>

          <p className="field-label" style={{ marginTop: 'var(--s-5)' }}>
            How much {freq.every}?
          </p>
          <div className="choice-grid">
            {available.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`choice${planId === p.id ? ' is-picked' : ''}`}
                onClick={() => setPlanId(p.id)}
                aria-pressed={planId === p.id}
              >
                <span className="choice-main num">{money(p.daily_amount)}</span>
                <span className="choice-sub">{PER_LABEL[frequency]}</span>
              </button>
            ))}
          </div>

          <p className="field-label" style={{ marginTop: 'var(--s-5)' }}>For how long?</p>
          <div className="choice-grid">
            {freq.terms.map((t) => (
              <button
                key={t.periods}
                type="button"
                className={`choice${periods === t.periods ? ' is-picked' : ''}`}
                onClick={() => setPeriods(t.periods)}
                aria-pressed={periods === t.periods}
              >
                <span className="choice-main num">{t.label.split(' ')[0]}</span>
                <span className="choice-sub">{t.label.split(' ').slice(1).join(' ')}</span>
              </button>
            ))}
          </div>

          {plan && (
            <p className="choice-total">
              Paying every time, you'd save <strong className="num">{money(target)}</strong> over{' '}
              {periods} {freq.unit}. Miss one and you simply save less — nothing is owed.
              <br />
              <strong>Your savings stay locked until the term ends.</strong>
            </p>
          )}
        </>
      )}
    </Modal>
  );
}

/* -------------------------------------------------------------- withdraw */
function WithdrawModal({ open, onClose, cycle, amount, onDone }) {
  const { requestWithdrawal } = useCustomerActions();
  const { toast, toastError } = useToast();
  const [form, setForm] = useState({ bankName: '', accountNumber: '', accountName: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  if (!cycle) return null;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    const next = {};
    if (!form.bankName) next.bankName = 'Choose your bank.';
    if (!/^\d{10}$/.test(form.accountNumber.replace(/\s/g, ''))) {
      next.accountNumber = 'A Nigerian account number is exactly 10 digits.';
    }
    if (!form.accountName.trim()) next.accountName = 'Enter the name on the account.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      await requestWithdrawal(cycle.id, form);
      toast('Request sent to the NaijaNest office.');
      setForm({ bankName: '', accountNumber: '', accountName: '' });
      onClose();
      onDone();
    } catch (err) {
      toastError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Withdraw your savings"
      description="Paid by bank transfer from the NaijaNest office."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="money" onClick={submit} loading={busy}>Request {money(amount)}</Button>
        </>
      }
    >
      {/* Shown as a figure, never an input — the database computes it and
          would reject anything else. */}
      <div className="withdraw-amount">
        <span className="small muted">You'll receive</span>
        <span className="num">{money(amount)}</span>
      </div>

      <p className="muted small">
        This plan has completed, so this is everything you contributed to it. Send your bank
        details and the office will transfer it.
      </p>

      <Select
        label="Bank"
        value={form.bankName}
        onChange={set('bankName')}
        error={errors.bankName}
      >
        <option value="">Choose your bank…</option>
        {NIGERIAN_BANKS.map((b) => (
          <option key={b} value={b}>{b}</option>
        ))}
      </Select>

      <Input
        label="Account number"
        inputMode="numeric"
        maxLength={10}
        placeholder="0123456789"
        value={form.accountNumber}
        onChange={set('accountNumber')}
        error={errors.accountNumber}
      />

      <Input
        label="Account name"
        value={form.accountName}
        onChange={set('accountName')}
        error={errors.accountName}
        hint="Must match the name on your bank account, or the transfer will fail."
      />
    </Modal>
  );
}
