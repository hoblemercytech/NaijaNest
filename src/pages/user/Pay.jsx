import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Landmark, Copy, Check, Minus, Plus, Clock3, CircleAlert,
  BadgeCheck, Banknote, ArrowRight, Info,
} from 'lucide-react';
import { useOpenCycle } from '../../hooks/useCustomer';
import { useMyPaymentAccount, useMyPaymentClaims, usePaymentActions } from '../../hooks/usePayments';
import { useRealtime } from '../../hooks/useRealtime';
import { PER_LABEL } from '../../lib/banks';
import { money, dateTime } from '../../lib/format';
import { friendlyError } from '../../lib/errors';
import { Card, CardHead } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Input } from '../../components/ui/Field';
import StatusBadge from '../../components/ui/Status';
import { EmptyState, ErrorState, SkeletonLines } from '../../components/ui/States';
import { useToast } from '../../components/ui/Toast';
import './user.css';

const QUICK = [1, 5, 10, 30];

/**
 * Pay by transfer.
 *
 * Two things this screen has to get across, and it says both more than once:
 * the money goes to the account shown here and nowhere else, and tapping
 * "I have paid" does not credit anything. People watch their balance after
 * tapping, and a balance that does not move looks like a broken app unless
 * you told them first.
 */
export default function Pay() {
  const cycle = useOpenCycle();
  const account = useMyPaymentAccount();
  const claims = useMyPaymentClaims();
  const { submitClaim } = usePaymentActions();
  const { toast, toastError } = useToast();

  const [count, setCount] = useState(1);
  const [confirming, setConfirming] = useState(false);
  const [copied, setCopied] = useState(false);

  useRealtime(['payment_claims', 'daily_contributions'], () => {
    claims.refetch();
    cycle.refetch();
  });

  const open = cycle.data;
  const perPayment = Number(open?.daily_amount_snapshot || 0);
  const remaining = open ? (open.periods ?? open.duration_days) - (open.days_paid ?? 0) : 0;
  const maxCount = Math.max(1, Math.min(60, remaining));
  const total = perPayment * count;

  const pending = (claims.data || []).find((c) => c.status === 'PENDING');

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(account.data.account_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard needs HTTPS and a gesture; the number is on screen regardless.
    }
  };

  const loading = cycle.loading || account.loading;

  return (
    <>
      <header className="page-head">
        <h1>Make a payment</h1>
        <p>Transfer to your collector's account, then tell us you have paid.</p>
      </header>

      {loading && <SkeletonLines count={3} height={120} />}
      {cycle.error && !loading && <ErrorState message={cycle.error} onRetry={cycle.refetch} />}

      {!loading && !open && (
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
            title={`Your plan is ${open.status.toLowerCase().replace('_', ' ')}`}
            message="Payments can only be made once your collector activates the plan."
            Icon={Clock3}
          />
        </Card>
      )}

      {!loading && open?.status === 'ACTIVE' && (
        <>
          {pending && (
            <div className="pay-pending" style={{ marginBottom: 'var(--s-4)' }}>
              <span className="pay-pending-dot" aria-hidden="true" />
              <div>
                <strong>{money(pending.claimed_amount)} waiting to be confirmed</strong>
                <span>
                  Reported {dateTime(pending.created_at)}. We credit it as soon as the
                  transfer is confirmed.
                </span>
              </div>
            </div>
          )}

          {/* Where to send it */}
          {account.data ? (
            <Card large>
              <div className="pay-account">
                <div className="pay-account-head">
                  <Landmark size={14} strokeWidth={2.1} />
                  Transfer to this account only
                </div>

                <button type="button" className="pay-number" onClick={copyNumber}>
                  {account.data.account_number}
                  {copied ? <Check size={18} strokeWidth={2.4} /> : <Copy size={18} strokeWidth={2} />}
                </button>

                <dl className="detail-list">
                  <div><dt>Bank</dt><dd>{account.data.bank_name}</dd></div>
                  <div><dt>Account name</dt><dd>{account.data.account_name}</dd></div>
                  <div><dt>Your collector</dt><dd>{account.data.collector_name}</dd></div>
                </dl>
              </div>

              <div className="panel-note tone-rose" style={{ marginTop: 'var(--s-4)' }}>
                <span className="panel-note-icon"><CircleAlert size={17} strokeWidth={1.9} /></span>
                <div>
                  <h4>Never pay into a personal account</h4>
                  <p>
                    No member of BudgetSave staff may ask you to transfer anywhere other
                    than the account above. Report it if anyone does.
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <Card large>
              <EmptyState
                title="No payment account yet"
                message="Your collector has not been given a payment account. Pay them in cash for now, or contact support."
                Icon={Landmark}
              />
            </Card>
          )}

          {/* How much */}
          <Card large style={{ marginTop: 'var(--s-4)' }}>
            <CardHead
              title="How many payments?"
              sub={`${money(perPayment)} ${PER_LABEL[open.frequency] || 'a day'} · ${remaining} left on this plan`}
            />

            <div className="pay-stepper">
              <button
                type="button"
                onClick={() => setCount((c) => Math.max(1, c - 1))}
                disabled={count <= 1}
                aria-label="One fewer"
              >
                <Minus size={18} strokeWidth={2.2} />
              </button>

              <div className="pay-stepper-value">
                <strong className="num">{money(total)}</strong>
                <span>{count} {count === 1 ? 'payment' : 'payments'}</span>
              </div>

              <button
                type="button"
                onClick={() => setCount((c) => Math.min(maxCount, c + 1))}
                disabled={count >= maxCount}
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
                  className={count === q ? 'is-picked' : ''}
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

            <Button
              block
              variant="money"
              style={{ marginTop: 'var(--s-4)' }}
              disabled={!account.data || !!pending}
              onClick={() => setConfirming(true)}
            >
              I have transferred {money(total)}
            </Button>

            {pending && (
              <p className="field-hint">
                Wait for your last payment to be confirmed before reporting another.
              </p>
            )}
          </Card>

          {/* History */}
          {claims.data?.length > 0 && (
            <Card large style={{ marginTop: 'var(--s-4)' }}>
              <CardHead title="Reported payments" />
              {claims.data.map((c) => (
                <div className="done-row" key={c.id}>
                  <div>
                    <div className="small" style={{ fontWeight: 600 }}>
                      {money(c.claimed_amount)} · {c.periods}×
                    </div>
                    <div className="xs muted">
                      {c.status === 'REJECTED' && c.reject_reason
                        ? c.reject_reason
                        : dateTime(c.created_at)}
                    </div>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
              ))}
            </Card>
          )}
        </>
      )}

      <ConfirmModal
        open={confirming}
        onClose={() => setConfirming(false)}
        cycle={open}
        count={count}
        total={total}
        account={account.data}
        onDone={() => { claims.refetch(); cycle.refetch(); }}
        submitClaim={submitClaim}
        toast={toast}
        toastError={toastError}
      />
    </>
  );
}

