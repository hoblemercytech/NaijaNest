import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { FileQuestion, ShieldCheck, ShieldAlert, Clock } from 'lucide-react';
import {
  useFinancialSummary, useOpenCycle, useCycleSchedule,
  useActivePlans, useCustomerActions,
} from '../../hooks/useCustomer';
import { money, shortDate, isoDate } from '../../lib/format';
import { friendlyError } from '../../lib/errors';
import { Card, CardHead, Stat } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import StatusBadge, { ProgressBar } from '../../components/ui/Status';
import { EmptyState, ErrorState, SkeletonPanel, SkeletonLines } from '../../components/ui/States';
import { useToast } from '../../components/ui/Toast';
import ContributionCalendar from '../../components/ContributionCalendar';
import './user.css';

/* Labelled because "365" reads as a number to scan past, while "1 year" is a
   commitment someone weighs. */
const DURATIONS = [
  { days: 30, label: '30', unit: 'days' },
  { days: 60, label: '60', unit: 'days' },
  { days: 90, label: '90', unit: 'days' },
  { days: 180, label: '6', unit: 'months' },
  { days: 365, label: '1', unit: 'year' },
];

export default function Dashboard() {
  const { profile } = useAuth();
  const summary = useFinancialSummary();
  const cycle = useOpenCycle();
  const schedule = useCycleSchedule(cycle.data?.id);
  const [startOpen, setStartOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const refreshAll = () => {
    summary.refetch();
    cycle.refetch();
    schedule.refetch();
  };

  const today = isoDate();
  const todayRow = schedule.data?.find((d) => d.contribution_date === today);
  const openCycle = cycle.data;
  const balance = Number(summary.data?.current_balance ?? 0);
  const cycleBalance = Number(openCycle?.contributed ?? 0) - Number(openCycle?.withdrawn ?? 0);
  const hasBalance = openCycle && ['ACTIVE', 'COMPLETED'].includes(openCycle.status) && cycleBalance > 0;
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
        </section>
      )}

      {/* --- today ------------------------------------------------------ */}
      {openCycle?.status === 'ACTIVE' && (
        <div className="grid-2" style={{ marginTop: 'var(--s-4)' }}>
          <Stat
            label="Today's contribution"
            value={todayRow ? money(todayRow.expected_amount) : '—'}
            foot={todayRow ? (todayRow.status === 'PAID' ? 'Paid' : 'Not paid yet') : 'Outside your cycle'}
          />
          <Stat
            label="Days paid"
            value={`${openCycle.days_paid} / ${openCycle.duration_days}`}
            foot={openCycle.days_missed > 0 ? `${openCycle.days_missed} missed` : 'On track'}
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
              title={`${money(openCycle.daily_amount_snapshot)} a day`}
              action={<StatusBadge status={openCycle.status} />}
            >
              <p className="small muted" style={{ margin: '2px 0 0' }}>
                {shortDate(openCycle.start_date)} — {shortDate(openCycle.expected_end_date)}
              </p>
            </CardHead>

            <ProgressBar
              value={openCycle.days_paid}
              max={openCycle.duration_days}
              label={`${openCycle.days_paid} of ${openCycle.duration_days} days paid`}
            />
            <div className="row-between small muted" style={{ marginTop: 8 }}>
              <span>Day {openCycle.days_paid} of {openCycle.duration_days}</span>
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
  const [planId, setPlanId] = useState(null);
  const [duration, setDuration] = useState(30);
  const [busy, setBusy] = useState(false);

  const plan = plans.data?.find((p) => p.id === planId);
  const target = plan ? Number(plan.daily_amount) * duration : 0;

  const submit = async () => {
    if (!planId) return;
    setBusy(true);
    try {
      await requestCycle(planId, duration);
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

      {/* `!plans.data?.length` covers both an empty list and a null result, so a
          query that returns nothing can never render an empty modal body. */}
      {!plans.loading && !plans.error && !plans.data?.length && (
        <EmptyState
          title="No plans available yet"
          message="NaijaNest hasn't published any contribution plans. Check back shortly."
        />
      )}

      {!plans.loading && !plans.error && plans.data?.length > 0 && (
        <>
          <p className="field-label">How much a day?</p>
          <div className="choice-grid">
            {plans.data.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`choice${planId === p.id ? ' is-picked' : ''}`}
                onClick={() => setPlanId(p.id)}
                aria-pressed={planId === p.id}
              >
                <span className="choice-main num">{money(p.daily_amount)}</span>
                <span className="choice-sub">a day</span>
              </button>
            ))}
          </div>

          <p className="field-label" style={{ marginTop: 'var(--s-5)' }}>For how long?</p>
          <div className="choice-grid">
            {DURATIONS.map((d) => (
              <button
                key={d.days}
                type="button"
                className={`choice${duration === d.days ? ' is-picked' : ''}`}
                onClick={() => setDuration(d.days)}
                aria-pressed={duration === d.days}
                aria-label={`${d.days} days`}
              >
                <span className="choice-main num">{d.label}</span>
                <span className="choice-sub">{d.unit}</span>
              </button>
            ))}
          </div>

          {plan && (
            <p className="choice-total">
              Paying every day, you'd save <strong className="num">{money(target)}</strong> by the end.
              Miss a day and you simply save less — nothing is owed.
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
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await requestWithdrawal(cycle.id);
      toast('Withdrawal requested.');
      onClose();
      onDone();
    } catch (err) {
      toastError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  if (!cycle) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Withdraw your balance"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="money" onClick={submit} loading={busy}>Request {money(amount)}</Button>
        </>
      }
    >
      {/* The amount is fixed by the database, not typed in — showing it as a
          figure rather than an input is the honest representation of that. */}
      <div className="withdraw-amount">
        <span className="small muted">You'll receive</span>
        <span className="num">{money(amount)}</span>
      </div>
      <p className="muted small">
        This is everything you've contributed to this cycle. Your collector confirms the
        request and pays you in cash. Once paid, this cycle closes and you can start a
        new one.
      </p>
    </Modal>
  );
}
