import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
      // The auth listener swaps the route; no manual navigate needed.
    } catch (err) {
      setFailure(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthFrame
      title="Sign in"
      lead="Track your daily contributions and balance."
      foot={<>New to NaijaNest? <Link to="/signup">Create an account</Link></>}
    >
      <form onSubmit={submit} noValidate>
        {failure && <div className="auth-alert">{failure}</div>}
        <Input
          label="Email" type="email" inputMode="email" autoComplete="email"
          value={form.email} onChange={set('email')} error={errors.email}
        />
        <Input
          label="Password" type="password" autoComplete="current-password"
          value={form.password} onChange={set('password')} error={errors.password}
        />
        <div style={{ textAlign: 'right', marginTop: 10 }}>
          <Link to="/forgot-password" className="small">Forgot password?</Link>
        </div>
        <Button type="submit" block loading={busy} style={{ marginTop: 20 }}>Sign in</Button>
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

    // `busy` is React state, so a fast double-tap can fire two submits before
    // the re-render disables the button. Supabase answers the second one with
    // 422 "user already registered" — the account exists, but the screen shows
    // a failure. A ref flips synchronously and closes that window.
    if (submitting.current) return;
    submitting.current = true;

    setBusy(true);
    setFailure(null);

    let created = false;
    try {
      const user = await signUp(form);
      created = true;

      // The photo is a nice-to-have. Losing it must never look like losing the
      // account, so it is reported separately and never reaches the catch below.
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
      lead="You'll get a member ID and be matched with a collector."
      foot={<>Already registered? <Link to="/login">Sign in</Link></>}
    >
      <form onSubmit={submit} noValidate>
        {failure && <div className="auth-alert">{failure}</div>}

        <div className="avatar-picker">
          <Avatar name={form.fullName} url={preview} size={62} />
          <div>
            <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }}>
              {avatar ? 'Change photo' : 'Add a photo'}
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={pickAvatar} hidden />
            </label>
            <p className="field-hint" style={{ margin: '6px 0 0' }}>Optional. Helps your collector recognise you.</p>
            {errors.avatar && <p className="field-error">{errors.avatar}</p>}
          </div>
        </div>

        <Input label="Full name" autoComplete="name" value={form.fullName} onChange={set('fullName')} error={errors.fullName} />
        <Input label="Email" type="email" inputMode="email" autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} />
        <Input label="Phone number" type="tel" inputMode="tel" autoComplete="tel" placeholder="08012345678" value={form.phone} onChange={set('phone')} error={errors.phone} />
        <Input label="Password" type="password" autoComplete="new-password" value={form.password} onChange={set('password')} error={errors.password} hint="At least 8 characters, with a letter and a number." />

        <Button type="submit" block loading={busy} style={{ marginTop: 20 }}>Create account</Button>
      </form>
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