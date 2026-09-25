import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { friendlyError } from '../../lib/errors';
import { isEmail, isPhone, passwordProblem } from '../../lib/validate';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/Field';
import Logo from '../../components/ui/Logo';
import { useToast } from '../../components/ui/Toast';
import './auth.css';

function AuthFrame({ title, lead, children, foot }) {
  return (
    <div className="auth">
      <div className="auth-panel">
        <Link to="/" className="auth-brand"><Logo size={30} /></Link>
        <h1>{title}</h1>
        {lead && <p className="muted">{lead}</p>}
        {children}
        {foot && <div className="auth-foot">{foot}</div>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ login */
export function LoginPage() {
  const { signIn } = useAuth();
  const [form, setForm] = useState({ phone: '', passcode: '' });
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();

    const next = {};
    if (!isPhone(form.phone)) next.phone = 'Enter the phone number on your account.';
    if (form.passcode.replace(/\D/g, '').length < 6) next.passcode = 'Enter your 6-digit passcode.';
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
      foot={<>Do not have an account? <Link to="/contact">Request one</Link></>}
    >
      <form onSubmit={submit} noValidate>
        {failure && <div className="auth-alert">{failure}</div>}

        <Input
          label="Phone number"
          type="tel"
          inputMode="tel"
          autoComplete="username"
          placeholder="08012345678"
          value={form.phone}
          onChange={set('phone')}
          error={errors.phone}
        />

        <div className="passcode-field">
          <Input
            label="Passcode"
            type={show ? 'text' : 'password'}
            inputMode="numeric"
            autoComplete="current-password"
            maxLength={8}
            value={form.passcode}
            onChange={(e) => setForm((f) => ({ ...f, passcode: e.target.value.replace(/\D/g, '') }))}
            error={errors.passcode}
          />
          <button
            type="button"
            className="passcode-eye"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? 'Hide passcode' : 'Show passcode'}
          >
            {show ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>

        <div style={{ textAlign: 'right', marginTop: 10 }}>
          <Link to="/forgot-password" className="small">Forgot passcode?</Link>
        </div>

        <Button type="submit" block loading={busy} style={{ marginTop: 20 }}>Sign in</Button>
      </form>
    </AuthFrame>
  );
}

/* ----------------------------------------------------------------- signup */
/**
 * Customers do not create their own accounts.
 *
 * Every customer needs a collector assigned before they can contribute, and a
 * person has to make that match. So a visitor submits an enquiry and staff
 * create the account — this page only explains that and points them onward.
 */
export function SignupPage() {
  return (
    <AuthFrame
      title="Request an account"
      lead="BudgetSave accounts are opened by our team."
      foot={<>Already set up? <Link to="/login">Sign in</Link></>}
    >
      <p className="muted small">
        Every customer is matched with a collector who handles their contributions in
        person, so a member of our team opens your account and assigns one to you.
      </p>
      <p className="muted small">
        Send us your details and we will contact you. Once your account is ready you
        receive a link by email to set your passcode.
      </p>

      <Link to="/contact" className="btn btn-primary btn-block" style={{ marginTop: 20 }}>
        Request an account
      </Link>
    </AuthFrame>
  );
}

/* --------------------------------------------------------- forgot password */
export function ForgotPasswordPage() {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!isEmail(email)) return setFailure('Enter a valid email address.');
    setBusy(true);
    setFailure(null);
    try {
      await sendPasswordReset(email);
      setSent(true);
    } catch (err) {
      setFailure(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <AuthFrame title="Check your email" lead={`If an account uses ${email}, a reset link is on its way.`}
        foot={<Link to="/login">Back to sign in</Link>}>
        <p className="muted small">The link expires in one hour.</p>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame
      title="Reset your password"
      lead="We'll email you a link to set a new one."
      foot={<Link to="/login">Back to sign in</Link>}
    >
      <form onSubmit={submit} noValidate>
        {failure && <div className="auth-alert">{failure}</div>}
        <Input label="Email" type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Button type="submit" block loading={busy} style={{ marginTop: 20 }}>Send reset link</Button>
      </form>
    </AuthFrame>
  );
}

/* ---------------------------------------------------------- set a password */
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
      <form onSubmit={submit} noValidate>
        {failure && <div className="auth-alert">{failure}</div>}
        <Input label="New password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />
        <Input label="Confirm password" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={errors.confirm} />
        <Button type="submit" block loading={busy} style={{ marginTop: 20 }}>Save password</Button>
      </form>
    </AuthFrame>
  );
}

/* -------------------------------------------------------- disabled account */
export function AccountDisabledPage() {
  const { signOut } = useAuth();
  return (
    <AuthFrame title="Account not active" lead="This account has been disabled. Contact your collector or NaijaNest support to reactivate it.">
      <Button variant="outline" block onClick={signOut}>Sign out</Button>
    </AuthFrame>
  );
}