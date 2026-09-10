import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { uploadAvatar } from '../../lib/storage';
import { friendlyError } from '../../lib/errors';
import { isEmail, isPhone, passwordProblem, required } from '../../lib/validate';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/Field';
import Logo from '../../components/ui/Logo';
import Avatar from '../../components/ui/Avatar';
import { useToast } from '../../components/ui/Toast';
import './auth.css';

function PasswordInput({
  label = 'Password',
  value,
  onChange,
  error,
  autoComplete,
  hint,
}) {
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
          {visible ? (
            <EyeOff size={18} strokeWidth={1.8} />
          ) : (
            <Eye size={18} strokeWidth={1.8} />
          )}
        </button>
      }
    />
  );
}

function AuthFrame({ title, lead, children, foot, mode = 'default' }) {
  return (
    <div className={`auth auth-${mode}`}>
      <div className="auth-orb auth-orb-one" aria-hidden="true" />
      <div className="auth-orb auth-orb-two" aria-hidden="true" />

      <main className="auth-shell">
        <section className="auth-panel">
          <div className="auth-topbar">
            <Link to="/" className="auth-brand" aria-label="NaijaNest home">
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
              NaijaNest
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
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const next = required({
      email: { value: form.email, label: 'Email' },
      password: { value: form.password, label: 'Password' },
    });
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    setFailure(null);
    try {
      await signIn(form.email, form.password);
    } catch (err) {
      setFailure(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthFrame
      title="Welcome back"
      lead="Sign in to manage your contributions, balance, and account."
      foot={<>New to NaijaNest? <Link to="/signup">Create an account</Link></>}
    >
      <form onSubmit={submit} noValidate className="auth-form">
        {failure && (
          <div className="auth-alert" role="alert">
            <AlertCircle size={18} strokeWidth={2} />
            <span>{failure}</span>
          </div>
        )}

        <Input
          label="Email address"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={set('email')}
          error={errors.email}
          icon={<Mail size={18} strokeWidth={1.8} />}
        />

        <PasswordInput
          value={form.password}
          onChange={set('password')}
          error={errors.password}
          autoComplete="current-password"
        />

        <div className="auth-form-meta">
          <span>Protected account access</span>
          <Link to="/forgot-password" className="small">Forgot password?</Link>
        </div>

        <Button type="submit" block loading={busy} className="auth-submit">
          Sign in
        </Button>
      </form>
    </AuthFrame>
  );
}

/* ----------------------------------------------------------------- signup */
export function SignupPage() {
  const { signUp, refreshProfile } = useAuth();
  const { toastError } = useToast();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '' });
  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState(null);
  const submitting = useRef(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const pickAvatar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setErrors((x) => ({ ...x, avatar: 'Image must be under 2MB.' }));
      return;
    }
    setErrors((x) => ({ ...x, avatar: null }));
    setAvatar(file);
    setPreview(URL.createObjectURL(file));
  };

  const validate = () => {
    const next = required({
      fullName: { value: form.fullName, label: 'Full name' },
      email: { value: form.email, label: 'Email' },
      phone: { value: form.phone, label: 'Phone number' },
      password: { value: form.password, label: 'Password' },
    });
    if (!next.email && !isEmail(form.email)) next.email = 'Enter a valid email address.';
    if (!next.phone && !isPhone(form.phone)) next.phone = 'Enter a valid Nigerian phone number.';
    if (!next.password) {
      const problem = passwordProblem(form.password);
      if (problem) next.password = problem;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (submitting.current) return;
    submitting.current = true;

    setBusy(true);
    setFailure(null);

    let created = false;
    try {
      const user = await signUp(form);
      created = true;

      if (user && avatar) {
        try {
          await uploadAvatar(user.id, avatar);
        } catch {
          toastError('Account created, but the photo did not upload. Add it from your profile.');
        }
      }

      refreshProfile();
    } catch (err) {
      setFailure(
        created
          ? 'Your account was created, but loading it failed. Try signing in.'
          : friendlyError(err)
      );
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };

  return (
    <AuthFrame
      title="Create your account"
      lead="Set up your NaijaNest account and get matched with a collector."
    >
      <form onSubmit={submit} noValidate className="auth-form">
        {failure && (
          <div className="auth-alert" role="alert">
            <AlertCircle size={18} strokeWidth={2} />
            <span>{failure}</span>
          </div>
        )}

        <div className="avatar-picker">
          <div className="avatar-wrap">
            <Avatar name={form.fullName} url={preview} size={64} />
            <span className="avatar-camera" aria-hidden="true">
              <Camera size={13} strokeWidth={2.2} />
            </span>
          </div>

          <div className="avatar-copy">
            <label className="avatar-upload">
              <Camera size={16} strokeWidth={1.9} />
              <span>{avatar ? 'Change photo' : 'Add a photo'}</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={pickAvatar}
                hidden
              />
            </label>
            <p className="field-hint">Optional. Helps your collector recognise you.</p>
            {errors.avatar && <p className="field-error">{errors.avatar}</p>}
          </div>
        </div>

        <Input
          label="Full name"
          autoComplete="name"
          placeholder="Your full name"
          value={form.fullName}
          onChange={set('fullName')}
          error={errors.fullName}
          icon={<UserRound size={18} strokeWidth={1.8} />}
        />

        <Input
          label="Email address"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={set('email')}
          error={errors.email}
          icon={<Mail size={18} strokeWidth={1.8} />}
        />

        <Input
          label="Phone number"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="08012345678"
          value={form.phone}
          onChange={set('phone')}
          error={errors.phone}
          icon={<Phone size={18} strokeWidth={1.8} />}
        />

        <PasswordInput
          value={form.password}
          onChange={set('password')}
          error={errors.password}
          autoComplete="new-password"
          hint="At least 8 characters, with a letter and a number."
        />

        <div className="auth-benefit">
          <CheckCircle2 size={17} strokeWidth={2} />
          <span>Your member profile is created securely and can be updated later.</span>
        </div>

        <Button type="submit" block loading={busy} className="auth-submit">
          Create account
        </Button>
      </form>

      <div className="auth-inline-foot">
        Already registered? <Link to="/login">Sign in</Link>
      </div>
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
      <AuthFrame
        title="Check your email"
        lead={`If an account uses ${email}, a reset link is on its way.`}
        mode="success"
        foot={<Link to="/login">Back to sign in</Link>}
      >
        <div className="auth-success">
          <div className="auth-success-icon">
            <CheckCircle2 size={26} strokeWidth={1.9} />
          </div>
          <p className="muted small">The link expires in one hour.</p>
        </div>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame
      title="Reset your password"
      lead="We'll email you a secure link to create a new password."
    >
      <form onSubmit={submit} noValidate className="auth-form">
        {failure && (
          <div className="auth-alert" role="alert">
            <AlertCircle size={18} strokeWidth={2} />
            <span>{failure}</span>
          </div>
        )}

        <Input
          label="Email address"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail size={18} strokeWidth={1.8} />}
        />

        <Button type="submit" block loading={busy} className="auth-submit">
          Send reset link
        </Button>
      </form>

      <div className="auth-inline-foot">
        Remembered your password? <Link to="/login">Back to sign in</Link>
      </div>
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
    <AuthFrame title="Account not active" lead="This account has been disabled. Contact your collector or NaijaNest support to reactivate it.">
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
