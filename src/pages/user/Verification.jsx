import { useState } from 'react';
import { ShieldCheck, ShieldAlert, Clock, Upload } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useMyKyc, useKycActions, ID_TYPES, ID_TYPE_LABEL } from '../../hooks/useKyc';
import { shortDate } from '../../lib/format';
import { friendlyError } from '../../lib/errors';
import { isPhone } from '../../lib/validate';
import { Card, CardHead } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Field';
import { ErrorState, SkeletonLines } from '../../components/ui/States';
import { useToast } from '../../components/ui/Toast';
import './verification.css';

/**
 * Identity verification.
 *
 * Required before withdrawing, so the page has to explain *why* it is being
 * asked rather than presenting a wall of fields. People are handing over a NIN
 * and a home address; saying who sees it and who does not is the difference
 * between a form they complete and one they abandon.
 */
export default function Verification() {
  const { profile, refreshProfile } = useAuth();
  const kyc = useMyKyc();
  const status = kyc.data?.status;

  if (kyc.loading) {
    return (
      <>
        <header className="page-head"><h1>Verification</h1></header>
        <SkeletonLines count={3} height={80} />
      </>
    );
  }
  if (kyc.error) {
    return (
      <>
        <header className="page-head"><h1>Verification</h1></header>
        <ErrorState message={kyc.error} onRetry={kyc.refetch} />
      </>
    );
  }

  if (status === 'VERIFIED') return <VerifiedView record={kyc.data} />;
  if (status === 'PENDING') return <PendingView record={kyc.data} />;

  return (
    <SubmitView
      profile={profile}
      record={kyc.data}
      onDone={() => { kyc.refetch(); refreshProfile(); }}
    />
  );
}

/* ------------------------------------------------------------- verified */
function VerifiedView({ record }) {
  return (
    <>
      <header className="page-head"><h1>Verification</h1></header>

      <div className="kyc-banner is-ok">
        <ShieldCheck size={26} strokeWidth={1.9} />
        <div>
          <strong>Your identity is verified</strong>
          <p>You can request withdrawals. Verified {shortDate(record.reviewed_at)}.</p>
        </div>
      </div>

      <Card large style={{ marginTop: 'var(--s-4)' }}>
        <CardHead title="What we hold" />
        <dl className="detail-list">
          <div><dt>Full name</dt><dd>{record.full_name}</dd></div>
          <div><dt>Date of birth</dt><dd>{shortDate(record.date_of_birth)}</dd></div>
          <div><dt>Address</dt><dd>{[record.address_line, record.city, record.state].filter(Boolean).join(', ')}</dd></div>
          <div><dt>ID type</dt><dd>{ID_TYPE_LABEL[record.id_type]}</dd></div>
          {/* Masked. There is no reason to render a full NIN back on a screen
              someone might be holding in public. */}
          <div>
            <dt>ID number</dt>
            <dd className="num">{'•'.repeat(Math.max(0, record.id_number.length - 4)) + record.id_number.slice(-4)}</dd>
          </div>
        </dl>
        <p className="field-hint">
          To change any of this, contact BudgetSave support. Your collector cannot see these
          details — only BudgetSave administrators can.
        </p>
      </Card>
    </>
  );
}

/* -------------------------------------------------------------- pending */
function PendingView({ record }) {
  return (
    <>
      <header className="page-head"><h1>Verification</h1></header>

      <div className="kyc-banner is-pending">
        <Clock size={26} strokeWidth={1.9} />
        <div>
          <strong>Under review</strong>
          <p>Submitted {shortDate(record.submitted_at)}. This usually takes a working day.</p>
        </div>
      </div>

      <Card large style={{ marginTop: 'var(--s-4)' }}>
        <CardHead title="What you submitted" />
        <dl className="detail-list">
          <div><dt>Full name</dt><dd>{record.full_name}</dd></div>
          <div><dt>Phone</dt><dd className="num">{record.phone}</dd></div>
          <div><dt>Date of birth</dt><dd>{shortDate(record.date_of_birth)}</dd></div>
          <div><dt>ID type</dt><dd>{ID_TYPE_LABEL[record.id_type]}</dd></div>
        </dl>
        <p className="field-hint">
          You can keep contributing while this is reviewed — only withdrawals need
          verification.
        </p>
      </Card>
    </>
  );
}

