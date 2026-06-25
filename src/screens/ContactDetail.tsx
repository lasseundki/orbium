import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Edit2, Trash2, Plus, MessageSquare, Bell, GitBranch } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useContacts } from '../hooks/useContacts';
import { useInteractions } from '../hooks/useInteractions';
import { useReminders } from '../hooks/useReminders';
import { usePipeline } from '../hooks/usePipeline';
import { useConnections } from '../hooks/useConnections';
import { useToast } from '../components/ui/Toast';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { StatusBadge, PriorityBadge, OutcomeBadge, TypeBadge } from '../components/ui/StatusBadge';
import ContactForm from '../components/contacts/ContactForm';
import InteractionModal from '../components/contacts/InteractionModal';
import ReminderModal from '../components/contacts/ReminderModal';
import { formatDate } from '../lib/utils';
import type { Contact } from '../types/index';

const PIPELINE_STAGES = ['lead', 'kontakt', 'praesentation', 'angebot', 'abschluss'];

export default function ContactDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const uid = user!.uid;
  const { showToast, toastEl } = useToast();

  const { contacts, updateContact, updateStatus, deleteContact } = useContacts(uid);
  const { interactions, addInteraction, deleteInteraction } = useInteractions(uid, id);
  const { reminders, addManualReminder } = useReminders(uid);
  const { pipelines, upsertPipeline } = usePipeline(uid);
  const { connections, addConnection, deleteConnection } = useConnections(uid);

  const [editing, setEditing] = useState(false);
  const [showInteraction, setShowInteraction] = useState(false);
  const [showReminder, setShowReminder] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [pipelineProject, setPipelineProject] = useState('');
  const [pipelineStage, setPipelineStage] = useState('');
  const [pipelineNotes, setPipelineNotes] = useState('');
  const [showPipeline, setShowPipeline] = useState(false);
  const [showConnModal, setShowConnModal] = useState(false);
  const [connToId, setConnToId] = useState('');
  const [connType, setConnType] = useState('Bekannte');
  const [connNote, setConnNote] = useState('');

  const contact = contacts.find(c => c.id === id);
  if (!contact) return <div className="screen"><p>{t('common.loading')}</p></div>;

  const contactReminders = reminders.filter(r => r.contactId === id && r.status === 'offen');
  const pipeline = pipelines.find(p => p.contactId === id);
  const myConnections = connections.filter(e => e.contactAId === id || e.contactBId === id);
  const referredByContact = contact.referredById ? contacts.find(c => c.id === contact.referredById) : null;

  const CONNECTION_TYPES = ['Familie', 'Freunde', 'Bekannte', 'Geschäft', 'Sport', 'Schule', 'Kirche', 'Sonstiges'];

  async function handleAddConnection() {
    if (!connToId) return;
    await addConnection(uid, { contactAId: id!, contactBId: connToId, type: connType, note: connNote || undefined });
    showToast('Verbindung gespeichert');
    setShowConnModal(false); setConnToId(''); setConnNote('');
  }

  async function handleUpdate(data: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) {
    await updateContact(uid, id!, data);
    showToast(t('contact.saved'));
    setEditing(false);
  }

  async function handleStatusChange(newStatus: Contact['status']) {
    const count = await updateStatus(uid, id!, newStatus, contact!.category);
    showToast(count > 0 ? t('contact.sequencesTriggered', { count }) : t('contact.statusChanged'));
  }

  async function handleDelete() {
    await deleteContact(uid, id!);
    showToast(t('contact.deleted'));
    navigate('/contacts');
  }

  async function handleAddInteraction(data: Parameters<typeof addInteraction>[1]) {
    await addInteraction(uid, data);
    showToast(t('interaction.saved'));
  }

  async function handleAddReminder(data: Parameters<typeof addManualReminder>[1]) {
    await addManualReminder(uid, data);
    showToast(t('reminder.saved'));
  }

  async function handlePipelineSave() {
    if (!pipelineProject || !pipelineStage) return;
    const count = await upsertPipeline(uid, id!, pipelineProject, pipelineStage, contact?.category ?? [], pipelineNotes);
    showToast(count > 0 ? t('contact.sequencesTriggered', { count }) : t('contact.pipelineSaved'));
    setShowPipeline(false);
  }

  if (editing) {
    return (
      <div className="screen">
        <div className="screen-header">
          <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>
            <ArrowLeft size={16} /> {t('common.back')}
          </button>
        </div>
        <div className="card">
          <ContactForm contact={contact} contacts={contacts} onSubmit={handleUpdate} onCancel={() => setEditing(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      {toastEl}

      {/* Header */}
      <div className="screen-header">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/contacts')}>
          <ArrowLeft size={16} /> {t('common.back')}
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>
            <Edit2 size={14} /> {t('common.edit')}
          </button>
          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-error)' }} onClick={() => setShowDelete(true)}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Hero */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div className={`contact-avatar avatar-${contact.id.charCodeAt(0) % 5}`} style={{ width: 56, height: 56, fontSize: 20 }}>
            {contact.name.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700, marginBottom: 6 }}>{contact.name}</h1>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
              <StatusBadge status={contact.status} />
              <PriorityBadge priority={contact.priority} />
              {contact.category.map(cat => <span key={cat} className="badge badge-neutral">{cat}</span>)}
            </div>
            {(contact.company || contact.role) && (
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                {[contact.role, contact.company].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
        </div>

        {/* Status change */}
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--color-border)' }}>
          <p className="detail-section-title">{t('contact.statusLabel')}</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(['lead', 'aktiv', 'inaktiv', 'vip'] as Contact['status'][]).map(s => (
              <button
                key={s}
                className={`btn btn-sm ${contact.status === s ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => contact.status !== s && handleStatusChange(s)}
              >{t(`status.${s}`)}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button className="btn btn-outline btn-sm" onClick={() => setShowInteraction(true)}>
          <MessageSquare size={14} /> {t('contact.addInteraction')}
        </button>
        <button className="btn btn-outline btn-sm" onClick={() => setShowReminder(true)}>
          <Bell size={14} /> {t('contact.addReminder')}
        </button>
        <button className="btn btn-outline btn-sm" onClick={() => setShowPipeline(true)}>
          <GitBranch size={14} /> {t('contact.setPipeline')}
        </button>
      </div>

      {/* Open reminders */}
      {contactReminders.length > 0 && (
        <div className="card" style={{ marginBottom: 16, borderColor: 'var(--color-warning)' }}>
          <p className="detail-section-title" style={{ color: 'var(--color-warning)' }}>
            {t('nav.reminders')} ({contactReminders.length})
          </p>
          {contactReminders.map(r => (
            <div key={r.id} style={{ fontSize: 13, padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ color: r.dueDate < Date.now() ? 'var(--color-error)' : 'var(--color-text-secondary)' }}>
                {formatDate(r.dueDate)}
              </span>{' '}— {r.message}
            </div>
          ))}
        </div>
      )}

      {/* Contact info */}
      <div className="card" style={{ marginBottom: 16 }}>
        <p className="detail-section-title">{t('contact.contactInfo')}</p>
        {[
          { label: t('contact.phone'), value: contact.phone ? <a href={`tel:${contact.phone}`}>{contact.phone}</a> : null },
          { label: t('contact.email'), value: contact.email ? <a href={`mailto:${contact.email}`}>{contact.email}</a> : null },
          { label: t('contact.socialLink'), value: contact.socialMedia ? <a href={contact.socialMedia.startsWith('http') ? contact.socialMedia : `https://${contact.socialMedia}`} target="_blank" rel="noreferrer">{contact.socialMedia}</a> : null },
          { label: 'Stadt', value: [contact.city, contact.country].filter(Boolean).join(', ') || null },
          { label: t('contact.language'), value: contact.language },
          { label: 'Alter', value: contact.age },
          { label: 'Beruf', value: contact.profession },
          { label: t('contact.birthday'), value: contact.birthday ? formatDate(contact.birthday) : null },
        ].filter(row => row.value).map(row => (
          <div key={row.label} className="detail-row">
            <span className="detail-label">{row.label}</span>
            <span className="detail-value">{row.value}</span>
          </div>
        ))}
      </div>

      {/* Personal info */}
      {(contact.strengths || contact.needs || contact.referredBy || contact.source || contact.notes) && (
        <div className="card" style={{ marginBottom: 16 }}>
          <p className="detail-section-title">{t('contact.personalInfo')}</p>
          {[
            { label: 'Stärken', value: contact.strengths },
            { label: 'Bedürfnisse', value: contact.needs },
            { label: t('contact.referredBy'), value: referredByContact ? referredByContact.name : contact.referredBy },
            { label: t('contact.source'), value: contact.source },
            { label: t('contact.notes'), value: contact.notes },
          ].filter(r => r.value).map(row => (
            <div key={row.label} className="detail-row">
              <span className="detail-label">{row.label}</span>
              <span className="detail-value" style={{ whiteSpace: 'pre-wrap' }}>{row.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Pipeline */}
      {pipeline && (
        <div className="card" style={{ marginBottom: 16 }}>
          <p className="detail-section-title">{t('nav.pipeline')}</p>
          <div className="detail-row">
            <span className="detail-label">{t('contact.pipelineProject')}</span>
            <span className="detail-value">{pipeline.project}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">{t('contact.pipelineStage')}</span>
            <span className="detail-value">{pipeline.stage}</span>
          </div>
          {pipeline.notes && (
            <div className="detail-row">
              <span className="detail-label">{t('contact.pipelineNotes')}</span>
              <span className="detail-value">{pipeline.notes}</span>
            </div>
          )}
        </div>
      )}

      {/* Connections */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <p className="detail-section-title" style={{ marginBottom: 0 }}>Verbindungen</p>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowConnModal(true)}>
            <Plus size={14} /> Hinzufügen
          </button>
        </div>
        {myConnections.length === 0
          ? <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Noch keine Verbindungen</p>
          : myConnections.map(e => {
            const otherId = e.contactAId === id ? e.contactBId : e.contactAId;
            const other = contacts.find(c => c.id === otherId);
            return (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid var(--color-border)', fontSize: 13 }}>
                <span className="badge badge-neutral">{e.type}</span>
                <span
                  style={{ flex: 1, color: 'var(--color-accent)', cursor: 'pointer', fontWeight: 500 }}
                  onClick={() => navigate(`/contacts/${otherId}`)}
                >{other?.name ?? otherId}</span>
                {e.note && <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>{e.note}</span>}
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-error)', padding: '2px 6px' }}
                  onClick={() => deleteConnection(uid, e.id)}>✕</button>
              </div>
            );
          })
        }
      </div>

      {/* Interactions */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <p className="detail-section-title" style={{ marginBottom: 0 }}>{t('contact.interactions')}</p>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowInteraction(true)}>
            <Plus size={14} /> {t('common.add')}
          </button>
        </div>
        {interactions.length === 0
          ? <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{t('contact.noInteractions')}</p>
          : interactions.map(i => (
            <div key={i.id} className="interaction-item">
              <div className="interaction-header">
                <TypeBadge type={i.type} />
                <OutcomeBadge outcome={i.outcome} />
                <span className="interaction-date">{formatDate(i.date)}</span>
                <button
                  className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto', color: 'var(--color-text-muted)', padding: '4px 6px' }}
                  onClick={() => deleteInteraction(uid, i.id)}
                ><Trash2 size={13} /></button>
              </div>
              <p className="interaction-summary">{i.summary}</p>
              {i.nextAction && (
                <p className="interaction-next">→ {i.nextAction}{i.nextActionDue ? ` (${formatDate(i.nextActionDue)})` : ''}</p>
              )}
            </div>
          ))
        }
      </div>

      {/* Modals */}
      {showInteraction && (
        <InteractionModal
          contactId={id!}
          onClose={() => setShowInteraction(false)}
          onSubmit={handleAddInteraction}
        />
      )}
      {showReminder && (
        <ReminderModal
          contactId={id!}
          contactName={contact.name}
          onClose={() => setShowReminder(false)}
          onSubmit={handleAddReminder}
        />
      )}
      {showDelete && (
        <ConfirmDialog
          message={t('contact.confirmDelete')}
          subMessage={t('contact.deleteWarning')}
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
        />
      )}

      {showConnModal && (
        <div className="modal-overlay" onClick={() => setShowConnModal(false)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Verbindung hinzufügen</h2>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowConnModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div>
                <label className="input-label">Verbunden mit</label>
                <select className="select" value={connToId} onChange={e => setConnToId(e.target.value)}>
                  <option value="">Kontakt wählen…</option>
                  {contacts.filter(c => c.id !== id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Verbindungstyp</label>
                <select className="select" value={connType} onChange={e => setConnType(e.target.value)}>
                  {CONNECTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Notiz (optional)</label>
                <input className="input" value={connNote} onChange={e => setConnNote(e.target.value)} placeholder="z.B. Freunde seit Schulzeit" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary btn-md" onClick={() => setShowConnModal(false)}>Abbrechen</button>
              <button className="btn btn-primary btn-md" onClick={handleAddConnection} disabled={!connToId}>Speichern</button>
            </div>
          </div>
        </div>
      )}

      {/* Pipeline modal */}
      {showPipeline && (
        <div className="modal-overlay" onClick={() => setShowPipeline(false)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{t('contact.setPipeline')}</h2>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowPipeline(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div>
                <label className="input-label">{t('contact.pipelineProject')}</label>
                <input className="input" value={pipelineProject} onChange={e => setPipelineProject(e.target.value)} placeholder="awaqe, preply, ..." />
              </div>
              <div>
                <label className="input-label">{t('contact.pipelineStage')}</label>
                <select className="select" value={pipelineStage} onChange={e => setPipelineStage(e.target.value)}>
                  <option value="">{t('common.none')}</option>
                  {PIPELINE_STAGES.map(s => <option key={s} value={s}>{t(`pipeline.stages.${s}`)}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">{t('contact.pipelineNotes')} {t('common.optional')}</label>
                <textarea className="textarea" value={pipelineNotes} onChange={e => setPipelineNotes(e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary btn-md" onClick={() => setShowPipeline(false)}>{t('common.cancel')}</button>
              <button className="btn btn-primary btn-md" onClick={handlePipelineSave} disabled={!pipelineProject || !pipelineStage}>{t('common.save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
