import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
  message: string;
  subMessage?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export default function ConfirmDialog({ message, subMessage, onConfirm, onCancel, danger = true }: Props) {
  const { t } = useTranslation();

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal"
        style={{ maxWidth: 380, borderRadius: 'var(--radius-xl)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-body" style={{ alignItems: 'center', textAlign: 'center', paddingTop: 32, paddingBottom: 20 }}>
          <div style={{ color: 'var(--color-error)', marginBottom: 12 }}>
            <AlertTriangle size={32} />
          </div>
          <p style={{ fontSize: 15, color: 'var(--color-text-primary)', lineHeight: 1.6, marginBottom: subMessage ? 6 : 0 }}>
            {message}
          </p>
          {subMessage && (
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{subMessage}</p>
          )}
        </div>
        <div className="modal-footer" style={{ justifyContent: 'center', paddingTop: 12 }}>
          <button className="btn btn-secondary btn-md" onClick={onCancel}>{t('common.cancel')}</button>
          <button className={`btn btn-md ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>
            {t('common.delete')}
          </button>
        </div>
      </div>
    </div>
  );
}
