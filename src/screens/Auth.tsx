import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { Eye, EyeOff } from 'lucide-react';
import { auth } from '../firebase';

type Mode = 'login' | 'register' | 'reset';

interface AuthError {
  message: string;
  action?: { label: string; mode: Mode };
}

function parseError(code: string, mode: Mode): AuthError {
  switch (code) {
    case 'auth/user-not-found':
      return { message: 'Kein Konto mit dieser E-Mail.', action: { label: 'Jetzt registrieren →', mode: 'register' } };
    case 'auth/wrong-password':
      return { message: 'Falsches Passwort.', action: { label: 'Passwort vergessen? →', mode: 'reset' } };
    case 'auth/invalid-credential':
      return mode === 'login'
        ? { message: 'E-Mail oder Passwort falsch.', action: { label: 'Noch kein Konto? Registrieren →', mode: 'register' } }
        : { message: 'Ungültige Anmeldedaten.' };
    case 'auth/email-already-in-use':
      return { message: 'Diese E-Mail ist bereits registriert.', action: { label: 'Stattdessen anmelden →', mode: 'login' } };
    case 'auth/weak-password':
      return { message: 'Passwort muss mindestens 6 Zeichen haben.' };
    case 'auth/invalid-email':
      return { message: 'Ungültige E-Mail-Adresse.' };
    case 'auth/too-many-requests':
      return { message: 'Zu viele Versuche. Bitte kurz warten.', action: { label: 'Passwort zurücksetzen →', mode: 'reset' } };
    default:
      return { message: `Fehler: ${code || 'unbekannt'}` };
  }
}

export default function Auth() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<AuthError | null>(null);
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  function switchMode(m: Mode) {
    setMode(m);
    setAuthError(null);
    setInfo('');
    setPassword('');
    setPasswordConfirm('');
    setShowPassword(false);
  }

  async function handle(e: FormEvent) {
    e.preventDefault();
    setAuthError(null);
    setInfo('');

    if (mode === 'register' && password !== passwordConfirm) {
      setAuthError({ message: t('auth.passwordMismatch') });
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else if (mode === 'register') {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await sendPasswordResetEmail(auth, email);
        setInfo(t('auth.resetSent'));
        setMode('login');
      }
    } catch (err) {
      const code = err instanceof FirebaseError ? err.code : '';
      setAuthError(parseError(code, mode));
    } finally {
      setLoading(false);
    }
  }

  const modeLabel =
    mode === 'login' ? t('auth.loginTitle') :
    mode === 'register' ? t('auth.registerTitle') :
    t('auth.forgotPassword');

  return (
    <div className="auth-screen">
      <div className="auth-card">

        <div className="auth-logo">
          <img src={import.meta.env.BASE_URL + 'favicon.svg'} alt="Orbium" width={52} height={52} style={{ borderRadius: 14 }} />
        </div>
        <h1 className="auth-title">Orbium</h1>
        <p className="auth-subtitle">{modeLabel}</p>

        {authError && (
          <div className="auth-error">
            <span>{authError.message}</span>
            {authError.action && (
              <button type="button" className="auth-error-action" onClick={() => switchMode(authError.action!.mode)}>
                {authError.action.label}
              </button>
            )}
          </div>
        )}

        {info && (
          <div style={{ fontSize: 13, color: '#059669', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 'var(--radius-md)', padding: 12, marginBottom: 16 }}>
            {info}
          </div>
        )}

        <form onSubmit={handle} className="auth-form">
          <div>
            <label className="input-label">{t('auth.email')}</label>
            <input
              className="input"
              type="email"
              required
              autoFocus
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@example.com"
              autoComplete="email"
            />
          </div>

          {mode !== 'reset' && (
            <div>
              <label className="input-label">{t('auth.password')}</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 4 }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="input-label">{t('auth.passwordConfirm')}</label>
              <input
                className="input"
                type="password"
                required
                value={passwordConfirm}
                onChange={e => setPasswordConfirm(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>
          )}

          {mode === 'login' && (
            <div style={{ textAlign: 'right' }}>
              <button type="button" onClick={() => switchMode('reset')} style={{ background: 'none', border: 'none', color: 'var(--color-accent)', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                {t('auth.forgotPassword')}
              </button>
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%' }}>
            {loading ? '…' :
              mode === 'login' ? t('auth.login') :
              mode === 'register' ? t('auth.register') :
              t('auth.sendReset')}
          </button>
        </form>

        <div className="auth-links">
          {mode === 'login' && (
            <button className="btn btn-ghost btn-sm" onClick={() => switchMode('register')}>
              {t('auth.noAccount')} {t('auth.register')} →
            </button>
          )}
          {mode !== 'login' && (
            <button className="btn btn-ghost btn-sm" onClick={() => switchMode('login')}>
              ← {t('auth.hasAccount')} {t('auth.login')}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
