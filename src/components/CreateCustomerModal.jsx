import { useState } from 'react';
import { Copy, Check, UserPlus } from 'lucide-react';
import { createCustomer } from '../lib/gateway';
import { useAuth } from '../context/AuthContext';
import { isEmail, isPhone } from '../lib/validate';
import Button from './ui/Button';
import Modal from './ui/Modal';
import { Input, Select } from './ui/Field';
import { useToast } from './ui/Toast';

/**
 * Create a customer account. Used by both admins and collectors.
 *
 * On success it shows the claim link as well as emailing it. Email lands in
 * spam, or the customer mistypes their address, and a collector standing in
 * front of that person needs something they can act on immediately rather
 * than a support ticket.
 */
export default function CreateCustomerModal({ open, onClose, onDone, collectors, enquiry }) {
  const { profile } = useAuth();
  const { toast, toastError } = useToast();

  const [form, setForm] = useState(() => ({
    fullName: enquiry?.full_name ?? '',
    phone: enquiry?.phone ?? '',
    email: enquiry?.email ?? '',
    collectorId: profile?.role === 'COLLECTOR' ? profile.id : '',
  }));
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const isCollector = profile?.role === 'COLLECTOR';
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    const next = {};
    if (form.fullName.trim().length < 2) next.fullName = "Enter the customer's full name.";
    if (!isPhone(form.phone)) next.phone = 'Enter a valid Nigerian phone number.';
    if (!isEmail(form.email)) next.email = 'Enter a valid email address — the claim link goes here.';
    if (!isCollector && !form.collectorId) next.collectorId = 'Choose a collector.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      const created = await createCustomer({
        fullName: form.fullName,
        phone: form.phone,
        email: form.email,
        collectorId: isCollector ? profile.id : form.collectorId,
        enquiryId: enquiry?.id,
      });
      setResult(created);
      toast(`Account created — ${created.memberId}`);
      onDone?.();
    } catch (err) {
      toastError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(result.claimLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard needs HTTPS and a user gesture; the link is on screen anyway.
    }
  };

  const close = () => {
    setForm({ fullName: '', phone: '', email: '', collectorId: isCollector ? profile.id : '' });
    setErrors({});
    setResult(null);
    onClose();
  };

  if (!open) return null;

  // ---- after creation --------------------------------------------------
  if (result) {
    return (
      <Modal
        open
        onClose={close}
        title="Account created"
        description={form.fullName}
        footer={<Button onClick={close} block>Done</Button>}
      >
        <div className="claim-result">
          <span className="small muted">Member ID</span>
          <strong className="num">{result.memberId}</strong>
        </div>

        <p className="muted small">
          We have emailed a setup link to <strong>{form.email}</strong>. They tap it, choose a
          passcode, and sign in with their phone number from then on.
        </p>

        {/* The code first, because it is the one that works on a phone. A
            link tapped in Gmail opens a browser, not the app. */}
        {result.claimCode && (
          <div className="claim-code-box">
            <span className="xs muted">Setup code — read this out</span>
            <strong>{result.claimCode}</strong>
            <span className="xs muted">
              They open the app, tap <em>I have a setup code</em>, and enter it.
            </span>
          </div>
        )}

        <div className="claim-link-box">
          <span className="xs muted">Or send this link — valid 7 days, works once</span>
          <code>{result.claimLink}</code>
          <button type="button" className="btn btn-outline btn-sm" onClick={copyLink}>
            {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy link</>}
          </button>
        </div>

        <p className="field-hint">
          Either one sets the passcode on this account, so do not post them in a group.
          Both stop working once used.
        </p>
      </Modal>
    );
  }

  // ---- the form --------------------------------------------------------
  return (
    <Modal
      open
      onClose={close}
      title="Create a customer account"
      description={enquiry ? 'From an account request' : undefined}
      footer={
        <>
          <Button variant="outline" onClick={close} disabled={busy}>Cancel</Button>
          <Button onClick={submit} loading={busy}><UserPlus size={16} /> Create account</Button>
        </>
      }
    >
      <Input
        label="Full name"
        value={form.fullName}
        onChange={set('fullName')}
        error={errors.fullName}
        autoComplete="off"
      />

      <Input
        label="Phone number"
        type="tel"
        inputMode="tel"
        placeholder="08012345678"
        value={form.phone}
        onChange={set('phone')}
        error={errors.phone}
        hint="This is what they sign in with."
      />

      <Input
        label="Email address"
        type="email"
        inputMode="email"
        value={form.email}
        onChange={set('email')}
        error={errors.email}
        hint="The setup link goes here. Check it carefully."
      />

      {isCollector ? (
        <p className="field-hint">
          This customer will be assigned to you.
        </p>
      ) : (
        <Select
          label="Assign a collector"
          value={form.collectorId}
          onChange={set('collectorId')}
          error={errors.collectorId}
        >
          <option value="">Choose a collector…</option>
          {(collectors || []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.full_name} ({c.member_id})
            </option>
          ))}
        </Select>
      )}
    </Modal>
  );
}