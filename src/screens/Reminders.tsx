import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Check, SkipForward, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useReminders } from '../hooks/useReminders';
import { useToast } from '../components/ui/Toast';
import { formatDate, todayStart } from '../lib/utils';

type Tab = 'today' | 'week' | 'all' | 'done';

export default function Reminders() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const uid = user!.uid;
  const { reminders, setStatus } = useReminders(uid);
  const { showToast, toastEl } = useToast();
  const [tab, setTab] = useState<Tab>('today');

  const now = Date.now();
  const dayStart = todayStart();
  const dayEnd = dayStart + 86400000;
  const weekEnd = dayStart + 7 * 86400000;

  const filtered = reminders.filter(r => {
    if (tab === 'done') return r.status !== 'offen';
    if (r.status !== 'offen') return false;
    if (tab === 'today') return r.dueDate < dayEnd;
    if (tab === 'week') return r.dueDate < weekEnd;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => a.dueDate - b.dueDate);

  async function markDone(id: string) {
    await setStatus(uid, id, 'erledigt');
    showToast(t('reminder.statusUpdated'));
  }

  async function markSkipped(id: string) {
    await setStatus(uid, id, 'uebersprungen');
    showToast(t('reminder.statusUpdated'));
  }

  const tabs: Tab[] = ['today', 'week', 'all', 'done'];
  const overdueBadge = reminders.filter(r => r.status === 'offen' && r.dueDate < dayStart).length;

  return (
    <div className="screen">
      {toastEl}
      <div className="screen-header">
        <h1 className="screen-title">{t('nav.reminders')}</h1>
        {overdueBadge > 0 && (
          <span className="badge badge-overdue">{overdueBadge} {t('common.overdue')}</span>
        )}
      </div>

      <div className="filter-bar" style={{ marginBottom: 16 }}>
        {tabs.map(tabKey => (
          <button
            key={tabKey}
            className={`filter-chip${tab === tabKey ? ' active' : ''}`}
            onClick={() => setTab(tabKey)}
          >
            {t(`reminder.tabs.${tabKey}`)}
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <div className="empty-title">{t('reminder.noReminders')}</div>
          <div className="empty-desc">{t('reminder.noRemindersDesc')}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sorted.map(r => {
            const isOverdue = r.status === 'offen' && r.dueDate < dayStart;
            const isToday = r.dueDate >= dayStart && r.dueDate < dayEnd;
            return (
              <div
                key={r.id}
                className={`reminder-item${isOverdue ? ' overdue' : isToday ? ' today' : ''}`}
              >
                <div className="reminder-body">
                  <div style={{ marginBottom: 4 }}>
                    <button
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--color-accent)', fontWeight: 600, fontSize: 13 }}
                      onClick={() => navigate(`/contacts/${r.contactId}`)}
                    >
                      {r.contactName}
                    </button>
                  </div>
                  <p className="reminder-message">{r.message}</p>
                  <div className="reminder-meta" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 4 }}>
                    <span style={{ color: isOverdue ? 'var(--color-error)' : isToday ? 'var(--color-warning)' : 'var(--color-text-muted)' }}>
                      {isOverdue ? t('common.overdue') + ': ' : ''}{formatDate(r.dueDate)}
                    </span>
                    {r.sequenceName && <span>· {r.sequenceName}</span>}
                    {r.isManual && <span>· {t('reminder.manual')}</span>}
                    {r.status !== 'offen' && <span className={`badge badge-${r.status === 'erledigt' ? 'erledigt' : 'neutral'}`}>{r.status}</span>}
                  </div>
                </div>
                {r.status === 'offen' && (
                  <div className="reminder-actions">
                    <button className="btn btn-sm btn-outline" title={t('reminder.done')} onClick={() => markDone(r.id)}>
                      <Check size={14} />
                    </button>
                    <button className="btn btn-sm btn-ghost" title={t('reminder.skip')} onClick={() => markSkipped(r.id)}>
                      <SkipForward size={14} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