function ConfirmModal({
  open, onClose, cycle, count, total, account, onDone, submitClaim, toast, toastError,
}) {
  const [reference, setReference] = useState('');
  const [busy, setBusy] = useState(false);

  if (!open || !cycle) return null;

  const submit = async () => {
    setBusy(true);
    try {
      await submitClaim(cycle.id, count, reference);
      toast('Reported. We will confirm it shortly.');
      setReference('');
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
      open
      onClose={onClose}
      title="Confirm you have transferred"
      description={`${money(total)} · ${count} ${count === 1 ? 'payment' : 'payments'}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>Not yet</Button>
          <Button variant="money" onClick={submit} loading={busy}>Yes, I have paid</Button>
        </>
      }
    >
      {/* Said plainly, at the moment they are about to tap. This is the
          misunderstanding that generates support messages. */}
      <div className="panel-note tone-amber">
        <span className="panel-note-icon"><Clock3 size={17} strokeWidth={1.9} /></span>
        <div>
          <h4>This does not credit your balance yet</h4>
          <p>
            It tells us to look for your transfer. Your payments are credited once the
            money is confirmed — usually within minutes.
          </p>
        </div>
      </div>

      {account && (
        <dl className="detail-list" style={{ marginTop: 'var(--s-4)' }}>
          <div><dt>You paid into</dt><dd>{account.bank_name} · {account.account_number}</dd></div>
          <div><dt>Account name</dt><dd>{account.account_name}</dd></div>
        </dl>
      )}

      <Input
        label="Transaction reference (optional)"
        value={reference}
        onChange={(e) => setReference(e.target.value)}
        placeholder="From your bank's confirmation"
        hint="Worth adding — it is how we find your transfer quickly if there is a delay."
      />

      <div className="panel-note tone-teal" style={{ marginTop: 'var(--s-3)' }}>
        <span className="panel-note-icon"><BadgeCheck size={17} strokeWidth={1.9} /></span>
        <div>
          <p>
            Reporting a payment you did not make is fraud, and every report is recorded
            against your account.
          </p>
        </div>
      </div>
    </Modal>
  );
}