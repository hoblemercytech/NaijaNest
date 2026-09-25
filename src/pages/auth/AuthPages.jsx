import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  UserRoundPlus,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { forgotPasscode } from '../../lib/gateway';
import { friendlyError } from '../../lib/errors';
import { isEmail, isPhone, passwordProblem, required } from '../../lib/validate';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/Field';
import Logo from '../../components/ui/Logo';
import { useToast } from '../../components/ui/Toast';
import './auth.css';

/**
 * A numeric passcode field.
 *
 * Same shape as the old password input — icon, reveal toggle — but it strips
 * non-digits as you type. A stray space pasted from a notes app is otherwise
 * a failed attempt, and five of those lock the account.
 */
export function PasscodeInput({
  label = 'Passcode',
  value,
  onChange,
  error,
  autoComplete = 'current-password',
  hint,
}) {
  const [visible, setVisible] = useState(false);

  return (
    <Input
      label={label}
      type={visible ? 'text' : 'password'}
      inputMode="numeric"
      autoComplete={autoComplete}
      maxLength={8}
      placeholder="••••••"
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
      error={error}
      hint={hint}
      icon={<LockKeyhole size={18} strokeWidth={1.8} />}
      endAdornment={
        <button
          type="button"
          className="password-toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide passcode' : 'Show passcode'}
          title={visible ? 'Hide passcode' : 'Show passcode'}
        >
          {visible ? <EyeOff size={18} strokeWidth={1.8} /> : <Eye size={18} strokeWidth={1.8} />}
        </button>
      }
    />
  );
}

/** Kept for the password-reset screens, which still use a real password. */
function PasswordInput({ label = 'Password', value, onChange, error, autoComplete, hint }) {
  const [visible, setVisible] = useState(false);

  return (
    <Input
      label={label}
      type={visible ? 'text' : 'password'}
      autoComplete={autoComplete}
      value={value}
      onChange={onChange}
      error={error}
      hint={hint}
      icon={<LockKeyhole size={18} strokeWidth={1.8} />}
      endAdornment={
        <button
          type="button"
          className="password-toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          title={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff size={18} strokeWidth={1.8} /> : <Eye size={18} strokeWidth={1.8} />}
        </button>
      }
    />
  );
}

