import { COMPANY } from './company';

/**
 * Financial & Payment Terms.
 *
 * Separate from the main Terms because this is the part people actually need
 * when something goes wrong with money — when a contribution counts, what the
 * charge is, how long a payout takes. Burying that in clause 7 of a long
 * document guarantees nobody finds it at the moment they need it.
 */
export default function FinancialTerms() {
  return (
    <>
      <div className="pub-hero">
        <div className="pub-container">
          <h1>Financial &amp; Payment Terms</h1>
          <p>
            Exactly how money moves through {COMPANY.shortName} — when a contribution
            counts, what we charge, and how withdrawals are paid.
          </p>
          <span className="pub-updated">Last updated {COMPANY.lastUpdated}</span>
        </div>
      </div>

      <article className="pub-doc">
        <h2 id="summary">The short version</h2>
        <ul>
          <li>You pay cash to your collector, or by bank transfer to the account in your dashboard.</li>
          <li>Your <strong>first contribution on each plan</strong> is our one-time service charge. Everything after it is your savings.</li>
          <li>A contribution counts once <strong>{COMPANY.processor} confirms the money arrived</strong>, or a collector confirms cash in hand.</li>
          <li>Savings are <strong>locked until your plan term ends</strong>.</li>
          <li>You withdraw the full balance to a bank account in your own name, after identity verification.</li>
          <li>We pay approved withdrawals within <strong>1–3 working days</strong>.</li>
          <li>We pay <strong>no interest</strong>. You receive what you contributed, less the service charge.</li>
        </ul>

        <h2 id="processor">1. Who processes the money</h2>
        <p>
          Electronic payments into {COMPANY.shortName} and all withdrawals out of it are
          processed by <strong>{COMPANY.processorLegal}</strong>, a payment service provider
          licensed by the Central Bank of Nigeria.
        </p>
        <p>
          {COMPANY.legalName} is not a bank and does not hold a banking licence. Funds are
          held in {COMPANY.legalName}'s accounts with {COMPANY.processor} until they are
          paid out to you.
        </p>

        <h2 id="charge">2. The one-time service charge</h2>
        <p>
          <strong>Your first contribution on each plan is retained as a service charge.</strong>{' '}
          It is not part of your savings and is not refunded.
        </p>
        <p>It is charged once per plan and covers:</p>
        <ul>
          <li>Collection and recording of every contribution on that plan.</li>
          <li>Identity verification.</li>
          <li>Maintaining and securing your records.</li>
          <li>Processing your withdrawal and the bank transfer to you.</li>
        </ul>

        <h3>What it costs</h3>
        <p>The charge is one contribution at the amount you chose.</p>
        <ul>
          <li>₦500 a day for 30 days → charge ₦500 → you save ₦14,500 of ₦15,000 paid</li>
          <li>₦1,000 a day for 30 days → charge ₦1,000 → you save ₦29,000 of ₦30,000 paid</li>
          <li>₦2,000 a week for 12 weeks → charge ₦2,000 → you save ₦22,000 of ₦24,000 paid</li>
          <li>₦10,000 a month for 6 months → charge ₦10,000 → you save ₦50,000 of ₦60,000 paid</li>
        </ul>

        <div className="pub-callout is-info">
          <p>
            Your dashboard shows the charge from the moment your plan starts. The first
            contribution is labelled as the service charge and your balance only counts what
            follows it — so the figure you see is always what you would actually receive.
          </p>
        </div>

        <h2 id="when">3. When a contribution counts</h2>
        <p>
          A contribution is credited to your balance only when the money is confirmed
          received. Announcing a payment is not the same as making one.
        </p>

        <h3>Cash</h3>
        <p>
          Credited when your collector records it. They have the cash in hand, so it counts
          immediately, and you receive a notification. Check it against what you handed
          over.
        </p>

        <h3>Bank transfer</h3>
        <p>
          You transfer to the account shown in your dashboard and tap <em>I have paid</em>.
          That marks the contribution <strong>pending</strong>.
        </p>
        <p>
          It becomes <strong>paid</strong> when {COMPANY.processor} confirms the money
          arrived — usually within minutes — or when a collector or administrator confirms
          it manually.
        </p>

        <div className="pub-callout is-warning">
          <p>
            <strong>Tapping "I have paid" never credits your account by itself.</strong> If
            it did, anyone could tap it and claim savings they had not paid for. The
            confirmation has to come from the money actually arriving.
          </p>
        </div>

        <h2 id="advance">4. Paying in advance</h2>
        <p>
          You may pay several contributions at once. Pay ₦5,000 on a ₦1,000 daily plan and
          five days are credited, starting from the earliest unpaid one.
        </p>
        <p>
          Paying ahead does not shorten your term or unlock your savings early. The plan
          still ends on its scheduled date.
        </p>

        <h2 id="locked">5. Why your savings are locked</h2>
        <p>
          You cannot withdraw before your plan term ends. That is what you agreed when the
          plan was activated, and it is the whole purpose of a fixed term: money you cannot
          reach easily is money you are more likely to still have at the end.
        </p>
        <p>
          Your dashboard shows the date your plan completes. On that date, withdrawal
          becomes available.
        </p>

        <h2 id="withdrawing">6. Withdrawing</h2>
        <ol>
          <li>Your plan reaches the end of its term.</li>
          <li>Your identity is verified.</li>
          <li>You request a withdrawal and give your bank name, account number and account name.</li>
          <li>An administrator reviews the request.</li>
          <li>Once approved, we send the transfer through {COMPANY.processor}.</li>
          <li>We mark it paid and record the transfer reference.</li>
          <li>Your plan closes, and you can start a new one.</li>
        </ol>

        <h3>Rules</h3>
        <ul>
          <li>You withdraw the full balance. Partial withdrawals are not available.</li>
          <li>The account must be in your own name and match your verified name.</li>
          <li>One withdrawal request at a time.</li>
          <li>Approved withdrawals are paid within 1–3 working days.</li>
        </ul>

        <h2 id="failures">7. When something goes wrong</h2>

        <h3>Your transfer does not appear</h3>
        <p>
          Give it 30 minutes. If it still has not appeared, contact your collector or email{' '}
          <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> with the date, amount and
          your bank's transaction reference. We check against the payment record and correct
          it if the money arrived.
        </p>

        <h3>A payment is reversed</h3>
        <p>
          If a transfer is reversed by the bank after we credited it, we reverse the
          contribution and notify you. The reversal is recorded, not hidden.
        </p>

        <h3>You paid the wrong amount</h3>
        <p>We credit what actually arrived.</p>

        <h3>You paid to the wrong account</h3>
        <p>
          Contact us immediately with the reference. We will help you trace it, but money
          sent outside our accounts is recovered through your bank and we cannot guarantee
          the outcome.
        </p>

        <h3>Your withdrawal transfer fails</h3>
        <p>
          Usually a wrong account number or a name mismatch. Your balance is restored in
          full and we contact you for corrected details. You do not lose the money.
        </p>

        <h2 id="fees">8. Other fees</h2>
        <p>
          There are none. Beyond the one-time service charge in section 2,{' '}
          {COMPANY.shortName} charges nothing — no monthly fee, no withdrawal fee, no
          penalty for a missed contribution, no charge for closing your account.
        </p>
        <p>
          Your own bank may charge you for making a transfer. That is between you and your
          bank.
        </p>

        <h2 id="interest">9. No interest, no returns</h2>
        <p>
          {COMPANY.shortName} is a savings record and collection service, not an investment.
          We do not pay interest, profit or returns of any kind, and we make no promise that
          your money will grow.
        </p>
        <p>
          You receive exactly what you contributed, less the one-time service charge.
        </p>

        <h2>Questions</h2>
        <p>
          Email <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> or call{' '}
          {COMPANY.phone}. See also our <a href="/faq">Help page</a> and{' '}
          <a href="/terms">Terms &amp; Conditions</a>.
        </p>
      </article>
    </>
  );
}