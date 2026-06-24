import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock, Users, MessageSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useContacts } from '../hooks/useContacts';
import { useReminders } from '../hooks/useReminders';
import { useInteractions } from '../hooks/useInteractions';
import { useToast } from '../components/ui/Toast';
import { formatDate, todayStart } from '../lib/utils';
import { StatusBadge } from '../components/ui/StatusBadge';

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast, toastEl } = useToast();
  const uid = user!.uid;

  const { contacts } = useContacts(uid);
  const { reminders, setStatus } = useReminders(uid);
  const { interactions } = useInteractions(uid);

  const now = Date.now();
  const todayEnd = todayStart() + 86400000;
  const weekEnd = todayStart() + 7 * 86400000;

  const overdue = reminders.filter(r => r.status === 'offen' && r.dueDate < todayStart());
  const todayDue = reminders.filter(r => r.status === 'offen' && r.dueDate >= todayStart() && r.dueDate < todayEnd);
  const recentContacts = [...contacts].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);
  const recentInteractions = [...interactions].sort((a, b) => b.date - a.date).slice(0, 5);

  async function markDone(id: string) {
    await setStatus(uid, id, 'erledigt');
    showToast(t('reminder.statusUpdated'));
  }

  return (
    <div className="screen-wide">
      {toastEl}
      <div className="screen-header">
        <h1 className="screen-title">{t('dashboard.title')}</h1>
        <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--color-text-muted)' }}>
          <span>{contacts.length} {t('dashboard.totalContacts').toLowerCase()}</span>
          <span>{contacts.filter(c => c.status === 'aktiv').length} {t('dashboard.activeContacts').toLowerCase()}</span>
        </div>
      </div>

      <div className="dash-grid">
        {/* Overdue */}
        <div className={`dash-box${overdue.length > 0 ? ' overdue' : ''}`}>
          <div className="dash-box-title">
            <AlertTriangle size={13} />
            {t('dashboard.overdueReminders')} {overdue.length > 0 && `(${overdue.length})`}
          </div>
          {overdue.length === 0
            ? <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{t('dashboard.noOverdue')}</p>
            : overdue.slice(0, 4).map(r => (
              <div key={r.id} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 2, color: 'var(--color-text-primary)' }}>
                      <button
                        style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer', color: 'var(--color-accent)', fontSize: 13, fontWeight: 600 }}
                        onClick={() => navigate(`/contacts/${r.contactId}`)}
                      >{r.contactName}</button>
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>{r.message}</p>
                    <p style={{ fontSize: 11, color: 'var(--color-error)', marginTop: 2 }}>{formatDate(r.dueDate)}</p>
                  </div>
                  <button className="btn btn-sm btn-outline" onClick={() => markDone(r.id)}>{t('reminder.done')}</button>
                </div>
              </div>
            ))
          }
          {overdue.length > 4 && (
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/reminders')} style={{ marginTop: 4 }}>
              +{overdue.length - 4} weitere
            </button>
          )}
        </div>

        {/* Today */}
        <div className="dash-box">
          <div className="dash-box-title">
            <Clock size={13} />
            {t('dashboard.todayReminders')} {todayDue.length > 0 && `(${todayDue.length})`}
          </div>
          {todayDue.length === 0
            ? <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{t('dashboard.noToday')}</p>
            : todayDue.slice(0, 4).map(r => (
              <div key={r.id} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <button
                      style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer', color: 'var(--color-accent)', fontSize: 13, fontWeight: 600, marginBottom: 2 }}
                      onClick={() => navigate(`/contacts/${r.contactId}`)}
                    >{r.contactName}</button>
                    <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>{r.message}</p>
                  </div>
                  <button className="btn btn-sm btn-outline" onClick={() => markDone(r.id)}>{t('reminder.done')}</button>
                </div>
              </div>
            ))
          }
        </div>
      </div>

      <div className="dash-grid">
        {/* Recent contacts */}
        <div className="dash-box">
          <div className="dash-box-title"><Users size={13} />{t('dashboard.recentContacts')}</div>
          {recentContacts.length === 0
            ? <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{t('dashboard.noContacts')}</p>
            : recentContacts.map(c => (
              <div
                key={c.id}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }}
                onClick={() => navigate(`/contacts/${c.id}`)}
              >
                <div className={`contact-avatar avatar-${c.id.charCodeAt(0) % 5}`} style={{ width: 32, height: 32, fontSize: 12 }}>
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</p>
                  {c.category.length > 0 && <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{c.category.slice(0, 2).join(', ')}</p>}
                </div>
                <StatusBadge status={c.status} />
              </div>
            ))
          }
        </div>

        {/* Recent interactions */}
        <div className="dash-box">
          <div className="dash-box-title"><MessageSquare size={13} />{t('dashboard.recentInteractions')}</div>
          {recentInteractions.length === 0
            ? <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{t('dashboard.noInteractions')}</p>
            : recentInteractions.map(i => {
              const c = contacts.find(x => x.id === i.contactId);
              return (
                <div
                  key={i.id}
                  style={{ padding: '8px 0', borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }}
                  onClick={() => c && navigate(`/contacts/${c.id}`)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-accent)' }}>{c?.name ?? '–'}</span>
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{formatDate(i.date)}</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.4 }} className="text-truncate">{i.summary}</p>
                </div>
              );
            })
          }
        </div>
      </div>
    </div>
  );
}
