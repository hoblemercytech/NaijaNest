import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useUnreadCount } from '../../hooks/useNotifications';
import { useAvatarUrl } from '../../hooks/useAvatar';
import Logo from '../ui/Logo';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import './layout.css';

/**
 * One shell for all three roles. The nav set is the only thing that changes,
 * so a collector on a phone and an admin on a laptop learn the same layout.
 *
 * Phones get a bottom bar with the four things you reach for while standing
 * in a market. Everything else lives in the "More" sheet.
 */
const NAV = {
  USER: [
    { to: '/dashboard', label: 'Home', icon: '⌂', primary: true },
    { to: '/contributions', label: 'Contributions', icon: '▤', primary: true },
    { to: '/withdrawals', label: 'Withdrawals', icon: '↑', primary: true },
    { to: '/notifications', label: 'Alerts', icon: '◔', primary: true, badge: true },
    { to: '/profile', label: 'Profile', icon: '☺' },
  ],
  COLLECTOR: [
    { to: '/collector/dashboard', label: 'Today', icon: '⌂', primary: true },
    { to: '/collector/customers', label: 'Customers', icon: '☰', primary: true },
    { to: '/collector/collect', label: 'Collect', icon: '₦', primary: true, accent: true },
    { to: '/collector/withdrawals', label: 'Payouts', icon: '↑', primary: true },
    { to: '/collector/cycles', label: 'Requests', icon: '◇' },
    { to: '/collector/cash', label: 'Cash handover', icon: '▦' },
    { to: '/collector/notifications', label: 'Alerts', icon: '◔', badge: true },
    { to: '/collector/profile', label: 'Profile', icon: '☺' },
  ],
  ADMIN: [
    { to: '/admin/dashboard', label: 'Overview', icon: '⌂', primary: true },
    { to: '/admin/users', label: 'Customers', icon: '☰', primary: true },
    { to: '/admin/collectors', label: 'Collectors', icon: '◈', primary: true },
    { to: '/admin/analytics', label: 'Analytics', icon: '◫', primary: true },
    { to: '/admin/plans', label: 'Plans', icon: '◇' },
    { to: '/admin/cycles', label: 'Cycles', icon: '◌' },
    { to: '/admin/contributions', label: 'Contributions', icon: '▤' },
    { to: '/admin/withdrawals', label: 'Withdrawals', icon: '↑' },
    { to: '/admin/cash', label: 'Cash handovers', icon: '▦' },
    { to: '/admin/audit-logs', label: 'Audit log', icon: '⎙' },
  ],
};

export default function AppShell() {
  const { profile, signOut } = useAuth();
  const unread = useUnreadCount();
  const avatar = useAvatarUrl(profile?.avatar_url);
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);

  const items = NAV[profile?.role] || NAV.USER;
  const primary = items.filter((i) => i.primary).slice(0, 4);
  const hasOverflow = items.length > primary.length;

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const renderLink = (item, onClick) => (
    <NavLink
      key={item.to}
      to={item.to}
      onClick={onClick}
      className={({ isActive }) => `nav-item${isActive ? ' is-active' : ''}`}
    >
      <span className="nav-icon" aria-hidden="true">{item.icon}</span>
      <span>{item.label}</span>
      {item.badge && unread > 0 && <span className="nav-count">{unread > 99 ? '99+' : unread}</span>}
    </NavLink>
  );

  return (
    <div className="shell">
      <aside className="shell-side">
        <div className="shell-brand">
          <Logo size={30} />
        </div>
        <nav className="shell-nav" aria-label="Main">
          {items.map((i) => renderLink(i))}
        </nav>
        <div className="shell-side-foot">
          <div className="row" style={{ gap: 10 }}>
            <Avatar name={profile?.full_name} url={avatar} size={36} />
            <div style={{ minWidth: 0 }}>
              <div className="small" style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile?.full_name}
              </div>
              <div className="xs muted num">{profile?.member_id}</div>
            </div>
          </div>
          <Button variant="ghost" size="sm" block onClick={handleSignOut} style={{ marginTop: 12 }}>
            Sign out
          </Button>
        </div>
      </aside>

      <header className="shell-top">
        <Logo size={26} />
        <NavLink to={items.find((i) => i.badge)?.to || '/notifications'} className="top-bell" aria-label="Notifications">
          <span aria-hidden="true">◔</span>
          {unread > 0 && <span className="top-bell-dot" />}
        </NavLink>
      </header>

      <main className="shell-main">
        <div className="shell-inner">
          <Outlet />
        </div>
      </main>

      <nav className="shell-bottom" aria-label="Main">
        {primary.map((i) => (
          <NavLink
            key={i.to}
            to={i.to}
            className={({ isActive }) => `tab${isActive ? ' is-active' : ''}${i.accent ? ' tab-accent' : ''}`}
          >
            <span className="tab-icon" aria-hidden="true">{i.icon}</span>
            <span className="tab-label">{i.label}</span>
            {i.badge && unread > 0 && <span className="tab-dot" />}
          </NavLink>
        ))}
        {hasOverflow && (
          <button className="tab" onClick={() => setMoreOpen(true)} aria-expanded={moreOpen}>
            <span className="tab-icon" aria-hidden="true">⋯</span>
            <span className="tab-label">More</span>
          </button>
        )}
      </nav>

      {moreOpen && (
        <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && setMoreOpen(false)}>
          <div className="modal" role="dialog" aria-modal="true" aria-label="More">
            <div className="modal-head">
              <h2>More</h2>
              <Button variant="ghost" size="sm" onClick={() => setMoreOpen(false)} aria-label="Close">✕</Button>
            </div>
            <nav className="sheet-nav">
              {items.filter((i) => !primary.includes(i)).map((i) => renderLink(i, () => setMoreOpen(false)))}
            </nav>
            <Button variant="outline" block onClick={handleSignOut} style={{ marginTop: 16 }}>
              Sign out
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}