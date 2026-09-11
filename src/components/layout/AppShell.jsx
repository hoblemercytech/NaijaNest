
import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useUnreadCount } from '../../hooks/useNotifications';
import { useAvatarUrl } from '../../hooks/useAvatar';
import {
  Home, CalendarDays, ArrowUpRight, Bell, User, Users, Banknote, FileClock,
  ClipboardList, Wallet, LayoutDashboard, UserCog, BarChart3, Layers, ScrollText,
  MoreHorizontal, LogOut, X, ShieldCheck, PanelLeftClose, PanelLeft, ChevronDown, Mail,
} from 'lucide-react';
import Logo from '../ui/Logo';
import ThemeToggle from '../ui/ThemeToggle';
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
    { to: '/dashboard', label: 'Home', Icon: Home, primary: true },
    { to: '/contributions', label: 'Contributions', Icon: CalendarDays, primary: true },
    { to: '/withdrawals', label: 'Withdrawals', Icon: ArrowUpRight, primary: true },
    { to: '/notifications', label: 'Alerts', Icon: Bell, primary: true, badge: true },
    { to: '/verification', label: 'Verification', Icon: ShieldCheck },
    { to: '/profile', label: 'Profile', Icon: User },
  ],
  COLLECTOR: [
    { to: '/collector/dashboard', label: 'Today', Icon: Home, primary: true },
    { to: '/collector/customers', label: 'Customers', Icon: Users, primary: true },
    { to: '/collector/collect', label: 'Collect', Icon: Banknote, primary: true, accent: true },
    { to: '/collector/withdrawals', label: 'Payouts', Icon: ArrowUpRight, primary: true },
    { to: '/collector/cycles', label: 'Requests', Icon: ClipboardList },
    { to: '/collector/cash', label: 'Cash handover', Icon: Wallet },
    { to: '/collector/notifications', label: 'Alerts', Icon: Bell, badge: true },
    { to: '/collector/profile', label: 'Profile', Icon: User },
  ],
  ADMIN: [
    { to: '/admin/dashboard', label: 'Overview', Icon: LayoutDashboard, primary: true },
    { to: '/admin/users', label: 'Customers', Icon: Users, primary: true },
    { to: '/admin/collectors', label: 'Collectors', Icon: UserCog, primary: true },
    { to: '/admin/analytics', label: 'Analytics', Icon: BarChart3, primary: true },
    { to: '/admin/plans', label: 'Plans', Icon: Layers },
    { to: '/admin/cycles', label: 'Cycles', Icon: FileClock },
    { to: '/admin/contributions', label: 'Contributions', Icon: CalendarDays },
    { to: '/admin/withdrawals', label: 'Withdrawals', Icon: ArrowUpRight },
    { to: '/admin/verification', label: 'Verification', Icon: ShieldCheck },
    { to: '/admin/cash', label: 'Cash handovers', Icon: Wallet },
    { to: '/admin/email-alerts', label: 'Email alerts', Icon: Mail },
    { to: '/admin/audit-logs', label: 'Audit log', Icon: ScrollText },
  ],
};

const COMPACT_KEY = 'naijanest-sidebar-compact';

