import { Link } from 'react-router-dom';
import { COMPANY } from './company';

const STEPS = [
  {
    title: 'Your account is created for you',
    body: 'You do not sign up yourself. A BudgetSave administrator or a collector creates your account and sends a claim link to your email. Tap it, set a passcode, and the account is yours.',
  },
  {
    title: 'You are assigned a collector',
    body: 'One collector handles your contributions. They see you and their other customers, and nobody else. If an administrator created your account, they assign the collector; if a collector created it, you are theirs.',
  },
  {
    title: 'Choose a plan',
    body: 'Pick how much, how often — daily, weekly or monthly — and for how long. Your collector activates it, and from that moment the terms are fixed.',
  },
  {
    title: 'Contribute',
    body: 'Hand cash to your collector, or transfer to the account shown in your dashboard. You can pay several contributions in advance if you want to get ahead.',
  },
  {
    title: 'Watch it build',
    body: 'Every payment appears in your dashboard with its date and time. Miss a day and it is simply marked unpaid — nothing is owed and nobody may charge you for it.',
  },
  {
    title: 'Verify your identity',
    body: 'Before you can withdraw, submit your date of birth, address and a government ID. This is what stops somebody else collecting your savings. Your collector never sees any of it.',
  },
  {
    title: 'Your plan completes',
    body: 'When the term ends, your savings unlock. Until then they stay locked — that is what makes a fixed plan work.',
  },
  {
    title: 'Request your money',
    body: 'Give us your bank name, account number and account name. The account must be in your own verified name.',
  },
  {
    title: 'We approve and pay',
    body: 'An administrator reviews the request and sends the transfer. Approved withdrawals are paid within 1–3 working days, and your plan closes so you can start a new one.',
  },
];

export default function HowItWorks() {
  return (
    <>
      <div className="pub-hero">
        <div className="pub-container">
          <h1>How {COMPANY.shortName} works</h1>
          <p>From the day your account is created to the day your savings reach your bank.</p>
        </div>
      </div>

      <section className="pub-section">
        <div className="pub-container" style={{ maxWidth: 780 }}>
          <div className="pub-steps">
            {STEPS.map((s, i) => (
              <div className="pub-step" key={s.title}>
                <span className="pub-step-num">{i + 1}</span>
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pub-section is-tinted">
        <div className="pub-container" style={{ maxWidth: 760 }}>
          <h2>Two things worth knowing up front</h2>

          <div className="pub-callout">
            <p>
              <strong>Your first contribution is our service charge.</strong> On each plan,
              the first payment is retained by {COMPANY.legalName} and is not added to your
              savings. On a ₦1,000 daily plan that is ₦1,000, charged once. Your dashboard
              shows it from day one, and your balance only counts what comes after.
            </p>
          </div>

          <div className="pub-callout is-warning">
            <p>
              <strong>Tapping "I have paid" does not credit your account.</strong> It tells
              us to look for your transfer. The contribution counts once {COMPANY.processor}{' '}
              confirms the money arrived — usually within minutes.
            </p>
          </div>

          <p style={{ marginTop: 24 }}>
            The full detail is in our{' '}
            <Link to="/financial-terms">Financial &amp; Payment Terms</Link>, and common
            questions are answered on our <Link to="/faq">Help page</Link>.
          </p>
        </div>
      </section>
    </>
  );
}