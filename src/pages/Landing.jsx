import { Link } from 'react-router-dom';
import Logo from '../components/ui/Logo';
import './landing.css';

/**
 * The hero leads with the thing customers actually care about and the thing
 * every ajo book gets wrong: a running record they can check themselves.
 * So the hero *is* a contribution ledger, not a stock illustration.
 */
const SAMPLE_DAYS = [
  { day: 12, state: 'paid' }, { day: 13, state: 'paid' }, { day: 14, state: 'paid' },
  { day: 15, state: 'unpaid' }, { day: 16, state: 'paid' }, { day: 17, state: 'paid' },
  { day: 18, state: 'today' }, { day: 19, state: 'future' }, { day: 20, state: 'future' },
];

const STEPS = [
  { title: 'Pick your daily amount', body: 'Choose from the plans NaijaNest offers — ₦500 a day up to ₦10,000 a day.' },
  { title: 'Choose how long', body: 'From 30 days up to a full year. Your terms are locked in when your collector activates the cycle.' },
  { title: 'Pay your collector in cash', body: 'They record each payment against the day it was made, on the spot.' },
  { title: 'Check the record any time', body: 'Every day shows as paid or unpaid, with the time and who recorded it.' },
  { title: 'Withdraw what you saved', body: 'Ask for your balance whenever you want it. Your collector pays you in cash.' },
];

export default function Landing() {
  return (
    <div className="lp">
      <header className="lp-nav">
        <div className="container row-between">
          {/* The nav sits on the dark hero, so the wordmark has to invert. */}
          <Logo size={30} tone="light" />
          <nav className="row" style={{ gap: 8 }}>
            <Link to="/login" className="btn btn-ghost btn-sm">Sign in</Link>
            <Link to="/signup" className="btn btn-primary btn-sm">Create account</Link>
          </nav>
        </div>
      </header>

      <section className="lp-hero">
        <div className="container lp-hero-grid">
          <div>
            <h1>Your daily savings, written down properly.</h1>
            <p className="lp-lead">
              NaijaNest keeps the record of the cash you contribute to your collector —
              every naira, every day, with the time it was paid. No more arguing over a
              notebook.
            </p>
            <div className="row wrap" style={{ gap: 10, marginTop: 26 }}>
              <Link to="/signup" className="btn btn-money">Create account</Link>
              <Link to="/login" className="btn btn-outline">Sign in</Link>
            </div>
            <p className="lp-note">
              NaijaNest does not collect money online. Contributions and withdrawals are
              cash, handled by your assigned collector. The app is the record of them.
            </p>
          </div>

          <figure className="lp-ledger" aria-label="Example contribution record">
            <div className="lp-ledger-top">
              <div>
                <div className="xs" style={{ color: 'rgba(255,255,255,.7)' }}>Balance so far</div>
                <div className="lp-ledger-amount num">₦17,000</div>
              </div>
              <span className="badge badge-gold">Day 18 of 30</span>
            </div>
            <div className="lp-days">
              {SAMPLE_DAYS.map((d) => (
                <span key={d.day} className={`lp-day is-${d.state}`}>{d.day}</span>
              ))}
            </div>
            <figcaption className="lp-ledger-foot">
              ₦1,000 a day · one missed day · nothing owed
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="lp-steps">
        <div className="container">
          <h2>How it works</h2>
          {/* Genuinely a sequence, so the numbers carry meaning here. */}
          <ol className="lp-step-list">
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <span className="lp-step-num num">{i + 1}</span>
                <div>
                  <h3>{s.title}</h3>
                  <p className="muted small">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="lp-truth">
        <div className="container">
          <h2>Miss a day, owe nothing</h2>
          <p>
            If you don't pay on a given day, that day is simply marked unpaid. It never
            becomes a debt, and nobody can charge you for it. When you withdraw, you get
            exactly what you contributed — no more, no less.
          </p>
        </div>
      </section>

      <footer className="lp-foot">
        <div className="container row-between wrap" style={{ gap: 16 }}>
          <Logo size={26} />
          <p className="xs muted" style={{ margin: 0 }}>
            © {new Date().getFullYear()} NaijaNest. Cash contributions, recorded properly.
          </p>
        </div>
      </footer>
    </div>
  );
}
