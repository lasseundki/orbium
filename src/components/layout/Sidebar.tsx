import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Users, GitBranch, Bell, Settings, LogOut, Share2 } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';

interface Props { overdueBadge: number; }

export default function Sidebar({ overdueBadge }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut(auth);
    navigate('/');
  }

  const items = [
    { to: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
    { to: '/contacts',  icon: Users,           label: t('nav.contacts') },
    { to: '/pipeline',  icon: GitBranch,        label: t('nav.pipeline') },
    { to: '/reminders', icon: Bell,             label: t('nav.reminders'), badge: overdueBadge },
    { to: '/network',   icon: Share2,           label: t('nav.network') },
    { to: '/settings',  icon: Settings,         label: t('nav.settings') },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src={import.meta.env.BASE_URL + 'favicon.svg'} alt="Ob" style={{ width: 32, height: 32, borderRadius: 8 }} />
        <span className="sidebar-name">Orbium</span>
      </div>
      <nav className="sidebar-nav">
        {items.map(({ to, icon: Icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <Icon size={17} />
            {label}
            {badge && badge > 0
              ? <span className="nav-badge">{badge > 99 ? '99+' : badge}</span>
              : null}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button className="nav-item" style={{ color: 'var(--color-text-muted)', background: 'none', border: 'none' }} onClick={handleLogout}>
          <LogOut size={16} />
          {t('auth.logout')}
        </button>
      </div>
    </aside>
  );
}
