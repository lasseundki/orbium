import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Contact } from '../../types/index';

const CATEGORIES = ['Familie', 'Freunde', 'Interessent', 'Sport', 'Kirche', 'Kollege', 'awaqe', 'preply', 'Kunde', 'Partner'];

interface Props {
  contact?: Contact;
  onSubmit: (data: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
}

export default function ContactForm({ contact, onSubmit, onCancel }: Props) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<string[]>(contact?.category ?? []);

  function toggleCat(cat: string) {
    setCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const get = (k: string) => (fd.get(k) as string | null)?.trim() || undefined;
    const getNum = (k: string) => { const v = get(k); return v ? Number(v) : undefined; };
    const getDate = (k: string) => { const v = get(k); return v ? new Date(v).getTime() : undefined; };

    setSaving(true);
    try {
      await onSubmit({
        name: (fd.get('name') as string).trim(),
        category: categories,
        status: (fd.get('status') as Contact['status']) || 'lead',
        priority: (fd.get('priority') as Contact['priority']) || 'mittel',
        phone: get('phone'),
        email: get('email'),
        socialMedia: get('socialMedia'),
        city: get('city'),
        country: get('country'),
        language: get('language'),
        age: getNum('age'),
        profession: get('profession'),
        strengths: get('strengths'),
        needs: get('needs'),
        referredBy: get('referredBy'),
        source: get('source'),
        notes: get('notes'),
        birthday: getDate('birthday'),
        statusChangedAt: contact?.statusChangedAt,
      });
    } finally {
      setSaving(false);
    }
  }

  const defDate = (ts?: number) => ts ? new Date(ts).toISOString().split('T')[0] : '';

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-section">
        <p className="section-label">Basis</p>
        <div>
          <label className="input-label">{t('contact.name')} *</label>
          <input className="input" name="name" required defaultValue={contact?.name} placeholder="Vollständiger Name" />
        </div>
        <div className="input-row">
          <div>
            <label className="input-label">{t('contact.status')}</label>
            <select className="select" name="status" defaultValue={contact?.status ?? 'lead'}>
              <option value="lead">{t('status.lead')}</option>
              <option value="aktiv">{t('status.aktiv')}</option>
              <option value="inaktiv">{t('status.inaktiv')}</option>
              <option value="vip">{t('status.vip')}</option>
            </select>
          </div>
          <div>
            <label className="input-label">{t('contact.priority')}</label>
            <select className="select" name="priority" defaultValue={contact?.priority ?? 'mittel'}>
              <option value="hoch">{t('priority.hoch')}</option>
              <option value="mittel">{t('priority.mittel')}</option>
              <option value="niedrig">{t('priority.niedrig')}</option>
            </select>
          </div>
        </div>
        <div>
          <label className="input-label">{t('contact.category')}</label>
          <div className="tag-chips-row" style={{ marginTop: 6 }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat} type="button"
                className={`tag-chip${categories.includes(cat) ? ' selected' : ''}`}
                onClick={() => toggleCat(cat)}
              >{cat}</button>
            ))}
          </div>
        </div>

        <hr className="form-divider" />
        <p className="section-label">{t('contact.contactInfo')}</p>
        <div className="input-row">
          <div>
            <label className="input-label">{t('contact.phone')}</label>
            <input className="input" name="phone" type="tel" defaultValue={contact?.phone ?? ''} placeholder="+49 123..." />
          </div>
          <div>
            <label className="input-label">{t('contact.email')}</label>
            <input className="input" name="email" type="email" defaultValue={contact?.email ?? ''} placeholder="name@email.com" />
          </div>
        </div>
        <div>
          <label className="input-label">{t('contact.socialLink')}</label>
          <input className="input" name="socialMedia" defaultValue={contact?.socialMedia ?? ''} placeholder="instagram.com/username" />
        </div>
        <div className="input-row">
          <div>
            <label className="input-label">Stadt</label>
            <input className="input" name="city" defaultValue={contact?.city ?? ''} />
          </div>
          <div>
            <label className="input-label">{t('contact.language')}</label>
            <input className="input" name="language" defaultValue={contact?.language ?? ''} placeholder="Deutsch, Español..." />
          </div>
        </div>
        <div className="input-row">
          <div>
            <label className="input-label">Land</label>
            <input className="input" name="country" defaultValue={contact?.country ?? ''} placeholder="DE, PY, ES..." />
          </div>
          <div>
            <label className="input-label">Alter</label>
            <input className="input" name="age" type="number" min="0" max="150" defaultValue={contact?.age ?? ''} />
          </div>
        </div>
        <div>
          <label className="input-label">Beruf</label>
          <input className="input" name="profession" defaultValue={contact?.profession ?? ''} />
        </div>
        <div>
          <label className="input-label">{t('contact.birthday')}</label>
          <input className="input" name="birthday" type="date" defaultValue={defDate(contact?.birthday)} />
        </div>

        <hr className="form-divider" />
        <p className="section-label">{t('contact.personalInfo')}</p>
        <div>
          <label className="input-label">Stärken</label>
          <textarea className="textarea" name="strengths" defaultValue={contact?.strengths ?? ''} placeholder="z.B. Verkaufen, Verhandeln..." />
        </div>
        <div>
          <label className="input-label">Bedürfnisse / Ziele</label>
          <textarea className="textarea" name="needs" defaultValue={contact?.needs ?? ''} placeholder="Was will die Person erreichen?" />
        </div>

        <hr className="form-divider" />
        <p className="section-label">Herkunft</p>
        <div className="input-row">
          <div>
            <label className="input-label">{t('contact.referredBy')}</label>
            <input className="input" name="referredBy" defaultValue={contact?.referredBy ?? ''} placeholder="Name der Person" />
          </div>
          <div>
            <label className="input-label">{t('contact.source')}</label>
            <input className="input" name="source" defaultValue={contact?.source ?? ''} placeholder="WhatsApp, Empfehlung..." />
          </div>
        </div>

        <hr className="form-divider" />
        <div>
          <label className="input-label">{t('contact.notes')}</label>
          <textarea className="textarea" name="notes" defaultValue={contact?.notes ?? ''} placeholder="Sensible Infos hier..." style={{ minHeight: 100 }} />
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 8 }}>
          <button type="button" className="btn btn-secondary btn-md" onClick={onCancel}>{t('common.cancel')}</button>
          <button type="submit" className="btn btn-primary btn-md" disabled={saving}>
            {saving ? t('common.loading') : t('common.save')}
          </button>
        </div>
      </div>
    </form>
  );
}
