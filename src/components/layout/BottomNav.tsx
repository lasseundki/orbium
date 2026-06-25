import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Users, GitBranch, Bell, Share2 } from 'lucide-react';

interface Props { overdueBadge: number; }

export default function BottomNav({ overdueBadge }: Props) {
  const { t } = useTranslation();

  const items = [
    { to: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
    { to: '/contacts',  icon: Users,           label: t('nav.contacts') },
    { to: '/pipeline',  icon: GitBranch,        label: t('nav.pipeline') },
    { to: '/reminders', icon: Bell,             label: t('nav.reminders'), badge: overdueBadge },
    { to: '/network',   icon: Share2,           label: t('nav.network') },
  ];

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-inner">
        {items.map(({ to, icon: Icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}
          >
            <div style={{ position: 'relative' }}>
              <Icon size={20} />
              {badge && badge > 0
                ? <span className="bottom-nav-badge">{badge > 99 ? '99+' : badge}</span>
                : null}
            </div>
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
