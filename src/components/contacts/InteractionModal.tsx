import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import type { Interaction } from '../../types/index';

interface Props {
  contactId: string;
  onClose: () => void;
  onSubmit: (data: Omit<Interaction, 'id'>) => Promise<void>;
}

export default function InteractionModal({ contactId, onClose, onSubmit }: Props) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const dateStr = fd.get('date') as string;
    const nextDueStr = fd.get('nextActionDue') as string;
    setSaving(true);
    try {
      await onSubmit({
        contactId,
        date: new Date(dateStr).getTime(),
        type: fd.get('type') as Interaction['type'],
        summary: (fd.get('summary') as string).trim(),
        outcome: fd.get('outcome') as Interaction['outcome'],
        nextAction: (fd.get('nextAction') as string)?.trim() || undefined,
        nextActionDue: nextDueStr ? new Date(nextDueStr).getTime() : undefined,
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
          <h2 className="modal-title">{t('interaction.logInteraction')}</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="input-row">
              <div>
                <label className="input-label">{t('interaction.date')}</label>
                <input className="input" type="date" name="date" defaultValue={today} required />
              </div>
              <div>
                <label className="input-label">{t('interaction.type')}</label>
                <select className="select" name="type" required>
                  <option value="anruf">{t('interaction.types.anruf')}</option>
                  <option value="email">{t('interaction.types.email')}</option>
                  <option value="treffen">{t('interaction.types.treffen')}</option>
                  <option value="nachricht">{t('interaction.types.nachricht')}</option>
                  <option value="sonstiges">{t('interaction.types.sonstiges')}</option>
                </select>
              </div>
            </div>
            <div>
              <label className="input-label">{t('interaction.outcome')}</label>
              <select className="select" name="outcome" required>
                <option value="positiv">{t('interaction.outcomes.positiv')}</option>
                <option value="neutral">{t('interaction.outcomes.neutral')}</option>
                <option value="negativ">{t('interaction.outcomes.negativ')}</option>
              </select>
            </div>
            <div>
              <label className="input-label">{t('interaction.summary')}</label>
              <textarea className="textarea" name="summary" required placeholder="Kurze Zusammenfassung..." style={{ minHeight: 90 }} />
            </div>
            <div>
              <label className="input-label">{t('interaction.nextStep')} {t('common.optional')}</label>
              <input className="input" type="text" name="nextAction" placeholder="Nächster Schritt..." />
            </div>
            <div>
              <label className="input-label">Nächster Schritt fällig {t('common.optional')}</label>
              <input className="input" type="date" name="nextActionDue" />
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