/* --------------------------------------------------------------- submit */
function SubmitView({ profile, record, onDone }) {
  const { submitKyc } = useKycActions();
  const { toast, toastError } = useToast();

  // Anything already known is filled in, so the only new work is the ID.
  const [form, setForm] = useState({
    fullName: record?.full_name || profile?.full_name || '',
    phone: record?.phone || profile?.phone || '',
    dateOfBirth: record?.date_of_birth || '',
    address: record?.address_line || '',
    city: record?.city || '',
    state: record?.state || '',
    idType: record?.id_type || 'NIN',
    idNumber: record?.id_number || '',
  });
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const pickFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      return setErrors((x) => ({ ...x, file: 'File must be under 5MB.' }));
    }
    setErrors((x) => ({ ...x, file: null }));
    setFile(f);
  };

  const eighteenYearsAgo = () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d.toISOString().slice(0, 10);
  };

  const validate = () => {
    const next = {};
    if (!form.fullName.trim()) next.fullName = 'Enter your full name as it appears on your ID.';
    if (!isPhone(form.phone)) next.phone = 'Enter a valid Nigerian phone number.';
    if (!form.dateOfBirth) next.dateOfBirth = 'Enter your date of birth.';
    else if (form.dateOfBirth > eighteenYearsAgo()) next.dateOfBirth = 'You must be at least 18.';
    if (!form.address.trim()) next.address = 'Enter the address where you live.';

    const id = form.idNumber.replace(/\s/g, '');
    if (!id) next.idNumber = 'Enter your ID number.';
    else if (form.idType === 'NIN' && !/^\d{11}$/.test(id)) {
      next.idNumber = 'A NIN is exactly 11 digits.';
    } else if (id.length < 5) next.idNumber = 'That ID number looks too short.';

    if (!file && !record?.id_document_path) {
      next.file = 'Upload a photo of your ID so it can be checked.';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setBusy(true);
    try {
      await submitKyc(profile.id, form, file);
      toast('Details submitted. You will hear back within a working day.');
      onDone();
    } catch (err) {
      toastError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <header className="page-head">
        <h1>Verify your identity</h1>
        <p>Required before your first withdrawal.</p>
      </header>

      {record?.status === 'REJECTED' && (
        <div className="kyc-banner is-rejected">
          <ShieldAlert size={26} strokeWidth={1.9} />
          <div>
            <strong>Not approved</strong>
            <p>{record.rejection_reason}</p>
          </div>
        </div>
      )}

      <div className="kyc-why">
        <p>
          BudgetSave holds your savings until you ask for them back. Confirming who you are
          is what stops someone else collecting your money.
        </p>
        <p className="small">
          <strong>Your collector cannot see any of this.</strong> Only BudgetSave
          administrators can, and only to check it against your ID.
        </p>
      </div>

      <Card large style={{ marginTop: 'var(--s-4)' }}>
        <form onSubmit={submit} noValidate>
          <Input
            label="Full name (as on your ID)"
            value={form.fullName}
            onChange={set('fullName')}
            error={errors.fullName}
            autoComplete="name"
          />
          <Input
            label="Phone number"
            type="tel"
            inputMode="tel"
            value={form.phone}
            onChange={set('phone')}
            error={errors.phone}
            autoComplete="tel"
          />
          <Input
            label="Date of birth"
            type="date"
            value={form.dateOfBirth}
            max={eighteenYearsAgo()}
            onChange={set('dateOfBirth')}
            error={errors.dateOfBirth}
          />
          <Input
            label="Residential address"
            value={form.address}
            onChange={set('address')}
            error={errors.address}
            placeholder="House number and street"
            autoComplete="street-address"
          />
          <div className="grid-2">
            <Input label="City / town" value={form.city} onChange={set('city')} />
            <Input label="State" value={form.state} onChange={set('state')} placeholder="Oyo" />
          </div>

          <Select label="ID type" value={form.idType} onChange={set('idType')}>
            {ID_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </Select>

          <Input
            label="ID number"
            value={form.idNumber}
            onChange={set('idNumber')}
            error={errors.idNumber}
            inputMode={form.idType === 'NIN' ? 'numeric' : 'text'}
            hint={form.idType === 'NIN' ? '11 digits, no spaces' : undefined}
          />

          <div className="field">
            <span className="field-label">Photo of your ID</span>
            <label className={`kyc-upload${file ? ' has-file' : ''}`}>
              <Upload size={20} strokeWidth={1.9} />
              <span>
                {file
                  ? file.name
                  : record?.id_document_path
                    ? 'Replace the document you uploaded'
                    : 'Tap to upload a photo or PDF'}
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,application/pdf"
                onChange={pickFile}
                hidden
              />
            </label>
            {errors.file
              ? <p className="field-error">{errors.file}</p>
              : <p className="field-hint">Make sure the whole card is visible and the text is readable. Under 5MB.</p>}
          </div>

          <Button type="submit" block loading={busy} style={{ marginTop: 'var(--s-5)' }}>
            Submit for review
          </Button>
        </form>
      </Card>
    </>
  );
}
