import { Link } from 'react-router-dom';
import { ShieldCheck, Users, FileText, Landmark, Mail, Phone, MapPin } from 'lucide-react';
import { COMPANY } from './company';

export default function About() {
  return (
    <>
      <div className="pub-hero">
        <div className="pub-container">
          <h1>About {COMPANY.shortName}</h1>
          <p>
            {COMPANY.legalName} brings the daily savings people already practise into a
            record they can check for themselves.
          </p>
        </div>
      </div>

      <section className="pub-section">
        <div className="pub-container" style={{ maxWidth: 760 }}>
          <h2>Why we exist</h2>
          <p>
            Millions of Nigerians save through daily contribution — ajo, esusu, thrift
            collection. It works because a person comes to you, and because paying a little
            every day is easier than saving a lot once.
          </p>
          <p>
            What it has never had is a reliable record. The notebook can be lost, disputed
            or filled in wrongly, and the saver has no independent way to check. When money
            goes missing, it is their word against the collector's.
          </p>
          <p>
            {COMPANY.shortName} keeps that record. Every contribution is timestamped against
            the person who recorded it, and the saver can open their phone and see it. The
            collector still comes, cash still works — the difference is that both sides can
            now point at the same set of facts.
          </p>
        </div>
      </section>

      <section className="pub-section is-tinted">
        <div className="pub-container">
          <h2>What we do</h2>
          <p>Four things, and deliberately not more.</p>

          <div className="pub-grid is-three">
            <div className="pub-card">
              <span className="pub-card-icon"><FileText size={19} strokeWidth={1.9} /></span>
              <h3>Record contributions</h3>
              <p>
                Cash to a collector, or bank transfer. Every payment is logged with the date,
                the amount and who recorded it.
              </p>
            </div>
            <div className="pub-card">
              <span className="pub-card-icon"><Users size={19} strokeWidth={1.9} /></span>
              <h3>Assign collectors</h3>
              <p>
                Each customer has one collector who knows them. They see their own customers
                and nobody else's.
              </p>
            </div>
            <div className="pub-card">
              <span className="pub-card-icon"><Landmark size={19} strokeWidth={1.9} /></span>
              <h3>Pay out savings</h3>
              <p>
                When a plan completes, savings go by bank transfer to an account in the
                customer's own verified name.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="pub-section">
        <div className="pub-container" style={{ maxWidth: 760 }}>
          <h2>What we are not</h2>

          <div className="pub-callout is-warning">
            <p>
              <strong>We are not a bank.</strong> {COMPANY.legalName} is not a licensed
              deposit-taking institution. Contributions are not bank deposits and are not
              insured by the NDIC.
            </p>
            <p>
              <strong>We pay no interest and promise no returns.</strong> You receive what
              you contributed, less a one-time service charge. We are a record and a
              discipline, not an investment.
            </p>
          </div>

          <p>
            Payments are processed by {COMPANY.processorLegal}, a payment service provider
            licensed by the Central Bank of Nigeria. We never see your bank password or PIN.
          </p>
          <p>
            The full detail is in our{' '}
            <Link to="/financial-terms">Financial &amp; Payment Terms</Link>.
          </p>
        </div>
      </section>

      <section className="pub-section is-tinted">
        <div className="pub-container" style={{ maxWidth: 760 }}>
          <h2>How we think about trust</h2>
          <p>
            We are asking people to hand cash to a stranger and wait. That only works if the
            record is beyond argument, so a few things are built to be difficult rather than
            convenient.
          </p>
          <ul style={{ color: '#35463F', lineHeight: 1.72, paddingLeft: 22 }}>
            <li>
              <strong>Collectors cannot pay themselves.</strong> They record contributions
              and hold cash, but only an administrator can approve and send a withdrawal.
            </li>
            <li>
              <strong>Amounts are never typed by staff.</strong> A contribution is recorded
              against a scheduled day at the plan's own amount. A collector cannot enter a
              different figure.
            </li>
            <li>
              <strong>Nothing is deleted.</strong> A mistake is corrected with a reason
              attached, and both the old and new values are kept. Even we cannot rewrite the
              history.
            </li>
            <li>
              <strong>Your ID stays with us.</strong> Your collector handles your money daily
              and can never see your ID number, your address or your bank details.
            </li>
          </ul>
        </div>
      </section>

      <section className="pub-section">
        <div className="pub-container">
          <h2>Company information</h2>

          <div className="pub-grid">
            <div className="pub-card">
              <span className="pub-card-icon"><ShieldCheck size={19} strokeWidth={1.9} /></span>
              <h3>{COMPANY.legalName}</h3>
              <p>
                Registered in Nigeria<br />
                RC {COMPANY.rcNumber}<br />
                Trading as {COMPANY.shortName}
              </p>
            </div>

            <div className="pub-card">
              <span className="pub-card-icon"><MapPin size={19} strokeWidth={1.9} /></span>
              <h3>Where to find us</h3>
              <p>
                {COMPANY.address}<br />
                <a href={`mailto:${COMPANY.email}`}><Mail size={13} /> {COMPANY.email}</a><br />
                <a href={`tel:${COMPANY.phone.replace(/\s/g, '')}`}><Phone size={13} /> {COMPANY.phone}</a>
              </p>
            </div>
          </div>

          <p style={{ marginTop: 28 }}>
            <Link to="/contact" className="btn btn-primary">Contact us</Link>
          </p>
        </div>
      </section>
    </>
  );
}