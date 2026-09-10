import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useUnreadCount } from '../../hooks/useNotifications';
import { useAvatarUrl } from '../../hooks/useAvatar';
import {
  Home, CalendarDays, ArrowUpRight, Bell, User, Users, Banknote, FileClock,
  ClipboardList, Wallet, LayoutDashboard, UserCog, BarChart3, Layers, ScrollText,
  MoreHorizontal, LogOut, X, ShieldCheck,
} from 'lucide-react';
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
    { to: '/admin/audit-logs', label: 'Audit log', Icon: ScrollText },
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
      <item.Icon className="nav-icon" size={18} strokeWidth={1.9} aria-hidden="true" />
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
            <LogOut size={15} strokeWidth={2} /> Sign out
          </Button>
        </div>
      </aside>

      <header className="shell-top">
        <Logo size={26} />
        <NavLink to={items.find((i) => i.badge)?.to || '/notifications'} className="top-bell" aria-label="Notifications">
          <Bell size={20} strokeWidth={1.9} aria-hidden="true" />
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
