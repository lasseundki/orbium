import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import type { ScheduledReminder } from '../../types/index';

interface Props {
  contactId: string;
  contactName: string;
  onClose: () => void;
  onSubmit: (data: Omit<ScheduledReminder, 'id'>) => Promise<void>;
}

export default function ReminderModal({ contactId, contactName, onClose, onSubmit }: Props) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().split('T')[0];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const dateStr = fd.get('dueDate') as string;
    setSaving(true);
    try {
      await onSubmit({
        contactId,
        contactName,
        dueDate: new Date(dateStr).getTime(),
        message: (fd.get('message') as string).trim(),
        status: 'offen',
        isManual: true,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{t('reminder.addReminder')}</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div>
              <label className="input-label">{t('reminder.dueDate')}</label>
              <input className="input" type="date" name="dueDate" defaultValue={defaultDate} required />
            </div>
            <div>
              <label className="input-label">{t('reminder.message')}</label>
              <textarea className="textarea" name="message" required placeholder="Was soll ich tun?" style={{ minHeight: 80 }} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary btn-md" onClick={onClose}>{t('common.cancel')}</button>
            <button type="submit" className="btn btn-primary btn-md" disabled={saving}>
              {saving ? t('common.loading') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
