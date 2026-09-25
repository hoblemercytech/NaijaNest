import { Link } from 'react-router-dom';
import './legal-links.css';

/**
 * Footer links to the legal and support pages.
 *
 * Kept as its own component with its own styles so it can drop into the
 * landing page without touching the existing design. These links are what
 * makes the pages discoverable — a Play reviewer looks for a privacy policy
 * in the footer, and Google will not index a page nothing points at.
 */
const LINKS = [
  { to: '/how-it-works', label: 'How it works' },
  { to: '/about', label: 'About' },
  { to: '/faq', label: 'Help' },
  { to: '/contact', label: 'Contact' },
  { to: '/terms', label: 'Terms' },
  { to: '/privacy', label: 'Privacy' },
  { to: '/financial-terms', label: 'Payment terms' },
  { to: '/delete-account', label: 'Delete account' },
];

export default function LegalLinks() {
  return (
    <nav className="legal-links" aria-label="Legal and support">
      {LINKS.map((l) => (
        <Link key={l.to} to={l.to}>{l.label}</Link>
      ))}
    </nav>
  );
}