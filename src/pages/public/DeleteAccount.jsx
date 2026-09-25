import { useState } from 'react';
import { Trash2, ShieldCheck, Clock, Mail } from 'lucide-react';
import { COMPANY } from './company';

/**
 * Account deletion.
 *
 * Google Play requires a publicly reachable URL where someone can request
 * deletion of their account and data — reachable *without* signing in, since
 * a person who has lost access still has the right to be deleted. Apple
 * requires an in-app path for the same thing.
 *
 * The form composes an email rather than writing to the database. A public,
 * unauthenticated endpoint that queues account deletions is a way to grief
 * other people's accounts; a human reading a request and verifying identity
 * is the right amount of friction for something irreversible.
 */
export default function DeleteAccount() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', reason: '' });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const mailto = () => {
    const subject = encodeURIComponent('Account deletion request');
    const body = encodeURIComponent(
      `I request deletion of my ${COMPANY.shortName} account and associated data.\n\n` +
      `Full name: ${form.name}\n` +
      `Phone number: ${form.phone}\n` +
      `Email address: ${form.email}\n` +
      `Reason (optional): ${form.reason}\n\n` +
      `I understand that financial records are retained for ${COMPANY.retentionYears} years ` +
      `as required by Nigerian law, and that any savings owed to me will be paid out ` +
      `before my account is closed.`
    );
    return `mailto:${COMPANY.email}?subject=${subject}&body=${body}`;
  };

  return (
    <>
      <div className="pub-hero">
        <div className="pub-container">
          <h1>Delete your account</h1>
          <p>
            How to close your {COMPANY.shortName} account and have your personal data
            removed.
          </p>
        </div>
      </div>

      <article className="pub-doc">
        <div className="pub-callout is-info">
          <p>
            <strong>If you have savings with us, we pay them out first.</strong> We will
            never close an account while money is owed to you. Request a withdrawal, wait
            for it to be paid, then request deletion.
          </p>
        </div>

        <h2>Two ways to request deletion</h2>

        <h3>In the app</h3>
        <ol>
          <li>Sign in to {COMPANY.shortName}.</li>
          <li>Go to <strong>Profile</strong>.</li>
          <li>Tap <strong>Delete my account</strong>.</li>
          <li>Confirm. We email you to acknowledge the request.</li>
        </ol>

        <h3>By email, if you cannot sign in</h3>
        <p>
          Use the form below, or write directly to{' '}
          <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> from the email address on
          your account.
        </p>

        <div className="pub-grid" style={{ margin: '24px 0' }}>
          <div className="pub-card">
            <span className="pub-card-icon"><Clock size={19} strokeWidth={1.9} /></span>
            <h3>Within 7 days</h3>
            <p>We verify your identity and confirm the request by email.</p>
          </div>
          <div className="pub-card">
            <span className="pub-card-icon"><Trash2 size={19} strokeWidth={1.9} /></span>
            <h3>Within 30 days</h3>
            <p>Your personal data is deleted and your account is permanently closed.</p>
          </div>
        </div>

        <h2>What is deleted</h2>
        <ul>
          <li>Your name, phone number and email address.</li>
          <li>Your profile photograph.</li>
          <li>Your date of birth and residential address.</li>
          <li>Your ID number and the photograph of your ID document.</li>
          <li>Your bank account details.</li>
          <li>Your sign-in credentials. The account can no longer be accessed.</li>
        </ul>

        <h2>What is kept, and why</h2>
        <p>
          Nigerian financial record-keeping law requires us to retain transaction records
          for {COMPANY.retentionYears} years. After deletion we keep:
        </p>
        <ul>
          <li>The amounts and dates of contributions and withdrawals.</li>
          <li>The audit record of actions taken on the account.</li>
        </ul>
        <p>
          <strong>These are kept without your personal details attached.</strong> They
          become anonymous figures in a ledger — no name, no phone number, no ID. They
          cannot be traced back to you, and they are kept because they are the proof of
          money that moved between us.
        </p>

        <div className="pub-callout">
          <p>
            <strong>This is permanent.</strong> A deleted account cannot be restored. If you
            return to {COMPANY.shortName} later you start fresh, and your previous
            contribution history will not be available.
          </p>
        </div>

        <h2>Request deletion</h2>
        <p>
          Fill this in and it opens an email to us with the details. Send from the address
          on your account if you can — it is how we confirm the request is really from you.
        </p>

        <div className="pub-card" style={{ marginTop: 16 }}>
          <div className="field">
            <label className="field-label" htmlFor="del-name">Full name</label>
            <input id="del-name" className="field-input" value={form.name} onChange={set('name')} />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="del-phone">Phone number on the account</label>
            <input id="del-phone" className="field-input" type="tel" inputMode="tel" value={form.phone} onChange={set('phone')} />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="del-email">Email address on the account</label>
            <input id="del-email" className="field-input" type="email" inputMode="email" value={form.email} onChange={set('email')} />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="del-reason">Reason (optional)</label>
            <textarea id="del-reason" className="field-input" rows={3} value={form.reason} onChange={set('reason')} />
          </div>

          <a
            href={mailto()}
            className="btn btn-danger btn-block"
            style={{ marginTop: 16 }}
            aria-disabled={!form.name || !form.phone || !form.email}
          >
            <Mail size={16} /> Send deletion request
          </a>
        </div>

        <h2>Questions before you delete</h2>
        <p>
          If something has gone wrong, we would rather fix it. Email{' '}
          <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> or call {COMPANY.phone} and
          tell us what happened.
        </p>
        <p>
          See also our <a href="/privacy">Privacy Policy</a>, which sets out your rights
          under the Nigeria Data Protection Act 2023.
        </p>

        <p className="small" style={{ marginTop: 32, color: '#4A5D55' }}>
          <ShieldCheck size={14} style={{ verticalAlign: '-2px' }} />{' '}
          {COMPANY.legalName} · RC {COMPANY.rcNumber} · {COMPANY.address}
        </p>
      </article>
    </>
  );
}