import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Banknote,
  CalendarCheck2,
  Check,
  CheckCircle2,
  Clock3,
  Eye,
  FileCheck2,
  HandCoins,
  LockKeyhole,
  ReceiptText,
  ShieldCheck,
  Smartphone,
  UserRoundCheck,
  WalletCards,
} from 'lucide-react';

import Logo from '../components/ui/Logo';
import './landing.css';

const SAMPLE_DAYS = [
  { day: 12, state: 'paid' },
  { day: 13, state: 'paid' },
  { day: 14, state: 'paid' },
  { day: 15, state: 'unpaid' },
  { day: 16, state: 'paid' },
  { day: 17, state: 'paid' },
  { day: 18, state: 'today' },
  { day: 19, state: 'future' },
  { day: 20, state: 'future' },
];

const FEATURES = [
  {
    icon: ReceiptText,
    title: 'A record you can see',
    body: 'Every contribution is recorded against the day it was made, so you always know what has been paid.',
  },
  {
    icon: Clock3,
    title: 'Know when it happened',
    body: 'Payments carry a clear time record instead of relying on memory or a handwritten notebook.',
  },
  {
    icon: UserRoundCheck,
    title: 'Know who recorded it',
    body: 'Your contribution history stays connected to your assigned collector and your member account.',
  },
  {
    icon: ShieldCheck,
    title: 'Built around transparency',
    body: 'No hidden contribution debt. No mysterious balance changes. Your record reflects what actually happened.',
  },
  {
    icon: Smartphone,
    title: 'Check from your phone',
    body: 'Your contribution history is available from your NaijaNest account whenever you need to check it.',
  },
  {
    icon: WalletCards,
    title: 'Cash stays cash',
    body: 'Contributions and withdrawals are handled in cash by your assigned collector. NaijaNest keeps the record.',
  },
];

const STEPS = [
  {
    icon: CalendarCheck2,
    number: '01',
    title: 'Choose your plan',
    body: 'Pick a daily amount and contribution period that works for you.',
  },
  {
    icon: UserRoundCheck,
    number: '02',
    title: 'Get your collector',
    body: 'Your collector activates your contribution cycle and becomes responsible for recording your payments.',
  },
  {
    icon: HandCoins,
    number: '03',
    title: 'Pay in cash',
    body: 'Give your contribution to your collector. The payment is recorded against that day.',
  },
  {
    icon: Eye,
    number: '04',
    title: 'Check your record',
    body: 'Open your account and see which days are paid, unpaid or still ahead.',
  },
  {
    icon: Banknote,
    number: '05',
    title: 'Withdraw your balance',
    body: 'When you want your savings, request your balance and your collector pays you in cash.',
  },
];

