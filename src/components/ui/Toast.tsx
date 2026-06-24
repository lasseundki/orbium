import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type?: 'default' | 'success';
  duration?: number;
  onClose: () => void;
}

export default function Toast({ message, type = 'default', duration = 3500, onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [duration, onClose]);

  return (
    <div className={`toast${type === 'success' ? ' toast-success' : ''}`}>
      {message}
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState<{ message: string; type?: 'default' | 'success' } | null>(null);

  function showToast(message: string, type: 'default' | 'success' = 'success') {
    setToast({ message, type });
  }

  const toastEl = toast
    ? <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
    : null;

  return { showToast, toastEl };
}
