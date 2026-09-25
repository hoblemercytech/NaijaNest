import { Link, NavLink, Outlet } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import Logo from '../../components/ui/Logo';
import { COMPANY } from './company';
import './public.css';

/**
 * Shell for the public pages — everything a visitor, Google Play reviewer or
 * regulator sees without signing in.
 *
 * Separate from AppShell on purpose. These pages have no session, no realtime,
 * and no role; sharing the dashboard chrome would pull an auth context into a
 * page that must render for an anonymous crawler.
 */
const NAV = [
  { to: '/how-it-works', label: 'How it works' },
  { to: '/about', label: 'About' },
  { to: '/faq', label: 'Help' },
  { to: '/contact', label: 'Contact' },
];

const LEGAL = [
  { to: '/terms', label: 'Terms & Conditions' },
  { to: '/privacy', label: 'Privacy Policy' },
  { to: '/financial-terms', label: 'Financial & Payment Terms' },
  { to: '/delete-account', label: 'Delete your account' },
];

export default function PublicLayout() {
  return (
    <div className="pub">
      <header className="pub-nav">
        <div className="pub-container pub-nav-inner">
          <Link to="/" className="pub-brand"><Logo size={28} /></Link>

          <nav className="pub-nav-links">
            {NAV.map((i) => (
              <NavLink
                key={i.to}
                to={i.to}
                className={({ isActive }) => `pub-nav-link${isActive ? ' is-active' : ''}`}
              >
                {i.label}
              </NavLink>
            ))}
          </nav>

          <Link to="/login" className="btn btn-primary btn-sm">Sign in</Link>
        </div>
      </header>

      <main className="pub-main">
        <Outlet />
      </main>

      <footer className="pub-footer">
        <div className="pub-container">
          <div className="pub-footer-grid">
            <div>
              <Logo size={26} />
              <p className="pub-footer-blurb">
                {COMPANY.legalName} records daily, weekly and monthly cash contributions
                collected in person, and pays savings out by bank transfer.
              </p>
              <p className="pub-footer-rc">RC {COMPANY.rcNumber}</p>
            </div>

            <div>
              <h3>Company</h3>
              {NAV.map((i) => <Link key={i.to} to={i.to}>{i.label}</Link>)}
            </div>

            <div>
              <h3>Legal</h3>
              {LEGAL.map((i) => <Link key={i.to} to={i.to}>{i.label}</Link>)}
            </div>

            <div>
              <h3>Contact</h3>
              <a href={`mailto:${COMPANY.email}`}><Mail size={14} /> {COMPANY.email}</a>
              <a href={`tel:${COMPANY.phone.replace(/\s/g, '')}`}><Phone size={14} /> {COMPANY.phone}</a>
              <span className="pub-address"><MapPin size={14} /> {COMPANY.address}</span>
            </div>
          </div>

          <div className="pub-footer-base">
            <p>© {new Date().getFullYear()} {COMPANY.legalName}. All rights reserved.</p>
            <p className="pub-footer-note">
              {COMPANY.shortName} is a contribution record-keeping and savings service.
              Payments are processed by {COMPANY.processor}, a licensed payment service
              provider. {COMPANY.shortName} is not a bank.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}