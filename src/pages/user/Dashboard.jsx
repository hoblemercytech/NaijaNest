import { useCallback, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { FileQuestion, ShieldCheck, ShieldAlert, Clock, Banknote, CalendarCheck } from 'lucide-react';
import {
  useFinancialSummary, useOpenCycle, useCycleSchedule,
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
  const cycle = useOpenCycle();
  const schedule = useCycleSchedule(cycle.data?.id);
  const [startOpen, setStartOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const refreshAll = useCallback(() => {
    summary.refetch();
    cycle.refetch();
    schedule.refetch();
  }, [summary, cycle, schedule]);

  // No address bar in an installed app, so the balance has to keep itself honest.
  useRealtime(LIVE_TABLES.USER, refreshAll);

  const today = isoDate();
  const todayRow = schedule.data?.find((d) => d.contribution_date === today);
  const openCycle = cycle.data;
  const balance = Number(summary.data?.current_balance ?? 0);
  const cycleBalance = Number(openCycle?.contributed ?? 0) - Number(openCycle?.withdrawn ?? 0);
  // A fixed term means fixed: the money is locked until the cycle completes.
  const hasBalance = openCycle?.status === 'COMPLETED' && cycleBalance > 0;
  const stillRunning = openCycle?.status === 'ACTIVE';
  // The database refuses an unverified withdrawal regardless, but showing the
  // button and then failing would be a worse experience than saying so first.
  const verified = profile?.kyc_verified;
  const canWithdraw = hasBalance && verified;

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
          {canWithdraw && (
            <Button
              variant="money"
              block
              onClick={() => setWithdrawOpen(true)}
              style={{ marginTop: 'var(--s-5)' }}
            >
              Withdraw {money(cycleBalance)}
            </Button>
          )}

          {hasBalance && !verified && (
            <Link to="/verification" className="btn btn-outline btn-block panel-cta">
              Verify your identity to withdraw
            </Link>
          )}

          {stillRunning && cycleBalance > 0 && (
            <p className="panel-locked">
              Locked until {shortDate(openCycle.expected_end_date)} — your savings are
              held for the full term.
            </p>
          )}
        </section>
      )}

      {/* --- today ------------------------------------------------------ */}
      {openCycle?.status === 'ACTIVE' && (
        <div className="grid-2" style={{ marginTop: 'var(--s-4)' }}>
          <Stat
            label="Due now"
            value={todayRow ? money(todayRow.expected_amount) : '—'}
            foot={todayRow ? (todayRow.status === 'PAID' ? 'Paid' : 'Not paid yet') : 'Outside your cycle'}
            Icon={Banknote}
            tone={todayRow?.status === 'PAID' ? 'ok' : 'warn'}
          />
          <Stat
            label="Payments made"
            value={`${openCycle.days_paid} / ${openCycle.periods ?? openCycle.duration_days}`}
            foot={openCycle.days_missed > 0 ? `${openCycle.days_missed} missed` : 'On track'}
            Icon={CalendarCheck}
            tone={openCycle.days_missed > 0 ? 'warn' : 'ok'}
          />
        </div>
      )}

      <VerificationNotice status={profile?.kyc_status} verified={profile?.kyc_verified} />

      {/* --- cycle ------------------------------------------------------ */}
      <div style={{ marginTop: 'var(--s-6)' }}>
        {cycle.loading && <SkeletonLines count={2} height={92} />}
        {cycle.error && !cycle.loading && <ErrorState message={cycle.error} onRetry={cycle.refetch} />}

        {!cycle.loading && !cycle.error && !openCycle && (
          <Card large>
            <EmptyState
              title="You don't have an active contribution cycle yet"
              message="Choose a daily amount and how long you want to save for. Your collector activates it, then you start contributing."
              Icon={FileQuestion}
              action={<Button onClick={() => setStartOpen(true)}>Start a cycle</Button>}
            />
          </Card>
        )}

        {openCycle?.status === 'PENDING_ACTIVATION' && (
          <Card large>
            <CardHead title="Waiting for your collector" action={<StatusBadge status={openCycle.status} />} />
            <p className="muted small">
              You asked for {money(openCycle.daily_amount_snapshot)} a day for{' '}
              {openCycle.duration_days} days. {openCycle.collector?.full_name || 'Your collector'} needs
              to activate it before day 1 starts.
            </p>
          </Card>
        )}

        {openCycle?.status === 'REJECTED' && (
          <Card large>
            <CardHead title="Request not approved" action={<StatusBadge status={openCycle.status} />} />
            <p className="muted small">{openCycle.rejection_reason}</p>
            <Button variant="outline" onClick={() => setStartOpen(true)}>Request again</Button>
          </Card>
        )}

        {(openCycle?.status === 'ACTIVE' || openCycle?.status === 'COMPLETED') && (
          <Card large>
            <CardHead
              title={`${money(openCycle.daily_amount_snapshot)} ${PER_LABEL[openCycle.frequency] || "a day"}`}
              action={<StatusBadge status={openCycle.status} />}
            >
              <p className="small muted" style={{ margin: '2px 0 0' }}>
                {shortDate(openCycle.start_date)} — {shortDate(openCycle.expected_end_date)}
              </p>
            </CardHead>

            <ProgressBar
              value={openCycle.days_paid}
              max={openCycle.periods ?? openCycle.duration_days}
              label={`${openCycle.days_paid} of ${openCycle.periods ?? openCycle.duration_days} payments made`}
            />
            <div className="row-between small muted" style={{ marginTop: 8 }}>
              <span>Payment {openCycle.days_paid} of {openCycle.periods ?? openCycle.duration_days}</span>
              <span className="num">{money(cycleBalance)} saved</span>
            </div>

            <dl className="detail-list" style={{ marginTop: 'var(--s-4)' }}>
              <div><dt>Collector</dt><dd>{openCycle.collector?.full_name || '—'}</dd></div>
              {openCycle.collector?.phone && (
                <div><dt>Phone</dt><dd className="num">{openCycle.collector.phone}</dd></div>
              )}
            </dl>
          </Card>
        )}
      </div>

      {/* --- calendar --------------------------------------------------- */}
      {openCycle && ['ACTIVE', 'COMPLETED'].includes(openCycle.status) && (
        <Card large style={{ marginTop: 'var(--s-4)' }}>
          <CardHead title="Your contribution days" />
          {schedule.loading && <SkeletonLines count={2} height={44} />}
          {schedule.error && !schedule.loading && (
            <ErrorState message={schedule.error} onRetry={schedule.refetch} />
          )}
          {!schedule.loading && !schedule.error && <ContributionCalendar days={schedule.data || []} />}
        </Card>
      )}

      <StartCycleModal open={startOpen} onClose={() => setStartOpen(false)} onDone={refreshAll} />
      <WithdrawModal
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        cycle={openCycle}
        amount={cycleBalance}
        onDone={refreshAll}
      />
    </>
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
      title="Start a contribution cycle"
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
          message="BudgetSave hasn't published any contribution plans. Check back shortly."
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
      toast('Request sent to the BudgetSave office.');
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
      description="Paid by bank transfer from the BudgetSave office."
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
        Your cycle has completed, so this is everything you contributed. Send your bank
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
