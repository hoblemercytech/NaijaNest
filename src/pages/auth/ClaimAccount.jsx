import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { claimAccount, peekClaim, signInWithPasscode } from '../../lib/gateway';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/Field';
import Logo from '../../components/ui/Logo';
import { LoadingState } from '../../components/ui/States';
import { useToast } from '../../components/ui/Toast';
import './auth.css';

/**
 * Claim link landing page — /claim/:token
 *
 * The customer arrives from an email with an account already created for them.
 * All they do here is set a passcode, and we sign them straight in afterwards:
 * bouncing them to a login form to immediately retype what they just chose is
 * friction with no purpose.
 */
export default function ClaimAccount() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { toast, toastError } = useToast();

  const [state, setState] = useState({ loading: true, claim: null, error: null });
  const [passcode, setPasscode] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    peekClaim(token)
      .then((claim) => {
        if (!alive) return;
        setState({ loading: false, claim: claim.valid ? claim : null, error: claim.valid ? null : claim.reason });
      })
      .catch((err) => {
        if (alive) setState({ loading: false, claim: null, error: err.message });
      });
    return () => { alive = false; };
  }, [token]);

  const validate = () => {
    const next = {};
    const code = passcode.replace(/\D/g, '');

    if (code.length < 6 || code.length > 8) {
      next.passcode = 'Your passcode must be 6 to 8 digits.';
    } else if (/^(.)\1+$/.test(code)) {
      next.passcode = 'Do not use the same digit repeatedly.';
    } else if (['123456', '1234567', '12345678', '654321', '111111', '000000'].includes(code)) {
      next.passcode = 'That passcode is too easy to guess.';
    }

    if (code !== confirm.replace(/\D/g, '')) next.confirm = 'The two passcodes do not match.';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setBusy(true);
    try {
      await claimAccount(token, passcode);

      // Straight in. They have proved they hold the email and just chose the
      // passcode, so a login form would ask for nothing they have not given.
      // If it fails, the account is still set up — send them to sign in.
      try {
        await signInWithPasscode(state.claim.phone, passcode);
        toast('Your account is ready.');
        navigate('/dashboard', { replace: true });
      } catch {
        toast('Passcode set. Sign in with your phone number to continue.');
        navigate('/login', { replace: true });
      }
    } catch (err) {
      toastError(err.message);
      setBusy(false);
    }
  };

  if (state.loading) return <LoadingState label="Checking your link" />;

  if (state.error) {
    return (
      <div className="auth">
        <div className="auth-panel">
          <Link to="/" className="auth-brand"><Logo size={30} /></Link>
          <h1>Link not valid</h1>
          <p className="muted">{state.error}</p>
          <p className="field-hint">
            Ask your collector to send a new one, or contact us and we will sort it out.
          </p>
          <Link to="/contact" className="btn btn-outline btn-block" style={{ marginTop: 16 }}>
            Contact support
          </Link>
          <div className="auth-foot">
            Already set up? <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth">
      <div className="auth-panel">
        <Link to="/" className="auth-brand"><Logo size={30} /></Link>

        <h1>Welcome, {state.claim.full_name?.split(' ')[0]}</h1>
        <p className="muted">
          Your account is ready. Choose a passcode — you will use it with your phone number
          every time you sign in.
        </p>

        <div className="claim-id">
          <span>Your member ID</span>
          <strong className="num">{state.claim.member_id}</strong>
          <span className="xs">Your collector uses this to find you. Keep it.</span>
        </div>

        <form onSubmit={submit} noValidate>
          <div className="passcode-field">
            <Input
              label="Choose a passcode"
              type={show ? 'text' : 'password'}
              inputMode="numeric"
              autoComplete="new-password"
              maxLength={8}
              value={passcode}
              onChange={(e) => setPasscode(e.target.value.replace(/\D/g, ''))}
              error={errors.passcode}
              hint="6 to 8 digits. Avoid a birthday or anything on your ID."
            />
            <button
              type="button"
              className="passcode-eye"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? 'Hide passcode' : 'Show passcode'}
            >
              {show ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>

          <Input
            label="Confirm your passcode"
            type={show ? 'text' : 'password'}
            inputMode="numeric"
            autoComplete="new-password"
            maxLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value.replace(/\D/g, ''))}
            error={errors.confirm}
          />

          <Button type="submit" block loading={busy} style={{ marginTop: 20 }}>
            Set my passcode
          </Button>
        </form>

        <p className="field-hint" style={{ marginTop: 16 }}>
          <ShieldCheck size={13} style={{ verticalAlign: '-2px' }} />{' '}
          Never share your passcode. No member of BudgetSave staff will ever ask for it.
        </p>
      </div>
    </div>
  );
}
