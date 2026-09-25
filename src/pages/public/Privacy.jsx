import { COMPANY } from './company';

/**
 * Privacy Policy.
 *
 * Google Play and the App Store both require a reachable policy URL before an
 * app that collects personal data can be published, and BudgetSave collects
 * NIN, date of birth and home address — among the most sensitive categories
 * under Nigeria's NDPA.
 *
 * Written to describe what the system actually does. Every claim here matches
 * a rule enforced in the database: collectors genuinely cannot read KYC rows,
 * audit logs genuinely cannot be edited. Do not soften one without changing
 * the other.
 */
export default function Privacy() {
  return (
    <>
      <div className="pub-hero">
        <div className="pub-container">
          <h1>Privacy Policy</h1>
          <p>
            How {COMPANY.legalName} collects, uses, stores and protects your personal
            information.
          </p>
          <span className="pub-updated">Last updated {COMPANY.lastUpdated}</span>
        </div>
      </div>

      <article className="pub-doc">
        <div className="pub-toc">
          <h2>Contents</h2>
          <ol>
            <li><a href="#who">Who we are</a></li>
            <li><a href="#collect">Information we collect</a></li>
            <li><a href="#use">How we use your information</a></li>
            <li><a href="#sharing">Who we share it with</a></li>
            <li><a href="#opay">Payment processing</a></li>
            <li><a href="#collectors">What your collector can and cannot see</a></li>
            <li><a href="#security">How we protect your information</a></li>
            <li><a href="#retention">How long we keep it</a></li>
            <li><a href="#rights">Your rights</a></li>
            <li><a href="#deletion">Deleting your account</a></li>
            <li><a href="#children">Children</a></li>
            <li><a href="#changes">Changes to this policy</a></li>
            <li><a href="#contact">Contact us</a></li>
          </ol>
        </div>

        <h2 id="who">1. Who we are</h2>
        <p>
          {COMPANY.legalName} (RC {COMPANY.rcNumber}), trading as {COMPANY.shortName}, is a
          company registered in Nigeria with its office at {COMPANY.address}. In this
          policy, "we", "us" and "our" mean {COMPANY.legalName}.
        </p>
        <p>
          We are the data controller for the information described below. This policy is
          written to meet the Nigeria Data Protection Act 2023 (NDPA).
        </p>

        <h2 id="collect">2. Information we collect</h2>

        <h3>Information you or your collector give us</h3>
        <ul>
          <li><strong>Account details</strong> — your full name, phone number and email address.</li>
          <li><strong>A profile photo</strong>, if you choose to add one.</li>
          <li>
            <strong>Identity verification details</strong> — your date of birth, residential
            address, the type and number of a government-issued ID (NIN, driver's licence,
            voter's card or international passport), and a photograph of that document.
          </li>
          <li>
            <strong>Bank account details</strong> — bank name, account number and account
            name, which you provide when you request a withdrawal.
          </li>
        </ul>

        <h3>Information created as you use the service</h3>
        <ul>
          <li>Your contribution plan, its amount, frequency and length.</li>
          <li>Every contribution recorded against your account, with the date and time.</li>
          <li>Withdrawal requests, their status, and when they were paid.</li>
          <li>Which collector is assigned to you.</li>
          <li>
            An audit record of actions taken on your account, including who took them.
          </li>
        </ul>

        <h3>Information collected automatically</h3>
        <ul>
          <li>Sign-in times and session information needed to keep you logged in.</li>
          <li>Basic device and browser information, used to keep the service working.</li>
        </ul>

        <div className="pub-callout is-info">
          <p>
            <strong>We never see your bank password, card PIN or OPay PIN.</strong> Payments
            are handled by {COMPANY.processor} on their own systems. We are not told your
            banking credentials and will never ask for them.
          </p>
        </div>

        <h2 id="use">3. How we use your information</h2>
        <p>We use your information only for the following purposes:</p>
        <ul>
          <li><strong>To run your account</strong> — recording contributions, showing your balance and processing withdrawals.</li>
          <li><strong>To verify who you are</strong> — confirming your identity before we release savings, which protects you from someone else collecting your money.</li>
          <li><strong>To pay you</strong> — sending your savings to the bank account you give us.</li>
          <li><strong>To contact you</strong> — sending account notices such as a recorded contribution, an approved withdrawal or a completed plan.</li>
          <li><strong>To meet legal obligations</strong> — keeping financial records and responding to lawful requests.</li>
          <li><strong>To prevent fraud</strong> — checking that the same ID is not used to open more than one account.</li>
        </ul>
        <p>
          We do not sell your information. We do not use it for advertising, and we do not
          share it with advertisers.
        </p>

        <h2 id="sharing">4. Who we share it with</h2>
        <p>We share your information only where it is necessary:</p>
        <ul>
          <li><strong>{COMPANY.processorLegal}</strong> — to process payments and verify that money was received.</li>
          <li><strong>Our email provider</strong> — to deliver account notifications to your email address.</li>
          <li><strong>Our hosting and database provider</strong> — to store your records securely.</li>
          <li><strong>Regulators, law enforcement or courts</strong> — where we are legally required to.</li>
        </ul>
        <p>
          Each of these acts on our instructions and may use your information only for the
          purpose we engaged them for.
        </p>

        <h2 id="opay">5. Payment processing</h2>
        <p>
          Contributions made electronically and all withdrawals are processed by{' '}
          {COMPANY.processorLegal}, a payment service provider licensed by the Central Bank
          of Nigeria.
        </p>
        <p>
          When you pay into a collector's assigned account, {COMPANY.processor} processes
          that transfer and tells us the amount, the date and the transaction reference. We
          record those against your account. When you withdraw, we pass your bank name,
          account number, account name and the amount to {COMPANY.processor} so the transfer
          can be made.
        </p>
        <p>
          {COMPANY.processor} handles that information under its own privacy policy, which
          you should read at{' '}
          <a href="https://www.opayweb.com" target="_blank" rel="noreferrer">opayweb.com</a>.
        </p>

        <h2 id="collectors">6. What your collector can and cannot see</h2>
        <p>
          Your collector handles your cash and needs to know who you are and what you have
          paid. They do not need to know anything else, and the system does not let them
          see it.
        </p>

        <h3>Your collector can see</h3>
        <ul>
          <li>Your name, member ID, phone number and profile photo.</li>
          <li>Your contribution plan and every payment recorded against it.</li>
          <li>Your balance and the status of any withdrawal request.</li>
        </ul>

        <h3>Your collector cannot see</h3>
        <ul>
          <li>Your ID number or the photograph of your ID document.</li>
          <li>Your date of birth or residential address.</li>
          <li>Your bank account details.</li>
          <li>Any information about a customer who is not assigned to them.</li>
        </ul>

        <div className="pub-callout is-info">
          <p>
            This is enforced by the database itself, not only by what the app chooses to
            display. A collector has no route to that information at all.
          </p>
        </div>

        <h2 id="security">7. How we protect your information</h2>
        <ul>
          <li>All traffic between your device and our servers is encrypted in transit.</li>
          <li>Your ID document is stored in private storage that only you and our administrators can open, through short-lived links that expire.</li>
          <li>Access is restricted by role at the database level, so staff can only reach the records their job requires.</li>
          <li>Every financial action is written to an audit record that cannot be edited or deleted by anyone, including our own administrators.</li>
          <li>Your password is never stored by us in a readable form.</li>
        </ul>
        <p>
          No system is completely secure. If a breach affects your personal information, we
          will notify you and the Nigeria Data Protection Commission as the NDPA requires.
        </p>

        <h2 id="retention">8. How long we keep it</h2>
        <ul>
          <li>
            <strong>Financial records</strong> — contributions, withdrawals and audit
            entries — are kept for {COMPANY.retentionYears} years after your account closes,
            as Nigerian financial record-keeping law requires.
          </li>
          <li>
            <strong>Identity verification records</strong> are kept for{' '}
            {COMPANY.retentionYears} years after your account closes, for the same reason.
          </li>
          <li>
            <strong>Your profile and contact details</strong> are deleted or anonymised when
            you close your account, unless a financial record depends on them.
          </li>
          <li><strong>Your ID document photograph</strong> is deleted when your account closes.</li>
        </ul>

        <div className="pub-callout">
          <p>
            <strong>Why we cannot delete everything immediately.</strong> If your
            contribution history disappeared, so would the record of money you paid and we
            paid back. That protects both of us if a dispute arises later. What we can do is
            remove your personal details and keep the financial record without them.
          </p>
        </div>

        <h2 id="rights">9. Your rights</h2>
        <p>Under the NDPA you have the right to:</p>
        <ul>
          <li>Ask what personal information we hold about you and receive a copy.</li>
          <li>Ask us to correct information that is wrong.</li>
          <li>Ask us to delete your information, subject to section 8 above.</li>
          <li>Object to how we use your information, or ask us to restrict it.</li>
          <li>Withdraw consent where we relied on it.</li>
          <li>Complain to the Nigeria Data Protection Commission.</li>
        </ul>
        <p>
          Write to <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>. We respond within
          30 days. We may ask you to confirm your identity first, so that someone else
          cannot obtain your information by pretending to be you.
        </p>

        <h2 id="deletion">10. Deleting your account</h2>
        <p>
          You can request deletion from inside the app under Profile, or on our{' '}
          <a href="/delete-account">account deletion page</a>. That page explains what is
          removed, what is kept, and how long it takes.
        </p>
        <p>
          If you have savings with us, we pay them out before the account is closed. We will
          not delete an account while money is owed to you.
        </p>

        <h2 id="children">11. Children</h2>
        <p>
          {COMPANY.shortName} is for adults. You must be at least 18 to hold an account, and
          we check date of birth during verification. We do not knowingly collect
          information from anyone under 18. If you believe a child has given us information,
          contact us and we will delete it.
        </p>

        <h2 id="changes">12. Changes to this policy</h2>
        <p>
          We may update this policy. The date at the top always shows the current version.
          If a change materially affects your rights, we will notify you in the app and by
          email before it takes effect.
        </p>

        <h2 id="contact">13. Contact us</h2>
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