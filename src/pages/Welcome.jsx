import { Link } from 'react-router-dom';
import { ShieldCheck, Landmark } from 'lucide-react';
import Logo from '../components/ui/Logo';
import './welcome.css';

/**
 * The first screen of the installed app.
 *
 * Banking apps open on a photograph and two buttons because that is all a
 * returning customer needs — the decision is "sign in" or "join", and anything
 * else is in the way. The regulator line matters too: someone trusting a
 * stranger with cash daily wants to see who stands behind it before they type
 * anything.
 *
 * The image is a background rather than an <img> so it can bleed edge to edge
 * behind the notch and the home indicator without layout maths.
 */
export default function Welcome() {
  return (
    <div className="wc">
      <div className="wc-image" aria-hidden="true" />

      <div className="wc-inner">
        <header className="wc-top">
          <span className="wc-badge">
            <ShieldCheck size={13} strokeWidth={2.2} />
            Your money, recorded
          </span>
        </header>

        <div className="wc-centre">
          <Logo size={54} showName={false} />
          <h1 className="wc-name">BudgetSave</h1>
          <p className="wc-tag">Daily contribution savings</p>
          <p className="wc-legal">
            <Landmark size={12} strokeWidth={2} />
            Cash contributions, recorded and auditable
          </p>
        </div>

        <div className="wc-actions">
          <Link to="/login" className="wc-btn wc-btn-primary">Login</Link>

          <div className="wc-links">
            <Link to="/signup">Open an Account</Link>
            <span className="wc-sep" aria-hidden="true" />
            <Link to="/">Learn more</Link>
          </div>

        </div>
      </div>
    </div>
  );
}