export default function AppShell() {
  const { profile, signOut } = useAuth();
  const unread = useUnreadCount();
  const avatar = useAvatarUrl(profile?.avatar_url);
  const navigate = useNavigate();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  // Keyed by pathname so navigating closes the menu by derivation rather than
  // by a setState in an effect, which costs an extra render every route change.
  const [menuAt, setMenuAt] = useState(null);
  const menuOpen = menuAt === location.pathname;
  const setMenuOpen = (open) => setMenuAt(open ? location.pathname : null);
  const [compact, setCompact] = useState(
    () => window.localStorage.getItem(COMPACT_KEY) === '1'
  );
  const menuRef = useRef(null);

  const items = NAV[profile?.role] || NAV.USER;

  // The header title comes from the nav table rather than each page repeating
  // it, so a renamed nav item can never disagree with the page it opens.
  const active = [...items].sort((a, b) => b.to.length - a.to.length)
    .find((i) => location.pathname.startsWith(i.to));

  useEffect(() => {
    window.localStorage.setItem(COMPACT_KEY, compact ? '1' : '0');
  }, [compact]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const close = () => setMenuAt(null);
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) close();
    };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);
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
      title={item.label}
    >
      <item.Icon className="nav-icon" size={18} strokeWidth={1.9} aria-hidden="true" />
      <span className="nav-label">{item.label}</span>
      {item.badge && unread > 0 && <span className="nav-count">{unread > 99 ? '99+' : unread}</span>}
    </NavLink>
  );

  return (
    <div className={`shell${compact ? ' is-compact' : ''}`}>
      <aside className="shell-side">
        <div className="shell-brand">
          <Logo size={30} showName={!compact} />
          <button
            type="button"
            className="shell-collapse"
            onClick={() => setCompact((c) => !c)}
            aria-label={compact ? 'Expand sidebar' : 'Collapse sidebar'}
            title={compact ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {compact ? <PanelLeft size={17} /> : <PanelLeftClose size={17} />}
          </button>
        </div>
        <nav className="shell-nav" aria-label="Main">
          {items.map((i) => renderLink(i))}
        </nav>
        <div className="shell-side-foot">
          <div className="side-user">
            <Avatar name={profile?.full_name} url={avatar} size={34} />
            <div className="side-user-text">
              <div className="side-user-name">{profile?.full_name}</div>
              <div className="xs muted num">{profile?.member_id}</div>
            </div>
          </div>
        </div>
      </aside>

      <header className="shell-top">
        <div className="top-lead">
          <span className="top-mark"><Logo size={26} showName={false} /></span>
          <h1 className="top-title">{active?.label || 'NaijaNest'}</h1>
        </div>

        <div className="top-actions">
          <ThemeToggle compact />

          <NavLink
            to={items.find((i) => i.badge)?.to || '/notifications'}
            className="top-icon-btn"
            aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
          >
            <Bell size={19} strokeWidth={1.9} aria-hidden="true" />
            {unread > 0 && <span className="top-bell-dot" />}
          </NavLink>

          <div className="user-menu" ref={menuRef}>
            <button
              type="button"
              className="user-menu-trigger"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              <Avatar name={profile?.full_name} url={avatar} size={30} />
              <span className="user-menu-name">{profile?.full_name?.split(' ')[0]}</span>
              <ChevronDown size={15} strokeWidth={2} />
            </button>

            {menuOpen && (
              <div className="user-menu-panel" role="menu">
                <div className="user-menu-head">
                  <div className="side-user-name">{profile?.full_name}</div>
                  <div className="xs muted num">{profile?.member_id}</div>
                </div>
                {items.filter((i) => i.to.includes('profile')).map((i) => (
                  <NavLink key={i.to} to={i.to} className="user-menu-item" role="menuitem">
                    <i.Icon size={16} strokeWidth={1.9} /> {i.label}
                  </NavLink>
                ))}
                <button type="button" className="user-menu-item is-danger" onClick={handleSignOut} role="menuitem">
                  <LogOut size={16} strokeWidth={1.9} /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
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
            <span className="tab-icon"><i.Icon size={20} strokeWidth={1.9} aria-hidden="true" /></span>
            <span className="tab-label">{i.label}</span>
            {i.badge && unread > 0 && <span className="tab-dot" />}
          </NavLink>
        ))}
        {hasOverflow && (
          <button className="tab" onClick={() => setMoreOpen(true)} aria-expanded={moreOpen}>
            <span className="tab-icon"><MoreHorizontal size={20} strokeWidth={1.9} aria-hidden="true" /></span>
            <span className="tab-label">More</span>
          </button>
        )}
      </nav>

      {moreOpen && (
        <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && setMoreOpen(false)}>
          <div className="modal" role="dialog" aria-modal="true" aria-label="More">
            <div className="modal-head">
              <h2>More</h2>
              <Button variant="ghost" size="sm" onClick={() => setMoreOpen(false)} aria-label="Close">
                <X size={18} />
              </Button>
            </div>
            <nav className="sheet-nav">
              {items.filter((i) => !primary.includes(i)).map((i) => renderLink(i, () => setMoreOpen(false)))}
            </nav>
            <Button variant="outline" block onClick={handleSignOut} style={{ marginTop: 16 }}>
              <LogOut size={16} strokeWidth={2} /> Sign out
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
