import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { signOut } from 'firebase/auth';
import { Plus, Trash2, ChevronDown, ChevronUp, Download, Upload, LogOut } from 'lucide-react';
import { auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useContacts } from '../hooks/useContacts';
import { useSequences } from '../hooks/useSequences';
import { useToast } from '../components/ui/Toast';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import type { ReminderSequence, SequenceStep, TriggerType } from '../types/index';
import i18n from '../i18n/index';

const TRIGGER_TYPES: TriggerType[] = ['status_change', 'stage_change', 'manual'];

const VALID_STATUSES = ['lead', 'aktiv', 'inaktiv', 'vip'] as const;
const VALID_PRIORITIES = ['hoch', 'mittel', 'niedrig'] as const;

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim()); current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function emptyStep(): Omit<SequenceStep, 'id'> {
  return { offsetDays: 3, message: '' };
}

function emptySequence(): Omit<ReminderSequence, 'id' | 'createdAt'> {
  return { name: '', triggerType: 'status_change', triggerValue: '', isActive: true, steps: [] };
}

export default function Settings() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const uid = user!.uid;
  const { contacts } = useContacts(uid);
  const { sequences, addSequence, updateSequence, deleteSequence } = useSequences(uid);
  const { showToast, toastEl } = useToast();

  const [lang, setLang] = useState(i18n.language);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editSeq, setEditSeq] = useState<Partial<ReminderSequence> | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function changeLang(l: string) {
    setLang(l);
    i18n.changeLanguage(l);
    localStorage.setItem('crm_lang', l);
  }

  function exportCsv() {
    const header = ['Name', 'Status', 'Priorität', 'Kategorien', 'E-Mail', 'Telefon', 'Unternehmen', 'Notizen'].join(',');
    const rows = contacts.map(c =>
      [c.name, c.status, c.priority, c.category.join('|'), c.email ?? '', c.phone ?? '', c.company ?? '', c.notes ?? '']
        .map(v => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'crm-kontakte.csv'; a.click();
    URL.revokeObjectURL(url);
    showToast('CSV exportiert');
  }

  async function importCsv(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) { showToast('Keine Daten gefunden'); return; }

      const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase().replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u'));
      const col = (names: string[]) => names.map(n => headers.indexOf(n)).find(i => i >= 0) ?? -1;

      const iName     = col(['name']);
      const iStatus   = col(['status']);
      const iPriority = col(['prioritat', 'priority', 'priorität']);
      const iCategory = col(['kategorien', 'categories', 'kategorie', 'category']);
      const iEmail    = col(['e-mail', 'email']);
      const iPhone    = col(['telefon', 'phone', 'tel']);
      const iCompany  = col(['unternehmen', 'company', 'firma']);
      const iNotes    = col(['notizen', 'notes', 'notiz']);

      if (iName < 0) { showToast('Spalte "Name" nicht gefunden'); return; }

      let count = 0;
      for (let i = 1; i < lines.length; i++) {
        const cols = parseCsvLine(lines[i]);
        const name = cols[iName];
        if (!name) continue;

        const rawStatus   = iStatus   >= 0 ? cols[iStatus]?.toLowerCase()   : '';
        const rawPriority = iPriority >= 0 ? cols[iPriority]?.toLowerCase() : '';

        await addContact(uid, {
          name,
          status:   VALID_STATUSES.includes(rawStatus as typeof VALID_STATUSES[number])   ? rawStatus   as typeof VALID_STATUSES[number]   : 'lead',
          priority: VALID_PRIORITIES.includes(rawPriority as typeof VALID_PRIORITIES[number]) ? rawPriority as typeof VALID_PRIORITIES[number] : 'mittel',
          category: iCategory >= 0 && cols[iCategory] ? cols[iCategory].split('|').filter(Boolean) : [],
          email:    iEmail   >= 0 ? cols[iEmail]   || undefined : undefined,
          phone:    iPhone   >= 0 ? cols[iPhone]   || undefined : undefined,
          company:  iCompany >= 0 ? cols[iCompany] || undefined : undefined,
          notes:    iNotes   >= 0 ? cols[iNotes]   || undefined : undefined,
        });
        count++;
      }
      showToast(`${count} Kontakt${count !== 1 ? 'e' : ''} importiert`);
    } catch {
      showToast('Fehler beim Import');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function saveSequence() {
    if (!editSeq || !editSeq.name || !editSeq.triggerValue) return;
    const steps = (editSeq.steps ?? []).map((s, i) => ({ ...s, id: String(i) }));
    const data = { ...editSeq, steps, isActive: editSeq.isActive ?? true } as Omit<ReminderSequence, 'id' | 'createdAt'>;
    if (editSeq.id) {
      await updateSequence(uid, editSeq.id, data);
    } else {
      await addSequence(uid, data);
    }
    showToast(t('settings.saved'));
    setEditSeq(null);
  }

  async function handleDelete(id: string) {
    await deleteSequence(uid, id);
    showToast(t('settings.deleted'));
    setDeleteId(null);
  }

  function addStep() {
    setEditSeq(prev => prev ? { ...prev, steps: [...(prev.steps ?? []), { id: '', offsetDays: 3, message: '' }] } : prev);
  }

  function updateStep(idx: number, field: keyof SequenceStep, value: string | number) {
    setEditSeq(prev => {
      if (!prev) return prev;
      const steps = [...(prev.steps ?? [])];
      steps[idx] = { ...steps[idx], [field]: value };
      return { ...prev, steps };
    });
  }

  function removeStep(idx: number) {
    setEditSeq(prev => {
      if (!prev) return prev;
      const steps = [...(prev.steps ?? [])];
      steps.splice(idx, 1);
      return { ...prev, steps };
    });
  }

  return (
    <div className="screen">
      {toastEl}
      <div className="screen-header">
        <h1 className="screen-title">{t('settings.title')}</h1>
      </div>

      {/* Language */}
      <div className="settings-section">
        <div className="settings-section-title">{t('settings.language')}</div>
        <div className="settings-row">
          <span className="settings-row-label">{t('settings.language')}</span>
          <div className="lang-buttons">
            {['de', 'en', 'es'].map(l => (
              <button key={l} className={`lang-btn${lang === l ? ' active' : ''}`} onClick={() => changeLang(l)}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Export / Import */}
      <div className="settings-section">
        <div className="settings-section-title">{t('settings.export')}</div>
        <div className="settings-row">
          <span className="settings-row-label">{t('settings.exportCsv')} ({contacts.length})</span>
          <button className="btn btn-secondary btn-sm" onClick={exportCsv}>
            <Download size={14} /> {t('settings.exportBtn')}
          </button>
        </div>
        <div className="settings-row">
          <span className="settings-row-label">{t('settings.importCsv')}</span>
          <button className="btn btn-secondary btn-sm" disabled={importing} onClick={() => fileInputRef.current?.click()}>
            <Upload size={14} /> {importing ? '…' : t('settings.importBtn')}
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          style={{ display: 'none' }}
          onChange={importCsv}
        />
      </div>

      {/* Account */}
      <div className="settings-section">
        <div className="settings-section-title">{t('settings.account')}</div>
        <div className="settings-row">
          <span className="settings-row-label">{user?.email}</span>
          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-text-muted)' }} onClick={() => signOut(auth)}>
            <LogOut size={14} /> {t('auth.logout')}
          </button>
        </div>
      </div>

      {/* Sequences */}
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 600 }}>{t('settings.sequences')}</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setEditSeq(emptySequence())}>
          <Plus size={14} /> {t('settings.newSequence')}
        </button>
      </div>

      {sequences.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔔</div>
          <div className="empty-title">{t('settings.noSequences')}</div>
          <div className="empty-desc">{t('settings.noSequencesDesc')}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sequences.map(seq => (
            <div key={seq.id} className="card">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{seq.name}</span>
                    <span className={`badge badge-${seq.isActive ? 'aktiv' : 'inaktiv'}`}>{seq.isActive ? 'Aktiv' : 'Inaktiv'}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                    {t(`settings.trigger.${seq.triggerType}`)} → {seq.triggerValue}
                    {seq.project ? ` · ${seq.project}` : ''}
                    {' · '}{seq.steps.length} Schritte
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setExpandedId(expandedId === seq.id ? null : seq.id)}>
                    {expandedId === seq.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setEditSeq({ ...seq })}>
                    <span style={{ fontSize: 14 }}>✏️</span>
                  </button>
                  <button className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--color-error)' }} onClick={() => setDeleteId(seq.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {expandedId === seq.id && seq.steps.length > 0 && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--color-border)' }}>
                  {seq.steps.map((step, i) => (
                    <div key={i} style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                      <span style={{ fontWeight: 600, color: 'var(--color-accent)' }}>+{step.offsetDays}d</span> {step.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Sequence editor modal */}
      {editSeq && (
        <div className="modal-overlay" onClick={() => setEditSeq(null)}>
          <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editSeq.id ? t('settings.editSequence') : t('settings.newSequence')}</h2>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setEditSeq(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '65dvh', overflowY: 'auto' }}>
              <div>
                <label className="input-label">{t('settings.sequenceName')} *</label>
                <input className="input" value={editSeq.name ?? ''} onChange={e => setEditSeq(p => p ? { ...p, name: e.target.value } : p)} />
              </div>
              <div className="input-row">
                <div>
                  <label className="input-label">{t('settings.triggerType')}</label>
                  <select className="select" value={editSeq.triggerType ?? 'status_change'} onChange={e => setEditSeq(p => p ? { ...p, triggerType: e.target.value as TriggerType } : p)}>
                    {TRIGGER_TYPES.map(tt => <option key={tt} value={tt}>{t(`settings.trigger.${tt}`)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="input-label">{t('settings.triggerValue')} *</label>
                  <input className="input" value={editSeq.triggerValue ?? ''} onChange={e => setEditSeq(p => p ? { ...p, triggerValue: e.target.value } : p)} placeholder="aktiv, lead, praesentation..." />
                </div>
              </div>
              <div className="input-row">
                <div>
                  <label className="input-label">{t('settings.project')} {t('common.optional')}</label>
                  <input className="input" value={editSeq.project ?? ''} onChange={e => setEditSeq(p => p ? { ...p, project: e.target.value } : p)} />
                </div>
                <div>
                  <label className="input-label">{t('settings.isActive')}</label>
                  <select className="select" value={editSeq.isActive ? 'yes' : 'no'} onChange={e => setEditSeq(p => p ? { ...p, isActive: e.target.value === 'yes' } : p)}>
                    <option value="yes">{t('common.yes')}</option>
                    <option value="no">{t('common.no')}</option>
                  </select>
                </div>
              </div>

              <hr className="form-divider" />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <p className="section-label">{t('settings.steps')}</p>
                <button className="btn btn-ghost btn-sm" type="button" onClick={addStep}>
                  <Plus size={14} /> {t('settings.addStep')}
                </button>
              </div>
              {(editSeq.steps ?? []).map((step, i) => (
                <div key={i} style={{ background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 12, marginBottom: 8 }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-end' }}>
                    <div style={{ width: 80 }}>
                      <label className="input-label">{t('settings.stepOffset')}</label>
                      <input className="input" type="number" min="0" value={step.offsetDays} onChange={e => updateStep(i, 'offsetDays', Number(e.target.value))} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label className="input-label">{t('settings.stepMessage')}</label>
                      <input className="input" value={step.message} onChange={e => updateStep(i, 'message', e.target.value)} />
                    </div>
                    <button className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--color-error)', marginBottom: 1 }} onClick={() => removeStep(i)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary btn-md" onClick={() => setEditSeq(null)}>{t('common.cancel')}</button>
              <button className="btn btn-primary btn-md" onClick={saveSequence} disabled={!editSeq.name || !editSeq.triggerValue}>{t('common.save')}</button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <ConfirmDialog
          message={t('settings.confirmDelete')}
          onConfirm={() => handleDelete(deleteId)}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
