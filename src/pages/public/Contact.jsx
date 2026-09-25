import { useState } from 'react';
import { Mail, Phone, MessageCircle, MapPin, Clock } from 'lucide-react';
import { COMPANY } from './company';

/**
 * Contact.
 *
 * The form composes an email rather than posting to a public endpoint. An
 * unauthenticated write path on a financial app is a spam target, and a
 * mailto costs nothing and cannot be abused.
 */
export default function Contact() {
  const [form, setForm] = useState({ name: '', phone: '', subject: '', message: '' });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const mailto = () => {
    const subject = encodeURIComponent(form.subject || `Message from ${form.name || 'a customer'}`);
    const body = encodeURIComponent(
      `${form.message}\n\n---\nName: ${form.name}\nPhone: ${form.phone}`
    );
    return `mailto:${COMPANY.email}?subject=${subject}&body=${body}`;
  };

  const whatsapp = `https://wa.me/${COMPANY.whatsapp.replace(/\D/g, '')}`;

  return (
    <>
      <div className="pub-hero">
        <div className="pub-container">
          <h1>Contact us</h1>
          <p>Questions about your account, a payment, or anything else.</p>
        </div>
      </div>

      <section className="pub-section">
        <div className="pub-container">
          <div className="pub-grid">
            <a className="pub-contact-card" href={`mailto:${COMPANY.email}`}>
              <span className="pub-card-icon"><Mail size={19} strokeWidth={1.9} /></span>
              <div>
                <h3>Email</h3>
                <p>{COMPANY.email}</p>
                <p style={{ marginTop: 4, fontSize: '.8125rem' }}>We reply within 2 working days.</p>
              </div>
            </a>

            <a className="pub-contact-card" href={`tel:${COMPANY.phone.replace(/\s/g, '')}`}>
              <span className="pub-card-icon"><Phone size={19} strokeWidth={1.9} /></span>
              <div>
                <h3>Phone</h3>
                <p>{COMPANY.phone}</p>
                <p style={{ marginTop: 4, fontSize: '.8125rem' }}>Mon–Sat, 8am–6pm</p>
              </div>
            </a>

            <a className="pub-contact-card" href={whatsapp} target="_blank" rel="noreferrer">
              <span className="pub-card-icon"><MessageCircle size={19} strokeWidth={1.9} /></span>
              <div>
                <h3>WhatsApp</h3>
                <p>{COMPANY.whatsapp}</p>
                <p style={{ marginTop: 4, fontSize: '.8125rem' }}>Quickest for a simple question.</p>
              </div>
            </a>

            <div className="pub-contact-card">
              <span className="pub-card-icon"><MapPin size={19} strokeWidth={1.9} /></span>
              <div>
                <h3>Office</h3>
                <p>{COMPANY.legalName}</p>
                <p>{COMPANY.address}</p>
                <p style={{ marginTop: 4, fontSize: '.8125rem' }}>RC {COMPANY.rcNumber}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pub-section is-tinted">
        <div className="pub-container" style={{ maxWidth: 640 }}>
          <h2>Send us a message</h2>
          <p>This opens an email with your details filled in.</p>

          <div className="pub-card">
            <div className="field">
              <label className="field-label" htmlFor="c-name">Your name</label>
              <input id="c-name" className="field-input" value={form.name} onChange={set('name')} />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="c-phone">Phone number</label>
              <input id="c-phone" className="field-input" type="tel" inputMode="tel" value={form.phone} onChange={set('phone')} />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="c-subject">Subject</label>
              <input id="c-subject" className="field-input" value={form.subject} onChange={set('subject')} />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="c-message">Message</label>
              <textarea id="c-message" className="field-input" rows={5} value={form.message} onChange={set('message')} />
            </div>

            <a href={mailto()} className="btn btn-primary btn-block" style={{ marginTop: 16 }}>
              <Mail size={16} /> Send message
            </a>
          </div>

          <div className="pub-callout is-warning" style={{ marginTop: 24 }}>
            <p>
              <strong>Never send your passcode, bank password or PIN.</strong> No member of
              staff will ever ask for them, and we do not need them to help you.
            </p>
          </div>
        </div>
      </section>

      <section className="pub-section">
        <div className="pub-container" style={{ maxWidth: 640 }}>
          <div className="pub-contact-card">
            <span className="pub-card-icon"><Clock size={19} strokeWidth={1.9} /></span>
            <div>
              <h3>Reporting a problem with money</h3>
              <p>
                Include the date, the amount, and your bank's transaction reference if you
                have it. That is what lets us find the payment quickly.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}