import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePipeline } from '../hooks/usePipeline';
import { useContacts } from '../hooks/useContacts';
import { useToast } from '../components/ui/Toast';

const STAGES = ['lead', 'kontakt', 'praesentation', 'angebot', 'abschluss'];

export default function Pipeline() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const uid = user!.uid;
  const { pipelines, moveCard } = usePipeline(uid);
  const { contacts } = useContacts(uid);
  const { showToast, toastEl } = useToast();

  const dragId = useRef<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  function getContact(contactId: string) {
    return contacts.find(c => c.id === contactId);
  }

  function handleDragStart(pipelineId: string) {
    dragId.current = pipelineId;
  }

  async function handleDrop(stage: string) {
    if (!dragId.current) return;
    setDragOver(null);
    const card = pipelines.find(p => p.id === dragId.current);
    if (!card || card.stage === stage) { dragId.current = null; return; }
    const contact = getContact(card.contactId);
    const count = await moveCard(uid, dragId.current, stage, contact?.category ?? [], card.project);
    dragId.current = null;
    showToast(count > 0 ? t('pipeline.sequencesTriggered', { count }) : t('pipeline.moved'));
  }

  const projects = [...new Set(pipelines.map(p => p.project))];
  const [activeProject, setActiveProject] = useState<string>('');
  const visibleProject = activeProject || projects[0] || '';

  const boardCards = pipelines.filter(p => !visibleProject || p.project === visibleProject);

  return (
    <div className="screen-wide">
      {toastEl}
      <div className="screen-header">
        <h1 className="screen-title">{t('pipeline.title')}</h1>
        {projects.length > 1 && (
          <div className="filter-bar">
            {projects.map(p => (
              <button
                key={p}
                className={`filter-chip${visibleProject === p ? ' active' : ''}`}
                onClick={() => setActiveProject(p)}
              >{p}</button>
            ))}
          </div>
        )}
      </div>

      {pipelines.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔀</div>
          <div className="empty-title">{t('pipeline.title')}</div>
          <div className="empty-desc">Füge Kontakte über die Kontaktseite zum Pipeline hinzu.</div>
        </div>
      ) : (
        <div className="kanban-board">
          {STAGES.map(stage => {
            const cards = boardCards.filter(p => p.stage === stage);
            return (
              <div
                key={stage}
                className={`kanban-col${dragOver === stage ? ' kanban-drop-active' : ''}`}
                onDragOver={e => { e.preventDefault(); setDragOver(stage); }}
                onDragLeave={() => setDragOver(null)}
                onDrop={() => handleDrop(stage)}
              >
                <div className="kanban-col-header">
                  {t(`pipeline.stages.${stage}`)}
                  <span className="kanban-col-count">{cards.length}</span>
                </div>
                {cards.map(card => {
                  const contact = getContact(card.contactId);
                  return (
                    <div
                      key={card.id}
                      className="kanban-card"
                      draggable
                      onDragStart={() => handleDragStart(card.id)}
                      onClick={() => contact && navigate(`/contacts/${contact.id}`)}
                    >
                      <div className="kanban-card-name">{contact?.name ?? '–'}</div>
                      {contact?.category && contact.category.length > 0 && (
                        <div className="kanban-card-meta">{contact.category.slice(0, 2).join(' · ')}</div>
                      )}
                      {card.notes && (
                        <div className="kanban-card-meta" style={{ marginTop: 6, color: 'var(--color-text-secondary)', fontSize: 11 }}>{card.notes}</div>
                      )}
                    </div>
                  );
                })}
                {cards.length === 0 && (
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center', padding: '12px 0' }}>
                    {t('pipeline.noCards')}
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
