import { useState } from 'react';
import { useAllPlans, useAdminActions } from '../../hooks/useAdmin';
import { money } from '../../lib/format';
import { friendlyError } from '../../lib/errors';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Input, Textarea } from '../../components/ui/Field';
import StatusBadge from '../../components/ui/Status';
import { EmptyState, ErrorState, SkeletonLines } from '../../components/ui/States';
import { useToast } from '../../components/ui/Toast';
import './admin.css';

/**
 * Contribution plans define the daily amounts on offer. Editing one never
 * touches a running cycle — cycles snapshot their amount at activation, and a
 * database trigger blocks any attempt to change that snapshot afterwards.
 */
export default function Plans() {
  const { data, loading, error, refetch } = useAllPlans();
  const { togglePlan } = useAdminActions();
  const { toast, toastError } = useToast();
  const [editing, setEditing] = useState(null);

  const toggle = async (plan) => {
    try {
      await togglePlan(plan.id, !plan.is_active);
      toast(plan.is_active ? 'Plan deactivated.' : 'Plan activated.');
      refetch();
    } catch (err) {
      toastError(friendlyError(err));
    }
  };

  return (
    <>
      <header className="page-head row-between">
        <div>
          <h1>Contribution plans</h1>
          <p>The daily amounts customers can choose from.</p>
        </div>
        <Button onClick={() => setEditing({ name: '', daily_amount: '', description: '', is_active: true })}>
          New plan
        </Button>
      </header>

      {loading && <SkeletonLines count={3} height={82} />}
      {error && !loading && <ErrorState message={error} onRetry={refetch} />}

      {!loading && !error && !data?.length && (
        <Card large>
          <EmptyState
            title="No plans yet"
            message="Create at least one daily amount before customers can start a cycle."
            icon="◇"
            action={
              <Button onClick={() => setEditing({ name: '', daily_amount: '', description: '', is_active: true })}>
                Create the first plan
              </Button>
            }
          />
        </Card>
      )}

      <div className="stack">
        {data?.map((plan) => (
          <Card key={plan.id}>
            <div className="row-between" style={{ alignItems: 'flex-start' }}>
              <div>
                <div className="row" style={{ gap: 10 }}>
                  <h3 className="num">{money(plan.daily_amount)}</h3>
                  <StatusBadge status={plan.is_active ? 'ACTIVE' : 'DISABLED'} />
                </div>
                <p className="small muted" style={{ margin: '2px 0 0' }}>
                  {plan.name}
                  {plan.description && ` · ${plan.description}`}
                </p>
              </div>
              <div className="row" style={{ gap: 6 }}>
                <Button variant="ghost" size="sm" onClick={() => setEditing(plan)}>Edit</Button>
                <Button variant="outline" size="sm" onClick={() => toggle(plan)}>
                  {plan.is_active ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <PlanModal plan={editing} onClose={() => setEditing(null)} onSaved={refetch} />
    </>
  );
}

function PlanModal({ plan, onClose, onSaved }) {
  const { savePlan } = useAdminActions();
  const { toast, toastError } = useToast();
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  // Seed the form the first time a plan is handed in, and reset when it closes.
  const current = form && form.__id === (plan?.id ?? 'new')
    ? form
    : plan
      ? { ...plan, __id: plan.id ?? 'new', daily_amount: String(plan.daily_amount ?? '') }
      : null;

  if (!plan) return null;

  const set = (k) => (e) => setForm({ ...current, [k]: e.target.value });

  const submit = async () => {
    const next = {};
    if (!current.name?.trim()) next.name = 'Give the plan a name.';
    const amount = Number(current.daily_amount);
    if (!Number.isFinite(amount) || amount <= 0) next.daily_amount = 'Enter an amount above zero.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      await savePlan({ ...current, daily_amount: amount });
      toast(plan.id ? 'Plan updated.' : 'Plan created.');
      setForm(null);
      onClose();
      onSaved();
    } catch (err) {
      toastError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={() => { setForm(null); onClose(); }}
      title={plan.id ? 'Edit plan' : 'New plan'}
      description={plan.id ? 'Running cycles keep the terms they started with.' : undefined}
      footer={
        <>
          <Button variant="outline" onClick={() => { setForm(null); onClose(); }} disabled={busy}>Cancel</Button>
          <Button onClick={submit} loading={busy}>Save plan</Button>
        </>
      }
    >
      <Input
        label="Name" value={current?.name || ''} onChange={set('name')}
        error={errors.name} placeholder="Standard"
      />
      <Input
        label="Daily amount (₦)" type="number" inputMode="numeric" min="1"
        value={current?.daily_amount || ''} onChange={set('daily_amount')}
        error={errors.daily_amount} placeholder="1000"
      />
      <Textarea
        label="Description (optional)" value={current?.description || ''}
        onChange={set('description')} placeholder="Most popular with traders"
      />
    </Modal>
  );
}