export default function Landing() {
  return (
    <div className="lp">

      {/* =========================================================
          NAVIGATION
      ========================================================= */}

      <header className="lp-nav">
        <div className="container row-between">

          <Link to="/" className="lp-brand" aria-label="NaijaNest home">
            <Logo size={30} tone="light" />
          </Link>

          <nav className="lp-nav-actions" aria-label="Account navigation">
            <Link to="/login" className="btn btn-ghost btn-sm">
              Sign in
            </Link>

            <Link to="/signup" className="btn btn-primary btn-sm">
              Create account
            </Link>
          </nav>

        </div>
      </header>


      {/* =========================================================
          HERO
      ========================================================= */}

      <section className="lp-hero">

        <div className="lp-hero-image" aria-hidden="true" />

        <div className="container lp-hero-grid">

          <div className="lp-hero-copy">

            <div className="lp-kicker">
              <span className="lp-kicker-dot" />
              <span>Simple. Transparent. Recorded.</span>
            </div>

            <h1>
              Save daily.
              <span>See every naira.</span>
            </h1>

            <p className="lp-lead">
              NaijaNest gives you a clear digital record of the cash you
              contribute to your collector — every naira, every day, with
              the time it was paid.
            </p>

            <div className="lp-hero-actions">
              <Link to="/signup" className="btn btn-money">
                Create account
                <ArrowRight size={17} />
              </Link>

              <Link to="/login" className="btn btn-outline">
                Sign in
              </Link>
            </div>

            <div className="lp-hero-trust">

              <div className="lp-trust-item">
                <ShieldCheck size={16} />
                <span>Secure account</span>
              </div>

              <div className="lp-trust-divider" />

              <div className="lp-trust-item">
                <FileCheck2 size={16} />
                <span>Clear records</span>
              </div>

              <div className="lp-trust-divider" />

              <div className="lp-trust-item">
                <Banknote size={16} />
                <span>Cash contributions</span>
              </div>

            </div>

          </div>


          {/* Floating ledger */}

          <div className="lp-hero-visual">

            <div className="lp-floating-label">
              <CheckCircle2 size={15} />
              Contribution recorded
            </div>

            <figure
              className="lp-ledger"
              aria-label="Example NaijaNest contribution record"
            >

              <div className="lp-ledger-header">

                <div>
                  <div className="lp-overline">
                    Current balance
                  </div>

                  <div className="lp-ledger-amount num">
                    ₦17,000
                  </div>
                </div>

                <div className="lp-ledger-status">
                  <span />
                  Active
                </div>

              </div>


              <div className="lp-ledger-meta">

                <div>
                  <span>Daily</span>
                  <strong>₦1,000</strong>
                </div>

                <div>
                  <span>Progress</span>
                  <strong>18 / 30 days</strong>
                </div>

              </div>


              <div className="lp-days">
                {SAMPLE_DAYS.map((d) => (
                  <span
                    key={d.day}
                    className={`lp-day is-${d.state}`}
                  >
                    {d.day}
                  </span>
                ))}
              </div>


              <div className="lp-ledger-legend">

                <span>
                  <i className="is-paid" />
                  Paid
                </span>

                <span>
                  <i className="is-unpaid" />
                  Unpaid
                </span>

                <span>
                  <i className="is-today" />
                  Today
                </span>

              </div>


              <figcaption className="lp-ledger-foot">

                <div>
                  <Clock3 size={14} />
                  Last recorded today
                </div>

                <strong>
                  ₦1,000 received
                </strong>

              </figcaption>

            </figure>


            <div className="lp-floating-record">

              <div className="lp-floating-record-icon">
                <ReceiptText size={17} />
              </div>

              <div>
                <strong>Day 18 recorded</strong>
                <span>Contribution confirmed</span>
              </div>

              <CheckCircle2 size={18} />

            </div>

          </div>

        </div>


        <div className="lp-scroll-hint">
          <span>Explore NaijaNest</span>
          <ArrowRight size={14} />
        </div>

      </section>


      {/* =========================================================
          TRUST STRIP
      ========================================================= */}

      <section className="lp-trust-strip">

        <div className="container lp-trust-grid">

          <div className="lp-trust-stat">
            <ShieldCheck size={20} />
            <div>
              <strong>Transparent</strong>
              <span>Your record stays visible</span>
            </div>
          </div>

          <div className="lp-trust-stat">
            <ReceiptText size={20} />
            <div>
              <strong>Recorded daily</strong>
              <span>Every contribution has a day</span>
            </div>
          </div>

          <div className="lp-trust-stat">
            <Banknote size={20} />
            <div>
              <strong>Cash based</strong>
              <span>No online payment collection</span>
            </div>
          </div>

          <div className="lp-trust-stat">
            <LockKeyhole size={20} />
            <div>
              <strong>Private account</strong>
              <span>Your account is protected</span>
            </div>
          </div>

        </div>

      </section>


      {/* =========================================================
          INTRO / WHY NAIJANEST
      ========================================================= */}

      <section className="lp-features">

        <div className="container">

          <div className="lp-section-heading">

            <div className="lp-section-eyebrow">
              WHY NAIJANEST
            </div>

            <h2>
              Your money deserves
              <span>a better record.</span>
            </h2>

            <p>
              Traditional daily savings can depend too much on notebooks,
              memory and conversations. NaijaNest gives everyone a clearer
              record of what actually happened.
            </p>

          </div>


          <div className="lp-feature-grid">

            {FEATURES.map((feature) => {
              const Icon = feature.icon;

              return (
                <article className="lp-feature-card" key={feature.title}>

                  <div className="lp-feature-icon">
                    <Icon size={20} strokeWidth={1.8} />
                  </div>

                  <h3>{feature.title}</h3>

                  <p>{feature.body}</p>

                </article>
              );
            })}

          </div>

        </div>

      </section>


      {/* =========================================================
          HOW IT WORKS
      ========================================================= */}

      <section className="lp-steps">

        <div className="container">

          <div className="lp-section-heading lp-section-heading-center">

            <div className="lp-section-eyebrow">
              HOW IT WORKS
            </div>

            <h2>
              From your first contribution
              <span>to your final withdrawal.</span>
            </h2>

            <p>
              Simple enough for everyday savings, structured enough to keep
              your contribution history clear.
            </p>

          </div>


          <ol className="lp-step-list">

            {STEPS.map((step) => {
              const Icon = step.icon;

              return (
                <li key={step.number} className="lp-step-card">

                  <div className="lp-step-top">

                    <span className="lp-step-number num">
                      {step.number}
                    </span>

                    <div className="lp-step-icon">
                      <Icon size={20} strokeWidth={1.8} />
                    </div>

                  </div>

                  <h3>{step.title}</h3>

                  <p>{step.body}</p>

                </li>
              );
            })}

          </ol>

        </div>

      </section>


      {/* =========================================================
          RECORD PREVIEW
      ========================================================= */}

      <section className="lp-record">

        <div className="container lp-record-grid">

          <div className="lp-record-copy">

            <div className="lp-section-eyebrow">
              YOUR CONTRIBUTION HISTORY
            </div>

            <h2>
              No more
              <span>“I paid that day.”</span>
            </h2>

            <p>
              Your contribution history gives you a simple view of the
              cycle. Paid days, missed days and future days are clearly
              separated.
            </p>

            <ul className="lp-check-list">

              <li>
                <CheckCircle2 size={17} />
                <span>See each contribution day</span>
              </li>

              <li>
                <CheckCircle2 size={17} />
                <span>Know what has actually been paid</span>
              </li>

              <li>
                <CheckCircle2 size={17} />
                <span>See your current balance</span>
              </li>

              <li>
                <CheckCircle2 size={17} />
                <span>Keep a record you can check yourself</span>
              </li>

            </ul>

            <Link to="/signup" className="lp-text-link">
              Start your account
              <ArrowRight size={16} />
            </Link>

          </div>


          <div className="lp-record-card">

            <div className="lp-record-card-top">

              <div>
                <span>Contribution cycle</span>
                <strong>₦1,000 daily</strong>
              </div>

              <span className="lp-active-badge">
                <span />
                Active
              </span>

            </div>


            <div className="lp-progress">

              <div className="lp-progress-label">
                <span>Cycle progress</span>
                <strong>60%</strong>
              </div>

              <div className="lp-progress-track">
                <span />
              </div>

              <div className="lp-progress-meta">
                <span>18 days recorded</span>
                <span>30 day plan</span>
              </div>

            </div>


            <div className="lp-record-row">

              <div className="lp-record-row-icon">
                <CheckCircle2 size={17} />
              </div>

              <div>
                <strong>Today's contribution</strong>
                <span>₦1,000 · Recorded today</span>
              </div>

              <b>PAID</b>

            </div>


            <div className="lp-record-row">

              <div className="lp-record-row-icon muted">
                <CalendarCheck2 size={17} />
              </div>

              <div>
                <strong>Tomorrow</strong>
                <span>Contribution not yet recorded</span>
              </div>

              <b className="future">UPCOMING</b>

            </div>


            <div className="lp-record-balance">

              <span>Total recorded</span>

              <strong className="num">
                ₦17,000
              </strong>

            </div>

          </div>

        </div>

      </section>


      {/* =========================================================
          TRANSPARENCY / MISSED DAY
      ========================================================= */}

      <section className="lp-truth">

        <div className="container lp-truth-inner">

          <div className="lp-truth-icon">
            <ShieldCheck size={27} strokeWidth={1.7} />
          </div>

          <div className="lp-truth-copy">

            <div className="lp-section-eyebrow">
              OUR APPROACH
            </div>

            <h2>
              Miss a day,
              <span>owe nothing.</span>
            </h2>

            <p>
              If you don't contribute on a given day, that day is simply
              marked unpaid. It does not automatically become a debt.
              Your balance reflects what you actually contributed.
            </p>

          </div>

        </div>

      </section>


      {/* =========================================================
          CASH EXPLANATION
      ========================================================= */}

      <section className="lp-cash">

        <div className="container lp-cash-grid">

          <div className="lp-cash-card">

            <div className="lp-cash-card-icon">
              <Banknote size={25} />
            </div>

            <span className="lp-section-eyebrow">
              IMPORTANT TO KNOW
            </span>

            <h2>
              NaijaNest records
              <span>your cash.</span>
            </h2>

            <p>
              NaijaNest is the record-keeping layer. Your assigned collector
              handles your physical cash contributions and withdrawals.
              The app does not receive your cash online.
            </p>

          </div>


          <div className="lp-cash-points">

            <div>
              <Check size={17} />
              <span>Contributions are made to your collector in cash.</span>
            </div>

            <div>
              <Check size={17} />
              <span>Your collector records the contribution in the app.</span>
            </div>

            <div>
              <Check size={17} />
              <span>Your account shows the resulting contribution history.</span>
            </div>

            <div>
              <Check size={17} />
              <span>Withdrawals are handled by your collector in cash.</span>
            </div>

          </div>

        </div>

      </section>


      {/* =========================================================
          FINAL CTA
      ========================================================= */}

      <section className="lp-final-cta">

        <div className="lp-final-glow" />

        <div className="container lp-final-inner">

          <div className="lp-final-icon">
            <WalletCards size={25} />
          </div>

          <div>

            <div className="lp-section-eyebrow">
              START WITH NAIJANEST
            </div>

            <h2>
              Ready to make your
              <span>daily savings clearer?</span>
            </h2>

            <p>
              Create your account and start keeping a proper record of
              your daily contributions.
            </p>

          </div>

          <div className="lp-final-actions">

            <Link to="/signup" className="btn btn-money">
              Create account
              <ArrowRight size={17} />
            </Link>

            <Link to="/login" className="lp-final-login">
              Already have an account?
              <span>Sign in</span>
            </Link>

          </div>

        </div>

      </section>


      {/* =========================================================
          FOOTER
      ========================================================= */}

      <footer className="lp-foot">

        <div className="container">

          <div className="lp-foot-main">

            <div className="lp-foot-brand">

              <Logo size={27} tone="light" />

              <p>
                Cash contributions,
                <br />
                recorded properly.
              </p>

            </div>


            <div className="lp-foot-links">

              <div>
                <span>Account</span>

                <Link to="/login">
                  Sign in
                </Link>

                <Link to="/signup">
                  Create account
                </Link>
              </div>


              <div>
                <span>NaijaNest</span>

                <a href="#how-it-works">
                  How it works
                </a>

                <a href="#why-naijanest">
                  Why NaijaNest
                </a>
              </div>

            </div>

          </div>


          <div className="lp-foot-bottom">

            <p>
              © {new Date().getFullYear()} NaijaNest.
              All rights reserved.
            </p>

            <div>
              <ShieldCheck size={13} />
              Secure account access
            </div>

          </div>

        </div>

      </footer>

    </div>
  );
}
