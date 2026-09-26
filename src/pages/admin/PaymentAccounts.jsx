import { useState } from 'react';
import { Landmark, Pencil, CircleAlert, Copy, Check } from 'lucide-react';
import { useCollectors } from '../../hooks/useAdmin';
import { useCollectorAccounts, useCollectorAccountActions } from '../../hooks/usePayments';
import { NIGERIAN_BANKS } from '../../lib/banks';
import { friendlyError } from '../../lib/errors';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Field';
import { EmptyState, ErrorState, SkeletonLines } from '../../components/ui/States';
import { useToast } from '../../components/ui/Toast';
import './admin.css';

/**
 * Collector payment accounts.
 *
 * One live account per collector, and customers assigned to them see it in
 * their dashboard. Changing an account retires the old one rather than
 * editing it — a customer may have transferred to the previous number an hour
 * ago, and which account was live at that moment is what settles the dispute.
 */
export default function PaymentAccounts() {
  const collectors = useCollectors();
  const accounts = useCollectorAccounts();
  const { toast } = useToast();

  const [editing, setEditing] = useState(null);
  const [copied, setCopied] = useState(null);

  const byCollector = new Map(
    (accounts.data || []).map((a) => [a.collector?.id, a])
  );

  const copy = async (value, id) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(id);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      toast('Could not copy — the number is on screen.');
    }
  };

  const loading = collectors.loading || accounts.loading;
  const withAccount = (collectors.data || []).filter((c) => byCollector.has(c.id)).length;

  return (
    <>
      <header className="page-head">
        <h1>Payment accounts</h1>
        <p>The account each collector's customers transfer into.</p>
      </header>

      {!loading && collectors.data?.length > 0 && (
        <div className="stat" style={{ marginBottom: 'var(--s-4)' }}>
          <span className="stat-icon is-money" aria-hidden="true">
            <Landmark size={17} strokeWidth={1.9} />
          </span>
          <div className="stat-label">Collectors with an account</div>
          <div className="stat-value num">{withAccount} of {collectors.data.length}</div>
        </div>
      )}

      {loading && <SkeletonLines count={3} height={130} />}
      {collectors.error && !loading && (
        <ErrorState message={collectors.error} onRetry={collectors.refetch} />
      )}

      {!loading && !collectors.data?.length && (
        <Card large>
          <EmptyState
            title="No collectors yet"
            message="Promote a customer to collector first, then give them a payment account."
            Icon={Landmark}
          />
        </Card>
      )}

      <div className="stack">
        {(collectors.data || []).map((c) => {
          const account = byCollector.get(c.id);

          return (
            <Card key={c.id}>
              <div className="row-between" style={{ alignItems: 'flex-start' }}>
                <div style={{ minWidth: 0 }}>
                  <h3 style={{ margin: 0 }}>{c.full_name}</h3>
                  <p className="xs muted num" style={{ margin: '2px 0 0' }}>{c.member_id}</p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing({ collector: c, account })}
                >
                  <Pencil size={14} /> {account ? 'Change' : 'Set up'}
                </Button>
              </div>

              {account ? (
                <div className="pay-account" style={{ marginTop: 'var(--s-3)' }}>
                  <div className="pay-account-head">
                    <Landmark size={14} strokeWidth={2.1} />
                    {account.bank_name}
                  </div>

                  <button
                    type="button"
                    className="pay-number"
                    onClick={() => copy(account.account_number, account.id)}
                  >
                    {account.account_number}
                    {copied === account.id
                      ? <Check size={18} strokeWidth={2.4} />
                      : <Copy size={18} strokeWidth={2} />}
                  </button>

                  <dl className="detail-list">
                    <div><dt>Account name</dt><dd>{account.account_name}</dd></div>
                    {account.provider_ref && (
                      <div><dt>{account.provider} reference</dt><dd className="num">{account.provider_ref}</dd></div>
                    )}
                  </dl>
                </div>
              ) : (
                <div className="panel-note tone-amber" style={{ marginTop: 'var(--s-3)' }}>
                  <span className="panel-note-icon"><CircleAlert size={17} strokeWidth={1.9} /></span>
                  <div>
                    <h4>No account set</h4>
                    <p>
                      Their customers cannot pay by transfer — only cash. Set one up so
                      transfers can be traced back to this collector.
                    </p>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <AccountModal
        editing={editing}
        onClose={() => setEditing(null)}
        onDone={accounts.refetch}
      />
    </>
  );
}

function AccountModal({ editing, onClose, onDone }) {
  const { setAccount } = useCollectorAccountActions();
  const { toast, toastError } = useToast();

  const [form, setForm] = useState({
    bankName: '', accountNumber: '', accountName: '', providerRef: '',
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  // Prefill once the modal opens, not on every render.
  if (editing && !ready) {
    setForm({
      bankName: editing.account?.bank_name ?? '',
      accountNumber: editing.account?.account_number ?? '',
      accountName: editing.account?.account_name ?? '',
      providerRef: editing.account?.provider_ref ?? '',
    });
    setReady(true);
  }

  if (!editing) return null;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const close = () => {
    setReady(false);
    setErrors({});
    onClose();
  };

  const submit = async () => {
    const next = {};
    if (!form.bankName) next.bankName = 'Choose the bank.';
    if (!/^\d{10}$/.test(form.accountNumber.replace(/\s/g, ''))) {
      next.accountNumber = 'A Nigerian account number is exactly 10 digits.';
    }
    if (form.accountName.trim().length < 2) next.accountName = 'Enter the account name.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      await setAccount(editing.collector.id, form);
      toast(`Payment account set for ${editing.collector.full_name}.`);
      close();
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
      onClose={close}
      title={editing.account ? 'Change payment account' : 'Set a payment account'}
      description={editing.collector.full_name}
      footer={
        <>
          <Button variant="outline" onClick={close} disabled={busy}>Cancel</Button>
          <Button onClick={submit} loading={busy}>Save account</Button>
        </>
      }
    >
      {editing.account && (
        <div className="panel-note tone-amber">
          <span className="panel-note-icon"><CircleAlert size={17} strokeWidth={1.9} /></span>
          <div>
            <h4>The old account is retired, not deleted</h4>
            <p>
              A customer may have transferred to it minutes ago. The record of which
              account was live at that moment is kept so a late payment can still be
              traced.
            </p>
          </div>
        </div>
      )}

      <Select
        label="Bank"
        value={form.bankName}
        onChange={set('bankName')}
        error={errors.bankName}
      >
        <option value="">Choose the bank…</option>
        {NIGERIAN_BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
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
        hint="Exactly as the bank holds it — customers check this before sending."
      />

      <Input
        label="Provider sub-account reference (optional)"
        value={form.providerRef}
        onChange={set('providerRef')}
        placeholder="From your OPay business dashboard"
        hint="Lets an automatic confirmation match a transfer to this collector."
      />
    </Modal>
  );
}