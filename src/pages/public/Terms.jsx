import { COMPANY } from './company';

/**
 * Terms & Conditions.
 *
 * Every rule here is enforced somewhere in the database — the one-time service
 * charge, the locked term, verification before withdrawal, one open plan at a
 * time. Where the two ever disagree, the code is what actually happens to
 * someone's money, so this document is the one that must be corrected.
 */
export default function Terms() {
  return (
    <>
      <div className="pub-hero">
        <div className="pub-container">
          <h1>Terms &amp; Conditions</h1>
          <p>
            The agreement between you and {COMPANY.legalName} when you use{' '}
            {COMPANY.shortName}.
          </p>
          <span className="pub-updated">Last updated {COMPANY.lastUpdated}</span>
        </div>
      </div>

      <article className="pub-doc">
        <div className="pub-toc">
          <h2>Contents</h2>
          <ol>
            <li><a href="#agreement">Agreement</a></li>
            <li><a href="#what">What BudgetSave is, and is not</a></li>
            <li><a href="#accounts">Your account</a></li>
            <li><a href="#verification">Identity verification</a></li>
            <li><a href="#plans">Contribution plans</a></li>
            <li><a href="#charge">The one-time service charge</a></li>
            <li><a href="#payments">Making contributions</a></li>
            <li><a href="#missed">Missed contributions</a></li>
            <li><a href="#withdrawals">Withdrawals</a></li>
            <li><a href="#collectors">Collectors</a></li>
            <li><a href="#failed">Failed and reversed transactions</a></li>
            <li><a href="#suspension">Suspension and closure</a></li>
            <li><a href="#disputes">Disputes</a></li>
            <li><a href="#liability">Limitation of liability</a></li>
            <li><a href="#changes">Changes to these terms</a></li>
            <li><a href="#law">Governing law</a></li>
          </ol>
        </div>

        <h2 id="agreement">1. Agreement</h2>
        <p>
          These terms form a binding agreement between you and {COMPANY.legalName} (RC{' '}
          {COMPANY.rcNumber}). By using {COMPANY.shortName} you accept them. If you do not
          accept them, do not use the service.
        </p>
        <p>
          Please also read our <a href="/privacy">Privacy Policy</a> and our{' '}
          <a href="/financial-terms">Financial &amp; Payment Terms</a>, which form part of
          this agreement.
        </p>

        <h2 id="what">2. What BudgetSave is, and is not</h2>
        <p>
          {COMPANY.shortName} is a contribution savings service. You agree a plan, pay into
          it regularly, and receive your savings when the plan ends. We keep the record of
          every payment so you can check it at any time.
        </p>

        <div className="pub-callout is-warning">
          <p>
            <strong>{COMPANY.shortName} is not a bank.</strong> We are not a licensed
            deposit-taking institution. Your contributions are not bank deposits and are not
            insured by the Nigeria Deposit Insurance Corporation.
          </p>
          <p>
            <strong>We do not pay interest.</strong> You receive back exactly what you
            contributed, less the one-time service charge described in section 6. No more,
            no less.
          </p>
        </div>

        <h2 id="accounts">3. Your account</h2>
        <ul>
          <li>You must be at least 18 years old.</li>
          <li>Accounts are created for you by a {COMPANY.shortName} administrator or by a collector. You cannot open one yourself.</li>
          <li>You will receive a claim link by email. Use it to set your passcode and activate your account.</li>
          <li>One person may hold one account. Using another person's identity to open a second account is grounds for closure.</li>
          <li>Keep your passcode private. You are responsible for activity on your account.</li>
          <li>Tell us immediately if you believe someone else has access to your account.</li>
          <li>The information you give us must be true and current.</li>
        </ul>

        <h2 id="verification">4. Identity verification</h2>
        <p>
          Before you can withdraw, you must verify your identity by providing your full
          name, date of birth, residential address, a government-issued ID number and a
          photograph of that ID.
        </p>
        <p>
          You can contribute while verification is pending. You cannot withdraw until it is
          approved. This protects you: it is what stops somebody else collecting your
          savings.
        </p>
        <p>
          We may decline verification where details do not match the document, the
          photograph is unreadable, or the same ID is already in use on another account.
          We will tell you why, and you may correct and resubmit.
        </p>

        <h2 id="plans">5. Contribution plans</h2>
        <ul>
          <li>You choose an amount, a frequency (daily, weekly or monthly) and a term.</li>
          <li>A collector activates the plan. Your terms are fixed at that moment and cannot be changed afterwards.</li>
          <li>You may hold one open plan at a time. A new plan can be started once the previous one is settled.</li>
          <li>You may pay more than one contribution in advance.</li>
        </ul>

        <div className="pub-callout">
          <p>
            <strong>Your savings are locked for the full term.</strong> You cannot withdraw
            before the plan completes. This is the point of a fixed term — it is what makes
            the plan a commitment rather than a wallet.
          </p>
        </div>

        <h2 id="charge">6. The one-time service charge</h2>
        <p>
          <strong>
            Your first contribution on each plan is retained by {COMPANY.legalName} as a
            one-time service charge. It is not added to your savings balance and is not
            returned to you.
          </strong>
        </p>
        <p>
          It covers the cost of operating your plan: collection, record-keeping,
          verification and payout. It is charged once per plan, never repeatedly.
        </p>
        <p>
          The charge equals one contribution at your chosen amount. On a ₦1,000 daily plan
          the charge is ₦1,000; on a ₦5,000 monthly plan it is ₦5,000.
        </p>

        <div className="pub-callout is-warning">
          <p>
            <strong>Example.</strong> You choose ₦1,000 a day for 30 days and pay every day.
            You pay ₦30,000 in total. Your first ₦1,000 is the service charge, so your
            balance at the end is <strong>₦29,000</strong>, and that is what you withdraw.
          </p>
          <p>
            Your dashboard shows this from the start. The first contribution is marked as
            the service charge, and your balance only counts what comes after it.
          </p>
        </div>

        <h2 id="payments">7. Making contributions</h2>
        <p>You can contribute in two ways:</p>
        <ul>
          <li>
            <strong>Cash to your collector.</strong> They record it against your account
            immediately, and you receive a notification. Check it.
          </li>
          <li>
            <strong>Bank transfer</strong> to the account shown in your dashboard, which is
            assigned to your collector. Tap <em>I have paid</em> after transferring.
          </li>
        </ul>

        <div className="pub-callout is-warning">
          <p>
            <strong>Tapping "I have paid" does not credit your account.</strong> It tells us
            to look for your payment. The contribution is credited only once{' '}
            {COMPANY.processor} confirms the money arrived, or a collector or administrator
            confirms it. This protects every customer from false claims.
          </p>
        </div>

        <p>
          Pay only into the account shown in your own dashboard. We will never ask you to
          send money to a personal account, and no member of staff is permitted to request
          one. Report any such request to <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>.
        </p>

        <h2 id="missed">8. Missed contributions</h2>
        <p>
          <strong>A missed contribution is not a debt.</strong> If you do not pay on a given
          day, that day is recorded as unpaid. Nothing is owed, no penalty applies, and
          nobody may charge you for it.
        </p>
        <p>
          You simply save less. If you pay 27 days of a 30-day plan, you receive 27
          contributions back, less the service charge.
        </p>

        <h2 id="withdrawals">9. Withdrawals</h2>
        <ul>
          <li>You may request a withdrawal once your plan term has completed.</li>
          <li>Your identity must be verified.</li>
          <li>You withdraw the full balance of the plan. Partial withdrawals are not available.</li>
          <li>You provide a bank account in your own name. The account name must match your verified name.</li>
          <li>A {COMPANY.shortName} administrator reviews and approves the request, then sends the transfer.</li>
          <li>Paying out closes the plan. You may then start a new one.</li>
        </ul>
        <p>
          We aim to pay approved withdrawals within 1–3 working days. Bank processing times
          are outside our control.
        </p>
        <p>
          A request may be declined where the account name does not match your verified
          name, the details are incomplete, or we need to investigate the activity. We tell
          you why, and your balance is unaffected — you may correct the details and request
          again.
        </p>

        <h2 id="collectors">10. Collectors</h2>
        <p>
          Collectors are staff of {COMPANY.legalName}. They collect cash, record
          contributions, and activate plans. Each customer is assigned to one collector.
        </p>
        <p>Collectors may not:</p>
        <ul>
          <li>Ask you to pay into a personal account.</li>
          <li>Hold your savings. All money belongs to {COMPANY.legalName} until paid out.</li>
          <li>Approve or pay a withdrawal. Only administrators do that.</li>
          <li>See your ID details, address or bank details.</li>
        </ul>
        <p>
          We are responsible for our collectors acting in that role. If a collector fails to
          record a payment you made, contact us with the details and we will investigate
          using the payment record.
        </p>

        <h2 id="failed">11. Failed and reversed transactions</h2>
        <ul>
          <li>A transfer that fails is not recorded, and no contribution is credited.</li>
          <li>If a payment is reversed after being credited, we reverse the contribution and tell you.</li>
          <li>If you pay the wrong amount, we credit what was actually received.</li>
          <li>If you pay to the wrong account, contact us immediately. We will help, but we cannot guarantee recovery of money sent outside our accounts.</li>
          <li>If a withdrawal transfer fails, we retry or contact you for corrected details. Your balance is restored until it succeeds.</li>
        </ul>

        <h2 id="suspension">12. Suspension and closure</h2>
        <p>We may suspend or close an account where:</p>
        <ul>
          <li>Information given to us is false.</li>
          <li>The account is used for fraud or any unlawful purpose.</li>
          <li>The same identity is used across multiple accounts.</li>
          <li>We are required to by law or a regulator.</li>
        </ul>
        <p>
          <strong>Suspension does not take your money.</strong> Any balance owed to you is
          paid to your verified bank account, unless a law or court order prevents it.
        </p>
        <p>
          You may close your account at any time. See our{' '}
          <a href="/delete-account">account deletion page</a>.
        </p>

        <h2 id="disputes">13. Disputes</h2>
        <p>
          Contact us first at <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>. We
          acknowledge within 2 working days and aim to resolve within 14.
        </p>
        <p>
          Every contribution, correction and payout is recorded with a timestamp and the
          person who made it, and those records cannot be altered afterwards. That is the
          evidence we use to settle disagreements, and you may request a copy of your own.
        </p>
        <p>
          If we cannot resolve it, the dispute may be referred to arbitration in Nigeria
          under the Arbitration and Mediation Act 2023, or to a Nigerian court.
        </p>

        <h2 id="liability">14. Limitation of liability</h2>
        <p>
          We are liable to you for contributions properly recorded against your account and
          not yet paid out. That is the core of our obligation and we do not limit it.
        </p>
        <p>We are not liable for:</p>
        <ul>
          <li>Money sent to an account other than the one shown in your dashboard.</li>
          <li>Delays caused by banks, {COMPANY.processor} or network failures.</li>
          <li>Loss arising because you shared your passcode.</li>
          <li>Indirect or consequential loss, including lost profit or opportunity.</li>
        </ul>
        <p>
          Nothing here excludes liability for fraud or for anything that cannot lawfully be
          excluded.
        </p>

        <h2 id="changes">15. Changes to these terms</h2>
        <p>
          We may change these terms. Material changes are notified in the app and by email
          at least 14 days before they take effect. Plans already running keep the terms
          they started under.
        </p>

        <h2 id="law">16. Governing law</h2>
        <p>
          These terms are governed by the laws of the Federal Republic of Nigeria, and the
          Nigerian courts have jurisdiction.
        </p>

        <h2>Contact</h2>
        <p>
          {COMPANY.legalName}<br />
          {COMPANY.address}<br />
          Email: <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a><br />
          Phone: {COMPANY.phone}
        </p>
      </article>
    </>
  );
}