export function AuthFrame({ title, lead, children, foot, mode = 'default' }) {
  return (
    <div className={`auth auth-${mode}`}>
      <div className="auth-orb auth-orb-one" aria-hidden="true" />
      <div className="auth-orb auth-orb-two" aria-hidden="true" />

      <main className="auth-shell">
        <section className="auth-panel">
          <div className="auth-topbar">
            <Link to="/" className="auth-brand" aria-label="BudgetSave home">
              <Logo size={32} />
            </Link>

            <div className="auth-secure">
              <ShieldCheck size={15} strokeWidth={2} />
              <span>Secure access</span>
            </div>
          </div>

          <div className="auth-heading">
            <div className="auth-eyebrow">
              <span className="auth-eyebrow-dot" />
              BudgetSave
            </div>
            <h1>{title}</h1>
            {lead && <p className="muted">{lead}</p>}
          </div>

          {children}

          {foot && <div className="auth-foot">{foot}</div>}

          <div className="auth-security-note">
            <ShieldCheck size={14} strokeWidth={2} />
            <span>Your information is protected with secure authentication.</span>
          </div>
        </section>
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ login */
export function LoginPage() {
  const { signIn } = useAuth();
  const [form, setForm] = useState({ phone: '', passcode: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState(null);

  const submit = async (e) => {
    e.preventDefault();

    const next = required({
      phone: { value: form.phone, label: 'Phone number' },
      passcode: { value: form.passcode, label: 'Passcode' },
    });
    if (!next.phone && !isPhone(form.phone)) next.phone = 'Enter a valid Nigerian phone number.';
    if (!next.passcode && form.passcode.length < 6) next.passcode = 'Your passcode is 6 to 8 digits.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    setFailure(null);
    try {
      await signIn(form.phone, form.passcode);
      // The auth listener swaps the route; no manual navigate needed.
    } catch (err) {
      setFailure(friendlyError(err));
      setBusy(false);
    }
  };

  return (
    <AuthFrame
      title="Welcome back"
      lead="Sign in with your phone number and passcode."
      foot={<>New to BudgetSave? <Link to="/contact">Request an account</Link></>}
    >
      <form onSubmit={submit} noValidate className="auth-form">
        {failure && (
          <div className="auth-alert" role="alert">
            <AlertCircle size={18} strokeWidth={2} />
            <span>{failure}</span>
          </div>
        )}

        <Input
          label="Phone number"
          type="tel"
          inputMode="tel"
          autoComplete="username"
          placeholder="08012345678"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          error={errors.phone}
          icon={<Phone size={18} strokeWidth={1.8} />}
        />

        <PasscodeInput
          value={form.passcode}
          onChange={(passcode) => setForm((f) => ({ ...f, passcode }))}
          error={errors.passcode}
        />

        <div className="auth-form-meta">
          <span>Protected account access</span>
          <Link to="/forgot-password" className="small">Forgot passcode?</Link>
        </div>

        <Button type="submit" block loading={busy} className="auth-submit">
          Sign in
        </Button>
      </form>
    </AuthFrame>
  );
}

/* --------------------------------------------------------- request account */
/**
 * Customers do not open their own accounts.
 *
 * Every customer needs a collector assigned before they can contribute, and a
 * person has to make that match. This page explains that and points onward
 * rather than presenting a form that cannot work.
 */
export function SignupPage() {
  return (
    <AuthFrame
      title="Request an account"
      lead="BudgetSave accounts are opened by our team."
      foot={<>Already set up? <Link to="/login">Sign in</Link></>}
    >
      <div className="auth-benefit">
        <CheckCircle2 size={17} strokeWidth={2} />
        <span>
          Every customer is matched with a collector who handles their contributions in
          person, so a member of our team opens your account and assigns one to you.
        </span>
      </div>

      <div className="auth-benefit">
        <CheckCircle2 size={17} strokeWidth={2} />
        <span>
          Send us your details and we will call you. Once your account is ready you
          receive an email with a link to set your passcode.
        </span>
      </div>

      <Link to="/contact" className="btn btn-primary btn-block auth-submit" style={{ marginTop: 20 }}>
        <UserRoundPlus size={17} strokeWidth={1.9} />
        Request an account
      </Link>
    </AuthFrame>
  );
}

/* --------------------------------------------------------- forgot passcode */
export function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState(null);

  const submit = async (e) => {
    e.preventDefault();

    const looksValid = isEmail(identifier) || isPhone(identifier);
    if (!looksValid) return setFailure('Enter the phone number or email on your account.');

    setBusy(true);
    setFailure(null);
    try {
      await forgotPasscode(identifier);
      setSent(true);
    } catch (err) {
      setFailure(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <AuthFrame
        title="Check your email"
        lead="If that account exists, a setup link is on its way."
        mode="success"
        foot={<Link to="/login">Back to sign in</Link>}
      >
        <div className="auth-success">
          <div className="auth-success-icon">
            <CheckCircle2 size={26} strokeWidth={1.9} />
          </div>
          <p className="muted small">
            Open it and choose a new passcode. The link works once and expires in 7 days.
          </p>
        </div>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame
      title="Forgot your passcode?"
      lead="We'll email you a secure link to set a new one."
    >
      <form onSubmit={submit} noValidate className="auth-form">
        {failure && (
          <div className="auth-alert" role="alert">
            <AlertCircle size={18} strokeWidth={2} />
            <span>{failure}</span>
          </div>
        )}

        <Input
          label="Phone number or email"
          type="text"
          inputMode="email"
          autoComplete="username"
          placeholder="08012345678 or you@example.com"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          icon={<Mail size={18} strokeWidth={1.8} />}
          hint="The link is sent to the email address on your account."
        />

        <Button type="submit" block loading={busy} className="auth-submit">
          Send setup link
        </Button>
      </form>

      <div className="auth-inline-foot">
        Remembered it? <Link to="/login">Back to sign in</Link>
      </div>
    </AuthFrame>
  );
}

/* ------------------------------------------------- set a password (staff) */
/**
 * Staff still use an email and password — they sign in far less often than a
 * collector taps through the app, and their accounts can reach other people's
 * money. This is the screen a reset link lands on.
 */
export function ResetPasswordPage() {
  const { updatePassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    const problem = passwordProblem(password);
    if (problem) next.password = problem;
    if (password !== confirm) next.confirm = 'Passwords do not match.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    setFailure(null);
    try {
      await updatePassword(password);
      toast('Password updated.');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setFailure(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthFrame title="Set a new password" lead="Choose something you haven't used before.">
      <form onSubmit={submit} noValidate className="auth-form">
        {failure && (
          <div className="auth-alert" role="alert">
            <AlertCircle size={18} strokeWidth={2} />
            <span>{failure}</span>
          </div>
        )}

        <PasswordInput
          label="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          autoComplete="new-password"
        />

        <PasswordInput
          label="Confirm password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={errors.confirm}
          autoComplete="new-password"
        />

        <Button type="submit" block loading={busy} className="auth-submit">
          Save password
        </Button>
      </form>
    </AuthFrame>
  );
}

/* -------------------------------------------------------- disabled account */
export function AccountDisabledPage() {
  const { signOut } = useAuth();

  return (
    <AuthFrame
      title="Account not active"
      lead="This account has been disabled. Contact your collector or BudgetSave support to reactivate it."
    >
      <div className="auth-disabled">
        <div className="auth-disabled-icon">
          <AlertCircle size={25} strokeWidth={1.9} />
        </div>
        <p>For your security, account access is currently unavailable.</p>
      </div>

      <Button variant="outline" block onClick={signOut}>
        Sign out
      </Button>
    </AuthFrame>
  );
}
