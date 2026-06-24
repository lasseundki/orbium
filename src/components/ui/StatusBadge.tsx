import { useTranslation } from 'react-i18next';
import type { ContactStatus, ContactPriority } from '../../types/index';

export function StatusBadge({ status }: { status: ContactStatus }) {
  const { t } = useTranslation();
  return <span className={`badge badge-${status}`}>{t(`status.${status}`)}</span>;
}

export function PriorityBadge({ priority }: { priority: ContactPriority }) {
  const { t } = useTranslation();
  return <span className={`badge badge-${priority}`}>{t(`priority.${priority}`)}</span>;
}

export function OutcomeBadge({ outcome }: { outcome: string }) {
  const { t } = useTranslation();
  const key = `interaction.outcomes.${outcome}`;
  return (
    <span className={`badge badge-${outcome === 'kein_kontakt' ? 'neutral' : outcome}`}>
      {t(key, outcome)}
    </span>
  );
}

export function TypeBadge({ type }: { type: string }) {
  const { t } = useTranslation();
  return (
    <span className="badge badge-neutral">{t(`interaction.types.${type}`, type)}</span>
  );
}
