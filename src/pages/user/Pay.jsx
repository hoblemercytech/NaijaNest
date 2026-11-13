import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Landmark, Copy, Check, Minus, Plus, Clock3, CircleAlert, Banknote, ArrowRight, Info,
} from 'lucide-react';
import { useOpenCycles } from '../../hooks/useCustomer';
import { useMyPaymentClaims, usePaymentActions } from '../../hooks/usePayments';
import { useRealtime } from '../../hooks/useRealtime';
import { PER_LABEL } from '../../lib/banks';
import { money, dateTime, shortDate } from '../../lib/format';
import { friendlyError } from '../../lib/errors';
import { Card, CardHead } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/Status';
import { EmptyState, ErrorState, SkeletonLines } from '../../components/ui/States';
import { useToast } from '../../components/ui/Toast';
import './user.css';

const QUICK = [1, 5, 10, 30];
const BANKS = { '035': 'Wema Bank' };

/**
 * Pay by transfer, confirmed automatically.
 *
 * The customer asks for a payment account for an exact amount and transfers to
 * it. Nothing here credits anything: the server credits the payment once the
 * bank confirms it, and this page just watches for that.
 */
export default function Pay() {
  const cycles = useOpenCycles();
  const claims = useMyPaymentClaims();
  const { startGatewayPayment, checkGatewayPayment } = usePaymentActions();
  const { toast, toastError } = useToast();

  const [pickedId, setPickedId] = useState(null);
  const [count, setCount] = useState(1);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState('');

  useRealtime(['payment_claims', 'daily_contributions'], () => {
    claims.refetch();
    cycles.refetch();
  });

  const activeCycles = (cycles.data || []).filter((c) => c.status === 'ACTIVE');
  const picked = activeCycles.find((c) => c.id === pickedId) || activeCycles[0] || null;
  const open = picked || cycles.data?.[0] || null;

  const perPayment = Number(open?.daily_amount_snapshot || 0);
  const remaining = open ? (open.periods ?? open.duration_days) - (open.days_paid ?? 0) : 0;
  const maxCount = Math.max(1, Math.min(60, remaining));
  const safeCount = Math.min(count, maxCount);
  const total = perPayment * safeCount;

  // A payment account that has been issued and has not run out.
  const live = (claims.data || []).find(
    (c) =>
      c.provider === 'ALATPAY' && c.status === 'PENDING' && c.cycle_id === open?.id &&
      c.virtual_account_number && new Date(c.expires_at) > new Date()
  );

  // While an account is waiting, ask the server whether the money has arrived.
  useEffect(() => {
    if (!live) return undefined;
    const tick = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const r = await checkGatewayPayment(live.id);
        if (r?.status === 'CONFIRMED') {
          toast('Payment received. Your contributions are credited.');
          claims.refetch();
          cycles.refetch();
        }
      } catch {
        // Try again on the next beat.
      }
    };
    const t = setInterval(tick, 6000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live?.id]);

  const copy = async (text, key) => {
    try {
      await navigator.clipboard.writeText(String(text));
      setCopied(key);
      setTimeout(() => setCopied(''), 1800);
    } catch {
      // Clipboard needs HTTPS and a gesture; the number is on screen regardless.
    }
  };

  const start = async () => {
    setBusy(true);
    try {
      await startGatewayPayment(open.id, safeCount);
      await claims.refetch();
    } catch (err) {
      toastError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const pickPlan = (id) => { setPickedId(id); setCount(1); };
  const loading = cycles.loading;

  return (
    <>
      <header className="page-head">
        <h1>Make a payment</h1>
        <p>Get a payment account, transfer, and your contributions are credited automatically.</p>
      </header>

      {loading && <SkeletonLines count={3} height={120} />}
      {cycles.error && !loading && <ErrorState message={cycles.error} onRetry={cycles.refetch} />}

      {!loading && !cycles.error && !open && (
        <Card large>
          <EmptyState
            title="No active plan"
            message="Start a contribution plan from your dashboard before making a payment."
            Icon={Banknote}
          />
          <Link to="/dashboard" className="btn btn-primary btn-block" style={{ marginTop: 'var(--s-4)' }}>
            Go to dashboard <ArrowRight size={16} />
          </Link>
        </Card>
      )}

      {!loading && open && open.status !== 'ACTIVE' && (
        <Card large>
          <EmptyState
            title={`Your plan is ${open.status.toLowerCase().replace(/_/g, ' ')}`}
            message="Payments can only be made once your collector activates the plan."
            Icon={Clock3}
          />
        </Card>
      )}

      {!loading && open?.status === 'ACTIVE' && (
        <>
          {activeCycles.length > 1 && (
            <Card large style={{ marginBottom: 'var(--s-4)' }}>
              <CardHead title="Which plan are you paying?" />
              <div className="choice-grid">
                {activeCycles.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`choice${open.id === c.id ? ' is-picked' : ''}`}
                    onClick={() => pickPlan(c.id)}
                    aria-pressed={open.id === c.id}
                  >
                    <span className="choice-main num">{money(c.daily_amount_snapshot)}</span>
                    <span className="choice-sub">
                      {PER_LABEL[c.frequency] || 'a day'} · from {shortDate(c.start_date)} ·{' '}
                      {(c.periods ?? c.duration_days) - (c.days_paid ?? 0)} left
                    </span>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {live ? (
            /* A payment account is waiting for the transfer. */
            <Card large>
              <div className="pay-account">
                <div className="pay-account-head">
                  <Landmark size={14} strokeWidth={2.1} />
                  Transfer exactly {money(live.claimed_amount)} to this account
                </div>

                <button type="button" className="pay-number" onClick={() => copy(live.virtual_account_number, 'acct')}>
                  {live.virtual_account_number}
                  {copied === 'acct' ? <Check size={18} strokeWidth={2.4} /> : <Copy size={18} strokeWidth={2} />}
                </button>

                <dl className="detail-list">
                  <div><dt>Bank</dt><dd>{BANKS[live.virtual_bank_code] || `Bank ${live.virtual_bank_code}`}</dd></div>
                  <div>
                    <dt>Amount</dt>
                    <dd className="num">
                      <button type="button" className="link-btn" onClick={() => copy(live.claimed_amount, 'amt')}>
                        {money(live.claimed_amount)} {copied === 'amt' ? '✓' : ''}
                      </button>
                    </dd>
                  </div>
                  <div><dt>Payments covered</dt><dd>{live.periods}×</dd></div>
                  <div><dt>Your collector</dt><dd>{open.collector?.full_name || '—'}</dd></div>
                  <div><dt>Account valid for</dt><dd><Countdown until={live.expires_at} /></dd></div>
                </dl>
              </div>

              <div className="pay-pending" style={{ marginTop: 'var(--s-4)' }}>
                <span className="pay-pending-dot" aria-hidden="true" />
                <div>
                  <strong>Waiting for your transfer</strong>
                  <span>
                    You do not need to tap anything after you pay. This page updates by
                    itself within a minute or two.
                  </span>
                </div>
              </div>

              <div className="panel-note tone-rose" style={{ marginTop: 'var(--s-4)' }}>
                <span className="panel-note-icon"><CircleAlert size={17} strokeWidth={1.9} /></span>
                <div>
                  <h4>This account is for this payment only</h4>
                  <p>
                    It was made just now for {money(live.claimed_amount)}. Send exactly that
                    amount. A different amount can delay your credit.
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            /* Choose how much, then get an account. */
            <Card large>
              <CardHead
                title="How many payments?"
                sub={`${money(perPayment)} ${PER_LABEL[open.frequency] || 'a day'} · ${remaining} left on this plan`}
              />

              <div className="pay-stepper">
                <button
                  type="button"
                  onClick={() => setCount(Math.max(1, safeCount - 1))}
                  disabled={safeCount <= 1}
                  aria-label="One fewer"
                >
                  <Minus size={18} strokeWidth={2.2} />
                </button>

                <div className="pay-stepper-value">
                  <strong className="num">{money(total)}</strong>
                  <span>{safeCount} {safeCount === 1 ? 'payment' : 'payments'}</span>
                </div>

                <button
                  type="button"
                  onClick={() => setCount(Math.min(maxCount, safeCount + 1))}
                  disabled={safeCount >= maxCount}
                  aria-label="One more"
                >
                  <Plus size={18} strokeWidth={2.2} />
                </button>
              </div>

              <div className="pay-quick">
                {QUICK.filter((q) => q <= maxCount).map((q) => (
                  <button
                    key={q}
                    type="button"
                    className={safeCount === q ? 'is-picked' : ''}
                    onClick={() => setCount(q)}
                  >
                    {q}×
                  </button>
                ))}
              </div>

              <div className="panel-note tone-azure" style={{ marginTop: 'var(--s-4)' }}>
                <span className="panel-note-icon"><Info size={17} strokeWidth={1.9} /></span>
                <div>
                  <h4>Paying ahead is fine</h4>
                  <p>
                    Cover several payments at once if it suits you. It does not shorten your
                    term or unlock your savings early — the plan still ends on its own date.
                  </p>
                </div>
              </div>

              <Button block variant="money" style={{ marginTop: 'var(--s-4)' }} loading={busy} onClick={start}>
                Get payment account for {money(total)}
              </Button>
              <p className="field-hint">
                You will get an account number to transfer to. Your payment is credited
                automatically once the bank confirms it.
              </p>
            </Card>
          )}

          {claims.data?.length > 0 && (
            <Card large style={{ marginTop: 'var(--s-4)' }}>
              <CardHead title="Your payments" />
              {claims.data.map((c) => (
                <div className="done-row" key={c.id}>
                  <div>
                    <div className="small" style={{ fontWeight: 600 }}>
                      {money(c.claimed_amount)} · {c.periods}×
                    </div>
                    <div className="xs muted">
                      {c.status === 'REJECTED' && c.reject_reason ? c.reject_reason : dateTime(c.created_at)}
                    </div>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
              ))}
            </Card>
          )}
        </>
      )}
    </>
  );
}

function Countdown({ until }) {
  const [left, setLeft] = useState(() => new Date(until) - Date.now());
  useEffect(() => {
    const t = setInterval(() => setLeft(new Date(until) - Date.now()), 1000);
    return () => clearInterval(t);
  }, [until]);

  if (left <= 0) return <span>expired</span>;
  const h = Math.floor(left / 3600000);
  const m = Math.floor((left % 3600000) / 60000);
  return <span className="num">{h}h {String(m).padStart(2, '0')}m left</span>;
}
