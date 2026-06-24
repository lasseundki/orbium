import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useContacts } from '../hooks/useContacts';
import { useToast } from '../components/ui/Toast';
import { StatusBadge, PriorityBadge } from '../components/ui/StatusBadge';
import ContactForm from '../components/contacts/ContactForm';
import type { Contact } from '../types/index';

type StatusFilter = 'alle' | Contact['status'];

export default function Contacts() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const uid = user!.uid;
  const { contacts, addContact } = useContacts(uid);
  const { showToast, toastEl } = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('alle');
  const [showForm, setShowForm] = useState(false);

  const filtered = contacts.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase())
      || c.email?.toLowerCase().includes(search.toLowerCase())
      || c.company?.toLowerCase().includes(search.toLowerCase())
      || c.category.some(cat => cat.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === 'alle' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusOptions: StatusFilter[] = ['alle', 'lead', 'aktiv', 'inaktiv', 'vip'];

  async function handleCreate(data: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) {
    const id = await addContact(uid, data);
    showToast(t('contact.saved'));
    setShowForm(false);
    navigate(`/contacts/${id}`);
  }

  return (
    <div className="screen">
      {toastEl}
      <div className="screen-header">
        <h1 className="screen-title">{t('nav.contacts')}</h1>
        <button className="btn btn-primary btn-md" onClick={() => setShowForm(true)}>
          <Plus size={16} /> {t('contact.newContact')}
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
        <input
          className="input"
          placeholder={t('contact.search')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ paddingLeft: 36 }}
        />
      </div>

      {/* Status filter */}
      <div className="filter-bar" style={{ marginBottom: 16 }}>
        {statusOptions.map(s => (
          <button
            key={s}
            className={`filter-chip${statusFilter === s ? ' active' : ''}`}
            onClick={() => setStatusFilter(s)}
          >
            {s === 'alle' ? t('common.all') : t(`status.${s}`)}
            {s === 'alle' ? ` (${contacts.length})` : ''}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <div className="empty-title">{search || statusFilter !== 'alle' ? t('contact.noResults') : t('contact.noContacts')}</div>
          <div className="empty-desc">{search || statusFilter !== 'alle' ? t('contact.noResultsDesc') : t('contact.noContactsDesc')}</div>
          {!search && statusFilter === 'alle' && (
            <button className="btn btn-primary btn-md" onClick={() => setShowForm(true)}>
              <Plus size={16} /> {t('contact.newContact')}
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(c => (
            <div key={c.id} className="contact-card" onClick={() => navigate(`/contacts/${c.id}`)}>
              <div className={`contact-avatar avatar-${c.id.charCodeAt(0) % 5}`}>
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</span>
                  <StatusBadge status={c.status} />
                  <PriorityBadge priority={c.priority} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  {c.category.length > 0 && <span>{c.category.slice(0, 3).join(' · ')}</span>}
                  {c.company && <span>{c.category.length ? ' · ' : ''}{c.company}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New contact modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{t('contact.newContact')}</h2>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ paddingBottom: 0 }}>
              <ContactForm
                onSubmit={handleCreate}
                onCancel={() => setShowForm(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
