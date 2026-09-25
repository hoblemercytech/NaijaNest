import { Link } from 'react-router-dom';
import { COMPANY } from './company';

/**
 * Help / FAQ.
 *
 * Written against the questions a support inbox actually receives, and
 * answering the awkward ones plainly — the service charge, why a transfer is
 * still pending, why savings are locked. An FAQ that dodges those just moves
 * the conversation to email, angrier.
 */
const GROUPS = [
  {
    title: 'Getting started',
    items: [
      {
        q: 'How do I open an account?',
        a: ['You do not open one yourself. Contact us or speak to a BudgetSave collector, and they create the account for you. You receive a claim link by email — tap it, set a passcode, and you are in.'],
      },
      {
        q: 'Why can I not sign up myself?',
        a: ['Because every customer needs a collector assigned to them before they can contribute, and a real person has to make that match. It also means somebody has met you, which matters for a cash service.'],
      },
      {
        q: 'How do I log in?',
        a: ['With your phone number and the passcode you set when you claimed your account. If you forget it, tap "Forgot passcode" and we email you a reset link.'],
      },
      {
        q: 'I never received my claim link.',
        a: ['Check your spam folder first. If it is not there, contact your collector or email us and we will resend it. The link expires after a period for security, so ask for a fresh one if yours has lapsed.'],
      },
    ],
  },
  {
    title: 'Contributing',
    items: [
      {
        q: 'How do I contribute?',
        a: [
          'Two ways. Hand cash to your collector and they record it immediately. Or transfer to the account shown in your dashboard, then tap "I have paid".',
        ],
      },
      {
        q: 'Why is my contribution still pending?',
        a: [
          'Tapping "I have paid" tells us to look for your money. The contribution is credited once the payment provider confirms it arrived — usually within minutes.',
          'If it is still pending after 30 minutes, send us the date, amount and your bank\'s transaction reference and we will check.',
        ],
      },
      {
        q: 'Can I pay for several days at once?',
        a: ['Yes. Pay ₦5,000 on a ₦1,000 daily plan and five days are credited, starting from the earliest unpaid one. Paying ahead does not shorten your term or unlock your savings early.'],
      },
      {
        q: 'What if I miss a day?',
        a: ['Nothing happens. The day is marked unpaid and you simply save less. It is not a debt, there is no penalty, and nobody may charge you for it.'],
      },
      {
        q: 'Can I change my plan after it starts?',
        a: ['No. Terms are fixed when your collector activates the plan. You can start a different plan once this one completes and is paid out.'],
      },
    ],
  },
  {
    title: 'The service charge',
    items: [
      {
        q: 'Why was my first contribution not added to my balance?',
        a: [
          'Your first contribution on each plan is retained as a one-time service charge. It covers collection, record-keeping, verification and paying you out.',
          'It is charged once per plan, never repeatedly, and your dashboard shows it from the start.',
        ],
      },
      {
        q: 'How much is it?',
        a: ['One contribution at your chosen amount. On a ₦1,000 daily plan it is ₦1,000. On a ₦5,000 monthly plan it is ₦5,000.'],
      },
      {
        q: 'Are there any other fees?',
        a: ['No. No monthly fee, no withdrawal fee, no penalty for missing a contribution, no charge to close your account. Your own bank may charge you for making a transfer — that is between you and them.'],
      },
    ],
  },
  {
    title: 'Withdrawing',
    items: [
      {
        q: 'When can I withdraw?',
        a: ['When your plan term completes. Your dashboard shows the date. Savings are locked until then — that is what a fixed-term plan means.'],
      },
      {
        q: 'Why can I not take my money out early?',
        a: ['Because you agreed a term, and the lock is the point. Money you cannot reach easily is money you are more likely to still have at the end. If you want flexible access, choose a shorter term next time.'],
      },
      {
        q: 'How long does a withdrawal take?',
        a: ['We aim to pay approved withdrawals within 1–3 working days. An administrator reviews the request, then sends the transfer to your bank.'],
      },
      {
        q: 'Can I withdraw part of my savings?',
        a: ['No. You withdraw the full balance of the plan, which then closes. You can start a new plan straight away.'],
      },
      {
        q: 'Why do I need to verify my identity?',
        a: ['So that somebody else cannot collect your savings. You can contribute while verification is pending, but not withdraw. Your collector never sees any of the details you submit.'],
      },
      {
        q: 'My withdrawal was rejected.',
        a: ['Your balance is untouched. The usual reason is that the bank account name does not match your verified name. Correct the details and request again — the rejection message tells you what was wrong.'],
      },
    ],
  },
  {
    title: 'When something goes wrong',
    items: [
      {
        q: 'My collector did not record a payment I made.',
        a: ['Contact us with the date and amount. Every contribution carries a timestamp and the name of whoever recorded it, and those records cannot be altered, so we can check what happened.'],
      },
      {
        q: 'I paid to the wrong account.',
        a: ['Contact us immediately with the transaction reference. We will help you trace it, but money sent outside our accounts has to be recovered through your bank and we cannot guarantee the outcome.'],
      },
      {
        q: 'Someone asked me to pay into a personal account.',
        a: [
          'Do not pay. Report it to us at once.',
          'Pay only into the account shown in your own dashboard. No member of staff is permitted to ask for a personal transfer.',
        ],
      },
      {
        q: 'A payment was reversed after it was credited.',
        a: ['If your bank reverses a transfer, we reverse the contribution and notify you. The reversal is recorded openly rather than quietly removed.'],
      },
    ],
  },
  {
    title: 'Your account and data',
    items: [
      {
        q: 'Who can see my information?',
        a: [
          'Your collector sees your name, member ID, phone number, plan and contributions — what they need to collect from you.',
          'They cannot see your ID number, date of birth, address or bank details. Only BudgetSave administrators can, and only to verify you.',
        ],
      },
      {
        q: 'How do I delete my account?',
        a: ['From Profile in the app, or from our account deletion page. If you have savings, we pay them out first — we will not close an account while money is owed to you.'],
      },
      {
        q: 'Do you pay interest?',
        a: ['No. BudgetSave is a savings record and collection service, not an investment. You receive exactly what you contributed, less the one-time service charge.'],
      },
    ],
  },
];

export default function Faq() {
  return (
    <>
      <div className="pub-hero">
        <div className="pub-container">
          <h1>Help</h1>
          <p>Answers to the questions we are asked most.</p>
        </div>
      </div>

      <section className="pub-section">
        <div className="pub-container" style={{ maxWidth: 780 }}>
          {GROUPS.map((group) => (
            <div key={group.title} style={{ marginBottom: 40 }}>
              <h2 style={{ fontSize: '1.2rem', marginBottom: 14 }}>{group.title}</h2>
              <div className="pub-faq">
                {group.items.map((item) => (
                  <details key={item.q}>
                    <summary>{item.q}</summary>
                    <div className="pub-faq-body">
                      {item.a.map((para, i) => <p key={i}>{para}</p>)}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}

          <div className="pub-callout is-info">
            <p>
              Still stuck? Email{' '}
              <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> or call {COMPANY.phone}.
              See also our <Link to="/financial-terms">Financial &amp; Payment Terms</Link>.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}