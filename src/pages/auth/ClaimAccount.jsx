import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, BadgeCheck, CheckCircle2, KeyRound, ShieldAlert } from 'lucide-react';
import { claimAccount, peekClaim, signInWithPasscode } from '../../lib/gateway';
import { AuthFrame, PasscodeInput } from './AuthPages';
import { Input } from '../../components/ui/Field';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import './auth.css';

/**
 * Claim link landing page — /claim/:token
 *
 * The customer arrives from an email with an account already created for them.
 * All they do here is choose a passcode, and we sign them in straight after:
 * bouncing them to a login form to retype what they just chose is friction
 * with no purpose.
 */
export default function ClaimAccount() {
  const { token: urlToken } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Reached without a token — the app route, where someone types the code a
  // collector read out. A link in an email opens a browser unless app links
  // are verified on the domain, so the code is the reliable path on mobile.
  const [code, setCode] = useState('');
  const [lookupError, setLookupError] = useState(null);
  const [looking, setLooking] = useState(false);

  const [state, setState] = useState({
    loading: !!urlToken,
    claim: null,
    error: null,
    token: urlToken ?? null,
  });
  const [passcode, setPasscode] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!urlToken) return undefined;

    let alive = true;
    peekClaim(urlToken)
      .then((claim) => {
        if (!alive) return;
        setState({
          loading: false,
          claim: claim.valid ? claim : null,
          error: claim.valid ? null : claim.reason,
          token: urlToken,
        });
      })
      .catch((err) => {
        if (alive) setState({ loading: false, claim: null, error: err.message, token: urlToken });
      });
    return () => { alive = false; };
  }, [urlToken]);

  const lookUpCode = async (e) => {
    e.preventDefault();
    const entered = code.trim();
    if (entered.replace(/[^A-Za-z0-9]/g, '').length < 8) {
      return setLookupError('Enter the full 8-character code.');
    }

    setLooking(true);
    setLookupError(null);
    try {
      const claim = await peekClaim(entered);
      if (!claim.valid) {
        setLookupError(claim.reason);
      } else {
        setState({ loading: false, claim, error: null, token: entered });
      }
    } catch (err) {
      setLookupError(err.message);
    } finally {
      setLooking(false);
    }
  };

  const validate = () => {
    const next = {};

    if (passcode.length < 6 || passcode.length > 8) {
      next.passcode = 'Your passcode must be 6 to 8 digits.';
    } else if (/^(.)\1+$/.test(passcode)) {
      next.passcode = 'Do not use the same digit repeatedly.';
    } else if (['123456', '1234567', '12345678', '654321', '121212', '123123'].includes(passcode)) {
      next.passcode = 'That passcode is too easy to guess.';
    }

    if (passcode !== confirm) next.confirm = 'The two passcodes do not match.';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setBusy(true);
    setFailure(null);
    try {
      await claimAccount(state.token, passcode);

      // Straight in. They have proved they hold the email and just chose the
      // passcode, so a login form would ask for nothing new. If sign-in fails
      // the account is still set up — send them to the login screen.
      try {
        await signInWithPasscode(state.claim.phone, passcode);
        toast('Your account is ready.');
        navigate('/dashboard', { replace: true });
      } catch {
        toast('Passcode set. Sign in with your phone number to continue.');
        navigate('/login', { replace: true });
      }
    } catch (err) {
      setFailure(err.message);
      setBusy(false);
    }
  };

  // No token in the URL and nothing looked up yet: ask for the code.
  if (!urlToken && !state.claim) {
    return (
      <AuthFrame
        title="Enter your setup code"
        lead="Your collector or the email we sent has an 8-character code. Enter it to set up your account."
        foot={<>Already set up? <Link to="/login">Sign in</Link></>}
      >
        <form onSubmit={lookUpCode} noValidate className="auth-form">
          {lookupError && (
            <div className="auth-alert" role="alert">
              <AlertCircle size={18} strokeWidth={2} />
              <span>{lookupError}</span>
            </div>
          )}

          <Input
            label="Setup code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABCD-EFGH"
            autoComplete="one-time-code"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={9}
            inputClassName="claim-code-input"
            icon={<KeyRound size={18} strokeWidth={1.8} />}
            hint="Not case sensitive. The dash is optional."
          />

          <Button type="submit" block loading={looking} className="auth-submit">
            Continue
          </Button>
        </form>

        <div className="auth-inline-foot">
          No code? <Link to="/forgot-password">Have one emailed to you</Link>
        </div>
      </AuthFrame>
    );
  }

  if (state.loading) {
    return (
      <AuthFrame title="Checking your link" lead="One moment.">
        <div className="auth-success">
          <div className="auth-success-icon">
            <BadgeCheck size={26} strokeWidth={1.9} />
          </div>
        </div>
      </AuthFrame>
    );
  }

  if (state.error) {
    return (
      <AuthFrame
        title="Link not valid"
        lead={state.error}
        foot={<>Already set up? <Link to="/login">Sign in</Link></>}
      >
        <div className="auth-disabled">
          <div className="auth-disabled-icon">
            <ShieldAlert size={25} strokeWidth={1.9} />
          </div>
          <p>
            Ask your collector to send a new link, or use <strong>Forgot passcode</strong>
            {' '}to have one emailed to you.
          </p>
        </div>

        <Link to="/forgot-password" className="btn btn-primary btn-block auth-submit">
          Send me a new link
        </Link>
      </AuthFrame>
    );
  }

  const firstName = state.claim.full_name?.split(' ')[0] ?? 'there';

  return (
    <AuthFrame
      title={`Welcome, ${firstName}`}
      lead="Your account is ready. Choose a passcode — you will use it with your phone number every time you sign in."
    >
      <form onSubmit={submit} noValidate className="auth-form">
        {failure && (
          <div className="auth-alert" role="alert">
            <AlertCircle size={18} strokeWidth={2} />
            <span>{failure}</span>
          </div>
        )}

        {/* The member ID is what a collector asks for in the street, so it is
            shown once, prominently, at the moment they are most likely to
            write it down. */}
        <div className="claim-id">
          <span>Your member ID</span>
          <strong className="num">{state.claim.member_id}</strong>
          <span className="claim-id-note">
            Your collector uses this to find you. Keep it somewhere safe.
          </span>
        </div>

        <PasscodeInput
          label="Choose a passcode"
          value={passcode}
          onChange={setPasscode}
          error={errors.passcode}
          autoComplete="new-password"
          hint="6 to 8 digits. Avoid a birthday or anything printed on your ID."
        />

        <PasscodeInput
          label="Confirm your passcode"
          value={confirm}
          onChange={setConfirm}
          error={errors.confirm}
          autoComplete="new-password"
        />

        <div className="auth-benefit">
          <CheckCircle2 size={17} strokeWidth={2} />
          <span>
            Never share your passcode. No member of BudgetSave staff will ever ask
            for it.
          </span>
        </div>

        <Button type="submit" block loading={busy} className="auth-submit">
          Set my passcode
        </Button>
      </form>
    </AuthFrame>
  );
}
