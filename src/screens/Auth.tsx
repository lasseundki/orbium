import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

export default function Auth() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const fd = new FormData(e.currentTarget);
    const email = fd.get('email') as string;
    const password = fd.get('password') as string;
    const passwordConfirm = fd.get('passwordConfirm') as string;

    if (mode === 'register' && password !== passwordConfirm) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      const code = err.code ?? '';
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError(t('auth.invalidCredentials'));
      } else if (code === 'auth/email-already-in-use') {
        setError(t('auth.emailInUse'));
      } else if (code === 'auth/weak-password') {
        setError(t('auth.weakPassword'));
      } else {
        setError(err.message ?? t('common.error'));
      }
    } finally {
      setLoading(false);
    }
  }

  const isRegister = mode === 'register';

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-mark">Ob</div>
        </div>
        <h1 className="auth-title">Orbium</h1>
        <p className="auth-subtitle">
          {isRegister ? t('auth.subtitleRegister') : t('auth.subtitle')}
        </p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="input-label">{t('auth.email')}</label>
            <input
              className="input" name="email" type="email" required
              placeholder={t('auth.emailPlaceholder')} autoComplete="email"
            />
          </div>
          <div>
            <label className="input-label">{t('auth.password')}</label>
            <input
              className="input" name="password" type="password" required
              placeholder={t('auth.passwordPlaceholder')}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              minLength={isRegister ? 6 : undefined}
            />
          </div>
          {isRegister && (
            <div>
              <label className="input-label">{t('auth.passwordConfirm')}</label>
              <input
                className="input" name="passwordConfirm" type="password" required
                placeholder={t('auth.passwordPlaceholder')} autoComplete="new-password"
              />
            </div>
          )}
          <button type="submit" className="btn btn-primary btn-lg" style={{ marginTop: 4 }} disabled={loading}>
            {loading ? t('auth.loading') : isRegister ? t('auth.register') : t('auth.login')}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: 'var(--color-text-muted)' }}>
          {isRegister ? (
            <>
              {t('auth.hasAccount')}{' '}
              <button
                onClick={() => { setMode('login'); setError(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--color-accent)', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
              >
                {t('auth.login')}
              </button>
            </>
          ) : (
            <>
              {t('auth.noAccount')}{' '}
              <button
                onClick={() => { setMode('register'); setError(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--color-accent)', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
              >
                {t('auth.register')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
